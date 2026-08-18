package com.project.backend_api.repository;

import com.project.backend_api.domain.resume.Experience;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ExperienceRepository extends JpaRepository<Experience, Integer> {
    List<Experience> findAllByOrderBySortOrderAscIdAsc();
}
