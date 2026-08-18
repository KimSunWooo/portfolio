package com.project.backend_api.repository;

import com.project.backend_api.domain.resume.Skill;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SkillRepository extends JpaRepository<Skill, Integer> {
    List<Skill> findAllByOrderBySortOrderAscIdAsc();
}
