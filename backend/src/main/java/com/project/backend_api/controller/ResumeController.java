package com.project.backend_api.controller;

import com.project.backend_api.domain.resume.*;
import com.project.backend_api.dto.resume.*;
import com.project.backend_api.service.ResumeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/resume")
@RequiredArgsConstructor
public class ResumeController {

    private final ResumeService resumeService;

    @GetMapping
    public ResumeResponse getResume() {
        return resumeService.getResume();
    }

    @GetMapping("/profile")
    public Profile getProfile() {
        return resumeService.getProfile();
    }

    @PutMapping("/profile")
    public Profile updateProfile(@Valid @RequestBody ProfileUpdateRequest request) {
        return resumeService.updateProfile(request);
    }

    @GetMapping("/skills")
    public List<Skill> getSkills() {
        return resumeService.getSkills();
    }

    @PostMapping("/skills")
    @ResponseStatus(HttpStatus.CREATED)
    public Skill createSkill(@Valid @RequestBody SkillRequest request) {
        return resumeService.createSkill(request);
    }

    @PutMapping("/skills/{id}")
    public Skill updateSkill(@PathVariable Integer id, @Valid @RequestBody SkillRequest request) {
        return resumeService.updateSkill(id, request);
    }

    @DeleteMapping("/skills/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteSkill(@PathVariable Integer id) {
        resumeService.deleteSkill(id);
    }

    @GetMapping("/experiences")
    public List<Experience> getExperiences() {
        return resumeService.getExperiences();
    }

    @PostMapping("/experiences")
    @ResponseStatus(HttpStatus.CREATED)
    public Experience createExperience(@Valid @RequestBody ExperienceRequest request) {
        return resumeService.createExperience(request);
    }

    @PutMapping("/experiences/{id}")
    public Experience updateExperience(@PathVariable Integer id, @Valid @RequestBody ExperienceRequest request) {
        return resumeService.updateExperience(id, request);
    }

    @DeleteMapping("/experiences/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteExperience(@PathVariable Integer id) {
        resumeService.deleteExperience(id);
    }

    @GetMapping("/educations")
    public List<Education> getEducations() {
        return resumeService.getEducations();
    }

    @PostMapping("/educations")
    @ResponseStatus(HttpStatus.CREATED)
    public Education createEducation(@Valid @RequestBody EducationRequest request) {
        return resumeService.createEducation(request);
    }

    @PutMapping("/educations/{id}")
    public Education updateEducation(@PathVariable Integer id, @Valid @RequestBody EducationRequest request) {
        return resumeService.updateEducation(id, request);
    }

    @DeleteMapping("/educations/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteEducation(@PathVariable Integer id) {
        resumeService.deleteEducation(id);
    }

    @GetMapping("/introductions")
    public List<Introduction> getIntroductions() {
        return resumeService.getIntroductions();
    }

    @PostMapping("/introductions")
    @ResponseStatus(HttpStatus.CREATED)
    public Introduction createIntroduction(@Valid @RequestBody IntroductionRequest request) {
        return resumeService.createIntroduction(request);
    }

    @PutMapping("/introductions/{id}")
    public Introduction updateIntroduction(@PathVariable Integer id, @Valid @RequestBody IntroductionRequest request) {
        return resumeService.updateIntroduction(id, request);
    }

    @DeleteMapping("/introductions/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteIntroduction(@PathVariable Integer id) {
        resumeService.deleteIntroduction(id);
    }
}
