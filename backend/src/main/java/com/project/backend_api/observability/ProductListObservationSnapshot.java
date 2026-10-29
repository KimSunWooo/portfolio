package com.project.backend_api.observability;

/**
 * Monotonic totals. Compare two snapshots to get a window. The numbers are not
 * a MySQL digest delta.
 */
public record ProductListObservationSnapshot(
        long httpListRequests,
        long serviceEntries,
        long productListSelects,
        long otherProductTableStatements
) {
}
