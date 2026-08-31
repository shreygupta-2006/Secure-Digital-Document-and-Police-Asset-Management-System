package com.example.policeassetmanagement.ai.dto.response;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class IndexDocumentResponse {

    private Long documentId;
    private int chunksCreated;
    private boolean indexed;
}
