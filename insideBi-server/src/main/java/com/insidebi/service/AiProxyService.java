package com.insidebi.service;

import com.insidebi.config.AppConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiProxyService {

    private final RestTemplate restTemplate;
    private final AppConfig appConfig;

    public ResponseEntity<Object> proxy(String path, HttpMethod method, Object body, HttpHeaders incomingHeaders) {
        String url = appConfig.aiBackendUrl + path;

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        // Forward admin password header if present
        String adminPw = incomingHeaders.getFirst("x-admin-password");
        if (adminPw != null) {
            headers.set("x-admin-password", adminPw);
        }

        HttpEntity<Object> entity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<Object> response = restTemplate.exchange(url, method, entity, Object.class);
            return ResponseEntity.status(response.getStatusCode()).body(response.getBody());
        } catch (HttpStatusCodeException e) {
            log.warn("AI backend error: {} {}", e.getStatusCode(), e.getResponseBodyAsString());
            try {
                Object responseBody = restTemplate.getMessageConverters().stream()
                        .filter(converter -> converter instanceof org.springframework.http.converter.json.MappingJackson2HttpMessageConverter)
                        .findFirst()
                        .map(converter -> {
                            try {
                                return new com.fasterxml.jackson.databind.ObjectMapper()
                                        .readValue(e.getResponseBodyAsString(), Object.class);
                            } catch (Exception parseError) {
                                return Map.of("error", e.getResponseBodyAsString());
                            }
                        })
                        .orElse(Map.of("error", e.getResponseBodyAsString()));
                return ResponseEntity.status(e.getStatusCode()).body(responseBody);
            } catch (Exception ignored) {
                return ResponseEntity.status(e.getStatusCode()).body(Map.of("error", e.getResponseBodyAsString()));
            }
        } catch (Exception e) {
            log.error("AI backend unreachable: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(Map.of("error", "AI backend unavailable"));
        }
    }
}
