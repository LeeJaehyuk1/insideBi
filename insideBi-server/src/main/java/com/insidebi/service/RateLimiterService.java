package com.insidebi.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class RateLimiterService {

    @Value("${app.rate-limit.max-requests}")
    private int maxRequests;

    @Value("${app.rate-limit.window-seconds}")
    private int windowSeconds;

    private final Map<String, Deque<Instant>> store = new ConcurrentHashMap<>();

    /**
     * Returns true if the request is allowed, false if rate-limited.
     */
    public boolean isAllowed(String key) {
        Instant now = Instant.now();
        Instant windowStart = now.minusSeconds(windowSeconds);

        store.compute(key, (k, deque) -> {
            if (deque == null) deque = new ArrayDeque<>();
            // Remove timestamps outside the window
            while (!deque.isEmpty() && deque.peekFirst().isBefore(windowStart)) {
                deque.pollFirst();
            }
            return deque;
        });

        Deque<Instant> deque = store.get(key);
        if (deque.size() >= maxRequests) {
            return false;
        }
        deque.addLast(now);
        return true;
    }

    public int getMaxRequests() {
        return maxRequests;
    }

    public int getWindowSeconds() {
        return windowSeconds;
    }
}
