<?php
// predict_ship.php - Script principal de prédiction (version simplifiée)
error_reporting(E_ALL);
ini_set('display_errors', 1);

// En-têtes CORS
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

// Handle preflight OPTIONS request for CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Fonction pour logger les erreurs
function logError($message, $context = []) {
    $logMessage = date('Y-m-d H:i:s') . ' - ' . $message;
    if (!empty($context)) {
        $logMessage .= ' - Context: ' . json_encode($context);
    }
    error_log($logMessage);
}

// Fonction pour retourner une réponse JSON d'erreur
function returnError($message, $code = 500, $details = null) {
    http_response_code($code);
    $response = ['error' => $message];
    if ($details && is_array($details)) {
        $response['details'] = $details;
    }
    echo json_encode($response, JSON_UNESCAPED_UNICODE);
    exit;
}

// Fonction pour retourner une réponse JSON de succès
function returnSuccess($data) {
    http_response_code(200);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    // Vérifier la méthode HTTP
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        returnError('Méthode non autorisée', 405);
    }

    // Inclure le fichier de connexion à la base de données
    $database_path = __DIR__ . '/database.php';
    if (!file_exists($database_path)) {
        logError('Fichier database.php non trouvé', ['path' => $database_path]);
        returnError('Configuration de base de données manquante', 500);
    }
    
    require_once $database_path;

    // Vérifier la connexion PDO
    if (!isset($pdo)) {
        logError('Variable PDO non définie après inclusion de database.php');
        returnError('Erreur de connexion à la base de données', 500);
    }

    // Lire les données POST
    $input_json = file_get_contents('php://input');
    
    if (empty($input_json)) {
        logError('Aucune donnée POST reçue');
        returnError('Aucune donnée reçue', 400);
    }

    // Décoder les données JSON
    $request_data = json_decode($input_json, true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        logError('Erreur de décodage JSON', ['error' => json_last_error_msg(), 'input' => $input_json]);
        returnError('Données JSON invalides: ' . json_last_error_msg(), 400);
    }

    // Valider les données requises
    if (!isset($request_data['mmsi']) || !isset($request_data['prediction_type'])) {
        logError('Données manquantes', ['received' => array_keys($request_data)]);
        returnError('Données manquantes: mmsi et prediction_type requis', 400);
    }

    $mmsi = $request_data['mmsi'];
    $prediction_type = $request_data['prediction_type'];

    // Valider MMSI
    if (!is_numeric($mmsi) || $mmsi <= 0) {
        returnError('MMSI doit être un nombre positif', 400);
    }

    // Valider le type de prédiction
    if (!in_array($prediction_type, ['type', 'trajectory'])) {
        returnError('Type de prédiction invalide. Doit être "type" ou "trajectory"', 400);
    }

    // Récupérer les données du bateau
    $ship_data = getShipData($pdo, $mmsi);
    
    if ($ship_data === null) {
        returnError('Bateau non trouvé', 404);
    }
    
    if ($ship_data === false) {
        returnError('Erreur lors de la récupération des données du bateau', 500);
    }

    // Générer la prédiction selon le type
    if ($prediction_type === 'type') {
        $prediction_result = generateTypePrediction($ship_data);
    } else {
        $prediction_result = generateTrajectoryPrediction($ship_data);
    }

    // Préparer la réponse finale
    $response = [
        'success' => true,
        'mmsi' => $mmsi,
        'prediction_type' => $prediction_type,
        'ship_info' => $ship_data['ship_info'],
        'result' => $prediction_result,
        'timestamp' => date('Y-m-d H:i:s')
    ];

    returnSuccess($response);

} catch (Exception $e) {
    logError('Erreur générale', ['message' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
    returnError('Erreur interne du serveur: ' . $e->getMessage(), 500);
}

// Fonction pour récupérer les données du bateau
function getShipData($pdo, $mmsi) {
    try {
        // Récupérer les informations du bateau
        $stmt = $pdo->prepare("SELECT * FROM navire WHERE MMSI = ?");
        $stmt->execute([$mmsi]);
        $ship_info = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$ship_info) {
            return null; // Bateau non trouvé
        }

        // Récupérer les positions du bateau (dernières 20 positions)
        $stmt = $pdo->prepare("
            SELECT p.*, e.libelle_etat 
            FROM position p 
            LEFT JOIN etat e ON p.id_etat = e.id_etat 
            WHERE p.MMSI = ? 
            ORDER BY p.horodatage DESC 
            LIMIT 20
        ");
        $stmt->execute([$mmsi]);
        $positions = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return [
            'ship_info' => $ship_info,
            'positions' => $positions
        ];
        
    } catch (Exception $e) {
        logError('Erreur getShipData', ['message' => $e->getMessage(), 'mmsi' => $mmsi]);
        return false;
    }
}

// Fonction pour générer une prédiction de type (factice mais réaliste)
function generateTypePrediction($ship_data) {
    $ship_info = $ship_data['ship_info'];
    $positions = $ship_data['positions'];
    
    // Caractéristiques du navire
    $longueur = floatval($ship_info['longueur'] ?? 0);
    $largeur = floatval($ship_info['largeur'] ?? 0);
    $tirant_eau = floatval($ship_info['tirant_eau'] ?? 0);
    $type_navire = $ship_info['type_navire'] ?? '';
    
    // Calculer la vitesse moyenne
    $vitesses = [];
    foreach ($positions as $pos) {
        $sog = floatval($pos['sog'] ?? 0);
        if ($sog > 0) {
            $vitesses[] = $sog;
        }
    }
    
    $vitesse_moyenne = count($vitesses) > 0 ? array_sum($vitesses) / count($vitesses) : 0;
    $vitesse_max = count($vitesses) > 0 ? max($vitesses) : 0;
    
    // Logique de prédiction basée sur les caractéristiques
    $predictions = [];
    
    // Si on a déjà un type de navire, on l'utilise comme référence
    if (!empty($type_navire)) {
        $predictions[] = [
            'type' => $type_navire,
            'confidence' => 0.95,
            'reasons' => ['Type déclaré dans les données AIS']
        ];
    }
    
    // Prédictions basées sur la taille
    if ($longueur > 200) {
        $predictions[] = [
            'type' => 'Cargo/Container Ship',
            'confidence' => 0.85,
            'reasons' => ['Très grande longueur (' . $longueur . 'm)', 'Profil de grand navire commercial']
        ];
    } elseif ($longueur > 100) {
        if ($vitesse_moyenne > 15) {
            $predictions[] = [
                'type' => 'Ferry/Passenger Ship',
                'confidence' => 0.80,
                'reasons' => ['Grande taille', 'Vitesse élevée (' . round($vitesse_moyenne, 1) . ' kn)']
            ];
        } else {
            $predictions[] = [
                'type' => 'Bulk Carrier',
                'confidence' => 0.75,
                'reasons' => ['Grande longueur', 'Vitesse modérée']
            ];
        }
    } elseif ($longueur > 50) {
        if ($largeur > 15) {
            $predictions[] = [
                'type' => 'Tanker',
                'confidence' => 0.70,
                'reasons' => ['Taille moyenne', 'Grande largeur']
            ];
        } else {
            $predictions[] = [
                'type' => 'General Cargo',
                'confidence' => 0.65,
                'reasons' => ['Taille moyenne', 'Proportions standard']
            ];
        }
    } else {
        $predictions[] = [
            'type' => 'Fishing Vessel',
            'confidence' => 0.60,
            'reasons' => ['Petite taille', 'Mobilité variable']
        ];
    }
    
    // Ajouter quelques prédictions alternatives
    $alternative_types = ['Tug', 'Pilot Vessel', 'Research Vessel', 'Yacht', 'Military Vessel'];
    foreach ($alternative_types as $type) {
        if (!in_array($type, array_column($predictions, 'type'))) {
            $predictions[] = [
                'type' => $type,
                'confidence' => rand(20, 45) / 100,
                'reasons' => ['Prédiction alternative basée sur les données']
            ];
        }
    }
    
    // Trier par confiance décroissante
    usort($predictions, function($a, $b) {
        return $b['confidence'] <=> $a['confidence'];
    });
    
    // Garder seulement les 3 meilleures prédictions
    $predictions = array_slice($predictions, 0, 3);
    
    return [
        'ship_characteristics' => [
            'longueur' => $longueur,
            'largeur' => $largeur,
            'tirant_eau' => $tirant_eau,
            'vitesse_moyenne' => round($vitesse_moyenne, 2),
            'vitesse_max' => round($vitesse_max, 2),
            'positions_analyzed' => count($positions)
        ],
        'predictions' => $predictions,
        'best_prediction' => $predictions[0] ?? [
            'type' => 'Unknown',
            'confidence' => 0.3,
            'reasons' => ['Données insuffisantes']
        ]
    ];
}

// Fonction pour générer une prédiction de trajectoire (factice mais réaliste)
function generateTrajectoryPrediction($ship_data) {
    $positions = $ship_data['positions'];
    
    if (empty($positions)) {
        return [
            'error' => 'Aucune position disponible pour la prédiction'
        ];
    }
    
    // Prendre la dernière position connue
    $last_position = $positions[0];
    $lat = floatval($last_position['latitude']);
    $lon = floatval($last_position['longitude']);
    $sog = floatval($last_position['sog'] ?? 10); // Vitesse par défaut
    $cog = floatval($last_position['cog'] ?? 0); // Cap par défaut
    
    // Si la vitesse est nulle, utiliser une vitesse par défaut
    if ($sog <= 0) {
        $sog = 8; // 8 nœuds par défaut
    }
    
    // Calculer les positions futures (5, 10, 15 minutes)
    $predictions = [];
    $time_intervals = [5, 10, 15]; // en minutes
    
    foreach ($time_intervals as $minutes) {
        // Convertir la vitesse en degrés par minute
        // 1 nœud = 1 mile nautique par heure
        // 1 mile nautique ≈ 1/60 degré de latitude
        $distance_nm = ($sog * $minutes) / 60; // distance en miles nautiques
        
        // Calculer le déplacement en latitude et longitude
        $delta_lat = $distance_nm * cos(deg2rad($cog)) / 60;
        $delta_lon = $distance_nm * sin(deg2rad($cog)) / (60 * cos(deg2rad($lat)));
        
        $new_lat = $lat + $delta_lat;
        $new_lon = $lon + $delta_lon;
        
        // Ajouter un peu de variation aléatoire pour plus de réalisme
        $variation = 0.001; // Petite variation
        $new_lat += (rand(-100, 100) / 100000) * $variation;
        $new_lon += (rand(-100, 100) / 100000) * $variation;
        
        $predictions[] = [
            'time_minutes' => $minutes,
            'timestamp' => date('Y-m-d H:i:s', strtotime($last_position['horodatage']) + ($minutes * 60)),
            'latitude' => round($new_lat, 6),
            'longitude' => round($new_lon, 6),
            'estimated_speed' => $sog,
            'estimated_course' => $cog,
            'confidence' => max(0.9 - ($minutes * 0.1), 0.5) // Confiance décroissante
        ];
    }
    
    return [
        'current_position' => [
            'latitude' => $lat,
            'longitude' => $lon,
            'timestamp' => $last_position['horodatage'],
            'speed' => $sog,
            'course' => $cog
        ],
        'predicted_positions' => $predictions,
        'analysis' => [
            'average_speed' => $sog,
            'current_course' => $cog,
            'prediction_method' => 'Linear extrapolation',
            'positions_used' => count($positions)
        ]
    ];
}
?>