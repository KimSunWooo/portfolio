package com.project.backend_api.observability;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.web.server.ResponseStatusException;

import java.util.EnumMap;
import java.util.Map;
import java.util.concurrent.atomic.LongAdder;
import java.util.function.Function;

/**
 * One structured log line plus one in-process counter per observed operation.
 *
 * <p>Log fields: {@code operation}, {@code status}, {@code durationMs}, {@code requestId},
 * {@code stage} (only on failure), {@code errorType}, {@code httpStatus}. Nothing else is logged:
 * no email, token, idempotency key, order key, payment key, or exception message.
 *
 * <p>Counters are keyed by {@link Operation} x {@link Status}. Both are closed enums, so the
 * number of series cannot grow with traffic, users, or order ids. {@code requestId} stays in
 * the log line only and is never a counter label.
 */
public final class OperationLog {

    private static final Logger log = LoggerFactory.getLogger("operation");
    private static final Map<Operation, Map<Status, LongAdder>> COUNTERS = new EnumMap<>(Operation.class);
    private static final Map<Operation, LongAdder> DURATION_MS = new EnumMap<>(Operation.class);

    static {
        for (Operation operation : Operation.values()) {
            Map<Status, LongAdder> byStatus = new EnumMap<>(Status.class);
            for (Status status : Status.values()) {
                byStatus.put(status, new LongAdder());
            }
            COUNTERS.put(operation, byStatus);
            DURATION_MS.put(operation, new LongAdder());
        }
    }

    /** Closed set. Add a value here instead of passing a free-form string. */
    public enum Operation {
        DEMO_ORDER_CONFIRM("demo_order.confirm"),
        DEMO_ORDER_CANCEL("demo_order.cancel"),
        DEMO_ORDER_LIST("demo_order.list"),
        PURCHASE_ANALYTICS_QUERY("purchase_analytics.query"),
        PAYMENT_CONFIRM("payment.confirm");

        private final String label;

        Operation(String label) {
            this.label = label;
        }

        public String label() {
            return label;
        }
    }

    public enum Status {
        SUCCESS,
        /** 4xx the caller can fix: validation, ownership, conflict. */
        CLIENT_ERROR,
        /** 5xx or an unexpected exception. */
        FAILURE
    }

    /** Lets the body name the step it is in, so a failure reports where it stopped. */
    public static final class Scope {
        private volatile String stage = "start";

        public void stage(String name) {
            this.stage = name;
        }
    }

    private OperationLog() {
    }

    public static <T> T observe(Operation operation, Function<Scope, T> body) {
        long started = System.nanoTime();
        Scope scope = new Scope();
        try {
            T result = body.apply(scope);
            record(operation, Status.SUCCESS, started, null, null);
            return result;
        } catch (RuntimeException exception) {
            Status status = classify(exception);
            record(operation, status, started, scope.stage, exception);
            throw exception;
        }
    }

    public static long count(Operation operation, Status status) {
        return COUNTERS.get(operation).get(status).sum();
    }

    public static long totalDurationMs(Operation operation) {
        return DURATION_MS.get(operation).sum();
    }

    private static Status classify(RuntimeException exception) {
        if (exception instanceof ResponseStatusException responseStatus
                && responseStatus.getStatusCode().is4xxClientError()) {
            return Status.CLIENT_ERROR;
        }
        if (exception instanceof IllegalArgumentException) {
            return Status.CLIENT_ERROR;
        }
        return Status.FAILURE;
    }

    private static void record(
            Operation operation,
            Status status,
            long startedNanos,
            String stage,
            RuntimeException exception
    ) {
        long durationMs = (System.nanoTime() - startedNanos) / 1_000_000L;
        COUNTERS.get(operation).get(status).increment();
        DURATION_MS.get(operation).add(durationMs);
        String requestId = MDC.get("requestId");
        String id = requestId == null || requestId.isBlank() ? "none" : requestId;
        if (status == Status.SUCCESS) {
            log.info("operation={} status={} durationMs={} requestId={}",
                    operation.label(), status, durationMs, id);
            return;
        }
        String httpStatus = exception instanceof ResponseStatusException responseStatus
                ? String.valueOf(responseStatus.getStatusCode().value())
                : "n/a";
        String line = "operation={} status={} durationMs={} requestId={} stage={} errorType={} httpStatus={}";
        if (status == Status.CLIENT_ERROR) {
            log.warn(line, operation.label(), status, durationMs, id, stage,
                    exception.getClass().getSimpleName(), httpStatus);
        } else {
            log.error(line, operation.label(), status, durationMs, id, stage,
                    exception.getClass().getSimpleName(), httpStatus);
        }
    }
}
