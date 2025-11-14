// backend/database/db.js

const mysql = require('mysql2/promise'); // Importer la librairie MySQL (version Promise)
require('dotenv').config(); // Pour charger les variables du fichier .env

// Configuration du Pool de Connexions
// Un pool gère plusieurs requêtes BDD simultanées, ce qui est idéal pour Express.
const pool = mysql.createPool({
    host: process.env.DB_HOST, // localhost
    user: process.env.DB_USER, // root
    password: process.env.DB_PASSWORD, // votre mot de passe réel
    database: process.env.DB_NAME, // ecoride_db
    port: 3306, // <--- PORT TYPIQUE DE MAMP
    waitForConnections: true,
    connectionLimit: 10, // Max 10 connexions en même temps
    queueLimit: 0
});

// Vérification de la Connexion au démarrage (Test)
pool.getConnection()
    .then(connection => {
        console.log('✅ Connexion à la base de données MySQL réussie !');
        connection.release(); // Relâche la connexion de test immédiatement
    })
    .catch(err => {
        console.error('❌ Échec de la connexion à la base de données !');
        console.error('Vérifiez : 1) Si votre serveur BDD (XAMPP/MAMP) est démarré. 2) Les variables dans .env.');
        console.error(err.stack);
    });

// Exportation du Pool
// Tous les contrôleurs (controllers/) utiliseront ce module pour faire des requêtes.
module.exports = pool;