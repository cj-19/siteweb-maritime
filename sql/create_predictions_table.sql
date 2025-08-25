-- Script SQL pour créer la table de stockage des résultats de prédiction
-- À exécuter dans votre base de données MySQL

-- Table pour stocker les résultats de prédiction
CREATE TABLE IF NOT EXISTS prediction_results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mmsi VARCHAR(9) NOT NULL,
    prediction_type ENUM('type', 'trajectory') NOT NULL,
    result_data JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_mmsi (mmsi),
    INDEX idx_prediction_type (prediction_type),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Vue pour faciliter la consultation des prédictions récentes
CREATE OR REPLACE VIEW recent_predictions AS
SELECT 
    pr.id,
    pr.mmsi,
    n.nom as ship_name,
    pr.prediction_type,
    pr.created_at,
    JSON_EXTRACT(pr.result_data, '$.predictions.consensus.type') as predicted_type,
    JSON_EXTRACT(pr.result_data, '$.predictions.consensus.confidence') as confidence
FROM prediction_results pr
LEFT JOIN navire n ON pr.mmsi = n.MMSI
WHERE pr.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
ORDER BY pr.created_at DESC;

-- Index pour optimiser les requêtes sur la vue
CREATE INDEX idx_mmsi_created ON prediction_results(mmsi, created_at);

-- Procédure pour nettoyer les anciennes prédictions (optionnel)
DELIMITER //
CREATE PROCEDURE CleanOldPredictions()
BEGIN
    DELETE FROM prediction_results 
    WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY);
    
    SELECT ROW_COUNT() as deleted_rows;
END //
DELIMITER ;

-- Commentaires pour documentation
ALTER TABLE prediction_results 
COMMENT = 'Table de stockage des résultats de prédiction IA pour les navires';

ALTER TABLE prediction_results 
MODIFY COLUMN mmsi VARCHAR(9) NOT NULL COMMENT 'Identifiant MMSI du navire',
MODIFY COLUMN prediction_type ENUM('type', 'trajectory') NOT NULL COMMENT 'Type de prédiction effectuée',
MODIFY COLUMN result_data JSON NOT NULL COMMENT 'Résultats de prédiction au format JSON',
MODIFY COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Date et heure de création';