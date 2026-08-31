package com.example.policeassetmanagement.service.impl;

import com.example.policeassetmanagement.dto.request.AssetRequest;
import com.example.policeassetmanagement.dto.request.AssignAssetRequest;
import com.example.policeassetmanagement.dto.request.MaintenanceRequest;
import com.example.policeassetmanagement.dto.request.MoveAssetRequest;
import com.example.policeassetmanagement.dto.response.*;
import com.example.policeassetmanagement.entity.*;
import com.example.policeassetmanagement.entity.enums.AssetCondition;
import com.example.policeassetmanagement.entity.enums.AssetStatus;
import com.example.policeassetmanagement.exception.BadRequestException;
import com.example.policeassetmanagement.exception.ResourceNotFoundException;
import com.example.policeassetmanagement.repository.*;
import com.example.policeassetmanagement.service.AssetService;
import com.example.policeassetmanagement.service.AuditService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class AssetServiceImpl implements AssetService {

    private final AssetRepository assetRepository;
    private final AssetAssignmentRepository assignmentRepository;
    private final AssetMovementRepository movementRepository;
    private final AssetMaintenanceRepository maintenanceRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;

    @Override
    public AssetResponse createAsset(AssetRequest request, Long userId, String ip) {
        if (assetRepository.existsByAssetCode(request.getAssetCode())) {
            throw new BadRequestException("Asset code already exists: " + request.getAssetCode());
        }

        Asset asset = buildAssetFromRequest(request);
        asset.setStatus(AssetStatus.AVAILABLE);
        Asset saved = assetRepository.save(asset);

        auditService.createAuditLog("ASSET_CREATED", "Asset", saved.getId(),
                userId, "Asset created: " + saved.getAssetCode(), ip);

        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public AssetResponse getAssetById(Long id) {
        Asset asset = assetRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Asset", "id", id));
        return mapToResponse(asset);
    }

    @Override
    @Transactional(readOnly = true)
    public AssetResponse getAssetByCode(String assetCode) {
        Asset asset = assetRepository.findByAssetCode(assetCode)
                .orElseThrow(() -> new ResourceNotFoundException("Asset", "assetCode", assetCode));
        return mapToResponse(asset);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AssetResponse> searchAssets(String status, String category, String location,
                                             String condition, String search) {
        AssetStatus assetStatus = null;
        AssetCondition assetCondition = null;
        if (status != null) assetStatus = AssetStatus.valueOf(status);
        if (condition != null) assetCondition = AssetCondition.valueOf(condition);

        String searchPattern = search != null ? "%" + search + "%" : null;
        return assetRepository.searchAssets(assetStatus, category, location, assetCondition, searchPattern)
                .stream().map(this::mapToResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<AssetResponse> getAllAssets() {
        return assetRepository.findAll().stream().map(this::mapToResponse).toList();
    }

    @Override
    public AssetResponse updateAsset(Long id, AssetRequest request, Long userId, String ip) {
        Asset asset = assetRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Asset", "id", id));

        if (!asset.getAssetCode().equals(request.getAssetCode()) &&
                assetRepository.existsByAssetCode(request.getAssetCode())) {
            throw new BadRequestException("Asset code already exists: " + request.getAssetCode());
        }

        updateAssetFromRequest(asset, request);
        Asset updated = assetRepository.save(asset);

        auditService.createAuditLog("ASSET_UPDATED", "Asset", updated.getId(),
                userId, "Asset updated: " + updated.getAssetCode(), ip);

        return mapToResponse(updated);
    }

    @Override
    public void deleteAsset(Long id) {
        if (!assetRepository.existsById(id)) {
            throw new ResourceNotFoundException("Asset", "id", id);
        }
        assetRepository.deleteById(id);
    }

    @Override
    public AssignmentResponse assignAsset(Long assetId, AssignAssetRequest request, Long userId, String ip) {
        Asset asset = assetRepository.findById(assetId)
                .orElseThrow(() -> new ResourceNotFoundException("Asset", "id", assetId));

        if (asset.getStatus() == AssetStatus.RETIRED) {
            throw new BadRequestException("Cannot assign a retired asset");
        }
        if (asset.getStatus() == AssetStatus.IN_MAINTENANCE) {
            throw new BadRequestException("Cannot assign an asset currently in maintenance");
        }
        if (assignmentRepository.existsByAssetAndStatus(asset, "ACTIVE")) {
            throw new BadRequestException("Asset is already assigned");
        }

        User assignedTo = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", request.getUserId()));

        User assignedBy = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        AssetAssignment assignment = AssetAssignment.builder()
                .asset(asset)
                .assignedTo(assignedTo)
                .assignedBy(assignedBy)
                .assignedAt(LocalDateTime.now())
                .status("ACTIVE")
                .remarks(request.getRemarks())
                .build();
        assignmentRepository.save(assignment);

        asset.setStatus(AssetStatus.ASSIGNED);
        assetRepository.save(asset);

        auditService.createAuditLog("ASSET_ASSIGNED", "Asset", asset.getId(),
                userId, "Asset assigned to " + assignedTo.getName(), ip);

        return mapAssignmentToResponse(assignment);
    }

    @Override
    public AssignmentResponse returnAsset(Long assetId, Long userId, String ip) {
        Asset asset = assetRepository.findById(assetId)
                .orElseThrow(() -> new ResourceNotFoundException("Asset", "id", assetId));

        AssetAssignment assignment = assignmentRepository.findByAssetAndStatus(asset, "ACTIVE")
                .orElseThrow(() -> new BadRequestException("No active assignment found for this asset"));

        assignment.setReturnedAt(LocalDateTime.now());
        assignment.setStatus("COMPLETED");
        assignmentRepository.save(assignment);

        asset.setStatus(AssetStatus.AVAILABLE);
        assetRepository.save(asset);

        auditService.createAuditLog("ASSET_RETURNED", "Asset", asset.getId(),
                userId, "Asset returned by " + assignment.getAssignedTo().getName(), ip);

        return mapAssignmentToResponse(assignment);
    }

    @Override
    public MovementResponse moveAsset(Long assetId, MoveAssetRequest request, Long userId, String ip) {
        Asset asset = assetRepository.findById(assetId)
                .orElseThrow(() -> new ResourceNotFoundException("Asset", "id", assetId));

        if (asset.getStatus() == AssetStatus.RETIRED) {
            throw new BadRequestException("Cannot move a retired asset");
        }

        User movedBy = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        AssetMovement movement = AssetMovement.builder()
                .asset(asset)
                .fromLocation(asset.getLocation())
                .toLocation(request.getToLocation())
                .movedBy(movedBy)
                .reason(request.getReason())
                .movedAt(LocalDateTime.now())
                .build();
        movementRepository.save(movement);

        asset.setLocation(request.getToLocation());
        assetRepository.save(asset);

        auditService.createAuditLog("ASSET_MOVED", "Asset", asset.getId(),
                userId, "Asset moved from " + movement.getFromLocation() + " to " + request.getToLocation(), ip);

        return mapMovementToResponse(movement);
    }

    @Override
    public MaintenanceResponse startMaintenance(Long assetId, MaintenanceRequest request, Long userId, String ip) {
        Asset asset = assetRepository.findById(assetId)
                .orElseThrow(() -> new ResourceNotFoundException("Asset", "id", assetId));

        if (asset.getStatus() == AssetStatus.RETIRED) {
            throw new BadRequestException("Cannot maintain a retired asset");
        }
        if (maintenanceRepository.findByAssetAndStatus(asset, "IN_PROGRESS").isPresent()) {
            throw new BadRequestException("Maintenance already in progress for this asset");
        }

        User performedBy = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        AssetMaintenance maintenance = AssetMaintenance.builder()
                .asset(asset)
                .description(request.getDescription())
                .performedBy(performedBy)
                .status("IN_PROGRESS")
                .cost(request.getCost())
                .maintenanceDate(LocalDateTime.now())
                .remarks(request.getRemarks())
                .build();
        maintenanceRepository.save(maintenance);

        asset.setStatus(AssetStatus.IN_MAINTENANCE);
        assetRepository.save(asset);

        auditService.createAuditLog("MAINTENANCE_STARTED", "AssetMaintenance", maintenance.getId(),
                userId, "Maintenance started for asset " + asset.getAssetCode(), ip);

        return mapMaintenanceToResponse(maintenance);
    }

    @Override
    public MaintenanceResponse completeMaintenance(Long maintenanceId, Long userId, String ip) {
        AssetMaintenance maintenance = maintenanceRepository.findById(maintenanceId)
                .orElseThrow(() -> new ResourceNotFoundException("AssetMaintenance", "id", maintenanceId));

        if ("COMPLETED".equals(maintenance.getStatus())) {
            throw new BadRequestException("Maintenance already completed");
        }

        maintenance.setStatus("COMPLETED");
        maintenance.setCompletedDate(LocalDateTime.now());
        maintenanceRepository.save(maintenance);

        Asset asset = maintenance.getAsset();
        asset.setStatus(AssetStatus.AVAILABLE);
        assetRepository.save(asset);

        auditService.createAuditLog("MAINTENANCE_COMPLETED", "AssetMaintenance", maintenance.getId(),
                userId, "Maintenance completed for asset " + asset.getAssetCode(), ip);

        return mapMaintenanceToResponse(maintenance);
    }

    @Override
    @Transactional(readOnly = true)
    public List<MaintenanceResponse> getMaintenanceHistory(Long assetId) {
        Asset asset = assetRepository.findById(assetId)
                .orElseThrow(() -> new ResourceNotFoundException("Asset", "id", assetId));
        return maintenanceRepository.findByAssetOrderByCreatedAtDesc(asset)
                .stream().map(this::mapMaintenanceToResponse).toList();
    }

    @Override
    public AssetResponse retireAsset(Long assetId, Long userId, String ip) {
        Asset asset = assetRepository.findById(assetId)
                .orElseThrow(() -> new ResourceNotFoundException("Asset", "id", assetId));

        if (asset.getStatus() == AssetStatus.RETIRED) {
            throw new BadRequestException("Asset is already retired");
        }

        // Close any active assignment
        assignmentRepository.findByAssetAndStatus(asset, "ACTIVE").ifPresent(a -> {
            a.setReturnedAt(LocalDateTime.now());
            a.setStatus("COMPLETED");
            assignmentRepository.save(a);
        });

        asset.setStatus(AssetStatus.RETIRED);
        assetRepository.save(asset);

        auditService.createAuditLog("ASSET_RETIRED", "Asset", asset.getId(),
                userId, "Asset retired: " + asset.getAssetCode(), ip);

        return mapToResponse(asset);
    }

    @Override
    @Transactional(readOnly = true)
    public AssetHistoryResponse getAssetHistory(Long assetId) {
        Asset asset = assetRepository.findById(assetId)
                .orElseThrow(() -> new ResourceNotFoundException("Asset", "id", assetId));

        List<AssignmentResponse> assignments = assignmentRepository.findByAssetOrderByAssignedAtDesc(asset)
                .stream().map(this::mapAssignmentToResponse).toList();
        List<MovementResponse> movements = movementRepository.findByAssetOrderByMovedAtDesc(asset)
                .stream().map(this::mapMovementToResponse).toList();
        List<MaintenanceResponse> maintenances = maintenanceRepository.findByAssetOrderByCreatedAtDesc(asset)
                .stream().map(this::mapMaintenanceToResponse).toList();

        return AssetHistoryResponse.builder()
                .assignments(assignments)
                .movements(movements)
                .maintenances(maintenances)
                .build();
    }

    // --- Mapping helpers ---

    private Asset buildAssetFromRequest(AssetRequest request) {
        return Asset.builder()
                .assetCode(request.getAssetCode())
                .name(request.getName())
                .category(request.getCategory())
                .description(request.getDescription())
                .condition(request.getCondition())
                .location(request.getLocation())
                .purchasePrice(request.getPurchasePrice())
                .purchaseDate(request.getPurchaseDate())
                .warrantyExpiryDate(request.getWarrantyExpiryDate())
                .manufacturer(request.getManufacturer())
                .modelNumber(request.getModelNumber())
                .serialNumber(request.getSerialNumber())
                .build();
    }

    private void updateAssetFromRequest(Asset asset, AssetRequest request) {
        asset.setAssetCode(request.getAssetCode());
        asset.setName(request.getName());
        asset.setCategory(request.getCategory());
        asset.setDescription(request.getDescription());
        asset.setCondition(request.getCondition());
        asset.setLocation(request.getLocation());
        asset.setPurchasePrice(request.getPurchasePrice());
        asset.setPurchaseDate(request.getPurchaseDate());
        asset.setWarrantyExpiryDate(request.getWarrantyExpiryDate());
        asset.setManufacturer(request.getManufacturer());
        asset.setModelNumber(request.getModelNumber());
        asset.setSerialNumber(request.getSerialNumber());
    }

    private AssetResponse mapToResponse(Asset asset) {
        return AssetResponse.builder()
                .id(asset.getId()).assetCode(asset.getAssetCode()).name(asset.getName())
                .category(asset.getCategory()).description(asset.getDescription())
                .status(asset.getStatus()).condition(asset.getCondition())
                .location(asset.getLocation()).purchasePrice(asset.getPurchasePrice())
                .purchaseDate(asset.getPurchaseDate()).warrantyExpiryDate(asset.getWarrantyExpiryDate())
                .manufacturer(asset.getManufacturer()).modelNumber(asset.getModelNumber())
                .serialNumber(asset.getSerialNumber())
                .createdAt(asset.getCreatedAt()).updatedAt(asset.getUpdatedAt())
                .build();
    }

    private AssignmentResponse mapAssignmentToResponse(AssetAssignment assignment) {
        return AssignmentResponse.builder()
                .id(assignment.getId()).assetId(assignment.getAsset().getId())
                .assetCode(assignment.getAsset().getAssetCode())
                .assignedToId(assignment.getAssignedTo().getId())
                .assignedToName(assignment.getAssignedTo().getName())
                .assignedByName(assignment.getAssignedBy() != null ? assignment.getAssignedBy().getName() : null)
                .assignedAt(assignment.getAssignedAt()).returnedAt(assignment.getReturnedAt())
                .status(assignment.getStatus()).remarks(assignment.getRemarks())
                .build();
    }

    private MovementResponse mapMovementToResponse(AssetMovement movement) {
        return MovementResponse.builder()
                .id(movement.getId()).assetId(movement.getAsset().getId())
                .assetCode(movement.getAsset().getAssetCode())
                .fromLocation(movement.getFromLocation()).toLocation(movement.getToLocation())
                .movedByName(movement.getMovedBy() != null ? movement.getMovedBy().getName() : null)
                .reason(movement.getReason()).movedAt(movement.getMovedAt())
                .build();
    }

    private MaintenanceResponse mapMaintenanceToResponse(AssetMaintenance maintenance) {
        return MaintenanceResponse.builder()
                .id(maintenance.getId()).assetId(maintenance.getAsset().getId())
                .assetCode(maintenance.getAsset().getAssetCode())
                .description(maintenance.getDescription())
                .performedByName(maintenance.getPerformedBy() != null ? maintenance.getPerformedBy().getName() : null)
                .status(maintenance.getStatus()).cost(maintenance.getCost())
                .maintenanceDate(maintenance.getMaintenanceDate())
                .completedDate(maintenance.getCompletedDate())
                .remarks(maintenance.getRemarks())
                .build();
    }
}
