# purchase analytics benchmark

- date: 2026-11-13T14:49:32.253194992
- image: mysql:8.4 (Testcontainers, fresh container per size, default mysqld settings)
- java: 21.0.13.0.3, cpus=16, maxHeapMB=1024
- warmup=3 runs=30 (nearest-rank percentiles over runs, ms)
- candidateIndexes=false

## 1000 orders

- seeded: orders=1000 lines=2479 seedMs=2175
- mix: LIVE orders=314, CANCELLED lines=145, REFUNDED lines=80, age 미상 orders=76, purchased_at 2025-09-01T09:55:13 .. 2026-10-29T22:05

| scenario | lines in range | before p50 | before p95 | after p50 | after p95 | p50 speedup |
|---|---:|---:|---:|---:|---:|---:|
| S1 365d DAY ALL no-filter | 2153 | 29.5 | 57.2 | 65.4 | 86.4 | 0.5x |
| S2 365d MONTH DEMO qty top10 | 2153 | 23.4 | 26.3 | 57.5 | 63.4 | 0.4x |
| S3 90d WEEK cat=LIP age=20s/30s | 545 | 12.0 | 14.7 | 19.5 | 24.1 | 0.6x |
| S4 30d DAY 2 products | 173 | 7.9 | 9.1 | 12.8 | 15.9 | 0.6x |

### EXPLAIN ANALYZE (S1 shape)

```
-> Aggregate: count(distinct o.order_key), sum(l.quantity), sum(l.line_amount)  (cost=361 rows=1) (actual time=8.72..8.72 rows=1 loops=1)
    -> Nested loop inner join  (cost=339 rows=214) (actual time=1.1..4.99 rows=1958 loops=1)
        -> Filter: (l.line_status = 'PAID')  (cost=253 rows=248) (actual time=0.0308..0.767 rows=2254 loops=1)
            -> Table scan on l  (cost=253 rows=2479) (actual time=0.0297..0.535 rows=2479 loops=1)
        -> Filter: ((o.purchased_at >= TIMESTAMP'2025-10-30 00:00:00') and (o.purchased_at < TIMESTAMP'2026-10-30 00:00:00'))  (cost=0.25 rows=0.862) (actual time=0.00152..0.00159 rows=0.869 loops=2254)
            -> Single-row index lookup on o using PRIMARY (order_key=l.order_key)  (cost=0.25 rows=1) (actual time=0.00125..0.00127 rows=1 loops=2254)

```
## 10000 orders

- seeded: orders=10000 lines=24824 seedMs=9465
- mix: LIVE orders=3018, CANCELLED lines=1460, REFUNDED lines=806, age 미상 orders=796, purchased_at 2025-09-01T09:14:44 .. 2026-10-29T23:09:49

| scenario | lines in range | before p50 | before p95 | after p50 | after p95 | p50 speedup |
|---|---:|---:|---:|---:|---:|---:|
| S1 365d DAY ALL no-filter | 21387 | 211.5 | 246.1 | 604.9 | 624.0 | 0.3x |
| S2 365d MONTH DEMO qty top10 | 21387 | 175.2 | 199.1 | 547.6 | 574.4 | 0.3x |
| S3 90d WEEK cat=LIP age=20s/30s | 5234 | 52.7 | 60.0 | 90.9 | 97.9 | 0.6x |
| S4 30d DAY 2 products | 1784 | 22.2 | 29.5 | 44.5 | 51.4 | 0.5x |

### EXPLAIN ANALYZE (S1 shape)

```
-> Aggregate: count(distinct o.order_key), sum(l.quantity), sum(l.line_amount)  (cost=3516 rows=1) (actual time=101..101 rows=1 loops=1)
    -> Nested loop inner join  (cost=3393 rows=1236) (actual time=6.82..48.1 rows=19435 loops=1)
        -> Filter: (l.line_status = 'PAID')  (cost=2528 rows=2472) (actual time=0.034..7.49 rows=22558 loops=1)
            -> Table scan on l  (cost=2528 rows=24716) (actual time=0.0328..5.23 rows=24824 loops=1)
        -> Filter: ((o.purchased_at >= TIMESTAMP'2025-10-30 00:00:00') and (o.purchased_at < TIMESTAMP'2026-10-30 00:00:00'))  (cost=0.25 rows=0.5) (actual time=0.0016..0.00167 rows=0.862 loops=22558)
            -> Single-row index lookup on o using PRIMARY (order_key=l.order_key)  (cost=0.25 rows=1) (actual time=0.00144..0.00147 rows=1 loops=22558)

```
