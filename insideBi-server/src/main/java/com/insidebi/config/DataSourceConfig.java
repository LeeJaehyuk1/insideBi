package com.insidebi.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;

@Configuration
public class DataSourceConfig {

    @Value("${DATABASE_URL:}")
    private String databaseUrl;

    @Value("${DATABASE_PRIVATE_URL:}")
    private String databasePrivateUrl;

    @Value("${spring.profiles.active:}")
    private String activeProfile;

    @Bean
    public DataSource dataSource() {
        String urlToUse = databasePrivateUrl;
        if (urlToUse == null || urlToUse.isEmpty()) {
            urlToUse = databaseUrl;
        }

        if (urlToUse == null || urlToUse.isEmpty()) {
            boolean isDevProfile = activeProfile.contains("dev");
            if (isDevProfile) {
                // Fallback for local development
                urlToUse = "jdbc:postgresql://localhost:5432/insidebi";
                System.out.println("[DataSourceConfig] No DATABASE_URL set, using localhost fallback (dev mode)");
            } else {
                throw new IllegalStateException(
                    "[DataSourceConfig] FATAL: Neither DATABASE_PRIVATE_URL nor DATABASE_URL environment variable is set. " +
                    "Please configure the database URL in Railway environment variables."
                );
            }
        }

        String jdbcUrl = urlToUse;
        if (jdbcUrl.startsWith("postgres://")) {
            jdbcUrl = "jdbc:postgresql://" + jdbcUrl.substring("postgres://".length());
        } else if (jdbcUrl.startsWith("postgresql://")) {
            jdbcUrl = "jdbc:postgresql://" + jdbcUrl.substring("postgresql://".length());
        }

        // Mask password for logging
        String maskedUrl = jdbcUrl.replaceFirst(":([^@/]+)@", ":****@");
        System.out.println("[DataSourceConfig] Using JDBC URL: " + maskedUrl);

        // For Railway/External DBs, sslmode=require is often needed if not present
        if (!jdbcUrl.contains("localhost") && !jdbcUrl.contains("sslmode=")) {
            if (jdbcUrl.contains("?")) {
                jdbcUrl += "&sslmode=require";
            } else {
                jdbcUrl += "?sslmode=require";
            }
            System.out.println("[DataSourceConfig] Appended sslmode=require to URL");
        }

        HikariConfig config = new HikariConfig();
        config.setJdbcUrl(jdbcUrl);
        config.setDriverClassName("org.postgresql.Driver");
        config.setMaximumPoolSize(10);
        config.setMinimumIdle(2);
        config.setConnectionTimeout(30000);
        
        try {
            return new HikariDataSource(config);
        } catch (Exception e) {
            System.err.println("[DataSourceConfig] Failed to create DataSource: " + e.getMessage());
            throw e;
        }
    }
}
