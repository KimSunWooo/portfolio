package com.project.backend_api.controller;

import com.project.backend_api.dto.community.CommunityPostCreateRequest;
import com.project.backend_api.dto.community.CommunityPostDetailResponse;
import com.project.backend_api.dto.community.CommunityPostListResponse;
import com.project.backend_api.service.CommunityService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/community/posts")
@RequiredArgsConstructor
public class CommunityController {

    private final CommunityService communityService;

    @GetMapping
    public List<CommunityPostListResponse> getPosts(
            @RequestParam(required = false) String category
    ) {
        return communityService.getPosts(category);
    }

    @GetMapping("/{id}")
    public CommunityPostDetailResponse getPost(@PathVariable Integer id) {
        return communityService.getPost(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CommunityPostDetailResponse createPost(
            @Valid @RequestBody CommunityPostCreateRequest request
    ) {
        return communityService.createPost(request);
    }
}
