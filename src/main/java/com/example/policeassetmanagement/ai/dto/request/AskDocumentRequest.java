package com.example.policeassetmanagement.ai.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AskDocumentRequest {

    @NotBlank(message = "Question is required")
    private String question;
}
