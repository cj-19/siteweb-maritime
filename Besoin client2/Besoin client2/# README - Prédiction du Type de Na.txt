# README - Prédiction du Type de Navire

## Description :

Ce script permet de prédire automatiquement le type d’un navire à partir de ses caractéristiques :

* Longueur (en mètres)
* Tirant d’eau (en mètres)
* Vitesse (en nœuds)
* Largeur (en mètres)

Il utilise un modèle de machine learning préentraîné (Random Forest).

## Fichiers nécessaires :

* final\_random\_forest\_model.pkl     --> modèle entraîné
* label\_encoder.pkl                 --> encodeur des catégories de navires

## Bibliothèques requises :

* pandas
* numpy
* joblib

## Installation (si nécessaire) :

pip install pandas numpy joblib

## Utilisation :

Lancer le script dans un terminal Python :

```
python Client2_script.py
```

Suivez les instructions à l'écran pour entrer les caractéristiques du navire.
Le type de navire sera affiché à la fin.

## Exemple de sortie :

Type de navire prédit : Tanker

## Remarques :

* Les entrées sont contrôlées : elles doivent rester dans des plages réalistes.
* Les plages peuvent être ajustées dans le code selon les besoins.
