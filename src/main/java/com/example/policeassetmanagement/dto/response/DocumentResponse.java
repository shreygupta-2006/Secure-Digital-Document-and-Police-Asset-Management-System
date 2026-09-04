package com.example.policeassetmanagement.dto.response;

import com.example.policeassetmanagement.entity.enums.DocumentType;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentResponse {

    private Long id;
    private String title;
    private DocumentType documentType;
    private String description;
    private String fileName;
    private String contentType;
    private Long fileSize;
    private String fileHash;
    private String uploadedByName;
    private Integer latestVersion;
    private boolean indexed;
    private Long caseId;
    private String caseNumber;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
