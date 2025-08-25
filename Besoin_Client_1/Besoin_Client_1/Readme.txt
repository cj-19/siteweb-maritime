# Système de Prédiction de Cluster de Navires

Ce projet fournit un script Python pour prédire le cluster de comportement de navigation d'un navire, basé sur ses spécifications. Le modèle de clustering (KMeans) ainsi que les transformateurs de données (LabelEncoder et StandardScaler) sont chargés depuis des fichiers préalablement enregistrés, évitant ainsi un ré-entraînement coûteux à chaque utilisation.

## Structure du Projet

votre_projet/
├── predict_vessel_cluster.py
├── kmeans_model.pkl
├── label_encoder.pkl
├── standard_scaler.pkl
├── median_heading.pkl
├── feature_columns_order.pkl
└── README.md


## Prérequis

* Python 3.x
* Les bibliothèques Python suivantes : `pandas`, `scikit-learn`, `joblib`.
    Vous pouvez les installer via pip :
    ```bash
    pip install pandas scikit-learn joblib
    ```

## Comment Utiliser

### Étape 1 : Générer les Fichiers de Modèle (.pkl)

Avant d'utiliser le script de prédiction, vous devez avoir entraîné votre modèle de clustering et sauvegardé les objets nécessaires. Ces étapes sont réalisées dans votre **notebook Jupyter original** (celui utilisé pour l'analyse et l'entraînement).

Assurez-vous que les lignes de code suivantes ont été ajoutées et exécutées à la fin de votre notebook, après l'entraînement du modèle KMeans :

```python
import joblib
# ... (votre code précédent pour la préparation des données et l'entraînement) ...

# Sauvegarde des ressources
joblib.dump(kmeans_model, 'kmeans_model.pkl')
joblib.dump(le, 'label_encoder.pkl')
joblib.dump(scaler, 'standard_scaler.pkl')
joblib.dump(median_heading, 'median_heading.pkl') # Assurez-vous que 'median_heading' est la médiane correcte utilisée pour le nettoyage de 'Heading'
joblib.dump(df_scaled.columns.tolist(), 'feature_columns_order.pkl') # Enregistre l'ordre des colon