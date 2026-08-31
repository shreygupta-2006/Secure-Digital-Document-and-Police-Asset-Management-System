package com.example.policeassetmanagement.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MoveAssetRequest {

    @NotBlank(message = "Target location is required")
    @Size(max = 200)
    private String toLocation;

    private String reason;
}
