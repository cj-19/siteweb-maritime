document.addEventListener("DOMContentLoaded", () => {
    // Charger les états depuis le back-end avec debug
    console.log("Tentative de chargement des états...");

    fetch("php/get_etats.php")
        .then(res => {
            console.log("Réponse reçue:", res.status, res.statusText);
            if (!res.ok) {
                // Si la réponse n'est pas OK (par exemple, 500 Internal Server Error), lève une erreur
                throw new Error(`Erreur HTTP: ${res.status} - ${res.statusText}`);
            }
            return res.text(); // Utiliser text() d'abord pour voir la réponse brute
        })
        .then(text => {
            console.log("Réponse brute:", text);
            try {
                const data = JSON.parse(text);
                console.log("Données parsées:", data);

                // Gérer les erreurs renvoyées par le PHP sous forme JSON (si 'error' est vrai)
                if (data.error) {
                    throw new Error(data.message);
                }

                const select = document.getElementById("etat-select");

                // Vider les options existantes (sauf la première "Sélectionner un état")
                while (select.children.length > 1) {
                    select.removeChild(select.lastChild);
                }

                // Ajouter les nouvelles options
                data.forEach(etat => {
                    const option = document.createElement("option");
                    option.value = etat.Id_etat;
                    // L'image phpMyAdmin et le script SQL initial confirment que 'code_ais' n'est pas une colonne de la table 'etat'.
                    // Donc, nous n'incluons que 'libelle_etat'.
                    option.textContent = etat.libelle_etat; 
                    select.appendChild(option);
                });

                console.log(`${data.length} états chargés avec succès`);

            } catch (parseError) {
                console.error("Erreur de parsing JSON ou de données reçues:", parseError);
                console.error("Texte reçu:", text);
                showMessage("Réponse invalide du serveur lors du chargement des états.", 'error');
            }
        })
        .catch(error => {
            console.error('Erreur lors du chargement des états:', error);
            showMessage(`Erreur lors du chargement des états: ${error.message}`, 'error');

            // Ajouter des options de test en cas d'erreur pour que l'interface ne soit pas vide
            const select = document.getElementById("etat-select");
            const testOptions = [
                { id: 1, label: "En route avec moteur" },
                { id: 2, label: "À l'ancre" },
                { id: 5, label: "Amarré" },
                { id: 7, label: "Pêche" }
            ];

            testOptions.forEach(opt => {
                const option = document.createElement("option");
                option.value = opt.id;
                option.textContent = opt.label;
                select.appendChild(option);
            });
        });

    // Soumettre le formulaire pour ajouter un bateau
    document.getElementById("ajout-form").addEventListener("submit", e => {
        e.preventDefault(); // Empêche le rechargement de la page

        // Validation des champs
        const formData = new FormData(e.target);
        const requiredFields = ['mmsi', 'horodatage', 'latitude', 'longitude', 'sog', 'cap_reel', 'nom', 'etat'];
        for (let field of requiredFields) {
            if (!formData.get(field)) {
                showMessage(`Le champ "${field}" est requis`, 'error');
                return;
            }
        }

        // Validation des coordonnées numériques et de leur plage
        const lat = parseFloat(formData.get('latitude'));
        const lng = parseFloat(formData.get('longitude'));

        if (isNaN(lat) || lat < -90 || lat > 90) {
            showMessage('La latitude doit être un nombre entre -90 et 90', 'error');
            return;
        }

        if (isNaN(lng) || lng < -180 || lng > 180) {
            showMessage('La longitude doit être un nombre entre -180 et 180', 'error');
            return;
        }

        // Validation du MMSI (doit être exactement 9 chiffres)
        const mmsi = formData.get('mmsi');
        if (!/^\d{9}$/.test(mmsi)) {
            showMessage('Le MMSI doit contenir exactement 9 chiffres', 'error');
            return;
        }

        // Envoyer les données au script PHP d'ajout de bateau
        fetch("php/ajouter_bateau.php", {
            method: "POST",
            body: formData
        })
            .then(res => res.text()) // Récupère la réponse du serveur sous forme de texte
            .then(msg => {
                // Vérifie si le message de succès est inclus dans la réponse
                if (msg.includes('succès')) {
                    showMessage(msg, 'success');
                    e.target.reset(); // Réinitialise le formulaire
                    // Remet l'option de sélection d'état à sa valeur par défaut
                    document.getElementById("etat-select").selectedIndex = 0;
                } else {
                    showMessage(msg, 'error'); // Affiche un message d'erreur si l'ajout a échoué
                }
            })
            .catch(err => {
                console.error('Erreur lors de l\'envoi des données:', err);
                showMessage("Erreur lors de l'envoi des données au serveur.", 'error');
            });
    });

    // Fonction utilitaire pour afficher les messages à l'utilisateur
    function showMessage(message, type) {
        const messageEl = document.getElementById("response-message");
        messageEl.textContent = message;
        messageEl.className = type; // Définit la classe pour le style (success/error)
        messageEl.style.display = 'block'; // Rend le message visible

        // Fait disparaître le message après 5 secondes
        setTimeout(() => {
            messageEl.style.display = 'none';
        }, 5000);
    }

    // Validation en temps réel pour les champs numériques (visuel uniquement)
    const numericFields = ['latitude', 'longitude', 'sog', 'cap_reel', 'longueur', 'largeur', 'tirant_eau'];

    numericFields.forEach(fieldName => {
        const field = document.querySelector(`input[name="${fieldName}"]`);
        if (field) {
            field.addEventListener('input', (e) => {
                const value = e.target.value;
                if (value && isNaN(parseFloat(value))) {
                    e.target.style.borderColor = '#dc3545'; // Bordure rouge si non numérique
                } else {
                    e.target.style.borderColor = '#e9ecef'; // Bordure par défaut
                }
            });
        }
    });

    // Validation MMSI en temps réel (limite à 9 chiffres et feedback visuel)
    const mmsiField = document.querySelector('input[name="mmsi"]');
    if (mmsiField) {
        mmsiField.addEventListener('input', (e) => {
            const value = e.target.value;
            // Empêche la saisie de plus de 9 chiffres ou de caractères non numériques
            if (value && !/^\d{0,9}$/.test(value)) {
                e.target.value = value.slice(0, -1); // Supprime le dernier caractère invalide
            }

            // Change la couleur de la bordure en fonction de la longueur du MMSI
            if (e.target.value.length === 9) {
                e.target.style.borderColor = '#28a745'; // Vert si 9 chiffres
            } else if (e.target.value.length > 0) {
                e.target.style.borderColor = '#ffc107'; // Jaune si en cours de saisie
            } else {
                e.target.style.borderColor = '#e9ecef'; // Défaut si vide
            }
        });
    }
});
