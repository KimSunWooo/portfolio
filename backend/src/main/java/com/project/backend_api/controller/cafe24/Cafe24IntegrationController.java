package com.project.backend_api.controller.cafe24;

import com.project.backend_api.service.cafe24.Cafe24IntegrationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/integrations/cafe24")
@RequiredArgsConstructor
public class Cafe24IntegrationController {
    private final Cafe24IntegrationService cafe24IntegrationService;

    @GetMapping("/status")
    public Map<String, Object> getStatus() {
        return cafe24IntegrationService.getStatus();
    }
}
