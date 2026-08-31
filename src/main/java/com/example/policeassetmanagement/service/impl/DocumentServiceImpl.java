package com.example.policeassetmanagement.service.impl;

import com.example.policeassetmanagement.dto.request.DocumentUploadRequest;
import com.example.policeassetmanagement.dto.response.DocumentResponse;
import com.example.policeassetmanagement.entity.Document;
import com.example.policeassetmanagement.entity.DocumentVersion;
import com.example.policeassetmanagement.entity.User;
import com.example.policeassetmanagement.entity.enums.DocumentType;
import com.example.policeassetmanagement.exception.BadRequestException;
import com.example.policeassetmanagement.exception.ResourceNotFoundException;
import com.example.policeassetmanagement.repository.DocumentRepository;
import com.example.policeassetmanagement.repository.DocumentVersionRepository;
import com.example.policeassetmanagement.repository.UserRepository;
import com.example.policeassetmanagement.service.AuditService;
import com.example.policeassetmanagement.service.DocumentService;
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
public class DocumentServiceImpl implements DocumentService {

    private final DocumentRepository documentRepository;
    private final DocumentVersionRepository documentVersionRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;
    private final HashService hashService;
    private final AuditService auditService;

    @Override
    public DocumentResponse uploadDocument(DocumentUploadRequest request, MultipartFile file,
                                            Long userId, String ip) {
        User uploader = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        // Store the file
        String storedPath = fileStorageService.store(file, "documents");

        // Compute hash
        String hash;
        try {
            hash = hashService.sha256(file.getInputStream());
        } catch (IOException e) {
            throw new BadRequestException("Could not compute file hash");
        }

        // Create document metadata
        Document document = Document.builder()
                .title(request.getTitle())
                .documentType(request.getDocumentType())
                .description(request.getDescription())
                .fileName(file.getOriginalFilename())
                .filePath(storedPath)
                .contentType(file.getContentType())
                .fileSize(file.getSize())
                .fileHash(hash)
                .uploadedBy(uploader)
                .build();
        Document saved = documentRepository.save(document);

        // Create version 1
        DocumentVersion version = DocumentVersion.builder()
                .document(saved)
                .versionNumber(1)
                .fileName(file.getOriginalFilename())
                .filePath(storedPath)
                .contentType(file.getContentType())
                .fileSize(file.getSize())
                .fileHash(hash)
                .changeDescription("Initial upload")
                .uploadedBy(uploader)
                .build();
        documentVersionRepository.save(version);

        auditService.createAuditLog("DOCUMENT_UPLOADED", "Document", saved.getId(),
                userId, "Document uploaded: " + saved.getTitle(), ip);

        return mapToResponse(saved, 1);
    }

    @Override
    @Transactional(readOnly = true)
    public DocumentResponse getDocumentById(Long id) {
        Document document = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Document", "id", id));
        Integer latestVersion = getLatestVersionNumber(document);
        return mapToResponse(document, latestVersion);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DocumentResponse> getAllDocuments() {
        return documentRepository.findAll().stream()
                .map(doc -> mapToResponse(doc, getLatestVersionNumber(doc)))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<DocumentResponse> searchDocuments(String title, String type, String hash) {
        DocumentType docType = null;
        if (type != null) docType = DocumentType.valueOf(type);

        List<Document> results;
        if (title != null && docType != null && hash != null) {
            results = documentRepository.searchByTitleAndTypeAndHash(title, docType, hash);
        } else if (title != null && docType != null) {
            results = documentRepository.searchByTitleAndType(title, docType);
        } else if (title != null && hash != null) {
            results = documentRepository.searchByTitleAndHash(title, hash);
        } else if (docType != null && hash != null) {
            results = documentRepository.searchByTypeAndHash(docType, hash);
        } else if (title != null) {
            results = documentRepository.searchByTitle(title);
        } else if (docType != null) {
            results = documentRepository.searchByType(docType);
        } else if (hash != null) {
            results = documentRepository.searchByHash(hash);
        } else {
            results = documentRepository.findAll();
        }

        return results.stream()
                .map(doc -> mapToResponse(doc, getLatestVersionNumber(doc)))
                .toList();
    }

    @Override
    public DocumentResponse updateDocument(Long id, DocumentUploadRequest request, Long userId, String ip) {
        Document document = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Document", "id", id));

        document.setTitle(request.getTitle());
        document.setDocumentType(request.getDocumentType());
        document.setDescription(request.getDescription());

        Document updated = documentRepository.save(document);
        Integer latestVersion = getLatestVersionNumber(updated);

        auditService.createAuditLog("DOCUMENT_UPDATED", "Document", updated.getId(),
                userId, "Document updated: " + updated.getTitle(), ip);

        return mapToResponse(updated, latestVersion);
    }

    @Override
    public void deleteDocument(Long id, Long userId, String ip) {
        Document document = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Document", "id", id));

        // Delete stored files for all versions
        List<DocumentVersion> versions = documentVersionRepository.findByDocumentOrderByVersionNumberDesc(document);
        for (DocumentVersion v : versions) {
            fileStorageService.delete(v.getFilePath());
        }

        documentRepository.deleteById(id);

        auditService.createAuditLog("DOCUMENT_DELETED", "Document", id,
                userId, "Document deleted: " + document.getTitle(), ip);
    }

    @Override
    public Resource downloadDocument(Long id) {
        Document document = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Document", "id", id));
        return fileStorageService.loadAsResource(document.getFilePath());
    }

    @Override
    public String getDocumentContentType(Long id) {
        Document document = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Document", "id", id));
        return document.getContentType();
    }

    @Override
    public String getDocumentFileName(Long id) {
        Document document = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Document", "id", id));
        return document.getFileName();
    }

    @Override
    public Document getDocumentEntity(Long id) {
        return documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Document", "id", id));
    }

    private Integer getLatestVersionNumber(Document doc) {
        return documentVersionRepository.findByDocumentOrderByVersionNumberDesc(doc)
                .stream().findFirst().map(DocumentVersion::getVersionNumber).orElse(0);
    }

    private DocumentResponse mapToResponse(Document document, Integer latestVersion) {
        return DocumentResponse.builder()
                .id(document.getId()).title(document.getTitle())
                .documentType(document.getDocumentType()).description(document.getDescription())
                .fileName(document.getFileName()).contentType(document.getContentType())
                .fileSize(document.getFileSize()).fileHash(document.getFileHash())
                .uploadedByName(document.getUploadedBy().getName())
                .latestVersion(latestVersion)
                .createdAt(document.getCreatedAt()).updatedAt(document.getUpdatedAt())
                .build();
    }
}
