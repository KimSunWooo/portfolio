package com.project.backend_api.dto.project;

import com.project.backend_api.domain.project.ProjectMedia;

public record ProjectMediaResponse(
        Integer id,
        Integer projectId,
        String mediaType,
        String mediaUrl,
        String caption,
        String altText,
        Integer sortOrder
) {
    public static ProjectMediaResponse from(
            ProjectMedia media
    ) {
        return new ProjectMediaResponse(
                media.getId(),
                media.getProjectId(),
                media.getMediaType().name(),
                media.getMediaUrl(),
                media.getCaption(),
                media.getAltText(),
                media.getSortOrder()
        );
    }
}