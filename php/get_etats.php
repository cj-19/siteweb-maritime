<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Configuration de la base de données
$host = 'localhost';
$dbname = 'etu0203';
$username = 'etu0203';
$password = 'qwoopcfe'; // Mot de passe corrigé

try {
    // Connexion à la base de données
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Requête pour récupérer les états
    $stmt = $pdo->prepare("SELECT Id_etat, libelle_etat FROM etat ORDER BY libelle_etat");
    $stmt->execute();
    
    $etats = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Retourner les données en JSON
    echo json_encode($etats, JSON_UNESCAPED_UNICODE);
    
} catch (PDOException $e) {
    // En cas d'erreur, retourner une erreur JSON
    http_response_code(500);
    echo json_encode([
        'error' => true,
        'message' => 'Erreur de base de données: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
} catch (Exception $e) {
    // Autres erreurs
    http_response_code(500);
    echo json_encode([
        'error' => true,
        'message' => 'Erreur serveur: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
?>