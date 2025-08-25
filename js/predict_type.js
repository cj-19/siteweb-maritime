// predict_type.js - Gestion de l'interface de prédiction

class PredictionManager {
    constructor() {
        this.selectedShip = null;
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.allShips = [];
        this.filteredShips = [];
        this.sortColumn = null;
        this.sortDirection = 'asc';
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadShipsData();
    }

    bindEvents() {
        // Boutons de prédiction
        document.getElementById('predict-type-btn').addEventListener('click', () => {
            this.startPrediction('type');
        });
        
        document.getElementById('predict-trajectory-btn').addEventListener('click', () => {
            this.startPrediction('trajectory');
        });

        // Actualisation des données
        document.getElementById('refresh-btn').addEventListener('click', () => {
            this.loadShipsData();
        });

        // Recherche
        document.getElementById('search-input').addEventListener('input', (e) => {
            this.filterShips(e.target.value);
        });

        // Pagination
        document.getElementById('prev-page').addEventListener('click', () => {
            if (this.currentPage > 1) {
                this.currentPage--;
                this.renderTable();
            }
        });

        document.getElementById('next-page').addEventListener('click', () => {
            const totalPages = Math.ceil(this.filteredShips.length / this.itemsPerPage);
            if (this.currentPage < totalPages) {
                this.currentPage++;
                this.renderTable();
            }
        });

        // Tri des colonnes
        document.querySelectorAll('th[data-sort]').forEach(th => {
            th.addEventListener('click', () => {
                this.sortTable(th.dataset.sort);
            });
        });

        // Effacement de la sélection
        document.getElementById('clear-selection').addEventListener('click', () => {
            this.clearSelection();
        });
    }

    async loadShipsData() {
        try {
            this.showLoading(true);
            
            const response = await fetch('php/get_boats.php');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }

            this.allShips = data.map(ship => ({
                ...ship,
                horodatage: this.formatTimestamp(ship.horodatage),
                vitesse: this.formatSpeed(ship.vitesse),
                cap: this.formatCourse(ship.cap),
                etat: this.formatStatus(ship.etat),
                position: `${parseFloat(ship.latitude).toFixed(4)}, ${parseFloat(ship.longitude).toFixed(4)}`
            }));

            this.filteredShips = [...this.allShips];
            this.currentPage = 1;
            this.renderTable();
            
        } catch (error) {
            console.error('Erreur lors du chargement des données:', error);
            this.showError('Erreur lors du chargement des données des bateaux: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    showLoading(show) {
        const tbody = document.getElementById('ships-tbody');
        if (show) {
            tbody.innerHTML = `
                <tr class="loading-row">
                    <td colspan="10">
                        <div class="loading-container">
                            <div class="loading-spinner"></div>
                            <span>Chargement des données...</span>
                        </div>
                    </td>
                </tr>
            `;
        }
    }

    showError(message) {
        const tbody = document.getElementById('ships-tbody');
        tbody.innerHTML = `
            <tr class="error-row">
                <td colspan="10">
                    <div class="error-state">
                        <i class="fas fa-exclamation-triangle"></i>
                        <span>${message}</span>
                    </div>
                </td>
            </tr>
        `;
    }

    filterShips(searchTerm) {
        if (!searchTerm.trim()) {
            this.filteredShips = [...this.allShips];
        } else {
            const term = searchTerm.toLowerCase();
            this.filteredShips = this.allShips.filter(ship => 
                ship.MMSI.toString().includes(term) ||
                (ship.nom && ship.nom.toLowerCase().includes(term)) ||
                ship.etat.toLowerCase().includes(term)
            );
        }
        
        this.currentPage = 1;
        this.renderTable();
    }

    sortTable(column) {
        if (this.sortColumn === column) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortColumn = column;
            this.sortDirection = 'asc';
        }

        this.filteredShips.sort((a, b) => {
            let valueA = a[column];
            let valueB = b[column];

            // Gestion des valeurs numériques
            if (column === 'MMSI' || column === 'latitude' || column === 'longitude' || 
                column === 'longueur') {
                valueA = parseFloat(valueA) || 0;
                valueB = parseFloat(valueB) || 0;
            }

            // Gestion des dates
            if (column === 'horodatage') {
                valueA = new Date(valueA);
                valueB = new Date(valueB);
            }

            // Tri string par défaut
            if (typeof valueA === 'string') {
                valueA = valueA.toLowerCase();
                valueB = valueB.toLowerCase();
            }

            if (valueA < valueB) return this.sortDirection === 'asc' ? -1 : 1;
            if (valueA > valueB) return this.sortDirection === 'asc' ? 1 : -1;
            return 0;
        });

        this.updateSortIcons();
        this.renderTable();
    }

