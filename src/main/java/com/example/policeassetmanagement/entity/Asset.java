package com.example.policeassetmanagement.entity;

import com.example.policeassetmanagement.entity.enums.AssetCondition;
import com.example.policeassetmanagement.entity.enums.AssetStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "assets")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Asset {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String assetCode;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(length = 100)
    private String category;

    @Column(length = 500)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AssetStatus status;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AssetCondition condition;

    @Column(length = 200)
    private String location;

    private BigDecimal purchasePrice;

    private LocalDate purchaseDate;

    private LocalDate warrantyExpiryDate;

    @Column(length = 200)
    private String manufacturer;

    @Column(length = 200)
    private String modelNumber;

    @Column(length = 100)
    private String serialNumber;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
