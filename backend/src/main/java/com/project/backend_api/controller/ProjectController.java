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
@RequestMapping("/api") // 공통 경로
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    // ==========================================
    // Public (조회)
    // ==========================================
    @GetMapping("/projects")
    public List<Project> getProjects(@RequestParam(required = false) Boolean featured) {
        return projectService.getProjects(featured);
    }

    @GetMapping("/projects/{id}")
    public Project getProject(@PathVariable Integer id) {
        return projectService.getProject(id);
    }

    @GetMapping("/projects/{projectId}/media")
    public List<ProjectMediaResponse> getProjectMedia(@PathVariable Integer projectId) {
        return projectService.getMedia(projectId);
    }

    // ==========================================
    // Admin (등록, 수정, 삭제)
    // ==========================================
    @PostMapping("/admin/projects")
    @ResponseStatus(HttpStatus.CREATED)
    public Project createProject(@Valid @RequestBody ProjectRequest request) {
        return projectService.create(request);
    }

    @PutMapping("/admin/projects/{id}")
    public Project updateProject(@PathVariable Integer id, @Valid @RequestBody ProjectRequest request) {
        return projectService.update(id, request);
    }

    @DeleteMapping("/admin/projects/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteProject(@PathVariable Integer id) {
        projectService.delete(id);
    }

    @PostMapping(value = "/admin/projects/{projectId}/media", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
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

    @PutMapping("/admin/projects/{projectId}/media/{mediaId}")
    public ProjectMediaResponse updateProjectMedia(
            @PathVariable Integer projectId,
            @PathVariable Integer mediaId,
            @RequestParam(required = false) String caption,
            @RequestParam(required = false) String altText,
            @RequestParam(defaultValue = "0") Integer sortOrder
    ) {
        return projectService.updateMedia(projectId, mediaId, caption, altText, sortOrder);
    }

    @DeleteMapping("/admin/projects/{projectId}/media/{mediaId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteProjectMedia(@PathVariable Integer projectId, @PathVariable Integer mediaId) {
        projectService.deleteMedia(projectId, mediaId);
    }
}