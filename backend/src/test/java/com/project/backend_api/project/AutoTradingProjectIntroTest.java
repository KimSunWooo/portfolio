package com.project.backend_api.project;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AutoTradingProjectIntroTest {

    @Test
    void registrationPayloadMatchesPortfolioProjectContract() throws Exception {
        Path path = Path.of("..", "docs", "projects", "auto-trading-project.json");
        JsonNode project = new ObjectMapper().readTree(Files.readString(path));

        assertTrue(project.get("title").asText().length() <= 150);
        assertTrue(project.get("subtitle").asText().startsWith("Cursor를 활용한 바이브코딩으로 개발한 개인 프로젝트"));
        assertTrue(project.get("subtitle").asText().length() <= 255);
        assertTrue(project.get("description").asText().startsWith("Cursor를 활용한 바이브코딩으로 개발한 개인 프로젝트"));
        assertFalse(project.get("description").asText().contains("\n#"));
        assertFalse(project.get("description").asText().contains("|"));
        assertEquals("https://github.com/KimSunWooo/Auto-Trading-system", project.get("githubUrl").asText());
        assertEquals("IN_PROGRESS", project.get("status").asText());
        assertFalse(project.get("isFeatured").asBoolean());
        assertTrue(project.get("techStack").asText().length() <= 500);
        assertFalse(project.get("techStack").asText().toLowerCase().contains("spring"));
        assertTrue(project.get("projectUrl").isNull());
        assertTrue(project.get("thumbnail").isNull());
        assertEquals("NOT_APPLIED", project.get("registration").asText());
    }
}
