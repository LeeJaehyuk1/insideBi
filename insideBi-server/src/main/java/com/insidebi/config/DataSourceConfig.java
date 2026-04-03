package com.insidebi.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;
import java.net.URI;
import java.net.URISyntaxException;

@Configuration
public class DataSourceConfig {

    @Value("${DATABASE_URL:}")
    private String databaseUrl;

    @Value("${DATABASE_PRIVATE_URL:}")
    private String databasePrivateUrl;

    @Bean
    public DataSource dataSource() {
        String rawUrl = databasePrivateUrl;
        if (rawUrl == null || rawUrl.isEmpty()) {
            rawUrl = databaseUrl;
        }
        if (rawUrl == null || rawUrl.isEmpty()) {
            rawUrl = "postgresql://postgres:postgres@localhost:5432/insidebi";
            System.out.println("[DataSourceConfig] No DB URL env var found, using localhost fallback");
        }

        System.out.println("[DataSourceConfig] Raw URL prefix: " + rawUrl.substring(0, Math.min(30, rawUrl.length())) + "...");

        try {
            String normalizedUrl = rawUrl;
            if (normalizedUrl.startsWith("postgres://")) {
                normalizedUrl = "postgresql://" + normalizedUrl.substring("postgres://".length());
            }

            URI uri = new URI(normalizedUrl);
            String host = uri.getHost();
            int port = uri.getPort() > 0 ? uri.getPort() : 5432;
            String dbName = uri.getPath().replaceFirst("/", "");
            String userInfo = uri.getUserInfo();
            String username = "";
            String password = "";
            if (userInfo != null && userInfo.contains(":")) {
                username = userInfo.split(":", 2)[0];
                password = userInfo.split(":", 2)[1];
            } else if (userInfo != null) {
                username = userInfo;
            }

            boolean isInternal = host != null && host.contains(".railway.internal");
            boolean isLocal = "localhost".equalsIgnoreCase(host) || "127.0.0.1".equals(host);

            String jdbcUrl;
            if (isInternal || isLocal) {
                jdbcUrl = String.format("jdbc:postgresql://%s:%d/%s", host, port, dbName);
                System.out.println(isLocal
                        ? "[DataSourceConfig] Local URL detected, SSL disabled"
                        : "[DataSourceConfig] Railway internal URL detected, no SSL");
            } else {
                jdbcUrl = String.format("jdbc:postgresql://%s:%d/%s?sslmode=require", host, port, dbName);
                System.out.println("[DataSourceConfig] External URL detected, SSL enabled");
            }

            System.out.println("[DataSourceConfig] Connecting to host=" + host + " port=" + port + " db=" + dbName + " user=" + username);

            HikariConfig config = new HikariConfig();
            config.setJdbcUrl(jdbcUrl);
            config.setUsername(username);
            config.setPassword(password);
            config.setDriverClassName("org.postgresql.Driver");
            config.setMaximumPoolSize(10);
            config.setMinimumIdle(2);
            config.setConnectionTimeout(30000);
            config.setInitializationFailTimeout(60000);

            return new HikariDataSource(config);
        } catch (URISyntaxException e) {
            System.err.println("[DataSourceConfig] Failed to parse DB URL: " + e.getMessage());
            throw new RuntimeException("Invalid DATABASE_URL format: " + e.getMessage(), e);
        }
    }
}
