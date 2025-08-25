import json
import sys
import math
from datetime import datetime, timedelta
import numpy as np

def load_input_data(input_file):
    """Charge les données depuis le fichier JSON d'entrée"""
    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return data
    except Exception as e:
        return {'error': f'Erreur lors du chargement des données: {str(e)}'}

def extract_trajectory_features(ship_data):
    """Extrait les caractéristiques nécessaires pour la prédiction de trajectoire"""
    try:
        ship_info = ship_data['ship_info']
        positions = ship_data['positions']
        
        if len(positions) < 2:
            return {'error': 'Pas assez de positions pour prédire une trajectoire (minimum 2)'}
        
        # Trier les positions par horodatage (plus récent en premier)
        positions.sort(key=lambda x: x['horodatage'], reverse=True)
        
        # Extraire les caractéristiques de mouvement
        trajectory_data = []
        for pos in positions[:10]:  # Prendre les 10 dernières positions
            trajectory_data.append({
                'timestamp': pos['horodatage'],
                'latitude': float(pos['latitude']),
                'longitude': float(pos['longitude']),
                'sog': float(pos.get('sog', 0)),
                'cog': float(pos.get('cog', 0)),
                'heading': float(pos.get('cap_reel', 0))
            })
        
        return {
            'ship_info': ship_info,
            'trajectory_points': trajectory_data
        }
        
    except Exception as e:
        return {'error': f'Erreur lors de l\'extraction des caractéristiques: {str(e)}'}

def calculate_distance(lat1, lon1, lat2, lon2):
    """Calcule la distance en mètres entre deux points GPS"""
    R = 6371000  # Rayon de la Terre en mètres
    
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)
    
    a = (math.sin(delta_lat/2) * math.sin(delta_lat/2) +
         math.cos(lat1_rad) * math.cos(lat2_rad) *
         math.sin(delta_lon/2) * math.sin(delta_lon/2))
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    
    return R * c

def calculate_bearing(lat1, lon1, lat2, lon2):
    """Calcule le cap entre deux points GPS"""
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lon = math.radians(lon2 - lon1)
    
    y = math.sin(delta_lon) * math.cos(lat2_rad)
    x = (math.cos(lat1_rad) * math.sin(lat2_rad) -
         math.sin(lat1_rad) * math.cos(lat2_rad) * math.cos(delta_lon))
    
    bearing = math.atan2(y, x)
    return (math.degrees(bearing) + 360) % 360

def predict_trajectory_linear(features):
    """Prédiction linéaire simple basée sur la tendance récente"""
    points = features['trajectory_points']
    if len(points) < 2:
        return {'error': 'Pas assez de points pour la prédiction linéaire'}
    
    # Utiliser les deux derniers points pour calculer la tendance
    latest = points[0]
    previous = points[1]
    
    # Calculer la vitesse et direction moyennes
    time_diff = (datetime.fromisoformat(latest['timestamp'].replace('Z', '+00:00')) - 
                datetime.fromisoformat(previous['timestamp'].replace('Z', '+00:00'))).total_seconds()
    
    if time_diff <= 0:
        time_diff = 3600  # Supposer 1 heure si pas de différence
    
    distance = calculate_distance(
        previous['latitude'], previous['longitude'],
        latest['latitude'], latest['longitude']
    )
    
    speed_ms = distance / time_diff if time_diff > 0 else latest['sog'] * 0.514444  # knots to m/s
    bearing = calculate_bearing(
        previous['latitude'], previous['longitude'],
        latest['latitude'], latest['longitude']
    )
    
    # Prédire les positions futures (1h, 3h, 6h)
    predictions = []
    for hours in [1, 3, 6]:
        time_ahead = hours * 3600  # en secondes
        distance_ahead = speed_ms * time_ahead
        
        # Calculer la nouvelle position
        lat_rad = math.radians(latest['latitude'])
        lon_rad = math.radians(latest['longitude'])
        bearing_rad = math.radians(bearing)
        
        R = 6371000  # Rayon de la Terre
        new_lat_rad = math.asin(
            math.sin(lat_rad) * math.cos(distance_ahead / R) +
            math.cos(lat_rad) * math.sin(distance_ahead / R) * math.cos(bearing_rad)
        )
        
        new_lon_rad = lon_rad + math.atan2(
            math.sin(bearing_rad) * math.sin(distance_ahead / R) * math.cos(lat_rad),
            math.cos(distance_ahead / R) - math.sin(lat_rad) * math.sin(new_lat_rad)
        )
        
        predictions.append({
            'time_hours': hours,
            'latitude': math.degrees(new_lat_rad),
            'longitude': math.degrees(new_lon_rad),
            'confidence': max(0.9 - hours * 0.1, 0.3)  # Confiance décroissante
        })
    
    return {
        'method': 'linear',
        'current_speed_ms': speed_ms,
        'current_bearing': bearing,
        'predictions': predictions
    }

