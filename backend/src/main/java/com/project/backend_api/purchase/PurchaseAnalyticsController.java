package com.project.backend_api.purchase;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.List;

@RestController
@RequestMapping("/api/admin/purchase-analytics")
public class PurchaseAnalyticsController {

    private final PurchaseAnalyticsService purchaseAnalyticsService;

    public PurchaseAnalyticsController(PurchaseAnalyticsService purchaseAnalyticsService) {
        this.purchaseAnalyticsService = purchaseAnalyticsService;
    }

    @GetMapping
    public PurchaseAnalyticsResponse get(
            @RequestParam String from,
            @RequestParam String to,
            @RequestParam(defaultValue = "DAY") String grain,
            @RequestParam(defaultValue = "SALES_AMOUNT") String metric,
            @RequestParam(defaultValue = "5") int topN,
            @RequestParam(required = false) List<String> product,
            @RequestParam(required = false) List<String> category,
            @RequestParam(required = false) List<String> ageBand
    ) {
        try {
            return purchaseAnalyticsService.query(new PurchaseAnalyticsQuery(
                    LocalDate.parse(from),
                    LocalDate.parse(to),
                    grain,
                    metric,
                    topN,
                    product,
                    category,
                    ageBand
            ));
        } catch (IllegalArgumentException | DateTimeParseException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, exception.getMessage());
        }
    }
}
