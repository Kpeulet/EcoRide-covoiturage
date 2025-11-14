// backend/controllers/user.js

const pool = require('../database/db'); 
const bcrypt = require('bcrypt'); 
const jwt = require('jsonwebtoken'); // Assurez-vous que cette ligne est bien présente !

// US 7 : Inscription d'un nouvel utilisateur
const register = async (req, res) => {
    // ... (Votre code existant pour register)
    const { email, password, first_name, last_name, phone_number } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "Veuillez fournir un email et un mot de passe." });
    }

    try {
        const password_hash = await bcrypt.hash(password, 10);

        const query = `
            INSERT INTO user (email, password_hash, first_name, last_name, phone_number)
            VALUES (?, ?, ?, ?, ?)
        `;
        
        const [result] = await pool.query(query, [email, password_hash, first_name, last_name, phone_number]);

        res.status(201).json({ 
            message: "Inscription réussie !",
            userId: result.insertId,
            email: email
        });

    } catch (error) {
        console.error('Erreur lors de l\'inscription :', error);
        
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: "Cet email est déjà utilisé." });
        }

        res.status(500).json({ message: "Erreur serveur lors de l'inscription." });
    }
};

// US 8 : Connexion d'un utilisateur existant
const login = async (req, res) => {
    // ... (Votre code existant pour login)
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "Veuillez fournir un email et un mot de passe." });
    }

    try {
        const [users] = await pool.query('SELECT * FROM user WHERE email = ?', [email]);

        if (users.length === 0) {
            return res.status(401).json({ message: "Identifiants invalides." });
        }
        
        const user = users[0];

        const isValidPassword = await bcrypt.compare(password, user.password_hash);

        if (!isValidPassword) {
            return res.status(401).json({ message: "Identifiants invalides." });
        }

        const token = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(200).json({
            message: "Connexion réussie.",
            userId: user.id,
            token: token
        });

    } catch (error) {
        console.error('Erreur lors de la connexion :', error);
        res.status(500).json({ message: "Erreur serveur lors de la connexion." });
    }
};

    // US 9 : Récupération des informations du profil de l'utilisateur
    const getProfil = async (req, res) => {
    const userId = req.auth ? req.auth.userId : null; 

    if (!userId) {
        return res.status(403).json({ message: "Accès refusé. Jeton invalide ou manquant." });
    }

    try {
        // Sélectionne uniquement les colonnes publiques (exclut le mot de passe hashé)
        const [users] = await pool.query(
            'SELECT id, email, first_name, last_name, phone_number FROM user WHERE id = ?', 
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: "Utilisateur non trouvé." });
        }

        const user = users[0];

        res.status(200).json({
            message: "Profil récupéré avec succès.",
            profil: {
                id: user.id,
                email: user.email,
                prenom: user.first_name,
                nom: user.last_name,
                telephone: user.phone_number
            }
        });

    } catch (error) {
        console.error('Erreur lors de la récupération du profil :', error);
        res.status(500).json({ message: "Erreur serveur lors de la récupération du profil." });
    }
};

// Mettez à jour l'exportation pour inclure la nouvelle fonction
module.exports = {
    register,
    login,
    getProfil, // <--- EXPORT NÉCESSAIRE
};