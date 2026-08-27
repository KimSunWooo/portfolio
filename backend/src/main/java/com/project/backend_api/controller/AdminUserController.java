package com.project.backend_api.controller;

import com.project.backend_api.domain.user.User;
import com.project.backend_api.dto.user.AdminUserResponse;
import com.project.backend_api.repository.UserRepository;
import com.project.backend_api.repository.UserSpecification;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminUserController {

    private final UserRepository userRepository;

    @GetMapping("/users")
    public Page<AdminUserResponse> getAdminUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String tier
    ) {
        // 1. 페이징 설정 (최근 가입일 기준 내림차순 정렬)
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        // 2. 검색 조건 조립 (이름 AND 등급)
        Specification<User> spec = Specification.where(UserSpecification.searchByName(name))
                .and(UserSpecification.filterByTier(tier));

        // 3. 쿼리 실행 (조건과 페이징 적용)
        Page<User> users = userRepository.findAll(spec, pageable);
        
        // 4. Entity Page를 DTO Page로 변환하여 응답
        return users.map(AdminUserResponse::from);
    }
}