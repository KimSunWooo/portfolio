package com.project.backend_api.purchase;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.support.TransactionTemplate;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Period;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.List;
import java.util.Objects;
import java.util.Random;

/**
 * Explicit bulk DEMO purchase generator. Not started by the application.
 * Uses existing ROLE_USER rows and SALE products; never mutates users.order_count/total_spent.
 */
public class BulkDemoPurchaseSeeder {

    public static final String SOURCE = "DEMO";
    public static final String PROFILE_SOURCE = "SYNTHETIC_DEMO";
    public static final ZoneId SEOUL = ZoneId.of("Asia/Seoul");

    private final JdbcTemplate jdbc;
    private final TransactionTemplate transactions;

    public BulkDemoPurchaseSeeder(JdbcTemplate jdbc, TransactionTemplate transactions) {
        this.jdbc = jdbc;
        this.transactions = transactions;
    }

    public record Options(int count, long randomSeed, LocalDate asOf, String batchId, boolean dryRun) {
    }

    public record MemberRow(long id, LocalDateTime createdAt) {
    }

    public record ProductRow(int id, String name, String category, int price, LocalDateTime createdAt) {
    }

    public record SeedReport(
            String batchId,
            boolean dryRun,
            boolean alreadyComplete,
            int ordersRequested,
            int ordersInserted,
            int linesInserted,
            int membersAvailable,
            int productsAvailable,
            LocalDate earliestPurchaseDate,
            LocalDate latestPurchaseDate,
            String constraintNotes
    ) {
    }

    public SeedReport seed(Options options) {
        Objects.requireNonNull(options.batchId(), "batchId");
        if (options.count() < 1) {
            throw new IllegalArgumentException("count must be >= 1");
        }
        if (options.batchId().isBlank() || options.batchId().length() > 48) {
            throw new IllegalArgumentException("batchId must be 1..48 characters");
        }

        String paramsHash = hashParams(options);
        Integer existing = jdbc.queryForObject(
                "SELECT COUNT(*) FROM purchase_seed_batches WHERE batch_id = ?", Integer.class, options.batchId());
        if (existing != null && existing > 0) {
            String storedHash = jdbc.queryForObject(
                    "SELECT params_hash FROM purchase_seed_batches WHERE batch_id = ?", String.class, options.batchId());
            if (!paramsHash.equals(storedHash)) {
                throw new IllegalStateException(
                        "batch-id already exists with different parameters; refuse to mutate. batchId=" + options.batchId());
            }
            Integer orders = jdbc.queryForObject(
                    "SELECT COUNT(*) FROM purchase_orders WHERE seed_batch_id = ?", Integer.class, options.batchId());
            return new SeedReport(
                    options.batchId(), options.dryRun(), true, options.count(), 0, 0,
                    0, 0, null, null, "idempotent: batch already present, inserted=0");
        }

        List<MemberRow> members = loadMembers();
        List<ProductRow> products = loadProducts();
        if (members.isEmpty()) {
            throw new IllegalStateException("no ROLE_USER members available for DEMO purchases");
        }
        if (products.isEmpty()) {
            throw new IllegalStateException("no SALE products with price > 0 available for DEMO purchases");
        }

        LocalDateTime productFloor = products.stream()
                .map(ProductRow::createdAt)
                .filter(Objects::nonNull)
                .min(LocalDateTime::compareTo)
                .orElse(LocalDateTime.of(1970, 1, 1, 0, 0));
        LocalDateTime memberFloor = members.stream()
                .map(MemberRow::createdAt)
                .min(LocalDateTime::compareTo)
                .orElse(LocalDateTime.of(1970, 1, 1, 0, 0));
        LocalDateTime globalEarliest = productFloor.isAfter(memberFloor) ? productFloor : memberFloor;
        LocalDateTime asOfEnd = options.asOf().atTime(23, 59, 59);
        LocalDateTime nowSeoul = LocalDateTime.now(SEOUL);
        if (asOfEnd.isAfter(nowSeoul)) {
            asOfEnd = nowSeoul;
        }
        if (!globalEarliest.isBefore(asOfEnd)) {
            globalEarliest = asOfEnd.minusMinutes(Math.max(options.count(), 1));
            if (globalEarliest.isAfter(asOfEnd)) {
                globalEarliest = asOfEnd;
            }
        }

        String notes = buildConstraintNotes(members, products, globalEarliest, asOfEnd, options.asOf());
        ensureProfiles(members, options.asOf(), options.randomSeed());

        if (options.dryRun()) {
            return new SeedReport(
                    options.batchId(), true, false, options.count(), 0, 0,
                    members.size(), products.size(),
                    globalEarliest.toLocalDate(), asOfEnd.toLocalDate(), notes);
        }

        LocalDateTime windowEnd = asOfEnd;
        LocalDateTime windowStart = globalEarliest;
        return transactions.execute(status -> {
            Random random = new Random(options.randomSeed());
            int linesInserted = 0;
            LocalDate earliest = null;
            LocalDate latest = null;

            for (int seq = 1; seq <= options.count(); seq++) {
                MemberRow member = members.get(random.nextInt(members.size()));
                boolean unknownAge = random.nextInt(100) < 8;
                int lineCount = 1 + random.nextInt(Math.min(4, products.size()));
                List<ProductRow> picked = pickDistinctProducts(products, lineCount, random);

                LocalDateTime floor = member.createdAt();
                for (ProductRow product : picked) {
                    if (product.createdAt() != null && product.createdAt().isAfter(floor)) {
                        floor = product.createdAt();
                    }
                }
                if (floor.isAfter(windowEnd)) {
                    floor = windowEnd;
                }
                LocalDateTime rangeStart = floor.isAfter(windowStart) ? floor : windowStart;
                LocalDateTime purchasedAt = purchaseInstant(rangeStart, windowEnd, seq, options.count(), random);

                Integer ageAt = null;
                String ageBand = "미상";
                Long userId = member.id();
                if (unknownAge) {
                    userId = null;
                } else {
                    var profile = loadProfile(member.id());
                    if (profile.birth() != null) {
                        ageAt = Period.between(profile.birth(), purchasedAt.toLocalDate()).getYears();
                        ageBand = PurchaseAnalyticsService.ageBand(ageAt);
                    } else {
                        ageBand = profile.bandHint();
                    }
                }

                String orderKey = orderKey(options.batchId(), seq);
                jdbc.update("""
                        INSERT INTO purchase_orders
                            (order_key, user_id, purchased_at, age_at_purchase, age_band, record_source, seed_batch_id, created_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                        """,
                        orderKey, userId, purchasedAt, ageAt, ageBand, SOURCE, options.batchId(), LocalDateTime.now(SEOUL));

                for (ProductRow product : picked) {
                    int quantity = 1 + random.nextInt(3);
                    int unitPrice = product.price();
                    int maxDiscount = Math.min(unitPrice / 10, unitPrice * quantity / 5);
                    int discount = maxDiscount <= 0 ? 0 : random.nextInt(maxDiscount + 1);
                    int amount = unitPrice * quantity - discount;
                    String category = normalizeCategory(product.category());
                    jdbc.update("""
                            INSERT INTO purchase_lines
                                (order_key, product_id, product_name, category_name, unit_price, quantity, line_discount, line_amount, line_status)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PAID')
                            """,
                            orderKey, product.id(), product.name(), category, unitPrice, quantity, discount, amount);
                    linesInserted++;
                }

                LocalDate day = purchasedAt.toLocalDate();
                if (earliest == null || day.isBefore(earliest)) {
                    earliest = day;
                }
                if (latest == null || day.isAfter(latest)) {
                    latest = day;
                }
            }

            jdbc.update("""
                    INSERT INTO purchase_seed_batches
                        (batch_id, order_count, random_seed, as_of_date, params_hash, created_at)
                    VALUES (?, ?, ?, ?, ?, ?)
                    """,
                    options.batchId(), options.count(), options.randomSeed(), options.asOf(), paramsHash, LocalDateTime.now(SEOUL));

            return new SeedReport(
                    options.batchId(), false, false, options.count(), options.count(), linesInserted,
                    members.size(), products.size(), earliest, latest, notes);
        });
    }

