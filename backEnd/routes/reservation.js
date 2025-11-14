// backend/routes/reservation.js

const express = require('express');
const router = express.Router();

const reservationController = require('../controllers/reservation');
const authMiddleware = require('../middlewares/auth'); 

// US 4 : Créer une réservation (POST /api/v1/reservations)
router.post('/', authMiddleware, reservationController.createReservation);

// US 6 : Lister les réservations de l'utilisateur
router.get('/user', authMiddleware, reservationController.getUserReservations);

// US 9 : Annuler une réservation par son ID
router.delete('/:id', authMiddleware, reservationController.cancelReservation);

module.exports = router;