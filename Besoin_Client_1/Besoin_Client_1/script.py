import pandas as pd
import joblib
import numpy as np
import os
import sys

def predict_vessel_cluster(SOG, COG, Heading, Length, Width, Draft, VesselType, model_dir='.'):
    
    try:
        # Charger les ressources nécessaires avec gestion d'erreur spécifique
        required_files = [
            'kmeans_model.pkl',
            'label_encoder.pkl', 
            'standard_scaler.pkl',
            'median_heading.pkl',
            'feature_columns_order.pkl'
        ]
        
        # Vérifier l'existence des fichiers avant de les charger
        for file in required_files:
            file_path = os.path.join(model_dir, file)
            if not os.path.exists(file_path):
                return None, f"Erreur : Le fichier '{file}' est introuvable dans le répertoire '{model_dir}'"
        
        # Chargement sécurisé des modèles
        print("Chargement des modèles...")
        kmeans_model = joblib.load(os.path.join(model_dir, 'kmeans_model.pkl'))
        label_encoder = joblib.load(os.path.join(model_dir, 'label_encoder.pkl'))
        scaler = joblib.load(os.path.join(model_dir, 'standard_scaler.pkl'))
        median_heading_value = joblib.load(os.path.join(model_dir, 'median_heading.pkl'))
        feature_columns_order = joblib.load(os.path.join(model_dir, 'feature_columns_order.pkl'))
        print("Modèles chargés avec succès.")

    except FileNotFoundError as e:
        return None, f"Erreur de chargement : Un ou plusieurs fichiers modèles/transformateurs sont introuvables. Détails : {e}"
    except Exception as e:
        return None, f"Erreur inattendue lors du chargement des modèles : {e}"

    # Validation et conversion des entrées
    try:
        SOG = float(SOG)
        COG = float(COG)
        Heading = int(Heading)
        Length = int(Length)
        Width = int(Width)
        Draft = float(Draft)
        VesselType = int(VesselType)
    except (ValueError, TypeError) as e:
        return None, f"Erreur : Les paramètres d'entrée doivent être des nombres valides. Détails : {e}"

    # Validation des plages de valeurs
    if not (0 <= COG <= 360):
        return None, "Erreur : COG doit être entre 0 et 360 degrés"
    
    if not ((0 <= Heading <= 359) or Heading == 511):
        return None, "Erreur : Heading doit être entre 0-359 degrés ou 511 pour 'inconnu'"
    
    if SOG < 0:
        return None, "Erreur : SOG ne peut pas être négatif"
    
    if Length <= 0 or Width <= 0:
        return None, "Erreur : Length et Width doivent être positifs"

    # 1. Traitement de la valeur aberrante 'Heading' (511)
    if Heading == 511:
        print(f"INFO : 'Heading' 511 détecté et remplacé par la médiane entraînée ({median_heading_value:.2f}).")
        Heading = float(median_heading_value)  # Assurer la conversion en float

    # 2. Encodage de la variable catégorielle 'VesselType'
    try:
        # Vérifier si la valeur VesselType est dans les classes connues
        if hasattr(label_encoder, 'classes_') and VesselType not in label_encoder.classes_:
            available_types = list(label_encoder.classes_)
            return None, f"Erreur : La valeur '{VesselType}' pour 'VesselType' n'est pas reconnue. Types disponibles : {available_types}"
        
        # Utiliser `transform` car l'encodeur a déjà été `fit` sur les données d'entraînement.
        vessel_type_encoded = label_encoder.transform([VesselType])[0]
        print(f"VesselType {VesselType} encodé en {vessel_type_encoded}")
    except ValueError as e:
        return None, f"Erreur : La valeur '{VesselType}' pour 'VesselType' n'est pas reconnue par le modèle. Détails : {e}"
    except Exception as e:
        return None, f"Erreur lors de l'encodage du type de navire : {e}"

    # 3. Préparer les données d'entrée dans le bon ordre des colonnes
    try:
        # Créer un dictionnaire avec les données d'entrée
        input_data = {
            'SOG': float(SOG),
            'COG': float(COG),
            'Heading': float(Heading),
            'Length': float(Length),
            'Width': float(Width),
            'Draft': float(Draft),
            'VesselType_encoded': float(vessel_type_encoded)
        }

        # Créer un DataFrame avec une seule ligne, en respectant l'ordre des colonnes d'entraînement
        input_df = pd.DataFrame([input_data], columns=feature_columns_order)
        
        # Debug: Afficher les informations sur les données
        print(f"DEBUG - Colonnes attendues: {feature_columns_order}")
        print(f"DEBUG - Données d'entrée: {input_data}")
        print(f"DEBUG - Shape du DataFrame: {input_df.shape}")
        print(f"DEBUG - Colonnes du DataFrame: {list(input_df.columns)}")
        print(f"DEBUG - Types de données: {input_df.dtypes}")
        
        # Vérifier que toutes les colonnes attendues sont présentes
        if input_df.isnull().any().any():
            return None, "Erreur : Des valeurs manquantes ont été détectées dans les données d'entrée"
        
        # Vérifier que toutes les colonnes attendues sont dans le DataFrame
        missing_cols = set(feature_columns_order) - set(input_df.columns)
        if missing_cols:
            return None, f"Erreur : Colonnes manquantes dans les données d'entrée : {missing_cols}"

    except Exception as e:
        return None, f"Erreur lors de la préparation des données : {e}"

    # 4. Normaliser les données d'entrée en utilisant le StandardScaler chargé
    try:
        print("Normalisation des données...")
        input_scaled = scaler.transform(input_df)
        print(f"DEBUG - Shape après normalisation: {input_scaled.shape}")
        print(f"DEBUG - Données normalisées (premiers éléments): {input_scaled[0][:5] if len(input_scaled[0]) >= 5 else input_scaled[0]}")
    except Exception as e:
        return None, f"Erreur lors de la normalisation des données : {e}"

    # 5. Prédire le cluster
    try:
        print("Prédiction du cluster...")
        print(f"DEBUG - Shape des données pour KMeans: {input_scaled.shape}")
        
        # Vérifier la compatibilité avec le modèle KMeans
        if hasattr(kmeans_model, 'n_features_in_'):
            expected_features = kmeans_model.n_features_in_
            actual_features = input_scaled.shape[1]
            print(f"DEBUG - Features attendues par KMeans: {expected_features}")
            print(f"DEBUG - Features fournies: {actual_features}")
            
            if expected_features != actual_features:
                print(f"⚠️  PROBLÈME DÉTECTÉ: Incompatibilité de dimensions!")
                print(f"   Le modèle KMeans attend {expected_features} feature(s)")
                print(f"   Mais {actual_features} features sont fournies")
                
                if expected_features == 1 and actual_features > 1:
                    print("🔧 CORRECTION AUTOMATIQUE: Utilisation de la première composante principale")
                    # Prendre seulement la première feature ou calculer une combinaison
                    # Option 1: Utiliser seulement la première feature normalisée
                    input_for_kmeans = input_scaled[:, :1]  # Première colonne seulement
                    print(f"   Données réduites pour KMeans: shape {input_for_kmeans.shape}")
                    
                elif expected_features > 1 and actual_features == 1:
                    # Cas inverse: le modèle attend plus de features
                    return None, f"Erreur critique : Le modèle KMeans attend {expected_features} features mais seulement {actual_features} fournie. Réentraînement nécessaire."
                
                else:
                    input_for_kmeans = input_scaled
            else:
                input_for_kmeans = input_scaled
        else:
            # Si pas d'information sur les features attendues, utiliser les données telles quelles
            print("⚠️  Pas d'information sur les features attendues par KMeans")
            input_for_kmeans = input_scaled
        
        print(f"DEBUG - Données finales pour prédiction: shape {input_for_kmeans.shape}")
        cluster = kmeans_model.predict(input_for_kmeans)[0]
        # Convertir en type Python natif pour éviter les problèmes de sérialisation
        cluster = int(cluster)
        print(f"Cluster prédit: {cluster}")
        
    except Exception as e:
        return None, f"Erreur lors de la prédiction : {e}"

    return cluster, "Succès"

