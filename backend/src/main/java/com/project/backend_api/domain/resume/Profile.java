package com.project.backend_api.domain.resume;

import com.project.backend_api.dto.resume.ProfileUpdateRequest;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
@Entity
@Table(name = "profile")
public class Profile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, length = 50)
    private String name;

    @Column(name = "job_title", length = 100)
    private String jobTitle;

    @Column(length = 100)
    private String email;

    @Column(length = 30)
    private String phone;

    @Column(name = "github_url", length = 255)
    private String githubUrl;

    @Column(name = "profile_image", length = 255)
    private String profileImage;

    @Column(name = "short_intro", columnDefinition = "TEXT")
    private String shortIntro;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public static Profile create(ProfileUpdateRequest request) {
        Profile profile = new Profile();
        profile.createdAt = LocalDateTime.now();
        profile.update(request);
        return profile;
    }

    public void update(ProfileUpdateRequest request) {
        this.name = request.name();
        this.jobTitle = request.jobTitle();
        this.email = request.email();
        this.phone = request.phone();
        this.githubUrl = request.githubUrl();
        this.shortIntro = request.shortIntro();
        this.updatedAt = LocalDateTime.now();
    }

    public void updateProfileImage(String profileImage) {
        this.profileImage = profileImage;
        this.updatedAt = LocalDateTime.now();
    }
}
