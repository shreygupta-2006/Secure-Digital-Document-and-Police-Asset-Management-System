package com.example.policeassetmanagement.service.impl;

import com.example.policeassetmanagement.dto.response.DocumentVersionResponse;
import com.example.policeassetmanagement.entity.Document;
import com.example.policeassetmanagement.entity.DocumentVersion;
import com.example.policeassetmanagement.entity.User;
import com.example.policeassetmanagement.exception.BadRequestException;
import com.example.policeassetmanagement.exception.ResourceNotFoundException;
import com.example.policeassetmanagement.repository.DocumentRepository;
import com.example.policeassetmanagement.repository.DocumentVersionRepository;
import com.example.policeassetmanagement.repository.UserRepository;
import com.example.policeassetmanagement.service.AuditService;
import com.example.policeassetmanagement.service.DocumentVersionService;
import com.example.policeassetmanagement.service.HashService;
import com.example.policeassetmanagement.storage.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class DocumentVersionServiceImpl implements DocumentVersionService {

    private final DocumentVersionRepository documentVersionRepository;
    private final DocumentRepository documentRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;
    private final HashService hashService;
    private final AuditService auditService;

    @Override
    @Transactional(readOnly = true)
    public List<DocumentVersionResponse> getVersionsByDocumentId(Long documentId) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Document", "id", documentId));
        return documentVersionRepository.findByDocumentOrderByVersionNumberDesc(document)
                .stream().map(this::mapToResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public DocumentVersionResponse getLatestVersion(Long documentId) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Document", "id", documentId));
        DocumentVersion latest = documentVersionRepository
                .findByDocumentOrderByVersionNumberDesc(document)
                .stream().findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("DocumentVersion", "documentId", documentId));
        return mapToResponse(latest);
    }

    @Override
    public DocumentVersionResponse uploadNewVersion(Long documentId, MultipartFile file,
                                                     String changeDescription, Long userId, String ip) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Document", "id", documentId));

        User uploader = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        Integer latestVersionNum = documentVersionRepository.findByDocumentOrderByVersionNumberDesc(document)
                .stream().findFirst().map(DocumentVersion::getVersionNumber).orElse(0);

        String storedPath = fileStorageService.store(file, "documents");

        String hash;
        try {
            hash = hashService.sha256(file.getInputStream());
        } catch (IOException e) {
            throw new BadRequestException("Could not compute file hash");
        }

        DocumentVersion version = DocumentVersion.builder()
                .document(document)
                .versionNumber(latestVersionNum + 1)
                .fileName(file.getOriginalFilename())
                .filePath(storedPath)
                .contentType(file.getContentType())
                .fileSize(file.getSize())
                .fileHash(hash)
                .changeDescription(changeDescription)
                .uploadedBy(uploader)
                .build();
        DocumentVersion saved = documentVersionRepository.save(version);

        // Update document metadata to point to latest
        document.setFileName(file.getOriginalFilename());
        document.setFilePath(storedPath);
        document.setContentType(file.getContentType());
        document.setFileSize(file.getSize());
        document.setFileHash(hash);
        documentRepository.save(document);

        auditService.createAuditLog("VERSION_CREATED", "DocumentVersion", saved.getId(),
                userId, "Version " + saved.getVersionNumber() + " uploaded for: " + document.getTitle(), ip);

        return mapToResponse(saved);
    }

    @Override
    public Resource downloadVersion(Long versionId) {
        DocumentVersion version = documentVersionRepository.findById(versionId)
                .orElseThrow(() -> new ResourceNotFoundException("DocumentVersion", "id", versionId));
        return fileStorageService.loadAsResource(version.getFilePath());
    }

    @Override
    @Transactional(readOnly = true)
    public DocumentVersion getVersionEntity(Long versionId) {
        return documentVersionRepository.findById(versionId)
                .orElseThrow(() -> new ResourceNotFoundException("DocumentVersion", "id", versionId));
    }

    @Override
    @Transactional(readOnly = true)
    public String getVersionContentType(Long versionId) {
        DocumentVersion version = getVersionEntity(versionId);
        return version.getContentType();
    }

    @Override
    @Transactional(readOnly = true)
    public String getVersionFileName(Long versionId) {
        DocumentVersion version = getVersionEntity(versionId);
        return version.getFileName();
    }

    private DocumentVersionResponse mapToResponse(DocumentVersion version) {
        return DocumentVersionResponse.builder()
                .id(version.getId())
                .documentId(version.getDocument().getId())
                .versionNumber(version.getVersionNumber())
                .fileName(version.getFileName())
                .contentType(version.getContentType())
                .fileSize(version.getFileSize())
                .fileHash(version.getFileHash())
                .changeDescription(version.getChangeDescription())
                .uploadedByName(version.getUploadedBy().getName())
                .createdAt(version.getCreatedAt())
                .build();
    }
}
