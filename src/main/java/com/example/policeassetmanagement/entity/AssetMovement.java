package com.example.policeassetmanagement.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "asset_movements")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssetMovement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "asset_id", nullable = false)
    private Asset asset;

    @Column(nullable = false, length = 200)
    private String fromLocation;

    @Column(nullable = false, length = 200)
    private String toLocation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "moved_by_id")
    private User movedBy;

    @Column(length = 500)
    private String reason;

    @Column(nullable = false)
    private LocalDateTime movedAt;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
