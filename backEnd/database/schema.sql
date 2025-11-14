-- backend/database/schema.sql

-- Désactive la vérification des clés étrangères pour permettre la suppression
SET foreign_key_checks = 0;

-- Supprime la table 'user' si elle existe (pour pouvoir relancer le script)
DROP TABLE IF EXISTS user;

-- Crée la table pour les utilisateurs
CREATE TABLE user (
    id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone_number VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Active la vérification des clés étrangères
SET foreign_key_checks = 1;