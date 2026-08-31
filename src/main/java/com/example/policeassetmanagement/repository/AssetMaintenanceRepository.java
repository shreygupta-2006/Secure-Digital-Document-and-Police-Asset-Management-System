package com.example.policeassetmanagement.repository;

import com.example.policeassetmanagement.entity.Asset;
import com.example.policeassetmanagement.entity.AssetMaintenance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AssetMaintenanceRepository extends JpaRepository<AssetMaintenance, Long> {

    List<AssetMaintenance> findByAssetOrderByCreatedAtDesc(Asset asset);

    Optional<AssetMaintenance> findByAssetAndStatus(Asset asset, String status);
}
