package com.project.backend_api.repository;

import com.project.backend_api.domain.resume.Introduction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface IntroductionRepository extends JpaRepository<Introduction, Integer> {
    List<Introduction> findAllByOrderBySortOrderAscIdAsc();
}
