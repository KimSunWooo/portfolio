package com.project.backend_api.repository;

import com.project.backend_api.domain.community.CommunityCategory;
import com.project.backend_api.domain.community.CommunityPost;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CommunityPostRepository extends JpaRepository<CommunityPost, Integer> {
    List<CommunityPost> findAllByOrderByIsPinnedDescCreatedAtDesc();
    List<CommunityPost> findByCategoryOrderByIsPinnedDescCreatedAtDesc(CommunityCategory category);
}
