// Global State
let carouselInterval;
let touchStartX = 0;
let touchEndX = 0;
let logoRotation = 0;
const colorThief = new ColorThief();

document.addEventListener('DOMContentLoaded', init);

function init() {
    // 1. Mobile Menu
    const toggle = document.getElementById('menu-toggle');
    const nav = document.getElementById('nav-links');
    if (toggle && nav) {
        toggle.onclick = () => nav.classList.toggle('active');
    }

    // 2. Spinning Logo
    const logoLink = document.getElementById('logo-link');
    const logoImg = document.querySelector('.site-logo-img');
    if (logoLink && logoImg) {
        logoLink.addEventListener('click', (e) => {
            if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
                e.preventDefault();
            }
            const randomDeg = Math.floor(Math.random() * 300) + 60;
            const direction = Math.random() < 0.5 ? -1 : 1;
            logoRotation += (randomDeg * direction);
            logoImg.style.transform = `rotate(${logoRotation}deg)`;
        });
    }

    // 3. Carousel
    if (document.getElementById('carousel')) {
        startCarousel();
        setupSwipe();
    }

    // 4. Dark Mode
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;
    if (localStorage.getItem('theme') === 'dark') {
        body.classList.add('dark-mode');
        if(themeToggle) themeToggle.innerText = '☀️';
    }
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            body.classList.toggle('dark-mode');
            if (body.classList.contains('dark-mode')) {
                localStorage.setItem('theme', 'dark');
                themeToggle.innerText = '☀️';
            } else {
                localStorage.setItem('theme', 'light');
                themeToggle.innerText = '🌙';
            }
        });
    }
    
    // 5. Masonry Grid Calculations
    // Recalculate grid on resize
    window.addEventListener("resize", resizeAllGridItems);
}

/* --- Masonry Grid Logic --- */
function resizeGridItem(item) {
    const grid = document.querySelector(".masonry-grid");
    if (!grid) return;

    const rowHeight = parseInt(window.getComputedStyle(grid).getPropertyValue('grid-auto-rows'));
    const rowGap = parseInt(window.getComputedStyle(grid).getPropertyValue('gap').split(' ')[0]) || 0;
    
    // We need the height of the content (image + meta)
    // We target the first child (image-holder) and the meta-holder
    const imgHolder = item.querySelector('.image-holder');
    const metaHolder = item.querySelector('.meta-holder');
    
    if(!imgHolder) return;

    // Calculate total height needed
    let contentHeight = imgHolder.getBoundingClientRect().height;
    if (metaHolder) contentHeight += metaHolder.getBoundingClientRect().height;
    
    // Add a tiny buffer for margin-bottom visual included in the item
    contentHeight += 10; 

    // Calculate how many rows to span
    // Formula: span = ceil( (height + gap) / (rowHeight + gap) )
    const rowSpan = Math.ceil((contentHeight + rowGap) / (rowHeight + rowGap));
    
    item.style.gridRowEnd = "span " + rowSpan;
}

function resizeAllGridItems() {
    const allItems = document.getElementsByClassName("grid-item");
    for (let x = 0; x < allItems.length; x++) {
        resizeGridItem(allItems[x]);
    }
}

// Window Load ensures images are dimensioned before we calculate
window.addEventListener("load", resizeAllGridItems);


/* --- Back to Top --- */
const backToTopBtn = document.getElementById('back-to-top');
if (backToTopBtn) {
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) backToTopBtn.classList.add('visible');
        else backToTopBtn.classList.remove('visible');
    });
    backToTopBtn.addEventListener('click', (e) => {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

/* --- Lightbox --- */
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const closeBtn = document.querySelector('.lightbox-close');

window.openLightbox = function(src) {
    if (carouselInterval) clearInterval(carouselInterval);
    const oldPalette = document.getElementById('palette-container');
    if (oldPalette) oldPalette.remove();
    const oldLoc = document.getElementById('lightbox-location');
    if (oldLoc) oldLoc.remove();

    lightboxImg.src = src;
    
    // Palette
    const paletteContainer = document.createElement('div');
    paletteContainer.id = 'palette-container';
    lightbox.appendChild(paletteContainer);

    // Location
    const filename = src.split('/').pop();
    if (filename.includes('--')) {
        const parts = filename.split('--');
        if (parts.length > 1) {
            let coordsRaw = parts[parts.length - 1];
            coordsRaw = coordsRaw.replace(/\.(jpg|jpeg|png|webp|gif)$/i, "");
            const latLon = coordsRaw.split('_');
            if (latLon.length >= 2) {
                const lat = latLon[0];
                const lon = latLon[1];
                const locDiv = document.createElement('div');
                locDiv.id = 'lightbox-location';
                Object.assign(locDiv.style, {
                    position: 'absolute', bottom: '20px', left: '20px',
                    color: '#fff', background: 'rgba(0,0,0,0.6)',
                    padding: '8px 12px', borderRadius: '4px',
                    fontSize: '0.85rem', cursor: 'pointer', zIndex: '1002'
                });
                locDiv.innerHTML = `📍 ${lat}, ${lon}`;
                locDiv.onclick = (e) => {
                    e.stopPropagation();
                    window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lon}`, '_blank');
                };
                lightbox.appendChild(locDiv);
            }
        }
    }

    const extractColors = () => {
        try {
            const colors = colorThief.getPalette(lightboxImg, 5);
            colors.forEach(color => {
                const swatch = document.createElement('div');
                swatch.className = 'color-swatch';
                swatch.style.backgroundColor = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
                paletteContainer.appendChild(swatch);
            });
        } catch (e) { }
    };

    if (lightboxImg.complete) extractColors();
    else lightboxImg.onload = extractColors;

    lightbox.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
};

if (closeBtn) closeBtn.onclick = closeLightbox;
if (lightbox) lightbox.onclick = (e) => { if (e.target === lightbox) closeLightbox(); };

function closeLightbox() {
    lightbox.classList.add('hidden');
    document.body.style.overflow = '';
    setTimeout(() => { lightboxImg.src = ''; }, 300);
    if (document.getElementById('carousel')) startCarousel();
}

// Carousel Functions
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
    if(carousel) {
        carousel.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].screenX; }, {passive: true});
        carousel.addEventListener('touchend', e => {
            touchEndX = e.changedTouches[0].screenX;
            if (touchEndX < touchStartX - 50) moveSlide(1);
            if (touchEndX > touchStartX + 50) moveSlide(-1);
        }, {passive: true});
    }
}
