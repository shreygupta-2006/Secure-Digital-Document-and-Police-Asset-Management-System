package com.example.policeassetmanagement.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MaintenanceResponse {

    private Long id;
    private Long assetId;
    private String assetCode;
    private String description;
    private String performedByName;
    private String status;
    private BigDecimal cost;
    private LocalDateTime maintenanceDate;
    private LocalDateTime completedDate;
    private String remarks;
}
