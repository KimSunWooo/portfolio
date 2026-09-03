package com.project.backend_api.service;

import com.project.backend_api.domain.community.CommunityCategory;
import com.project.backend_api.domain.community.CommunityPost;
import com.project.backend_api.dto.community.CommunityPostCreateRequest;
import com.project.backend_api.dto.community.CommunityPostDetailResponse;
import com.project.backend_api.dto.community.CommunityPostListResponse;
import com.project.backend_api.dto.community.CommunityPostUpdateRequest;
import com.project.backend_api.repository.CommunityPostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
@RequiredArgsConstructor
public class CommunityService {

    private final CommunityPostRepository communityPostRepository;

    @Transactional(readOnly = true)
    public List<CommunityPostListResponse> getPosts(String category) {
        List<CommunityPost> posts;

        if (category == null || category.isBlank()) {
            posts = communityPostRepository.findAllByOrderByIsPinnedDescCreatedAtDesc();
        } else {
            CommunityCategory parsedCategory = parseCategory(category);
            posts = communityPostRepository
                    .findByCategoryOrderByIsPinnedDescCreatedAtDesc(parsedCategory);
        }

        return posts.stream()
                .map(CommunityPostListResponse::from)
                .toList();
    }

    @Transactional
    public CommunityPostDetailResponse getPost(Integer id) {
        CommunityPost post = communityPostRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        NOT_FOUND,
                        "게시글을 찾을 수 없습니다. id=" + id
                ));

        post.increaseViewCount();
        return CommunityPostDetailResponse.from(post);
    }

    @Transactional
    public CommunityPostDetailResponse createPost(CommunityPostCreateRequest request) {
        CommunityCategory category = parseCategory(request.category());

        CommunityPost post;

        // TECH 카테고리인 경우 전용 팩토리 메서드 사용
        if (category == CommunityCategory.TECH) {
            post = CommunityPost.createTechLog(
                    request.title().trim(),
                    request.content().trim(),
                    request.author(),
                    request.isPinned(),
                    request.occurrenceDate(),
                    request.status(),
                    request.severity(),
                    request.techStack(),
                    request.errorMessage(),
                    request.situation()
            );
        } else {
            // 일반 카테고리인 경우 기존 팩토리 메서드 사용
            post = CommunityPost.create(
                    category,
                    request.title().trim(),
                    request.content().trim(),
                    request.author(),
                    request.isPinned()
            );
        }

        CommunityPost saved = communityPostRepository.save(post);
        return CommunityPostDetailResponse.from(saved);
    }

    @Transactional
    public CommunityPostDetailResponse updatePost(Integer id, CommunityPostUpdateRequest request) {
        CommunityPost post = communityPostRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        NOT_FOUND,
                        "게시글을 찾을 수 없습니다. id=" + id
                ));

        CommunityCategory category = parseCategory(request.category());

        // 엔티티 수정 (JPA 더티 체킹으로 인해 save 호출 불필요)
        post.update(
                category,
                request.title().trim(),
                request.content().trim(),
                request.author(),
                request.isPinned(),
                request.occurrenceDate(),
                request.status(),
                request.severity(),
                request.techStack(),
                request.errorMessage(),
                request.situation()
        );

        return CommunityPostDetailResponse.from(post);
    }

    private CommunityCategory parseCategory(String category) {
        try {
            return CommunityCategory.valueOf(category.trim().toUpperCase());
        } catch (IllegalArgumentException | NullPointerException e) {
            throw new ResponseStatusException(
                    BAD_REQUEST,
                    "지원하지 않는 category입니다. NOTICE, FAQ, EVENT, QNA, TECH 중 하나를 사용하세요." // TECH 추가
            );
        }
    }

    @Transactional
    public void deletePost(Integer id) {
        CommunityPost post = communityPostRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("해당 게시글을 찾을 수 없습니다. id=" + id));
        
        communityPostRepository.delete(post);
    }
}