package com.example.policeassetmanagement.ai.dto.response;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentAnswerResponse {

    private Long documentId;
    private String question;
    private String answer;
    private List<SourceChunkResponse> sources;
}
