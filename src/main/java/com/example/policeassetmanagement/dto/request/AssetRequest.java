package com.example.policeassetmanagement.dto.request;

import com.example.policeassetmanagement.entity.enums.AssetCondition;
import com.example.policeassetmanagement.entity.enums.AssetStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssetRequest {

    @NotBlank(message = "Asset code is required")
    @Size(max = 50)
    private String assetCode;

    @NotBlank(message = "Asset name is required")
    @Size(max = 150)
    private String name;

    @Size(max = 100)
    private String category;

    @Size(max = 500)
    private String description;

    private AssetStatus status;  // Optional: defaults to AVAILABLE on creation

    @NotNull(message = "Condition is required")
    private AssetCondition condition;

    @Size(max = 200)
    private String location;

    private BigDecimal purchasePrice;

    private LocalDate purchaseDate;

    private LocalDate warrantyExpiryDate;

    @Size(max = 200)
    private String manufacturer;

    @Size(max = 200)
    private String modelNumber;

    @Size(max = 100)
    private String serialNumber;
}
