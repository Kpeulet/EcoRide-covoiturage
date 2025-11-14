// frontEnd/js/profil.js

document.addEventListener('DOMContentLoaded', async () => {
    // Récupération du token
    const userToken = localStorage.getItem('userToken');
    const authMessage = document.getElementById('auth-message');
    
    // Références aux éléments du DOM
    const nomSpan = document.getElementById('nom-utilisateur');
    const prenomSpan = document.getElementById('prenom-utilisateur');
    const emailSpan = document.getElementById('email-utilisateur');
    const trajetsProposesList = document.getElementById('liste-trajets-proposes');
    const reservationsList = document.getElementById('liste-reservations');

    // 1. Vérification de l'authentification
    if (!userToken) {
        authMessage.textContent = "Accès refusé : Vous devez être connecté pour voir votre profil.";
        return; 
    }

    authMessage.textContent = "Chargement de votre profil...";
    
    // --- APPEL 1 : Récupération des informations de PROFIL (/users/profil) ---
    try {
        const profilResponse = await fetch('http://localhost:3000/api/v1/users/profil', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${userToken}`,
                'Content-Type': 'application/json'
            }
        });

        const profilData = await profilResponse.json();
        
        if (profilResponse.ok) {
            authMessage.textContent = ""; // Effacer le message de chargement
            
            // Afficher les informations de l'utilisateur
            nomSpan.textContent = profilData.profil.nom;
            prenomSpan.textContent = profilData.profil.prenom;
            emailSpan.textContent = profilData.profil.email;
            
            // --- APPEL 2 : Récupération des trajets proposés (/trajets/user) ---
            await fetchTrajetsProposes(userToken, trajetsProposesList);
            
            // --- APPEL 3 : Récupération des réservations ---
            await fetchReservations(userToken, reservationsList);

        } else {
            // Gérer les erreurs (401/403)
            authMessage.textContent = `Erreur de chargement du profil: ${profilData.message || 'Token invalide ou erreur interne.'}`;
        }

    } catch (error) {
        console.error('Erreur réseau ou technique:', error);
        authMessage.textContent = "Erreur réseau : Vérifiez que le Back-end est démarré.";
    }
});


/**
 * Fonction dédiée à la récupération et à l'affichage des trajets proposés par l'utilisateur.
 * (CORRIGÉ : Utilisation des clés DB : depart, arrivee, date_trajet, heure_depart)
 */
async function fetchTrajetsProposes(token, listElement) {
    try {
        const trajetsResponse = await fetch('http://localhost:3000/api/v1/trajets/mes-trajets', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (trajetsResponse.ok) {
            const trajetsData = await trajetsResponse.json();
            const trajets = trajetsData.trajets;

            listElement.innerHTML = ''; // Nettoyer l'ancienne liste

            if (trajets && trajets.length > 0) {
                listElement.innerHTML = trajets.map(trajet => {
                    
                    // Utilisation de 'date_trajet'
                    const dateTrajet = new Date(trajet.date_trajet).toLocaleDateString('fr-FR'); 
                    
                    // Utilisation de 'heure_depart'
                    const heureDepart = trajet.heure_depart ? trajet.heure_depart.substring(0, 5) : 'N/A'; // Affiche HH:MM

                    // Utilisation de 'depart' et 'arrivee'
                    return `<li>
                        [PROPOSÉ] De <strong>${trajet.depart}</strong> à <strong>${trajet.arrivee}</strong>
                        le ${dateTrajet} à ${heureDepart} 
                        (${trajet.places_disponibles} places restantes) - ${trajet.prix}€
                    </li>`;
                }).join('');

            } else {
                listElement.innerHTML = '<li>Vous n\'avez proposé aucun trajet.</li>';
            }
        } else {
            console.error("Erreur (Back-end) lors de la récupération des trajets proposés.");
            listElement.innerHTML = '<li>Impossible de charger les trajets (Erreur API).</li>';
        }
    } catch (trajetsError) {
        console.error('Erreur réseau lors de la récupération des trajets :', trajetsError);
        listElement.innerHTML = '<li>Erreur réseau lors du chargement des trajets.</li>';
    }
}

/**
 * Fonction dédiée à la récupération et à l'affichage des réservations de l'utilisateur.
 * (CORRIGÉ : Utilisation des clés DB : depart, arrivee, date_trajet)
 */
async function fetchReservations(token, listElement) {
    try {
        const resResponse = await fetch('http://localhost:3000/api/v1/reservations/user', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (resResponse.ok) {
            const resData = await resResponse.json();
            const reservations = resData.reservations; 

            listElement.innerHTML = ''; // Nettoyer l'ancienne liste

            if (reservations && reservations.length > 0) {
                listElement.innerHTML = reservations.map(res => {
                    // Utilisation des clés 'date_trajet', 'depart', 'arrivee'
                    const dateTrajet = new Date(res.date_trajet).toLocaleDateString('fr-FR');
                    
                    return `<li>
                        [RÉSERVÉ] De <strong>${res.depart}</strong> à <strong>${res.arrivee}</strong>
                        le ${dateTrajet} (Avec ${res.conducteur_prenom} ${res.conducteur_nom})
                        - ${res.nombre_places_reservees} place(s) - ${res.prix}€
                    </li>`;
                }).join('');

            } else {
                listElement.innerHTML = '<li>Vous n\'avez effectué aucune réservation.</li>';
            }
        } else {
            console.error("Erreur (Back-end) lors de la récupération des réservations.");
            listElement.innerHTML = '<li>Impossible de charger les réservations (Erreur API).</li>';
        }
    } catch (resError) {
        console.error('Erreur réseau lors de la récupération des réservations :', resError);
        listElement.innerHTML = '<li>Erreur réseau lors du chargement des réservations.</li>';
    }
}