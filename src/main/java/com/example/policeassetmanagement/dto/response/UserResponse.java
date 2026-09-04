package com.example.policeassetmanagement.dto.response;

import com.example.policeassetmanagement.entity.enums.Role;
import com.example.policeassetmanagement.entity.enums.UserStatus;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserResponse {

    private Long id;
    private String name;
    private String email;
    private Role role;
    private UserStatus status;
    private String badgeNumber;
    private String department;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
