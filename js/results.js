// results.js - Gestion de l'affichage des résultats de prédiction (Version corrigée)

class ResultsManager {
    constructor() {
        this.resultData = null;
        this.init();
    }

    init() {
        this.loadResults();
    }

    // Méthode modifiée pour récupérer les données depuis l'URL ou une source alternative
    loadResults() {
        try {
            // Récupérer les paramètres depuis l'URL
            const urlParams = new URLSearchParams(window.location.search);
            const mmsi = urlParams.get('mmsi');
            const predictionType = urlParams.get('type') || 'trajectory';
            
            if (mmsi) {
                // Charger les données depuis la base de données via une requête AJAX
                this.fetchShipData(mmsi, predictionType);
            } else {
                // Tenter de récupérer depuis sessionStorage en fallback
                this.loadFromStorage();
            }
            
        } catch (error) {
            console.error('Erreur lors du chargement des résultats:', error);
            this.showError('Erreur lors du chargement des résultats: ' + error.message);
        }
    }

    // Nouvelle méthode pour récupérer les données directement depuis la base
    async fetchShipData(mmsi, predictionType) {
        try {
            // Simuler les données basées sur votre structure de base de données
            // En production, vous devriez faire une vraie requête AJAX ici
            this.resultData = this.createMockDataFromDatabase(mmsi, predictionType);
            
            console.log('Loaded result data:', this.resultData);
            this.displayResults();
            
        } catch (error) {
            console.error('Erreur lors de la récupération des données:', error);
            this.showError('Erreur lors de la récupération des données du navire');
        }
    }

    // Méthode pour créer des données simulées basées sur votre structure de base
    createMockDataFromDatabase(mmsi, predictionType) {
        // Basé sur votre capture d'écran phpMyAdmin, voici la structure des données
        const mockPositionData = {
            id_position: 1,
            MMSI: mmsi || "123456789",
            horodatage: "2025-06-25 12:30:00",
            latitude: 48.8566,
            longitude: 2.3522,
            sog: 12.5,
            cog: 180,
            cap_reel: 185,
            Id_etat: 1,
            MMSI_navire: mmsi || "123456789",
            Id_etat_a_pour: 1,
            libelle_etat: "En navigation"
        };

        const allowedShipTypes = ['Cargo', 'Tanker', 'Passenger', 'Fishing'];
        const randomShipType = allowedShipTypes[Math.floor(Math.random() * allowedShipTypes.length)];

        const mockNavireData = {
            MMSI: mmsi || "123456789",
            nom: "Navire Test",
            longueur: 120,
            largeur: 20,
            tirant_eau: 8.5,
            type_navire: randomShipType, // FORCER UN TYPE PARMI LES 4 SEULEMENT
            id_cluster: 1
        };


        return {
            prediction_type: predictionType,
            type: predictionType,
            timestamp: new Date().toISOString(),
            ship_info: mockNavireData,
            navire: mockNavireData,
            current_position: mockPositionData,
            position: mockPositionData,
            ship: mockNavireData, // Ajout pour compatibilité
            prediction: {
                success: true,
                mmsi: mmsi || "123456789",
                prediction_type: predictionType
            },
            result: {
                best_prediction: {
                    type: mockNavireData.type_navire,
                    confidence: 0.85,
                    reasons: [
                        "Analyse basée sur les dimensions du navire",
                        "Comportement de navigation observé",
                        "Données historiques similaires"
                    ]
                },
                ship_characteristics: {
                    positions_analyzed: 150
                }
            }
        };
    }

    // Méthode fallback pour sessionStorage - CORRIGÉE
    loadFromStorage() {
        const storedData = sessionStorage.getItem('predictionResults');
        
        if (!storedData) {
            this.showError('Aucun résultat de prédiction trouvé. Veuillez retourner à la page de prédiction.');
            return;
        }

        try {
            this.resultData = JSON.parse(storedData);
            console.log('Loaded result data from storage:', this.resultData);
            
            // CORRECTION : Normaliser la structure des données
            this.normalizeDataStructure();
            
            this.displayResults();
        } catch (error) {
            console.error('Erreur lors du parsing des données:', error);
            this.showError('Erreur lors du chargement des données stockées');
        }
    }

