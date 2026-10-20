package com.campuscare.gateway.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.web.server.SecurityWebFilterChain;

@Configuration
@EnableWebFluxSecurity
public class SecurityConfig {

    @Bean
    public SecurityWebFilterChain securityWebFilterChain(
            ServerHttpSecurity http) {

        return http
                // REST API නිසා CSRF disable
                .csrf(csrf -> csrf.disable())

                .authorizeExchange(exchange -> exchange

                        // CORS preflight requests
                        .pathMatchers(
                                HttpMethod.OPTIONS,
                                "/**"
                        ).permitAll()

                        // Login / Register
                        .pathMatchers("/auth/**").permitAll()

                        // User endpoints
                        .pathMatchers("/users/**").permitAll()

                        // Request endpoints
                        .pathMatchers("/requests/**").permitAll()

                        // Department endpoints
                        .pathMatchers("/departments/**").permitAll()

                        // Notification endpoints
                        .pathMatchers("/notifications/**").permitAll()

                        // Swagger / OpenAPI
                        .pathMatchers(
                                "/user-docs/**",
                                "/request-docs/**",
                                "/department-docs/**",
                                "/notification-docs/**",
                                "/swagger-ui/**",
                                "/v3/api-docs/**"
                        ).permitAll()

                        // Everything else
                        .anyExchange().permitAll()
                )

                .build();
    }
}