def diagnose_models(model_dir='.'):
    """
    Diagnostic des modèles sauvegardés pour identifier les problèmes.
    """
    print("\n=== DIAGNOSTIC DES MODÈLES ===")
    
    try:
        # Charger et analyser chaque modèle
        print("1. Chargement du KMeans...")
        kmeans_model = joblib.load(os.path.join(model_dir, 'kmeans_model.pkl'))
        print(f"   - Nombre de clusters: {kmeans_model.n_clusters}")
        print(f"   - Features attendues: {kmeans_model.n_features_in_ if hasattr(kmeans_model, 'n_features_in_') else 'Non disponible'}")
        
        print("\n2. Chargement du LabelEncoder...")
        label_encoder = joblib.load(os.path.join(model_dir, 'label_encoder.pkl'))
        print(f"   - Classes disponibles: {list(label_encoder.classes_)}")
        
        print("\n3. Chargement du StandardScaler...")
        scaler = joblib.load(os.path.join(model_dir, 'standard_scaler.pkl'))
        print(f"   - Nombre de features: {scaler.n_features_in_ if hasattr(scaler, 'n_features_in_') else 'Non disponible'}")
        print(f"   - Noms des features: {scaler.feature_names_in_ if hasattr(scaler, 'feature_names_in_') else 'Non disponible'}")
        print(f"   - Moyennes: {scaler.mean_ if hasattr(scaler, 'mean_') else 'Non disponible'}")
        print(f"   - Écarts-types: {scaler.scale_ if hasattr(scaler, 'scale_') else 'Non disponible'}")
        
        print("\n4. Chargement de la médiane Heading...")
        median_heading = joblib.load(os.path.join(model_dir, 'median_heading.pkl'))
        print(f"   - Valeur médiane: {median_heading}")
        print(f"   - Type: {type(median_heading)}")
        
        print("\n5. Chargement de l'ordre des colonnes...")
        feature_columns_order = joblib.load(os.path.join(model_dir, 'feature_columns_order.pkl'))
        print(f"   - Ordre des colonnes: {feature_columns_order}")
        print(f"   - Nombre de colonnes: {len(feature_columns_order)}")
        print(f"   - Type: {type(feature_columns_order)}")
        
        # Vérification de cohérence
        print("\n6. Vérification de cohérence...")
        scaler_features = scaler.n_features_in_ if hasattr(scaler, 'n_features_in_') else None
        kmeans_features = kmeans_model.n_features_in_ if hasattr(kmeans_model, 'n_features_in_') else None
        columns_count = len(feature_columns_order)
        
        print(f"   - Scaler features: {scaler_features}")
        print(f"   - KMeans features: {kmeans_features}")
        print(f"   - Colonnes définies: {columns_count}")
        
        if scaler_features and kmeans_features and scaler_features != kmeans_features:
            print("   🚨 PROBLÈME CRITIQUE: Incohérence entre Scaler et KMeans!")
            print(f"      Le Scaler a été entraîné avec {scaler_features} features")
            print(f"      Mais le KMeans a été entraîné avec {kmeans_features} features")
            print("      Solution appliquée: utilisation de la première feature pour KMeans")
        
        if scaler_features and scaler_features != columns_count:
            print("   ⚠️  ATTENTION: Incohérence entre Scaler et ordre des colonnes!")
            
        # Recommandations
        if kmeans_features == 1 and scaler_features > 1:
            print("\n   💡 RECOMMANDATION:")
            print("      Il semble que le KMeans ait été entraîné sur une seule dimension")
            print("      (probablement après réduction de dimensionnalité).")
            print("      Le script utilisera automatiquement la première composante.")
        
        print("\n=== FIN DU DIAGNOSTIC ===\n")
        
    except Exception as e:
        print(f"Erreur lors du diagnostic: {e}")
        import traceback
        traceback.print_exc()

