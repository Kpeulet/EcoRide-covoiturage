// frontEnd/js/auth.js

// NOTE: Pour utiliser 'fetch' ou 'axios' dans un projet simple, vous devez
// vous assurer qu'il est chargé (ou utiliser l'API fetch native du navigateur).
// Nous utiliserons 'fetch' pour la simplicité.

const API_URL = 'http://127.0.0.1:3000/api/v1/users';

/**
 * Tente de connecter l'utilisateur.
 * @param {string} email - Email de l'utilisateur.
 * @param {string} password - Mot de passe de l'utilisateur.
 * @returns {Promise<object>} Le token et l'userId si succès.
 */
export async function login(email, password) {
    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (!response.ok) {
            // Gère l'erreur de connexion (ex: 401 Unauthorized)
            throw new Error(data.message || "Erreur de connexion."); 
        }

        // Succès : Stocker le token et l'userId
        localStorage.setItem('userToken', data.token);
        localStorage.setItem('userId', data.userId);

        return data; // Contient le message, token, userId

    } catch (error) {
        // Gère les erreurs réseau ou les erreurs renvoyées par l'API
        throw error;
    }
}

/**
 * Déconnecte l'utilisateur en retirant le token.
 */
export function logout() {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userId');
}