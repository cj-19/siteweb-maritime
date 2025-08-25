// ship-classifier-simple.js - Version ultra-simplifiée

class SimpleShipClassifier {
    constructor() {
        // Règles simples basées sur la longueur principalement
        this.rules = [
            { type: 'Fishing', minLength: 0, maxLength: 80, defaultSpeed: 8 },
            { type: 'Recreational', minLength: 0, maxLength: 50, defaultSpeed: 15 },
            { type: 'Ferry', minLength: 40, maxLength: 250, defaultSpeed: 20 },
            { type: 'Cargo', minLength: 80, maxLength: 400, defaultSpeed: 15 },
            { type: 'Tanker', minLength: 100, maxLength: 400, defaultSpeed: 14 },
            { type: 'Military', minLength: 30, maxLength: 200, defaultSpeed: 25 }
        ];
    }

    classifyShip(shipData, positionData = null) {
        // Extraction des données de base
        const length = this.getLength(shipData);
        const speed = this.getSpeed(shipData, positionData);
        const name = this.getName(shipData);
        
        console.log(`🚢 Classification: longueur=${length}m, vitesse=${speed}kn, nom="${name}"`);
        
        // Prédiction basée sur le nom d'abord
        let prediction = this.predictByName(name);
        if (prediction) {
            return this.buildResult(prediction, 0.9, `Nom du navire "${name}" indique un ${prediction}`);
        }
        
        // Prédiction basée sur la longueur et vitesse
        prediction = this.predictByDimensions(length, speed);
        
        const confidence = this.calculateConfidence(length, speed);
        const reason = this.generateReason(prediction, length, speed);
        
        return this.buildResult(prediction, confidence, reason);
    }

    getLength(shipData) {
        const length = shipData.longueur || shipData.length || shipData.Length || 0;
        return parseFloat(length) || 0;
    }

    getSpeed(shipData, positionData) {
        // Essaie de récupérer la vitesse des données de position
        if (positionData && Array.isArray(positionData) && positionData.length > 0) {
            const speeds = positionData.map(p => parseFloat(p.sog)).filter(s => !isNaN(s) && s > 0);
            if (speeds.length > 0) {
                return speeds.reduce((a, b) => a + b, 0) / speeds.length;
            }
        } else if (positionData && positionData.sog) {
            const speed = parseFloat(positionData.sog);
            if (!isNaN(speed)) return speed;
        }
        
        // Vitesse par défaut si pas de données
        return 0;
    }

    getName(shipData) {
        return (shipData.nom || shipData.name || shipData.Name || '').toLowerCase();
    }

    predictByName(name) {
        if (!name) return null;
        
        // Mots-clés évidents dans le nom
        if (name.includes('fish') || name.includes('pêche') || name.includes('chalut')) return 'Fishing';
        if (name.includes('cargo') || name.includes('container') || name.includes('bulk')) return 'Cargo';
        if (name.includes('tanker') || name.includes('petrol') || name.includes('oil')) return 'Tanker';
        if (name.includes('ferry') || name.includes('passenger')) return 'Ferry';
        if (name.includes('yacht') || name.includes('sail') || name.includes('pleasure')) return 'Recreational';
        if (name.includes('patrol') || name.includes('naval') || name.includes('military')) return 'Military';
        
        return null;
    }

    predictByDimensions(length, speed) {
        // Si pas de longueur, devine selon la vitesse
        if (!length || length <= 0) {
            if (speed > 20) return 'Ferry';
            if (speed > 15) return 'Recreational';
            if (speed < 8) return 'Fishing';
            return 'Cargo';
        }
        
        // Règles simples basées sur la longueur
        if (length < 30) {
            return speed > 15 ? 'Recreational' : 'Fishing';
        } else if (length < 80) {
            return speed > 18 ? 'Ferry' : 'Fishing';
        } else if (length < 150) {
            if (speed > 20) return 'Ferry';
            if (speed < 12) return 'Tanker';
            return 'Cargo';
        } else {
            // Grand navire
            return speed < 16 ? 'Tanker' : 'Cargo';
        }
    }

    calculateConfidence(length, speed) {
        // Confiance basée sur la disponibilité des données
        let confidence = 0.6; // Base
        
        if (length > 0) confidence += 0.2;
        if (speed > 0) confidence += 0.1;
        
        // Bonus pour des dimensions "normales"
        if (length > 10 && length < 500) confidence += 0.1;
        
        return Math.min(confidence, 0.95); // Max 95%
    }

    generateReason(prediction, length, speed) {
        const reasons = [];
        
        if (length > 0) {
            reasons.push(`Longueur ${length}m`);
        }
        
        if (speed > 0) {
            reasons.push(`Vitesse ${speed.toFixed(1)}kn`);
        }
        
        // Logique spécifique par type
        switch (prediction) {
            case 'Fishing':
                reasons.push('Dimensions typiques d\'un navire de pêche');
                break;
            case 'Cargo':
                reasons.push('Grande taille compatible avec transport de marchandises');
                break;
            case 'Tanker':
                reasons.push('Grand navire avec vitesse modérée (transport liquides)');
                break;
            case 'Ferry':
                reasons.push('Vitesse élevée pour transport passagers');
                break;
            case 'Recreational':
                reasons.push('Petite taille et/ou vitesse élevée (plaisance)');
                break;
            case 'Military':
                reasons.push('Dimensions et vitesse compatibles usage militaire');
                break;
        }
        
        return reasons.join(', ');
    }

    buildResult(prediction, confidence, reason) {
        return {
            success: true,
            best_prediction: {
                type: prediction,
                confidence: confidence,
                reasons: [reason]
            },
            classification_method: 'Règles simples basées sur longueur et vitesse'
        };
    }
}

// Test simple
function testClassifier() {
    const classifier = new SimpleShipClassifier();
    
    // Tests
    const tests = [
        { longueur: 25, name: 'Fishing Boat' },
        { longueur: 150, name: 'Container Ship' },
        { longueur: 200, name: 'Oil Tanker' },
        { longueur: 80, name: 'Ferry' },
        { longueur: 15, name: 'Yacht' },
        { longueur: 0, name: 'Unknown Vessel' }
    ];
    
    console.log('🧪 Tests du classificateur:');
    tests.forEach((test, i) => {
        const result = classifier.classifyShip(test);
        console.log(`${i+1}. ${test.name} (${test.longueur}m) → ${result.best_prediction.type} (${Math.round(result.best_prediction.confidence*100)}%)`);
    });
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SimpleShipClassifier;
} else if (typeof window !== 'undefined') {
    window.SimpleShipClassifier = SimpleShipClassifier;
    // Lance les tests automatiquement
    testClassifier();
}