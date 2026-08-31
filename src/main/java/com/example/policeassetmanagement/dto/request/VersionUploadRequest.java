package com.example.policeassetmanagement.dto.request;

import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VersionUploadRequest {

    @Size(max = 500)
    private String changeDescription;
}
