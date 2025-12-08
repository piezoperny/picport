// State
let galleryData = {};
let carouselInterval;
let touchStartX = 0;
let touchEndX = 0;
let logoRotation = 0; // Tracks current rotation

// DOM Elements
const root = document.getElementById('root');
const navLinksContainer = document.getElementById('nav-links');
const mobileMenuToggle = document.getElementById('menu-toggle');
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const closeLightboxBtn = document.querySelector('.lightbox-close');
const backToTopBtn = document.getElementById('back-to-top');
// FIX: Grab the link wrapper instead of just the image
const logoLink = document.getElementById('logo-link');
const logoImg = document.querySelector('.site-logo-img');

// Init
document.addEventListener('DOMContentLoaded', init);

async function init() {
    // 1. Set Footer Year
    const yearSpan = document.getElementById('year');
    if (yearSpan) yearSpan.textContent = new Date().getFullYear();

    // 2. Logo Rotation Feature (Attached to the Link)
    if (logoLink && logoImg) {
        logoLink.addEventListener('click', (e) => {
            // Prevent the link from reloading/navigating so we can see the spin
            e.preventDefault(); 
            
            // Random spin between 60deg and 360deg
            const randomDeg = Math.floor(Math.random() * 300) + 60;
            const direction = Math.random() < 0.5 ? -1 : 1;
            
            logoRotation += (randomDeg * direction);
            logoImg.style.transform = `rotate(${logoRotation}deg)`;
        });
    }

    try {
        const response = await fetch('gallery.json');
        
        if (!response.ok) {
            console.warn('gallery.json not found');
            root.innerHTML = '<div class="loading-container">Gallery not found.</div>';
        } else {
            galleryData = await response.json();
        }
        
        renderNavigation();
        handleRouting(); 
        window.addEventListener('hashchange', handleRouting);
    } catch (error) {
        console.error(error);
        root.innerHTML = '<div class="loading-container">Error loading gallery.</div>';
    }
}

// Back to Top Logic
window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
        backToTopBtn.classList.add('visible');
    } else {
        backToTopBtn.classList.remove('visible');
    }
});

backToTopBtn.addEventListener('click', (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// Helper: Extracts YYYYMMDD from filename
function formatDate(filepath) {
    try {
        const filename = filepath.split('/').pop();
        const match = filename.match(/^(\d{4})(\d{2})(\d{2})/);
        
        if (match) {
            return `${match[1]}-${match[2]}-${match[3]}`;
        }
        return "";
    } catch (e) {
        return "";
    }
}

// Navigation
function renderNavigation() {
    const categories = Object.keys(galleryData).sort();
    navLinksContainer.innerHTML = '';
    
    // Home Link
    const homeLi = document.createElement('li');
    homeLi.innerHTML = `<a href="#" onclick="window.location.hash=''; return false;">Home</a>`;
    navLinksContainer.appendChild(homeLi);

    // Category Links
    categories.forEach(category => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = `#${category}`;
        a.textContent = category;
        li.appendChild(a);
        navLinksContainer.appendChild(li);
    });

    mobileMenuToggle.onclick = () => {
        navLinksContainer.classList.toggle('active');
    };
}

function updateActiveNav(category) {
    const links = navLinksContainer.querySelectorAll('a');
    links.forEach(link => {
        const linkHash = link.getAttribute('href');
        if ((category === null && (linkHash === '#' || linkHash === '')) || 
            linkHash === `#${category}`) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
    navLinksContainer.classList.remove('active');
}

// Routing
function handleRouting() {
    const hash = window.location.hash.slice(1);
    const category = hash ? decodeURIComponent(hash) : null;
    
    updateActiveNav(category);
    
    if (!category) {
        renderHome();
    } else if (galleryData[category]) {
        renderGallery(category);
    } else {
        renderHome(); // Fallback
    }
}

// --- HOME PAGE & FADING CAROUSEL ---

function renderHome() {
    const allImages = Object.values(galleryData).flat();
    
    if (allImages.length === 0) {
        root.innerHTML = '<div class="loading-container">No images found.</div>';
        return;
    }

    // Pick 10 random images
    const shuffled = [...allImages].sort(() => 0.5 - Math.random());
    const selection = shuffled.slice(0, 10);

    let html = `<div class="carousel-container" id="carousel">`;
    selection.forEach((imgSrc, index) => {
        const activeClass = index === 0 ? 'active' : '';
        const dateStr = formatDate(imgSrc);
        
        html += `
            <div class="carousel-slide ${activeClass}" data-index="${index}">
                <div class="carousel-bg" style="background-image: url('${imgSrc}')"></div>
                <img src="${imgSrc}" class="carousel-img" alt="Featured" onclick="openLightbox('${imgSrc}')">
                ${dateStr ? `<div class="carousel-date">${dateStr}</div>` : ''}
            </div>
        `;
    });
    
    html += `
        <div class="carousel-nav prev" onclick="moveSlide(-1)">&#10094;</div>
        <div class="carousel-nav next" onclick="moveSlide(1)">&#10095;</div>
    </div>`;
    
    root.innerHTML = html;
    
    // Swipe Support
    const carousel = document.getElementById('carousel');
    carousel.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
    }, {passive: true});

    carousel.addEventListener('touchend', e => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, {passive: true});

    startCarousel();
}

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

function handleSwipe() {
    const swipeThreshold = 50;
    if (touchEndX < touchStartX - swipeThreshold) {
        moveSlide(1); 
    }
    if (touchEndX > touchStartX + swipeThreshold) {
        moveSlide(-1);
    }
}

// --- GALLERY & LIGHTBOX ---

function renderGallery(category) {
    if (carouselInterval) clearInterval(carouselInterval);
    
    const images = galleryData[category];
    
    let html = `
        <div class="gallery-header">
            <h1 class="gallery-title">${category}</h1>
        </div>
        <div class="masonry-grid">
    `;
    
    images.forEach(imgSrc => {
        const dateStr = formatDate(imgSrc);
        
        html += `
            <div class="grid-item">
                <img src="${imgSrc}" loading="lazy" alt="${category}" onclick="openLightbox('${imgSrc}')">
                ${dateStr ? `<div class="photo-date">${dateStr}</div>` : ''}
            </div>
        `;
    });
    
    html += `</div>`;
    root.innerHTML = html;
}

window.openLightbox = function(src) {
    if (carouselInterval) clearInterval(carouselInterval);
    lightboxImg.src = src;
    lightbox.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
};

closeLightboxBtn.onclick = closeLightbox;
lightbox.onclick = (e) => {
    if (e.target === lightbox) closeLightbox();
};

function closeLightbox() {
    lightbox.classList.add('hidden');
    document.body.style.overflow = '';
    setTimeout(() => { lightboxImg.src = ''; }, 300);
    if (!window.location.hash) startCarousel();
}
