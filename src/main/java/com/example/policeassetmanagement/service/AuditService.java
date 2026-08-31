package com.example.policeassetmanagement.service;

import com.example.policeassetmanagement.dto.response.AuditLogResponse;

import java.time.LocalDateTime;
import java.util.List;

public interface AuditService {

    AuditLogResponse createAuditLog(String action, String entityType, Long entityId,
                                     Long userId, String description, String ipAddress);

    List<AuditLogResponse> getAuditLogsByUser(Long userId);

    List<AuditLogResponse> getAuditLogsByEntity(String entityType, Long entityId);

    List<AuditLogResponse> getAllAuditLogs();

    List<AuditLogResponse> searchAuditLogs(String action, String entityType, Long entityId,
                                            Long userId, LocalDateTime from, LocalDateTime to);
}
