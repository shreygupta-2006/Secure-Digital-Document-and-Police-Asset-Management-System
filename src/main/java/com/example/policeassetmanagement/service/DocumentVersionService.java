package com.example.policeassetmanagement.service;

import com.example.policeassetmanagement.dto.response.DocumentVersionResponse;
import com.example.policeassetmanagement.entity.DocumentVersion;
import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface DocumentVersionService {

    List<DocumentVersionResponse> getVersionsByDocumentId(Long documentId);

    DocumentVersionResponse getLatestVersion(Long documentId);

    DocumentVersionResponse uploadNewVersion(Long documentId, MultipartFile file,
                                              String changeDescription, Long userId, String ip);

    Resource downloadVersion(Long versionId);

    DocumentVersion getVersionEntity(Long versionId);

    String getVersionContentType(Long versionId);

    String getVersionFileName(Long versionId);
}
