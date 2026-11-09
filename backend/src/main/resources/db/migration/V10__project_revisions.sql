ALTER TABLE projects
    ADD COLUMN draft_description TEXT NULL AFTER description,
    ADD COLUMN published_at DATETIME(6) NULL AFTER updated_at;

CREATE TABLE project_revisions (
    id BIGINT NOT NULL AUTO_INCREMENT,
    project_id INT NOT NULL,
    revision_no INT NOT NULL,
    title VARCHAR(150) NOT NULL,
    subtitle VARCHAR(255) NULL,
    description TEXT NULL,
    tech_stack VARCHAR(500) NULL,
    status VARCHAR(20) NULL,
    created_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_project_revisions_project_rev (project_id, revision_no),
    CONSTRAINT fk_project_revisions_project
        FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
);
