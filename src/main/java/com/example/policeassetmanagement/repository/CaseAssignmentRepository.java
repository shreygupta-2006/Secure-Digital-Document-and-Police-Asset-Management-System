package com.example.policeassetmanagement.repository;

import com.example.policeassetmanagement.entity.CaseAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CaseAssignmentRepository extends JpaRepository<CaseAssignment, Long> {

    @Query("SELECT ca.caseEntity.id FROM CaseAssignment ca WHERE ca.user.id = :userId AND ca.status = :status")
    List<Long> findCaseIdsByUserIdAndStatus(@Param("userId") Long userId, @Param("status") String status);

    List<CaseAssignment> findByCaseEntity(com.example.policeassetmanagement.entity.Case caseEntity);

    List<CaseAssignment> findByCaseEntityAndStatus(com.example.policeassetmanagement.entity.Case caseEntity, String status);

    boolean existsByCaseEntityAndUserAndStatus(com.example.policeassetmanagement.entity.Case caseEntity,
                                                com.example.policeassetmanagement.entity.User user,
                                                String status);
}
