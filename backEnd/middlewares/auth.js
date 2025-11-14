// backend/middlewares/auth.js

const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    try {
        const header = req.headers.authorization; 
        
        if (!header) {
            // Gère le cas où l'en-tête Authorization est totalement absent
            throw new Error('Header manquant'); 
        }

        // 1. TRIM pour enlever les espaces accidentels, puis SPLIT pour séparer 'Bearer' du jeton
        const tokenArray = header.trim().split(' ');
        
        // 2. Vérification du format (Doit être 'Bearer [token]')
        if (tokenArray.length !== 2 || tokenArray[0] !== 'Bearer') {
             throw new Error('Format de token invalide');
        }

        const token = tokenArray[1];
        
        // 3. Vérification du jeton avec le secret
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET); 
         const userId = decodedToken.userId;
        req.auth = { userId: userId };
        next();
    } catch (error) {
        console.error('Erreur d\'authentification (JWT échoué):', error.message);
        res.status(401).json({
            error: 'Requête non authentifiée !'
        });
    }
};