package com.example.policeassetmanagement.service;

import com.example.policeassetmanagement.dto.request.DocumentUploadRequest;
import com.example.policeassetmanagement.dto.response.DocumentResponse;
import com.example.policeassetmanagement.entity.Document;
import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface DocumentService {

    DocumentResponse uploadDocument(DocumentUploadRequest request, MultipartFile file,
                                     Long userId, String ip);

    /** @param currentUserId used to enforce case-based, assignment-aware access. */
    DocumentResponse getDocumentById(Long id, Long currentUserId);

    List<DocumentResponse> getAllDocuments();

    /** Case-scoped listing: returns only documents the given user is authorized to see. */
    List<DocumentResponse> getDocumentsForUser(Long userId);

    /** @param currentUserId used to enforce case-based, assignment-aware access on the results. */
    List<DocumentResponse> searchDocuments(String title, String type, String hash, Long currentUserId);

    DocumentResponse updateDocument(Long id, DocumentUploadRequest request, Long userId, String ip);

    void deleteDocument(Long id, Long userId, String ip);

    /** @param currentUserId used to enforce case-based, assignment-aware access. */
    Resource downloadDocument(Long id, Long currentUserId);

    String getDocumentContentType(Long id);

    String getDocumentFileName(Long id);

    Document getDocumentEntity(Long id);

    /**
     * Throws if the given user is not authorized to access the given document
     * (used by other modules such as AI/RAG that operate on document content).
     */
    void assertDocumentAccessible(Long documentId, Long currentUserId);
}
