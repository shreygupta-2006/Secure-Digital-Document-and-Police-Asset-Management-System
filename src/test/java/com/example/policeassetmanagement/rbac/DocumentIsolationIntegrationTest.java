package com.example.policeassetmanagement.rbac;

import com.example.policeassetmanagement.entity.Case;
import com.example.policeassetmanagement.entity.Document;
import com.example.policeassetmanagement.entity.User;
import com.example.policeassetmanagement.entity.enums.Role;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Covers audit sections 2 and 4 (Case-Based Document Isolation, and
 * Document Detail/Download/AI Security) and checklist items B7–B14.
 */
class DocumentIsolationIntegrationTest extends AbstractRbacIntegrationTest {

    @Test
    void officerWithNoCaseAssignments_seesZeroDocuments() throws Exception {
        Case someCase = createCase(unique("CASE"));
        User uploader = userRepository.findById(adminId).orElseThrow();
        createDocumentForCase("Final Test Document", someCase, uploader);

        User officer = createActiveUser("No Case Officer", Role.OFFICER);
        String token = login(officer.getEmail(), DEFAULT_PASSWORD);

        mockMvc.perform(get("/api/documents").header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void officerA_seesOnlyCaseA_documents_notCaseB() throws Exception {
        User uploader = userRepository.findById(adminId).orElseThrow();
        Case caseA = createCase(unique("CASE-A"));
        Case caseB = createCase(unique("CASE-B"));
        Document docA = createDocumentForCase("Case A Report", caseA, uploader);
        createDocumentForCase("Case B Report", caseB, uploader);

        User officerA = createActiveUser("Case Officer A", Role.OFFICER);
        assignCase(caseA, officerA);
        String tokenA = login(officerA.getEmail(), DEFAULT_PASSWORD);

        mockMvc.perform(get("/api/documents").header("Authorization", bearer(tokenA)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(docA.getId()));
    }

    @Test
    void officerB_assignedCaseB_seesCaseBDocuments() throws Exception {
        User uploader = userRepository.findById(adminId).orElseThrow();
        Case caseB = createCase(unique("CASE-B2"));
        Document docB = createDocumentForCase("Case B2 Report", caseB, uploader);

        User officerB = createActiveUser("Case Officer B", Role.OFFICER);
        assignCase(caseB, officerB);
        String tokenB = login(officerB.getEmail(), DEFAULT_PASSWORD);

        mockMvc.perform(get("/api/documents").header("Authorization", bearer(tokenB)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(docB.getId()));
    }

    @Test
    void twoOfficersAssignedSameCase_bothSeeItsDocuments() throws Exception {
        User uploader = userRepository.findById(adminId).orElseThrow();
        Case sharedCase = createCase(unique("CASE-SHARED"));
        Document doc = createDocumentForCase("Shared Case Doc", sharedCase, uploader);

        User officerA = createActiveUser("Shared Doc Officer A", Role.OFFICER);
        User officerB = createActiveUser("Shared Doc Officer B", Role.OFFICER);
        assignCase(sharedCase, officerA);
        assignCase(sharedCase, officerB);

        String tokenA = login(officerA.getEmail(), DEFAULT_PASSWORD);
        String tokenB = login(officerB.getEmail(), DEFAULT_PASSWORD);

        mockMvc.perform(get("/api/documents/" + doc.getId()).header("Authorization", bearer(tokenA)))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/documents/" + doc.getId()).header("Authorization", bearer(tokenB)))
                .andExpect(status().isOk());
    }

    @Test
    void officerOutsideCase_cannotAccessDocumentDetail() throws Exception {
        User uploader = userRepository.findById(adminId).orElseThrow();
        Case caseA = createCase(unique("CASE-DETAIL"));
        Document doc = createDocumentForCase("Detail Doc", caseA, uploader);

        User outsider = createActiveUser("Outside Officer", Role.OFFICER);
        String token = login(outsider.getEmail(), DEFAULT_PASSWORD);

        mockMvc.perform(get("/api/documents/" + doc.getId()).header("Authorization", bearer(token)))
                .andExpect(status().isNotFound());
    }

    @Test
    void officerOutsideCase_cannotDownloadDocument() throws Exception {
        User uploader = userRepository.findById(adminId).orElseThrow();
        Case caseA = createCase(unique("CASE-DL"));
        Document doc = createDocumentForCase("Download Doc", caseA, uploader);

        User outsider = createActiveUser("Outside Downloader", Role.OFFICER);
        String token = login(outsider.getEmail(), DEFAULT_PASSWORD);

        mockMvc.perform(get("/api/documents/" + doc.getId() + "/download").header("Authorization", bearer(token)))
                .andExpect(status().isNotFound());
    }

    @Test
    void officerOutsideCase_cannotQueryDocumentThroughAi() throws Exception {
        User uploader = userRepository.findById(adminId).orElseThrow();
        Case caseA = createCase(unique("CASE-AI"));
        Document doc = createDocumentForCase("AI Doc", caseA, uploader);

        User outsider = createActiveUser("Outside AI Officer", Role.OFFICER);
        String token = login(outsider.getEmail(), DEFAULT_PASSWORD);

        // Authorization is enforced before any AI/RAG/Groq call is made, so this
        // must fail fast with 404 and never reach the external AI provider.
        mockMvc.perform(post("/api/ai/documents/" + doc.getId() + "/index").header("Authorization", bearer(token)))
                .andExpect(status().isNotFound());

        mockMvc.perform(post("/api/ai/documents/" + doc.getId() + "/summary").header("Authorization", bearer(token)))
                .andExpect(status().isNotFound());

        mockMvc.perform(get("/api/ai/documents/" + doc.getId() + "/suggestions").header("Authorization", bearer(token)))
                .andExpect(status().isNotFound());

        String askBody = objectMapper.writeValueAsString(Map.of("question", "What happened?"));
        mockMvc.perform(post("/api/ai/documents/" + doc.getId() + "/ask")
                        .header("Authorization", bearer(token))
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON).content(askBody))
                .andExpect(status().isNotFound());
    }

    @Test
    void authorizedOfficer_canDownloadTheirCaseDocument_endToEnd() throws Exception {
        // Upload a REAL document through the API (as ADMIN) so a real file
        // exists on disk, then link it to a case (no case-linking API exists
        // yet — see AbstractRbacIntegrationTest javadoc), then verify an
        // officer assigned to that case can actually download the content.
        MockMultipartFile file = sampleFile();
        MvcResult uploadResult = mockMvc.perform(multipart("/api/documents")
                        .file(file)
                        .param("title", "Real Uploaded Doc")
                        .param("documentType", "EVIDENCE")
                        .header("Authorization", bearer(adminToken)))
                .andExpect(status().isCreated())
                .andReturn();

        Map<?, ?> uploaded = objectMapper.readValue(uploadResult.getResponse().getContentAsString(), Map.class);
        Long documentId = ((Number) uploaded.get("id")).longValue();

        Case caseA = createCase(unique("CASE-E2E"));
        Document doc = documentRepository.findById(documentId).orElseThrow();
        doc.setCaseEntity(caseA);
        documentRepository.save(doc);

        User officer = createActiveUser("E2E Officer", Role.OFFICER);
        assignCase(caseA, officer);
        String token = login(officer.getEmail(), DEFAULT_PASSWORD);

        mockMvc.perform(get("/api/documents/" + documentId + "/download").header("Authorization", bearer(token)))
                .andExpect(status().isOk());
    }
}
