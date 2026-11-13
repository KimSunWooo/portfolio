# purchase analytics benchmark

- date: 2026-11-13T14:57:04.355481316
- image: mysql:8.4 (Testcontainers, fresh container per size, default mysqld settings)
- java: 21.0.13.0.3, cpus=16, maxHeapMB=1024
- warmup=3 runs=30 (nearest-rank percentiles over runs, ms)
- candidateIndexes=false

## 1000 orders

- seeded: orders=1000 lines=2479 seedMs=2355
- mix: LIVE orders=314, CANCELLED lines=145, REFUNDED lines=80, age 미상 orders=76, purchased_at 2025-09-01T09:55:13 .. 2026-10-29T22:05

| scenario | lines in range | before p50 | before p95 | after p50 | after p95 | p50 speedup |
|---|---:|---:|---:|---:|---:|---:|
| S1 365d DAY ALL no-filter | 2153 | 30.1 | 49.9 | 28.1 | 32.1 | 1.1x |
| S2 365d MONTH DEMO qty top10 | 2153 | 22.5 | 28.9 | 20.3 | 22.5 | 1.1x |
| S3 90d WEEK cat=LIP age=20s/30s | 545 | 12.5 | 15.3 | 11.4 | 15.1 | 1.1x |
| S4 30d DAY 2 products | 173 | 8.0 | 10.0 | 8.9 | 10.3 | 0.9x |

## 10000 orders

- seeded: orders=10000 lines=24824 seedMs=9371
- mix: LIVE orders=3018, CANCELLED lines=1460, REFUNDED lines=806, age 미상 orders=796, purchased_at 2025-09-01T09:14:44 .. 2026-10-29T23:09:49

| scenario | lines in range | before p50 | before p95 | after p50 | after p95 | p50 speedup |
|---|---:|---:|---:|---:|---:|---:|
| S1 365d DAY ALL no-filter | 21387 | 216.1 | 231.7 | 184.2 | 200.8 | 1.2x |
| S2 365d MONTH DEMO qty top10 | 21387 | 176.5 | 187.9 | 152.4 | 161.3 | 1.2x |
| S3 90d WEEK cat=LIP age=20s/30s | 5234 | 52.4 | 64.9 | 22.1 | 23.7 | 2.4x |
| S4 30d DAY 2 products | 1784 | 21.7 | 25.9 | 15.2 | 17.7 | 1.4x |

