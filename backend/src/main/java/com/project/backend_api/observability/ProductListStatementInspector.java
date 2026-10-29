package com.project.backend_api.observability;

import org.hibernate.resource.jdbc.spi.StatementInspector;

/**
 * Registered only while product-list observation is enabled. Returns the SQL
 * unchanged and does not log it.
 */
public class ProductListStatementInspector implements StatementInspector {

    @Override
    public String inspect(String sql) {
        ProductListObservation observation = ProductListObservationRegistry.get();
        if (observation != null) {
            observation.recordSql(sql);
        }
        return sql;
    }
}
