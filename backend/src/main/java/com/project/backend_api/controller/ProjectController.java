package com.project.backend_api.controller;

import com.project.backend_api.domain.project.Project;
import com.project.backend_api.dto.project.ProjectRequest;
import com.project.backend_api.service.ProjectService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {
    private final ProjectService projectService;

    @GetMapping
    public List<Project> getProjects(@RequestParam(required = false) Boolean featured) {
        return projectService.getProjects(featured);
    }

    @GetMapping("/{id}")
    public Project getProject(@PathVariable Integer id) {
        return projectService.getProject(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Project createProject(@Valid @RequestBody ProjectRequest request) {
        return projectService.create(request);
    }

    @PutMapping("/{id}")
    public Project updateProject(@PathVariable Integer id, @Valid @RequestBody ProjectRequest request) {
        return projectService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteProject(@PathVariable Integer id) {
        projectService.delete(id);
    }
}
