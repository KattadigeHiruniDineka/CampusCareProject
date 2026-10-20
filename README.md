CampusCare — University Service Management System

A distributed microservices system built for the Service-Oriented Computing
practical assignment. Four independent Spring Boot microservices sit behind
a single API Gateway, fronted by a unified web client.

## Architecture

```
                        ┌────────────────────┐
   Web Client (3000) ──▶│   API Gateway (8080) │
                        │  - OAuth2/JWT check   │
                        │  - CORS               │
                        │  - Rate limiting       │
                        │  - Routing + API-Key   │
                        │    relay to services   │
                        └──────┬──────┬──────┬───┘
                 ┌─────────────┘      │      └─────────────┐
                 ▼                    ▼                    ▼
        User & Auth (8081)   Request Svc (8082)   Department (8083)
                                                    Notification (8084)
```

Each microservice:
- Is an independent Spring Boot app with its own embedded H2 database.
- Enforces `X-API-KEY` header verification on every request (`ApiKeyFilter`).
- Publishes interactive API docs via Swagger UI / OpenAPI (springdoc).

The API Gateway:
- Is the **single entry point** for the client — the client never talks to
  a backend service directly.
- Validates the JWT **Bearer access token** issued by the User & Auth
  Service as an **OAuth2 Resource Server** (`spring-boot-starter-oauth2-resource-server`),
  protecting `/users/**`, `/requests/**`, `/notifications/**`. `/auth/**`
  (register/login) and `/departments/**` (browsing) stay public.
- Applies **CORS** so only the configured client origin (`http://localhost:3000`)
  can call the backend.
- Applies **rate limiting** (in-memory sliding window, default 20 requests /
  60 seconds per client IP) — excess requests get HTTP `429`.
- Relays the correct per-service `X-API-KEY` to each downstream service, so
  the client itself never needs to know individual service keys.

> **Note on OAuth 2.0**: to keep the assignment self-contained (no external
> identity provider needed), the User & Auth Service acts as a lightweight
> token issuer: `POST /auth/login` verifies credentials and issues a signed
> JWT. The Gateway then validates that JWT as an OAuth2 **Bearer Token**
> Resource Server. This demonstrates the OAuth2 bearer-token authorization
> pattern described in the assignment without requiring a separate
> Authorization Server such as Keycloak.

## Project Structure

```
CampusCare/
├── api-gateway/            Spring Cloud Gateway, OAuth2 resource server, CORS, rate limiting
├── user-service/            Registration, login (JWT issuance), user profiles
├── request-service/         Service request CRUD
├── department-service/      Department CRUD
├── notification-service/    Notifications CRUD
├── client/                  Unified vanilla JS web client (served via nginx)
├── docker-compose.yml
├── postman_collection.json  Ready-to-import Postman collection for manual testing
└── README.md
```

## Running the system

Requires Docker and Docker Compose. No local Java/Maven install needed —
each service builds inside a multi-stage Docker image (Maven build stage +
slim JRE runtime stage).

```bash
docker compose up --build
```

This starts:

| Component            | URL                                      |
|-----------------------|-------------------------------------------|
| Web client            | http://localhost:3000                     |
| API Gateway           | http://localhost:8080                     |
| User & Auth Service   | http://localhost:8081                     |
| Request Service       | http://localhost:8082                     |
| Department Service    | http://localhost:8083                     |
| Notification Service  | http://localhost:8084                     |

Swagger UI (direct, per service — recommended for the "execute documented
endpoint" demo):
- http://localhost:8081/swagger-ui/index.html
- http://localhost:8082/swagger-ui/index.html
- http://localhost:8083/swagger-ui/index.html
- http://localhost:8084/swagger-ui/index.html

Each service's Swagger requests need the `X-API-KEY` header (see table
below) added via the "Authorize" / header field, since the API key check
applies to every route except the docs endpoints themselves.

Swagger is also reachable **through the gateway** at
`/user-docs/swagger-ui/index.html`, `/request-docs/...`, `/department-docs/...`,
`/notification-docs/...` (the gateway strips the prefix and forwards).

## API Keys (per microservice)

