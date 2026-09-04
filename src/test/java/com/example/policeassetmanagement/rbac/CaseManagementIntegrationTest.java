package com.example.policeassetmanagement.rbac;

import com.example.policeassetmanagement.entity.Case;
import com.example.policeassetmanagement.entity.Document;
import com.example.policeassetmanagement.entity.User;
import com.example.policeassetmanagement.entity.enums.DocumentType;
import com.example.policeassetmanagement.entity.enums.Role;
import com.example.policeassetmanagement.entity.enums.UserStatus;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Tests 1–18 from the acceptance criteria:
 * Case creation, assignment, officer isolation, document isolation,
 * duplicate assignment prevention, pending officer rejection, and
 * unauthorized access.
 */
class CaseManagementIntegrationTest extends AbstractRbacIntegrationTest {

    // ---------------------------------------------------------------
    // TEST 1: Admin can create a case
    // ---------------------------------------------------------------

    @Test
    void admin_canCreateCase() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of(
                "caseNumber", "CASE-T1-001",
                "title", "Test Case 1",
                "description", "Integration test case",
                "status", "OPEN"
        ));

        mockMvc.perform(post("/api/cases")
                        .header("Authorization", bearer(adminToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.caseNumber").value("CASE-T1-001"))
                .andExpect(jsonPath("$.title").value("Test Case 1"))
                .andExpect(jsonPath("$.status").value("OPEN"));
    }

    // ---------------------------------------------------------------
    // TEST 2–3: Admin can assign Officer A to Case A, Officer B to Case B
    // ---------------------------------------------------------------

    @Test
    void admin_canAssignOfficersToCases() throws Exception {
        // Create two cases
        Case caseA = createCase(unique("CASE-A"));
        Case caseB = createCase(unique("CASE-B"));

        User officerA = createActiveUser("Case Officer A", Role.OFFICER);
        User officerB = createActiveUser("Case Officer B", Role.OFFICER);

        String tokenA = login(officerA.getEmail(), DEFAULT_PASSWORD);
        String tokenB = login(officerB.getEmail(), DEFAULT_PASSWORD);

        // Admin assigns Officer A to Case A
        String assignBody = objectMapper.writeValueAsString(Map.of("userId", officerA.getId()));
        mockMvc.perform(post("/api/cases/" + caseA.getId() + "/assign")
                        .header("Authorization", bearer(adminToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(assignBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.userId").value(officerA.getId()))
                .andExpect(jsonPath("$.status").value("ACTIVE"));

        // Admin assigns Officer B to Case B
        String assignBodyB = objectMapper.writeValueAsString(Map.of("userId", officerB.getId()));
        mockMvc.perform(post("/api/cases/" + caseB.getId() + "/assign")
                        .header("Authorization", bearer(adminToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(assignBodyB))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.userId").value(officerB.getId()));
    }

    // ---------------------------------------------------------------
    // TEST 4–6: Officer can access assigned case, not unassigned case
    // ---------------------------------------------------------------

    @Test
    void officerA_canAccessCaseA_notCaseB() throws Exception {
        Case caseA = createCase(unique("CASE-ACC-A"));
        Case caseB = createCase(unique("CASE-ACC-B"));

        User officerA = createActiveUser("Access Officer A", Role.OFFICER);
        assignCase(caseA, officerA);
        String tokenA = login(officerA.getEmail(), DEFAULT_PASSWORD);

        // Officer A can access Case A
        mockMvc.perform(get("/api/cases/" + caseA.getId())
                        .header("Authorization", bearer(tokenA)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.caseNumber").value(caseA.getCaseNumber()));

        // Officer A cannot access Case B (returns 404 to prevent enumeration)
        mockMvc.perform(get("/api/cases/" + caseB.getId())
                        .header("Authorization", bearer(tokenA)))
                .andExpect(status().isNotFound());
    }

    @Test
    void officerB_canAccessCaseB_notCaseA() throws Exception {
        Case caseA = createCase(unique("CASE-BACC-A"));
        Case caseB = createCase(unique("CASE-BACC-B"));

        User officerB = createActiveUser("Access Officer B", Role.OFFICER);
        assignCase(caseB, officerB);
        String tokenB = login(officerB.getEmail(), DEFAULT_PASSWORD);

        // Officer B can access Case B
        mockMvc.perform(get("/api/cases/" + caseB.getId())
                        .header("Authorization", bearer(tokenB)))
                .andExpect(status().isOk());

        // Officer B cannot access Case A
        mockMvc.perform(get("/api/cases/" + caseA.getId())
                        .header("Authorization", bearer(tokenB)))
                .andExpect(status().isNotFound());
    }

    // ---------------------------------------------------------------
    // TEST 7: Officer with no assignments sees zero cases
    // ---------------------------------------------------------------

    @Test
    void officerWithNoAssignments_seesZeroCases() throws Exception {
        createCase(unique("CASE-NOASG"));
        User unassigned = createActiveUser("Unassigned Officer", Role.OFFICER);
        String token = login(unassigned.getEmail(), DEFAULT_PASSWORD);

        mockMvc.perform(get("/api/cases")
                        .header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    // ---------------------------------------------------------------
    // TEST 8: Two officers assigned same case both see it
    // ---------------------------------------------------------------

    @Test
    void twoOfficersSharedCase_bothSeeIt() throws Exception {
        Case shared = createCase(unique("CASE-SHARED"));
        User officerA = createActiveUser("Shared Case A", Role.OFFICER);
        User officerB = createActiveUser("Shared Case B", Role.OFFICER);
        assignCase(shared, officerA);
        assignCase(shared, officerB);

        String tokenA = login(officerA.getEmail(), DEFAULT_PASSWORD);
        String tokenB = login(officerB.getEmail(), DEFAULT_PASSWORD);

        mockMvc.perform(get("/api/cases/" + shared.getId())
                        .header("Authorization", bearer(tokenA)))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/cases/" + shared.getId())
                        .header("Authorization", bearer(tokenB)))
                .andExpect(status().isOk());
    }

    // ---------------------------------------------------------------
    // TEST 9–11: Document isolation via case assignments
    // ---------------------------------------------------------------

    @Test
    void officerA_canAccessCaseA_documents_notCaseB() throws Exception {
        User uploader = userRepository.findById(adminId).orElseThrow();
        Case caseA = createCase(unique("CASE-DOC-A"));
        Case caseB = createCase(unique("CASE-DOC-B"));
        Document docA = createDocumentForCase("Case A Doc", caseA, uploader);
        createDocumentForCase("Case B Doc", caseB, uploader);

        User officerA = createActiveUser("Doc Officer A", Role.OFFICER);
        assignCase(caseA, officerA);
        String tokenA = login(officerA.getEmail(), DEFAULT_PASSWORD);

        // Officer A sees 1 document (Case A only)
        mockMvc.perform(get("/api/documents")
                        .header("Authorization", bearer(tokenA)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(docA.getId()));

        // Officer A cannot access Case B document by ID
        mockMvc.perform(get("/api/documents/" + createDocumentForCase("X", caseB, uploader).getId())
                        .header("Authorization", bearer(tokenA)))
                .andExpect(status().isNotFound());
    }

    @Test
    void officerWithNoCaseAssignments_seesZeroDocuments() throws Exception {
        User uploader = userRepository.findById(adminId).orElseThrow();
        Case someCase = createCase(unique("CASE-NODOC"));
        createDocumentForCase("Secret Doc", someCase, uploader);

        User unassigned = createActiveUser("No Doc Officer", Role.OFFICER);
        String token = login(unassigned.getEmail(), DEFAULT_PASSWORD);

        mockMvc.perform(get("/api/documents")
                        .header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    // ---------------------------------------------------------------
    // TEST 12: Duplicate active assignment is rejected
    // ---------------------------------------------------------------

    @Test
    void duplicateActiveAssignment_rejected() throws Exception {
        Case caseEntity = createCase(unique("CASE-DUP"));
        User officer = createActiveUser("Dup Officer", Role.OFFICER);

        String assignBody = objectMapper.writeValueAsString(Map.of("userId", officer.getId()));

        // First assignment succeeds
        mockMvc.perform(post("/api/cases/" + caseEntity.getId() + "/assign")
                        .header("Authorization", bearer(adminToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(assignBody))
                .andExpect(status().isCreated());

        // Second assignment of same officer to same case is rejected
        mockMvc.perform(post("/api/cases/" + caseEntity.getId() + "/assign")
                        .header("Authorization", bearer(adminToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(assignBody))
                .andExpect(status().isBadRequest());
    }

    // ---------------------------------------------------------------
    // TEST 13: Pending officer cannot be assigned
    // ---------------------------------------------------------------

    @Test
    void pendingOfficer_cannotBeAssigned() throws Exception {
        Case caseEntity = createCase(unique("CASE-PEND"));

        User pending = User.builder()
                .name("Pending Officer")
                .email(unique("pending.officer") + "@test.com")
                .password(passwordEncoder.encode(DEFAULT_PASSWORD))
                .role(Role.OFFICER)
                .status(UserStatus.PENDING)
                .build();
        pending = userRepository.save(pending);

        String assignBody = objectMapper.writeValueAsString(Map.of("userId", pending.getId()));

        mockMvc.perform(post("/api/cases/" + caseEntity.getId() + "/assign")
                        .header("Authorization", bearer(adminToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(assignBody))
                .andExpect(status().isBadRequest());
    }

    // ---------------------------------------------------------------
    // TEST 14: Rejected officer cannot be assigned
    // ---------------------------------------------------------------

    @Test
    void rejectedOfficer_cannotBeAssigned() throws Exception {
        Case caseEntity = createCase(unique("CASE-REJ"));

        User rejected = User.builder()
                .name("Rejected Officer")
                .email(unique("rejected.officer") + "@test.com")
                .password(passwordEncoder.encode(DEFAULT_PASSWORD))
                .role(Role.OFFICER)
                .status(UserStatus.REJECTED)
                .build();
        rejected = userRepository.save(rejected);

        String assignBody = objectMapper.writeValueAsString(Map.of("userId", rejected.getId()));

        mockMvc.perform(post("/api/cases/" + caseEntity.getId() + "/assign")
                        .header("Authorization", bearer(adminToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(assignBody))
                .andExpect(status().isBadRequest());
    }

    // ---------------------------------------------------------------
    // TEST 15: Non-admin cannot assign a case
    // ---------------------------------------------------------------

    @Test
    void officer_cannotAssignCase() throws Exception {
        Case caseEntity = createCase(unique("CASE-NOASG-OFF"));
        User officer = createActiveUser("Non-Admin Assigner", Role.OFFICER);
        String token = login(officer.getEmail(), DEFAULT_PASSWORD);

        User targetOfficer = createActiveUser("Target Officer", Role.OFFICER);
        String assignBody = objectMapper.writeValueAsString(Map.of("userId", targetOfficer.getId()));

        mockMvc.perform(post("/api/cases/" + caseEntity.getId() + "/assign")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(assignBody))
                .andExpect(status().isForbidden());
    }

    // ---------------------------------------------------------------
    // TEST 16: Unauthenticated user cannot access protected endpoints
    // ---------------------------------------------------------------

    @Test
    void unauthenticated_cannotAccessCases() throws Exception {
        mockMvc.perform(get("/api/cases"))
                .andExpect(status().isForbidden());
    }

    // ---------------------------------------------------------------
    // TEST 17: Existing asset RBAC tests still pass (verified by separate test class)
    // TEST 18: Existing document RBAC tests still pass (verified by separate test class)
    // These are regression guards — run via the full suite.
    // ---------------------------------------------------------------

    // ---------------------------------------------------------------
    // BONUS: Admin sees all cases, officer list is scoped
    // ---------------------------------------------------------------

    @Test
    void admin_seesAllCases_regardlessOfAssignment() throws Exception {
        createCase(unique("CASE-ADMIN1"));
        createCase(unique("CASE-ADMIN2"));
        User officer = createActiveUser("Admin Test Officer", Role.OFFICER);
        Case assignedCase = createCase(unique("CASE-ADMIN3"));
        assignCase(assignedCase, officer);

        mockMvc.perform(get("/api/cases")
                        .header("Authorization", bearer(adminToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(3));
    }

    @Test
    void officer_listCases_onlyAssigned() throws Exception {
        Case caseA = createCase(unique("CASE-LIST-A"));
        Case caseB = createCase(unique("CASE-LIST-B"));
        User officer = createActiveUser("List Officer", Role.OFFICER);
        assignCase(caseA, officer);
        String token = login(officer.getEmail(), DEFAULT_PASSWORD);

        mockMvc.perform(get("/api/cases")
                        .header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].caseNumber").value(caseA.getCaseNumber()));
    }

    // ---------------------------------------------------------------
    // BONUS: Case CRUD end-to-end
    // ---------------------------------------------------------------

    @Test
    void admin_canUpdateCase() throws Exception {
        Case caseEntity = createCase(unique("CASE-UPD"));
        String body = objectMapper.writeValueAsString(Map.of(
                "caseNumber", caseEntity.getCaseNumber(),
                "title", "Updated Title",
                "description", "Updated description",
                "status", "CLOSED"
        ));

        mockMvc.perform(put("/api/cases/" + caseEntity.getId())
                        .header("Authorization", bearer(adminToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Updated Title"))
                .andExpect(jsonPath("$.status").value("CLOSED"));
    }

    @Test
    void admin_canDeleteCase() throws Exception {
        Case caseEntity = createCase(unique("CASE-DEL"));

        mockMvc.perform(delete("/api/cases/" + caseEntity.getId())
                        .header("Authorization", bearer(adminToken)))
                .andExpect(status().isNoContent());
    }

    @Test
    void nonAdmin_cannotCreateCase() throws Exception {
        User officer = createActiveUser("Non-Admin Creator", Role.OFFICER);
        String token = login(officer.getEmail(), DEFAULT_PASSWORD);

        String body = objectMapper.writeValueAsString(Map.of(
                "caseNumber", "UNAUTH-CASE",
                "title", "Unauthorized",
                "status", "OPEN"
        ));

        mockMvc.perform(post("/api/cases")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isForbidden());
    }

    @Test
    void nonAdmin_cannotDeleteCase() throws Exception {
        Case caseEntity = createCase(unique("CASE-DEL-NO"));
        User officer = createActiveUser("Non-Admin Deleter", Role.OFFICER);
        String token = login(officer.getEmail(), DEFAULT_PASSWORD);

        mockMvc.perform(delete("/api/cases/" + caseEntity.getId())
                        .header("Authorization", bearer(token)))
                .andExpect(status().isForbidden());
    }

    // ---------------------------------------------------------------
    // BONUS: Assignment completion
    // ---------------------------------------------------------------

    @Test
    void admin_canCompleteAssignment() throws Exception {
        Case caseEntity = createCase(unique("CASE-COMP"));
        User officer = createActiveUser("Completion Officer", Role.OFFICER);
        assignCase(caseEntity, officer);

        Long assignmentId = caseAssignmentRepository.findByCaseEntity(caseEntity)
                .stream().findFirst().orElseThrow().getId();

        mockMvc.perform(post("/api/cases/" + caseEntity.getId() + "/assignments/" + assignmentId + "/complete")
                        .header("Authorization", bearer(adminToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("COMPLETED"));
    }
}
