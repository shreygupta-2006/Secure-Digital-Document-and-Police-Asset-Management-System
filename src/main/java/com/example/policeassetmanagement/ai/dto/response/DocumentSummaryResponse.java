package com.example.policeassetmanagement.ai.dto.response;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentSummaryResponse {

    private Long documentId;
    private String summary;
    private String model;
}
