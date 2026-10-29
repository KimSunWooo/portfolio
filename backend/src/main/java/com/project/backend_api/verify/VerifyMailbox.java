package com.project.backend_api.verify;

import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;
import org.springframework.mail.MailSender;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.stereotype.Component;

import java.util.concurrent.ConcurrentHashMap;

@Component
@Primary
@Profile("verify")
public class VerifyMailbox implements MailSender {

    private final ConcurrentHashMap<String, String> latestText = new ConcurrentHashMap<>();

    @Override
    public void send(SimpleMailMessage simpleMessage) {
        store(simpleMessage);
    }

    @Override
    public void send(SimpleMailMessage... simpleMessages) {
        for (SimpleMailMessage message : simpleMessages) {
            store(message);
        }
    }

    private void store(SimpleMailMessage simpleMessage) {
        String[] recipients = simpleMessage.getTo();
        if (recipients == null) {
            return;
        }
        String text = simpleMessage.getText() == null ? "" : simpleMessage.getText();
        for (String recipient : recipients) {
            latestText.put(recipient, text);
        }
    }

    public String latest(String email) {
        return latestText.get(email);
    }
}
