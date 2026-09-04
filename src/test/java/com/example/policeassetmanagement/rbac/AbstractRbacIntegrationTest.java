package com.example.policeassetmanagement.rbac;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.example.policeassetmanagement.entity.*;
import com.example.policeassetmanagement.entity.enums.*;
import com.example.policeassetmanagement.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Shared fixtures/helpers for the RBAC audit test suite.
 *
 * All tests run against a dedicated TEST database (see
 * src/test/resources/application-test.yml) and each test method is wrapped
 * in @Transactional so every change made during a test is rolled back
 * afterwards — the developer's real data is never touched.
 *
 * NOTE ON SCOPE: there is currently no Case-management REST API in this
 * project (no CaseController) — Cases and CaseAssignments can only be
 * created directly against the database. Since that is also how the running
 * application itself must be provisioning them today, these tests create
 * Case/CaseAssignment fixtures directly via the repositories rather than
 * through an endpoint. This is flagged as a follow-up product gap in the
 * audit report, not something this test suite works around silently.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
public abstract class AbstractRbacIntegrationTest {

    @Autowired protected MockMvc mockMvc;
    @Autowired protected ObjectMapper objectMapper;
    @Autowired protected UserRepository userRepository;
    @Autowired protected PasswordEncoder passwordEncoder;
    @Autowired protected AssetRepository assetRepository;
    @Autowired protected AssetAssignmentRepository assetAssignmentRepository;
    @Autowired protected CaseRepository caseRepository;
    @Autowired protected CaseAssignmentRepository caseAssignmentRepository;
    @Autowired protected DocumentRepository documentRepository;

    protected static final String DEFAULT_PASSWORD = "Passw0rd!";

    protected String adminToken;
    protected Long adminId;

    @BeforeEach
    void bootstrapAdmin() {
        // Mirrors how the real deployment must already provision its first
        // ADMIN account (there is no public API path to create one — self
        // registration always downgrades ADMIN to OFFICER, by design).
        User admin = User.builder()
                .name("Bootstrap Admin")
                .email(unique("admin") + "@test.com")
                .password(passwordEncoder.encode(DEFAULT_PASSWORD))
                .role(Role.ADMIN)
                .status(UserStatus.ACTIVE)
                .build();
        admin = userRepository.save(admin);
        adminId = admin.getId();
        adminToken = login(admin.getEmail(), DEFAULT_PASSWORD);
    }

    protected String unique(String prefix) {
        return prefix + "-" + UUID.randomUUID().toString().substring(0, 8);
    }

    /** Creates an ACTIVE user directly (bypassing register+approve) for test speed, mirroring an already-approved account. */
    protected User createActiveUser(String namePrefix, Role role) {
        User user = User.builder()
                .name(namePrefix)
                .email(unique(namePrefix.toLowerCase().replace(" ", ".")) + "@test.com")
                .password(passwordEncoder.encode(DEFAULT_PASSWORD))
                .role(role)
                .status(UserStatus.ACTIVE)
                .build();
        return userRepository.save(user);
    }

    protected String login(String email, String password) {
        try {
            String body = objectMapper.writeValueAsString(Map.of("email", email, "password", password));
            MvcResult result = mockMvc.perform(post("/api/auth/login")
                            .contentType(org.springframework.http.MediaType.APPLICATION_JSON).content(body))
                    .andExpect(status().isOk())
                    .andReturn();
            Map<?, ?> parsed = objectMapper.readValue(result.getResponse().getContentAsString(), Map.class);
            return (String) parsed.get("token");
        } catch (Exception e) {
            throw new RuntimeException("Login failed for " + email, e);
        }
    }

    protected String bearer(String token) {
        return "Bearer " + token;
    }

    // ---------------------------------------------------------------
    // Asset fixtures
    // ---------------------------------------------------------------

    protected Asset createAsset(String code) {
        Asset asset = Asset.builder()
                .assetCode(code)
                .name("Test Asset " + code)
                .category("FIREARM")
                .status(AssetStatus.AVAILABLE)
                .condition(AssetCondition.GOOD)
                .location("Armory")
                .build();
        return assetRepository.save(asset);
    }

    protected void assignAsset(Asset asset, User officer, User assignedBy) {
        AssetAssignment assignment = AssetAssignment.builder()
                .asset(asset)
                .assignedTo(officer)
                .assignedBy(assignedBy)
                .assignedAt(LocalDateTime.now())
                .status("ACTIVE")
                .build();
        assetAssignmentRepository.save(assignment);
        asset.setStatus(AssetStatus.ASSIGNED);
        assetRepository.save(asset);
    }

    // ---------------------------------------------------------------
    // Case / Document fixtures
    // ---------------------------------------------------------------

    protected Case createCase(String number) {
        Case c = Case.builder()
                .caseNumber(number)
                .title("Test Case " + number)
                .status("OPEN")
                .build();
        return caseRepository.save(c);
    }

    protected void assignCase(Case caseEntity, User user) {
        CaseAssignment assignment = CaseAssignment.builder()
                .caseEntity(caseEntity)
                .user(user)
                .status("ACTIVE")
                .build();
        caseAssignmentRepository.save(assignment);
    }

    /** Creates a document directly (there's no API to link a document to a case yet). */
    protected Document createDocumentForCase(String title, Case caseEntity, User uploader) {
        Document doc = Document.builder()
                .title(title)
                .documentType(DocumentType.EVIDENCE)
                .fileName(title + ".txt")
                .filePath("test-uploads/" + unique("doc") + ".txt")
                .contentType("text/plain")
                .fileSize(10L)
                .fileHash("deadbeef")
                .indexed(false)
                .caseEntity(caseEntity)
                .uploadedBy(uploader)
                .build();
        return documentRepository.save(doc);
    }

    protected MockMultipartFile sampleFile() {
        return new MockMultipartFile("file", "sample.txt", "text/plain", "hello world".getBytes());
    }
}
