const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');
const trajetController = require('../controllers/trajet');

router.post('/', authMiddleware, trajetController.createTrajet); 
router.get('/search', trajetController.searchTrajets); 
router.get('/', trajetController.searchTrajets); 
router.get('/mes-trajets', authMiddleware, trajetController.getTrajetsByConducteur);
router.get('/:id/passagers', authMiddleware, trajetController.getPassagersByTrajet);
router.delete('/:id', authMiddleware, trajetController.deleteTrajet);

module.exports = router;