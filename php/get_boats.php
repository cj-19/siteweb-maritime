<?php
// get_boats.php
header('Content-Type: application/json');

// Inclure le fichier de connexion à la base de données.
// Le chemin est correct car database.php est dans le même dossier (php/).
require_once 'database.php';

try {
    // Sélectionner la position la plus récente pour chaque bateau
    // Cette requête joint les tables navire, position et etat
    // Elle utilise une sous-requête pour s'assurer de récupérer la dernière position par MMSI
    $stmt = $pdo->prepare("
        SELECT
            n.MMSI,
            n.nom,
            n.longueur,
            n.largeur,
            n.tirant_eau,
            n.type_navire AS type,      -- Alias 'type' pour correspondre au JS
            p.horodatage,
            p.latitude,
            p.longitude,
            p.sog AS vitesse,           -- Alias 'vitesse' pour correspondre au JS
            p.cog AS cap,               -- Alias 'cap' pour correspondre au JS
            p.cap_reel,
            e.libelle_etat AS etat      -- Alias 'etat' pour correspondre au JS
        FROM
            navire n
        JOIN
            position p ON n.MMSI = p.MMSI
        JOIN
            (SELECT MMSI, MAX(horodatage) AS max_horodatage FROM position GROUP BY MMSI) AS latest_pos
            ON p.MMSI = latest_pos.MMSI AND p.horodatage = latest_pos.max_horodatage
        LEFT JOIN
            etat e ON p.id_etat = e.id_etat
        ORDER BY
            n.nom
    ");
    $stmt->execute();
    $boats = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Retourner les données des bateaux au format JSON
    echo json_encode($boats);

} catch (PDOException $e) {
    // En cas d'erreur de base de données, envoyer un code d'erreur HTTP 500
    // et un message d'erreur JSON
    http_response_code(500); // Internal Server Error
    error_log('Erreur BDD get_boats.php: ' . $e->getMessage()); // Journaliser l'erreur pour le débogage
    echo json_encode(['error' => 'Erreur de base de données : ' . $e->getMessage()]);
}
?>
