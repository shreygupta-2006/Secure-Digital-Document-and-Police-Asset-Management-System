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

    DocumentResponse getDocumentById(Long id);

    List<DocumentResponse> getAllDocuments();

    List<DocumentResponse> searchDocuments(String title, String type, String hash);

    DocumentResponse updateDocument(Long id, DocumentUploadRequest request, Long userId, String ip);

    void deleteDocument(Long id, Long userId, String ip);

    Resource downloadDocument(Long id);

    String getDocumentContentType(Long id);

    String getDocumentFileName(Long id);

    Document getDocumentEntity(Long id);
}