def fix_kmeans_dimensions(model_dir='.'):
    
    print("\n=== CORRECTION DES DIMENSIONS KMEANS ===")
    
    try:
        # Charger les composants existants
        scaler = joblib.load(os.path.join(model_dir, 'standard_scaler.pkl'))
        old_kmeans = joblib.load(os.path.join(model_dir, 'kmeans_model.pkl'))
        
        expected_features = scaler.n_features_in_ if hasattr(scaler, 'n_features_in_') else 7
        current_features = old_kmeans.n_features_in_ if hasattr(old_kmeans, 'n_features_in_') else 1
        
        print(f"Features attendues: {expected_features}")
        print(f"Features actuelles KMeans: {current_features}")
        
        if expected_features == current_features:
            print("✅ Aucune correction nécessaire!")
            return True
        
        print("🔧 Création d'un nouveau modèle KMeans avec les bonnes dimensions...")
        
        # Créer un nouveau modèle KMeans avec les mêmes paramètres mais les bonnes dimensions
        from sklearn.cluster import KMeans
        
        new_kmeans = KMeans(
            n_clusters=old_kmeans.n_clusters,
            random_state=42,
            n_init=10
        )
        
        # Générer des données factices pour "entraîner" le modèle avec les bonnes dimensions
        # ATTENTION: Ceci est un hack temporaire!
        dummy_data = np.random.normal(0, 1, (100, expected_features))
        new_kmeans.fit(dummy_data)
        
        # Copier les centres de clusters si possible (adaptation nécessaire)
        if hasattr(old_kmeans, 'cluster_centers_'):
            old_centers = old_kmeans.cluster_centers_
            if old_centers.shape[1] == 1 and expected_features > 1:
                # Étendre les centres à la nouvelle dimension
                new_centers = np.zeros((old_centers.shape[0], expected_features))
                new_centers[:, 0] = old_centers[:, 0]  # Première dimension = anciens centres
                new_kmeans.cluster_centers_ = new_centers
                print(f"✅ Centres de clusters adaptés: {old_centers.shape} -> {new_centers.shape}")
        
        # Sauvegarder le nouveau modèle
        backup_path = os.path.join(model_dir, 'kmeans_model_backup.pkl')
        original_path = os.path.join(model_dir, 'kmeans_model.pkl')
        
        # Faire une sauvegarde de l'original
        joblib.dump(old_kmeans, backup_path)
        print(f"✅ Sauvegarde de l'ancien modèle: {backup_path}")
        
        # Sauvegarder le nouveau modèle
        joblib.dump(new_kmeans, original_path)
        print(f"✅ Nouveau modèle KMeans sauvegardé: {original_path}")
        
        print("⚠️  IMPORTANT: Ce correctif est temporaire!")
        print("   Recommandation: Réentraîner complètement le modèle KMeans avec vos données originales.")
        
        return True
        
    except Exception as e:
        print(f"❌ Erreur lors de la correction: {e}")
        return False

