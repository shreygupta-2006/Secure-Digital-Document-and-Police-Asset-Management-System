package com.example.policeassetmanagement.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/test")
public class TestController {

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> adminOnly(Authentication authentication) {
        return ResponseEntity.ok(Map.of(
                "message", "Hello Admin! You have ADMIN access.",
                "user", authentication.getName(),
                "authorities", authentication.getAuthorities().toString()
        ));
    }

    @GetMapping("/officer")
    @PreAuthorize("hasRole('OFFICER') or hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> officerAccess(Authentication authentication) {
        return ResponseEntity.ok(Map.of(
                "message", "Hello Officer! You have OFFICER access.",
                "user", authentication.getName()
        ));
    }

    @GetMapping("/any-authenticated")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> anyAuthenticatedUser(Authentication authentication) {
        return ResponseEntity.ok(Map.of(
                "message", "Hello! You are authenticated.",
                "user", authentication.getName()
        ));
    }
}
