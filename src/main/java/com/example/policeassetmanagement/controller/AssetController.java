package com.example.policeassetmanagement.controller;

import com.example.policeassetmanagement.dto.request.*;
import com.example.policeassetmanagement.dto.response.*;
import com.example.policeassetmanagement.security.SecurityHelper;
import com.example.policeassetmanagement.service.AssetService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/assets")
@RequiredArgsConstructor
public class AssetController {

    private final AssetService assetService;
    private final SecurityHelper securityHelper;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'STORE_KEEPER')")
    public ResponseEntity<AssetResponse> createAsset(@Valid @RequestBody AssetRequest request,
                                                      HttpServletRequest httpRequest) {
        Long userId = securityHelper.getCurrentUserId();
        AssetResponse response = assetService.createAsset(request, userId, getIp(httpRequest));
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<AssetResponse>> searchAssets(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) String condition,
            @RequestParam(required = false) String search) {
        Long userId = securityHelper.getCurrentUserId();
        return ResponseEntity.ok(assetService.searchAssets(status, category, location, condition, search, userId));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AssetResponse> getAssetById(@PathVariable Long id) {
        Long userId = securityHelper.getCurrentUserId();
        return ResponseEntity.ok(assetService.getAssetById(id, userId));
    }

    @GetMapping("/code/{assetCode}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AssetResponse> getAssetByCode(@PathVariable String assetCode) {
        Long userId = securityHelper.getCurrentUserId();
        return ResponseEntity.ok(assetService.getAssetByCode(assetCode, userId));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'STORE_KEEPER')")
    public ResponseEntity<AssetResponse> updateAsset(@PathVariable Long id,
                                                      @Valid @RequestBody AssetRequest request,
                                                      HttpServletRequest httpRequest) {
        Long userId = securityHelper.getCurrentUserId();
        return ResponseEntity.ok(assetService.updateAsset(id, request, userId, getIp(httpRequest)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteAsset(@PathVariable Long id) {
        assetService.deleteAsset(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/assign")
    @PreAuthorize("hasAnyRole('ADMIN', 'STORE_KEEPER')")
    public ResponseEntity<AssignmentResponse> assignAsset(@PathVariable Long id,
                                                           @Valid @RequestBody AssignAssetRequest request,
                                                           HttpServletRequest httpRequest) {
        Long userId = securityHelper.getCurrentUserId();
        return ResponseEntity.ok(assetService.assignAsset(id, request, userId, getIp(httpRequest)));
    }

    @PostMapping("/{id}/return")
    @PreAuthorize("hasAnyRole('ADMIN', 'STORE_KEEPER')")
    public ResponseEntity<AssignmentResponse> returnAsset(@PathVariable Long id,
                                                           HttpServletRequest httpRequest) {
        Long userId = securityHelper.getCurrentUserId();
        return ResponseEntity.ok(assetService.returnAsset(id, userId, getIp(httpRequest)));
    }

    @PostMapping("/{id}/move")
    @PreAuthorize("hasAnyRole('ADMIN', 'STORE_KEEPER', 'OFFICER')")
    public ResponseEntity<MovementResponse> moveAsset(@PathVariable Long id,
                                                       @Valid @RequestBody MoveAssetRequest request,
                                                       HttpServletRequest httpRequest) {
        Long userId = securityHelper.getCurrentUserId();
        return ResponseEntity.ok(assetService.moveAsset(id, request, userId, getIp(httpRequest)));
    }

    @PostMapping("/{id}/maintenance")
    @PreAuthorize("hasAnyRole('ADMIN', 'STORE_KEEPER')")
    public ResponseEntity<MaintenanceResponse> startMaintenance(@PathVariable Long id,
                                                                  @Valid @RequestBody MaintenanceRequest request,
                                                                  HttpServletRequest httpRequest) {
        Long userId = securityHelper.getCurrentUserId();
        return ResponseEntity.ok(assetService.startMaintenance(id, request, userId, getIp(httpRequest)));
    }

    @GetMapping("/{id}/maintenance")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<MaintenanceResponse>> getMaintenanceHistory(@PathVariable Long id) {
        Long userId = securityHelper.getCurrentUserId();
        return ResponseEntity.ok(assetService.getMaintenanceHistory(id, userId));
    }

    @PutMapping("/maintenance/{maintenanceId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'STORE_KEEPER')")
    public ResponseEntity<MaintenanceResponse> completeMaintenance(@PathVariable Long maintenanceId,
                                                                     HttpServletRequest httpRequest) {
        Long userId = securityHelper.getCurrentUserId();
        return ResponseEntity.ok(assetService.completeMaintenance(maintenanceId, userId, getIp(httpRequest)));
    }

    @PostMapping("/{id}/retire")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AssetResponse> retireAsset(@PathVariable Long id,
                                                      HttpServletRequest httpRequest) {
        Long userId = securityHelper.getCurrentUserId();
        return ResponseEntity.ok(assetService.retireAsset(id, userId, getIp(httpRequest)));
    }

    @GetMapping("/{id}/history")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AssetHistoryResponse> getAssetHistory(@PathVariable Long id) {
        Long userId = securityHelper.getCurrentUserId();
        return ResponseEntity.ok(assetService.getAssetHistory(id, userId));
    }

    private String getIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        return xff != null ? xff.split(",")[0].trim() : request.getRemoteAddr();
    }
}
