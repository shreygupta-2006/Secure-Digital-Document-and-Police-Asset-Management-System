package com.example.policeassetmanagement;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;

@SpringBootApplication
@EntityScan(basePackages = "com.example.policeassetmanagement")
public class PoliceAssetManagementApplication {

    public static void main(String[] args) {
        SpringApplication.run(PoliceAssetManagementApplication.class, args);
    }
}
