package com.example.policeassetmanagement.security;

import com.example.policeassetmanagement.entity.Document;
import com.example.policeassetmanagement.entity.User;
import com.example.policeassetmanagement.entity.enums.Role;
import com.example.policeassetmanagement.repository.AssetAssignmentRepository;
import com.example.policeassetmanagement.repository.CaseAssignmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Central, server-side, assignment-aware authorization checks.
 *
 * These checks are the single source of truth for "who can see/do what" for
 * assets and case-scoped documents. They are enforced in the service layer
 * (never only in the frontend) so that direct API calls cannot bypass them.
 *
 * Current policy (matches the RBAC audit findings):
 *  - ADMIN: unrestricted access to all assets and all documents.
 *  - STORE_KEEPER / AUDITOR / VIEWER: retain their existing, previously-working
 *    broad read access (unchanged by this audit — no issue was reported for
 *    these roles).
 *  - OFFICER: assignment-aware access only.
 *      * Assets: only assets with an ACTIVE AssetAssignment to that officer.
 *      * Documents: only documents attached to a Case for which the officer
 *        has an ACTIVE CaseAssignment. Documents with no case at all are
 *        NOT visible to a scoped officer (per the "documents must not be
 *        globally visible" requirement).
 */
@Component
@RequiredArgsConstructor
public class AccessControlService {

    private static final String ACTIVE = "ACTIVE";

    private final AssetAssignmentRepository assetAssignmentRepository;
    private final CaseAssignmentRepository caseAssignmentRepository;

    // ---------------------------------------------------------------
    // Assets
    // ---------------------------------------------------------------

    /** True if this user's asset visibility must be restricted to their own assignments. */
    public boolean isAssetScoped(User user) {
        return user.getRole() == Role.OFFICER;
    }

    /** IDs of assets currently (ACTIVE-ly) assigned to this user. */
    public List<Long> getAssignedAssetIds(User user) {
        return assetAssignmentRepository.findAssetIdsByAssignedToIdAndStatus(user.getId(), ACTIVE);
    }

    /** Whether the given user is allowed to view/act on the given asset. */
    public boolean canAccessAsset(User user, Long assetId) {
        if (!isAssetScoped(user)) {
            return true;
        }
        return getAssignedAssetIds(user).contains(assetId);
    }

    // ---------------------------------------------------------------
    // Documents / Cases
    // ---------------------------------------------------------------

    /** True if this user's document visibility must be restricted to their assigned cases. */
    public boolean isDocumentScoped(User user) {
        return user.getRole() == Role.OFFICER;
    }

    /** IDs of cases this user is currently (ACTIVE-ly) assigned to. */
    public List<Long> getAssignedCaseIds(User user) {
        return caseAssignmentRepository.findCaseIdsByUserIdAndStatus(user.getId(), ACTIVE);
    }

    /** Whether the given user is allowed to view/act on the given document. */
    public boolean canAccessDocument(User user, Document document) {
        if (!isDocumentScoped(user)) {
            return true;
        }
        if (document.getCaseEntity() == null) {
            // A case-scoped officer has no assignment context for a caseless
            // document, so it must not be visible to them.
            return false;
        }
        return getAssignedCaseIds(user).contains(document.getCaseEntity().getId());
    }

    public boolean canAccessCase(User user, Long caseId) {
        if (!isDocumentScoped(user)) {
            return true;
        }
        return getAssignedCaseIds(user).contains(caseId);
    }
}
