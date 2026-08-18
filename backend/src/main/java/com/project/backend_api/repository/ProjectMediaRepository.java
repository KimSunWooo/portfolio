package com.project.backend_api.repository;

import com.project.backend_api.domain.project.ProjectMedia;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProjectMediaRepository
        extends JpaRepository<ProjectMedia, Integer> {

    List<ProjectMedia> findByProjectIdOrderBySortOrderAscIdAsc(
            Integer projectId
    );

    void deleteByProjectId(Integer projectId);
}