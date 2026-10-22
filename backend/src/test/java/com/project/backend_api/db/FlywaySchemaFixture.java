package com.project.backend_api.db;

import com.project.backend_api.domain.cart.Cart;
import com.project.backend_api.domain.cart.CartItem;
import com.project.backend_api.domain.cart.CartSyncRequest;
import com.project.backend_api.domain.community.CommunityPost;
import com.project.backend_api.domain.payment.PaymentHistory;
import com.project.backend_api.domain.product.Product;
import com.project.backend_api.domain.product.ProductColor;
import com.project.backend_api.domain.product.ProductDetail;
import com.project.backend_api.domain.product.ProductImage;
import com.project.backend_api.domain.project.Project;
import com.project.backend_api.domain.project.ProjectMedia;
import com.project.backend_api.domain.resume.Education;
import com.project.backend_api.domain.resume.Experience;
import com.project.backend_api.domain.resume.Introduction;
import com.project.backend_api.domain.resume.Profile;
import com.project.backend_api.domain.resume.Skill;
import com.project.backend_api.domain.user.User;
import org.hibernate.SessionFactory;
import org.hibernate.boot.MetadataSources;
import org.hibernate.boot.registry.StandardServiceRegistry;
import org.hibernate.boot.registry.StandardServiceRegistryBuilder;
import org.hibernate.cfg.AvailableSettings;
import org.hibernate.dialect.MySQLDialect;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;

final class FlywaySchemaFixture {

    static final Class<?>[] CURRENT_ENTITIES = {
            Product.class,
            ProductImage.class,
            ProductDetail.class,
            ProductColor.class,
            User.class,
            Cart.class,
            CartItem.class,
            CartSyncRequest.class,
            Project.class,
            ProjectMedia.class,
            CommunityPost.class,
            Education.class,
            Experience.class,
            Skill.class,
            Profile.class,
            Introduction.class,
            PaymentHistory.class
    };

    private FlywaySchemaFixture() {
    }

    static Class<?>[] entitiesWithoutCartSync() {
        List<Class<?>> entities = new ArrayList<>();
        for (Class<?> entity : CURRENT_ENTITIES) {
            if (entity != CartSyncRequest.class) {
                entities.add(entity);
            }
        }
        return entities.toArray(Class<?>[]::new);
    }

    static Connection connect(String url, String user, String password) throws Exception {
        return DriverManager.getConnection(url, user, password);
    }

    static void execute(Connection connection, String sql) throws Exception {
        try (Statement statement = connection.createStatement()) {
            statement.execute(sql);
        }
    }

    static boolean tableExists(Connection connection, String table) throws Exception {
        try (ResultSet tables = connection.getMetaData().getTables(connection.getCatalog(), null, table, null)) {
            return tables.next();
        }
    }

    static List<String> columnSnapshot(Connection connection, String table) throws Exception {
        List<String> columns = new ArrayList<>();
        try (ResultSet rows = connection.createStatement().executeQuery("""
                SELECT column_name, column_type, is_nullable, IFNULL(column_default, ''), IFNULL(extra, '')
                FROM information_schema.columns
                WHERE table_schema = DATABASE() AND table_name = '%s'
                ORDER BY ordinal_position
                """.formatted(table))) {
            while (rows.next()) {
                columns.add(rows.getString(1) + "|" + rows.getString(2) + "|" + rows.getString(3)
                        + "|" + rows.getString(4) + "|" + rows.getString(5));
            }
        }
        return columns;
    }

    static SessionFactory sessionFactory(String url, String user, String password, String action, Class<?>[] entities) {
        StandardServiceRegistry registry = new StandardServiceRegistryBuilder()
                .applySetting(AvailableSettings.JAKARTA_JDBC_URL, url)
                .applySetting(AvailableSettings.JAKARTA_JDBC_USER, user)
                .applySetting(AvailableSettings.JAKARTA_JDBC_PASSWORD, password)
                .applySetting(AvailableSettings.DIALECT, MySQLDialect.class.getName())
                .applySetting(AvailableSettings.PHYSICAL_NAMING_STRATEGY,
                        "org.hibernate.boot.model.naming.PhysicalNamingStrategySnakeCaseImpl")
                .applySetting(AvailableSettings.IMPLICIT_NAMING_STRATEGY,
                        "org.springframework.boot.hibernate.SpringImplicitNamingStrategy")
                .applySetting(AvailableSettings.HBM2DDL_AUTO, action)
                .build();
        MetadataSources sources = new MetadataSources(registry);
        for (Class<?> entity : entities) {
            sources.addAnnotatedClass(entity);
        }
        try {
            return sources.buildMetadata().buildSessionFactory();
        } catch (RuntimeException ex) {
            StandardServiceRegistryBuilder.destroy(registry);
            throw ex;
        }
    }
}
