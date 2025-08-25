<?php
// debug_predict.php - Script pour déboguer les problèmes de prédiction
error_reporting(E_ALL);
ini_set('display_errors', 1);
header('Content-Type: text/plain');

echo "=== DEBUG SCRIPT DE PREDICTION AMELIORE ===\n\n";

// 1. Vérifier la connexion à la base de données
echo "1. Test de connexion à la base de données:\n";
try {
    require_once 'database.php';
    if (isset($pdo)) {
        echo "✓ Connexion PDO réussie\n";
        
        // Test de requête sur la table navire
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM navire");
        $result = $stmt->fetch();
        echo "✓ Nombre de navires dans la DB: " . $result['count'] . "\n";
        
        // Vérifier la structure de la table
        $stmt = $pdo->query("DESCRIBE navire");
        $columns = $stmt->fetchAll();
        echo "✓ Colonnes de la table navire: ";
        foreach ($columns as $col) {
            echo $col['Field'] . " ";
        }
        echo "\n";
        
        // Test avec un navire réel
        $stmt = $pdo->query("SELECT MMSI, longueur, largeur, type_navire FROM navire LIMIT 1");
        $sample = $stmt->fetch();
        if ($sample) {
            echo "✓ Exemple de navire: MMSI=" . $sample['MMSI'] . 
                 ", longueur=" . $sample['longueur'] . 
                 ", largeur=" . $sample['largeur'] . 
                 ", type=" . $sample['type_navire'] . "\n";
        }
        
    } else {
        echo "✗ Variable PDO non définie\n";
    }
} catch (Exception $e) {
    echo "✗ Erreur de connexion DB: " . $e->getMessage() . "\n";
}
echo "\n";

// 2. Vérifier Python et modules
echo "2. Test de Python et modules:\n";
$python_commands = ['python3', 'python', '/usr/bin/python3'];
$python_found = false;
$python_cmd = '';

foreach ($python_commands as $cmd) {
    $output = shell_exec("which $cmd 2>/dev/null");
    if (!empty($output)) {
        echo "✓ $cmd trouvé: " . trim($output) . "\n";
        $version = shell_exec("$cmd --version 2>&1");
        echo "  Version: " . trim($version) . "\n";
        
        if (!$python_found) {
            $python_cmd = $cmd;
            $python_found = true;
        }
    }
}

if ($python_found) {
    // Test des modules Python nécessaires
    $modules = ['json', 'sys', 'math', 'datetime', 'numpy'];
    foreach ($modules as $module) {
        $test_cmd = "$python_cmd -c \"import $module; print('✓ $module OK')\" 2>&1";
        $result = shell_exec($test_cmd);
        echo trim($result) . "\n";
    }
} else {
    echo "✗ Aucune version de Python trouvée\n";
}
echo "\n";

// 3. Vérifier les scripts Python
echo "3. Test des scripts Python:\n";
$script_locations = [
    __DIR__ . '/python_scripts/',
    __DIR__ . '/scripts/',
    __DIR__ . '/'
];

$scripts_found = [];
foreach ($script_locations as $location) {
    $type_script = $location . 'predict_type.py';
    $traj_script = $location . 'predict_trajectory.py';
    
    if (file_exists($type_script)) {
        echo "✓ predict_type.py trouvé: $type_script\n";
        echo "  Permissions: " . substr(sprintf('%o', fileperms($type_script)), -4) . "\n";
        echo "  Taille: " . filesize($type_script) . " bytes\n";
        $scripts_found['type'] = $type_script;
    }
    
    if (file_exists($traj_script)) {
        echo "✓ predict_trajectory.py trouvé: $traj_script\n";
        echo "  Permissions: " . substr(sprintf('%o', fileperms($traj_script)), -4) . "\n";
        echo "  Taille: " . filesize($traj_script) . " bytes\n";
        $scripts_found['trajectory'] = $traj_script;
    }
}

if (empty($scripts_found)) {
    echo "✗ Aucun script Python trouvé\n";
}
echo "\n";

