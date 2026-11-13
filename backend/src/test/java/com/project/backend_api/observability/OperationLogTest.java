package com.project.backend_api.observability;

import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import com.project.backend_api.observability.OperationLog.Operation;
import com.project.backend_api.observability.OperationLog.Status;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class OperationLogTest {

    private final ListAppender<ILoggingEvent> appender = new ListAppender<>();
    private Logger logger;

    @BeforeEach
    void attach() {
        logger = (Logger) LoggerFactory.getLogger("operation");
        appender.start();
        logger.addAppender(appender);
        MDC.put("requestId", "req-test-1");
    }

    @AfterEach
    void detach() {
        logger.detachAppender(appender);
        MDC.remove("requestId");
    }

    @Test
    void successLogsOperationStatusDurationAndRequestIdOnly() {
        long before = OperationLog.count(Operation.DEMO_ORDER_CONFIRM, Status.SUCCESS);

        String result = OperationLog.observe(Operation.DEMO_ORDER_CONFIRM, scope -> "ok");

        assertEquals("ok", result);
        assertEquals(before + 1, OperationLog.count(Operation.DEMO_ORDER_CONFIRM, Status.SUCCESS));
        String line = single();
        assertTrue(line.contains("operation=demo_order.confirm"));
        assertTrue(line.contains("status=SUCCESS"));
        assertTrue(line.contains("durationMs="));
        assertTrue(line.contains("requestId=req-test-1"));
        assertFalse(line.contains("stage="));
    }

    @Test
    void clientErrorReportsStageAndHttpStatusWithoutTheMessage() {
        long before = OperationLog.count(Operation.DEMO_ORDER_CANCEL, Status.CLIENT_ERROR);

        assertThrows(ResponseStatusException.class, () -> OperationLog.observe(Operation.DEMO_ORDER_CANCEL, scope -> {
            scope.stage("auth");
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "buyer@example.test secret-order-key");
        }));

        assertEquals(before + 1, OperationLog.count(Operation.DEMO_ORDER_CANCEL, Status.CLIENT_ERROR));
        String line = single();
        assertTrue(line.contains("status=CLIENT_ERROR"));
        assertTrue(line.contains("stage=auth"));
        assertTrue(line.contains("httpStatus=403"));
        assertTrue(line.contains("errorType=ResponseStatusException"));
        assertFalse(line.contains("buyer@example.test"));
        assertFalse(line.contains("secret-order-key"));
    }

    @Test
    void unexpectedExceptionIsAFailureAtTheLastStage() {
        long before = OperationLog.count(Operation.PURCHASE_ANALYTICS_QUERY, Status.FAILURE);

        assertThrows(IllegalStateException.class, () -> OperationLog.observe(Operation.PURCHASE_ANALYTICS_QUERY, scope -> {
            scope.stage("parse");
            scope.stage("query");
            throw new IllegalStateException("jdbc:mysql://user:password@host");
        }));

        assertEquals(before + 1, OperationLog.count(Operation.PURCHASE_ANALYTICS_QUERY, Status.FAILURE));
        String line = single();
        assertTrue(line.contains("status=FAILURE"));
        assertTrue(line.contains("stage=query"));
        assertFalse(line.contains("password"));
    }

    @Test
    void metricSeriesAreBoundedByTheEnums() {
        int series = Operation.values().length * Status.values().length;
        assertTrue(series <= 16, "series count must stay a small constant, not grow with ids or users");
        assertTrue(Arrays.stream(Operation.values()).allMatch(operation -> operation.label().matches("[a-z_.]+")));
    }

    private String single() {
        List<ILoggingEvent> events = appender.list;
        assertEquals(1, events.size());
        return events.getFirst().getFormattedMessage();
    }
}
