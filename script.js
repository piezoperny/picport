// State
let galleryData = {};
let carouselInterval;
let touchStartX = 0;
let touchEndX = 0;

// DOM Elements
const root = document.getElementById('root');
const navLinksContainer = document.getElementById('nav-links');
const mobileMenuToggle = document.getElementById('menu-toggle');
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const closeLightboxBtn = document.querySelector('.lightbox-close');

// Init
document.addEventListener('DOMContentLoaded', init);

async function init() {
    try {
        const response = await fetch('gallery.json');
        
        if (!response.ok) {
            console.warn('gallery.json not found, using demo data');
            // Demo data fallback
            galleryData = {
                "Nature": ["https://picsum.photos/800/1200?random=1", "https://picsum.photos/1200/800?random=2"],
            };
        } else {
            galleryData = await response.json();
        }
        
        renderNavigation();
        handleRouting(); 
        window.addEventListener('hashchange', handleRouting);
    } catch (error) {
        console.error(error);
        root.innerHTML = '<div class="loading">Error loading gallery.</div>';
    }
}

// Helper: Extracts YYYYMMDD from filename and returns YYYY-MM-DD
function formatDate(filepath) {
    try {
        // 1. Get just the filename (remove "images/MASTER/...")
        const filename = filepath.split('/').pop();
        
        // 2. Look for the pattern YYYYMMDD at the start
        // This regex looks for 8 digits at the start of the file
        const match = filename.match(/^(\d{4})(\d{2})(\d{2})/);
        
        if (match) {
            const year = match[1];
            const month = match[2];
            const day = match[3];
            return `${year}-${month}-${day}`; // Returns "2025-11-18"
        }
        return ""; // Return empty if no date found
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
        renderHome();
    }
}

// --- HOME PAGE & CAROUSEL ---

function renderHome() {
    const allImages = Object.values(galleryData).flat();
    
    if (allImages.length === 0) {
        root.innerHTML = '<div class="loading">No images found in gallery.json</div>';
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
    
    // Touch Events
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
