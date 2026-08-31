package com.example.policeassetmanagement.repository;

import com.example.policeassetmanagement.entity.AuditLog;
import com.example.policeassetmanagement.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    List<AuditLog> findByUserOrderByTimestampDesc(User user);

    List<AuditLog> findByEntityTypeAndEntityIdOrderByTimestampDesc(String entityType, Long entityId);

    List<AuditLog> findByActionOrderByTimestampDesc(String action);

    List<AuditLog> findByEntityTypeOrderByTimestampDesc(String entityType);

    List<AuditLog> findByUserIdOrderByTimestampDesc(Long userId);

    @Query("SELECT a FROM AuditLog a WHERE " +
           "(:action IS NULL OR a.action = :action) AND " +
           "(:entityType IS NULL OR a.entityType = :entityType) AND " +
           "(:entityId IS NULL OR a.entityId = :entityId) AND " +
           "(:userId IS NULL OR a.user.id = :userId) " +
           "ORDER BY a.timestamp DESC")
    List<AuditLog> searchAuditLogsNoDate(@Param("action") String action,
                                         @Param("entityType") String entityType,
                                         @Param("entityId") Long entityId,
                                         @Param("userId") Long userId);
}
