package com.example.policeassetmanagement.dto.response;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssignmentResponse {

    private Long id;
    private Long assetId;
    private String assetCode;
    private Long assignedToId;
    private String assignedToName;
    private String assignedByName;
    private LocalDateTime assignedAt;
    private LocalDateTime returnedAt;
    private String status;
    private String remarks;
}