def predict_trajectory_polynomial(features):
    """Prédiction polynomiale basée sur plusieurs points"""
    points = features['trajectory_points']
    if len(points) < 3:
        return predict_trajectory_linear(features)
    
    # Utiliser les 5 derniers points maximum
    recent_points = points[:min(5, len(points))]
    
    # Extraire les coordonnées et temps
    times = []
    lats = []
    lons = []
    
    base_time = datetime.fromisoformat(recent_points[0]['timestamp'].replace('Z', '+00:00'))
    
    for point in recent_points:
        point_time = datetime.fromisoformat(point['timestamp'].replace('Z', '+00:00'))
        time_diff = (point_time - base_time).total_seconds() / 3600  # en heures
        times.append(time_diff)
        lats.append(point['latitude'])
        lons.append(point['longitude'])
    
    # Ajuster des polynômes de degré 2 (si possible)
    try:
        if len(times) >= 3:
            lat_coeffs = np.polyfit(times, lats, min(2, len(times)-1))
            lon_coeffs = np.polyfit(times, lons, min(2, len(times)-1))
        else:
            lat_coeffs = np.polyfit(times, lats, 1)
            lon_coeffs = np.polyfit(times, lons, 1)
    except:
        return predict_trajectory_linear(features)
    
    # Prédire les positions futures
    predictions = []
    for hours in [1, 3, 6]:
        pred_lat = np.polyval(lat_coeffs, hours)
        pred_lon = np.polyval(lon_coeffs, hours)
        
        predictions.append({
            'time_hours': hours,
            'latitude': float(pred_lat),
            'longitude': float(pred_lon),
            'confidence': max(0.85 - hours * 0.08, 0.4)
        })
    
    return {
        'method': 'polynomial',
        'lat_coefficients': lat_coeffs.tolist(),
        'lon_coefficients': lon_coeffs.tolist(),
        'predictions': predictions
    }

def predict_trajectory_kalman(features):
    """Prédiction avec un filtre de Kalman simplifié"""
    points = features['trajectory_points']
    if len(points) < 3:
        return predict_trajectory_linear(features)
    
    # Simplification: utiliser une moyenne pondérée des vitesses récentes
    recent_velocities = []
    
    for i in range(min(3, len(points)-1)):
        current = points[i]
        next_point = points[i+1]
        
        time_diff = (datetime.fromisoformat(current['timestamp'].replace('Z', '+00:00')) - 
                    datetime.fromisoformat(next_point['timestamp'].replace('Z', '+00:00'))).total_seconds()
        
        if time_diff > 0:
            distance = calculate_distance(
                next_point['latitude'], next_point['longitude'],
                current['latitude'], current['longitude']
            )
            bearing = calculate_bearing(
                next_point['latitude'], next_point['longitude'],
                current['latitude'], current['longitude']
            )
            
            velocity = distance / time_diff
            recent_velocities.append({
                'velocity': velocity,
                'bearing': bearing,
                'weight': 1.0 / (i + 1)  # Poids décroissant
            })
    
    if not recent_velocities:
        return predict_trajectory_linear(features)
    
    # Calculer vitesse et direction moyennes pondérées
    total_weight = sum(v['weight'] for v in recent_velocities)
    avg_velocity = sum(v['velocity'] * v['weight'] for v in recent_velocities) / total_weight
    
    # Pour le bearing, utiliser une moyenne circulaire
    sin_sum = sum(math.sin(math.radians(v['bearing'])) * v['weight'] for v in recent_velocities)
    cos_sum = sum(math.cos(math.radians(v['bearing'])) * v['weight'] for v in recent_velocities)
    avg_bearing = math.degrees(math.atan2(sin_sum, cos_sum))
    
    # Prédictions
    latest = points[0]
    predictions = []
    
    for hours in [1, 3, 6]:
        time_ahead = hours * 3600
        distance_ahead = avg_velocity * time_ahead
        
        # Calculer nouvelle position
        lat_rad = math.radians(latest['latitude'])
        lon_rad = math.radians(latest['longitude'])
        bearing_rad = math.radians(avg_bearing)
        
        R = 6371000
        new_lat_rad = math.asin(
            math.sin(lat_rad) * math.cos(distance_ahead / R) +
            math.cos(lat_rad) * math.sin(distance_ahead / R) * math.cos(bearing_rad)
        )
        
        new_lon_rad = lon_rad + math.atan2(
            math.sin(bearing_rad) * math.sin(distance_ahead / R) * math.cos(lat_rad),
            math.cos(distance_ahead / R) - math.sin(lat_rad) * math.sin(new_lat_rad)
        )
        
        predictions.append({
            'time_hours': hours,
            'latitude': math.degrees(new_lat_rad),
            'longitude': math.degrees(new_lon_rad),
            'confidence': max(0.88 - hours * 0.09, 0.35)
        })
    
    return {
        'method': 'kalman_simplified',
        'avg_velocity_ms': avg_velocity,
        'avg_bearing': avg_bearing,
        'predictions': predictions
    }

