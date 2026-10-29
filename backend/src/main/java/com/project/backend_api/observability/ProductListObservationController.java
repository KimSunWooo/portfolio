package com.project.backend_api.observability;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/**
 * Local snapshot of the product-list counters. Absent when observation is off.
 */
@RestController
@ConditionalOnProperty(name = "app.observability.product-list.enabled", havingValue = "true")
public class ProductListObservationController {

    private final ProductListObservation observation;

    public ProductListObservationController(ProductListObservation observation) {
        this.observation = observation;
    }

    @GetMapping("/internal/product-list-observation")
    public ProductListObservationSnapshot snapshot(HttpServletRequest request) {
        String remote = request.getRemoteAddr();
        if (!"127.0.0.1".equals(remote) && !"::1".equals(remote) && !"0:0:0:0:0:0:0:1".equals(remote)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }
        return observation.snapshot();
    }
}
