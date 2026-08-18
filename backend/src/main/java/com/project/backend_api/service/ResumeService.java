package com.project.backend_api.service;

import com.project.backend_api.domain.resume.*;
import com.project.backend_api.dto.resume.*;
import com.project.backend_api.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
@RequiredArgsConstructor
public class ResumeService {

    private final ProfileRepository profileRepository;
    private final SkillRepository skillRepository;
    private final ExperienceRepository experienceRepository;
    private final EducationRepository educationRepository;
    private final IntroductionRepository introductionRepository;

    @Transactional(readOnly = true)
    public ResumeResponse getResume() {
        return new ResumeResponse(
                getProfileOrNull(),
                skillRepository.findAllByOrderBySortOrderAscIdAsc(),
                experienceRepository.findAllByOrderBySortOrderAscIdAsc(),
                educationRepository.findAllByOrderBySortOrderAscIdAsc(),
                introductionRepository.findAllByOrderBySortOrderAscIdAsc()
        );
    }

    @Transactional(readOnly = true)
    public Profile getProfile() {
        Profile profile = getProfileOrNull();
        if (profile == null) throw new ResponseStatusException(NOT_FOUND, "프로필이 없습니다.");
        return profile;
    }

    @Transactional
    public Profile updateProfile(ProfileUpdateRequest request) {
        Profile profile = getProfileOrNull();
        if (profile == null) {
            return profileRepository.save(Profile.create(request));
        }
        profile.update(request);
        return profile;
    }

    @Transactional(readOnly = true)
    public List<Skill> getSkills() {
        return skillRepository.findAllByOrderBySortOrderAscIdAsc();
    }

    @Transactional
    public Skill createSkill(SkillRequest request) {
        return skillRepository.save(Skill.create(request));
    }

    @Transactional
    public Skill updateSkill(Integer id, SkillRequest request) {
        Skill skill = skillRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "기술을 찾을 수 없습니다. id=" + id));
        skill.update(request);
        return skill;
    }

    @Transactional
    public void deleteSkill(Integer id) {
        if (!skillRepository.existsById(id)) throw new ResponseStatusException(NOT_FOUND, "기술을 찾을 수 없습니다. id=" + id);
        skillRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public List<Experience> getExperiences() {
        return experienceRepository.findAllByOrderBySortOrderAscIdAsc();
    }

    @Transactional
    public Experience createExperience(ExperienceRequest request) {
        return experienceRepository.save(Experience.create(request));
    }

    @Transactional
    public Experience updateExperience(Integer id, ExperienceRequest request) {
        Experience experience = experienceRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "경력을 찾을 수 없습니다. id=" + id));
        experience.update(request);
        return experience;
    }

    @Transactional
    public void deleteExperience(Integer id) {
        if (!experienceRepository.existsById(id)) throw new ResponseStatusException(NOT_FOUND, "경력을 찾을 수 없습니다. id=" + id);
        experienceRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public List<Education> getEducations() {
        return educationRepository.findAllByOrderBySortOrderAscIdAsc();
    }

    @Transactional
    public Education createEducation(EducationRequest request) {
        return educationRepository.save(Education.create(request));
    }

    @Transactional
    public Education updateEducation(Integer id, EducationRequest request) {
        Education education = educationRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "학력을 찾을 수 없습니다. id=" + id));
        education.update(request);
        return education;
    }

    @Transactional
    public void deleteEducation(Integer id) {
        if (!educationRepository.existsById(id)) throw new ResponseStatusException(NOT_FOUND, "학력을 찾을 수 없습니다. id=" + id);
        educationRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public List<Introduction> getIntroductions() {
        return introductionRepository.findAllByOrderBySortOrderAscIdAsc();
    }

    @Transactional
    public Introduction createIntroduction(IntroductionRequest request) {
        return introductionRepository.save(Introduction.create(request));
    }

    @Transactional
    public Introduction updateIntroduction(Integer id, IntroductionRequest request) {
        Introduction introduction = introductionRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "소개글을 찾을 수 없습니다. id=" + id));
        introduction.update(request);
        return introduction;
    }

    @Transactional
    public void deleteIntroduction(Integer id) {
        if (!introductionRepository.existsById(id)) throw new ResponseStatusException(NOT_FOUND, "소개글을 찾을 수 없습니다. id=" + id);
        introductionRepository.deleteById(id);
    }

    private Profile getProfileOrNull() {
        return profileRepository.findAll().stream().findFirst().orElse(null);
    }
}
