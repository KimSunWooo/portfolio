package com.project.backend_api.repository;

import com.project.backend_api.domain.resume.Education;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EducationRepository extends JpaRepository<Education, Integer> {
    List<Education> findAllByOrderBySortOrderAscIdAsc();
}
