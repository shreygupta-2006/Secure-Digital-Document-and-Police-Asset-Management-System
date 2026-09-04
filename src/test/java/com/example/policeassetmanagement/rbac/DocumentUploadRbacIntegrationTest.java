package com.example.policeassetmanagement.rbac;

import com.example.policeassetmanagement.entity.User;
import com.example.policeassetmanagement.entity.enums.Role;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Covers audit section 3 (Officer Document Upload Must Be Blocked) and
 * checklist items C15–C17. The backend must reject an OFFICER's upload
 * request even when sent directly (not merely hide the button in the UI).
 */
class DocumentUploadRbacIntegrationTest extends AbstractRbacIntegrationTest {

    private org.springframework.test.web.servlet.ResultActions doUpload(String token) throws Exception {
        MockMultipartFile file = sampleFile();
        return mockMvc.perform(multipart("/api/documents")
                .file(file)
                .param("title", "Upload RBAC Test Doc")
                .param("documentType", "EVIDENCE")
                .header("Authorization", bearer(token)));
    }

    @Test
    void officerUpload_isDenied() throws Exception {
        User officer = createActiveUser("Upload Denied Officer", Role.OFFICER);
        String token = login(officer.getEmail(), DEFAULT_PASSWORD);

        doUpload(token).andExpect(status().isForbidden());
    }

    @Test
    void storeKeeperUpload_isAllowed() throws Exception {
        User storeKeeper = createActiveUser("Upload Store Keeper", Role.STORE_KEEPER);
        String token = login(storeKeeper.getEmail(), DEFAULT_PASSWORD);

        doUpload(token).andExpect(status().isCreated());
    }

    @Test
    void adminUpload_isAllowed() throws Exception {
        doUpload(adminToken).andExpect(status().isCreated());
    }
}
