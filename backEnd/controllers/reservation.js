const pool = require('../database/db');

// US 6 : Créer une réservation (POST) - Gestion des transactions et des crédits
const createReservation = async (req, res) => {
    const passagerId = req.auth.userId;
    const { trajetId, placesReservees = 1 } = req.body; 

    if (!trajetId) {
        return res.status(400).json({ message: "Veuillez fournir l'ID du trajet à réserver." });
    }

    let connection;

    try {
        // 1. Démarrer la transaction
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // 2. Vérifier l'existence, le prix et les places disponibles du trajet (avec verrouillage)
        const [trajets] = await connection.query(
            'SELECT places_disponibles, conducteur_id, prix FROM trajet WHERE id = ? FOR UPDATE',
            [trajetId]
        );

        if (trajets.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: "Trajet non trouvé." });
        }

        const trajet = trajets[0];
        
        // Règle 1: Ne pas réserver son propre trajet
        if (trajet.conducteur_id === passagerId) {
            await connection.rollback();
            return res.status(403).json({ message: "Vous ne pouvez pas réserver votre propre trajet." });
        }
        // Règle 2: Vérifier les places
        if (trajet.places_disponibles < placesReservees) {
            await connection.rollback();
            return res.status(400).json({ 
                message: `Seulement ${trajet.places_disponibles} place(s) disponible(s).` 
            });
        }
        
        // 3. Vérifier et déduire le crédit de l'utilisateur (avec verrouillage)
        const [users] = await connection.query(
            'SELECT credit FROM user WHERE id = ? FOR UPDATE', 
            [passagerId]
        );
        
        const userCredit = users[0].credit;
        const totalCost = trajet.prix * placesReservees;

        // Règle 3: Vérifier le crédit
        if (userCredit < totalCost) {
            await connection.rollback();
            return res.status(403).json({ message: "Crédit insuffisant pour cette réservation." });
        }
        
        const newCredit = userCredit - totalCost;
        
        // 4. Insérer la réservation
        const insertReservationQuery = `
            INSERT INTO reservation (trajet_id, passager_id, places_reservees) 
            VALUES (?, ?, ?)
        `;
        const [result] = await connection.query(insertReservationQuery, [
            trajetId, 
            passagerId, 
            placesReservees
        ]);

        // 5. Mettre à jour les places disponibles
        const updateTrajetQuery = 'UPDATE trajet SET places_disponibles = places_disponibles - ? WHERE id = ?';
        await connection.query(updateTrajetQuery, [placesReservees, trajetId]);
        
        // 6. Déduire le crédit du passager
        await connection.query(
            'UPDATE user SET credit = ? WHERE id = ?',
            [newCredit, passagerId]
        );

        // 7. Valider la transaction
        await connection.commit();

        res.status(201).json({ 
            message: "Réservation effectuée avec succès !",
            reservationId: result.insertId
        });

    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        if (error.code === 'ER_DUP_ENTRY') {
             return res.status(409).json({ message: "Vous avez déjà réservé ce trajet." });
        }
        console.error('Erreur lors de la réservation :', error);
        res.status(500).json({ message: "Erreur serveur lors de la réservation." });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

// US 10 : Annuler une réservation et rembourser le crédit
const cancelReservation = async (req, res) => {
    const reservationId = req.params.id;
    const passagerId = req.auth.userId;

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // 1. Récupérer le prix du trajet et les places réservées AVANT la suppression
        const [reservationInfo] = await connection.query(
            `SELECT r.trajet_id, r.places_reservees, t.prix 
             FROM reservation r 
             JOIN trajet t ON r.trajet_id = t.id 
             WHERE r.id = ? AND r.passager_id = ?`,
            [reservationId, passagerId]
        );

        if (reservationInfo.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: "Réservation non trouvée ou vous n'êtes pas autorisé à l'annuler." });
        }

        const { trajet_id, places_reservees, prix } = reservationInfo[0]; 
        const refundAmount = prix * places_reservees; 

        // 2. Supprimer la réservation
        await connection.query("DELETE FROM reservation WHERE id = ?", [reservationId]);

        // 3. Augmenter le nombre de places disponibles dans le trajet
        await connection.query(
            "UPDATE trajet SET places_disponibles = places_disponibles + ? WHERE id = ?",
            [places_reservees, trajet_id]
        );

        // 4. Rembourser le crédit du passager
        await connection.query(
            "UPDATE user SET credit = credit + ? WHERE id = ?",
            [refundAmount, passagerId]
        );

        await connection.commit();
        res.status(200).json({ message: "Réservation annulée avec succès, places remises à disposition et crédits remboursés." });

    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error("Erreur lors de l'annulation de la réservation :", error);
        res.status(500).json({ message: "Erreur serveur lors de l'annulation de la réservation." });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

// US 10 : Consulter les réservations de l'utilisateur
const getUserReservations = async (req, res) => {
    const userId = req.auth ? req.auth.userId : req.userId;
    if (!userId) {
        return res.status(403).json({ message: "Accès refusé. Jeton invalide ou manquant." });
    }

    try {
        const [reservations] = await pool.query(
        `SELECT
            r.id AS reservation_id,
            r.places_reservees AS nombre_places_reservees,
            t.depart,  
            t.arrivee,  
            t.date_trajet,
            t.prix,
            u.last_name AS conducteur_nom,
            u.first_name AS conducteur_prenom
        FROM reservation r
            JOIN trajet t ON r.trajet_id = t.id
            JOIN user u ON t.conducteur_id = u.id  
            WHERE r.passager_id = ?
            ORDER BY t.date_trajet DESC`,
            [userId]
        );

        if (reservations.length === 0) {
            return res.status(200).json({ message: "Vous n'avez pas encore de réservations.", reservations: [] });
        }

        res.status(200).json({
            message: "Liste des réservations récupérée avec succès.",
            reservations: reservations
        });

    } catch (error) {
        console.error("Erreur lors de la récupération des réservations :", error);
        res.status(500).json({ message: "Erreur serveur lors de la récupération des réservations." });
    }
};

// Exportation de toutes les fonctions
module.exports = {
    createReservation,
    cancelReservation,
    getUserReservations,
};