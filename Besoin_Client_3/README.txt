
# Script : predict_trajectory.py

Ce script permet d'entraîner ou de charger un modèle de régression (Random Forest) pour prédire les futures positions géographiques (LAT, LON) d’un navire à partir de ses dernières observations AIS.


##  Dépendances requises

Installez les bibliothèques suivantes avant de lancer le script :

```bash
pip install pandas numpy scikit-learn joblib
```

##  Utilisation

Dans un terminal PowerShell :

```bash
cd "C:\Users\boloj\Downloads\Besoin_Client_3-20250620T094055Z-1-001\Besoin_Client_3"
python predict_trajectory.py
```

Le script vous demandera d’entrer un **MMSI** (identifiant unique du navire).

### Fonctionnement du script :

1. **Chargement des données** (`vessel-cleaned-final.csv`)
2. **Filtrage du navire sélectionné** (`MMSI`)
3. **Préparation des séquences de données (fenêtres glissantes)**
4. **Encodage (si encodeur disponible)**
5. **Chargement ou entraînement d’un modèle Random Forest**
6. **Prédiction de la position à +5, +10, +15 minutes**
7. **Affichage des résultats**

##  Remarques

- Si le fichier `model_mmsi_<ID>.pkl` existe, il sera utilisé directement.
- Si aucun modèle n’existe, un nouveau modèle sera entraîné.
- Le fichier `encoders_mmsi_<ID>.pkl` est facultatif, mais améliore le traitement des variables catégorielles.

## Exemple de sortie

```
MMSI disponibles : [228339600, 244690494, ...]
Entrez un MMSI à prédire : 228339600

Modèle chargé depuis : models/model_mmsi_228339600.pkl

Prédiction pour le MMSI : 228339600

Données utilisées pour la prédiction :
 SOG  COG  Heading  VesselType  Length  Draft
 10.5 152      150           7       9     3.5
 ...

Prédictions des positions futures :
 → t+5 min : LAT = 48.123456, LON = -3.123456
 → t+10 min : LAT = ...
 → t+15 min : LAT = ...
```
