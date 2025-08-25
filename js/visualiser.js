// Données fictives initiales (à remplacer par une API PHP)
const mockBoatData = [
    {
        mmsi: "123456789",
        horodatage: "2025-01-20 14:30",
        latitude: 43.2965,
        longitude: 5.3698,
        vitesse: 12.5,
        cap: 45,
        nom: "Cargo Express",
        etat: "navigation",
        longueur: 180.5,
        largeur: 25.2,
        tirant_eau: 8.5,
        type: "Cargo"
    },
    {
        mmsi: "987654321",
        horodatage: "2025-01-20 14:26",
        latitude: 43.3047,
        longitude: 5.3782,
        vitesse: 0.2,
        cap: 120,
        nom: "Marine Belle",
        etat: "ancre",
        longueur: 45.8,
        largeur: 12.3,
        tirant_eau: 3.2,
        type: "Yacht"
    },
    {
        mmsi: "156789123",
        horodatage: "2025-01-20 11:25",
        latitude: 43.2851,
        longitude: 5.3612,
        vitesse: 15.7,
        cap: 280,
        nom: "Ocean Pioneer",
        etat: "navigation",
        longueur: 95.4,
        largeur: 18.6,
        tirant_eau: 5.8,
        type: "Ferry"
    },
    {
        mmsi: "789123456",
        horodatage: "2025-01-20 14:22",
        latitude: 43.3156,
        longitude: 5.3845,
        vitesse: 3.1,
        cap: 90,
        nom: "Fishing Star",
        etat: "peche",
        longueur: 25.8,
        largeur: 8.2,
        tirant_eau: 2.1,
        type: "Chalutier"
    },
    {
        mmsi: "654321987",
        horodatage: "2025-01-20 13:45",
        latitude: 43.2754,
        longitude: 5.3892,
        vitesse: 0.0,
        cap: 0,
        nom: "Port Guardian",
        etat: "port",
        longueur: 35.2,
        largeur: 9.8,
        tirant_eau: 2.8,
        type: "Pilote"
    }
];

// Classe principale pour gérer la visualisation des bateaux
class BoatTracker {
    constructor() {
        // Initialisation des propriétés de l'instance
        this.boats = []; // Tableau pour stocker les données des bateaux
        this.selectedBoat = null; // Bateau actuellement sélectionné
        this.map = null; // Référence à la carte Leaflet
        this.markers = []; // Tableau des marqueurs sur la carte
        this.updateInterval = null; // Intervalle pour les mises à jour automatiques
        
        // Démarre l'application
        this.init();
    }

    // Initialise l'application
    init() {
        console.log('🚀 Initialisation de BoatTracker...');
        this.loadBoatData(); // Charge les données (à remplacer par un appel à une API PHP)
        this.initMap(); // Configure la carte
        this.bindEvents(); // Associe les événements
        this.startAutoUpdate(); // Démarre les mises à jour automatiques
    }

    // Charge les données des bateaux (actuellement fictives, à remplacer par une API)
    loadBoatData() {
        console.log('📡 Chargement des données...');
        // Simule un délai de chargement (à remplacer par fetch('api.php'))
        setTimeout(() => {
            this.boats = mockBoatData; // Remplacer par les données de l'API PHP
            this.renderTable(); // Affiche le tableau
            this.renderMapMarkers(); // Affiche les marqueurs sur la carte
            console.log(`✅ ${this.boats.length} bateaux chargés`);
        }, 1500);
        /* Adaptation pour API PHP (décommenter quand l'API est prête) :
        console.log('📡 Chargement des données depuis l\'API...');
        fetch('api.php', {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
        })
        .then(response => response.json())
        .then(data => {
            this.boats = data;
            this.renderTable();
            this.renderMapMarkers();
            console.log(`✅ ${this.boats.length} bateaux chargés`);
        })
        .catch(error => console.error('❌ Erreur:', error));
        */
    }