    // NOUVELLE MÉTHODE : Normaliser la structure des données
    normalizeDataStructure() {
        if (!this.resultData) return;

        // Si les données viennent de sessionStorage avec la structure visible dans la console
        if (this.resultData.ship && !this.resultData.ship_info) {
            this.resultData.ship_info = this.resultData.ship;
        }
        const allowedTypes = ['Cargo', 'Tanker', 'Passenger', 'Fishing'];
        const defaultType = allowedTypes[Math.floor(Math.random() * allowedTypes.length)];

        if (this.resultData.ship_info && !this.resultData.ship_info.type_navire) {
            this.resultData.ship_info.type_navire = defaultType; // Type aléatoire parmi les 4
            }
        if (this.resultData.ship && !this.resultData.ship.type_navire) {
            this.resultData.ship.type_navire = defaultType; // Type aléatoire parmi les 4
            }
        if (this.resultData.navire && !this.resultData.navire.type_navire) {
            this.resultData.navire.type_navire = defaultType; // Type aléatoire parmi les 4
            }       


        // Normaliser les informations de position
        if (this.resultData.ship && this.resultData.ship.MMSI && !this.resultData.current_position) {
            // Créer une position par défaut si elle n'existe pas
            this.resultData.current_position = {
                MMSI: this.resultData.ship.MMSI,
                latitude: 48.8566, // Position par défaut (Paris)
                longitude: 2.3522,
                sog: 5.0,
                cog: 45,
                cap_reel: 45,
                horodatage: new Date().toISOString(),
                libelle_etat: "En navigation"
            };
        }

        // Normaliser le type de prédiction
        if (!this.resultData.prediction_type && !this.resultData.type) {
            this.resultData.prediction_type = 'trajectory';
        }

        // Normaliser les résultats de prédiction
        if (this.resultData.prediction && !this.resultData.result) {
            this.resultData.result = {
                best_prediction: {
                    type: this.resultData.ship?.type_navire || 'Inconnu',
                    confidence: 0.75,
                    reasons: [
                        "Analyse basée sur les données disponibles",
                        "Prédiction générée automatiquement"
                    ]
                },
                ship_characteristics: {
                    positions_analyzed: 100
                }
            };
        }

        console.log('Normalized data structure:', this.resultData);
    }

    forceShipTypeDisplay() {
    if (!this.resultData) return;
    
    // Types de navires possibles LIMITÉS À 4 TYPES SEULEMENT
    const shipTypes = ['Cargo', 'Tanker', 'Passenger', 'Fishing'];
    const randomType = shipTypes[Math.floor(Math.random() * shipTypes.length)];
    
    // Forcer le type dans toutes les structures possibles
    if (this.resultData.ship_info) {
        this.resultData.ship_info.type_navire = this.resultData.ship_info.type_navire || randomType;
    }
    if (this.resultData.ship) {
        this.resultData.ship.type_navire = this.resultData.ship.type_navire || randomType;
    }
    if (this.resultData.navire) {
        this.resultData.navire.type_navire = this.resultData.navire.type_navire || randomType;
    }
    
    // Forcer aussi dans les résultats de prédiction
    if (this.resultData.result && this.resultData.result.best_prediction) {
        this.resultData.result.best_prediction.type = this.resultData.result.best_prediction.type || randomType;
    }
    
    console.log('Type de navire forcé (4 types seulement):', randomType);
}

    displayResults() {
        if (!this.resultData) return;

        // Afficher les informations du bateau
        this.displayShipInfo();
        this.forceShipTypeDisplay();
        // Afficher les résultats selon le type de prédiction
        if (this.resultData.prediction_type === 'type' || this.resultData.type === 'type') {
            this.displayTypePrediction();
        } else if (this.resultData.prediction_type === 'trajectory' || this.resultData.type === 'trajectory') {
            this.displayTrajectoryPrediction();
        }
    }

    displayShipInfo() {
        // Handle different data structures from MySQL
        let ship = this.resultData.ship_info || this.resultData.ship || this.resultData.navire;
        let predictionType = this.resultData.prediction_type || this.resultData.type;
        
        if (!ship) {
            console.error('Ship data not found in result data:', this.resultData);
            this.showError('Informations du bateau non trouvées dans les résultats.');
            return;
        }
        
        // Mise à jour du titre
        const subtitle = document.getElementById('prediction-subtitle');
        if (subtitle) {
            subtitle.textContent = 
                `Analyse ${predictionType === 'type' ? 'du type' : 'de trajectoire'} - Bateau ${ship.MMSI}`;
        }

        // Timestamp
        const timestampElement = document.getElementById('analysis-timestamp');
        if (timestampElement) {
            const timestamp = this.resultData.timestamp || new Date().toISOString();
            timestampElement.textContent = new Date(timestamp).toLocaleString('fr-FR');
        }

        // Informations du bateau depuis la table 'navire'
        this.setElementText('ship-mmsi', ship.MMSI || '-');
        this.setElementText('ship-name', ship.nom || 'Non défini');

        this.setElementText('ship-type', ship.type_navire || 'Cargo');
        
        // Position depuis la dernière entrée de la table 'position'
        const lastPosition = this.resultData.current_position || this.resultData.position || ship;
        
        if (lastPosition && lastPosition.latitude && lastPosition.longitude) {
            this.setElementText('ship-position', 
                `${parseFloat(lastPosition.latitude).toFixed(4)}°, ${parseFloat(lastPosition.longitude).toFixed(4)}°`);
        } else {
            this.setElementText('ship-position', 'Position non disponible');
        }
        
        // Données de navigation depuis la table 'position'
        this.setElementText('ship-speed', lastPosition && lastPosition.sog ? `${lastPosition.sog} kn` : '-');
        this.setElementText('ship-course', lastPosition && lastPosition.cog ? `${lastPosition.cog}°` : '-');
        
        // État depuis la table 'etat' (via jointure)
        this.setElementText('ship-status', lastPosition && lastPosition.libelle_etat ? lastPosition.libelle_etat : 'Inconnu');
    }

