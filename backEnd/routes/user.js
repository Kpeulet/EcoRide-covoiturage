// backend/routes/user.js

const express = require('express');
const router = express.Router(); // <-- IMPORTANT
const userController = require('../controllers/user');
const authMiddleware = require('../middlewares/auth');

// La route REGISTER est ici ! L'URL finale sera /api/v1/users/register
router.post('/register', userController.register);

// La route LOGIN sera ici
// router.post('/login', userController.login);

module.exports = router; // <-- EXPORTATION DU ROUTER (très important !)

// Route REGISTER (déjà faite)
router.post('/register', userController.register);

// Route LOGIN (NOUVEAU)
router.post('/login', userController.login);

// Route PROFIL : L'URL finale sera /api/v1/users/profil
router.get('/profil', authMiddleware, userController.getProfil);

module.exports = router;
