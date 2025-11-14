-- Structure de la base de données corrigée pour l'ECF

CREATE TABLE utilisateur (
    utilisateur_id INT AUTO_INCREMENT PRIMARY KEY,
    pseudo VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    credits FLOAT DEFAULT 20.0, -- Essentiel pour US 7 et US 6/10
    -- Autres champs...
);

CREATE TABLE preference (
    preference_id INT AUTO_INCREMENT PRIMARY KEY,
    utilisateur_id INT NOT NULL UNIQUE,
    fumeur_accepte BOOLEAN DEFAULT TRUE,
    animaux_acceptes BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateur(utilisateur_id)
);

CREATE TABLE trajet (
    trajet_id INT AUTO_INCREMENT PRIMARY KEY,
    conducteur_id INT NOT NULL,
    vehicule_id INT NOT NULL,
    places_disponibles INT NOT NULL,
    prix_total FLOAT NOT NULL,
    -- Autres champs...
    FOREIGN KEY (conducteur_id) REFERENCES utilisateur(utilisateur_id)
);

CREATE TABLE reservation (
    reservation_id INT AUTO_INCREMENT PRIMARY KEY,
    trajet_id INT NOT NULL,
    passager_id INT NOT NULL,
    places_reservees INT NOT NULL, -- Crucial pour la transaction US 6
    statut ENUM('Confirmée', 'Annulée', 'Terminée') DEFAULT 'Confirmée',
    FOREIGN KEY (trajet_id) REFERENCES trajet(trajet_id),
    FOREIGN KEY (passager_id) REFERENCES utilisateur(utilisateur_id)
);

-- Données de Test (INSERT INTO)
INSERT INTO utilisateur (pseudo, email, password, credits) VALUES
('conducteur_test', 'conducteur@ecoride.fr', 'motdepasse_hashe_1', 15.0),
('passager_test', 'passager@ecoride.fr', 'motdepasse_hashe_2', 30.0),
('employe_admin', 'admin@ecoride.fr', 'motdepasse_hashe_3', 999.0);

-- Insérez au moins 1 véhicule, 1 trajet et 1 réservation de test ici.