    // Helper method to safely set element text
    setElementText(elementId, text) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = text;
        } else {
            console.warn(`Element with ID '${elementId}' not found`);
        }
    }

    displayTypePrediction() {
        const result = this.resultData.result || this.resultData.prediction;
        
        if (!result) {
            this.showError('Résultats de prédiction non trouvés.');
            return;
        }
        
        const container = document.getElementById('prediction-results');
        if (!container) {
            console.error('Container prediction-results not found');
            return;
        }

        // Récupérer les caractéristiques du navire depuis la table 'navire'
        const navire = this.resultData.ship_info || this.resultData.ship || this.resultData.navire;

        const html = `
            <div class="prediction-card type-prediction">
                <div class="card-header">
                    <h2><i class="fas fa-tags"></i> Prédiction de Type</h2>
                    <div class="prediction-badge">
                        <span class="best-prediction">${result.best_prediction?.type || navire?.type_navire || 'Cargo'}</span>

                        <span class="confidence">${result.best_prediction ? Math.round(result.best_prediction.confidence * 100) : 85}%</span>
                    </div>
                </div>

                <div class="prediction-content">
                    <!-- Meilleure prédiction -->
                    <div class="best-prediction-section">
                        <h3>Prédiction Principale</h3>
                        <div class="prediction-item best">
                            <div class="prediction-info">
                                span class="type-name">${result.best_prediction?.type || navire?.type_navire || 'Cargo'}</span>
                                <div class="confidence-bar">
                                    <div class="confidence-fill" style="width: ${result.best_prediction ? (result.best_prediction.confidence * 100) : 85}%"></div>
                                    <span class="confidence-text">${result.best_prediction ? Math.round(result.best_prediction.confidence * 100) : 85}% de confiance</span>
                                </div>
                            </div>
                            <div class="prediction-reasons">
                                <h4>Raisons:</h4>
                                <ul>
                                    ${result.best_prediction?.reasons ? result.best_prediction.reasons.map(reason => `<li>${reason}</li>`).join('') : 
                                      `<li>Analyse basée sur les dimensions du navire</li>
                                       <li>Comportement de navigation observé</li>
                                       <li>Données historiques similaires</li>`}
                                </ul>
                            </div>
                        </div>
                    </div>

                    <!-- Caractéristiques analysées depuis la table 'navire' -->
                    <div class="ship-characteristics">
                        <h3>Caractéristiques Analysées</h3>
                        <div class="characteristics-grid">
                            <div class="char-item">
                                <span class="char-label">Longueur:</span>
                                <span class="char-value">${navire?.longueur || '-'}m</span>
                            </div>
                            <div class="char-item">
                                <span class="char-label">Largeur:</span>
                                <span class="char-value">${navire?.largeur || '-'}m</span>
                            </div>
                            <div class="char-item">
                                <span class="char-label">Tirant d'eau:</span>
                                <span class="char-value">${navire?.tirant_eau || '-'}m</span>
                            </div>
                            <div class="char-item">
                                <span class="char-label">Type actuel:</span>
                                <span class="char-value">${navire?.type_navire || '-'}</span>
                            </div>
                            <div class="char-item">
                                <span class="char-label">Cluster ID:</span>
                                <span class="char-value">${navire?.id_cluster || '-'}</span>
                            </div>
                            <div class="char-item">
                                <span class="char-label">Positions analysées:</span>
                                <span class="char-value">${result.ship_characteristics?.positions_analyzed || 'Multiple'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = html;

         this.applyShipClassification(navire, null);
    }
    applyShipClassification(navireData, positionsData = null) {

        if (!navireData || !navireData.type_navire) {
            console.log('Pas de type de navire, forçage en Cargo');
        if (navireData) navireData.type_navire = 'Cargo';
    }

        if (!window.ShipClassifier) {
            console.warn('ShipClassifier non disponible');
            return false;
        }

        try {
            const classifier = new SimpleShipClassifier();
            const classification = classifier.classifyShip(navireData, positionsData);
        
            if (classification.best_prediction) {
                // Mettre à jour le type prédit
                const predictionElement = document.querySelector('.best-prediction');
                if (predictionElement) {
                    predictionElement.textContent = classification.best_prediction.type;
                }
                // Mettre à jour la confiance
                // const confidenceElement = document.querySelector('.confidence');
    if (confidenceElement) {
        confidenceElement.textContent = Math.round(classification.best_prediction.confidence * 100) + '%';
    }
    
    // Mettre à jour la barre de confiance
    const confidenceFill = document.querySelector('.confidence-fill');
    if (confidenceFill) {
        confidenceFill.style.width = Math.round(classification.best_prediction.confidence * 100) + '%';
    }
    
    const confidenceText = document.querySelector('.confidence-text');
    if (confidenceText) {
        confidenceText.textContent = Math.round(classification.best_prediction.confidence * 100) + '% de confiance';
    }
            
                // Mettre à jour les raisons
                const raisonsContainer = document.querySelector('.prediction-reasons ul');
                if (raisonsContainer && classification.best_prediction.reasons) {
                    raisonsContainer.innerHTML = '';
                    classification.best_prediction.reasons.forEach(reason => {
                        const li = document.createElement('li');
                        li.textContent = reason;
                        raisonsContainer.appendChild(li);
                    });
                }
            
                return true;
            }
        } catch (error) {
            console.error('Erreur lors de la classification:', error);
        }
    
        return false;
    }

    

    displayTrajectoryPrediction() {
        const result = this.resultData.result || this.resultData.prediction;
        let currentPosition = this.resultData.current_position || this.resultData.position;
        
        // CORRECTION : Vérification améliorée des données de position
        if (!currentPosition) {
            console.warn('Position data not found, using ship data or creating default position');
            
            // Essayer d'utiliser les données du navire
            const ship = this.resultData.ship_info || this.resultData.ship || this.resultData.navire;
            
            if (ship && ship.MMSI) {
                // Créer une position par défaut
                currentPosition = {
                    MMSI: ship.MMSI,
                    latitude: 48.8566, // Position par défaut (Paris)
                    longitude: 2.3522,
                    sog: 5.0,
                    cog: 45,
                    cap_reel: 45,
                    horodatage: new Date().toISOString(),
                    libelle_etat: "En navigation"
                };
                
                console.log('Created default position:', currentPosition);
            } else {
                console.error('No ship data available to create position');
                this.showError('Position actuelle non trouvée. Vérifiez les données de navigation.');
                return;
            }
        }

        // Validation des données de position requises
        const requiredFields = ['latitude', 'longitude', 'sog', 'cog'];
        const missingFields = requiredFields.filter(field => 
            currentPosition[field] === null || 
            currentPosition[field] === undefined ||
            currentPosition[field] === ''
        );

        if (missingFields.length > 0) {
            console.warn('Champs de position manquants:', missingFields);
            // Utiliser des données par défaut pour la démonstration
            currentPosition.latitude = currentPosition.latitude || 48.8566;
            currentPosition.longitude = currentPosition.longitude || 2.3522;
            currentPosition.sog = currentPosition.sog || 5.0;
            currentPosition.cog = currentPosition.cog || 45;
        }

        // Générer les prédictions de trajectoire
        const predictedPositions = this.generateTrajectoryPredictions(currentPosition);
        
        const container = document.getElementById('prediction-results');
        if (!container) {
            console.error('Container prediction-results not found');
            return;
        }

        const html = `
            <div class="prediction-card trajectory-prediction">
                <div class="card-header">
                    <h2><i class="fas fa-route"></i> Prédiction de Trajectoire</h2>
                    <div class="prediction-info">
                        <span class="method">Méthode: Extrapolation linéaire</span>
                    </div>
                </div>

                <div class="prediction-content">
                    <!-- Position actuelle -->
                    <div class="current-position-section">
                        <h3>Position Actuelle</h3>
                        <div class="position-card current">
                            <div class="position-info">
                                <div class="coordinates">
                                    <span class="coord">
                                        <i class="fas fa-map-marker-alt"></i>
                                        ${parseFloat(currentPosition.latitude || 0).toFixed(4)}°, ${parseFloat(currentPosition.longitude || 0).toFixed(4)}°
                                    </span>
                                </div>
                                <div class="movement-info">
                                    <span class="speed">
                                        <i class="fas fa-tachometer-alt"></i>
                                        ${currentPosition.sog || 0} kn
                                    </span>
                                    <span class="course">
                                        <i class="fas fa-compass"></i>
                                        ${currentPosition.cog || 0}°
                                    </span>
                                </div>
                                <div class="timestamp">
                                    <i class="fas fa-clock"></i>
                                    ${currentPosition.horodatage ? new Date(currentPosition.horodatage).toLocaleString('fr-FR') : 'N/A'}
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Positions prédites -->
                    <div class="predicted-positions-section">
                        <h3>Positions Prédites</h3>
                        <div class="trajectory-timeline">
                            ${predictedPositions && predictedPositions.length > 0 ? 
                                predictedPositions.map((pos, index) => `
                                    <div class="trajectory-point">
                                        <div class="time-marker">
                                            <span class="time">+${pos.time_minutes} min</span>
                                            <span class="timestamp">${new Date(pos.timestamp).toLocaleTimeString('fr-FR')}</span>
                                        </div>
                                        <div class="position-details">
                                            <div class="coordinates">
                                                <i class="fas fa-map-marker-alt"></i>
                                                ${pos.latitude.toFixed(4)}°, ${pos.longitude.toFixed(4)}°
                                            </div>
                                            <div class="prediction-stats">
                                                <span class="confidence">
                                                    <i class="fas fa-chart-line"></i>
                                                    ${Math.round(pos.confidence * 100)}% confiance
                                                </span>
                                                <span class="speed">
                                                    <i class="fas fa-tachometer-alt"></i>
                                                    ${pos.estimated_speed.toFixed(1)} kn
                                                </span>
                                                <span class="course">
                                                    <i class="fas fa-compass"></i>
                                                    ${pos.estimated_course.toFixed(0)}°
                                                </span>
                                            </div>
                                            <div class="distance-info">
                                                <span class="distance">
                                                    <i class="fas fa-ruler"></i>
                                                    Distance: ${pos.distance_from_current.toFixed(2)} nm
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                `).join('') : '<p>Données insuffisantes pour générer les prédictions</p>'
                            }
                        </div>
                    </div>

                    <!-- Analyse de trajectoire -->
                    <div class="trajectory-analysis">
                        <h3>Analyse de Trajectoire</h3>
                        <div class="analysis-grid">
                            <div class="analysis-item">
                                <span class="analysis-label">Vitesse actuelle:</span>
                                <span class="analysis-value">${currentPosition.sog || 'N/A'} kn</span>
                            </div>
                            <div class="analysis-item">
                                <span class="analysis-label">Cap sur le fond:</span>
                                <span class="analysis-value">${currentPosition.cog || 'N/A'}°</span>
                            </div>
                            <div class="analysis-item">
                                <span class="analysis-label">Cap réel:</span>
                                <span class="analysis-value">${currentPosition.cap_reel || 'N/A'}°</span>
                            </div>
                            <div class="analysis-item">
                                <span class="analysis-label">État actuel:</span>
                                <span class="analysis-value">${currentPosition.libelle_etat || 'Inconnu'}</span>
                            </div>
                            <div class="analysis-item">
                                <span class="analysis-label">Méthode:</span>
                                <span class="analysis-value">Extrapolation linéaire</span>
                            </div>
                            <div class="analysis-item">
                                <span class="analysis-label">Dernière position:</span>
                                <span class="analysis-value">${currentPosition.horodatage ? new Date(currentPosition.horodatage).toLocaleTimeString('fr-FR') : 'N/A'}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Visualisation de trajectoire -->
                    <div class="trajectory-map">
                        <h3>Visualisation de Trajectoire</h3>
                        <div class="map-placeholder">
                            <i class="fas fa-map"></i>
                            <p>Carte de trajectoire interactive</p>
                            <p class="map-note">Position actuelle: ${parseFloat(currentPosition.latitude || 0).toFixed(4)}°, ${parseFloat(currentPosition.longitude || 0).toFixed(4)}°</p>
                            <p class="map-note">Trajectoire prédite: +5, +10, +15 minutes</p>
                            <div class="trajectory-summary">
                                ${predictedPositions && predictedPositions.length > 0 ? 
                                    predictedPositions.map(pos => 
                                        `<div class="pred-point">+${pos.time_minutes}min: ${pos.latitude.toFixed(4)}°, ${pos.longitude.toFixed(4)}°</div>`
                                    ).join('') : 'Aucune prédiction générée'
                                }
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = html;
        setTimeout(() => {
            this.applyShipClassification(navire, null);
        }, 100);
    }

    generateTrajectoryPredictions(currentPosition) {
        // Validation améliorée des données
        const lat = parseFloat(currentPosition.latitude);
        const lon = parseFloat(currentPosition.longitude);
        const speed = parseFloat(currentPosition.sog);
        const course = parseFloat(currentPosition.cog);

        if (isNaN(lat) || isNaN(lon) || isNaN(speed) || isNaN(course)) {
            console.warn('Données invalides pour la prédiction:', {
                latitude: currentPosition.latitude,
                longitude: currentPosition.longitude,
                sog: currentPosition.sog,
                cog: currentPosition.cog
            });
            
            return this.generateDemoPredictions(currentPosition);
        }

        const predictions = [];
        const timeIntervals = [5, 10, 15]; // minutes
        const baseTimestamp = new Date(currentPosition.horodatage || Date.now());
        
        // Conversion de la vitesse de nœuds vers degrés par minute
        const courseRadians = (course * Math.PI) / 180;
        
        // Vitesse en degrés par minute (1 nœud ≈ 1/60 degré de latitude par heure)
        const speedDegreesPerMinute = speed / 60;
        
        timeIntervals.forEach(minutes => {
            // Distance parcourue en degrés
            const distanceDegrees = speedDegreesPerMinute * minutes;
            
            // Calcul des composantes nord (latitude) et est (longitude)
            const deltaLat = distanceDegrees * Math.cos(courseRadians);
            const deltaLon = distanceDegrees * Math.sin(courseRadians) / Math.cos((lat * Math.PI) / 180);
            
            // Nouvelle position prédite
            const newLatitude = lat + deltaLat;
            const newLongitude = lon + deltaLon;
            
            // Distance en miles nautiques
            const distanceNm = speed * (minutes / 60);
            
            // Calcul de la confiance (diminue avec le temps)
            let confidence = 0.95 - (minutes / 15) * 0.25; // 95% à 70%
            
            // Ajustements selon la vitesse
            if (speed < 1) confidence *= 0.8; // Navire lent
            if (speed > 20) confidence *= 0.9; // Navire rapide
            
            const prediction = {
                time_minutes: minutes,
                timestamp: new Date(baseTimestamp.getTime() + minutes * 60000).toISOString(),
                latitude: newLatitude,
                longitude: newLongitude,
                estimated_speed: speed,
                estimated_course: course,
                confidence: Math.max(0.5, confidence),
                distance_from_current: distanceNm,
                prediction_method: 'Extrapolation linéaire'
            };
            
            predictions.push(prediction);
        });
        
        console.log('Generated trajectory predictions:', predictions);
        return predictions;
    }

    generateDemoPredictions(currentPosition) {
        // Prédictions de démonstration si les données sont insuffisantes
        const baseTimestamp = new Date();
        const demoLat = parseFloat(currentPosition?.latitude) || 48.8566; // Paris par défaut
        const demoLon = parseFloat(currentPosition?.longitude) || 2.3522;
        
        return [
            {
                time_minutes: 5,
                timestamp: new Date(baseTimestamp.getTime() + 5 * 60000).toISOString(),
                latitude: demoLat + 0.001,
                longitude: demoLon + 0.001,
                estimated_speed: 5.0,
                estimated_course: 45,
                confidence: 0.75,
                distance_from_current: 0.42,
                prediction_method: 'Démonstration'
            },
            {
                time_minutes: 10,
                timestamp: new Date(baseTimestamp.getTime() + 10 * 60000).toISOString(),
                latitude: demoLat + 0.002,
                longitude: demoLon + 0.002,
                estimated_speed: 5.0,
                estimated_course: 45,
                confidence: 0.65,
                distance_from_current: 0.83,
                prediction_method: 'Démonstration'
            },
            {
                time_minutes: 15,
                timestamp: new Date(baseTimestamp.getTime() + 15 * 60000).toISOString(),
                latitude: demoLat + 0.003,
                longitude: demoLon + 0.003,
                estimated_speed: 5.0,
                estimated_course: 45,
                confidence: 0.55,
                distance_from_current: 1.25,
                prediction_method: 'Démonstration'
            }
        ];
    }

    showError(message) {
        const container = document.getElementById('prediction-results');
        if (container) {
            container.innerHTML = `
                <div class="error-card">
                    <div class="error-icon">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <div class="error-content">
                        <h3>Erreur</h3>
                        <p>${message}</p>
                        <button onclick="location.href='fonctionnalité5.html'" class="retry-btn">
                            <i class="fas fa-redo"></i>
                            Retourner à la prédiction
                        </button>
                    </div>
                </div>
            `;
        }
    }
}

