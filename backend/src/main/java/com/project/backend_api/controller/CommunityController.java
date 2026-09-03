package com.project.backend_api.controller;

import com.project.backend_api.dto.community.CommunityPostCreateRequest;
import com.project.backend_api.dto.community.CommunityPostDetailResponse;
import com.project.backend_api.dto.community.CommunityPostListResponse;
import com.project.backend_api.dto.community.CommunityPostUpdateRequest;
import com.project.backend_api.service.CommunityService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class CommunityController {

    private final CommunityService communityService;

    @GetMapping("/community/posts")
    public List<CommunityPostListResponse> getPosts(@RequestParam(required = false) String category) {
        return communityService.getPosts(category);
    }

    @GetMapping("/community/posts/{id}")
    public CommunityPostDetailResponse getPost(@PathVariable Integer id) {
        return communityService.getPost(id);
    }

    // 커뮤니티 작성도 관리자(공지사항 등) 권한이 필요할 경우 /admin 경로 사용
    @PostMapping("/admin/community/posts")
    @ResponseStatus(HttpStatus.CREATED)
    public CommunityPostDetailResponse createPost(@Valid @RequestBody CommunityPostCreateRequest request) {
        return communityService.createPost(request);
    }
    
    @PutMapping("/admin/community/posts/{id}")
    public ResponseEntity<CommunityPostDetailResponse> updatePost(
            @PathVariable Integer id,
            @Valid @RequestBody CommunityPostUpdateRequest request
    ) {
        CommunityPostDetailResponse response = communityService.updatePost(id, request);
        return ResponseEntity.ok(response);
    }
}