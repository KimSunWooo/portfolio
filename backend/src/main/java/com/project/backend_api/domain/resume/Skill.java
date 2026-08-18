package com.project.backend_api.domain.resume;

import com.project.backend_api.dto.resume.SkillRequest;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@Entity
@Table(name = "skills")
public class Skill {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, length = 50)
    private String name;

    @Column(length = 50)
    private String category;

    @Column(length = 20)
    private String level;

    @Column(name = "sort_order")
    private Integer sortOrder;

    public static Skill create(SkillRequest request) {
        Skill skill = new Skill();
        skill.update(request);
        return skill;
    }

    public void update(SkillRequest request) {
        this.name = request.name();
        this.category = request.category();
        this.level = request.level();
        this.sortOrder = request.sortOrder() == null ? 0 : request.sortOrder();
    }
}
