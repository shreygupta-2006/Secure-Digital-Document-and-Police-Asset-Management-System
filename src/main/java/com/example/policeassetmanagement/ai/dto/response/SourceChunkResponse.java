package com.example.policeassetmanagement.ai.dto.response;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SourceChunkResponse {

    private Long chunkId;
    private Integer chunkIndex;
}
