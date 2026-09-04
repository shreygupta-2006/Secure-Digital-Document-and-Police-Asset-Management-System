package com.example.policeassetmanagement.service;

import com.example.policeassetmanagement.dto.request.LoginRequest;
import com.example.policeassetmanagement.dto.request.RegisterRequest;
import com.example.policeassetmanagement.dto.response.LoginResponse;
import com.example.policeassetmanagement.dto.response.UserResponse;
import com.example.policeassetmanagement.entity.enums.Role;

import java.util.List;

public interface AuthService {

    UserResponse register(RegisterRequest request);

    LoginResponse login(LoginRequest request);

    List<UserResponse> listActiveUsers();

    List<UserResponse> listPendingUsers();

    long getPendingCount();

    UserResponse approveUser(Long userId, Role role);

    UserResponse rejectUser(Long userId);
}
