package com.example.policeassetmanagement.dto.response;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MovementResponse {

    private Long id;
    private Long assetId;
    private String assetCode;
    private String fromLocation;
    private String toLocation;
    private String movedByName;
    private String reason;
    private LocalDateTime movedAt;
}