def predict_trajectory_ensemble(features):
    """Combinaison des différentes méthodes de prédiction"""
    methods = [
        predict_trajectory_linear(features),
        predict_trajectory_polynomial(features),
        predict_trajectory_kalman(features)
    ]
    
    # Filtrer les méthodes qui ont échoué
    valid_methods = [m for m in methods if 'error' not in m]
    
    if not valid_methods:
        return {'error': 'Toutes les méthodes de prédiction ont échoué'}
    
    # Calculer la moyenne des prédictions
    ensemble_predictions = []
    
    for time_idx in range(3):  # 1h, 3h, 6h
        lat_sum = 0
        lon_sum = 0
        conf_sum = 0
        count = 0
        
        for method in valid_methods:
            if time_idx < len(method['predictions']):
                pred = method['predictions'][time_idx]
                lat_sum += pred['latitude']
                lon_sum += pred['longitude']
                conf_sum += pred['confidence']
                count += 1
        
        if count > 0:
            ensemble_predictions.append({
                'time_hours': [1, 3, 6][time_idx],
                'latitude': lat_sum / count,
                'longitude': lon_sum / count,
                'confidence': conf_sum / count
            })
    
    return {
        'method': 'ensemble',
        'individual_methods': valid_methods,
        'predictions': ensemble_predictions
    }

def run_trajectory_predictions(features):
    """Exécute toutes les prédictions de trajectoire"""
    try:
        results = {
            'linear': predict_trajectory_linear(features),
            'polynomial': predict_trajectory_polynomial(features),
            'kalman': predict_trajectory_kalman(features),
            'ensemble': predict_trajectory_ensemble(features)
        }
        
        return results
        
    except Exception as e:
        return {'error': f'Erreur lors des prédictions de trajectoire: {str(e)}'}

def main():
    """Fonction principale"""
    if len(sys.argv) != 2:
        print('Usage: python3 predict_trajectory.py <input_file>', file=sys.stderr)
        sys.exit(1)
    
    input_file = sys.argv[1]
    
    # Charger les données d'entrée
    ship_data = load_input_data(input_file)
    if 'error' in ship_data:
        print(json.dumps(ship_data, ensure_ascii=False))
        sys.exit(1)
    
    # Extraire les caractéristiques pour la trajectoire
    features = extract_trajectory_features(ship_data)
    if 'error' in features:
        print(json.dumps(features, ensure_ascii=False))
        sys.exit(1)
    
    # Exécuter les prédictions
    results = run_trajectory_predictions(features)
    if 'error' in results:
        print(json.dumps(results, ensure_ascii=False))
        sys.exit(1)
    
    # Préparer les résultats finaux
    final_results = {
        'success': True,
        'timestamp': datetime.now().isoformat(),
        'ship_mmsi': ship_data['ship_info']['MMSI'],
        'trajectory_points_used': len(features['trajectory_points']),
        'predictions': results
    }
    
    # Sortir le JSON sur stdout pour PHP
    print(json.dumps(final_results, ensure_ascii=False))
    sys.exit(0)

if __name__ == '__main__':
    main()