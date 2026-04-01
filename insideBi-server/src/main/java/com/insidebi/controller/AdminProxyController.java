package com.insidebi.controller;

import com.insidebi.config.AppConfig;
import com.insidebi.service.AiProxyService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminProxyController {

    private final AiProxyService aiProxyService;
    private final AppConfig appConfig;

    /** POST /api/admin/login */
    @PostMapping("/login")
    public ResponseEntity<?> login(
            @RequestBody(required = false) Object body,
            @RequestHeader HttpHeaders headers) {
        if (!isAuthorized(headers)) return unauthorized();
        return aiProxyService.proxy("/admin/login", HttpMethod.POST, body, headers);
    }

    /** GET /api/admin/training */
    @GetMapping("/training")
    public ResponseEntity<?> getTraining(@RequestHeader HttpHeaders headers) {
        if (!isAuthorized(headers)) return unauthorized();
        return aiProxyService.proxy("/admin/training", HttpMethod.GET, null, headers);
    }

    /** POST /api/admin/training?type=sql|doc */
    @PostMapping("/training")
    public ResponseEntity<?> postTraining(
            @RequestParam(required = false, defaultValue = "sql") String type,
            @RequestBody(required = false) Object body,
            @RequestHeader HttpHeaders headers) {
        if (!isAuthorized(headers)) return unauthorized();
        String path = "doc".equals(type) ? "/admin/training/doc" : "/admin/training/sql";
        return aiProxyService.proxy(path, HttpMethod.POST, body, headers);
    }

    /** POST /api/admin/training-delete */
    @PostMapping("/training-delete")
    public ResponseEntity<?> deleteTraining(
            @RequestBody(required = false) Object body,
            @RequestHeader HttpHeaders headers) {
        if (!isAuthorized(headers)) return unauthorized();
        return aiProxyService.proxy("/admin/training/delete", HttpMethod.POST, body, headers);
    }

    /** GET /api/admin/feedback */
    @GetMapping("/feedback")
    public ResponseEntity<?> getFeedback(@RequestHeader HttpHeaders headers) {
        if (!isAuthorized(headers)) return unauthorized();
        return aiProxyService.proxy("/admin/feedback", HttpMethod.GET, null, headers);
    }

    /** POST /api/admin/feedback-approve */
    @PostMapping("/feedback-approve")
    public ResponseEntity<?> approveFeedback(
            @RequestBody(required = false) Object body,
            @RequestHeader HttpHeaders headers) {
        if (!isAuthorized(headers)) return unauthorized();
        return aiProxyService.proxy("/admin/feedback/approve", HttpMethod.POST, body, headers);
    }

    /** POST /api/admin/feedback-delete */
    @PostMapping("/feedback-delete")
    public ResponseEntity<?> deleteFeedback(
            @RequestBody(required = false) Object body,
            @RequestHeader HttpHeaders headers) {
        if (!isAuthorized(headers)) return unauthorized();
        return aiProxyService.proxy("/admin/feedback/delete", HttpMethod.POST, body, headers);
    }

    /** POST /api/admin/ddl-sync */
    @PostMapping("/ddl-sync")
    public ResponseEntity<?> ddlSync(
            @RequestBody(required = false) Object body,
            @RequestHeader HttpHeaders headers) {
        if (!isAuthorized(headers)) return unauthorized();
        return aiProxyService.proxy("/admin/training/ddl-sync", HttpMethod.POST, body, headers);
    }

    /** GET /api/admin/monitoring */
    @GetMapping("/monitoring")
    public ResponseEntity<?> monitoring(@RequestHeader HttpHeaders headers) {
        if (!isAuthorized(headers)) return unauthorized();
        return aiProxyService.proxy("/admin/monitoring", HttpMethod.GET, null, headers);
    }

    /** POST /api/admin/retrain-all */
    @PostMapping("/retrain-all")
    public ResponseEntity<?> retrainAll(
            @RequestBody(required = false) Object body,
            @RequestHeader HttpHeaders headers) {
        if (!isAuthorized(headers)) return unauthorized();
        return aiProxyService.proxy("/admin/training/retrain-all", HttpMethod.POST, body, headers);
    }

    // ---- helpers ----
    private boolean isAuthorized(HttpHeaders headers) {
        String pw = headers.getFirst("x-admin-password");
        return appConfig.adminPassword.equals(pw);
    }

    private ResponseEntity<Object> unauthorized() {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("error", "Unauthorized"));
    }
}
