package com.project.backend_api.controller;

import com.project.backend_api.domain.resume.*;
import com.project.backend_api.dto.resume.*;
import com.project.backend_api.service.ResumeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api") // 공통 경로
@RequiredArgsConstructor
public class ResumeController {

    private final ResumeService resumeService;

    // ==========================================
    // Public (조회)
    // ==========================================
    @GetMapping("/resume")
    public ResumeResponse getResume() { return resumeService.getResume(); }

    @GetMapping("/resume/profile")
    public Profile getProfile() { return resumeService.getProfile(); }

    @GetMapping("/resume/skills")
    public List<Skill> getSkills() { return resumeService.getSkills(); }

    @GetMapping("/resume/experiences")
    public List<Experience> getExperiences() { return resumeService.getExperiences(); }

    @GetMapping("/resume/educations")
    public List<Education> getEducations() { return resumeService.getEducations(); }

    @GetMapping("/resume/introductions")
    public List<Introduction> getIntroductions() { return resumeService.getIntroductions(); }

    // ==========================================
    // Admin (등록, 수정, 삭제)
    // ==========================================
    @PutMapping(value = "/admin/resume/profile", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> updateProfile(
            @RequestParam String name,
            @RequestParam String jobTitle,
            @RequestParam String email,
            @RequestParam String phone,
            @RequestParam String githubUrl,
            @RequestParam String shortIntro,
            @RequestParam(required = false) MultipartFile profileImage
    ) {
        ProfileUpdateRequest request = new ProfileUpdateRequest(name, jobTitle, email, phone, githubUrl, null, shortIntro);
        resumeService.updateProfile(request, profileImage);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/admin/resume/skills")
    @ResponseStatus(HttpStatus.CREATED)
    public Skill createSkill(@Valid @RequestBody SkillRequest request) { return resumeService.createSkill(request); }

    @PutMapping("/admin/resume/skills/{id}")
    public Skill updateSkill(@PathVariable Integer id, @Valid @RequestBody SkillRequest request) { return resumeService.updateSkill(id, request); }

    @DeleteMapping("/admin/resume/skills/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteSkill(@PathVariable Integer id) { resumeService.deleteSkill(id); }

    @PostMapping("/admin/resume/experiences")
    @ResponseStatus(HttpStatus.CREATED)
    public Experience createExperience(@Valid @RequestBody ExperienceRequest request) { return resumeService.createExperience(request); }

    @PutMapping("/admin/resume/experiences/{id}")
    public Experience updateExperience(@PathVariable Integer id, @Valid @RequestBody ExperienceRequest request) { return resumeService.updateExperience(id, request); }

    @DeleteMapping("/admin/resume/experiences/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteExperience(@PathVariable Integer id) { resumeService.deleteExperience(id); }

    @PostMapping("/admin/resume/educations")
    @ResponseStatus(HttpStatus.CREATED)
    public Education createEducation(@Valid @RequestBody EducationRequest request) { return resumeService.createEducation(request); }

    @PutMapping("/admin/resume/educations/{id}")
    public Education updateEducation(@PathVariable Integer id, @Valid @RequestBody EducationRequest request) { return resumeService.updateEducation(id, request); }

    @DeleteMapping("/admin/resume/educations/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteEducation(@PathVariable Integer id) { resumeService.deleteEducation(id); }

    @PostMapping("/admin/resume/introductions")
    @ResponseStatus(HttpStatus.CREATED)
    public Introduction createIntroduction(@Valid @RequestBody IntroductionRequest request) { return resumeService.createIntroduction(request); }

    @PutMapping("/admin/resume/introductions/{id}")
    public Introduction updateIntroduction(@PathVariable Integer id, @Valid @RequestBody IntroductionRequest request) { return resumeService.updateIntroduction(id, request); }

    @DeleteMapping("/admin/resume/introductions/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteIntroduction(@PathVariable Integer id) { resumeService.deleteIntroduction(id); }
}