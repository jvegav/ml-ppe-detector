package com.example.mi_springboot.auth;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

@Service
public class AuthService {

    private static final Duration ACCESS_TOKEN_TTL = Duration.ofMinutes(15);
    private static final Duration REFRESH_TOKEN_TTL = Duration.ofDays(7);
    private static final String REFRESH_KEY_PREFIX = "auth:refresh:";

    private final AuthenticationManager authenticationManager;
    private final JwtEncoder jwtEncoder;
    private final StringRedisTemplate redis;

    public AuthService(AuthenticationManager authenticationManager,
                       JwtEncoder jwtEncoder,
                       StringRedisTemplate redis) {
        this.authenticationManager = authenticationManager;
        this.jwtEncoder = jwtEncoder;
        this.redis = redis;
    }

    public TokenResponse login(String username, String password) {
        Authentication authentication = authenticationManager.authenticate(
                UsernamePasswordAuthenticationToken.unauthenticated(username, password));
        return issueTokens(authentication.getName());
    }

    public TokenResponse refresh(String refreshToken) {
        String username = redis.opsForValue().get(REFRESH_KEY_PREFIX + refreshToken);
        if (username == null) {
            throw new InvalidRefreshTokenException();
        }

        // Rotate refresh tokens so a stolen token cannot be reused indefinitely.
        redis.delete(REFRESH_KEY_PREFIX + refreshToken);
        return issueTokens(username);
    }

    private TokenResponse issueTokens(String username) {
        Instant now = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("mi-springboot-auth")
                .subject(username)
                .issuedAt(now)
                .expiresAt(now.plus(ACCESS_TOKEN_TTL))
                .claim("scope", "read")
                .build();

        String accessToken = jwtEncoder.encode(JwtEncoderParameters.from(claims)).getTokenValue();
        String refreshToken = UUID.randomUUID().toString();
        redis.opsForValue().set(
                REFRESH_KEY_PREFIX + refreshToken,
                username,
                REFRESH_TOKEN_TTL);

        return new TokenResponse(accessToken, refreshToken, ACCESS_TOKEN_TTL.toSeconds());
    }

    public record TokenResponse(String accessToken, String refreshToken, long expiresIn) {
        public String tokenType() {
            return "Bearer";
        }
    }

    public static class InvalidRefreshTokenException extends RuntimeException {
    }
}
