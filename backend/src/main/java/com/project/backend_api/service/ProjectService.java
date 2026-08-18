package com.project.backend_api.service;

import com.project.backend_api.domain.project.Project;
import com.project.backend_api.dto.project.ProjectRequest;
import com.project.backend_api.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
@RequiredArgsConstructor
public class ProjectService {
    private final ProjectRepository projectRepository;

    @Transactional(readOnly = true)
    public List<Project> getProjects(Boolean featured) {
        return Boolean.TRUE.equals(featured)
                ? projectRepository.findByIsFeaturedTrueOrderBySortOrderAscIdDesc()
                : projectRepository.findAllByOrderBySortOrderAscIdDesc();
    }

    @Transactional(readOnly = true)
    public Project getProject(Integer id) {
        return projectRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "프로젝트를 찾을 수 없습니다. id=" + id));
    }

    @Transactional
    public Project create(ProjectRequest request) {
        try {
            return projectRepository.save(Project.create(request));
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(BAD_REQUEST, "지원하지 않는 프로젝트 상태입니다.");
        }
    }

    @Transactional
    public Project update(Integer id, ProjectRequest request) {
        Project project = getProject(id);
        try {
            project.update(request);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(BAD_REQUEST, "지원하지 않는 프로젝트 상태입니다.");
        }
        return project;
    }

    @Transactional
    public void delete(Integer id) {
        if (!projectRepository.existsById(id)) {
            throw new ResponseStatusException(NOT_FOUND, "프로젝트를 찾을 수 없습니다. id=" + id);
        }
        projectRepository.deleteById(id);
    }
}
