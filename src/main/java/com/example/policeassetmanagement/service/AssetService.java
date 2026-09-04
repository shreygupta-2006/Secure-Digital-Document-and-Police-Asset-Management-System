package com.example.policeassetmanagement.service;

import com.example.policeassetmanagement.dto.request.AssetRequest;
import com.example.policeassetmanagement.dto.request.AssignAssetRequest;
import com.example.policeassetmanagement.dto.request.MaintenanceRequest;
import com.example.policeassetmanagement.dto.request.MoveAssetRequest;
import com.example.policeassetmanagement.dto.response.*;

import java.util.List;

public interface AssetService {

    AssetResponse createAsset(AssetRequest request, Long userId, String ip);

    /**
     * @param currentUserId the requesting user; used to enforce assignment-aware
     *                       access (an OFFICER may only fetch an asset assigned to them).
     */
    AssetResponse getAssetById(Long id, Long currentUserId);

    AssetResponse getAssetByCode(String assetCode, Long currentUserId);

    /**
     * @param currentUserId the requesting user; results are restricted to assets
     *                       assigned to this user when their role is scoped (OFFICER).
     */
    List<AssetResponse> searchAssets(String status, String category, String location,
                                      String condition, String search, Long currentUserId);

    List<AssetResponse> getAllAssets();

    AssetResponse updateAsset(Long id, AssetRequest request, Long userId, String ip);

    void deleteAsset(Long id);

    AssignmentResponse assignAsset(Long assetId, AssignAssetRequest request, Long userId, String ip);

    AssignmentResponse returnAsset(Long assetId, Long userId, String ip);

    MovementResponse moveAsset(Long assetId, MoveAssetRequest request, Long userId, String ip);

    MaintenanceResponse startMaintenance(Long assetId, MaintenanceRequest request, Long userId, String ip);

    MaintenanceResponse completeMaintenance(Long maintenanceId, Long userId, String ip);

    List<MaintenanceResponse> getMaintenanceHistory(Long assetId, Long currentUserId);

    AssetResponse retireAsset(Long assetId, Long userId, String ip);

    AssetHistoryResponse getAssetHistory(Long assetId, Long currentUserId);
}
