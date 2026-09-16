package com.example.mi_springboot.api;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/private")
public class PrivateController {

    @GetMapping("/test")
    public Map<String, String> test(Authentication authentication) {
        return Map.of(
                "message", "Access granted",
                "user", authentication.getName());
    }
}
