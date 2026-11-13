package com.project.backend_api.order;

import com.project.backend_api.observability.OperationLog;
import com.project.backend_api.observability.OperationLog.Operation;
import org.slf4j.MDC;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/demo-orders")
public class DemoOrderController {

    private final DemoOrderService demoOrderService;

    public DemoOrderController(DemoOrderService demoOrderService) {
        this.demoOrderService = demoOrderService;
    }

    @PostMapping("/confirm")
    public ResponseEntity<DemoOrderService.DemoOrderResponse> confirm(
            Authentication authentication,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey
    ) {
        String requestId = currentRequestId();
        DemoOrderService.DemoOrderResponse body = OperationLog.observe(Operation.DEMO_ORDER_CONFIRM, scope -> {
            scope.stage("auth");
            String email = currentEmail(authentication);
            scope.stage("confirm");
            return demoOrderService.confirm(email, idempotencyKey, requestId);
        });
        return ResponseEntity.ok()
                .header("X-Request-Id", requestId)
                .body(body);
    }

    @GetMapping
    public ResponseEntity<List<DemoOrderService.DemoOrderResponse>> list(Authentication authentication) {
        String requestId = currentRequestId();
        List<DemoOrderService.DemoOrderResponse> body = OperationLog.observe(Operation.DEMO_ORDER_LIST, scope -> {
            scope.stage("auth");
            String email = currentEmail(authentication);
            scope.stage("list");
            return demoOrderService.listMine(email);
        });
        return ResponseEntity.ok()
                .header("X-Request-Id", requestId)
                .body(body);
    }

    @GetMapping("/{orderKey}")
    public ResponseEntity<DemoOrderService.DemoOrderResponse> get(
            Authentication authentication,
            @PathVariable String orderKey
    ) {
        String requestId = currentRequestId();
        return ResponseEntity.ok()
                .header("X-Request-Id", requestId)
                .body(demoOrderService.getMine(currentEmail(authentication), orderKey));
    }

    @PostMapping("/{orderKey}/cancel")
    @ResponseStatus(HttpStatus.OK)
    public ResponseEntity<DemoOrderService.DemoOrderResponse> cancel(
            Authentication authentication,
            @PathVariable String orderKey
    ) {
        String requestId = currentRequestId();
        DemoOrderService.DemoOrderResponse body = OperationLog.observe(Operation.DEMO_ORDER_CANCEL, scope -> {
            scope.stage("auth");
            String email = currentEmail(authentication);
            scope.stage("cancel");
            return demoOrderService.cancel(email, orderKey, requestId);
        });
        return ResponseEntity.ok()
                .header("X-Request-Id", requestId)
                .body(body);
    }

    private static String currentEmail(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new org.springframework.web.server.ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        }
        return authentication.getName();
    }

    private static String currentRequestId() {
        String requestId = MDC.get("requestId");
        return requestId == null || requestId.isBlank() ? "unknown" : requestId;
    }
}
