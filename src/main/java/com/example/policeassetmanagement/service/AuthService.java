package com.example.policeassetmanagement.service;

import com.example.policeassetmanagement.dto.request.LoginRequest;
import com.example.policeassetmanagement.dto.request.RegisterRequest;
import com.example.policeassetmanagement.dto.response.LoginResponse;
import com.example.policeassetmanagement.dto.response.UserResponse;

public interface AuthService {

    UserResponse register(RegisterRequest request);

    LoginResponse login(LoginRequest request);
}
