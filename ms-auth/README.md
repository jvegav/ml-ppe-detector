# Authentication Microservice

This service provides OAuth2 Authorization Server endpoints, JSON login and refresh-token endpoints for first-party clients, RSA-signed JWT access tokens, a protected test endpoint, Redis-backed refresh-token storage, and Redis-backed authentication rate limiting.

## Run locally

Start Redis:

```bash
docker compose up -d redis
./mvnw spring-boot:run
```

The application starts on `http://localhost:8080`.

The development user is:

```text
username: demo@example.com
password: password
```

## Login

For OAuth2 clients, use the standard Authorization Code flow with PKCE through `/oauth2/authorize` and `/oauth2/token`. A demo confidential client is registered as `demo-client` with secret `demo-secret`.

For a simple first-party client, the JSON login endpoint is:

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"demo@example.com","password":"password"}'
```

The response contains an access token, a refresh token, and the access-token lifetime:

```json
{
  "accessToken": "eyJ...",
  "refreshToken": "...",
  "expiresIn": 900,
  "tokenType": "Bearer"
}
```

## Protected endpoint

```bash
curl http://localhost:8080/api/private/test \
  -H 'Authorization: Bearer ACCESS_TOKEN'
```

## Refresh

Refresh tokens are stored in Redis, expire after seven days, and are rotated after use:

```bash
curl -X POST http://localhost:8080/api/auth/refresh \
  -H 'Content-Type: application/json' \
  -d '{"refreshToken":"REFRESH_TOKEN"}'
```

Authentication endpoints are limited to 10 requests per IP per minute. The counter is updated atomically in Redis with a Lua script, so the limit works across multiple service instances.

## Docker

```bash
./mvnw clean package -DskipTests
docker compose up --build
```

Set `REDIS_HOST` and `REDIS_PORT` to connect to a different Redis instance.

## Production notes

The RSA key pair is generated when the application starts. This is convenient for development, but production deployments must load a stable key pair from a secret manager or mounted keystore; otherwise all access tokens become invalid after a restart. The demo user must also be replaced with a database-backed `UserDetailsService`.
