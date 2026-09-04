package com.example.policeassetmanagement.repository;

import com.example.policeassetmanagement.entity.Document;
import com.example.policeassetmanagement.entity.enums.DocumentType;
import com.example.policeassetmanagement.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentRepository extends JpaRepository<Document, Long> {

    List<Document> findByUploadedBy(User user);

    List<Document> findByIdIn(List<Long> ids);

    List<Document> findByCaseEntityIdIn(List<Long> caseIds);

    List<Document> findByCaseEntityId(Long caseId);

    List<Document> findByDocumentType(DocumentType documentType);

    List<Document> findByTitleContainingIgnoreCase(String title);

    @Query("SELECT d FROM Document d WHERE " +
           "LOWER(d.title) LIKE LOWER(CONCAT('%', :title, '%'))")
    List<Document> searchByTitle(@Param("title") String title);

    @Query("SELECT d FROM Document d WHERE d.documentType = :type")
    List<Document> searchByType(@Param("type") DocumentType type);

    @Query("SELECT d FROM Document d WHERE d.fileHash = :hash")
    List<Document> searchByHash(@Param("hash") String hash);

    @Query("SELECT d FROM Document d WHERE " +
           "LOWER(d.title) LIKE LOWER(CONCAT('%', :title, '%')) AND " +
           "d.documentType = :type")
    List<Document> searchByTitleAndType(@Param("title") String title, @Param("type") DocumentType type);

    @Query("SELECT d FROM Document d WHERE " +
           "LOWER(d.title) LIKE LOWER(CONCAT('%', :title, '%')) AND " +
           "d.fileHash = :hash")
    List<Document> searchByTitleAndHash(@Param("title") String title, @Param("hash") String hash);

    @Query("SELECT d FROM Document d WHERE " +
           "d.documentType = :type AND d.fileHash = :hash")
    List<Document> searchByTypeAndHash(@Param("type") DocumentType type, @Param("hash") String hash);

    @Query("SELECT d FROM Document d WHERE " +
           "LOWER(d.title) LIKE LOWER(CONCAT('%', :title, '%')) AND " +
           "d.documentType = :type AND " +
           "d.fileHash = :hash")
    List<Document> searchByTitleAndTypeAndHash(@Param("title") String title,
                                               @Param("type") DocumentType type,
                                               @Param("hash") String hash);
}
