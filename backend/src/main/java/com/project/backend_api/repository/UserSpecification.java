package com.project.backend_api.repository;

import com.project.backend_api.domain.user.User;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

public class UserSpecification {

    // 1. 이름이 포함되어 있는지 검색 (LIKE %name%)
    public static Specification<User> searchByName(String name) {
        return (root, query, cb) -> {
            if (!StringUtils.hasText(name)) return null;
            return cb.like(root.get("name"), "%" + name + "%");
        };
    }

    // 2. 등급별 누적 결제 금액(totalSpent) 필터링
    public static Specification<User> filterByTier(String tier) {
        return (root, query, cb) -> {
            if (!StringUtils.hasText(tier)) return null;
            
            switch (tier.toUpperCase()) {
                case "VIP": // 100만 원 이상
                    return cb.greaterThanOrEqualTo(root.get("totalSpent"), 1000000L);
                case "GOLD": // 30만 원 이상 ~ 100만 원 미만
                    return cb.between(root.get("totalSpent"), 300000L, 999999L);
                case "SILVER": // 10만 원 이상 ~ 30만 원 미만
                    return cb.between(root.get("totalSpent"), 100000L, 299999L);
                case "BRONZE": // 10만 원 미만
                    return cb.lessThan(root.get("totalSpent"), 100000L);
                default:
                    return null;
            }
        };
    }
}