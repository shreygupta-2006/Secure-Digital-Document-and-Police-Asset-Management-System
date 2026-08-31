package com.example.policeassetmanagement.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MaintenanceRequest {

    @NotBlank(message = "Description is required")
    @Size(max = 1000)
    private String description;

    private BigDecimal cost;

    private String remarks;
}
