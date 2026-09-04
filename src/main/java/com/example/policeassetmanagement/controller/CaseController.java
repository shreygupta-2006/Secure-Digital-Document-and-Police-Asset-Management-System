package com.example.policeassetmanagement.controller;

import com.example.policeassetmanagement.dto.request.CaseAssignmentRequest;
import com.example.policeassetmanagement.dto.request.CaseRequest;
import com.example.policeassetmanagement.dto.response.CaseAssignmentResponse;
import com.example.policeassetmanagement.dto.response.CaseResponse;
import com.example.policeassetmanagement.security.SecurityHelper;
import com.example.policeassetmanagement.service.CaseService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cases")
@RequiredArgsConstructor
public class CaseController {

    private final CaseService caseService;
    private final SecurityHelper securityHelper;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CaseResponse> createCase(@Valid @RequestBody CaseRequest request,
                                                    HttpServletRequest httpRequest) {
        Long userId = securityHelper.getCurrentUserId();
        CaseResponse response = caseService.createCase(request, userId, getIp(httpRequest));
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<CaseResponse>> getCases() {
        Long userId = securityHelper.getCurrentUserId();
        return ResponseEntity.ok(caseService.getCases(userId));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<CaseResponse> getCaseById(@PathVariable Long id) {
        Long userId = securityHelper.getCurrentUserId();
        return ResponseEntity.ok(caseService.getCaseById(id, userId));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CaseResponse> updateCase(@PathVariable Long id,
                                                    @Valid @RequestBody CaseRequest request,
                                                    HttpServletRequest httpRequest) {
        Long userId = securityHelper.getCurrentUserId();
        return ResponseEntity.ok(caseService.updateCase(id, request, userId, getIp(httpRequest)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteCase(@PathVariable Long id, HttpServletRequest httpRequest) {
        Long userId = securityHelper.getCurrentUserId();
        caseService.deleteCase(id, userId, getIp(httpRequest));
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{caseId}/assign")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CaseAssignmentResponse> assignOfficer(
            @PathVariable Long caseId,
            @Valid @RequestBody CaseAssignmentRequest request,
            HttpServletRequest httpRequest) {
        Long userId = securityHelper.getCurrentUserId();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(caseService.assignOfficer(caseId, request, userId, getIp(httpRequest)));
    }

    @PostMapping("/{caseId}/assignments/{assignmentId}/complete")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CaseAssignmentResponse> completeAssignment(
            @PathVariable Long caseId,
            @PathVariable Long assignmentId,
            HttpServletRequest httpRequest) {
        Long userId = securityHelper.getCurrentUserId();
        return ResponseEntity.ok(caseService.completeAssignment(caseId, assignmentId,
                userId, getIp(httpRequest)));
    }

    @GetMapping("/{caseId}/assignments")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<CaseAssignmentResponse>> getAssignments(@PathVariable Long caseId) {
        Long userId = securityHelper.getCurrentUserId();
        return ResponseEntity.ok(caseService.getAssignments(caseId, userId));
    }

    private String getIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        return xff != null ? xff.split(",")[0].trim() : request.getRemoteAddr();
    }
}
