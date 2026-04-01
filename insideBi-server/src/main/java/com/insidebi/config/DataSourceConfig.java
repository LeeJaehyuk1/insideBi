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
        // 1. URL 결정 (PRIVATE 우선, 없으면 PUBLIC)
        String rawUrl = databasePrivateUrl;
        if (rawUrl == null || rawUrl.isEmpty()) {
            rawUrl = databaseUrl;
        }
        if (rawUrl == null || rawUrl.isEmpty()) {
            rawUrl = "postgresql://postgres:postgres@localhost:5432/insidebi";
            System.out.println("[DataSourceConfig] No DB URL env var found, using localhost fallback");
        }

        System.out.println("[DataSourceConfig] Raw URL prefix: " + rawUrl.substring(0, Math.min(30, rawUrl.length())) + "...");

        // 2. postgres:// 또는 postgresql:// → URI 파싱으로 컴포넌트 추출
        try {
            // URI 파싱을 위해 scheme 정규화
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

            // 3. JDBC URL 생성
            String jdbcUrl;
            if (isInternal) {
                // Railway 내부 네트워크: SSL 불필요
                jdbcUrl = String.format("jdbc:postgresql://%s:%d/%s", host, port, dbName);
                System.out.println("[DataSourceConfig] Railway internal URL detected, no SSL");
            } else {
                // 외부 접속: SSL 필요
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