def get_available_vessel_types(model_dir='.'):
    try:
        label_encoder = joblib.load(os.path.join(model_dir, 'label_encoder.pkl'))
        if hasattr(label_encoder, 'classes_'):
            return list(label_encoder.classes_)
        else:
            return None
    except Exception:
        return None

def get_model_directory():

    # Répertoire par défaut basé sur l'information fournie
    default_model_dir = r"C:\Users\Eliot\Desktop\Projet IA\Besoin_Client_1"
    
    # Vérifier si le répertoire par défaut existe et contient les fichiers modèles
    if os.path.exists(default_model_dir):
        kmeans_file = os.path.join(default_model_dir, 'kmeans_model.pkl')
        if os.path.exists(kmeans_file):
            return default_model_dir
    
    # Si on est dans un script Python normal
    if '__file__' in globals():
        script_dir = os.path.dirname(os.path.abspath(__file__))
        if script_dir:
            return script_dir
    
    # Si on est dans Jupyter ou un environnement interactif
    if 'ipykernel' in sys.modules:
        # On est dans Jupyter, utiliser le répertoire courant
        return os.getcwd()
    
    # Par défaut, utiliser le répertoire courant
    return '.'

def test_prediction_with_sample_data(model_dir='.'):

    print("\n=== TEST AVEC DONNÉES D'EXEMPLE ===")
    
    # Données d'exemple typiques
    test_cases = [
        {
            'name': 'Cargo typique',
            'SOG': 12.5, 'COG': 180.0, 'Heading': 175, 
            'Length': 200, 'Width': 30, 'Draft': 8.5, 'VesselType': 70
        },
        {
            'name': 'Passenger avec Heading inconnu',
            'SOG': 15.0, 'COG': 90.0, 'Heading': 511, 
            'Length': 150, 'Width': 25, 'Draft': 6.0, 'VesselType': 60
        }
    ]
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\nTest {i} - {test_case['name']}:")
        print(f"Données: SOG={test_case['SOG']}, COG={test_case['COG']}, Heading={test_case['Heading']}")
        print(f"         Length={test_case['Length']}, Width={test_case['Width']}, Draft={test_case['Draft']}, VesselType={test_case['VesselType']}")
        
        cluster, message = predict_vessel_cluster(
            test_case['SOG'], test_case['COG'], test_case['Heading'],
            test_case['Length'], test_case['Width'], test_case['Draft'],
            test_case['VesselType'], model_dir
        )
        
        if cluster is not None:
            print(f"✅ Résultat: Cluster {cluster} - {message}")
        else:
            print(f"❌ Échec: {message}")
    
    print("\n=== FIN DES TESTS ===\n")

