// frontEnd/js/creation-trajet.js

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('creation-trajet-form');
    const messageContainer = document.getElementById('message-creation');

    // Vérification de l'authentification : Seul un utilisateur connecté peut proposer un trajet
    const userToken = localStorage.getItem('userToken');
    if (!userToken) {
        messageContainer.textContent = "Vous devez être connecté pour proposer un trajet.";
        messageContainer.style.color = 'red';
        // Optionnel : rediriger l'utilisateur vers la page de connexion
        // window.location.href = 'login.html'; 
        return; 
    }
    
    // Fonction utilitaire pour réinitialiser le message
    function resetMessage(color, text) {
        messageContainer.textContent = text;
        messageContainer.style.color = color;
        setTimeout(() => {
            messageContainer.textContent = '';
        }, 5000); 
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault(); 
        messageContainer.textContent = "Création du trajet en cours...";
        messageContainer.style.color = 'blue';

        // 1. Collecter les données du formulaire
        const formData = new FormData(form);
        const trajetData = Object.fromEntries(formData.entries());
        
        // Convertir les nombres (places, prix) pour s'assurer du bon format JSON
        trajetData.places_disponibles = parseInt(trajetData.places_disponibles);
        trajetData.prix = parseFloat(trajetData.prix).toFixed(2);
        
        // L'API attend le prix en décimal, le convertir en nombre float pour l'envoi
        trajetData.prix = parseFloat(trajetData.prix);

        try {
            // 2. Appel POST sécurisé à l'API
            const response = await fetch('http://localhost:3000/api/v1/trajets', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userToken}`, // Jeton d'authentification requis
                },
                body: JSON.stringify(trajetData)
            });

            const data = await response.json();
            
            // 3. Gérer la réponse de l'API
            if (response.ok) { // Code 201 Created attendu
                resetMessage('green', data.message || "Trajet créé avec succès !");
                form.reset(); // Réinitialiser le formulaire après succès
            } else {
                // Gérer les erreurs côté serveur (validation, données manquantes, etc.)
                resetMessage('red', data.message || `Erreur de création du trajet (Code: ${response.status})`);
            }

        } catch (error) {
            console.error('Erreur réseau ou technique:', error);
            resetMessage('red', "Erreur réseau : Le serveur n'est peut-être pas disponible.");
        }
    });
});