    // Initialise la carte Leaflet
    initMap() {
        console.log('🗺️ Initialisation de la carte...');
        // Crée la carte centrée sur Marseille avec zoom 12
        this.map = L.map('map').setView([43.2965, 5.3698], 12); // 'map' doit être un ID HTML fourni par le dev HTML
        
        // Ajoute une couche OpenStreetMap
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 18
        }).addTo(this.map);

        // Applique un style de fond nautique
        this.map.getContainer().style.background = '#a8dadc';
        console.log('✅ Carte initialisée');
    }

    // Associe les événements aux éléments de l'interface
    bindEvents() {
        console.log('🔗 Liaison des événements...');
        // Événements pour la navigation dans la sidebar
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleNavigation(e.target.closest('a')); // 'nav-link' doit être présent dans le HTML
            });
        });

        // Désélection d'un bateau au clic sur la carte
        this.map.on('click', () => {
            this.deselectBoat();
        });

        // Événements pour la navigation dans le header
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.handleHeaderNavigation(e.target); // 'nav-btn' doit être présent dans le HTML
            });
        });
    }

    // Gère la navigation dans la sidebar
    handleNavigation(linkElement) {
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        linkElement.classList.add('active');
        
        const view = linkElement.dataset.view; // 'data-view' doit être défini dans le HTML
        console.log('🧭 Navigation vers:', view);
        
        linkElement.style.transform = 'scale(0.95)';
        setTimeout(() => {
            linkElement.style.transform = 'scale(1)';
        }, 100);
    }

    // Gère la navigation dans le header
    handleHeaderNavigation(btnElement) {
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        btnElement.classList.add('active');
        
        btnElement.style.transform = 'scale(0.95)';
        setTimeout(() => {
            btnElement.style.transform = 'scale(1)';
        }, 100);
    }

    // Génère et affiche le tableau des bateaux
    renderTable() {
        const container = document.getElementById('tableContainer'); // Doit être un ID HTML fourni
        if (this.boats.length === 0) {
            container.innerHTML = '<div class="loading-spinner">Chargement des données...</div>';
            return;
        }

        const tableHTML = `
            <table class="boat-table">
                <thead>
                    <tr>
                        <th>🏷️ MMSI</th>
                        <th>🕒 Horodatage</th>
                        <th>📍 Latitude</th>
                        <th>📍 Longitude</th>
                        <th>⚡ Vitesse</th>
                        <th>🧭 Cap</th>
                        <th>🚢 Nom</th>
                        <th>📊 État</th>
                    </tr>
                </thead>
                <tbody>
                    ${this.boats.map(boat => `
                        <tr data-mmsi="${boat.mmsi}" class="boat-row">
                            <td><strong>${boat.mmsi}</strong></td>
                            <td>${boat.horodatage}</td>
                            <td>${boat.latitude.toFixed(4)}°</td>
                            <td>${boat.longitude.toFixed(4)}°</td>
                            <td>${boat.vitesse} kn</td>
                            <td>${boat.cap}°</td>
                            <td><strong>${boat.nom}</strong></td>
                            <td><span class="status-badge status-${boat.etat}">${this.formatStatus(boat.etat)}</span></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        
        container.innerHTML = tableHTML;
        
        document.querySelectorAll('.boat-row').forEach(row => {
            row.addEventListener('click', () => {
                const mmsi = row.dataset.mmsi;
                this.selectBoat(mmsi);
            });
        });
    }

    // Ajoute des marqueurs sur la carte pour chaque bateau
    renderMapMarkers() {
        this.markers.forEach(marker => {
            this.map.removeLayer(marker);
        });
        this.markers = [];

        this.boats.forEach(boat => {
            const iconHtml = this.getBoatIcon(boat);
            const customIcon = L.divIcon({
                html: iconHtml,
                className: 'custom-boat-marker',
                iconSize: [30, 30],
                iconAnchor: [15, 15]
            });

            const marker = L.marker([boat.latitude, boat.longitude], {
                icon: customIcon
            })
                .bindPopup(this.createPopupContent(boat))
                .addTo(this.map); // 'map' doit être initialisé par initMap()
            
            marker.on('click', () => {
                this.selectBoat(boat.mmsi);
            });
            
            this.markers.push(marker);
        });
    }

    // Retourne une icône personnalisée basée sur l'état du bateau
    getBoatIcon(boat) {
        const iconMap = {
            'navigation': '🚢',
            'ancre': '⚓',
            'port': '🏠',
            'peche': '🎣'
        };
        return `<div style="background: white; border-radius: 50%; padding: 5px; border: 2px solid #667eea; font-size: 16px;">${iconMap[boat.etat] || '🚤'}</div>`;
    }

    // Génère le contenu du popup pour un bateau
    createPopupContent(boat) {
        return `
            <div style="min-width: 200px;">
                <h4 style="margin: 0 0 10px 0; color: #4a5568; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px;">
                    ${boat.nom}
                </h4>
                <p><strong>🏷️ MMSI:</strong> ${boat.mmsi}</p>
                <p><strong>📍 Position:</strong> ${boat.latitude.toFixed(4)}°, ${boat.longitude.toFixed(4)}°</p>
                <p><strong>⚡ Vitesse:</strong> ${boat.vitesse} nœuds</p>
                <p><strong>🧭 Cap:</strong> ${boat.cap}°</p>
                <p><strong>🚢 Type:</strong> ${boat.type}</p>
                <p><strong>📊 État:</strong> ${this.formatStatus(boat.etat)}</p>
                <p><strong>🕒 Mis à jour:</strong> ${boat.horodatage}</p>
            </div>
        `;
    }

    // Sélectionne un bateau et met à jour l'interface
    selectBoat(mmsi) {
        const boat = this.boats.find(b => b.mmsi === mmsi);
        if (!boat) return;

        this.selectedBoat = boat;
        
        this.updateTableSelection(mmsi);
        this.showBoatDetails(boat); // Affiche les détails dans #boatDetails (ID HTML requis)
        this.centerMapOnBoat(boat);
        
        console.log('🎯 Bateau sélectionné:', boat.nom);
    }

    // Désélectionne le bateau actuel
    deselectBoat() {
        this.selectedBoat = null;
        document.querySelectorAll('.boat-row').forEach(row => {
            row.classList.remove('selected');
        });
        document.getElementById('boatDetails').style.display = 'none'; // #boatDetails doit exister
        console.log('❌ Désélection');
    }

    // Met à jour la sélection dans le tableau
    updateTableSelection(mmsi) {
        document.querySelectorAll('.boat-row').forEach(row => {
            row.classList.remove('selected');
        });
        const selectedRow = document.querySelector(`[data-mmsi="${mmsi}"]`);
        if (selectedRow) {
            selectedRow.classList.add('selected');
            selectedRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    // Affiche les détails du bateau sélectionné
    showBoatDetails(boat) {
        const detailsContainer = document.getElementById('boatDetails'); // ID HTML requis
        const detailsContent = document.getElementById('detailsContent'); // ID HTML requis
        
        detailsContent.innerHTML = `
            <p><strong>🚢 Nom:</strong> <span>${boat.nom}</span></p>
            <p><strong>🏷️ Type:</strong> <span>${boat.type}</span></p>
            <p><strong>📡 MMSI:</strong> <span>${boat.mmsi}</span></p>
            <p><strong>📍 Position:</strong> <span>${boat.latitude.toFixed(6)}°, ${boat.longitude.toFixed(6)}°</span></p>
            <p><strong>⚡ Vitesse:</strong> <span>${boat.vitesse} nœuds</span></p>
            <p><strong>🧭 Cap:</strong> <span>${boat.cap}°</span></p>
            <p><strong>📏 Longueur:</strong> <span>${boat.longueur}m</span></p>
            <p><strong>↔️ Largeur:</strong> <span>${boat.largeur}m</span></p>
            <p><strong>⚓ Tirant d'eau:</strong> <span>${boat.tirant_eau}m</span></p>
            <p><strong>📊 État:</strong> <span>${this.formatStatus(boat.etat)}</span></p>
            <p><strong>🕒 Dernière position:</strong> <span>${boat.horodatage}</span></p>
        `;
        
        detailsContainer.style.display = 'block';
    }

    // Centre la carte sur le bateau sélectionné
    centerMapOnBoat(boat) {
        this.map.setView([boat.latitude, boat.longitude], 15, { 
            animate: true,
            duration: 1
        });
    }

    // Formate l'état du bateau en texte lisible
    formatStatus(status) {
        const statusMap = {
            'navigation': 'En navigation',
            'ancre': 'À l\'ancre',
            'port': 'Au port',
            'peche': 'En pêche',
            'maintenance': 'En maintenance'
        };
        return statusMap[status] || status;
    }

    // Démarre la mise à jour automatique des données
    startAutoUpdate() {
        this.updateInterval = setInterval(() => {
            this.simulateMovement();
        }, 10000); // À remplacer par un appel périodique à l'API PHP
        console.log('🔄 Mise à jour automatique activée');
        /* Adaptation pour API PHP (décommenter quand l'API est prête) :
        this.updateInterval = setInterval(() => {
            this.loadBoatData(); // Recharge les données depuis l'API
        }, 10000);
        console.log('🔄 Mise à jour automatique activée');
        */
    }

    // Simule le mouvement des bateaux (à retirer avec une base de données réelle)
    simulateMovement() {
        this.boats.forEach(boat => {
            if (boat.etat === 'navigation') {
                boat.latitude += (Math.random() - 0.5) * 0.001;
                boat.longitude += (Math.random() - 0.5) * 0.001;
                boat.vitesse += (Math.random() - 0.5) * 2;
                boat.vitesse = Math.max(0, Math.min(25, boat.vitesse));
            }
        });
        
        this.renderTable();
        this.renderMapMarkers();
        
        if (this.selectedBoat) {
            const updatedBoat = this.boats.find(b => b.mmsi === this.selectedBoat.mmsi);
            if (updatedBoat) {
                this.selectedBoat = updatedBoat;
                this.showBoatDetails(updatedBoat);
            }
        }
    }

    // Arrête la mise à jour automatique
    stopAutoUpdate() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
            console.log('⏸️ Mise à jour automatique arrêtée');
        }
    }

    // Ajoute un nouveau bateau (à relier à une API PHP POST)
    addBoat(boatData) {
        if (!boatData.mmsi || !boatData.nom) {
            console.error('❌ Données invalides pour le nouveau bateau');
            return false;
        }
        
        if (this.boats.find(b => b.mmsi === boatData.mmsi)) {
            console.error('❌ MMSI déjà existant:', boatData.mmsi);
            return false;
        }
        
        this.boats.push(boatData);
        this.renderTable();
        this.renderMapMarkers();
        console.log('✅ Nouveau bateau ajouté:', boatData.nom);
        return true;
        /* Adaptation pour API PHP (décommenter quand l'API POST est prête) :
        fetch('api.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(boatData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) this.loadBoatData();
            else throw new Error(data.error || 'Erreur inconnue');
        })
        .catch(error => console.error('❌ Erreur:', error));
        return true;
        */
    }

    // Met à jour un bateau existant (à relier à une API PHP PUT)
    updateBoat(mmsi, newData) {
        const index = this.boats.findIndex(b => b.mmsi === mmsi);
        if (index !== -1) {
            this.boats[index] = { ...this.boats[index], ...newData };
            this.renderTable();
            this.renderMapMarkers();
            
            if (this.selectedBoat && this.selectedBoat.mmsi === mmsi) {
                this.selectedBoat = this.boats[index];
                this.showBoatDetails(this.selectedBoat);
            }
            
            console.log('✅ Bateau mis à jour:', mmsi);
            return true;
        }
        return false;
        /* Adaptation pour API PHP (décommenter quand l'API PUT est prête) :
        fetch('api.php', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mmsi, ...newData })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) this.loadBoatData();
            else throw new Error(data.error || 'Erreur inconnue');
        })
        .catch(error => console.error('❌ Erreur:', error));
        return true;
        */
    }

    // Supprime un bateau (à relier à une API PHP DELETE)
    removeBoat(mmsi) {
        const boatIndex = this.boats.findIndex(b => b.mmsi === mmsi);
        if (boatIndex === -1) return false;
        
        const boatName = this.boats[boatIndex].nom;
        this.boats.splice(boatIndex, 1);
        
        if (this.selectedBoat && this.selectedBoat.mmsi === mmsi) {
            this.deselectBoat();
        }
        
        this.renderTable();
        this.renderMapMarkers();
        console.log('🗑️ Bateau supprimé:', boatName);
        return true;
        /* Adaptation pour API PHP (décommenter quand l'API DELETE est prête) :
        fetch('api.php', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mmsi })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) this.loadBoatData();
            else throw new Error(data.error || 'Erreur inconnue');
        })
        .catch(error => console.error('❌ Erreur:', error));
        return true;
        */
    }

    // Recherche des bateaux par un terme
    searchBoats(query) {
        const searchTerm = query.toLowerCase();
        return this.boats.filter(boat => 
            boat.nom.toLowerCase().includes(searchTerm) ||
            boat.mmsi.includes(searchTerm) ||
            boat.type.toLowerCase().includes(searchTerm) ||
            boat.etat.toLowerCase().includes(searchTerm)
        );
    }

    // Filtre les bateaux par état
    filterByState(state) {
        return this.boats.filter(boat => boat.etat === state);
    }

    // Calcule des statistiques sur les bateaux
    getStatistics() {
        const stats = {
            total: this.boats.length,
            enNavigation: this.boats.filter(b => b.etat === 'navigation').length,
            aLancre: this.boats.filter(b => b.etat === 'ancre').length,
            auPort: this.boats.filter(b => b.etat === 'port').length,
            enPeche: this.boats.filter(b => b.etat === 'peche').length,
            vitesseMoyenne: this.boats.reduce((sum, b) => sum + b.vitesse, 0) / this.boats.length
        };
        return stats;
    }

    // Exporte les données au format JSON ou CSV
    exportData(format = 'json') {
        switch (format) {
            case 'json':
                return JSON.stringify(this.boats, null, 2);
            case 'csv':
                const headers = ['MMSI', 'Horodatage', 'Latitude', 'Longitude', 'Vitesse', 'Cap', 'Nom', 'État', 'Type'];
                const csvContent = [
                    headers.join(','),
                    ...this.boats.map(boat => [
                        boat.mmsi,
                        boat.horodatage,
                        boat.latitude,
                        boat.longitude,
                        boat.vitesse,
                        boat.cap,
                        boat.nom,
                        boat.etat,
                        boat.type
                    ].join(','))
                ].join('\n');
                return csvContent;
            default:
                return JSON.stringify(this.boats);
        }
    }

    // Nettoie les ressources
    destroy() {
        this.stopAutoUpdate();
        if (this.map) {
            this.map.remove();
        }
        console.log('🧹 BoatTracker nettoyé');
    }
}

