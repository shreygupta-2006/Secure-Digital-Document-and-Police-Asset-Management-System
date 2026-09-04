package com.example.policeassetmanagement.service.impl;

import com.example.policeassetmanagement.dto.request.CaseAssignmentRequest;
import com.example.policeassetmanagement.dto.request.CaseRequest;
import com.example.policeassetmanagement.dto.response.CaseAssignmentResponse;
import com.example.policeassetmanagement.dto.response.CaseResponse;
import com.example.policeassetmanagement.entity.Case;
import com.example.policeassetmanagement.entity.CaseAssignment;
import com.example.policeassetmanagement.entity.User;
import com.example.policeassetmanagement.entity.enums.Role;
import com.example.policeassetmanagement.entity.enums.UserStatus;
import com.example.policeassetmanagement.exception.BadRequestException;
import com.example.policeassetmanagement.exception.ResourceNotFoundException;
import com.example.policeassetmanagement.repository.CaseAssignmentRepository;
import com.example.policeassetmanagement.repository.CaseRepository;
import com.example.policeassetmanagement.repository.DocumentRepository;
import com.example.policeassetmanagement.repository.UserRepository;
import com.example.policeassetmanagement.security.AccessControlService;
import com.example.policeassetmanagement.service.AuditService;
import com.example.policeassetmanagement.service.CaseService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class CaseServiceImpl implements CaseService {

    private final CaseRepository caseRepository;
    private final CaseAssignmentRepository caseAssignmentRepository;
    private final UserRepository userRepository;
    private final AccessControlService accessControlService;
    private final AuditService auditService;
    private final DocumentRepository documentRepository;

    @Override
    public CaseResponse createCase(CaseRequest request, Long userId, String ip) {
        if (caseRepository.existsByCaseNumber(request.getCaseNumber())) {
            throw new BadRequestException("Case number already exists: " + request.getCaseNumber());
        }

        Case caseEntity = Case.builder()
                .caseNumber(request.getCaseNumber())
                .title(request.getTitle())
                .description(request.getDescription())
                .status(request.getStatus() != null ? request.getStatus() : "OPEN")
                .build();
        Case saved = caseRepository.save(caseEntity);

        auditService.createAuditLog("CASE_CREATED", "Case", saved.getId(),
                userId, "Case created: " + saved.getCaseNumber(), ip);

        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CaseResponse> getCases(Long currentUserId) {
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", currentUserId));

        List<Case> cases;

        if (accessControlService.isDocumentScoped(currentUser)) {
            // OFFICER: only cases they are assigned to
            List<Long> assignedCaseIds = accessControlService.getAssignedCaseIds(currentUser);
            if (assignedCaseIds.isEmpty()) {
                return List.of();
            }
            cases = caseRepository.findAllById(assignedCaseIds);
        } else {
            // ADMIN / STORE_KEEPER / AUDITOR / VIEWER: see all cases
            cases = caseRepository.findAll();
        }

        return cases.stream().map(this::mapToResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public CaseResponse getCaseById(Long id, Long currentUserId) {
        Case caseEntity = caseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Case", "id", id));
        assertCaseAccessible(caseEntity, currentUserId);
        return mapToResponse(caseEntity);
    }

    @Override
    public CaseResponse updateCase(Long id, CaseRequest request, Long userId, String ip) {
        Case caseEntity = caseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Case", "id", id));

        if (!caseEntity.getCaseNumber().equals(request.getCaseNumber()) &&
                caseRepository.existsByCaseNumber(request.getCaseNumber())) {
            throw new BadRequestException("Case number already exists: " + request.getCaseNumber());
        }

        caseEntity.setCaseNumber(request.getCaseNumber());
        caseEntity.setTitle(request.getTitle());
        caseEntity.setDescription(request.getDescription());
        if (request.getStatus() != null) {
            caseEntity.setStatus(request.getStatus());
        }

        Case updated = caseRepository.save(caseEntity);

        auditService.createAuditLog("CASE_UPDATED", "Case", updated.getId(),
                userId, "Case updated: " + updated.getCaseNumber(), ip);

        return mapToResponse(updated);
    }

    @Override
    public void deleteCase(Long id, Long userId, String ip) {
        Case caseEntity = caseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Case", "id", id));

        // Unlink documents from this case (set case_id to null) before deleting
        List<com.example.policeassetmanagement.entity.Document> linkedDocs =
                documentRepository.findByCaseEntityId(id);
        for (com.example.policeassetmanagement.entity.Document doc : linkedDocs) {
            doc.setCaseEntity(null);
            documentRepository.save(doc);
        }

        // Delete all assignments (satisfies FK constraint before case delete)
        List<CaseAssignment> allAssignments = caseAssignmentRepository.findByCaseEntity(caseEntity);
        caseAssignmentRepository.deleteAll(allAssignments);

        caseRepository.deleteById(id);

        auditService.createAuditLog("CASE_DELETED", "Case", id,
                userId, "Case deleted: " + caseEntity.getCaseNumber(), ip);
    }

    @Override
    public CaseAssignmentResponse assignOfficer(Long caseId, CaseAssignmentRequest request,
                                                  Long userId, String ip) {
        Case caseEntity = caseRepository.findById(caseId)
                .orElseThrow(() -> new ResourceNotFoundException("Case", "id", caseId));

        User officer = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", request.getUserId()));

        // Validate the officer is eligible
        if (officer.getRole() != Role.OFFICER) {
            throw new BadRequestException("Only users with OFFICER role can be assigned to cases");
        }
        if (officer.getStatus() != UserStatus.ACTIVE) {
            throw new BadRequestException("Cannot assign an inactive officer to a case");
        }

        // Prevent duplicate active assignment
        boolean alreadyAssigned = caseAssignmentRepository
                .existsByCaseEntityAndUserAndStatus(caseEntity, officer, "ACTIVE");
        if (alreadyAssigned) {
            throw new BadRequestException("Officer is already actively assigned to this case");
        }

        CaseAssignment assignment = CaseAssignment.builder()
                .caseEntity(caseEntity)
                .user(officer)
                .status("ACTIVE")
                .remarks(request.getRemarks())
                .build();
        CaseAssignment saved = caseAssignmentRepository.save(assignment);

        auditService.createAuditLog("CASE_OFFICER_ASSIGNED", "CaseAssignment", saved.getId(),
                userId, "Officer " + officer.getName() + " assigned to case " + caseEntity.getCaseNumber(), ip);

        return mapAssignmentToResponse(saved);
    }

    @Override
    public CaseAssignmentResponse completeAssignment(Long caseId, Long assignmentId,
                                                       Long userId, String ip) {
        Case caseEntity = caseRepository.findById(caseId)
                .orElseThrow(() -> new ResourceNotFoundException("Case", "id", caseId));

        CaseAssignment assignment = caseAssignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("CaseAssignment", "id", assignmentId));

        if (!assignment.getCaseEntity().getId().equals(caseId)) {
            throw new BadRequestException("Assignment does not belong to this case");
        }
        if ("COMPLETED".equals(assignment.getStatus())) {
            throw new BadRequestException("Assignment is already completed");
        }

        assignment.setStatus("COMPLETED");
        CaseAssignment saved = caseAssignmentRepository.save(assignment);

        auditService.createAuditLog("CASE_ASSIGNMENT_COMPLETED", "CaseAssignment", saved.getId(),
                userId, "Assignment completed for " + assignment.getUser().getName()
                        + " on case " + caseEntity.getCaseNumber(), ip);

        return mapAssignmentToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CaseAssignmentResponse> getAssignments(Long caseId, Long currentUserId) {
        Case caseEntity = caseRepository.findById(caseId)
                .orElseThrow(() -> new ResourceNotFoundException("Case", "id", caseId));
        assertCaseAccessible(caseEntity, currentUserId);

        List<CaseAssignment> assignments = caseAssignmentRepository.findByCaseEntity(caseEntity);
        return assignments.stream().map(this::mapAssignmentToResponse).toList();
    }

    // ---------------------------------------------------------------
    // Access control
    // ---------------------------------------------------------------

    private void assertCaseAccessible(Case caseEntity, Long currentUserId) {
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", currentUserId));
        if (!accessControlService.canAccessCase(currentUser, caseEntity.getId())) {
            throw new ResourceNotFoundException("Case", "id", caseEntity.getId());
        }
    }

    // ---------------------------------------------------------------
    // Mapping helpers
    // ---------------------------------------------------------------

    private CaseResponse mapToResponse(Case caseEntity) {
        List<CaseAssignmentResponse> assignments = caseAssignmentRepository
                .findByCaseEntity(caseEntity).stream()
                .map(this::mapAssignmentToResponse)
                .toList();

        return CaseResponse.builder()
                .id(caseEntity.getId())
                .caseNumber(caseEntity.getCaseNumber())
                .title(caseEntity.getTitle())
                .description(caseEntity.getDescription())
                .status(caseEntity.getStatus())
                .createdAt(caseEntity.getCreatedAt())
                .updatedAt(caseEntity.getUpdatedAt())
                .assignments(assignments)
                .build();
    }

    private CaseAssignmentResponse mapAssignmentToResponse(CaseAssignment assignment) {
        return CaseAssignmentResponse.builder()
                .id(assignment.getId())
                .caseId(assignment.getCaseEntity().getId())
                .caseNumber(assignment.getCaseEntity().getCaseNumber())
                .userId(assignment.getUser().getId())
                .userName(assignment.getUser().getName())
                .userRole(assignment.getUser().getRole().name())
                .status(assignment.getStatus())
                .remarks(assignment.getRemarks())
                .createdAt(assignment.getCreatedAt())
                .build();
    }
}