    public int clearBatch(String batchId) {
        return transactions.execute(status -> {
            Integer lines = jdbc.queryForObject("""
                    SELECT COUNT(*) FROM purchase_lines l
                    JOIN purchase_orders o ON o.order_key = l.order_key
                    WHERE o.record_source = ? AND o.seed_batch_id = ?
                    """, Integer.class, SOURCE, batchId);
            jdbc.update("""
                    DELETE l FROM purchase_lines l
                    JOIN purchase_orders o ON o.order_key = l.order_key
                    WHERE o.record_source = ? AND o.seed_batch_id = ?
                    """, SOURCE, batchId);
            int orders = jdbc.update(
                    "DELETE FROM purchase_orders WHERE record_source = ? AND seed_batch_id = ?",
                    SOURCE, batchId);
            jdbc.update("DELETE FROM purchase_seed_batches WHERE batch_id = ?", batchId);
            return orders + (lines == null ? 0 : lines);
        });
    }

    private List<MemberRow> loadMembers() {
        return jdbc.query("""
                SELECT id, created_at FROM users
                WHERE role = 'ROLE_USER'
                ORDER BY id
                """, (rs, row) -> new MemberRow(
                rs.getLong("id"),
                rs.getTimestamp("created_at").toLocalDateTime()));
    }

    private List<ProductRow> loadProducts() {
        return jdbc.query("""
                SELECT id, name, category, price, created_at FROM products
                WHERE status = 'SALE' AND price > 0
                ORDER BY id
                """, (rs, row) -> new ProductRow(
                rs.getInt("id"),
                rs.getString("name"),
                rs.getString("category"),
                rs.getInt("price"),
                rs.getTimestamp("created_at") == null ? null : rs.getTimestamp("created_at").toLocalDateTime()));
    }

