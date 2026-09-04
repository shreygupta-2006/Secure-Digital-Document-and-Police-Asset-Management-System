package com.example.policeassetmanagement.dto.response;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CaseAssignmentResponse {

    private Long id;
    private Long caseId;
    private String caseNumber;
    private Long userId;
    private String userName;
    private String userRole;
    private String status;
    private String remarks;
    private LocalDateTime createdAt;
}
