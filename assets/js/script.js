// Global State
let carouselInterval;
let touchStartX = 0;
let touchEndX = 0;
let logoRotation = 0;

document.addEventListener('DOMContentLoaded', init);

function init() {
    // 1. Mobile Menu Logic
    const toggle = document.getElementById('menu-toggle');
    const nav = document.getElementById('nav-links');
    if (toggle && nav) {
        toggle.onclick = () => nav.classList.toggle('active');
    }

    // 2. spinning logo
    const logoLink = document.getElementById('logo-link');
    const logoImg = document.querySelector('.site-logo-img');
    
    if (logoLink && logoImg) {
        logoLink.addEventListener('click', (e) => {
            // If we are on the homepage, don't reload, just spin!
            if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
                e.preventDefault();
            }
            
            const randomDeg = Math.floor(Math.random() * 300) + 60;
            const direction = Math.random() < 0.5 ? -1 : 1;
            
            // We use a global variable 'logoRotation' to keep track
            // Make sure 'let logoRotation = 0;' is at the very top of your file
            logoRotation += (randomDeg * direction);
            logoImg.style.transform = `rotate(${logoRotation}deg)`;
        });
    }

    // 3. Carousel Logic
    if (document.getElementById('carousel')) {
        startCarousel();
        setupSwipe();
    }
}

// Back to Top
const backToTopBtn = document.getElementById('back-to-top');
window.addEventListener('scroll', () => {
    if (window.scrollY > 300) backToTopBtn.classList.add('visible');
    else backToTopBtn.classList.remove('visible');
});
backToTopBtn.addEventListener('click', (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// Lightbox
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const closeBtn = document.querySelector('.lightbox-close');

window.openLightbox = function(src) {
    if (carouselInterval) clearInterval(carouselInterval);
    lightboxImg.src = src;
    lightbox.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
};

closeBtn.onclick = closeLightbox;
lightbox.onclick = (e) => { if (e.target === lightbox) closeLightbox(); };

function closeLightbox() {
    lightbox.classList.add('hidden');
    document.body.style.overflow = '';
    setTimeout(() => { lightboxImg.src = ''; }, 300);
    if (document.getElementById('carousel')) startCarousel();
}

// Carousel Logic
function startCarousel() {
    if (carouselInterval) clearInterval(carouselInterval);
    carouselInterval = setInterval(() => moveSlide(1), 5000);
}

window.moveSlide = function(direction) {
    const slides = document.querySelectorAll('.carousel-slide');
    if (!slides.length) return;
    
    let activeIndex = 0;
    slides.forEach((slide, index) => {
        if (slide.classList.contains('active')) activeIndex = index;
        slide.classList.remove('active');
    });
    
    let nextIndex = activeIndex + direction;
    if (nextIndex >= slides.length) nextIndex = 0;
    if (nextIndex < 0) nextIndex = slides.length - 1;
    
    slides[nextIndex].classList.add('active');
    startCarousel();
}

function setupSwipe() {
    const carousel = document.getElementById('carousel');
    carousel.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
    }, {passive: true});
    carousel.addEventListener('touchend', e => {
        touchEndX = e.changedTouches[0].screenX;
        if (touchEndX < touchStartX - 50) moveSlide(1);
        if (touchEndX > touchStartX + 50) moveSlide(-1);
    }, {passive: true});
}
