package com.project.backend_api.purchase;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record PurchaseAnalyticsQuery(
        LocalDate from,
        LocalDate to,
        String grain,
        String metric,
        int topN,
        List<String> products,
        List<String> categories,
        List<String> ageBands
) {
    public PurchaseAnalyticsQuery {
        products = products == null ? List.of() : List.copyOf(products);
        categories = categories == null ? List.of() : List.copyOf(categories);
        ageBands = ageBands == null ? List.of() : List.copyOf(ageBands);
    }
}
