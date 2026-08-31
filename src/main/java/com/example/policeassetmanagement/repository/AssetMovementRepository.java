package com.example.policeassetmanagement.repository;

import com.example.policeassetmanagement.entity.Asset;
import com.example.policeassetmanagement.entity.AssetMovement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AssetMovementRepository extends JpaRepository<AssetMovement, Long> {

    List<AssetMovement> findByAssetOrderByMovedAtDesc(Asset asset);
}
