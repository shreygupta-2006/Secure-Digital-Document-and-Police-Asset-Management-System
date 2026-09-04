package com.example.policeassetmanagement.controller;

import com.example.policeassetmanagement.dto.request.LoginRequest;
import com.example.policeassetmanagement.dto.request.RegisterRequest;
import com.example.policeassetmanagement.dto.response.LoginResponse;
import com.example.policeassetmanagement.dto.response.UserResponse;
import com.example.policeassetmanagement.entity.enums.Role;
import com.example.policeassetmanagement.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<UserResponse> register(@Valid @RequestBody RegisterRequest request) {
        UserResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/users")
    public ResponseEntity<java.util.List<UserResponse>> listUsers() {
        return ResponseEntity.ok(authService.listActiveUsers());
    }

    @GetMapping("/pending")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<java.util.List<UserResponse>> listPendingUsers() {
        return ResponseEntity.ok(authService.listPendingUsers());
    }

    @GetMapping("/pending/count")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Long>> getPendingCount() {
        return ResponseEntity.ok(Map.of("count", authService.getPendingCount()));
    }

    @PostMapping("/pending/{userId}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserResponse> approveUser(
            @PathVariable Long userId,
            @RequestBody Map<String, String> body) {
        Role role = Role.valueOf(body.getOrDefault("role", "OFFICER"));
        return ResponseEntity.ok(authService.approveUser(userId, role));
    }

    @PostMapping("/pending/{userId}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserResponse> rejectUser(@PathVariable Long userId) {
        return ResponseEntity.ok(authService.rejectUser(userId));
    }
}
