package com.project.backend_api.purchase;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public record PurchaseAnalyticsResponse(
        String source,
        boolean available,
        String message,
        String sourceLabel,
        String timezone,
        String rangeStartInclusive,
        String rangeEndExclusive,
        String grain,
        String metric,
        String aggregatedAt,
        String aggregatedAtMeaning,
        Map<String, Object> filters,
        Map<String, String> definitions,
        Summary summary,
        List<PurchaseAnalyticsService.NamedMetric> trend,
        List<PurchaseAnalyticsService.NamedMetric> products,
        Omission productsOmitted,
        List<PurchaseAnalyticsService.NamedMetric> categories,
        boolean categoryOrderCountsMayOverlap,
        List<PurchaseAnalyticsService.NamedMetric> ages,
        String ageShareDenominator,
        List<PurchaseAnalyticsService.NamedMetric> rows,
        List<PurchaseAnalyticsService.CrossCell> cross
) {
    public record Summary(
            long orderCount,
            long quantity,
            long salesAmount,
            long cancelledQuantity,
            long cancelledAmount,
            long refundedQuantity,
            long refundedAmount
    ) {
    }

    public record Omission(int productCount, long salesAmount, long quantity) {
    }

    static PurchaseAnalyticsResponse unavailable(
            String source,
            String message,
            PurchaseAnalyticsQuery query,
            LocalDateTime aggregatedAt
    ) {
        return new PurchaseAnalyticsResponse(
                source,
                false,
                message,
                null,
                "Asia/Seoul",
                query.from().toString(),
                query.to().plusDays(1).toString(),
                query.grain(),
                query.metric(),
                aggregatedAt.toString(),
                "조회를 계산한 시각이며 마지막 구매 시각이 아닙니다.",
                filters(query),
                metricDefinitions(),
                null,
                List.of(),
                List.of(),
                null,
                List.of(),
                true,
                List.of(),
                "구매 주문 수. 미상 포함",
                List.of(),
                List.of()
        );
    }

    static PurchaseAnalyticsResponse of(
            String source,
            PurchaseAnalyticsQuery query,
            LocalDateTime aggregatedAt,
            PurchaseAnalyticsService.Aggregate aggregate
    ) {
        return new PurchaseAnalyticsResponse(
                source,
                true,
                null,
                "MOCK 데이터 / 시연용 구매 통계",
                "Asia/Seoul",
                query.from().toString(),
                query.to().plusDays(1).toString(),
                query.grain(),
                query.metric(),
                aggregatedAt.toString(),
                "조회를 계산한 시각이며 마지막 구매 시각이 아닙니다.",
                filters(query),
                metricDefinitions(),
                new Summary(
                        aggregate.orderCount(),
                        aggregate.quantity(),
                        aggregate.salesAmount(),
                        aggregate.cancelledQuantity(),
                        aggregate.cancelledAmount(),
                        aggregate.refundedQuantity(),
                        aggregate.refundedAmount()
                ),
                aggregate.trend(),
                aggregate.shownProducts(),
                new Omission(aggregate.omittedProductCount(), aggregate.omittedSalesAmount(), aggregate.omittedQuantity()),
                aggregate.categories(),
                true,
                aggregate.ages(),
                "선택 조건의 구매 주문 수입니다. 미상을 분모에 포함합니다.",
                aggregate.rows(),
                aggregate.cross()
        );
    }

    private static Map<String, Object> filters(PurchaseAnalyticsQuery query) {
        return Map.of(
                "from", query.from().toString(),
                "to", query.to().toString(),
                "products", query.products(),
                "categories", query.categories(),
                "ageBands", query.ageBands(),
                "grain", query.grain(),
                "metric", query.metric(),
                "topN", query.topN()
        );
    }

    private static Map<String, String> metricDefinitions() {
        return Map.of(
                "orderCount", "조건에 맞는 결제 완료 줄이 하나 이상인 고유 주문 수. 주문상품 줄 수가 아닙니다.",
                "quantity", "결제 완료 줄의 수량 합.",
                "salesAmount", "구매 당시 단가 x 수량 - 줄 할인. 주문 전체 할인, 배송비, 부분 환불은 나누지 않습니다.",
                "cancelledAmount", "취소 줄의 구매 당시 금액. 부분 취소 배분은 지원하지 않습니다.",
                "refundedAmount", "환불 줄의 구매 당시 금액. 결제 수납액과 다릅니다.",
                "categoryOrderCount", "분류별 주문 수는 한 주문이 여러 분류에 있으면 각각 집계되어 전체 주문 수보다 클 수 있습니다."
        );
    }

    public LocalDate rangeStart() {
        return LocalDate.parse(rangeStartInclusive);
    }
}
