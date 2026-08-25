package com.project.backend_api.repository;

import com.project.backend_api.domain.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    // 이메일로 유저 찾기 (로그인 시 사용)
    Optional<User> findByEmail(String email);
    
    // 이메일 중복 가입 방지용
    boolean existsByEmail(String email);
}