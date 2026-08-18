package com.project.backend_api.domain.resume;

import com.project.backend_api.dto.resume.EducationRequest;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Getter
@NoArgsConstructor
@Entity
@Table(name = "educations")
public class Education {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "school_name", nullable = false, length = 100)
    private String schoolName;

    @Column(length = 100)
    private String major;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(length = 500)
    private String description;

    @Column(name = "sort_order")
    private Integer sortOrder;

    public static Education create(EducationRequest request) {
        Education education = new Education();
        education.update(request);
        return education;
    }

    public void update(EducationRequest request) {
        this.schoolName = request.schoolName();
        this.major = request.major();
        this.startDate = request.startDate();
        this.endDate = request.endDate();
        this.description = request.description();
        this.sortOrder = request.sortOrder() == null ? 0 : request.sortOrder();
    }
}
