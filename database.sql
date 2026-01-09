-- Script SQL para criar e preencher a Base de Dados
-- Projeto PIS - Gestão de Filmes e Séries
-- 2025/2026

-- Criar Base de Dados
CREATE DATABASE IF NOT EXISTS cine_pis_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE cine_pis_db;
SET NAMES utf8mb4;

-- Tabela de Utilizadores
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin') DEFAULT 'user',
    google_id VARCHAR(255) NULL,
    UNIQUE KEY unique_google_id (google_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Géneros
CREATE TABLE IF NOT EXISTS genres (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Atores
CREATE TABLE IF NOT EXISTS actors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    tmdb_id INT NULL,
    UNIQUE KEY unique_actor_tmdb (tmdb_id),
    profile_path VARCHAR(500) NULL,
    biography TEXT NULL,
    birth_date DATE NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Diretores
CREATE TABLE IF NOT EXISTS directors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    tmdb_id INT NULL,
    UNIQUE KEY unique_director_tmdb (tmdb_id),
    profile_path VARCHAR(500) NULL,
    biography TEXT NULL,
    birth_date DATE NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Conteúdos (Filmes/Séries)
CREATE TABLE IF NOT EXISTS contents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tmdb_id INT NULL,
    title VARCHAR(500) NOT NULL,
    synopsis TEXT NOT NULL,
    type ENUM('movie', 'series') NOT NULL,
    release_date DATE,
    duration INT, -- Duração em minutos (para filmes) ou número de episódios (para séries)
    poster_path VARCHAR(500),
    backdrop_path VARCHAR(500),
    trailer_url VARCHAR(500),
    vote_average DECIMAL(3,1) DEFAULT 0,
    UNIQUE KEY unique_tmdb_type (tmdb_id, type),
    INDEX idx_contents_type (type),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Relação Conteúdo-Géneros
CREATE TABLE IF NOT EXISTS content_genres (
    id INT AUTO_INCREMENT PRIMARY KEY,
    content_id INT NOT NULL,
    genre_id INT NOT NULL,
    FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE,
    FOREIGN KEY (genre_id) REFERENCES genres(id) ON DELETE CASCADE,
    UNIQUE KEY unique_content_genre (content_id, genre_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Relação Conteúdo-Atores (Elenco Principal)
CREATE TABLE IF NOT EXISTS content_actors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    content_id INT NOT NULL,
    actor_id INT NOT NULL,
    character_name VARCHAR(255) NULL,
    FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE,
    FOREIGN KEY (actor_id) REFERENCES actors(id) ON DELETE CASCADE,
    UNIQUE KEY unique_content_actor (content_id, actor_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Relação Conteúdo-Diretores
CREATE TABLE IF NOT EXISTS content_directors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    content_id INT NOT NULL,
    director_id INT NOT NULL,
    FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE,
    FOREIGN KEY (director_id) REFERENCES directors(id) ON DELETE CASCADE,
    UNIQUE KEY unique_content_director (content_id, director_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Reviews
CREATE TABLE IF NOT EXISTS reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    content_id INT NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 10),
    comment TEXT NOT NULL,
    review_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    utility_counter INT DEFAULT 0,
    INDEX idx_reviews_content (content_id),
    INDEX idx_reviews_user (user_id),
    INDEX idx_reviews_date (review_date),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_content_review (user_id, content_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Votos de Utilidade das Reviews
CREATE TABLE IF NOT EXISTS review_votes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    review_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_review_vote (user_id, review_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Favoritos
CREATE TABLE IF NOT EXISTS favorites (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    content_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_content_favorite (user_id, content_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Listas Personalizadas
CREATE TABLE IF NOT EXISTS personal_lists (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Itens das Listas Personalizadas
CREATE TABLE IF NOT EXISTS list_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    list_id INT NOT NULL,
    content_id INT NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (list_id) REFERENCES personal_lists(id) ON DELETE CASCADE,
    FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE,
    UNIQUE KEY unique_list_content (list_id, content_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Inserir Utilizador Admin
-- Credenciais: Email: admin@cinepis.pt | Password: admin123
INSERT INTO users (name, email, password, role) VALUES
('Admin', 'admin@cinepis.pt', '$2b$10$PsCOCon0o2IpiMGmSSuI5eS4y0qgpWeb3mXhEwT0Y9RSwQYdF.xl6', 'admin')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  password = VALUES(password),
  role = VALUES(role);

