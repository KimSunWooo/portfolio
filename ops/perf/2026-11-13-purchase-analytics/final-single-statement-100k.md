# purchase analytics benchmark

- date: 2026-11-13T15:42:31.735127272
- image: mysql:8.4 (Testcontainers, fresh container per size, default mysqld settings)
- java: 21.0.13.0.3, cpus=16, maxHeapMB=1024
- warmup=3 runs=20 (nearest-rank percentiles over runs, ms)
- candidateIndexes=false

## 100000 orders

- seeded: orders=100000 lines=249274 seedMs=84850
- mix: LIVE orders=29862, CANCELLED lines=14663, REFUNDED lines=8090, age 미상 orders=8145, purchased_at 2025-09-01T09:02:32 .. 2026-10-29T23:54:08

| scenario | lines in range | before p50 | before p95 | after p50 | after p95 | p50 speedup |
|---|---:|---:|---:|---:|---:|---:|
| S1 365d DAY ALL no-filter | 214868 | 2145.9 | 2350.0 | 2297.9 | 2350.9 | 0.9x |
| S2 365d MONTH DEMO qty top10 | 214868 | 1602.4 | 1633.9 | 1863.5 | 1983.9 | 0.9x |
| S3 90d WEEK cat=LIP age=20s/30s | 52730 | 396.0 | 481.5 | 105.0 | 114.7 | 3.8x |
| S4 30d DAY 2 products | 17494 | 159.9 | 185.5 | 85.2 | 101.7 | 1.9x |

### EXPLAIN ANALYZE (S1 shape)

```
-> Aggregate: count(distinct o.order_key), sum(l.quantity), sum(l.line_amount)  (cost=35113 rows=1) (actual time=1237..1237 rows=1 loops=1)
    -> Nested loop inner join  (cost=33875 rows=12383) (actual time=82..565 rows=195255 loops=1)
        -> Filter: (l.line_status = 'PAID')  (cost=25207 rows=24765) (actual time=0.0671..72.9 rows=226521 loops=1)
            -> Table scan on l  (cost=25207 rows=247652) (actual time=0.0631..50.9 rows=249274 loops=1)
        -> Filter: ((o.purchased_at >= TIMESTAMP'2025-10-30 00:00:00') and (o.purchased_at < TIMESTAMP'2026-10-30 00:00:00'))  (cost=0.25 rows=0.5) (actual time=0.00197..0.00204 rows=0.862 loops=226521)
            -> Single-row index lookup on o using PRIMARY (order_key=l.order_key)  (cost=0.25 rows=1) (actual time=0.00181..0.00184 rows=1 loops=226521)

```
