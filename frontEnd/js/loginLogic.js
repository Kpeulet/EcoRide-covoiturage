// frontEnd/js/loginLogic.js
import { login } from './auth.js';

const form = document.getElementById('login-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const messageDisplay = document.getElementById('message-display');
const loginButton = document.getElementById('login-button');

    form.addEventListener('submit', async (e) => {
    e.preventDefault();
    messageDisplay.textContent = '';
    loginButton.disabled = true;
    messageDisplay.style.color = 'black';
    messageDisplay.textContent = 'Connexion en cours...';

    const email = emailInput.value;
    const password = passwordInput.value;

    try {
        const result = await login(email, password);
        
        // Connexion réussie
        messageDisplay.style.color = 'green';
        messageDisplay.textContent = `Connexion réussie! Bienvenue. Redirection...`;
        
        localStorage.setItem('userToken', result.token);
           
        window.location.href = 'profil.html';

    } catch (error) {
        messageDisplay.style.color = 'red';
        messageDisplay.textContent = `Erreur: ${error.message}`;
    } finally {
        loginButton.disabled = false;
    }
});