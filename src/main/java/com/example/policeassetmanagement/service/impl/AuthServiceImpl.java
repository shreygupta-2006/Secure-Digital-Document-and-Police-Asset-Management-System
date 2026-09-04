package com.example.policeassetmanagement.service.impl;

import com.example.policeassetmanagement.dto.request.LoginRequest;
import com.example.policeassetmanagement.dto.request.RegisterRequest;
import com.example.policeassetmanagement.dto.response.LoginResponse;
import com.example.policeassetmanagement.dto.response.UserResponse;
import com.example.policeassetmanagement.entity.User;
import com.example.policeassetmanagement.entity.enums.Role;
import com.example.policeassetmanagement.entity.enums.UserStatus;

import java.util.List;
import com.example.policeassetmanagement.exception.BadRequestException;
import com.example.policeassetmanagement.exception.ResourceNotFoundException;
import com.example.policeassetmanagement.repository.UserRepository;
import com.example.policeassetmanagement.security.JwtService;
import com.example.policeassetmanagement.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    /**
     * Allowed non-admin roles for public self-registration.
     */
    private static final java.util.Set<Role> ALLOWED_SELF_REGISTRATION_ROLES = java.util.Set.of(
            Role.OFFICER,
            Role.STORE_KEEPER,
            Role.AUDITOR,
            Role.VIEWER
    );

    @Override
    public UserResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email already in use");
        }

        // SECURITY: Determine role from requestedRole, but ALWAYS reject ADMIN
        Role role = resolveRequestedRole(request.getRequestedRole());

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .badgeNumber(request.getBadgeNumber())
                .department(request.getDepartment())
                .role(role)
                .status(UserStatus.PENDING)
                .build();

        User saved = userRepository.save(user);

        return UserResponse.builder()
                .id(saved.getId())
                .name(saved.getName())
                .email(saved.getEmail())
                .role(saved.getRole())
                .status(saved.getStatus())
                .badgeNumber(saved.getBadgeNumber())
                .department(saved.getDepartment())
                .createdAt(saved.getCreatedAt())
                .updatedAt(saved.getUpdatedAt())
                .build();
    }

    /**
     * Resolve the requested role. ADMIN is NEVER allowed through self-registration.
     * If the requested role is null, invalid, or ADMIN, default to OFFICER.
     */
    private Role resolveRequestedRole(String requestedRole) {
        if (requestedRole == null || requestedRole.isBlank()) {
            return Role.OFFICER;
        }

        try {
            Role requested = Role.valueOf(requestedRole.toUpperCase().trim());

            // SECURITY: NEVER allow ADMIN through public registration
            if (requested == Role.ADMIN) {
                return Role.OFFICER; // Silently downgrade to OFFICER
            }

            // Verify the role is in the allowed set
            if (!ALLOWED_SELF_REGISTRATION_ROLES.contains(requested)) {
                return Role.OFFICER; // Unknown role → default to OFFICER
            }

            return requested;
        } catch (IllegalArgumentException e) {
            // Invalid role string → default to OFFICER
            return Role.OFFICER;
        }
    }

    @Override
    public LoginResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        String token = jwtService.generateToken(userDetails);

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadRequestException("User not found"));

        return LoginResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .email(user.getEmail())
                .name(user.getName())
                .role(user.getRole())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserResponse> listActiveUsers() {
        return userRepository.findByStatus(UserStatus.ACTIVE).stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserResponse> listPendingUsers() {
        return userRepository.findByStatus(UserStatus.PENDING).stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public long getPendingCount() {
        return userRepository.countByStatus(UserStatus.PENDING);
    }

    @Override
    public UserResponse approveUser(Long userId, Role role) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        if (user.getStatus() != UserStatus.PENDING) {
            throw new BadRequestException("User is not in PENDING status");
        }

        user.setStatus(UserStatus.ACTIVE);
        user.setRole(role);
        User saved = userRepository.save(user);

        return mapToResponse(saved);
    }

    @Override
    public UserResponse rejectUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        if (user.getStatus() != UserStatus.PENDING) {
            throw new BadRequestException("User is not in PENDING status");
        }

        user.setStatus(UserStatus.REJECTED);
        User saved = userRepository.save(user);

        return mapToResponse(saved);
    }

    private UserResponse mapToResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .status(user.getStatus())
                .badgeNumber(user.getBadgeNumber())
                .department(user.getDepartment())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}
