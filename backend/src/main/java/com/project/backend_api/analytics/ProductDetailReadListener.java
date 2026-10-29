package com.project.backend_api.analytics;

import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.kafka.support.Acknowledgment;

/**
 * The database transaction inside the store finishes before this method
 * acknowledges the record. A crash after the commit and before acknowledge
 * redelivers the record. The event id then suppresses a second count.
 */
public class ProductDetailReadListener {

    private final ProductDetailReadStore store;

    public ProductDetailReadListener(ProductDetailReadStore store) {
        this.store = store;
    }

    public void onRecord(ConsumerRecord<String, String> record, Acknowledgment acknowledgment) throws Exception {
        store.apply(record.value());
        acknowledgment.acknowledge();
    }
}
