
import pandas as pd
import numpy as np
import joblib
import os

# === 1. Paramètres ===
base_dir = "/content/drive/MyDrive/Besoin_Client_3"
data_path = f"{base_dir}/vessel-cleaned-final.csv"
models_dir = f"{base_dir}/models"
window_size = 5
forecast_steps = [5, 10, 15]
selected_features = ['SOG', 'COG', 'Heading', 'VesselType', 'Length', 'Draft']
cat_vars = ['VesselType', 'Status', 'TransceiverClass']
min_timedelta = 3
max_timedelta = 10

# === 2. Chargement des données ===
df = pd.read_csv(data_path, parse_dates=['BaseDateTime'])

# === 3. Affichage des MMSI disponibles ===
print(" Modèles disponibles :")
model_files = [f for f in os.listdir(models_dir) if f.startswith("model_mmsi_") and f.endswith(".pkl")]
available_mmsi = [int(f.split("_")[2].split(".")[0]) for f in model_files]
print(available_mmsi)

# === 4. Saisie du MMSI ===
mmsi_input = input("\n Entrez le MMSI à prédire : ").strip()
try:
    mmsi = int(mmsi_input)
except:
    print(" MMSI invalide.")
    exit()

if mmsi not in available_mmsi:
    print(" Modèle introuvable pour ce MMSI.")
    exit()

# === 5. Chargement du modèle et des encoders ===
model_path = f"{models_dir}/model_mmsi_{mmsi}.pkl"
encoder_path = f"{models_dir}/encoders_mmsi_{mmsi}.pkl"

model = joblib.load(model_path)
encoders = joblib.load(encoder_path) if os.path.exists(encoder_path) else {}

# === 6. Données du navire ===
df_ship = df[df["MMSI"] == mmsi].sort_values("BaseDateTime").reset_index(drop=True)
if len(df_ship) < window_size:
    print(" Pas assez de données pour le navire.")
    exit()

# === 7. Encodage (identique à l'entraînement) ===
if encoders:
    for col in cat_vars:
        if col in df_ship.columns and col in encoders:
            df_ship[col] = df_ship[col].astype(str)
            df_ship[col] = df_ship[col].apply(lambda x: x if x in encoders[col].classes_ else encoders[col].classes_[0])
            df_ship[col] = encoders[col].transform(df_ship[col])

# === 8. Création de timedelta et recherche fenêtre valide ===
df_ship["timedelta"] = df_ship["BaseDateTime"].diff().dt.total_seconds().div(60).fillna(0)

found = False
for i in range(len(df_ship) - window_size - max(forecast_steps), -1, -1):
    window = df_ship.iloc[i:i + window_size]
    timedeltas = window["timedelta"].values[1:]
    if np.all((timedeltas >= min_timedelta) & (timedeltas <= max_timedelta)):
        X_input = window[selected_features].values.flatten().reshape(1, -1)
        #  suppression de BaseDateTime ici
        display_window = df_ship.iloc[i:i + window_size][['LAT', 'LON', 'SOG', 'COG']]
        found = True
        break

if not found:
    print(" Aucune fenêtre valide trouvée (intervalles 3 à 10 min).")
    exit()

# === 9. Prédiction ===
y_pred = model.predict(X_input)[0]

# === 10. Affichage ===
nom = df_ship["VesselName"].dropna().unique()
nom = nom[0] if len(nom) > 0 else f"Navire_{mmsi}"

print(f"\n Navire : {nom} (MMSI : {mmsi})")
print("\n 5 positions consécutives utilisées pour la prédiction :")
print(display_window.to_string(index=False))

print("\n Prédictions de positions futures :")
for j, step in enumerate(forecast_steps):
    lat = y_pred[2 * j]
    lon = y_pred[2 * j + 1]
    print(f" → t+{step} min : LAT = {lat:.6f} / LON = {lon:.6f}")
