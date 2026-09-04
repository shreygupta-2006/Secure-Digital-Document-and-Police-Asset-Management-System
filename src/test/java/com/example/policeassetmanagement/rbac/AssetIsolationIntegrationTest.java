package com.example.policeassetmanagement.rbac;

import com.example.policeassetmanagement.entity.Asset;
import com.example.policeassetmanagement.entity.User;
import com.example.policeassetmanagement.entity.enums.Role;
import org.junit.jupiter.api.Test;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Covers audit section 1 (Asset-Based Access Isolation) and the
 * corresponding automated-test checklist items A1–A6.
 */
class AssetIsolationIntegrationTest extends AbstractRbacIntegrationTest {

    @Test
    void unassignedOfficer_seesZeroAssets() throws Exception {
        // Two assets exist in the system but are assigned to nobody / others.
        createAsset(unique("POL"));
        User officer = createActiveUser("Unassigned Officer", Role.OFFICER);
        String token = login(officer.getEmail(), DEFAULT_PASSWORD);

        mockMvc.perform(get("/api/assets").header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void officerA_seesOnlyTheirOwnAssignedAsset_notOfficerBsAsset() throws Exception {
        User officerA = createActiveUser("Officer A", Role.OFFICER);
        User officerB = createActiveUser("Officer B", Role.OFFICER);
        Asset assetForA = createAsset(unique("POL-A"));
        Asset assetForB = createAsset(unique("POL-B"));

        User admin = userRepository.findById(adminId).orElseThrow();
        assignAsset(assetForA, officerA, admin);
        assignAsset(assetForB, officerB, admin);

        String tokenA = login(officerA.getEmail(), DEFAULT_PASSWORD);
        String tokenB = login(officerB.getEmail(), DEFAULT_PASSWORD);

        // Officer A sees only their asset
        mockMvc.perform(get("/api/assets").header("Authorization", bearer(tokenA)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(assetForA.getId()));

        // Officer B sees only their asset
        mockMvc.perform(get("/api/assets").header("Authorization", bearer(tokenB)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(assetForB.getId()));
    }

    @Test
    void officer_directAccessToUnauthorizedAssetById_isDenied() throws Exception {
        User officerA = createActiveUser("Officer A2", Role.OFFICER);
        Asset assetForOther = createAsset(unique("POL-X"));
        // assetForOther is intentionally left unassigned to officerA

        String tokenA = login(officerA.getEmail(), DEFAULT_PASSWORD);

        mockMvc.perform(get("/api/assets/" + assetForOther.getId())
                        .header("Authorization", bearer(tokenA)))
                .andExpect(status().isNotFound());

        mockMvc.perform(get("/api/assets/" + assetForOther.getId() + "/history")
                        .header("Authorization", bearer(tokenA)))
                .andExpect(status().isNotFound());
    }

    @Test
    void officer_canDirectlyAccessTheirOwnAssignedAssetById() throws Exception {
        User officer = createActiveUser("Officer Owns", Role.OFFICER);
        Asset asset = createAsset(unique("POL-OWN"));
        User admin = userRepository.findById(adminId).orElseThrow();
        assignAsset(asset, officer, admin);

        String token = login(officer.getEmail(), DEFAULT_PASSWORD);

        mockMvc.perform(get("/api/assets/" + asset.getId())
                        .header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(asset.getId()));
    }

    @Test
    void admin_seesAllAssets_regardlessOfAssignment() throws Exception {
        createAsset(unique("POL-1"));
        createAsset(unique("POL-2"));
        User officer = createActiveUser("Irrelevant Officer", Role.OFFICER);
        Asset assignedToOfficer = createAsset(unique("POL-3"));
        assignAsset(assignedToOfficer, officer, userRepository.findById(adminId).orElseThrow());

        mockMvc.perform(get("/api/assets").header("Authorization", bearer(adminToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(3));
    }

    @Test
    void assetAssignedToMultipleOfficers_isVisibleToBoth() throws Exception {
        Asset sharedAsset = createAsset(unique("POL-SHARED"));
        User officerA = createActiveUser("Shared Officer A", Role.OFFICER);
        User officerB = createActiveUser("Shared Officer B", Role.OFFICER);
        User admin = userRepository.findById(adminId).orElseThrow();

        assignAsset(sharedAsset, officerA, admin);
        assignAsset(sharedAsset, officerB, admin);

        String tokenA = login(officerA.getEmail(), DEFAULT_PASSWORD);
        String tokenB = login(officerB.getEmail(), DEFAULT_PASSWORD);

        mockMvc.perform(get("/api/assets/" + sharedAsset.getId()).header("Authorization", bearer(tokenA)))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/assets/" + sharedAsset.getId()).header("Authorization", bearer(tokenB)))
                .andExpect(status().isOk());
    }
}