| Service               | Header      | Default value             |
|------------------------|-------------|----------------------------|
| user-service           | X-API-KEY   | `user-service-key`         |
| request-service        | X-API-KEY   | `request-service-key`      |
| department-service     | X-API-KEY   | `department-service-key`   |
| notification-service   | X-API-KEY   | `notification-service-key` |

These are injected as environment variables in `docker-compose.yml` and can
be changed there. When calling a service **directly** (bypassing the
gateway) for the "invalid API key" demonstration, send a wrong/missing key
and expect `401 Unauthorized`. When calling **through the gateway**, the
gateway attaches the correct key automatically after validating the JWT.

## OAuth2 / JWT Flow (Section 9)

1. User registers via `POST /auth/register` (through the gateway, public).
2. User logs in via `POST /auth/login` — User Service verifies credentials
   and returns a signed JWT (`Authorization: Bearer <token>`).
3. Client stores the token and sends it on every subsequent request.
4. Gateway validates the token signature/expiry as an OAuth2 Resource
   Server before routing.
5. Unauthorized/expired/missing tokens on protected routes get `401` from
   the gateway — the request never reaches a backend service.

## Rate Limiting Demonstration (Section 10)

Default limit: **20 requests per 60 seconds per client IP**, enforced at
the gateway (`RateLimitingFilter`). Fire more than 20 requests quickly
(e.g. a small script hitting `GET /departments` through the gateway) and
observe `HTTP 429 Too Many Requests` once the limit is exceeded. Adjust via
`RATE_LIMIT_MAX` / `RATE_LIMIT_WINDOW_MS` env vars in `docker-compose.yml`.

## CORS Demonstration (Section 11)

The gateway only allows the origin configured in `CLIENT_ORIGIN`
(`http://localhost:3000` by default). A request from any other origin
(e.g. opening the browser console on a different site and calling the
gateway with `fetch`) will be blocked by the browser due to the missing
CORS headers — capture this in dev tools for the report.

## Database Schema (Section 12)

- **users**: id, name, email, password (BCrypt hash), student_id, created_at
- **service_requests**: id, student_id, department_id, request_type,
  description, priority, status, created_at, updated_at
- **departments**: id, name, description, contact_email, location
- **notifications**: id, user_id, title, message, is_read, created_at

Each service uses an in-memory H2 database (`ddl-auto: update`) for the
demonstration; swap the datasource in `application.yml` for a persistent
database (Postgres/MySQL) if required.

## Suggested End-to-End Demonstration Flow (Section 13)

1. `docker compose up --build`
2. Open http://localhost:3000
3. Register a new student account
4. Log in
5. View dashboard (aggregates departments/requests/notifications via the
   gateway)
6. View Departments (seed a couple manually via Postman/Swagger first, or
   `POST /departments` through the gateway/service directly)
7. Submit a Service Request
8. Verify it went through the gateway (check `api-gateway` container logs)
   and is stored by the Request Service (check `GET /requests` on 8082)
9. Create a notification for the user (`POST /notifications` directly to
   8084, or via gateway) and view it in the client
10. Update the request status from the "My Requests" screen and verify
11. Demonstrate a valid vs invalid `X-API-KEY` directly against a service
    (e.g. Postman → user-service `GET /users/1` with and without the key)
12. Show gateway routing (same endpoint reachable via 8080 without knowing
    the individual service port)
13. Demonstrate rate limiting (rapid repeated requests → 429)
14. Open each service's Swagger UI and execute a documented endpoint

## Testing

Import `postman_collection.json` into Postman. It contains requests for
every endpoint, both through the gateway and directly against each service
(including a deliberately invalid API key request for the security demo).

## Final Practical Checklist

- [x] All microservices implemented using Spring Boot
- [x] Each microservice exposes 3+ RESTful endpoints
- [x] Each microservice enforces API Key verification
- [x] All client requests routed through the API Gateway
- [x] OAuth2/JWT bearer-token authentication/authorization at the gateway
- [x] CORS configured for the client application
- [x] Rate limiting implemented at the gateway
- [x] Unified client integrates all four microservices
- [x] Swagger/OpenAPI documentation for every microservice
- [x] Dockerfiles for every component
- [x] Root `docker-compose.yml`
- [x] System starts with `docker compose up`
- [x] Postman/API tests completed — run the provided collection




