package com.example.policeassetmanagement.ai.dto.response;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SuggestionsResponse {

    private Long documentId;
    private List<String> suggestions;
    private String model;
}
