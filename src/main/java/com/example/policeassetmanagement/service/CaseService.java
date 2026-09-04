package com.example.policeassetmanagement.service;

import com.example.policeassetmanagement.dto.request.CaseAssignmentRequest;
import com.example.policeassetmanagement.dto.request.CaseRequest;
import com.example.policeassetmanagement.dto.response.CaseAssignmentResponse;
import com.example.policeassetmanagement.dto.response.CaseResponse;

import java.util.List;

public interface CaseService {

    CaseResponse createCase(CaseRequest request, Long userId, String ip);

    List<CaseResponse> getCases(Long currentUserId);

    CaseResponse getCaseById(Long id, Long currentUserId);

    CaseResponse updateCase(Long id, CaseRequest request, Long userId, String ip);

    void deleteCase(Long id, Long userId, String ip);

    CaseAssignmentResponse assignOfficer(Long caseId, CaseAssignmentRequest request,
                                           Long userId, String ip);

    CaseAssignmentResponse completeAssignment(Long caseId, Long assignmentId,
                                                Long userId, String ip);

    List<CaseAssignmentResponse> getAssignments(Long caseId, Long currentUserId);
}
