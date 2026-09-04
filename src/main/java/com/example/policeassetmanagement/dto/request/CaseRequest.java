package com.example.policeassetmanagement.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CaseRequest {

    @NotBlank(message = "Case number is required")
    @Size(max = 50)
    private String caseNumber;

    @NotBlank(message = "Title is required")
    @Size(max = 200)
    private String title;

    @Size(max = 1000)
    private String description;

    @Size(max = 20)
    private String status; // OPEN, CLOSED, ARCHIVED
}
