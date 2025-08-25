// js/fonctionnalite3.js

// Classe principale pour gérer la visualisation des bateaux
class BoatTracker {
    constructor() {
        this.boats = [];
        this.selectedBoat = null;
        this.map = null;
        this.markers = [];
        this.init();
    }

    init() {
        console.log('🚀 Initialisation de BoatTracker...');
        this.initMap();
        this.loadBoatData(); // Charger les données après l'initialisation de la carte
        this.bindEvents();
    }

    // Initialiser la carte Leaflet
    initMap() {
        console.log('🗺️ Initialisation de la carte...');
        // Définir la vue par défaut sur une localisation appropriée (ex: Marseille)
        this.map = L.map('boat-map').setView([43.2965, 5.3698], 12);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 18
        }).addTo(this.map);
        console.log('✅ Carte initialisée');
    }

    // Charger les données des bateaux depuis l'API PHP
    loadBoatData() {
        console.log('📡 Chargement des données des bateaux depuis la base de données...');
        const tbody = document.getElementById('boats-data');
        tbody.innerHTML = '<tr><td colspan="7">Chargement des données...</td></tr>'; // Message de chargement

        // Le chemin d'accès à get_boats.php est 'php/get_boats.php' selon la structure de votre projet
        fetch('php/get_boats.php')
            .then(response => {
                if (!response.ok) {
                    // Si la réponse n'est pas OK (ex: 404, 500), lancer une erreur
                    throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
                }
                return response.json(); // Parser la réponse JSON
            })
            .then(data => {
                // Vérifier si les données sont un tableau et ne sont pas vides
                if (!Array.isArray(data) || data.length === 0) {
                    console.warn('⚠️ Aucune donnée de bateau reçue ou format inattendu.', data);
                    tbody.innerHTML = '<tr><td colspan="7">Aucune donnée de bateau trouvée.</td></tr>';
                    this.boats = []; // Vider la liste des bateaux
                    this.renderMapMarkers(); // Effacer les marqueurs existants si aucun bateau
                    return;
                }

                // Mapper les données reçues pour correspondre au format attendu
                this.boats = data.map(boat => ({
                    mmsi: boat.MMSI,
                    nom: boat.nom,
                    horodatage: boat.horodatage,
                    latitude: parseFloat(boat.latitude), // Convertir en nombre
                    longitude: parseFloat(boat.longitude), // Convertir en nombre
                    vitesse: parseFloat(boat.vitesse), // SOG de la BDD
                    cap: parseFloat(boat.cap),           // COG de la BDD
                    cap_reel: parseFloat(boat.cap_reel), // Cap réel de la BDD
                    etat: boat.etat,                     // État du bateau
                    longueur: parseFloat(boat.longueur),
                    largeur: parseFloat(boat.largeur),
                    tirant_eau: parseFloat(boat.tirant_eau),
                    type_navire: boat.type               // Type de navire de la BDD
                }));

                this.renderTable();
                this.renderMapMarkers();
                console.log(`✅ ${this.boats.length} bateaux chargés depuis la base de données.`);
            })
            .catch(error => {
                console.error('❌ Erreur lors du chargement des données des bateaux:', error);
                tbody.innerHTML = '<tr><td colspan="7">Erreur de chargement des données. Veuillez vérifier la console pour plus de détails.</td></tr>';
            });
    }

    bindEvents() {
        console.log('🔗 Liaison des événements...');
        document.querySelectorAll('.nav-list a').forEach(link => {
            link.addEventListener('click', (e) => {
                // e.preventDefault(); // Décommenter si vous gérez la navigation côté client (SPA)
                this.handleNavigation(e.target);
            });
        });
        this.map.on('click', () => {
            this.deselectBoat();
        });
    }

    handleNavigation(linkElement) {
        document.querySelectorAll('.nav-list a').forEach(l =>
            l.classList.remove('active'));
        linkElement.classList.add('active');
        const view = linkElement.getAttribute('href');
        console.log('🧭 Navigation vers:', view);
        linkElement.style.transform = 'scale(0.95)';
        setTimeout(() => {
            linkElement.style.transform = 'scale(1)';
        }, 100);
    }

    renderTable() {
        const tbody = document.getElementById('boats-data');
        if (this.boats.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7">Aucune donnée de bateau à afficher.</td></tr>';
            return;
        }
        const tableHTML = this.boats.map(boat => `
            <tr data-mmsi="${boat.mmsi}" class="boat-row">
                <td><strong class="mmsi">${boat.mmsi}</strong></td>
                <td>${boat.horodatage}</td>
                <td class="coordinate">${boat.latitude.toFixed(4)}°</td>
                <td class="coordinate">${boat.longitude.toFixed(4)}°</td>
                <td class="speed">${boat.vitesse} kn</td>
                <td class="cap">${boat.cap}° / ${boat.cap_reel}°</td>
                <td><strong class="boat-name">${boat.nom}</strong></td>
            </tr>
        `).join('');
        tbody.innerHTML = tableHTML;
        document.querySelectorAll('.boat-row').forEach(row => {
            row.addEventListener('click', () => {
                const mmsi = row.dataset.mmsi;
                this.selectBoat(mmsi);
            });
        });
    }

    renderMapMarkers() {
        this.markers.forEach(marker => this.map.removeLayer(marker));
        this.markers = [];
        this.boats.forEach(boat => {
            // S'assurer que latitude et longitude sont des nombres valides
            if (isNaN(boat.latitude) || isNaN(boat.longitude)) {
                console.warn(`Coordonnées invalides pour le bateau MMSI: ${boat.mmsi}. Marqueur non ajouté.`, boat);
                return; // Passer ce bateau si les coordonnées sont invalides
            }

            const iconHtml = this.getBoatIcon(boat);
            const customIcon = L.divIcon({
                html: iconHtml,
                className: 'custom-boat-marker',
                iconSize: [30, 30],
                iconAnchor: [15, 15]
            });
            const marker = L.marker([boat.latitude, boat.longitude], { icon: customIcon })
                .bindPopup(this.createPopupContent(boat))
                .addTo(this.map);
            marker.on('click', (e) => {
                this.selectBoat(boat.mmsi);
                e.target.openPopup(); // Ouvrir le popup au clic sur le marqueur
            });
            this.markers.push(marker);
        });
    }

    getBoatIcon(boat) {
        // Mappage des icônes et des couleurs basé sur le type de navire et l'état
        const iconMap = {
            'En navigation': '🚢',
            'À l\'ancre': '⚓',
            'Au port': '🏠',
            'En pêche': '🎣',
            'En maintenance': '🔧',
            'Au mouillage': '⛵',
            'En avarie': '�',
            'En manoeuvre': '🛠️',
            'À l\'arrêt': '🛑',
            'En chargement': '📦',
            'En déchargement': '📥',
            'En attente': '⏳',
            'En escale': '🏡',
            'En transit': '➡️',
            'En patrouille': '👮',
            'En quarantaine': '🚧',
            'default': '🚤' // Icône par défaut si l'état n'est pas trouvé
        };
        const typeColors = {
            'Cargo': '#D32F2F',      // Rouge ISEN
            'Yacht': '#4CAF50',      // Vert
            'Pilote': '#FF9800',     // Orange
            'Chalutier': '#FF9800',  // Orange (similaire aux pilotes ou pêche)
            'Ferry': '#4CAF50',      // Vert (similaire aux yachts pour les passagers)
            'Militaire': '#1A2A44',  // Bleu marine
            'Autre': '#B0BEC5'       // Gris argent pour les types inconnus
        };

        const color = typeColors[boat.type_navire] || typeColors['Autre'];
        const icon = iconMap[boat.etat] || iconMap['default'];

        return `<div style="background: white; border-radius: 50%; padding: 5px; border: 2px solid ${color}; font-size: 16px; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);">${icon}</div>`;
    }

    createPopupContent(boat) {
        return `
            <div style="min-width: 200px;">
                <h4 style="margin: 0 0 10px 0; color: #1A2A44; border-bottom: 1px solid #A3BFFA; padding-bottom: 5px; font-weight: 700;">
                    ${boat.nom}
                </h4>
                <p><strong>🏷️ MMSI:</strong> <span class="mmsi">${boat.mmsi}</span></p>
                <p><strong>📍 Position:</strong> <span class="coordinate">${boat.latitude.toFixed(4)}°, ${boat.longitude.toFixed(4)}°</span></p>
                <p><strong>⚡ Vitesse:</strong> <span class="speed">${boat.vitesse} nœuds</span></p>
                <p><strong>🧭 Cap:</strong> <span class="cap">${boat.cap}° (COG) / ${boat.cap_reel}° (Cap Réel)</span></p>
                <p><strong>🚢 Type:</strong> ${boat.type_navire}</p>
                <p><strong>📊 État:</strong> ${boat.etat}</p>
                <p><strong>📏 Longueur:</strong> ${boat.longueur}m</p>
                <p><strong>↔️ Largeur:</strong> ${boat.largeur}m</p>
                <p><strong>⚓ Tirant d'eau:</strong> ${boat.tirant_eau}m</p>
                <p><strong>🕒 Mis à jour:</strong> ${boat.horodatage}</p>
            </div>
        `;
    }

    selectBoat(mmsi) {
        const boat = this.boats.find(b => b.mmsi === mmsi);
        if (!boat) return;
        this.selectedBoat = boat;
        this.updateTableSelection(mmsi);
        this.centerMapOnBoat(boat);
        // Optionnel: Animer le marqueur sélectionné
        const selectedMarker = this.markers.find(m =>
            m.getLatLng().lat === boat.latitude && m.getLatLng().lng === boat.longitude
            // Note: Comparer les floats peut être imprécis, utiliser une petite tolérance si besoin réel de comparer des marqueurs par position
        );
        if (selectedMarker) {
            selectedMarker.openPopup();
            // Ajouter une classe CSS pour l'animation (à définir dans fonctionnalite3.css)
            selectedMarker.getElement().classList.add('selected-marker-animation');
            setTimeout(() => {
                selectedMarker.getElement().classList.remove('selected-marker-animation');
            }, 1000); // Supprimer la classe après l'animation
        }
        console.log('🎯 Bateau sélectionné:', boat.nom);
    }

    deselectBoat() {
        this.selectedBoat = null;
        document.querySelectorAll('.boat-row').forEach(row => row.classList.remove('selected'));
        this.markers.forEach(marker => marker.getElement().classList.remove('selected-marker-animation'));
        // Fermer tous les popups ou spécifiquement celui qui est ouvert
        this.map.eachLayer(layer => {
            if (layer instanceof L.Marker) {
                layer.closePopup();
            }
        });
        console.log('❌ Désélection');
    }

    updateTableSelection(mmsi) {
        document.querySelectorAll('.boat-row').forEach(row => row.classList.remove('selected'));
        const selectedRow = document.querySelector(`[data-mmsi="${mmsi}"]`);
        if (selectedRow) {
            selectedRow.classList.add('selected');
            selectedRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    centerMapOnBoat(boat) {
        this.map.setView([boat.latitude, boat.longitude], 15, { animate: true, duration: 1 });
    }
}

// Instancier BoatTracker lorsque le DOM est entièrement chargé
document.addEventListener('DOMContentLoaded', () => {
    new BoatTracker();
});

// Styles CSS supplémentaires pour l'animation et la sélection (à ajouter à fonctionnalite3.css)
/*
.custom-boat-marker.selected-marker-animation {
    animation: pulse-marker 1s infinite alternate;
}

@keyframes pulse-marker {
    from { transform: scale(1); opacity: 1; }
    to { transform: scale(1.2); opacity: 0.8; }
}

.boats-table tbody tr.selected {
    background-color: #e0f7fa; // Couleur bleu clair pour la ligne sélectionnée
    font-weight: bold;
}
*/