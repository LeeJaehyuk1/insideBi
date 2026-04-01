package com.insidebi.controller;

import com.insidebi.service.AiProxyService;
import com.insidebi.service.RateLimiterService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class AiProxyController {

    private final AiProxyService aiProxyService;
    private final RateLimiterService rateLimiter;

    /** POST /api/ask  (rate-limited) */
    @PostMapping("/ask")
    public ResponseEntity<?> ask(
            @RequestBody(required = false) Object body,
            @RequestHeader HttpHeaders headers,
            HttpServletRequest req) {

        String ip = getClientIp(req);
        if (!rateLimiter.isAllowed(ip)) {
            return ResponseEntity.status(429)
                    .header("Retry-After", String.valueOf(rateLimiter.getWindowSeconds()))
                    .header("X-RateLimit-Limit", String.valueOf(rateLimiter.getMaxRequests()))
                    .body(Map.of("error", "Too many requests"));
        }
        return aiProxyService.proxy("/api/ask", HttpMethod.POST, body, headers);
    }

    /** GET /api/briefing */
    @GetMapping("/briefing")
    public ResponseEntity<?> getBriefing(@RequestHeader HttpHeaders headers) {
        ResponseEntity<Object> resp = aiProxyService.proxy("/api/briefing", HttpMethod.GET, null, headers);
        if (!resp.getStatusCode().is2xxSuccessful()) {
            return ResponseEntity.ok(Map.of("items", java.util.List.of()));
        }
        return resp;
    }

    /** POST /api/narrative */
    @PostMapping("/narrative")
    public ResponseEntity<?> postNarrative(
            @RequestBody(required = false) Object body,
            @RequestHeader HttpHeaders headers) {
        ResponseEntity<Object> resp = aiProxyService.proxy("/api/narrative", HttpMethod.POST, body, headers);
        if (!resp.getStatusCode().is2xxSuccessful()) {
            return ResponseEntity.ok(Map.of("narrative", ""));
        }
        return resp;
    }

    /** GET /api/chat-history */
    @GetMapping("/chat-history")
    public ResponseEntity<?> getChatHistory(@RequestHeader HttpHeaders headers) {
        ResponseEntity<Object> resp = aiProxyService.proxy("/api/chat-history", HttpMethod.GET, null, headers);
        if (!resp.getStatusCode().is2xxSuccessful()) {
            return ResponseEntity.ok(Map.of("messages", java.util.List.of()));
        }
        return resp;
    }

    /** POST /api/chat-history */
    @PostMapping("/chat-history")
    public ResponseEntity<?> postChatHistory(
            @RequestBody(required = false) Object body,
            @RequestHeader HttpHeaders headers) {
        return aiProxyService.proxy("/api/chat-history", HttpMethod.POST, body, headers);
    }

    /** DELETE /api/chat-history */
    @DeleteMapping("/chat-history")
    public ResponseEntity<?> deleteChatHistory(@RequestHeader HttpHeaders headers) {
        return aiProxyService.proxy("/api/chat-history", HttpMethod.DELETE, null, headers);
    }

    /** POST /api/feedback */
    @PostMapping("/feedback")
    public ResponseEntity<?> postFeedback(
            @RequestBody(required = false) Object body,
            @RequestHeader HttpHeaders headers) {
        return aiProxyService.proxy("/api/feedback", HttpMethod.POST, body, headers);
    }

    /** GET /api/dashboards */
    @GetMapping("/dashboards")
    public ResponseEntity<?> getDashboards(@RequestHeader HttpHeaders headers) {
        ResponseEntity<Object> resp = aiProxyService.proxy("/api/dashboards", HttpMethod.GET, null, headers);
        if (!resp.getStatusCode().is2xxSuccessful()) {
            return ResponseEntity.ok(Map.of("dashboards", java.util.List.of()));
        }
        return resp;
    }

    /** POST /api/dashboards */
    @PostMapping("/dashboards")
    public ResponseEntity<?> saveDashboard(
            @RequestBody(required = false) Object body,
            @RequestHeader HttpHeaders headers) {
        return aiProxyService.proxy("/api/dashboards", HttpMethod.POST, body, headers);
    }

    /** DELETE /api/dashboards/{name} */
    @DeleteMapping("/dashboards/{name}")
    public ResponseEntity<?> deleteDashboard(
            @PathVariable String name,
            @RequestHeader HttpHeaders headers) {
        return aiProxyService.proxy("/api/dashboards/" + name, HttpMethod.DELETE, null, headers);
    }

    /** GET /api/my-dashboard */
    @GetMapping("/my-dashboard")
    public ResponseEntity<?> getMyDashboard(@RequestHeader HttpHeaders headers) {
        ResponseEntity<Object> resp = aiProxyService.proxy("/api/my-dashboard", HttpMethod.GET, null, headers);
        if (!resp.getStatusCode().is2xxSuccessful()) {
            return ResponseEntity.ok(Map.of("dashboard", null));
        }
        return resp;
    }

    /** POST /api/my-dashboard */
    @PostMapping("/my-dashboard")
    public ResponseEntity<?> saveMyDashboard(
            @RequestBody(required = false) Object body,
            @RequestHeader HttpHeaders headers) {
        return aiProxyService.proxy("/api/my-dashboard", HttpMethod.POST, body, headers);
    }

    /** DELETE /api/my-dashboard */
    @DeleteMapping("/my-dashboard")
    public ResponseEntity<?> deleteMyDashboard(@RequestHeader HttpHeaders headers) {
        return aiProxyService.proxy("/api/my-dashboard", HttpMethod.DELETE, null, headers);
    }

    /** GET /api/reports */
    @GetMapping("/reports")
    public ResponseEntity<?> getReports(@RequestHeader HttpHeaders headers) {
        ResponseEntity<Object> resp = aiProxyService.proxy("/api/reports", HttpMethod.GET, null, headers);
        if (!resp.getStatusCode().is2xxSuccessful()) {
            return ResponseEntity.ok(Map.of("reports", java.util.List.of()));
        }
        return resp;
    }

    /** POST /api/reports */
    @PostMapping("/reports")
    public ResponseEntity<?> saveReport(
            @RequestBody(required = false) Object body,
            @RequestHeader HttpHeaders headers) {
        return aiProxyService.proxy("/api/reports", HttpMethod.POST, body, headers);
    }

    /** GET /api/reports/{id} */
    @GetMapping("/reports/{id}")
    public ResponseEntity<?> getReport(
            @PathVariable String id,
            @RequestHeader HttpHeaders headers) {
        ResponseEntity<Object> resp = aiProxyService.proxy("/api/reports/" + id, HttpMethod.GET, null, headers);
        if (!resp.getStatusCode().is2xxSuccessful()) {
            return ResponseEntity.ok(Map.of("report", null));
        }
        return resp;
    }

    /** PATCH /api/reports/{id} */
    @PatchMapping("/reports/{id}")
    public ResponseEntity<?> updateReport(
            @PathVariable String id,
            @RequestBody(required = false) Object body,
            @RequestHeader HttpHeaders headers) {
        return aiProxyService.proxy("/api/reports/" + id + "/status", HttpMethod.POST, body, headers);
    }

    /** DELETE /api/reports/{id} */
    @DeleteMapping("/reports/{id}")
    public ResponseEntity<?> deleteReport(
            @PathVariable String id,
            @RequestHeader HttpHeaders headers) {
        return aiProxyService.proxy("/api/reports/" + id, HttpMethod.DELETE, null, headers);
    }

    // ---- helpers ----
    private String getClientIp(HttpServletRequest req) {
        String forwarded = req.getHeader("x-forwarded-for");
        if (forwarded != null && !forwarded.isBlank()) return forwarded.split(",")[0].trim();
        String real = req.getHeader("x-real-ip");
        if (real != null && !real.isBlank()) return real;
        return req.getRemoteAddr();
    }
}
