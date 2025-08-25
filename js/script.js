// Animation au scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Animation des statistiques
const animateStats = () => {
    const statNumbers = document.querySelectorAll('.stat-number[data-count]');
    statNumbers.forEach(stat => {
        const target = parseInt(stat.getAttribute('data-count'));
        let current = 0;
        const increment = target / 50;

        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }

            if (stat.textContent.includes('%')) {
                stat.textContent = current.toFixed(1) + '%';
            } else {
                stat.textContent = Math.floor(current).toLocaleString();
            }
        }, 50);
    });
};

// Observer pour les statistiques
const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            animateStats();
            statsObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

// Scroll fluide pour l'indicateur
document.addEventListener('DOMContentLoaded', function() {
    const scrollIndicator = document.querySelector('.scroll-indicator');
    const statsSection = document.querySelector('.stats-section');

    if (scrollIndicator) {
        scrollIndicator.addEventListener('click', () => {
            document.querySelector('#features').scrollIntoView({
                behavior: 'smooth'
            });
        });
    }

    if (statsSection) {
        statsObserver.observe(statsSection);
    }
});

// Header transparent au scroll
let lastScrollTop = 0;
const header = document.querySelector('.main-header');

window.addEventListener('scroll', () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    if (scrollTop > 100) {
        header.style.background = 'rgba(245, 246, 245, 0.98)';
        header.style.backdropFilter = 'blur(15px)';
        header.style.boxShadow = '0 2px 20px rgba(26, 42, 68, 0.1)';
    } else {
        header.style.background = 'rgba(245, 246, 245, 0.95)';
        header.style.backdropFilter = 'blur(10px)';
        header.style.boxShadow = 'none';
    }

    lastScrollTop = scrollTop;
});

// Animation des cartes au survol et au scroll
document.addEventListener('DOMContentLoaded', function() {
    // Animation des cartes feature
    document.querySelectorAll('.feature-card').forEach(card => {
        // Effet de parallaxe léger au scroll
        window.addEventListener('scroll', () => {
            const rect = card.getBoundingClientRect();
            const speed = rect.top * 0.1;
            card.style.transform = `translateY(${speed}px)`;
        });

        // Animation au survol
        card.addEventListener('mouseenter', function() {
            this.style.transition = 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            const icon = this.querySelector('.feature-icon');
            if (icon) {
                icon.style.transform = 'scale(1.1) rotate(5deg)';
                icon.style.color = 'var(--rouge-attenue)';
            }
        });

        card.addEventListener('mouseleave', function() {
            const icon = this.querySelector('.feature-icon');
            if (icon) {
                icon.style.transform = 'scale(1) rotate(0deg)';
                icon.style.color = 'var(--rouge-isen)';
            }
        });
    });

    // Observer pour les animations d'apparition
    document.querySelectorAll('.feature-card, .section, .stat-item').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'all 0.8s ease-out';
        observer.observe(el);
    });
});


// Navigation active selon la section visible
function updateActiveNavigation() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-list a');

    window.addEventListener('scroll', () => {
        let current = '';

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (scrollY >= (sectionTop - 200)) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    });
}

// Particules flottantes dans le hero
function createFloatingParticles() {
    const heroSection = document.querySelector('.hero-video-section');
    if (!heroSection) return;

    for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.style.cssText = `
            position: absolute;
            width: ${Math.random() * 4 + 2}px;
            height: ${Math.random() * 4 + 2}px;
            background: rgba(163, 191, 250, 0.6);
            border-radius: 50%;
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            animation: float ${Math.random() * 3 + 2}s ease-in-out infinite;
            animation-delay: ${Math.random() * 2}s;
            pointer-events: none;
        `;
        heroSection.appendChild(particle);
    }
}

// Animation de chargement
function showLoadingAnimation() {
    const loader = document.createElement('div');
    loader.id = 'page-loader';
    loader.innerHTML = `
        <div class="loader-content">
            <div class="loader-ship">
                <i class="fas fa-ship"></i>
            </div>
            <div class="loader-waves">
                <div class="wave"></div>
                <div class="wave"></div>
                <div class="wave"></div>
            </div>
            <p>Chargement de BoatTracker AI...</p>
        </div>
    `;

    loader.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, var(--bleu-marine), #2c3e50);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        color: white;
        font-family: 'Roboto', sans-serif;
    `;

    document.body.appendChild(loader);

    // Masquer le loader après 2 secondes
    setTimeout(() => {
        loader.style.opacity = '0';
        loader.style.transition = 'opacity 0.5s ease';
        setTimeout(() => {
            document.body.removeChild(loader);
        }, 500);
    }, 2000);
}

// Smooth scroll pour tous les liens internes
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Initialisation complète
document.addEventListener('DOMContentLoaded', function() {
    // Vérifier si la page a déjà été chargée dans cette session
    if (!sessionStorage.getItem('hasVisited')) {
        // Si c'est la première visite, afficher le loader
        showLoadingAnimation();
        // Définir le flag pour indiquer que la page a été visitée
        sessionStorage.setItem('hasVisited', 'true');
    }

    // Initialiser toutes les fonctionnalités
    setTimeout(() => {
        updateActiveNavigation();
        createFloatingParticles();
        initSmoothScroll();

        // Animation des éléments avec un délai
        setTimeout(() => {
            document.querySelectorAll('.hero-title, .hero-subtitle, .hero-cta').forEach((el, index) => {
                setTimeout(() => {
                    el.style.animation = `fadeInUp 1s ease forwards`;
                }, index * 200);
            });
        }, 500);
    }, 100);
});

// Gestion des erreurs
window.addEventListener('error', function(e) {
    console.warn('Erreur détectée:', e.message);
});

// Performance monitoring
if ('performance' in window) {
    window.addEventListener('load', () => {
        const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
        console.log(`Page chargée en ${loadTime}ms`);
    });
}