    updateSortIcons() {
        // Reset tous les icônes
        document.querySelectorAll('th[data-sort]').forEach(th => {
            th.classList.remove('sorted', 'sorted-asc', 'sorted-desc');
        });

        // Mettre à jour l'icône de la colonne triée
        if (this.sortColumn) {
            const th = document.querySelector(`th[data-sort="${this.sortColumn}"]`);
            if (th) {
                th.classList.add('sorted', `sorted-${this.sortDirection}`);
            }
        }
    }

    renderTable() {
        const tbody = document.getElementById('ships-tbody');
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageShips = this.filteredShips.slice(startIndex, endIndex);

        if (pageShips.length === 0) {
            tbody.innerHTML = `
                <tr class="empty-row">
                    <td colspan="10">
                        <div class="empty-state">
                            <i class="fas fa-ship"></i>
                            <h3>Aucun bateau trouvé</h3>
                            <p>Aucun bateau ne correspond à vos critères de recherche.</p>
                        </div>
                    </td>
                </tr>
            `;
            this.updatePagination();
            return;
        }

        tbody.innerHTML = pageShips.map(ship => `
            <tr data-mmsi="${ship.MMSI}" ${this.selectedShip && this.selectedShip.MMSI === ship.MMSI ? 'class="selected"' : ''}>
                <td class="select-col">
                    <input type="radio" name="ship-select" value="${ship.MMSI}" 
                           ${this.selectedShip && this.selectedShip.MMSI === ship.MMSI ? 'checked' : ''}>
                </td>
                <td><strong>${ship.MMSI}</strong></td>
                <td>${ship.horodatage}</td>
                <td>${parseFloat(ship.latitude).toFixed(4)}°</td>
                <td>${parseFloat(ship.longitude).toFixed(4)}°</td>
                <td>${ship.vitesse}</td>
                <td>${ship.cap}</td>
                <td>${ship.nom || '<em>Non défini</em>'}</td>
                <td><span class="status-badge ${this.getStatusClass(ship.etat)}">${ship.etat}</span></td>
                <td>${ship.longueur ? ship.longueur + 'm' : '-'}</td>
            </tr>
        `).join('');

        // Attacher les événements aux nouveaux éléments
        this.attachRowEvents();
        this.updatePagination();
        this.updateSelectionInfo();
    }

    attachRowEvents() {
        // Sélection par clic sur la ligne
        document.querySelectorAll('#ships-tbody tr[data-mmsi]').forEach(row => {
            row.addEventListener('click', (e) => {
                if (e.target.type !== 'radio') {
                    const radio = row.querySelector('input[type="radio"]');
                    if (radio) {
                        radio.checked = true;
                        this.selectShip(radio.value);
                    }
                }
            });
        });

        // Sélection par radio button
        document.querySelectorAll('input[name="ship-select"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.selectShip(e.target.value);
                }
            });
        });
    }

    selectShip(mmsi) {
        const ship = this.allShips.find(s => s.MMSI.toString() === mmsi.toString());
        if (ship) {
            this.selectedShip = ship;
            this.updateSelection();
            this.renderTable(); // Re-render pour mettre à jour les classes CSS
        }
    }

    updateSelection() {
        const detailsSection = document.getElementById('ship-details');
        const selectionStatus = document.getElementById('selection-status');
        const predictButtons = [
            document.getElementById('predict-type-btn'),
            document.getElementById('predict-trajectory-btn')
        ];

        if (this.selectedShip) {
            // Mettre à jour les détails
            document.getElementById('detail-mmsi').textContent = this.selectedShip.MMSI;
            document.getElementById('detail-name').textContent = this.selectedShip.nom || 'Non défini';
            document.getElementById('detail-position').textContent = this.selectedShip.position;
            document.getElementById('detail-speed').textContent = this.selectedShip.vitesse;
            document.getElementById('detail-course').textContent = this.selectedShip.cap;
            document.getElementById('detail-status').textContent = this.selectedShip.etat;

            // Afficher la section détails
            detailsSection.style.display = 'block';
            detailsSection.classList.add('fade-in');

            // Mettre à jour le statut de sélection
            selectionStatus.innerHTML = `
                <i class="fas fa-check-circle"></i>
                <span>Bateau ${this.selectedShip.MMSI} sélectionné</span>
            `;
            selectionStatus.classList.add('selected');

            // Activer les boutons de prédiction
            predictButtons.forEach(btn => btn.disabled = false);

        } else {
            detailsSection.style.display = 'none';
            selectionStatus.innerHTML = `
                <i class="fas fa-info-circle"></i>
                <span>Sélectionnez un bateau pour activer les prédictions</span>
            `;
            selectionStatus.classList.remove('selected');
            predictButtons.forEach(btn => btn.disabled = true);
        }
    }

    clearSelection() {
        this.selectedShip = null;
        
        // Décocher tous les radio buttons
        document.querySelectorAll('input[name="ship-select"]').forEach(radio => {
            radio.checked = false;
        });

        this.updateSelection();
        this.renderTable();
    }

    updatePagination() {
        const totalItems = this.filteredShips.length;
        const totalPages = Math.ceil(totalItems / this.itemsPerPage);
        const startItem = totalItems === 0 ? 0 : (this.currentPage - 1) * this.itemsPerPage + 1;
        const endItem = Math.min(this.currentPage * this.itemsPerPage, totalItems);

        // Mettre à jour le texte d'information
        document.getElementById('pagination-text').textContent = 
            `Affichage de ${startItem} à ${endItem} sur ${totalItems} entrées`;

        // Mettre à jour les boutons précédent/suivant
        document.getElementById('prev-page').disabled = this.currentPage <= 1;
        document.getElementById('next-page').disabled = this.currentPage >= totalPages;

        // Générer les numéros de pages
        this.generatePageNumbers(totalPages);
    }

    generatePageNumbers(totalPages) {
        const pageNumbersContainer = document.getElementById('page-numbers');
        pageNumbersContainer.innerHTML = '';

        if (totalPages <= 1) return;

        const maxVisiblePages = 5;
        let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.className = `page-number ${i === this.currentPage ? 'active' : ''}`;
            pageBtn.textContent = i;
            pageBtn.addEventListener('click', () => {
                this.currentPage = i;
                this.renderTable();
            });
            pageNumbersContainer.appendChild(pageBtn);
        }
    }

    // In predict_type.js, inside the startPrediction function:

