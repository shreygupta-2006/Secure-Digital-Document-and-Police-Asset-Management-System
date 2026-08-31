package com.example.policeassetmanagement.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssignAssetRequest {

    @NotNull(message = "User ID is required")
    private Long userId;

    private String remarks;
}
