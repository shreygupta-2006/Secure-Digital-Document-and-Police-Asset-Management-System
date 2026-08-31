package com.example.policeassetmanagement.ai.repository;

import com.example.policeassetmanagement.ai.entity.DocumentChunk;
import com.example.policeassetmanagement.entity.Document;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentChunkRepository extends JpaRepository<DocumentChunk, Long> {

    List<DocumentChunk> findByDocumentOrderByChunkIndex(Document document);

    void deleteByDocument(Document document);

    boolean existsByDocument(Document document);

    int countByDocument(Document document);
}
