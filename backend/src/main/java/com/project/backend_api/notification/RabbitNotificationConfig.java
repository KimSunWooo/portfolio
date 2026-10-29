package com.project.backend_api.notification;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.backend_api.messaging.MessagingJsonConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.DirectExchange;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.QueueBuilder;
import org.springframework.amqp.rabbit.connection.CachingConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitAdmin;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.rabbit.listener.SimpleMessageListenerContainer;
import org.springframework.amqp.rabbit.listener.api.ChannelAwareMessageListener;
import org.springframework.amqp.support.converter.SimpleMessageConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mail.MailSender;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.util.concurrent.atomic.AtomicBoolean;

@Configuration
@EnableScheduling
@ConditionalOnProperty(name = "app.notification.password-changed.enabled", havingValue = "true")
public class RabbitNotificationConfig {

    private static final Logger log = LoggerFactory.getLogger(RabbitNotificationConfig.class);

    @Bean
    CachingConnectionFactory passwordChangeConnectionFactory(
            @Value("${app.rabbitmq.host}") String host,
            @Value("${app.rabbitmq.port}") int port,
            @Value("${app.rabbitmq.username}") String username,
            @Value("${app.rabbitmq.password}") String password
    ) {
        CachingConnectionFactory factory = new CachingConnectionFactory(host, port);
        factory.setUsername(username);
        factory.setPassword(password);
        factory.getRabbitConnectionFactory().setConnectionTimeout(2_000);
        factory.getRabbitConnectionFactory().setHandshakeTimeout(2_000);
        factory.setPublisherConfirmType(CachingConnectionFactory.ConfirmType.CORRELATED);
        factory.setPublisherReturns(true);
        return factory;
    }

    @Bean
    RabbitTemplate passwordChangeRabbitTemplate(CachingConnectionFactory passwordChangeConnectionFactory) {
        RabbitTemplate template = new RabbitTemplate(passwordChangeConnectionFactory);
        template.setMandatory(true);
        template.setMessageConverter(new SimpleMessageConverter());
        return template;
    }

    @Bean
    Topology passwordChangeTopology(
            CachingConnectionFactory passwordChangeConnectionFactory,
            @Value("${app.notification.password-changed.exchange}") String exchange,
            @Value("${app.notification.password-changed.queue}") String queue,
            @Value("${app.notification.password-changed.dead-letter-queue}") String deadLetterQueue,
            @Value("${app.notification.password-changed.routing-key}") String routingKey
    ) {
        return new Topology(passwordChangeConnectionFactory, exchange, queue, deadLetterQueue, routingKey);
    }

    @Bean
    PasswordChangeOutbox passwordChangeOutbox(JdbcTemplate jdbc) {
        return new PasswordChangeOutbox(jdbc);
    }

    @Bean
    PasswordChangePublisher passwordChangePublisher(
            JdbcTemplate jdbc,
            RabbitTemplate passwordChangeRabbitTemplate,
            Topology passwordChangeTopology,
            @Value("${app.notification.password-changed.exchange}") String exchange,
            @Value("${app.notification.password-changed.routing-key}") String routingKey
    ) {
        return new PasswordChangePublisher(jdbc, passwordChangeRabbitTemplate, passwordChangeTopology, exchange, routingKey);
    }

    @Bean
    PasswordChangeMailConsumer passwordChangeMailConsumer(
            JdbcTemplate jdbc,
            MailSender mailSender,
            RabbitTemplate passwordChangeRabbitTemplate,
            @Qualifier(MessagingJsonConfig.MESSAGING_OBJECT_MAPPER) ObjectMapper messagingObjectMapper,
            @Value("${app.notification.password-changed.exchange}") String exchange,
            @Value("${app.notification.password-changed.routing-key}") String routingKey
    ) {
        return new PasswordChangeMailConsumer(
                jdbc, mailSender, passwordChangeRabbitTemplate, messagingObjectMapper, exchange, routingKey);
    }

    @Bean
    SimpleMessageListenerContainer passwordChangeListener(
            CachingConnectionFactory passwordChangeConnectionFactory,
            Topology passwordChangeTopology,
            PasswordChangeMailConsumer passwordChangeMailConsumer,
            @Value("${app.notification.password-changed.queue}") String queue
    ) {
        SimpleMessageListenerContainer container = new SimpleMessageListenerContainer(passwordChangeConnectionFactory);
        container.setQueueNames(queue);
        container.setAcknowledgeMode(org.springframework.amqp.core.AcknowledgeMode.MANUAL);
        container.setPrefetchCount(1);
        container.setMissingQueuesFatal(false);
        container.setAutoStartup(false);
        container.setMessageListener((ChannelAwareMessageListener) (message, channel) -> {
            if (!passwordChangeTopology.ensureDeclared()) {
                channel.basicNack(message.getMessageProperties().getDeliveryTag(), false, true);
                return;
            }
            try {
                passwordChangeMailConsumer.handle(message);
                channel.basicAck(message.getMessageProperties().getDeliveryTag(), false);
            } catch (PasswordChangeMailConsumer.PermanentDeliveryException exception) {
                channel.basicNack(message.getMessageProperties().getDeliveryTag(), false, false);
            } catch (Exception exception) {
                channel.basicNack(message.getMessageProperties().getDeliveryTag(), false, true);
            }
        });
        passwordChangeTopology.onDeclared(container::start);
        return container;
    }

    public static final class Topology {
        private final CachingConnectionFactory connectionFactory;
        private final String exchange;
        private final String queueName;
        private final String deadLetterQueue;
        private final String routingKey;
        private final AtomicBoolean declared = new AtomicBoolean();
        private volatile Runnable onDeclared = () -> {
        };

        Topology(
                CachingConnectionFactory connectionFactory,
                String exchange,
                String queueName,
                String deadLetterQueue,
                String routingKey
        ) {
            this.connectionFactory = connectionFactory;
            this.exchange = exchange;
            this.queueName = queueName;
            this.deadLetterQueue = deadLetterQueue;
            this.routingKey = routingKey;
        }

        void onDeclared(Runnable callback) {
            this.onDeclared = callback;
            if (declared.get()) {
                callback.run();
            }
        }

        boolean ensureDeclared() {
            if (declared.get()) {
                return true;
            }
            try {
                RabbitAdmin admin = new RabbitAdmin(connectionFactory);
                String deadLetterExchange = exchange + ".dlx";
                DirectExchange work = new DirectExchange(exchange, true, false);
                DirectExchange dead = new DirectExchange(deadLetterExchange, true, false);
                Queue queue = QueueBuilder.durable(queueName)
                        .deadLetterExchange(deadLetterExchange)
                        .deadLetterRoutingKey(routingKey)
                        .build();
                Queue failed = QueueBuilder.durable(deadLetterQueue).build();
                admin.declareExchange(work);
                admin.declareExchange(dead);
                admin.declareQueue(queue);
                admin.declareQueue(failed);
                admin.declareBinding(BindingBuilder.bind(queue).to(work).with(routingKey));
                admin.declareBinding(BindingBuilder.bind(failed).to(dead).with(routingKey));
                declared.set(true);
                onDeclared.run();
                return true;
            } catch (RuntimeException exception) {
                log.warn("RabbitMQ topology is not available yet");
                return false;
            }
        }
    }
}
