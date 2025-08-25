<?php
header('Content-Type: text/plain; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Configuration de la base de données
$host = 'localhost';
$dbname = 'etu0203';
$username = 'etu0203';
$password = 'qwoopcfe';

try {
    // Vérifier que c'est une requête POST
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception('Méthode non autorisée');
    }
   
    // Récupérer et valider les données
    $mmsi = $_POST['mmsi'] ?? '';
    $horodatage = $_POST['horodatage'] ?? '';
    $latitude = $_POST['latitude'] ?? '';
    $longitude = $_POST['longitude'] ?? '';
    $sog = $_POST['sog'] ?? '';
    $cap_reel = $_POST['cap_reel'] ?? '';
    $nom = $_POST['nom'] ?? '';
    $etat = $_POST['etat'] ?? '';
    $longueur = $_POST['longueur'] ?? '';
    $largeur = $_POST['largeur'] ?? '';
    $tirant_eau = $_POST['tirant_eau'] ?? '';
    
    // Champs optionnels avec valeurs par défaut
    $type_navire = $_POST['type_navire'] ?? 'cargo';
    $id_cluster = $_POST['id_cluster'] ?? 1;
   
    // Validation des champs obligatoires
    $required_fields = [
        'mmsi' => $mmsi,
        'horodatage' => $horodatage,
        'latitude' => $latitude,
        'longitude' => $longitude,
        'sog' => $sog,
        'cap_reel' => $cap_reel,
        'nom' => $nom,
        'etat' => $etat,
        'longueur' => $longueur,
        'largeur' => $largeur,
        'tirant_eau' => $tirant_eau
    ];
   
    foreach ($required_fields as $field => $value) {
        if (empty($value)) {
            throw new Exception("Le champ $field est requis");
        }
    }
   
    // Validation du MMSI
    if (!preg_match('/^\d{9}$/', $mmsi)) {
        throw new Exception('Le MMSI doit contenir exactement 9 chiffres');
    }
   
    // Validation des coordonnées
    $lat = floatval($latitude);
    $lng = floatval($longitude);
   
    if ($lat < -90 || $lat > 90) {
        throw new Exception('La latitude doit être entre -90 et 90');
    }
   
    if ($lng < -180 || $lng > 180) {
        throw new Exception('La longitude doit être entre -180 et 180');
    }
   
    // Connexion à la base de données
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
   
    // Vérifier que l'état existe
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM etat WHERE Id_etat = ?");
    $stmt->execute([$etat]);
    if ($stmt->fetchColumn() == 0) {
        throw new Exception('État sélectionné invalide');
    }
   
    // Commencer une transaction
    $pdo->beginTransaction();
   
    try {
        // 1. Insérer ou mettre à jour dans la table navire
        $sql_navire = "INSERT INTO navire (MMSI, nom, longueur, largeur, tirant_eau, type_navire, id_cluster) 
                       VALUES (?, ?, ?, ?, ?, ?, ?)
                       ON DUPLICATE KEY UPDATE 
                       nom = VALUES(nom),
                       longueur = VALUES(longueur),
                       largeur = VALUES(largeur),
                       tirant_eau = VALUES(tirant_eau),
                       type_navire = VALUES(type_navire)";
        
        $stmt_navire = $pdo->prepare($sql_navire);
        $stmt_navire->execute([
            $mmsi,
            $nom,
            floatval($longueur),
            floatval($largeur),
            floatval($tirant_eau),
            $type_navire,
            intval($id_cluster)
        ]);
        
        // 2. Insérer dans la table position
        // Utilisation de cap_reel pour les deux champs cog et cap_reel
        $sql_position = "INSERT INTO position (MMSI, horodatage, latitude, longitude, sog, cog, cap_reel, Id_etat, MMSI_navire, Id_etat_a_pour) 
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        
        $stmt_position = $pdo->prepare($sql_position);
        $stmt_position->execute([
            $mmsi,
            $horodatage,
            $lat,
            $lng,
            floatval($sog),
            floatval($cap_reel), // Utilisation de cap_reel pour le champ cog
            floatval($cap_reel),
            intval($etat),
            $mmsi, // MMSI_navire (référence vers navire)
            intval($etat) // Id_etat_a_pour (même valeur que Id_etat)
        ]);
        
        // Valider la transaction
        $pdo->commit();
        echo "Bateau ajouté avec succès ! Consultez les tables 'navire' et 'position' dans phpMyAdmin.";
        
    } catch (Exception $e) {
        // Annuler la transaction en cas d'erreur
        $pdo->rollback();
        throw $e;
    }
   
} catch (PDOException $e) {
    http_response_code(500);
    echo "Erreur de base de données: " . $e->getMessage();
} catch (Exception $e) {
    http_response_code(400);
    echo "Erreur: " . $e->getMessage();
}
?>