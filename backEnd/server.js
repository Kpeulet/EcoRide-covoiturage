// backend/server.js

// 1. Charger les variables d'environnement (.env)
require('dotenv').config(); // Cette ligne DOIT être la première

// AJOUTEZ CETTE LIGNE TEMPORAIREMENT
console.log('--- Démarrage ---'); 
console.log('JWT Secret chargé :', process.env.JWT_SECRET); 
console.log('-----------------');

const express = require('express');

const bodyParser = require('body-parser'); 
const cors = require('cors'); 

// Fichiers de routes (doivent exister, même vides)
const userRoutes = require('./routes/user'); 
const trajetRoutes = require('./routes/trajet');
const reservationRoutes = require('./routes/reservation');

// --- Initialisation ---
const app = express();
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

// --- Middlewares de Base ---
// --- Middlewares de Base ---
app.use(cors({
    origin: '*', // <--- SOLUTION TEMPORAIRE : Autoriser toutes les origines
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Traiter les corps de requêtes JSON
app.use(bodyParser.json()); 
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));


// --- Définition des Routes API ---
app.use('/api/v1/users', userRoutes); // <-- C'est cette ligne qui lie la base de l'URL '/api/v1/users'
app.use('/api/v1/trajets', trajetRoutes);
app.use('/api/v1/reservations', reservationRoutes);


// --- Route de Test ---
app.get('/api/v1/status', (req, res) => {
    res.status(200).json({ message: 'API EcoRide est opérationnelle!' });
});


// --- Lancement du Serveur ---
app.listen(PORT, HOST, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});