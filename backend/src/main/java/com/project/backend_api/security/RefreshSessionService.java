package com.project.backend_api.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataAccessException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.Duration;
import java.util.List;
import java.util.UUID;

/**
 * One refresh session per account. Redis stores the current id, the previous
 * id, and its grace deadline. The account generation in the database is the
 * revocation fence. This service refuses to rotate a generation older than the
 * Redis fence, and the caller also compares the database generation before
 * issuing a token. The grace deadline is an absolute timestamp, so a replay
 * does not extend it. Within that window a repeated token and a stolen token
 * cannot be distinguished.
 */
@Service
public class RefreshSessionService {

    static final Duration SESSION_TTL = Duration.ofDays(14);
    static final Duration OVERLAP_TTL = Duration.ofSeconds(10);
    private static final String CURRENT_PREFIX = "refresh-session:";
    private static final String PREVIOUS_PREFIX = "refresh-session-previous:";
    private static final String FENCE_PREFIX = "refresh-session-epoch:";

    private static final String ISSUE_SCRIPT = """
            local fence = tonumber(redis.call('GET', KEYS[3]) or '-1')
            local epoch = tonumber(ARGV[2])
            if epoch < fence then
              return nil
            end
            redis.call('SET', KEYS[1], ARGV[1], 'EX', ARGV[3])
            redis.call('DEL', KEYS[2])
            redis.call('SET', KEYS[3], ARGV[2], 'EX', ARGV[3])
            return ARGV[1]
            """;

    private static final String ROTATE_SCRIPT = """
            local fence = redis.call('GET', KEYS[3])
            if fence and tonumber(fence) > tonumber(ARGV[5]) then
              return nil
            end
            local now = tonumber(ARGV[6])
            local overlap = tonumber(ARGV[4])
            local current = redis.call('GET', KEYS[1])
            if current == ARGV[1] then
              redis.call('SET', KEYS[2], ARGV[1] .. '|' .. (now + overlap), 'EX', ARGV[3])
              redis.call('SET', KEYS[1], ARGV[2], 'EX', ARGV[3])
              if not fence then
                redis.call('SET', KEYS[3], ARGV[5], 'EX', ARGV[3])
              end
              return ARGV[2]
            end
            local previous = redis.call('GET', KEYS[2])
            if current and previous then
              local separator = string.find(previous, '|', 1, true)
              if separator then
                local previousId = string.sub(previous, 1, separator - 1)
                local expiry = tonumber(string.sub(previous, separator + 1))
                if previousId == ARGV[1] and expiry and now <= expiry then
                  return current
                end
              end
            end
            return nil
            """;

    private static final String REVOKE_SCRIPT = """
            local fence = tonumber(redis.call('GET', KEYS[3]) or '-1')
            local epoch = tonumber(ARGV[1])
            if fence > epoch then
              return 0
            end
            redis.call('SET', KEYS[3], ARGV[1], 'EX', ARGV[2])
            redis.call('DEL', KEYS[1], KEYS[2])
            return 1
            """;

    private final StringRedisTemplate redisTemplate;
    private final Clock clock;
    private SessionRevokeFault revokeFault;
    private final DefaultRedisScript<String> issueScript;
    private final DefaultRedisScript<String> rotateScript;
    private final DefaultRedisScript<Long> revokeScript;

    @Autowired
    public RefreshSessionService(StringRedisTemplate redisTemplate) {
        this(redisTemplate, Clock.systemUTC());
    }

    public RefreshSessionService(StringRedisTemplate redisTemplate, Clock clock) {
        this.redisTemplate = redisTemplate;
        this.clock = clock;
        this.issueScript = script(ISSUE_SCRIPT, String.class);
        this.rotateScript = script(ROTATE_SCRIPT, String.class);
        this.revokeScript = script(REVOKE_SCRIPT, Long.class);
    }

    @Autowired(required = false)
    void setRevokeFault(SessionRevokeFault revokeFault) {
        this.revokeFault = revokeFault;
    }

    public String issue(String email, int sessionEpoch) {
        String sessionId = UUID.randomUUID().toString();
        String stored = execute(
                issueScript,
                email,
                "인증 세션을 저장하지 못했습니다.",
                sessionId,
                Integer.toString(sessionEpoch),
                Long.toString(SESSION_TTL.toSeconds())
        );
        if (stored == null || stored.isBlank()) {
            throw new IllegalArgumentException("폐기된 인증 세대에는 세션을 만들 수 없습니다.");
        }
        return stored;
    }

    public String rotate(String email, String presentedSessionId, int sessionEpoch) {
        String nextSessionId = UUID.randomUUID().toString();
        String active = execute(
                rotateScript,
                email,
                "인증 세션을 확인하지 못했습니다.",
                presentedSessionId,
                nextSessionId,
                Long.toString(SESSION_TTL.toSeconds()),
                Long.toString(OVERLAP_TTL.toMillis()),
                Integer.toString(sessionEpoch),
                Long.toString(clock.millis())
        );
        if (active == null || active.isBlank()) {
            throw new IllegalArgumentException("폐기되었거나 알 수 없는 Refresh Token입니다.");
        }
        return active;
    }

    public void revoke(String email, int sessionEpoch) {
        if (revokeFault != null) {
            revokeFault.beforeRevoke();
        }
        execute(
                revokeScript,
                email,
                "인증 세션을 폐기하지 못했습니다.",
                Integer.toString(sessionEpoch),
                Long.toString(SESSION_TTL.toSeconds())
        );
    }

    private <T> T execute(DefaultRedisScript<T> script, String email, String failure, String... args) {
        try {
            return redisTemplate.execute(script, keys(email), (Object[]) args);
        } catch (DataAccessException exception) {
            throw new IllegalStateException(failure, exception);
        }
    }

    private static List<String> keys(String email) {
        return List.of(CURRENT_PREFIX + email, PREVIOUS_PREFIX + email, FENCE_PREFIX + email);
    }

    private static <T> DefaultRedisScript<T> script(String text, Class<T> type) {
        DefaultRedisScript<T> script = new DefaultRedisScript<>();
        script.setScriptText(text);
        script.setResultType(type);
        return script;
    }
}
