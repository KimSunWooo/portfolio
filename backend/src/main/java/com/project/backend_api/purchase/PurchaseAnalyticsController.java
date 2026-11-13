package com.project.backend_api.purchase;

import com.project.backend_api.observability.OperationLog;
import com.project.backend_api.observability.OperationLog.Operation;
import com.project.backend_api.security.SecurityRoles;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/purchase-analytics")
public class PurchaseAnalyticsController {

    private final PurchaseAnalyticsService purchaseAnalyticsService;
    private final PurchaseAnalyticsQueryParser queryParser;

    public PurchaseAnalyticsController(
            PurchaseAnalyticsService purchaseAnalyticsService,
            PurchaseAnalyticsQueryParser queryParser
    ) {
        this.purchaseAnalyticsService = purchaseAnalyticsService;
        this.queryParser = queryParser;
    }

    @GetMapping
    public PurchaseAnalyticsResponse get(
            @RequestParam String from,
            @RequestParam String to,
            @RequestParam(defaultValue = "DAY") String grain,
            @RequestParam(defaultValue = "SALES_AMOUNT") String metric,
            @RequestParam(defaultValue = "5") int topN,
            @RequestParam(defaultValue = "ALL") String recordSource,
            @RequestParam(required = false) List<String> product,
            @RequestParam(required = false) List<String> category,
            @RequestParam(required = false) List<String> ageBand
    ) {
        return OperationLog.observe(Operation.PURCHASE_ANALYTICS_QUERY, scope -> {
            try {
                scope.stage("parse");
                String effectiveSource = SecurityRoles.isDemo() ? "DEMO" : recordSource;
                PurchaseAnalyticsQuery query = new PurchaseAnalyticsQuery(
                        LocalDate.parse(from),
                        LocalDate.parse(to),
                        grain,
                        metric,
                        topN,
                        product,
                        category,
                        ageBand,
                        effectiveSource
                );
                scope.stage("query");
                return purchaseAnalyticsService.query(query);
            } catch (IllegalArgumentException | DateTimeParseException exception) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, exception.getMessage());
            }
        });
    }

    @GetMapping("/filters")
    public PurchaseAnalyticsService.FilterOptions filters() {
        return purchaseAnalyticsService.filterOptions(SecurityRoles.isDemo());
    }

    @PostMapping("/parse-query")
    public Map<String, Object> parseQuery(@RequestBody Map<String, String> body) {
        PurchaseAnalyticsQueryParser.ParseResult parsed =
                queryParser.parse(body == null ? null : body.get("text"), SecurityRoles.isDemo());
        return Map.of(
                "ok", parsed.ok(),
                "message", parsed.message() == null ? "" : parsed.message(),
                "filters", parsed.filters()
        );
    }
}
