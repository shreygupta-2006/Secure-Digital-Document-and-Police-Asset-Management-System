package com.example.policeassetmanagement.dto.response;

import com.example.policeassetmanagement.entity.enums.AssetCondition;
import com.example.policeassetmanagement.entity.enums.AssetStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssetResponse {

    private Long id;
    private String assetCode;
    private String name;
    private String category;
    private String description;
    private AssetStatus status;
    private AssetCondition condition;
    private String location;
    private BigDecimal purchasePrice;
    private LocalDate purchaseDate;
    private LocalDate warrantyExpiryDate;
    private String manufacturer;
    private String modelNumber;
    private String serialNumber;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
