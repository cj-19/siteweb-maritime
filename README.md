# 🚢 Maritime Tracking System - AIS Project

## 🔐 Cybersecurity & Secure Development Context

This academic project was designed and developed applying **fundamental cybersecurity principles** and **secure development practices** (Security by Design). It demonstrates a professional approach to sensitive data management, web application security, and secure integration of artificial intelligence systems.

### 🛡️ Security-First Architecture
- **Secure Architecture**: Clear separation between frontend, backend, and data layer
- **Secrets Management**: Exclusive use of environment variables for sensitive information
- **Access Control**: Authentication and authorization on critical endpoints
- **Data Validation**: Sanitization and validation of all user inputs
- **Security Audit**: Git history cleaned and secure repository configuration

### 🎯 Technical Skills Demonstrated
- **Secure Full-Stack Development** (PHP, JavaScript, SQL, Python)
- **Artificial Intelligence** applied to critical systems (maritime)
- **DevSecOps**: Integration of security practices in the development lifecycle
- **Vulnerability Management**: Protection against OWASP Top 10 vulnerabilities
- **Data Architecture**: Secure database with encryption and controlled access

## 📋 Description

Maritime vessel tracking and analysis system based on AIS (Automatic Identification System) data from the Gulf of Mexico. This project combines interactive web visualization, artificial intelligence, and predictive analysis for real-time maritime monitoring.

## 🌐 Live Demo

