package com.project.backend_api.security;

import com.project.backend_api.domain.user.User;
import com.project.backend_api.domain.user.UserRole;
import com.project.backend_api.dto.user.LoginRequest;
import com.project.backend_api.dto.user.TokenResponse;
import com.project.backend_api.notification.PasswordChangeOutbox;
import com.project.backend_api.repository.UserRepository;
import com.project.backend_api.service.UserService;
import com.project.backend_api.service.UserService.LogoutStatus;
import com.project.backend_api.service.UserService.PasswordResetStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.mail.MailSender;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.TestPropertySource;
import org.springframework.transaction.PlatformTransactionManager;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.mysql.MySQLContainer;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@Testcontainers
@TestPropertySource(properties = {
        "jwt.secret=test-secret-test-secret-test-secret-test",
        "toss.secret-key=test",
        "cloud.aws.credentials.access-key=test",
        "cloud.aws.credentials.secret-key=test",
        "cloud.aws.s3.bucket=test",
        "cloud.aws.region.static=ap-northeast-2",
        "spring.mail.password=test",
        "spring.jpa.hibernate.ddl-auto=create",
        "spring.flyway.enabled=false"
})
class SessionLifecycleMySqlTest {

    @Container
    static final MySQLContainer MYSQL = new MySQLContainer("mysql:8.4");

    @Container
    static final GenericContainer<?> REDIS = new GenericContainer<>("redis:7-alpine").withExposedPorts(6379);

    @DynamicPropertySource
    static void isolatedServices(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", MYSQL::getJdbcUrl);
        registry.add("spring.datasource.username", MYSQL::getUsername);
        registry.add("spring.datasource.password", MYSQL::getPassword);
        registry.add("spring.data.redis.host", REDIS::getHost);
        registry.add("spring.data.redis.port", () -> REDIS.getMappedPort(6379));
    }

    @Autowired
    private UserRepository userRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private JwtTokenProvider jwtTokenProvider;
    @Autowired
    private RefreshSessionService refreshSessionService;
    @Autowired
    private StringRedisTemplate redisTemplate;
    @Autowired
    private PlatformTransactionManager transactionManager;
    @Autowired
    private UserService userService;

    @BeforeEach
    void clean() {
        userRepository.deleteAll();
    }

    @Test
    void logoutRejectsThePreviousRefreshWhileAccessTokenRemainsUntilExpiry() {
        TokenResponse login = login("logout@example.com");
        assertTrue(jwtTokenProvider.isAccessToken(login.getAccessToken()));

        assertEquals(LogoutStatus.REVOKED, userService.logout(login.getRefreshToken()));

        assertThrows(IllegalArgumentException.class, () -> userService.refreshAccessToken(login.getRefreshToken()));
        assertTrue(jwtTokenProvider.isAccessToken(login.getAccessToken()));
    }

    @Test
    void redisCleanupFailureStillRejectsRefreshAfterRestart() {
        TokenResponse login = login("cleanup@example.com");
        int epoch = jwtTokenProvider.getSessionEpoch(login.getRefreshToken());
        UserService failing = service(new FailingRevoke(redisTemplate));

        assertEquals(LogoutStatus.CLEANUP_INCOMPLETE, failing.logout(login.getRefreshToken()));
        assertEquals(epoch + 1, userRepository.findByEmail("cleanup@example.com").orElseThrow().getSessionEpoch());
        String stillAccepted = refreshSessionService.rotate(
                "cleanup@example.com",
                jwtTokenProvider.getSessionId(login.getRefreshToken()),
                epoch
        );
        assertTrue(stillAccepted != null && !stillAccepted.isBlank());

        UserService restarted = service(refreshSessionService);
        assertThrows(IllegalArgumentException.class, () -> restarted.refreshAccessToken(login.getRefreshToken()));
    }

