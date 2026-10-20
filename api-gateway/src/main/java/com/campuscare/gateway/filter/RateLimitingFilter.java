package com.campuscare.gateway.filter;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.net.InetSocketAddress;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Simple in-memory sliding-window rate limiter, applied globally at the
 * gateway to every downstream request. Each client IP is allowed a fixed
 * number of requests per rolling window; requests beyond that receive
 * HTTP 429 (Too Many Requests).
 */
@Component
public class RateLimitingFilter implements GlobalFilter, Ordered {

    @Value("${rate-limit.max-requests:20}")
    private int maxRequests;

    @Value("${rate-limit.window-ms:60000}")
    private long windowMs;

    private final ConcurrentHashMap<String, Window> buckets = new ConcurrentHashMap<>();

    private static class Window {
        long windowStart;
        AtomicInteger count;
        Window(long start) { this.windowStart = start; this.count = new AtomicInteger(0); }
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String clientIp = resolveClientIp(exchange);
        long now = System.currentTimeMillis();

        Window window = buckets.compute(clientIp, (ip, existing) -> {
            if (existing == null || now - existing.windowStart > windowMs) {
                return new Window(now);
            }
            return existing;
        });

        int current = window.count.incrementAndGet();
        if (current > maxRequests) {
            exchange.getResponse().setStatusCode(HttpStatus.TOO_MANY_REQUESTS);
            return exchange.getResponse().setComplete();
        }
        return chain.filter(exchange);
    }

    private String resolveClientIp(ServerWebExchange exchange) {
        InetSocketAddress remote = exchange.getRequest().getRemoteAddress();
        return remote != null ? remote.getAddress().getHostAddress() : "unknown";
    }

    @Override
    public int getOrder() {
        return -1;
    }
}
