package com.project.backend_api.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Map;

@Configuration
public class TossPaymentGatewayConfig {

    @Bean
    public PaymentGateway paymentGateway(@Value("${toss.secret-key}") String tossSecretKey) {
        return new TossPaymentGateway(new RestTemplate(), tossSecretKey);
    }

    static final class TossPaymentGateway implements PaymentGateway {
        private final RestTemplate restTemplate;
        private final String secretKey;

        TossPaymentGateway(RestTemplate restTemplate, String secretKey) {
            this.restTemplate = restTemplate;
            this.secretKey = secretKey;
        }

        @Override
        public PaymentApproval approve(String paymentKey, String orderId, long amount) {
            Map<String, Object> body = Map.of(
                    "paymentKey", paymentKey,
                    "orderId", orderId,
                    "amount", amount
            );
            Map<String, Object> response = exchange(
                    HttpMethod.POST,
                    "https://api.tosspayments.com/v1/payments/confirm",
                    body
            );
            return new PaymentApproval(
                    stringValue(response.get("paymentKey")),
                    stringValue(response.get("orderId")),
                    longValue(response.get("totalAmount"))
            );
        }

        @Override
        public void cancel(String paymentKey, String reason) {
            exchange(
                    HttpMethod.POST,
                    "https://api.tosspayments.com/v1/payments/" + paymentKey + "/cancel",
                    Map.of("cancelReason", reason)
            );
        }

        @Override
        public ProviderPayment lookup(String paymentKey) {
            try {
                Map<String, Object> response = exchange(
                        HttpMethod.GET,
                        "https://api.tosspayments.com/v1/payments/" + paymentKey,
                        null
                );
                return new ProviderPayment(
                        mapStatus(stringValue(response.get("status"))),
                        stringValue(response.get("paymentKey")),
                        stringValue(response.get("orderId")),
                        longValue(response.get("totalAmount"))
                );
            } catch (PaymentGatewayException exception) {
                String message = exception.getMessage() == null ? "" : exception.getMessage();
                if (message.contains("404") || message.toLowerCase().contains("not found")) {
                    return ProviderPayment.notFound(paymentKey);
                }
                throw exception;
            }
        }

        private Map<String, Object> exchange(HttpMethod method, String url, Map<String, Object> body) {
            HttpHeaders headers = new HttpHeaders();
            headers.setBasicAuth(Base64.getEncoder().encodeToString(
                    (secretKey + ":").getBytes(StandardCharsets.UTF_8)
            ));
            headers.setContentType(MediaType.APPLICATION_JSON);
            try {
                Map<String, Object> response = restTemplate.exchange(
                        url,
                        method,
                        new HttpEntity<>(body, headers),
                        new ParameterizedTypeReference<Map<String, Object>>() {}
                ).getBody();
                if (response == null) {
                    throw new PaymentGatewayException("결제사 응답이 비어 있습니다.");
                }
                return response;
            } catch (PaymentGatewayException exception) {
                throw exception;
            } catch (RestClientException exception) {
                throw new PaymentGatewayException("결제사 요청에 실패했습니다.", exception);
            }
        }

        private static ProviderStatus mapStatus(String status) {
            if (status == null || status.isBlank()) {
                return ProviderStatus.UNKNOWN;
            }
            return switch (status.toUpperCase()) {
                case "READY" -> ProviderStatus.READY;
                case "IN_PROGRESS", "WAITING_FOR_DEPOSIT" -> ProviderStatus.IN_PROGRESS;
                case "DONE" -> ProviderStatus.DONE;
                case "CANCELED", "PARTIAL_CANCELED" -> ProviderStatus.CANCELED;
                case "ABORTED", "EXPIRED" -> ProviderStatus.ABORTED;
                default -> ProviderStatus.UNKNOWN;
            };
        }

        private String stringValue(Object value) {
            return value == null ? "" : value.toString();
        }

        private long longValue(Object value) {
            if (value instanceof Number number) {
                return number.longValue();
            }
            if (value == null) {
                return -1L;
            }
            return Long.parseLong(value.toString());
        }
    }
}
