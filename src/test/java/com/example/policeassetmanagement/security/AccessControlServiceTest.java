package com.example.policeassetmanagement.security;

import com.example.policeassetmanagement.entity.Case;
import com.example.policeassetmanagement.entity.Document;
import com.example.policeassetmanagement.entity.User;
import com.example.policeassetmanagement.entity.enums.Role;
import com.example.policeassetmanagement.repository.AssetAssignmentRepository;
import com.example.policeassetmanagement.repository.CaseAssignmentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link AccessControlService} — the single source of truth
 * for assignment-aware RBAC decisions. These are pure unit tests (repos are
 * mocked) so they exercise the authorization RULES directly and run fast
 * without any database.
 */
@ExtendWith(MockitoExtension.class)
class AccessControlServiceTest {

    @Mock
    private AssetAssignmentRepository assetAssignmentRepository;

    @Mock
    private CaseAssignmentRepository caseAssignmentRepository;

    private AccessControlService accessControlService;

    private User admin;
    private User officer;
    private User storeKeeper;

    @BeforeEach
    void setUp() {
        accessControlService = new AccessControlService(assetAssignmentRepository, caseAssignmentRepository);

        admin = User.builder().id(1L).role(Role.ADMIN).build();
        officer = User.builder().id(2L).role(Role.OFFICER).build();
        storeKeeper = User.builder().id(3L).role(Role.STORE_KEEPER).build();
    }

    // ---------------------------------------------------------------
    // Assets
    // ---------------------------------------------------------------

    @Test
    void adminIsNeverAssetScoped() {
        assertThat(accessControlService.isAssetScoped(admin)).isFalse();
    }

    @Test
    void officerIsAssetScoped() {
        assertThat(accessControlService.isAssetScoped(officer)).isTrue();
    }

    @Test
    void adminCanAccessAnyAsset_withoutQueryingAssignments() {
        boolean result = accessControlService.canAccessAsset(admin, 999L);
        assertThat(result).isTrue();
    }

    @Test
    void officerWithNoAssignments_cannotAccessAnyAsset() {
        when(assetAssignmentRepository.findAssetIdsByAssignedToIdAndStatus(2L, "ACTIVE"))
                .thenReturn(List.of());

        assertThat(accessControlService.canAccessAsset(officer, 1L)).isFalse();
        assertThat(accessControlService.getAssignedAssetIds(officer)).isEmpty();
    }

    @Test
    void officerCanAccessOnlyTheirOwnAssignedAsset() {
        when(assetAssignmentRepository.findAssetIdsByAssignedToIdAndStatus(2L, "ACTIVE"))
                .thenReturn(List.of(10L));

        assertThat(accessControlService.canAccessAsset(officer, 10L)).isTrue();
        assertThat(accessControlService.canAccessAsset(officer, 20L)).isFalse();
    }

    // ---------------------------------------------------------------
    // Documents / Cases
    // ---------------------------------------------------------------

    @Test
    void adminCanAccessAnyDocument_evenWithoutCase() {
        Document caselessDoc = Document.builder().id(1L).caseEntity(null).build();
        assertThat(accessControlService.canAccessDocument(admin, caselessDoc)).isTrue();
    }

    @Test
    void officerWithNoCaseAssignments_cannotAccessAnyDocument() {
        Case case1 = Case.builder().id(100L).build();
        Document doc = Document.builder().id(1L).caseEntity(case1).build();

        when(caseAssignmentRepository.findCaseIdsByUserIdAndStatus(2L, "ACTIVE"))
                .thenReturn(List.of());

        assertThat(accessControlService.canAccessDocument(officer, doc)).isFalse();
    }

    @Test
    void officerCannotAccessCaselessDocument_evenWhenScoped() {
        Document caselessDoc = Document.builder().id(1L).caseEntity(null).build();
        assertThat(accessControlService.canAccessDocument(officer, caselessDoc)).isFalse();
    }

    @Test
    void officerCanAccessDocumentOfAssignedCase_butNotOtherCase() {
        Case caseA = Case.builder().id(100L).build();
        Case caseB = Case.builder().id(200L).build();
        Document docForCaseA = Document.builder().id(1L).caseEntity(caseA).build();
        Document docForCaseB = Document.builder().id(2L).caseEntity(caseB).build();

        when(caseAssignmentRepository.findCaseIdsByUserIdAndStatus(2L, "ACTIVE"))
                .thenReturn(List.of(100L));

        assertThat(accessControlService.canAccessDocument(officer, docForCaseA)).isTrue();
        assertThat(accessControlService.canAccessDocument(officer, docForCaseB)).isFalse();
    }

    @Test
    void twoOfficersAssignedSameCase_bothCanAccessItsDocuments() {
        User officerB = User.builder().id(4L).role(Role.OFFICER).build();
        Case sharedCase = Case.builder().id(300L).build();
        Document doc = Document.builder().id(3L).caseEntity(sharedCase).build();

        when(caseAssignmentRepository.findCaseIdsByUserIdAndStatus(2L, "ACTIVE"))
                .thenReturn(List.of(300L));
        when(caseAssignmentRepository.findCaseIdsByUserIdAndStatus(4L, "ACTIVE"))
                .thenReturn(List.of(300L));

        assertThat(accessControlService.canAccessDocument(officer, doc)).isTrue();
        assertThat(accessControlService.canAccessDocument(officerB, doc)).isTrue();
    }

    @Test
    void storeKeeperIsNotDocumentScoped_retainsExistingBroadAccess() {
        // No issue was reported for STORE_KEEPER's document visibility; this
        // pins current (unchanged) behavior so a future change doesn't
        // silently widen or narrow it without a failing test.
        assertThat(accessControlService.isDocumentScoped(storeKeeper)).isFalse();
        Document doc = Document.builder().id(1L).caseEntity(null).build();
        assertThat(accessControlService.canAccessDocument(storeKeeper, doc)).isTrue();
    }
}
