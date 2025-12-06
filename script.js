// State
let galleryData = {};
let carouselInterval;

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
            // Fallback for demo if gallery.json doesn't exist yet
            console.warn('gallery.json not found, using demo data');
            galleryData = {
                "Nature": ["https://picsum.photos/800/1200?random=1", "https://picsum.photos/1200/800?random=2"],
                "Urban": ["https://picsum.photos/800/1200?random=3", "https://picsum.photos/1200/800?random=4"],
                "Travel": ["https://picsum.photos/800/800?random=5"]
            };
        } else {
            galleryData = await response.json();
        }
        
        renderNavigation();
        handleRouting(); // Initial load
        
        window.addEventListener('hashchange', handleRouting);
    } catch (error) {
        console.error(error);
        root.innerHTML = '<div class="loading">Error loading gallery.</div>';
    }
}

// Navigation
function renderNavigation() {
    const categories = Object.keys(galleryData).sort();
    
    // Clear and rebuild
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

    // Mobile menu toggle
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

// Home Page - Carousel
function renderHome() {
    const allImages = Object.values(galleryData).flat();
    
    if (allImages.length === 0) {
        root.innerHTML = '<div class="loading">No images found in gallery.json</div>';
        return;
    }

    // Pick 10 random images
    const shuffled = [...allImages].sort(() => 0.5 - Math.random());
    const selection = shuffled.slice(0, 10);

    let html = `<div class="carousel-container">`;
    selection.forEach((imgSrc, index) => {
        const activeClass = index === 0 ? 'active' : '';
        html += `
            <div class="carousel-slide ${activeClass}" data-index="${index}">
                <div class="carousel-bg" style="background-image: url('${imgSrc}')"></div>
                <img src="${imgSrc}" class="carousel-img" alt="Featured">
            </div>
        `;
    });
    html += `</div>`;
    
    root.innerHTML = html;
    startCarousel();
}

function startCarousel() {
    if (carouselInterval) clearInterval(carouselInterval);
    
    carouselInterval = setInterval(() => {
        const slides = document.querySelectorAll('.carousel-slide');
        if (!slides.length) return;
        
        let activeIndex = 0;
        slides.forEach((slide, index) => {
            if (slide.classList.contains('active')) activeIndex = index;
            slide.classList.remove('active');
        });
        
        const nextIndex = (activeIndex + 1) % slides.length;
        slides[nextIndex].classList.add('active');
    }, 5000);
}

// Gallery Page - Masonry
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
        html += `
            <div class="grid-item">
                <img src="${imgSrc}" loading="lazy" alt="${category}" onclick="openLightbox('${imgSrc}')">
            </div>
        `;
    });
    
    html += `</div>`;
    root.innerHTML = html;
}

// Lightbox
window.openLightbox = function(src) {
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
}
