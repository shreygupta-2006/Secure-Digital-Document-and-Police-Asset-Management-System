package com.example.policeassetmanagement.repository;

import com.example.policeassetmanagement.entity.Asset;
import com.example.policeassetmanagement.entity.AssetAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AssetAssignmentRepository extends JpaRepository<AssetAssignment, Long> {

    Optional<AssetAssignment> findByAssetAndStatus(Asset asset, String status);

    List<AssetAssignment> findByAssetOrderByAssignedAtDesc(Asset asset);

    boolean existsByAssetAndStatus(Asset asset, String status);
}
