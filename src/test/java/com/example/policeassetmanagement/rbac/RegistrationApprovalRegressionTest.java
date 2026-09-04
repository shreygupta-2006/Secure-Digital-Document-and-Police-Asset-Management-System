package com.example.policeassetmanagement.rbac;

import com.example.policeassetmanagement.entity.User;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Regression coverage for the registration/approval workflow described in
 * audit section 7 — this must keep working exactly as before. Checklist
 * items D18–D22.
 */
class RegistrationApprovalRegressionTest extends AbstractRbacIntegrationTest {

    @Test
    void register_createsPendingAccount() throws Exception {
        String email = unique("newofficer") + "@test.com";
        String body = objectMapper.writeValueAsString(Map.of(
                "name", "New Officer",
                "email", email,
                "password", DEFAULT_PASSWORD,
                "requestedRole", "OFFICER"
        ));

        mockMvc.perform(post("/api/auth/register").contentType(org.springframework.http.MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.role").value("OFFICER"));
    }

    @Test
    void pendingUser_cannotLogin() throws Exception {
        String email = unique("pendinglogin") + "@test.com";
        registerRaw(email, "OFFICER");

        String loginBody = objectMapper.writeValueAsString(Map.of("email", email, "password", DEFAULT_PASSWORD));
        mockMvc.perform(post("/api/auth/login").contentType(org.springframework.http.MediaType.APPLICATION_JSON).content(loginBody))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void adminApprove_thenApprovedUserCanLogin_withOriginalPassword() throws Exception {
        String email = unique("approveme") + "@test.com";
        Long userId = registerRaw(email, "OFFICER");

        mockMvc.perform(post("/api/auth/pending/" + userId + "/approve")
                        .header("Authorization", bearer(adminToken))
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("role", "OFFICER"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACTIVE"))
                .andExpect(jsonPath("$.role").value("OFFICER"));

        String loginBody = objectMapper.writeValueAsString(Map.of("email", email, "password", DEFAULT_PASSWORD));
        mockMvc.perform(post("/api/auth/login").contentType(org.springframework.http.MediaType.APPLICATION_JSON).content(loginBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists())
                .andExpect(jsonPath("$.role").value("OFFICER"));
    }

    @Test
    void selfRegistration_requestingAdminRole_isDowngradedToOfficer_neverBecomesAdmin() throws Exception {
        String email = unique("wannabeadmin") + "@test.com";
        String body = objectMapper.writeValueAsString(Map.of(
                "name", "Wannabe Admin",
                "email", email,
                "password", DEFAULT_PASSWORD,
                "requestedRole", "ADMIN"
        ));

        mockMvc.perform(post("/api/auth/register").contentType(org.springframework.http.MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.role").value("OFFICER"))
                .andExpect(jsonPath("$.role", org.hamcrest.Matchers.not("ADMIN")));

        User saved = userRepository.findByEmail(email).orElseThrow();
        org.assertj.core.api.Assertions.assertThat(saved.getRole().name()).isEqualTo("OFFICER");
    }

    /** Registers a user via the real API and returns their generated ID. */
    private Long registerRaw(String email, String requestedRole) throws Exception {
        String body = objectMapper.writeValueAsString(Map.of(
                "name", "Regression Test User",
                "email", email,
                "password", DEFAULT_PASSWORD,
                "requestedRole", requestedRole
        ));
        MvcResult result = mockMvc.perform(post("/api/auth/register").contentType(org.springframework.http.MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated())
                .andReturn();
        Map<?, ?> parsed = objectMapper.readValue(result.getResponse().getContentAsString(), Map.class);
        return ((Number) parsed.get("id")).longValue();
    }
}
