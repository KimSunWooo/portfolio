package com.project.backend_api.security;

import org.junit.jupiter.api.Test;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

@Testcontainers
class RefreshSessionRedisTest {

    @Container
    static final GenericContainer<?> REDIS = new GenericContainer<>("redis:7-alpine").withExposedPorts(6379);

    @Test
    void overlappingRefreshResolvesToOneSessionAndRevokeBlocksGrace() throws Exception {
        MutableClock clock = new MutableClock(Instant.EPOCH);
        RefreshSessionService first = service(clock);
        RefreshSessionService second = service(clock);
        String issued = first.issue("overlap@example.com", 1);

        ExecutorService pool = Executors.newFixedThreadPool(2);
        try {
            Future<String> left = pool.submit(() -> first.rotate("overlap@example.com", issued, 1));
            Future<String> right = pool.submit(() -> second.rotate("overlap@example.com", issued, 1));
            assertEquals(left.get(), right.get());
            clock.plusMillis(5_000);
            assertEquals(left.get(), first.rotate("overlap@example.com", issued, 1));
            clock.plusMillis(5_001);
            assertThrows(IllegalArgumentException.class, () -> second.rotate("overlap@example.com", issued, 1));
            second.revoke("overlap@example.com", 2);
            clock.set(Instant.EPOCH.plusMillis(1_000));
            assertThrows(IllegalArgumentException.class, () -> first.rotate("overlap@example.com", left.get(), 1));
        } finally {
            pool.shutdownNow();
        }
    }

    @Test
    void replayDoesNotExtendGraceAndOlderGenerationIsRejected() {
        MutableClock clock = new MutableClock(Instant.EPOCH);
        RefreshSessionService sessions = service(clock);
        String issued = sessions.issue("member@example.com", 4);
        String next = sessions.rotate("member@example.com", issued, 4);
        clock.plusMillis(10_000);
        assertEquals(next, sessions.rotate("member@example.com", issued, 4));
        clock.plusMillis(1);
        assertThrows(IllegalArgumentException.class, () -> sessions.rotate("member@example.com", issued, 4));

        clock.set(Instant.EPOCH);
        String first = sessions.issue("other@example.com", 1);
        String second = sessions.rotate("other@example.com", first, 1);
        String third = sessions.rotate("other@example.com", second, 1);
        assertThrows(IllegalArgumentException.class, () -> sessions.rotate("other@example.com", first, 1));
        assertEquals(third, sessions.rotate("other@example.com", second, 1));
    }

    @Test
    void revokeAndRotateLeaveNoUsableSession() throws Exception {
        MutableClock clock = new MutableClock(Instant.EPOCH);
        RefreshSessionService rotate = service(clock);
        RefreshSessionService revoke = service(clock);
        String issued = rotate.issue("race@example.com", 1);
        ExecutorService pool = Executors.newFixedThreadPool(2);
        try {
            Future<String> rotated = pool.submit(() -> rotate.rotate("race@example.com", issued, 1));
            Future<?> revoked = pool.submit(() -> revoke.revoke("race@example.com", 2));
            revoked.get();
            String successor = null;
            try {
                successor = rotated.get();
            } catch (Exception ignored) {
                successor = null;
            }
            assertThrows(IllegalArgumentException.class, () -> rotate.rotate("race@example.com", issued, 1));
            if (successor != null) {
                String stale = successor;
                assertThrows(IllegalArgumentException.class, () -> revoke.rotate("race@example.com", stale, 1));
            }
        } finally {
            pool.shutdownNow();
        }
    }

    @Test
    void redisFailureDoesNotReportRevokeAsStored() {
        LettuceConnectionFactory factory = new LettuceConnectionFactory("127.0.0.1", 1);
        factory.setTimeout(200);
        factory.afterPropertiesSet();
        RefreshSessionService sessions = new RefreshSessionService(new StringRedisTemplate(factory), Clock.systemUTC());
        assertThrows(IllegalStateException.class, () -> sessions.revoke("member@example.com", 2));
        factory.destroy();
    }

    private static RefreshSessionService service(MutableClock clock) {
        LettuceConnectionFactory factory = new LettuceConnectionFactory(REDIS.getHost(), REDIS.getMappedPort(6379));
        factory.afterPropertiesSet();
        StringRedisTemplate template = new StringRedisTemplate(factory);
        template.afterPropertiesSet();
        return new RefreshSessionService(template, clock);
    }

    private static final class MutableClock extends Clock {
        private Instant instant;

        private MutableClock(Instant instant) {
            this.instant = instant;
        }

        private void set(Instant instant) {
            this.instant = instant;
        }

        private void plusMillis(long millis) {
            instant = instant.plusMillis(millis);
        }

        @Override
        public ZoneId getZone() {
            return ZoneId.of("UTC");
        }

        @Override
        public Clock withZone(ZoneId zone) {
            return this;
        }

        @Override
        public Instant instant() {
            return instant;
        }
    }
}
