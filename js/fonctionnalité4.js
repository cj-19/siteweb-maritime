// Ce code fait apparaître la carte
const map = L.map('map').setView([43.6047, 1.4442], 11);

// Ajouter le fond de carte
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Les couleurs pour chaque cluster
const couleurs = {
    1: '#3498db', // Bleu
    2: '#2ecc71', // Vert  
    3: '#e74c3c'  // Rouge
};

// Fonction pour charger les données des clusters depuis la base de données
async function chargerClusters() {
    try {
        const response = await fetch('php/get_fonctionnalité4.php');
        
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        const bateaux = await response.json();
        
        // Vérifier si on a une erreur dans la réponse
        if (bateaux.error) {
            console.error('Erreur de base de données:', bateaux.error);
            return;
        }
        
        // Ajouter les points sur la carte
        bateaux.forEach(bateau => {
            L.circleMarker([bateau.lat, bateau.lng], {
                color: couleurs[bateau.cluster],
                fillColor: couleurs[bateau.cluster],
                fillOpacity: 0.8,
                radius: 8,
                weight: 2
            }).addTo(map).bindPopup(`Cluster ${bateau.cluster}`);
        });

        // Calculer et afficher les statistiques des clusters
        afficherStatistiques(bateaux);
        
    } catch (error) {
        console.error('Erreur lors du chargement des clusters:', error);
        // En cas d'erreur, utiliser les données par défaut
        utiliserDonneesParDefaut();
    }
}

// Fonction pour calculer et afficher les statistiques des clusters
function afficherStatistiques(bateaux) {
    // Grouper les bateaux par cluster
    const clustersStats = {};
    
    bateaux.forEach(bateau => {
        const clusterId = bateau.cluster;
        if (!clustersStats[clusterId]) {
            clustersStats[clusterId] = {
                count: 0,
                vitesses: []
            };
        }
        clustersStats[clusterId].count++;
        if (bateau.vitesse) {
            clustersStats[clusterId].vitesses.push(bateau.vitesse);
        }
    });
    
    // Cacher tous les clusters d'abord
    document.querySelectorAll('.cluster-card').forEach(card => {
        card.style.display = 'none';
    });
    
    // Afficher et mettre à jour seulement les clusters qui existent
    Object.keys(clustersStats).forEach(clusterId => {
        const stats = clustersStats[clusterId];
        const vitesseMoyenne = stats.vitesses.length > 0 
            ? (stats.vitesses.reduce((a, b) => a + b, 0) / stats.vitesses.length).toFixed(1)
            : '0.0';
        
        // Afficher et mettre à jour le cluster
        const clusterCard = document.querySelector(`.cluster-card.cluster${clusterId}`);
        if (clusterCard) {
            // Rendre visible le cluster
            clusterCard.style.display = 'block';
            
            // Mettre à jour le nombre de bateaux
            const countElement = clusterCard.querySelector('.cluster-value');
            if (countElement) {
                countElement.textContent = stats.count;
            }
            
            // Mettre à jour la vitesse moyenne
            const vitesseElements = clusterCard.querySelectorAll('.cluster-value');
            if (vitesseElements[1]) {
                vitesseElements[1].textContent = `${vitesseMoyenne} kn`;
            }
        }
    });
    
    // Montrer les statistiques
    document.getElementById('clusterStats').classList.remove('hidden');
}

// Fonction de fallback avec les données par défaut
function utiliserDonneesParDefaut() {
    console.log('Utilisation des données par défaut');
    
    // Les bateaux avec leurs positions (données par défaut)
    const bateaux = [
        {lat: 43.6200, lng: 1.4500, cluster: 1},
        {lat: 43.6180, lng: 1.4480, cluster: 1},
        {lat: 43.6160, lng: 1.4460, cluster: 1},
        {lat: 43.5900, lng: 1.4200, cluster: 2},
        {lat: 43.5880, lng: 1.4180, cluster: 2},
        {lat: 43.6100, lng: 1.4600, cluster: 3},
        {lat: 43.6080, lng: 1.4580, cluster: 3}
    ];

    // Ajouter les points sur la carte
    bateaux.forEach(bateau => {
        L.circleMarker([bateau.lat, bateau.lng], {
            color: couleurs[bateau.cluster],
            fillColor: couleurs[bateau.cluster],
            fillOpacity: 0.8,
            radius: 8,
            weight: 2
        }).addTo(map);
    });

    // Montrer les statistiques par défaut
    document.getElementById('clusterStats').classList.remove('hidden');
}

// Charger les données au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    chargerClusters();
});