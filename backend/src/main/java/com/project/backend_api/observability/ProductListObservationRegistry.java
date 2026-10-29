package com.project.backend_api.observability;

/**
 * Lets the Hibernate inspector, which is constructed by name, see the Spring bean.
 * The reference stays null unless observation is enabled.
 */
final class ProductListObservationRegistry {

    private static volatile ProductListObservation current;

    private ProductListObservationRegistry() {
    }

    static void bind(ProductListObservation observation) {
        current = observation;
    }

    static void clear() {
        current = null;
    }

    static ProductListObservation get() {
        return current;
    }
}
