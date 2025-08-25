#!/usr/bin/env python3
"""
Script de prédiction de type de navire
"""

import json
import sys
from datetime import datetime

def load_input_data(input_file):
    """Charge les données depuis le fichier JSON d'entrée"""
    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return data
    except Exception as e:
        return {'error': f'Erreur lors du chargement des données: {str(e)}'}

def predict_ship_type(ship_data):
    """Prédiction simple du type de navire basée sur les caractéristiques"""
    try:
        ship_info = ship_data['ship_info']
        positions = ship_data['positions']
        
        # Caractéristiques du navire
        longueur = float(ship_info.get('longueur', 0))
        largeur = float(ship_info.get('largeur', 0))
        tirant_eau = float(ship_info.get('tirant_eau', 0))
        type_navire = ship_info.get('type_navire', '')
        
        # Analyse des mouvements
        vitesses = []
        for pos in positions[:20]:  # Analyser les 20 dernières positions
            sog = float(pos.get('sog', 0))
            if sog > 0:
                vitesses.append(sog)
        
        vitesse_moyenne = sum(vitesses) / len(vitesses) if vitesses else 0
        vitesse_max = max(vitesses) if vitesses else 0
        
        # Logique de prédiction simple
        predictions = []
        
        # Cargo
        if longueur > 100 and vitesse_moyenne < 15:
            predictions.append({
                'type': 'Cargo',
                'confidence': 0.8,
                'reasons': ['Grande longueur', 'Vitesse modérée']
            })
        
        # Tanker
        if largeur > 20 and vitesse_moyenne < 12:
            predictions.append({
                'type': 'Tanker',
                'confidence': 0.75,
                'reasons': ['Grande largeur', 'Vitesse lente']
            })
        
        # Ferry/Passenger
        if vitesse_moyenne > 18 and vitesse_max > 25:
            predictions.append({
                'type': 'Ferry/Passenger',
                'confidence': 0.7,
                'reasons': ['Vitesse élevée', 'Variations de vitesse']
            })
        
        # Fishing vessel
        if longueur < 50 and len(set(pos.get('libelle_etat', '') for pos in positions)) > 3:
            predictions.append({
                'type': 'Fishing Vessel',
                'confidence': 0.65,
                'reasons': ['Petite taille', 'Changements d\'état fréquents']
            })
        
        # Par défaut
        if not predictions:
            predictions.append({
                'type': 'Unknown/Other',
                'confidence': 0.3,
                'reasons': ['Caractéristiques non concluantes']
            })
        
        # Trier par confiance
        predictions.sort(key=lambda x: x['confidence'], reverse=True)
        
        return {
            'ship_characteristics': {
                'longueur': longueur,
                'largeur': largeur,
                'tirant_eau': tirant_eau,
                'vitesse_moyenne': vitesse_moyenne,
                'vitesse_max': vitesse_max,
                'positions_analyzed': len(positions)
            },
            'predictions': predictions[:3],  # Top 3 prédictions
            'best_prediction': predictions[0]
        }
        
    except Exception as e:
        return {'error': f'Erreur lors de la prédiction: {str(e)}'}

def main():
    """Fonction principale"""
    if len(sys.argv) != 2:
        print('Usage: python3 predict_type.py <input_file>', file=sys.stderr)
        sys.exit(1)
    
    input_file = sys.argv[1]
    
    # Charger les données d'entrée
    ship_data = load_input_data(input_file)
    if 'error' in ship_data:
        print(json.dumps(ship_data, ensure_ascii=False))
        sys.exit(1)
    
    # Faire la prédiction
    result = predict_ship_type(ship_data)
    if 'error' in result:
        print(json.dumps(result, ensure_ascii=False))
        sys.exit(1)
    
    # Préparer les résultats finaux
    final_results = {
        'success': True,
        'timestamp': datetime.now().isoformat(),
        'ship_mmsi': ship_data['ship_info']['MMSI'],
        'prediction_type': 'type',
        'result': result
    }
    
    # Sortir le JSON sur stdout
    print(json.dumps(final_results, ensure_ascii=False))
    sys.exit(0)

if __name__ == '__main__':
    main()