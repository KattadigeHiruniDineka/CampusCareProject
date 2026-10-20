package com.campuscare.gateway.filter;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

/**
 * Once a request has been authenticated/authorized at the gateway (or is a
 * public /auth/** call), this filter attaches the correct microservice
 * X-API-KEY header before forwarding, based on the path prefix. This keeps
 * the client oblivious to the individual service API keys while each
 * microservice still independently enforces API Key verification.
 */
@Component
public class ApiKeyRelayFilter implements GlobalFilter, Ordered {

    @Value("${downstream.user-service-key}")
    private String userServiceKey;
    @Value("${downstream.request-service-key}")
    private String requestServiceKey;
    @Value("${downstream.department-service-key}")
    private String departmentServiceKey;
    @Value("${downstream.notification-service-key}")
    private String notificationServiceKey;

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String path = exchange.getRequest().getURI().getPath();
        String key = null;
        if (path.startsWith("/auth") || path.startsWith("/users")) key = userServiceKey;
        else if (path.startsWith("/requests")) key = requestServiceKey;
        else if (path.startsWith("/departments")) key = departmentServiceKey;
        else if (path.startsWith("/notifications")) key = notificationServiceKey;

        if (key != null) {
            ServerHttpRequest mutated = exchange.getRequest().mutate()
                    .header("X-API-KEY", key)
                    .build();
            exchange = exchange.mutate().request(mutated).build();
        }
        return chain.filter(exchange);
    }

    @Override
    public int getOrder() {
        return -2;
    }
}
