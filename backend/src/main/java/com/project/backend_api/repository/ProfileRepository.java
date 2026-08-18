package com.project.backend_api.repository;

import com.project.backend_api.domain.resume.Profile;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProfileRepository extends JpaRepository<Profile, Integer> {
}
