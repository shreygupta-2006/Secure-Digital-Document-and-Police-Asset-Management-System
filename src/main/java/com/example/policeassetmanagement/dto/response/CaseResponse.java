package com.example.policeassetmanagement.dto.response;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CaseResponse {

    private Long id;
    private String caseNumber;
    private String title;
    private String description;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<CaseAssignmentResponse> assignments;
}
