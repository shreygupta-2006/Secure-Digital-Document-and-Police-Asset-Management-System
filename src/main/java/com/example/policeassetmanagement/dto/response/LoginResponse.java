package com.example.policeassetmanagement.dto.response;

import com.example.policeassetmanagement.entity.enums.Role;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginResponse {

    private String token;
    private String tokenType;
    private String email;
    private String name;
    private Role role;
}
