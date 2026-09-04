package com.example.policeassetmanagement.repository;

import com.example.policeassetmanagement.entity.Case;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CaseRepository extends JpaRepository<Case, Long> {

    Optional<Case> findByCaseNumber(String caseNumber);

    boolean existsByCaseNumber(String caseNumber);
}