    @Test
    void passwordChangeCommitsBeforeRedisCleanupAndRollbackKeepsTheSession() {
        TokenResponse login = login("reset@example.com");
        int epoch = jwtTokenProvider.getSessionEpoch(login.getRefreshToken());
        redisTemplate.opsForValue().set("AUTH_CODE:reset@example.com", "123456");
        UserService failing = service(new FailingRevoke(redisTemplate));

        assertEquals(
                PasswordResetStatus.CLEANUP_INCOMPLETE,
                failing.resetPassword("reset@example.com", "123456", "next-password")
        );
        assertTrue(passwordEncoder.matches(
                "next-password",
                userRepository.findByEmail("reset@example.com").orElseThrow().getPassword()
        ));
        assertTrue(userRepository.findByEmail("reset@example.com").orElseThrow().getSessionEpoch() > epoch);
        assertThrows(IllegalArgumentException.class, () -> userService.refreshAccessToken(login.getRefreshToken()));

        TokenResponse kept = login("kept@example.com");
        int keptEpoch = userRepository.findByEmail("kept@example.com").orElseThrow().getSessionEpoch();
        assertThrows(IllegalArgumentException.class, () -> userService.resetPassword("kept@example.com", "missing", "another"));
        assertEquals(keptEpoch, userRepository.findByEmail("kept@example.com").orElseThrow().getSessionEpoch());
        String stillCurrent = refreshSessionService.rotate(
                "kept@example.com",
                jwtTokenProvider.getSessionId(kept.getRefreshToken()),
                keptEpoch
        );
        assertTrue(stillCurrent != null && !stillCurrent.isBlank());
    }

    @Test
    void failedLoginDoesNotAdvanceTheSessionEpoch() {
        saveUser("login@example.com");
        UserService failing = service(new FailingIssue(redisTemplate));
        assertThrows(IllegalStateException.class, () -> failing.login(new LoginRequest("login@example.com", "secret")));
        assertEquals(0, userRepository.findByEmail("login@example.com").orElseThrow().getSessionEpoch());
    }

    @Test
    void refreshLosesToLogout() throws Exception {
        TokenResponse login = login("race@example.com");
        ExecutorService pool = Executors.newFixedThreadPool(2);
        try {
            Future<TokenResponse> refreshed = pool.submit(() -> userService.refreshAccessToken(login.getRefreshToken()));
            Future<LogoutStatus> loggedOut = pool.submit(() -> userService.logout(login.getRefreshToken()));
            loggedOut.get();
            TokenResponse successor = null;
            try {
                successor = refreshed.get();
            } catch (Exception ignored) {
                successor = null;
            }
            assertThrows(IllegalArgumentException.class, () -> userService.refreshAccessToken(login.getRefreshToken()));
            if (successor != null) {
                TokenResponse stale = successor;
                assertThrows(IllegalArgumentException.class, () -> userService.refreshAccessToken(stale.getRefreshToken()));
            }
        } finally {
            pool.shutdownNow();
        }
    }

    private TokenResponse login(String email) {
        saveUser(email);
        return userService.login(new LoginRequest(email, "secret"));
    }

    private void saveUser(String email) {
        userRepository.save(User.builder()
                .email(email)
                .password(passwordEncoder.encode("secret"))
                .name("Member")
                .role(UserRole.ROLE_USER)
                .build());
    }

    private UserService service(RefreshSessionService sessions) {
        return new UserService(
                userRepository,
                passwordEncoder,
                jwtTokenProvider,
                sessions,
                new NoopMail(),
                redisTemplate,
                transactionManager,
                noOutbox()
        );
    }

    private static org.springframework.beans.factory.ObjectProvider<PasswordChangeOutbox> noOutbox() {
        return new org.springframework.beans.factory.ObjectProvider<>() {
            @Override
            public PasswordChangeOutbox getObject() {
                return null;
            }
        };
    }

    private static class FailingRevoke extends RefreshSessionService {
        private FailingRevoke(StringRedisTemplate redisTemplate) {
            super(redisTemplate);
        }

        @Override
        public void revoke(String email, int sessionEpoch) {
            throw new IllegalStateException("redis down");
        }
    }

    private static class FailingIssue extends RefreshSessionService {
        private FailingIssue(StringRedisTemplate redisTemplate) {
            super(redisTemplate);
        }

        @Override
        public String issue(String email, int sessionEpoch) {
            throw new IllegalStateException("redis down");
        }
    }

    private static class NoopMail implements MailSender {
        @Override
        public void send(SimpleMailMessage simpleMessage) {
        }

        @Override
        public void send(SimpleMailMessage... simpleMessages) {
        }
    }
}
