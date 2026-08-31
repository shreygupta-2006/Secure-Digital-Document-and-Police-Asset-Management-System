package com.example.policeassetmanagement.dto.response;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentVersionResponse {

    private Long id;
    private Long documentId;
    private Integer versionNumber;
    private String fileName;
    private String contentType;
    private Long fileSize;
    private String fileHash;
    private String changeDescription;
    private String uploadedByName;
    private LocalDateTime createdAt;
}