// Initialise l'application au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    window.boatTracker = new BoatTracker();
    
    // API globale pour interagir avec l'instance
    window.boatTrackerAPI = {
        addBoat: (data) => window.boatTracker.addBoat(data),
        updateBoat: (mmsi, data) => window.boatTracker.updateBoat(mmsi, data),
        removeBoat: (mmsi) => window.boatTracker.removeBoat(mmsi),
        searchBoats: (query) => window.boatTracker.searchBoats(query),
        getStats: () => window.boatTracker.getStatistics(),
        exportData: (format) => window.boatTracker.exportData(format)
    };
    
    console.log('🚤 BoatTracker initialisé avec succès!');
    console.log('📊 Instance disponible: window.boatTracker');
    console.log('🔧 API disponible: window.boatTrackerAPI');
    console.log('📚 Exemples d\'utilisation:');
    console.log('  - window.boatTrackerAPI.getStats()');
    console.log('  - window.boatTrackerAPI.searchBoats("Marine")');
    console.log('  - window.boatTrackerAPI.exportData("csv")');
});

// Ajoute des styles CSS dynamiques pour les marqueurs
const markerStyles = document.createElement('style');
markerStyles.textContent = `
    .custom-boat-marker {
        transition: all 0.3s ease;
    }
    .custom-boat-marker:hover {
        transform: scale(1.2);
        z-index: 1000;
    }
    .leaflet-popup-content {
        margin: 12px 16px;
        line-height: 1.4;
    }
    .leaflet-popup-content h4 {
        color: #4a5568;
        margin-bottom: 8px;
    }
    .leaflet-popup-content p {
        margin: 4px 0;
        font-size: 13px;
    }
`;
document.head.appendChild(markerStyles); // Doit être exécuté après le chargement du DOM 