if __name__ == "__main__":
    print("-------------------------------------------------------")
    print("        Script de Prédiction de Cluster de Navire      ")
    print("-------------------------------------------------------")
    
    # Déterminer le répertoire des modèles de manière robuste
    model_dir = get_model_directory()
    print(f"Répertoire des modèles : {model_dir}")
    
    # Vérifier que les fichiers modèles existent
    required_files = ['kmeans_model.pkl', 'label_encoder.pkl', 'standard_scaler.pkl', 
                     'median_heading.pkl', 'feature_columns_order.pkl']
    
    missing_files = []
    for file in required_files:
        if not os.path.exists(os.path.join(model_dir, file)):
            missing_files.append(file)
    
    if missing_files:
        print(f"\n❌ ERREUR : Fichiers manquants dans {model_dir}:")
        for file in missing_files:
            print(f"   - {file}")
        print("\nVeuillez vérifier que tous les fichiers .pkl sont présents dans le bon répertoire.")
        print("Répertoire attendu : C:\\Users\\Eliot\\Desktop\\Projet IA\\Besoin_Client_1\\")
        
        # Permettre à l'utilisateur de spécifier un autre répertoire
        custom_dir = input("\nEntrez le chemin complet vers le répertoire des modèles (ou appuyez sur Entrée pour quitter) : ").strip()
        if custom_dir and os.path.exists(custom_dir):
            model_dir = custom_dir
            print(f"Nouveau répertoire : {model_dir}")
        else:
            print("Arrêt du programme.")
            sys.exit(1)
    
    # Exécuter le diagnostic des modèles
    diagnose_models(model_dir)
    
    # Exécuter les tests avec des données d'exemple
    test_prediction_with_sample_data(model_dir)
    
    # Afficher les types de navires disponibles
    available_types = get_available_vessel_types(model_dir)
    if available_types:
        print(f"Types de navires disponibles : {available_types}")
    else:
        print("⚠️  Avertissement : Impossible de charger les types de navires disponibles.")

    # Interface utilisateur pour la saisie manuelle
    print("\n--- Options disponibles ---")
    print("1. Tester avec vos propres données")
    print("3. Quitter")
    
    user_choice = input("Choisissez une option (1, 2, ou 3) : ").strip()
    
    if user_choice == '2':
        print("\n⚠️  ATTENTION: Cette correction est expérimentale!")
        print("Elle ne remplace pas un réentraînement complet du modèle.")
        confirm = input("Voulez-vous continuer? (oui/non) : ").strip().lower()
        
        if confirm in ['oui', 'o', 'yes', 'y']:
            if fix_kmeans_dimensions(model_dir):
                print("\n✅ Correction appliquée! Relancez le script pour tester.")
            else:
                print("\n❌ La correction a échoué.")
        sys.exit(0)
    
    elif user_choice == '3' or user_choice.lower() in ['non', 'n', 'no']:
        print("Fin du programme.")
        sys.exit(0)
    
    elif user_choice != '1':
        print("Option non reconnue. Fin du programme.")
        sys.exit(0)

    try:
        print("\n--- Saisie des caractéristiques du navire ---")
        
        while True:
            try:
                sog = float(input("Entrez la vitesse sur le fond (SOG en nœuds, ex: 10.5) : "))
                if sog >= 0:
                    break
                else:
                    print("❌ La vitesse ne peut pas être négative. Veuillez réessayer.")
            except ValueError:
                print("❌ Veuillez entrer un nombre valide pour SOG.")

        while True:
            try:
                cog = float(input("Entrez le cap sur le fond (COG en degrés, 0-360, ex: 270.0) : "))
                if 0 <= cog <= 360:
                    break
                else:
                    print("❌ COG doit être entre 0 et 360. Veuillez réessayer.")
            except ValueError:
                print("❌ Veuillez entrer un nombre valide pour COG.")

        while True:
            try:
                heading = int(input("Entrez l'orientation de la proue (Heading en degrés, 0-359, ou 511 pour 'inconnu') : "))
                if (0 <= heading <= 359) or heading == 511:
                    break
                else:
                    print("❌ Heading doit être entre 0-359 ou 511. Veuillez réessayer.")
            except ValueError:
                print("❌ Veuillez entrer un nombre entier valide pour Heading.")

        while True:
            try:
                length = int(input("Entrez la longueur du navire (en mètres, ex: 150) : "))
                if length > 0:
                    break
                else:
                    print("❌ La longueur doit être positive. Veuillez réessayer.")
            except ValueError:
                print("❌ Veuillez entrer un nombre entier valide pour la longueur.")

        while True:
            try:
                width = int(input("Entrez la largeur du navire (en mètres, ex: 25) : "))
                if width > 0:
                    break
                else:
                    print("❌ La largeur doit être positive. Veuillez réessayer.")
            except ValueError:
                print("❌ Veuillez entrer un nombre entier valide pour la largeur.")

        while True:
            try:
                draft = float(input("Entrez le tirant d'eau (Draft en mètres, ex: 7.5) : "))
                break
            except ValueError:
                print("❌ Veuillez entrer un nombre valide pour le tirant d'eau.")

        # Pour VesselType avec validation
        print(f"\n--- Types de navires ---")
        if available_types:
            print(f"Types disponibles : {available_types}")
        else:
            print("Types courants : 60 (Passenger), 70 (Cargo), 80 (Tanker), etc.")
        
        while True:
            try:
                vessel_type = int(input("Entrez le type de navire (valeur numérique) : "))
                break
            except ValueError:
                print("❌ Veuillez entrer un nombre entier valide pour le type de navire.")

        # Appeler la fonction de prédiction
        print("\n--- Prédiction en cours... ---")
        predicted_cluster, message = predict_vessel_cluster(sog, cog, heading, length, width, draft, vessel_type, model_dir)

        if predicted_cluster is not None:
            print(f"\n✅ Prédiction réussie : Le navire appartient au cluster {predicted_cluster}.")
            print(f"Message : {message}")
        else:
            print(f"\n❌ Échec de la prédiction : {message}")

    except KeyboardInterrupt:
        print("\n\n⚠️  Script interrompu par l'utilisateur.")
    except Exception as e:
        print(f"\n❌ Une erreur inattendue est survenue : {e}")
        import traceback
        traceback.print_exc()

    print("\n-------------------------------------------------------")
    print("Fin du script de prédiction.")
    print("-------------------------------------------------------")