package com.project.backend_api.service;

import com.project.backend_api.domain.project.Project;
import com.project.backend_api.dto.project.ProjectRequest;
import com.project.backend_api.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.project.backend_api.domain.project.MediaType;
import com.project.backend_api.domain.project.ProjectMedia;
import com.project.backend_api.dto.project.ProjectMediaResponse;
import com.project.backend_api.repository.ProjectMediaRepository;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

import java.util.List;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
@RequiredArgsConstructor
public class ProjectService {
    private final ProjectRepository projectRepository;
    private final ProjectMediaRepository projectMediaRepository;

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

    @Transactional(readOnly = true)
    public List<ProjectMediaResponse> getMedia(Integer projectId) {
        getProject(projectId);

        return projectMediaRepository
                .findByProjectIdOrderBySortOrderAscIdAsc(projectId)
                .stream()
                .map(ProjectMediaResponse::from)
                .toList();
    }

    @Transactional
    public ProjectMediaResponse addMedia(
            Integer projectId,
            MultipartFile file,
            String caption,
            String altText,
            Integer sortOrder
    ) {
        getProject(projectId);

        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(
                    BAD_REQUEST,
                    "업로드할 파일이 없습니다."
            );
        }

        MediaType mediaType = resolveMediaType(file);

        String mediaUrl = saveProjectMedia(
                projectId,
                file
        );

        ProjectMedia media = ProjectMedia.create(
                projectId,
                mediaType,
                mediaUrl,
                caption,
                altText,
                sortOrder
        );

        return ProjectMediaResponse.from(
                projectMediaRepository.save(media)
        );
    }

    @Transactional
    public ProjectMediaResponse updateMedia(
            Integer projectId,
            Integer mediaId,
            String caption,
            String altText,
            Integer sortOrder
    ) {
        getProject(projectId);

        ProjectMedia media = projectMediaRepository
                .findById(mediaId)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                NOT_FOUND,
                                "프로젝트 미디어를 찾을 수 없습니다."
                        )
                );

        if (!media.getProjectId().equals(projectId)) {
            throw new ResponseStatusException(
                    BAD_REQUEST,
                    "해당 프로젝트의 미디어가 아닙니다."
            );
        }

        media.update(
                caption,
                altText,
                sortOrder
        );

        return ProjectMediaResponse.from(media);
    }

    @Transactional
    public void deleteMedia(
            Integer projectId,
            Integer mediaId
    ) {
        getProject(projectId);

        ProjectMedia media = projectMediaRepository
                .findById(mediaId)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                NOT_FOUND,
                                "프로젝트 미디어를 찾을 수 없습니다."
                        )
                );

        if (!media.getProjectId().equals(projectId)) {
            throw new ResponseStatusException(
                    BAD_REQUEST,
                    "해당 프로젝트의 미디어가 아닙니다."
            );
        }

        deletePhysicalFile(media.getMediaUrl());

        projectMediaRepository.delete(media);
    }

    private String saveProjectMedia(
            Integer projectId,
            MultipartFile file
    ) {
        try {
            Path uploadDir = Paths.get(
                    System.getProperty("user.dir"),
                    "uploads",
                    "projects",
                    String.valueOf(projectId)
            );

            Files.createDirectories(uploadDir);

            String originalFilename =
                    file.getOriginalFilename();

            String extension = "";

            if (
                    originalFilename != null &&
                    originalFilename.contains(".")
            ) {
                extension = originalFilename.substring(
                        originalFilename.lastIndexOf(".")
                );
            }

            String filename =
                    UUID.randomUUID() + extension;

            Path targetPath = uploadDir
                    .resolve(filename)
                    .normalize();

            Files.copy(
                    file.getInputStream(),
                    targetPath
            );

            return "/uploads/projects/"
                    + projectId
                    + "/"
                    + filename;

        } catch (IOException e) {
            throw new RuntimeException(
                    "프로젝트 미디어 저장에 실패했습니다.",
                    e
            );
        }
    }

    private MediaType resolveMediaType(
            MultipartFile file
    ) {
        String contentType = file.getContentType();

        if (contentType == null) {
            throw new ResponseStatusException(
                    BAD_REQUEST,
                    "파일 형식을 확인할 수 없습니다."
            );
        }

        if (contentType.startsWith("image/")) {
            return MediaType.IMAGE;
        }

        if (contentType.startsWith("video/")) {
            return MediaType.VIDEO;
        }

        throw new ResponseStatusException(
                BAD_REQUEST,
                "이미지 또는 영상 파일만 업로드할 수 있습니다."
        );
    }

    private void deletePhysicalFile(
            String mediaUrl
    ) {
        if (mediaUrl == null || mediaUrl.isBlank()) {
            return;
        }

        try {
            String relativePath =
                    mediaUrl.startsWith("/")
                            ? mediaUrl.substring(1)
                            : mediaUrl;

            Path targetPath = Paths.get(
                    System.getProperty("user.dir"),
                    relativePath
            );

            Files.deleteIfExists(targetPath);

        } catch (IOException e) {
            throw new RuntimeException(
                    "프로젝트 미디어 파일 삭제에 실패했습니다.",
                    e
            );
        }
    }
}
