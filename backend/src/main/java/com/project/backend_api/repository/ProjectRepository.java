package com.project.backend_api.repository;

import com.project.backend_api.domain.project.Project;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProjectRepository extends JpaRepository<Project, Integer> {
    List<Project> findAllByOrderBySortOrderAscIdDesc();
    List<Project> findByIsFeaturedTrueOrderBySortOrderAscIdDesc();
}
