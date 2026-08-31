package com.example.policeassetmanagement.controller;

import com.example.policeassetmanagement.dto.request.DocumentUploadRequest;
import com.example.policeassetmanagement.dto.request.VersionUploadRequest;
import com.example.policeassetmanagement.dto.response.DocumentResponse;
import com.example.policeassetmanagement.dto.response.DocumentVersionResponse;
import com.example.policeassetmanagement.security.SecurityHelper;
import com.example.policeassetmanagement.service.DocumentService;
import com.example.policeassetmanagement.service.DocumentVersionService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentService documentService;
    private final DocumentVersionService documentVersionService;
    private final SecurityHelper securityHelper;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN', 'OFFICER')")
    public ResponseEntity<DocumentResponse> uploadDocument(
            @RequestParam("title") String title,
            @RequestParam("documentType") String documentType,
            @RequestParam(value = "description", required = false) String description,
            @RequestPart("file") MultipartFile file,
            HttpServletRequest httpRequest) {
        DocumentUploadRequest metadata = DocumentUploadRequest.builder()
                .title(title)
                .documentType(com.example.policeassetmanagement.entity.enums.DocumentType.valueOf(documentType))
                .description(description)
                .build();
        Long userId = securityHelper.getCurrentUserId();
        DocumentResponse response = documentService.uploadDocument(metadata, file, userId, getIp(httpRequest));
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<DocumentResponse>> searchDocuments(
            @RequestParam(required = false) String title,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String hash) {
        return ResponseEntity.ok(documentService.searchDocuments(title, type, hash));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<DocumentResponse> getDocumentById(@PathVariable Long id) {
        return ResponseEntity.ok(documentService.getDocumentById(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OFFICER')")
    public ResponseEntity<DocumentResponse> updateDocument(
            @PathVariable Long id,
            @RequestParam("title") String title,
            @RequestParam("documentType") String documentType,
            @RequestParam(value = "description", required = false) String description,
            HttpServletRequest httpRequest) {
        DocumentUploadRequest metadata = DocumentUploadRequest.builder()
                .title(title)
                .documentType(com.example.policeassetmanagement.entity.enums.DocumentType.valueOf(documentType))
                .description(description)
                .build();
        Long userId = securityHelper.getCurrentUserId();
        return ResponseEntity.ok(documentService.updateDocument(id, metadata, userId, getIp(httpRequest)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN')")
    public ResponseEntity<Void> deleteDocument(@PathVariable Long id, HttpServletRequest httpRequest) {
        Long userId = securityHelper.getCurrentUserId();
        documentService.deleteDocument(id, userId, getIp(httpRequest));
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/download")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Resource> downloadDocument(@PathVariable Long id) {
        Resource resource = documentService.downloadDocument(id);
        String contentType = documentService.getDocumentContentType(id);
        String fileName = documentService.getDocumentFileName(id);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType != null ? contentType : "application/octet-stream"))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                .body(resource);
    }

    // --- Version endpoints ---

    @GetMapping("/{id}/versions")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<DocumentVersionResponse>> getVersions(@PathVariable Long id) {
        return ResponseEntity.ok(documentVersionService.getVersionsByDocumentId(id));
    }

    @GetMapping("/{id}/versions/latest")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<DocumentVersionResponse> getLatestVersion(@PathVariable Long id) {
        return ResponseEntity.ok(documentVersionService.getLatestVersion(id));
    }

    @PostMapping(value = "/{id}/versions", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN', 'OFFICER')")
    public ResponseEntity<DocumentVersionResponse> uploadNewVersion(
            @PathVariable Long id,
            @RequestPart("file") MultipartFile file,
            @RequestPart(value = "changeDescription", required = false) String changeDescription,
            HttpServletRequest httpRequest) {
        Long userId = securityHelper.getCurrentUserId();
        DocumentVersionResponse response = documentVersionService.uploadNewVersion(
                id, file, changeDescription, userId, getIp(httpRequest));
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/versions/{versionId}/download")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Resource> downloadVersion(@PathVariable Long versionId) {
        Resource resource = documentVersionService.downloadVersion(versionId);
        String contentType = documentVersionService.getVersionContentType(versionId);
        String fileName = documentVersionService.getVersionFileName(versionId);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType != null ? contentType : "application/octet-stream"))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                .body(resource);
    }

    private String getIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        return xff != null ? xff.split(",")[0].trim() : request.getRemoteAddr();
    }
}
