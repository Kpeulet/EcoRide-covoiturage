// frontEnd/js/search.js (Adapté à index.html)

document.addEventListener('DOMContentLoaded', () => {
    const searchForm = document.getElementById('search-form');
    // Changement : Utilisation de l'ID 'results-container' présent dans index.html
    const resultContainer = document.getElementById('results-container'); 

    // Afficher tous les trajets au chargement initial (Facultatif mais bonne pratique)
    fetchTrajetsDisponibles(); 

    // Écoute de la soumission du formulaire de recherche
    searchForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        // 1. Récupérer les valeurs du formulaire
        const depart = document.getElementById('depart').value;
        const arrivee = document.getElementById('arrivee').value;
        // Changement : Utilisation de l'ID 'date-trajet' présent dans index.html
        const date = document.getElementById('date-trajet').value; 

        // Appel de la fonction de recherche avec les filtres
        fetchTrajetsDisponibles(depart, arrivee, date);
    });

    /**
     * Fonction pour appeler l'API de recherche et afficher les résultats.
     * Si les paramètres sont vides, elle renvoie tous les trajets (grâce au Back-end corrigé).
     */
    async function fetchTrajetsDisponibles(depart = '', arrivee = '', date = '') {
        // Affichage de chargement
        resultContainer.innerHTML = 'Chargement des trajets disponibles...';

        // 2. Construire l'URL avec les paramètres de requête
        // Note: URLSearchParams est plus propre, mais la construction par string est efficace ici.
        const baseUrl = 'http://localhost:3000/api/v1/trajets/search';
        // On n'ajoute les paramètres que s'ils existent
        const params = new URLSearchParams();
        if (depart) params.append('depart', depart);
        if (arrivee) params.append('arrivee', arrivee);
        if (date) params.append('date', date);

        const urlWithParams = `${baseUrl}?${params.toString()}`;

        try {
            // 3. Appel API (Pas besoin de Token, route publique)
            const response = await fetch(urlWithParams, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            const data = await response.json();

            if (response.ok) {
                const trajets = data.trajets; 

                // 4. Afficher les résultats
                if (trajets && trajets.length > 0) {
                    let listHtml = `<h2>${trajets.length} Trajet(s) trouvé(s) :</h2>`;
                    
                    listHtml += trajets.map(trajet => {
                        const dateTrajet = new Date(trajet.date_trajet).toLocaleDateString('fr-FR');
                        const heureDepart = trajet.heure_depart ? trajet.heure_depart.substring(0, 5) : 'N/A';
                        
                        return `
                            <div class="trajet-resultat" style="border: 1px solid #ccc; margin-bottom: 10px; padding: 10px;">
                                <p><strong>De ${trajet.depart} à ${trajet.arrivee}</strong></p>
                                <p>Le ${dateTrajet} à ${heureDepart}</p>
                                <p>Conducteur: ${trajet.conducteur_prenom || 'N/A'} ${trajet.conducteur_nom || ''}</p>
                                <p>${trajet.places_disponibles} place(s) disponible(s) - ${trajet.prix}€</p>
                                <button class="btn-reserver" data-trajet-id="${trajet.id}">Réserver ce trajet</button>
                            </div>`;
                    }).join('');

                    resultContainer.innerHTML = listHtml;
                } else {
                    resultContainer.innerHTML = `<p>Aucun trajet trouvé correspondant aux critères spécifiés.</p>`;
                }
            } else {
                resultContainer.innerHTML = `<p style="color: red;">Erreur API lors de la recherche : ${data.message || 'Erreur inconnue'}</p>`;
                console.error("Erreur de recherche:", data);
            }
        } catch (error) {
            resultContainer.innerHTML = '<p style="color: red;">Erreur réseau : Vérifiez que le Back-end est démarré.</p>';
            console.error('Erreur réseau lors de la recherche de trajets:', error);
        }
    }
});