# Blockchain Performance Tables (Before vs After Optimization)

Run date: 2026-03-10  
Command used: `npm run test:claim-performance`

## 1) Current Performance Table

| Test Case | Result | Identified Bottleneck |
|---|---:|---|
| `recordClaim` for 1 household hash | 49,739 gas | New storage slot write (`claimed[householdHash] = true`) + event emission + fixed tx overhead |
| `recordClaim` for 5 household hashes (5 separate tx calls) | 248,695 gas total (49,739 gas/claim) | Same expensive write/event path repeated 5 times; transaction overhead paid every call |
| `recordClaim` for 10 household hashes (10 separate tx calls) | 497,366 gas total (49,737 gas/claim) | Linear scaling from repeated write/event work and per-transaction overhead |

## 2) Performance Comparison Table

Before: repeated single calls to `recordClaim`  
After: batched calls via `recordClaimsBatch`

| Test Case | Before | After | Improvement |
|---|---:|---:|---|
| 1 claim ingestion | 49,739 gas/claim | 50,319 gas/claim | Slower by 580 gas (1.17%) |
| 5-claim ingestion | 49,739 gas/claim | 30,399 gas/claim | Faster by 19,340 gas (38.88%) |
| 10-claim ingestion | 49,739 gas/claim | 27,915 gas/claim | Faster by 21,824 gas (43.88%) |

### Notes

- Batch is not beneficial for a single claim because array/loop setup adds overhead.
- Batch becomes beneficial for multi-claim workloads by amortizing fixed transaction overhead across many claims.
