<?php
// get_clusters.php
header('Content-Type: application/json');

// Inclure le fichier de connexion à la base de données
require_once 'database.php';

try {
    // Récupérer les données des bateaux avec leurs clusters et positions les plus récentes
    // Cette requête joint les tables navire, position pour récupérer lat, lng et cluster
    $stmt = $pdo->prepare("
        SELECT
            n.MMSI,
            n.nom,
            n.id_cluster AS cluster,
            p.latitude AS lat,
            p.longitude AS lng,
            p.sog AS vitesse,
            p.horodatage
        FROM
            navire n
        JOIN
            position p ON n.MMSI = p.MMSI
        JOIN
            (SELECT MMSI, MAX(horodatage) AS max_horodatage FROM position GROUP BY MMSI) AS latest_pos
            ON p.MMSI = latest_pos.MMSI AND p.horodatage = latest_pos.max_horodatage
        WHERE
            n.id_cluster IS NOT NULL
        ORDER BY
            n.id_cluster, n.nom
    ");
    $stmt->execute();
    $boats = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Convertir les données pour correspondre exactement au format attendu par le JavaScript
    $clusters_data = [];
    foreach ($boats as $boat) {
        $clusters_data[] = [
            'lat' => (float)$boat['lat'],
            'lng' => (float)$boat['lng'], 
            'cluster' => (int)$boat['cluster']
        ];
    }

    // Retourner les données au format JSON
    echo json_encode($clusters_data);

} catch (PDOException $e) {
    // En cas d'erreur de base de données, envoyer un code d'erreur HTTP 500
    // et un message d'erreur JSON
    http_response_code(500); // Internal Server Error
    error_log('Erreur BDD get_clusters.php: ' . $e->getMessage()); // Journaliser l'erreur pour le débogage
    echo json_encode(['error' => 'Erreur de base de données : ' . $e->getMessage()]);
}
?>