    private void ensureProfiles(List<MemberRow> members, LocalDate asOf, long randomSeed) {
        Random random = new Random(randomSeed ^ 0xA5A5_5A5AL);
        LocalDate[] births = {
                LocalDate.of(2008, 4, 12),
                LocalDate.of(1998, 6, 3),
                LocalDate.of(1992, 11, 21),
                LocalDate.of(1984, 2, 8),
                LocalDate.of(1972, 9, 30)
        };
        for (int i = 0; i < members.size(); i++) {
            MemberRow member = members.get(i);
            Integer exists = jdbc.queryForObject(
                    "SELECT COUNT(*) FROM purchase_demo_member_profiles WHERE user_id = ?", Integer.class, member.id());
            if (exists != null && exists > 0) {
                continue;
            }
            LocalDate birth = births[i % births.length];
            if (i >= births.length) {
                birth = births[random.nextInt(births.length)];
            }
            int age = Period.between(birth, asOf).getYears();
            String band = PurchaseAnalyticsService.ageBand(age);
            jdbc.update("""
                    INSERT INTO purchase_demo_member_profiles
                        (user_id, synthetic_birth_date, age_band_hint, source, created_at)
                    VALUES (?, ?, ?, ?, ?)
                    """, member.id(), birth, band, PROFILE_SOURCE, LocalDateTime.now(SEOUL));
        }
    }

    private record Profile(LocalDate birth, String bandHint) {
    }

    private Profile loadProfile(long userId) {
        return jdbc.query("""
                SELECT synthetic_birth_date, age_band_hint FROM purchase_demo_member_profiles WHERE user_id = ?
                """, rs -> {
            if (!rs.next()) {
                return new Profile(null, "미상");
            }
            return new Profile(
                    rs.getDate("synthetic_birth_date") == null ? null : rs.getDate("synthetic_birth_date").toLocalDate(),
                    rs.getString("age_band_hint"));
        }, userId);
    }

    private static List<ProductRow> pickDistinctProducts(List<ProductRow> products, int count, Random random) {
        List<ProductRow> pool = new ArrayList<>(products);
        List<ProductRow> picked = new ArrayList<>();
        int n = Math.min(count, pool.size());
        for (int i = 0; i < n; i++) {
            picked.add(pool.remove(random.nextInt(pool.size())));
        }
        return picked;
    }

    private static LocalDateTime purchaseInstant(
            LocalDateTime earliest,
            LocalDateTime latest,
            int seq,
            int total,
            Random random
    ) {
        long span = Math.max(1, ChronoUnit.SECONDS.between(earliest, latest));
        long offset = (span * (seq - 1L)) / Math.max(1, total);
        long jitter = random.nextInt((int) Math.min(Integer.MAX_VALUE, Math.max(1, span / Math.max(1, total))));
        LocalDateTime at = earliest.plusSeconds(Math.min(span, offset + jitter));
        return at.isAfter(latest) ? latest : at;
    }

    static String normalizeCategory(String category) {
        if (category == null || category.isBlank()) {
            return "미분류";
        }
        String trimmed = category.trim();
        return switch (trimmed) {
            case "립", "Lip", "lip" -> "LIP";
            case "팩트", "Fact", "fact" -> "팩트";
            case "아이", "Eye", "eye" -> "아이";
            case "스킨케어", "Skincare", "skincare" -> "스킨케어";
            default -> trimmed;
        };
    }

    static String orderKey(String batchId, int seq) {
        return "demo-batch-" + batchId + "-" + String.format("%04d", seq);
    }

    private static String hashParams(Options options) {
        String raw = options.count() + "|" + options.randomSeed() + "|" + options.asOf() + "|" + options.batchId();
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(raw.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (Exception ex) {
            throw new IllegalStateException(ex);
        }
    }

    private static String buildConstraintNotes(
            List<MemberRow> members,
            List<ProductRow> products,
            LocalDateTime earliest,
            LocalDateTime latest,
            LocalDate asOf
    ) {
        long days = ChronoUnit.DAYS.between(earliest.toLocalDate(), latest.toLocalDate()) + 1;
        StringBuilder notes = new StringBuilder();
        notes.append("members=").append(members.size())
                .append(", products=").append(products.size())
                .append(", validWindowDays=").append(days)
                .append(", asOf=").append(asOf);
        if (days < 180) {
            notes.append("; 180-day spread unavailable without changing user/product created_at");
        }
        if (products.size() < 2) {
            notes.append("; category/product diversity limited to existing SALE catalog");
        }
        if (members.size() < 6) {
            notes.append("; age-band variety limited by member count (synthetic profiles + some 미상)");
        }
        return notes.toString();
    }
}
