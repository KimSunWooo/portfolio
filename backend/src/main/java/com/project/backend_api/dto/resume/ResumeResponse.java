package com.project.backend_api.dto.resume;

import com.project.backend_api.domain.resume.*;

import java.util.List;

public record ResumeResponse(
        Profile profile,
        List<Skill> skills,
        List<Experience> experiences,
        List<Education> educations,
        List<Introduction> introductions
) {
}
