const pool = require('../database/db'); 

// US 1 : Création d'un nouveau trajet par un utilisateur authentifié
const createTrajet = async (req, res) => {
    // ... votre code existant pour createTrajet (aucun changement)
    const userId = req.auth.userId; 
    const { depart, arrivee, date_trajet, places_disponibles, prix } = req.body;
    
    if (!depart || !arrivee || !date_trajet || !places_disponibles || !prix) {
    return res.status(400).json({ message: "Veuillez remplir tous les champs obligatoires (départ, arrivée, date, places, prix)." });
}

try {
    const query = `
        INSERT INTO trajet 
        (conducteur_id, depart, arrivee, date_trajet, places_disponibles, prix)
        VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    const [result] = await pool.query(query, [
        userId, depart, arrivee, date_trajet, places_disponibles, prix
        ]);

        res.status(201).json({
            message: "Trajet créé avec succès !",
            trajetId: result.insertId,
            conducteurId: userId
        });

    } catch (error) {
        console.error('Erreur lors de la création du trajet :', error);
        res.status(500).json({ message: "Erreur serveur lors de la création du trajet." });
    }
};

/// US 2, 3 & 4 : Récupérer et Filtrer les trajets disponibles (MODIFIÉ POUR INCLURE LES FILTRES AVANCÉS)
const searchTrajets = async (req, res) => {
    // Récupère les 3 critères de base + les nouveaux filtres avancés
    const { depart, arrivee, date, prix_max, ecologique, note_min } = req.query; 

    try {
        let query = `
            SELECT 
                t.*, 
                u.first_name AS conducteur_prenom, 
                u.last_name AS conducteur_nom,
                COALESCE(AVG(a.note), 0) AS note_moyenne_conducteur,
                v.type_energie AS vehicule_energie
            FROM trajet t
            JOIN user u ON t.conducteur_id = u.id
            LEFT JOIN avis a ON u.id = a.conducteur_id
            LEFT JOIN vehicule v ON u.id = v.conducteur_id /* Jointure pour les filtres écologiques */
        `;
        
        const params = [];
        let conditions = []; 

        // 1. Condition sur le Départ
        if (depart) {
            conditions.push('t.depart LIKE ?');
            params.push(`%${depart}%`);
        }
        
        // 2. Condition sur l'Arrivée
        if (arrivee) {
            conditions.push('t.arrivee LIKE ?');
            params.push(`%${arrivee}%`);
        }
        
        // 3. Condition sur la Date (pour le jour exact)
        if (date) {
            conditions.push('DATE(t.date_trajet) = DATE(?)'); 
            params.push(date);
        }

        // 4. NOUVEAU : Condition sur le Prix Maximum (US 4)
        if (prix_max && !isNaN(parseFloat(prix_max))) {
            conditions.push('t.prix <= ?');
            params.push(parseFloat(prix_max));
        }

        // 5. NOUVEAU : Condition sur l'Aspect Écologique (US 4)
        if (ecologique === 'true') {
            // Filtre sur les véhicules non polluants
            conditions.push('(v.type_energie IN ("Electrique", "Hybride"))'); 
        }

        // 6. Ajouter les conditions à la requête SQL
        if (conditions.length > 0) {
            query += ' WHERE t.places_disponibles > 0 AND ' + conditions.join(' AND ');
        } else {
            // Toujours afficher uniquement les trajets avec des places
            query += ' WHERE t.places_disponibles > 0 ';
        }
        
        // 7. Groupement pour calculer la moyenne et filtre sur la Note Minimale (US 4)
        query += ' GROUP BY t.id, u.id, v.type_energie ';

        // Condition sur la Note Minimale - Utilise HAVING car c'est une agrégation
        if (note_min && !isNaN(parseFloat(note_min))) {
            query += ' HAVING note_moyenne_conducteur >= ?';
            params.push(parseFloat(note_min));
        }

        // 8. Trier et exécuter
        query += ' ORDER BY t.date_trajet, t.depart';
        
        const [trajets] = await pool.query(query, params); 

        if (trajets.length === 0) {
            return res.status(200).json({ message: "Aucun trajet trouvé correspondant à vos critères.", trajets: [] });
        }

        res.status(200).json({ trajets: trajets });

    } catch (error) {
        console.error('Erreur lors de la récupération des trajets :', error);
        res.status(500).json({ message: "Erreur serveur lors de la récupération des trajets." });
    }
};

// US 11 : Afficher les passagers pour un trajet (GET /trajets/:id/passagers)
const getPassagersByTrajet = async (req, res) => {
    // ... votre code existant pour getPassagersByTrajet (aucun changement)
    const trajetId = req.params.id; 
    const conducteurId = req.auth.userId; 

    try {
        // 1. Vérifier si l'utilisateur connecté est bien le conducteur de ce trajet
        const [trajet] = await pool.query(
            "SELECT id FROM trajet WHERE id = ? AND conducteur_id = ?",
            [trajetId, conducteurId]
        );

        if (trajet.length === 0) {
            return res.status(404).json({ message: "Trajet non trouvé ou vous n'êtes pas le conducteur de ce trajet." });
        }

        // 2. Récupérer les passagers pour ce trajet
        const [passagers] = await pool.query(`
            SELECT 
                r.places_reservees,
                u.first_name,
                u.last_name,
                u.phone_number
            FROM reservation r
            JOIN user u ON r.passager_id = u.id
            WHERE r.trajet_id = ?
        `, [trajetId]);

        if (passagers.length === 0) {
            return res.status(200).json({ message: "Ce trajet n'a pas encore de réservations.", passagers: [] });
        }

        res.status(200).json(passagers);

    } catch (error) {
        console.error("Erreur lors de la récupération des passagers :", error);
        res.status(500).json({ message: "Erreur serveur lors de la récupération des passagers." });
    }
};

// US 5 : Récupérer les détails complets d'un seul trajet
const getTrajetById = async (req, res) => {
    const trajetId = req.params.id;

    try {
        const query = `
            SELECT
                t.*,
                u.first_name AS conducteur_prenom,
                u.last_name AS conducteur_nom,
                u.phone_number AS conducteur_telephone,
                v.model AS vehicule_modele,
                v.plaque_immatriculation,
                v.type_energie AS vehicule_energie,
                p.fumeur_accepte,
                p.animaux_acceptes,
                COALESCE(AVG(a.note), 0) AS note_moyenne_conducteur
            FROM trajet t
            JOIN user u ON t.conducteur_id = u.id
            LEFT JOIN vehicule v ON u.id = v.conducteur_id  /* Infos véhicule */
            LEFT JOIN preference p ON u.id = p.utilisateur_id /* Préférences (fumeur/animal) */
            LEFT JOIN avis a ON u.id = a.conducteur_id        /* Note moyenne */
            WHERE t.id = ?
            GROUP BY t.id, u.id, v.id, p.id 
        `;
        
        const [trajets] = await pool.query(query, [trajetId]);

        if (trajets.length === 0) {
            return res.status(404).json({ message: "Trajet non trouvé." });
        }

        res.status(200).json(trajets[0]);

    } catch (error) {
        console.error('Erreur lors de la récupération du trajet détaillé :', error);
        res.status(500).json({ message: "Erreur serveur lors de la récupération du trajet." });
    }
};

// Suppression d'un trajet (DELETE /trajets/:id)

const deleteTrajet = async (req, res) => {
    const trajetId = req.params.id;
    const conducteurId = req.auth.userId;

    let connection;
    try {
        // Démarre la transaction
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // 1. Vérifier si le trajet appartient à l'utilisateur
        const [trajet] = await connection.query(
            "SELECT id FROM trajet WHERE id = ? AND conducteur_id = ?",
            [trajetId, conducteurId]
        );

        if (trajet.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: "Trajet non trouvé ou vous n'êtes pas le conducteur." });
        }

        // 2. Vérifier si le trajet a des réservations
        const [reservations] = await connection.query(
            "SELECT COUNT(*) as count FROM reservation WHERE trajet_id = ?",
            [trajetId]
        );

        if (reservations[0].count > 0) {
            await connection.rollback(); 
            // 409 Conflict : impossible car l'état des ressources (réservations) est incompatible
            return res.status(409).json({ message: "Impossible de supprimer ce trajet : il contient déjà des réservations." });
        }

        // 3. Supprimer le trajet
        await connection.query("DELETE FROM trajet WHERE id = ?", [trajetId]);

        await connection.commit(); 
        res.status(200).json({ message: "Trajet supprimé avec succès." });

    } catch (error) {
        if (connection) {
            await connection.rollback(); 
        }
        console.error("Erreur lors de la suppression du trajet :", error);
        res.status(500).json({ message: "Erreur serveur lors de la suppression du trajet." });
    } finally {
        if (connection) {
            connection.release(); 
        }
    }
};

// US 10 : Récupérer les trajets proposés par l'utilisateur connecté
const getTrajetsByConducteur = async (req, res) => {
    const userId = req.auth.userId;

    if (!userId) {
        return res.status(401).json({ message: "Utilisateur non authentifié." });
    }

    try {
        const [trajets] = await pool.query(
            'SELECT * FROM trajet WHERE conducteur_id = ? ORDER BY date_trajet DESC',
            [userId]
        );

        res.status(200).json({
            message: "Liste des trajets récupérée avec succès.",
            trajets: trajets
        });

    } catch (error) {
        console.error('Erreur lors de la récupération des trajets utilisateur :', error);
        res.status(500).json({ message: "Erreur serveur lors de la récupération des trajets." });
    }
};

// À la fin de backEnd/controllers/trajet.js
module.exports = {
    createTrajet,
    searchTrajets,
    getTrajetsByConducteur,
    getPassagersByTrajet,
    deleteTrajet,
    getTrajetById
};