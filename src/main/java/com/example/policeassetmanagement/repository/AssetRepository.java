package com.example.policeassetmanagement.repository;

import com.example.policeassetmanagement.entity.Asset;
import com.example.policeassetmanagement.entity.enums.AssetCondition;
import com.example.policeassetmanagement.entity.enums.AssetStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AssetRepository extends JpaRepository<Asset, Long> {

    Optional<Asset> findByAssetCode(String assetCode);

    boolean existsByAssetCode(String assetCode);

    List<Asset> findByStatus(AssetStatus status);

    List<Asset> findByCategory(String category);

    List<Asset> findByLocation(String location);

    @Query("SELECT a FROM Asset a WHERE " +
           "(:status IS NULL OR a.status = :status) AND " +
           "(:category IS NULL OR a.category = :category) AND " +
           "(:location IS NULL OR a.location = :location) AND " +
           "(:condition IS NULL OR a.condition = :condition) AND " +
           "(:search IS NULL OR a.name LIKE :search OR a.assetCode LIKE :search)")
    List<Asset> searchAssets(@Param("status") AssetStatus status,
                             @Param("category") String category,
                             @Param("location") String location,
                             @Param("condition") AssetCondition condition,
                             @Param("search") String search);
}
