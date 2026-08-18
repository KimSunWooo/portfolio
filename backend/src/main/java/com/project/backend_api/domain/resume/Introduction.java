package com.project.backend_api.domain.resume;

import com.project.backend_api.dto.resume.IntroductionRequest;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@Entity
@Table(name = "introductions")
public class Introduction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(length = 100)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "sort_order")
    private Integer sortOrder;

    public static Introduction create(IntroductionRequest request) {
        Introduction introduction = new Introduction();
        introduction.update(request);
        return introduction;
    }

    public void update(IntroductionRequest request) {
        this.title = request.title();
        this.content = request.content();
        this.sortOrder = request.sortOrder() == null ? 0 : request.sortOrder();
    }
}