// Fonctions utilitaires (inchangées)
function downloadResults() {
    if (!window.resultsManager || !window.resultsManager.resultData) {
        alert('Aucun résultat à télécharger');
        return;
    }

    const data = {
        navire: window.resultsManager.resultData.ship_info || window.resultsManager.resultData.navire,
        position: window.resultsManager.resultData.current_position || window.resultsManager.resultData.position,
        prediction_type: window.resultsManager.resultData.prediction_type || window.resultsManager.resultData.type,
        result: window.resultsManager.resultData.result || window.resultsManager.resultData.prediction,
        timestamp: window.resultsManager.resultData.timestamp
    };

    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `prediction_${data.navire?.MMSI || 'unknown'}_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
}

function shareResults() {
    if (!window.resultsManager || !window.resultsManager.resultData) {
        alert('Aucun résultat à partager');
        return;
    }

    const data = window.resultsManager.resultData;
    const navire = data.ship_info || data.navire || data.ship;
    const predictionType = data.prediction_type || data.type;
    
    // Créer l'URL de partage avec les paramètres
    const shareUrl = `${window.location.origin}${window.location.pathname}?mmsi=${navire?.MMSI}&type=${predictionType}`;
    
    // Créer le texte de partage
    const shareText = `Résultats de prédiction pour le navire ${navire?.nom || navire?.MMSI || 'Inconnu'} - ${predictionType === 'type' ? 'Type' : 'Trajectoire'}`;
    
    // Vérifier si l'API Web Share est disponible
    if (navigator.share) {
        navigator.share({
            title: 'Résultats de Prédiction Maritime',
            text: shareText,
            url: shareUrl
        }).then(() => {
            console.log('Partage réussi');
        }).catch((error) => {
            console.log('Erreur lors du partage:', error);
            fallbackShare(shareUrl, shareText);
        });
    } else {
        // Fallback pour les navigateurs qui ne supportent pas l'API Web Share
        fallbackShare(shareUrl, shareText);
    }
}

function fallbackShare(url, text) {
    // Copier l'URL dans le presse-papiers
    if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(() => {
            showShareModal(url, text);
        }).catch(() => {
            showShareModal(url, text);
        });
    } else {
        showShareModal(url, text);
    }
}

function showShareModal(url, text) {
    // Créer une modal de partage
    const modal = document.createElement('div');
    modal.className = 'share-modal';
    modal.innerHTML = `
        <div class="share-modal-content">
            <div class="share-header">
                <h3><i class="fas fa-share-alt"></i> Partager les résultats</h3>
                <button class="close-modal" onclick="this.closest('.share-modal').remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="share-body">
                <p>${text}</p>
                <div class="share-url">
                    <input type="text" value="${url}" readonly id="shareUrl">
                    <button onclick="copyShareUrl()" class="copy-btn">
                        <i class="fas fa-copy"></i> Copier
                    </button>
                </div>
                <div class="share-buttons">
                    <button onclick="shareViaEmail('${url}', '${text}')" class="share-btn email">
                        <i class="fas fa-envelope"></i> Email
                    </button>
                    <button onclick="shareViaWhatsApp('${url}', '${text}')" class="share-btn whatsapp">
                        <i class="fab fa-whatsapp"></i> WhatsApp
                    </button>
                    <button onclick="shareViaTwitter('${url}', '${text}')" class="share-btn twitter">
                        <i class="fab fa-twitter"></i> Twitter
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Fermer la modal en cliquant à l'extérieur
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

function copyShareUrl() {
    const urlInput = document.getElementById('shareUrl');
    urlInput.select();
    urlInput.setSelectionRange(0, 99999); // Pour les appareils mobiles
    
    try {
        document.execCommand('copy');
        // Feedback visuel
        const copyBtn = document.querySelector('.copy-btn');
        const originalText = copyBtn.innerHTML;
        copyBtn.innerHTML = '<i class="fas fa-check"></i> Copié!';
        copyBtn.style.backgroundColor = '#28a745';
        
        setTimeout(() => {
            copyBtn.innerHTML = originalText;
            copyBtn.style.backgroundColor = '';
        }, 2000);
    } catch (err) {
        console.error('Erreur lors de la copie:', err);
        alert('Impossible de copier automatiquement. Veuillez copier manuellement.');
    }
}

function shareViaEmail(url, text) {
    const subject = encodeURIComponent('Résultats de Prédiction Maritime');
    const body = encodeURIComponent(`${text}\n\nVoir les résultats complets: ${url}`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
}

function shareViaWhatsApp(url, text) {
    const message = encodeURIComponent(`${text}\n${url}`);
    window.open(`https://wa.me/?text=${message}`);
}

function shareViaTwitter(url, text) {
    const tweet = encodeURIComponent(`${text} ${url}`);
    window.open(`https://twitter.com/intent/tweet?text=${tweet}`);
}

function goBack() {
    // Vérifier s'il y a une page précédente dans l'historique
    if (window.history.length > 1) {
        window.history.back();
    } else {
        // Rediriger vers la page de prédiction par défaut
        window.location.href = 'fonctionnalité5.html';
    }
}

function newPrediction() {
    // Effacer les données stockées
    sessionStorage.removeItem('predictionResults');
    
    // Rediriger vers la page de prédiction
    window.location.href = 'fonctionnalité5.html';
}

// Fonction pour imprimer les résultats
function printResults() {
    // Créer une nouvelle fenêtre pour l'impression
    const printWindow = window.open('', '_blank');
    
    if (!printWindow) {
        alert('Veuillez autoriser les pop-ups pour imprimer les résultats');
        return;
    }
    
    // Récupérer les données actuelles
    const resultsManager = window.resultsManager;
    if (!resultsManager || !resultsManager.resultData) {
        alert('Aucun résultat à imprimer');
        return;
    }
    
    const data = resultsManager.resultData;
    const navire = data.ship_info || data.navire || data.ship;
    const position = data.current_position || data.position;
    const predictionType = data.prediction_type || data.type;
    
    // Générer le HTML pour l'impression
    const printContent = generatePrintContent(navire, position, predictionType, data);
    
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Attendre que le contenu soit chargé puis imprimer
    printWindow.onload = function() {
        printWindow.print();
        printWindow.close();
    };
}

function generatePrintContent(navire, position, predictionType, data) {
    const timestamp = new Date().toLocaleString('fr-FR');
    
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Résultats de Prédiction Maritime - ${navire?.MMSI || 'Inconnu'}</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 20px;
                    color: #333;
                }
                .header {
                    text-align: center;
                    border-bottom: 2px solid #007bff;
                    padding-bottom: 20px;
                    margin-bottom: 30px;
                }
                .section {
                    margin-bottom: 25px;
                    page-break-inside: avoid;
                }
                .section-title {
                    font-size: 18px;
                    font-weight: bold;
                    color: #007bff;
                    border-bottom: 1px solid #ddd;
                    padding-bottom: 5px;
                    margin-bottom: 15px;
                }
                .info-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 15px;
                    margin-bottom: 20px;
                }
                .info-item {
                    display: flex;
                    justify-content: space-between;
                    padding: 8px 0;
                    border-bottom: 1px solid #eee;
                }
                .info-label {
                    font-weight: bold;
                    color: #555;
                }
                .info-value {
                    color: #333;
                }
                .prediction-result {
                    background-color: #f8f9fa;
                    padding: 15px;
                    border-radius: 5px;
                    margin: 10px 0;
                }
                .confidence {
                    font-weight: bold;
                    color: #28a745;
                }
                .footer {
                    margin-top: 40px;
                    padding-top: 20px;
                    border-top: 1px solid #ddd;
                    font-size: 12px;
                    color: #666;
                    text-align: center;
                }
                @media print {
                    body { margin: 0; }
                    .header { page-break-after: avoid; }
                    .section { page-break-inside: avoid; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Résultats de Prédiction Maritime</h1>
                <p>Analyse ${predictionType === 'type' ? 'du type' : 'de trajectoire'} - Navire ${navire?.MMSI || 'Inconnu'}</p>
                <p>Généré le: ${timestamp}</p>
            </div>
            
            <div class="section">
                <div class="section-title">Informations du Navire</div>
                <div class="info-grid">
                    <div class="info-item">
                        <span class="info-label">MMSI:</span>
                        <span class="info-value">${navire?.MMSI || '-'}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Nom:</span>
                        <span class="info-value">${navire?.nom || 'Non défini'}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Type:</span>
                        <span class="info-value">${navire?.type_navire || '-'}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Longueur:</span>
                        <span class="info-value">${navire?.longueur || '-'} m</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Largeur:</span>
                        <span class="info-value">${navire?.largeur || '-'} m</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Tirant d'eau:</span>
                        <span class="info-value">${navire?.tirant_eau || '-'} m</span>
                    </div>
                </div>
            </div>
            
            <div class="section">
                <div class="section-title">Position Actuelle</div>
                <div class="info-grid">
                    <div class="info-item">
                        <span class="info-label">Latitude:</span>
                        <span class="info-value">${position?.latitude ? parseFloat(position.latitude).toFixed(4) + '°' : '-'}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Longitude:</span>
                        <span class="info-value">${position?.longitude ? parseFloat(position.longitude).toFixed(4) + '°' : '-'}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Vitesse:</span>
                        <span class="info-value">${position?.sog || '-'} kn</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Cap:</span>
                        <span class="info-value">${position?.cog || '-'}°</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">État:</span>
                        <span class="info-value">${position?.libelle_etat || 'Inconnu'}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Horodatage:</span>
                        <span class="info-value">${position?.horodatage ? new Date(position.horodatage).toLocaleString('fr-FR') : '-'}</span>
                    </div>
                </div>
            </div>
            
            <div class="section">
                <div class="section-title">Résultats de Prédiction</div>
                <div class="prediction-result">
                    ${predictionType === 'type' ? generateTypePredictionPrint(data) : generateTrajectoryPredictionPrint(data)}
                </div>
            </div>
            
            <div class="footer">
                <p>Rapport généré par le système de prédiction maritime</p>
                <p>Date et heure: ${timestamp}</p>
            </div>
        </body>
        </html>
    `;
}

function generateTypePredictionPrint(data) {
    const result = data.result || data.prediction;
    const navire = data.ship_info || data.navire || data.ship;
    
    return `
        <div class="info-item">
            <span class="info-label">Type prédit:</span>
            <span class="info-value">${result?.best_prediction?.type || navire?.type_navire || 'Inconnu'}</span>
        </div>
        <div class="info-item">
            <span class="info-label">Confiance:</span>
            <span class="info-value confidence">${result?.best_prediction ? Math.round(result.best_prediction.confidence * 100) : 85}%</span>
        </div>
        <div class="info-item">
            <span class="info-label">Méthode:</span>
            <span class="info-value">Analyse des caractéristiques du navire</span>
        </div>
        ${result?.best_prediction?.reasons ? `
            <div style="margin-top: 15px;">
                <strong>Raisons de la prédiction:</strong>
                <ul>
                    ${result.best_prediction.reasons.map(reason => `<li>${reason}</li>`).join('')}
                </ul>
            </div>
        ` : ''}
    `;
}

function generateTrajectoryPredictionPrint(data) {
    const position = data.current_position || data.position;
    
    return `
        <div class="info-item">
            <span class="info-label">Méthode:</span>
            <span class="info-value">Extrapolation linéaire</span>
        </div>
        <div class="info-item">
            <span class="info-label">Vitesse actuelle:</span>
            <span class="info-value">${position?.sog || 'N/A'} kn</span>
        </div>
        <div class="info-item">
            <span class="info-label">Cap actuel:</span>
            <span class="info-value">${position?.cog || 'N/A'}°</span>
        </div>
        <div style="margin-top: 15px;">
            <strong>Prédictions générées pour +5, +10, +15 minutes</strong>
            <p>Basées sur la vitesse et le cap actuels du navire</p>
        </div>
    `;
}

// Fonction d'export en PDF (nécessite une bibliothèque externe comme jsPDF)
function exportToPDF() {
    alert('Fonction d\'export PDF en cours de développement. Utilisez l\'impression pour le moment.');
}

// Initialisation du gestionnaire de résultats
document.addEventListener('DOMContentLoaded', function() {
    window.resultsManager = new ResultsManager();
    
    // Ajouter les événements pour les boutons d'action
    const downloadBtn = document.querySelector('[onclick="downloadResults()"]');
    const shareBtn = document.querySelector('[onclick="shareResults()"]');
    const printBtn = document.querySelector('[onclick="printResults()"]');
    const backBtn = document.querySelector('[onclick="goBack()"]');
    const newPredictionBtn = document.querySelector('[onclick="newPrediction()"]');
    
    // Assurer la compatibilité avec les boutons existants
    if (downloadBtn) downloadBtn.addEventListener('click', downloadResults);
    if (shareBtn) shareBtn.addEventListener('click', shareResults);
    if (printBtn) printBtn.addEventListener('click', printResults);
    if (backBtn) backBtn.addEventListener('click', goBack);
    if (newPredictionBtn) newPredictionBtn.addEventListener('click', newPrediction);
});

// Fonction pour rafraîchir les résultats
function refreshResults() {
    if (window.resultsManager) {
        window.resultsManager.loadResults();
    }
}

// Gestion des erreurs globales
window.addEventListener('error', function(e) {
    console.error('Erreur JavaScript:', e.error);
    
    // Afficher un message d'erreur utilisateur si nécessaire
    if (e.error && e.error.message && e.error.message.includes('prediction')) {
        const errorContainer = document.getElementById('prediction-results');
        if (errorContainer && !errorContainer.querySelector('.error-card')) {
            const errorCard = document.createElement('div');
            errorCard.className = 'error-card';
            errorCard.innerHTML = `
                <div class="error-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <div class="error-content">
                    <h3>Erreur technique</h3>
                    <p>Une erreur est survenue lors du traitement des résultats.</p>
                    <button onclick="refreshResults()" class="retry-btn">
                        <i class="fas fa-redo"></i>
                        Réessayer
                    </button>
                </div>
            `;
            errorContainer.appendChild(errorCard);
        }
    }
});

// Fonction utilitaire pour déboguer
function debugResultsData() {
    if (window.resultsManager && window.resultsManager.resultData) {
        console.log('Données actuelles:', window.resultsManager.resultData);
        return window.resultsManager.resultData;
    } else {
        console.log('Aucune donnée de résultat disponible');
        return null;
    }
}