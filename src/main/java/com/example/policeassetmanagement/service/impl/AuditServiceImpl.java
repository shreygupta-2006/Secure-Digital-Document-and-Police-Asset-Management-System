package com.example.policeassetmanagement.service.impl;

import com.example.policeassetmanagement.dto.response.AuditLogResponse;
import com.example.policeassetmanagement.entity.AuditLog;
import com.example.policeassetmanagement.entity.User;
import com.example.policeassetmanagement.exception.ResourceNotFoundException;
import com.example.policeassetmanagement.repository.AuditLogRepository;
import com.example.policeassetmanagement.repository.UserRepository;
import com.example.policeassetmanagement.service.AuditService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class AuditServiceImpl implements AuditService {

    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;

    @Override
    public AuditLogResponse createAuditLog(String action, String entityType, Long entityId,
                                            Long userId, String description, String ipAddress) {
        User user = null;
        if (userId != null) {
            user = userRepository.findById(userId).orElse(null);
        }

        AuditLog auditLog = AuditLog.builder()
                .action(action)
                .entityType(entityType)
                .entityId(entityId)
                .user(user)
                .description(description)
                .ipAddress(ipAddress)
                .build();

        AuditLog saved = auditLogRepository.save(auditLog);
        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AuditLogResponse> getAuditLogsByUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        return auditLogRepository.findByUserOrderByTimestampDesc(user)
                .stream().map(this::mapToResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<AuditLogResponse> getAuditLogsByEntity(String entityType, Long entityId) {
        return auditLogRepository.findByEntityTypeAndEntityIdOrderByTimestampDesc(entityType, entityId)
                .stream().map(this::mapToResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<AuditLogResponse> getAllAuditLogs() {
        return auditLogRepository.findAll().stream().map(this::mapToResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<AuditLogResponse> searchAuditLogs(String action, String entityType, Long entityId,
                                                   Long userId, LocalDateTime from, LocalDateTime to) {
        return auditLogRepository.searchAuditLogsNoDate(action, entityType, entityId, userId)
                .stream().filter(log -> {
                    if (from != null && log.getTimestamp().isBefore(from)) return false;
                    if (to != null && log.getTimestamp().isAfter(to)) return false;
                    return true;
                }).map(this::mapToResponse).toList();
    }

    private AuditLogResponse mapToResponse(AuditLog auditLog) {
        return AuditLogResponse.builder()
                .id(auditLog.getId())
                .userId(auditLog.getUser() != null ? auditLog.getUser().getId() : null)
                .userName(auditLog.getUser() != null ? auditLog.getUser().getName() : "SYSTEM")
                .action(auditLog.getAction())
                .entityType(auditLog.getEntityType())
                .entityId(auditLog.getEntityId())
                .description(auditLog.getDescription())
                .ipAddress(auditLog.getIpAddress())
                .timestamp(auditLog.getTimestamp())
                .build();
    }
}