async startPrediction(type) {
    if (!this.selectedShip) {
        alert('Veuillez sélectionner un bateau avant de lancer une prédiction.');
        return;
    }

    try {
        this.showPredictionModal(true, type);

        // Prepare data as a JavaScript object
        const postData = {
            mmsi: this.selectedShip.MMSI,
            prediction_type: type
        };

        const response = await fetch('php/predict_ship.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json' // Set Content-Type to application/json
            },
            body: JSON.stringify(postData) // Send data as a JSON string
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.error) {
            throw new Error(result.error);
        }

        // Rediriger vers la page de résultats avec les données
        this.redirectToResults(result, type);

    } catch (error) {
        console.error('Erreur lors de la prédiction:', error);
        this.showPredictionModal(false);
        alert('Erreur lors de la prédiction: ' + error.message);
    }
}

    showPredictionModal(show, type = '') {
        const modal = document.getElementById('loading-modal');
        const loadingText = document.getElementById('loading-text');
        
        if (show) {
            loadingText.textContent = type === 'type' ? 
                'Analyse du type de bateau en cours...' : 
                'Calcul de la trajectoire en cours...';
            modal.style.display = 'flex';
        } else {
            modal.style.display = 'none';
        }
    }

    redirectToResults(result, type) {
        // Stocker les résultats dans sessionStorage pour la page de résultats
        const resultData = {
            ship: this.selectedShip,
            prediction: result,
            type: type,
            timestamp: new Date().toISOString()
        };
        
        sessionStorage.setItem('predictionResults', JSON.stringify(resultData));
        
        // Rediriger vers la page de résultats
        window.location.href = 'results.html';
    }

    // Méthodes utilitaires pour le formatage
    formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleString('fr-FR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    formatSpeed(speed) {
        const speedVal = parseFloat(speed);
        return isNaN(speedVal) ? '-' : `${speedVal.toFixed(1)} kn`;
    }

    formatCourse(course) {
        const courseVal = parseFloat(course);
        return isNaN(courseVal) ? '-' : `${courseVal.toFixed(0)}°`;
    }

    formatStatus(status) {
        return status || 'Inconnu';
    }

    getStatusClass(status) {
        const statusLower = status.toLowerCase();
        if (statusLower.includes('en route') || statusLower.includes('underway')) return 'status-underway';
        if (statusLower.includes('ancré') || statusLower.includes('anchored')) return 'status-anchored';
        if (statusLower.includes('amarré') || statusLower.includes('moored')) return 'status-moored';
        if (statusLower.includes('pêche') || statusLower.includes('fishing')) return 'status-fishing';
        return 'status-unknown';
    }

    updateSelectionInfo() {
        // Cette méthode peut être utilisée pour des mises à jour supplémentaires
        // de l'interface utilisateur si nécessaire
    }
}

// Initialiser le gestionnaire de prédiction au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    new PredictionManager();
});