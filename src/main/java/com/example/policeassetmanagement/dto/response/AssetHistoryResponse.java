package com.example.policeassetmanagement.dto.response;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssetHistoryResponse {

    private List<AssignmentResponse> assignments;
    private List<MovementResponse> movements;
    private List<MaintenanceResponse> maintenances;
}