// 4. Test avec des données réalistes
echo "4. Test avec données réalistes:\n";
if ($python_found && !empty($scripts_found)) {
    
    // Créer des données de test plus complètes
    $realistic_data = [
        'mmsi' => '123456789',
        'ship_info' => [
            'MMSI' => '123456789',
            'longueur' => 180.0,
            'largeur' => 28.0,
            'tirant_eau' => 12.5,
            'type_navire' => 'Cargo'
        ],
        'positions' => [
            [
                'latitude' => 48.123,
                'longitude' => -4.456,
                'sog' => 12.5,
                'cog' => 180.0,
                'cap_reel' => 182.0,
                'horodatage' => '2024-01-01T12:00:00Z',
                'libelle_etat' => 'Under way using engine'
            ],
            [
                'latitude' => 48.113,
                'longitude' => -4.446,
                'sog' => 12.8,
                'cog' => 175.0,
                'cap_reel' => 177.0,
                'horodatage' => '2024-01-01T11:00:00Z',
                'libelle_etat' => 'Under way using engine'
            ],
            [
                'latitude' => 48.103,
                'longitude' => -4.436,
                'sog' => 13.1,
                'cog' => 170.0,
                'cap_reel' => 172.0,
                'horodatage' => '2024-01-01T10:00:00Z',
                'libelle_etat' => 'Under way using engine'
            ]
        ],
        'prediction_type' => 'type'
    ];
    
    $temp_data = tempnam(sys_get_temp_dir(), 'test_data_');
    file_put_contents($temp_data, json_encode($realistic_data, JSON_PRETTY_PRINT));
    echo "Données de test créées: $temp_data\n";
    echo "Contenu du fichier:\n" . substr(file_get_contents($temp_data), 0, 200) . "...\n\n";
    
    // Test du script de prédiction de type
    if (isset($scripts_found['type'])) {
        echo "Test de predict_type.py:\n";
        $command = "$python_cmd " . escapeshellarg($scripts_found['type']) . 
                  " " . escapeshellarg($temp_data) . " 2>&1";
        echo "Commande: $command\n";
        $output = shell_exec($command);
        echo "Sortie:\n$output\n";
    }
    
    // Test du script de prédiction de trajectoire
    if (isset($scripts_found['trajectory'])) {
        echo "Test de predict_trajectory.py:\n";
        $command = "$python_cmd " . escapeshellarg($scripts_found['trajectory']) . 
                  " " . escapeshellarg($temp_data) . " 2>&1";
        echo "Commande: $command\n";
        $output = shell_exec($command);
        echo "Sortie:\n$output\n";
    }
    
    unlink($temp_data);
}
echo "\n";

// 5. Test de la fonction de prédiction PHP
echo "5. Test des fonctions PHP de prédiction:\n";
try {
    // Simuler un appel à makePrediction
    function testMakePrediction($mmsi, $type) {
        global $pdo;
        
        echo "Test makePrediction($mmsi, $type):\n";
        
        // Simuler la récupération des données
        if (!isset($pdo)) {
            echo "✗ PDO non disponible\n";
            return;
        }
        
        // Test avec un MMSI fictif
        $ship_data = [
            'mmsi' => $mmsi,
            'ship_info' => [
                'MMSI' => $mmsi,
                'longueur' => 150,
                'largeur' => 25,
                'type_navire' => 'Cargo'
            ],
            'positions' => [
                [
                    'latitude' => 48.123,
                    'longitude' => -4.456,
                    'sog' => 12.5,
                    'horodatage' => date('c')
                ]
            ],
            'prediction_type' => $type
        ];
        
        $temp_file = tempnam(sys_get_temp_dir(), 'ship_data_');
        file_put_contents($temp_file, json_encode($ship_data));
        
        $script_path = '';
        if ($type === 'type' && isset($GLOBALS['scripts_found']['type'])) {
            $script_path = $GLOBALS['scripts_found']['type'];
        } elseif ($type === 'trajectory' && isset($GLOBALS['scripts_found']['trajectory'])) {
            $script_path = $GLOBALS['scripts_found']['trajectory'];
        }
        
        if ($script_path) {
            $command = "python3 " . escapeshellarg($script_path) . 
                      " " . escapeshellarg($temp_file) . " 2>&1";
            $output = shell_exec($command);
            echo "Résultat: " . substr($output, 0, 200) . "...\n";
        } else {
            echo "✗ Script non trouvé pour le type: $type\n";
        }
        
        unlink($temp_file);
    }
    
    // Définir $scripts_found comme variable globale pour la fonction
    $GLOBALS['scripts_found'] = $scripts_found;
    
    testMakePrediction('123456789', 'type');
    testMakePrediction('123456789', 'trajectory');
    
} catch (Exception $e) {
    echo "✗ Erreur lors du test des fonctions PHP: " . $e->getMessage() . "\n";
}

echo "\n=== RECOMMANDATIONS ===\n";
echo "1. Vérifiez que numpy est installé: pip3 install numpy\n";
echo "2. Assurez-vous que les scripts Python ont les bonnes permissions\n";
echo "3. Testez avec des données réelles de la base de données\n";
echo "4. Vérifiez les logs d'erreur du serveur web\n";
echo "5. Ajoutez plus de logging dans les scripts Python\n";

echo "\n=== FIN DU DEBUG ===\n";
?>