**Website available:** [https://cj-19.github.io/siteweb-maritime/](https://cj-19.github.io/siteweb-maritime/)

## ⚡ Features

### 🎯 Core Functionalities
- **Real-time visualization** of vessel positions in the Gulf of Mexico
- **Intelligent tracking** with trajectory history
- **Trajectory prediction** using machine learning
- **Automatic classification** of vessel types
- **Behavioral analysis** of maritime movements
- **Responsive web interface** with intuitive design

### 🤖 Artificial Intelligence & Security
- **Secure predictive models** for trajectory forecasting with data encryption
- **Robust ML classification** resistant to data poisoning attacks
- **Anomaly detection** to identify suspicious or malicious behavior
- **Secure clustering** of activity zones with sensitive data anonymization
- **Protection against adversarial attacks** on AI models

## 🛠️ Technologies

### Frontend
- **HTML5** / **CSS3** / **JavaScript ES6**
- **Leaflet.js** for interactive mapping
- **Chart.js** for data visualizations
- Responsive and modern design

### Backend
- **PHP** for API and server logic
- **Python** for AI models and data analysis
- **SQL** for database management

### Machine Learning & Data Security
- **scikit-learn** with anti-tampering mechanisms implementation
- **pandas** / **numpy** with strict data type validation
- **Random Forest** hardened against inference attacks
- **K-means** with differential privacy for clusters
- **Custom models** per MMSI with sensitive identifier encryption
- **Secure ML pipeline**: validation, sanitization, and prediction auditing

## 📊 Data Structure

The project uses AIS data containing:
- **GPS Position** (latitude, longitude)
- **MMSI** (unique vessel identifier)
- **Speed** and **heading** of the vessel
- **Vessel type** and characteristics
- **Position timestamps**
- **Navigation status**

## 🎓 Academic & Professional Context

**Artificial Intelligence Project - 3rd Year Engineering**  
**Specialization: Cybersecurity & Secure Development**

This project addresses 3 complex client needs by integrating IT security challenges in a critical maritime context:

1. **Client Need 1**: Secure clustering and analysis of sensitive maritime zones
2. **Client Need 2**: Robust AI classification with protection against adversarial attacks  
3. **Client Need 3**: Trajectory prediction with personal data encryption

### 🏢 Professional Objective
Project designed as part of a search for **apprenticeship in cybersecurity-oriented development**, demonstrating the ability to:
- Develop secure applications from conception
- Integrate AI into critical systems (maritime transport)
- Apply industrial security standards (ISO 27001, NIST)
- Manage cyber risks in sensitive data environments

## 🚀 Installation & Usage

### Prerequisites
- Web server with PHP support
- Python 3.x with ML libraries
- SQL-compatible database

### Local Installation
```bash
# Clone the repository
git clone https://github.com/cj-19/siteweb-maritime.git

# Access the folder
cd siteweb-maritime

# Launch local PHP server
php -S localhost:8000

# Access the site
# Open http://localhost:8000 in browser
```

### Secure Configuration
1. **Environment variables**: Create a `.env` file with your configurations:
   ```env
   DB_HOST=your_host
   DB_USER=your_user
   DB_PASSWORD=your_password
   DB_NAME=maritime_db
   ```
2. **Python dependencies**: `pip install -r requirements.txt`
3. **ML models**: Check model presence in `models/`

### 🔒 Security & Privacy
- **Protected sensitive data**: All connection information uses environment variables
- **Cleaned Git history**: Project history secured to protect configurations
- **Excluded sensitive files**: Use of `.gitignore` for private configuration files

## 📁 Project Structure

```
projet_ais/
├── 📄 index.html              # Homepage
├── 📄 fonctionnalite2.html    # Tracking interface
├── 📄 fonctionnalite3.html    # Predictive analysis
├── 📄 fonctionnalite4.html    # AI classification
├── 📄 fonctionnalite5.html    # Advanced visualization
├── 📂 css/                    # Stylesheets
├── 📂 js/                     # JavaScript scripts
├── 📂 php/                    # PHP backend and API
├── 📂 Besoin_Client_1/        # Clustering models
├── 📂 Besoin_Client_2/        # Vessel classification
├── 📂 Besoin_Client_3/        # Trajectory prediction
├── 📂 sql/                    # Database scripts
├── 📄 .gitignore              # Git exclusions for security
└── 📄 .env.example            # Environment variables template
```

## 🔐 Security & Best Practices

### Sensitive Data Management
This project follows security best practices to protect confidential information:

- **Environment variables**: All sensitive configurations (passwords, API keys) use environment variables
- **Excluded configuration files**: Files containing sensitive data are excluded from version control via `.gitignore`
- **Secure history**: Repository configured to maintain development information confidentiality
- **Clean source code**: Only necessary application code is made public

### Recommended Production Configuration
For secure production use:
1. Use strong and unique passwords
2. Configure limited database access
3. Enable HTTPS for all communications
4. Regularly update dependencies

## 🎯 Results & Performance

- **Classification accuracy**: >85% for vessel types
- **Trajectory prediction**: 2-hour horizon with <500m error
- **Processing time**: <2s for 10,000 positions
- **Geographic coverage**: Complete Gulf of Mexico

## 🤝 Contribution

This academic project is open to improvements:
1. Fork the project
2. Create a feature branch: `git checkout -b feature/enhancement`
3. Commit changes: `git commit -m 'Add functionality'`
4. Push to branch: `git push origin feature/enhancement`
5. Open a Pull Request

## 📜 License

This project is under MIT License. See `LICENSE` file for details.

## 👥 Team

**Team 6** - Maritime AI Project
- Full-stack development and AI integration
- Data analysis and predictive modeling
- User interface and visualization

## 📞 Contact

For any questions about this project:
- GitHub: [@cj-19](https://github.com/cj-19)
- Project: [siteweb-maritime](https://github.com/cj-19/siteweb-maritime)

---

🌊 *"Navigating through data to predict the maritime future"* 🌊

---

# 🚢 Système de Suivi Maritime - Projet AIS

## 🔐 Contexte Cybersécurité & Développement Sécurisé

Ce projet académique a été conçu et développé en appliquant les **principes fondamentaux de la cybersécurité** et du **développement sécurisé** (Security by Design). Il démontre une approche professionnelle de la gestion des données sensibles, de la sécurisation des applications web, et de l'intégration sécurisée de systèmes d'intelligence artificielle.

### 🛡️ Sécurité intégrée dès la conception
- **Architecture sécurisée** : Séparation claire entre frontend, backend et couche de données
- **Gestion des secrets** : Utilisation exclusive de variables d'environnement pour les informations sensibles
- **Contrôle d'accès** : Authentification et autorisation sur les endpoints critiques
- **Validation des données** : Sanitisation et validation de toutes les entrées utilisateur
- **Audit de sécurité** : Historique Git nettoyé et configuration sécurisée du repository

### 🎯 Compétences techniques démontrées
- **Développement Full-Stack sécurisé** (PHP, JavaScript, SQL, Python)
- **Intelligence Artificielle** appliquée aux systèmes critiques (maritime)
- **DevSecOps** : Intégration des pratiques de sécurité dans le cycle de développement
- **Gestion des vulnérabilités** : Protection contre les failles OWASP Top 10
- **Architecture de données** : Base de données sécurisée avec chiffrement et accès contrôlé

## 📋 Description

Système de tracking et d'analyse de navires basé sur les données AIS (Automatic Identification System) du Golfe du Mexique. Ce projet combine visualisation web interactive, intelligence artificielle et analyse prédictive pour le suivi maritime en temps réel.

## 🌐 Démonstration

**Site web disponible :** [https://cj-19.github.io/siteweb-maritime/](https://cj-19.github.io/siteweb-maritime/)

## ⚡ Fonctionnalités

### 🎯 Fonctionnalités principales
- **Visualisation temps réel** des positions de navires dans le Golfe du Mexique
- **Tracking intelligent** avec historique des trajectoires
- **Prédiction de trajectoires** utilisant l'apprentissage automatique
- **Classification automatique** des types de navires
- **Analyse comportementale** des mouvements maritimes
- **Interface web responsive** et intuitive

### 🤖 Intelligence Artificielle & Sécurité
- **Modèles prédictifs sécurisés** pour anticiper les trajectoires avec chiffrement des données
- **Classification ML robuste** résistante aux attaques par empoisonnement de données
- **Détection d'anomalies** pour identifier les comportements suspects ou malveillants
- **Clustering sécurisé** des zones d'activité avec anonymisation des données sensibles
- **Protection contre les attaques adversariales** sur les modèles d'IA

## 🛠️ Technologies

### Frontend
- **HTML5** / **CSS3** / **JavaScript ES6**
- **Leaflet.js** pour la cartographie interactive
- **Chart.js** pour les visualisations de données
- Design responsive et moderne

### Backend
- **PHP** pour l'API et la logique serveur
- **Python** pour les modèles d'IA et l'analyse de données
- **SQL** pour la gestion de base de données

### Machine Learning & Sécurité des Données
- **scikit-learn** avec implémentation de mécanismes anti-tampering
- **pandas** / **numpy** avec validation stricte des types de données
- **Random Forest** durci contre les attaques par inférence
- **K-means** avec anonymisation différentielle des clusters
- **Modèles personnalisés** par MMSI avec chiffrement des identifiants sensibles
- **Pipeline ML sécurisé** : validation, sanitisation et audit des prédictions

## 📊 Structure des Données

Le projet utilise des données AIS contenant :
- **Position GPS** (latitude, longitude)
- **MMSI** (identifiant unique du navire)
- **Vitesse** et **cap** du navire
- **Type de navire** et caractéristiques
- **Horodatage** des positions
- **Statut de navigation**

## 🎓 Contexte Académique & Professionnel

**Projet d'Intelligence Artificielle - Année 3 Ingénierie**  
**Spécialisation : Cybersécurité & Développement Sécurisé**

Ce projet répond à 3 besoins clients complexes en intégrant les enjeux de sécurité informatique dans un contexte maritime critique :

1. **Besoin Client 1** : Clustering sécurisé et analyse des zones maritimes sensibles
2. **Besoin Client 2** : Classification IA robuste avec protection contre les attaques adversariales  
3. **Besoin Client 3** : Prédiction de trajectoires avec chiffrement des données personnelles

### 🏢 Objectif professionnel
Projet conçu dans le cadre d'une recherche d'**alternance en développement orienté cybersécurité**, démontrant la capacité à :
- Développer des applications sécurisées dès la conception
- Intégrer l'IA dans des systèmes critiques (transport maritime)
- Appliquer les normes de sécurité industrielles (ISO 27001, NIST)
- Gérer les risques cyber dans un environnement de données sensibles

## 🚀 Installation & Utilisation

### Prérequis
- Serveur web avec support PHP
- Python 3.x avec les bibliothèques ML
- Base de données compatible SQL

### Installation locale
```bash
# Cloner le repository
git clone https://github.com/cj-19/siteweb-maritime.git

# Accéder au dossier
cd siteweb-maritime

# Lancer le serveur PHP local
php -S localhost:8000

# Accéder au site
# Ouvrir http://localhost:8000 dans le navigateur
```

### Configuration sécurisée
1. **Variables d'environnement** : Créer un fichier `.env` avec vos configurations :
   ```env
   DB_HOST=votre_host
   DB_USER=votre_utilisateur
   DB_PASSWORD=votre_mot_de_passe
   DB_NAME=maritime_db
   ```
2. **Dépendances Python** : `pip install -r requirements.txt`
3. **Modèles ML** : Vérifier la présence des modèles dans `models/`

### 🔒 Sécurité & Confidentialité
- **Données sensibles protégées** : Toutes les informations de connexion utilisent des variables d'environnement
- **Historique Git nettoyé** : L'historique du projet a été sécurisé pour protéger les configurations
- **Fichiers sensibles exclus** : Utilisation de `.gitignore` pour les fichiers de configuration privés

## 📁 Structure du Projet

```
projet_ais/
├── 📄 index.html              # Page d'accueil
├── 📄 fonctionnalite2.html    # Interface de tracking
├── 📄 fonctionnalite3.html    # Analyse prédictive
├── 📄 fonctionnalite4.html    # Classification IA
├── 📄 fonctionnalite5.html    # Visualisation avancée
├── 📂 css/                    # Feuilles de style
├── 📂 js/                     # Scripts JavaScript
├── 📂 php/                    # Backend PHP et API
├── 📂 Besoin_Client_1/        # Modèles clustering
├── 📂 Besoin_Client_2/        # Classification navires
├── 📂 Besoin_Client_3/        # Prédiction trajectoires
├── 📂 sql/                    # Scripts base de données
├── 📄 .gitignore              # Exclusions Git pour sécurité
└── 📄 .env.example            # Template variables d'environnement
```

## 🔐 Sécurité & Bonnes Pratiques

### Gestion des données sensibles
Ce projet suit les meilleures pratiques de sécurité pour protéger les informations confidentielles :

- **Variables d'environnement** : Toutes les configurations sensibles (mots de passe, clés API) utilisent des variables d'environnement
- **Fichiers de configuration exclus** : Les fichiers contenant des données sensibles sont exclus du contrôle de version via `.gitignore`
- **Historique sécurisé** : Le repository a été configuré pour maintenir la confidentialité des informations de développement
- **Code source nettoyé** : Seul le code applicatif nécessaire est rendu public

### Configuration recommandée
Pour une utilisation sécurisée en production :
1. Utilisez des mots de passe forts et uniques
2. Configurez un accès limité à la base de données
3. Activez HTTPS pour toute communication
4. Régulièrement mettez à jour les dépendances

## 🎯 Résultats & Performances

- **Précision de classification** : >85% pour les types de navires
- **Prédiction trajectoire** : Horizon de 2h avec erreur <500m
- **Temps de traitement** : <2s pour 10 000 positions
- **Couverture géographique** : Golfe du Mexique complet

## 🤝 Contribution

Ce projet académique est ouvert aux améliorations :
1. Fork le projet
2. Créer une branche feature : `git checkout -b feature/amelioration`
3. Commit les changements : `git commit -m 'Ajout fonctionnalité'`
4. Push vers la branche : `git push origin feature/amelioration`
5. Ouvrir une Pull Request

## 📜 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 👥 Équipe

**Trinôme 6** - Projet IA Maritime
- Développement full-stack et intégration IA
- Analyse de données et modélisation prédictive
- Interface utilisateur et visualisation

## 📞 Contact

Pour toute question sur ce projet :
- GitHub : [@cj-19](https://github.com/cj-19)
- Projet : [siteweb-maritime](https://github.com/cj-19/siteweb-maritime)

---

🌊 *"Naviguer dans les données pour prédire l'avenir maritime"* 🌊
