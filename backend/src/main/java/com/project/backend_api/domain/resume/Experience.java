package com.project.backend_api.domain.resume;

import com.project.backend_api.dto.resume.ExperienceRequest;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Getter
@NoArgsConstructor
@Entity
@Table(name = "experiences")
public class Experience {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "company_name", nullable = false, length = 100)
    private String companyName;

    @Column(length = 100)
    private String position;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "sort_order")
    private Integer sortOrder;

    public static Experience create(ExperienceRequest request) {
        Experience experience = new Experience();
        experience.update(request);
        return experience;
    }

    public void update(ExperienceRequest request) {
        this.companyName = request.companyName();
        this.position = request.position();
        this.startDate = request.startDate();
        this.endDate = request.endDate();
        this.description = request.description();
        this.sortOrder = request.sortOrder() == null ? 0 : request.sortOrder();
    }
}
