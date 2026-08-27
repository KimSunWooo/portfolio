package com.project.backend_api.controller;

import com.project.backend_api.domain.project.Project;
import com.project.backend_api.dto.project.ProjectMediaResponse;
import com.project.backend_api.dto.project.ProjectRequest;
import com.project.backend_api.service.ProjectService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    // ==========================================
    // 1. Project API
    // ==========================================

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
    public Project updateProject(
            @PathVariable Integer id, 
            @Valid @RequestBody ProjectRequest request
    ) {
        return projectService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteProject(@PathVariable Integer id) {
        projectService.delete(id);
    }


    // ==========================================
    // 2. Project Media API
    // ==========================================

    @GetMapping("/{projectId}/media")
    public List<ProjectMediaResponse> getProjectMedia(@PathVariable Integer projectId) {
        return projectService.getMedia(projectId);
    }

    @PostMapping(value = "/{projectId}/media", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public ProjectMediaResponse uploadProjectMedia(
            @PathVariable Integer projectId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(required = false) String caption,
            @RequestParam(required = false) String altText,
            @RequestParam(defaultValue = "0") Integer sortOrder
    ) {
        return projectService.addMedia(projectId, file, caption, altText, sortOrder);
    }

    @PutMapping("/{projectId}/media/{mediaId}")
    public ProjectMediaResponse updateProjectMedia(
            @PathVariable Integer projectId,
            @PathVariable Integer mediaId,
            @RequestParam(required = false) String caption,
            @RequestParam(required = false) String altText,
            @RequestParam(defaultValue = "0") Integer sortOrder
    ) {
        return projectService.updateMedia(projectId, mediaId, caption, altText, sortOrder);
    }

    @DeleteMapping("/{projectId}/media/{mediaId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteProjectMedia(
            @PathVariable Integer projectId,
            @PathVariable Integer mediaId
    ) {
        projectService.deleteMedia(projectId, mediaId);
    }
}