CREATE TABLE IF NOT EXISTS projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    subtitle VARCHAR(255),
    description TEXT,
    tech_stack VARCHAR(500),
    project_url VARCHAR(255),
    github_url VARCHAR(255),
    thumbnail VARCHAR(255),
    status ENUM('PLANNING','IN_PROGRESS','COMPLETED') DEFAULT 'IN_PROGRESS',
    is_featured BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    start_date DATE,
    end_date DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
