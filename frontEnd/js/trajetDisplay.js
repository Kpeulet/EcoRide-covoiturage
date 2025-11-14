// frontEnd/js/trajetDisplay.js

const API_URL = 'http://localhost:3000/api/v1/trajets';

/**
 * Recherche des trajets disponibles en utilisant les critères fournis.
 * @param {string} depart - Ville de départ.
 * @param {string} arrivee - Ville d'arrivée.
 * @param {string} dateTrajet - Date du trajet (format AAAA-MM-JJ).
 * @returns {Promise<Array>} Une promesse résolue avec la liste des trajets.
 */
export async function rechercherTrajets(depart, arrivee, dateTrajet) {
    const userToken = localStorage.getItem('userToken'); // 1. Récupération du token

    if (!userToken) {
        throw new Error("Authentification requise pour rechercher des trajets.");
    }

    // 2. Construction de l'URL avec les paramètres de recherche (Query Params)
    const url = new URL(API_URL);
    url.searchParams.append('depart', depart);
    url.searchParams.append('arrivee', arrivee);
    url.searchParams.append('date_trajet', dateTrajet);

    try {
        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                // 3. Inclusion du token d'authentification dans l'en-tête
                'Authorization': `Bearer ${userToken}`, 
            },
        });

        const data = await response.json();

        if (!response.ok) {
            // Gère les erreurs de l'API (ex: 404 si aucun trajet)
            throw new Error(data.message || "Erreur lors de la recherche des trajets.");
        }

        return data; // Retourne la liste des trajets
        
    } catch (error) {
        throw error;
    }
}