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
    window.addEventListener("resize", resizeAllGridItems);
}

/* --- Keyboard Navigation --- */
document.addEventListener('keydown', function(e) {
    const lightbox = document.getElementById('lightbox');
    const isLightboxOpen = lightbox && !lightbox.classList.contains('hidden');

    if (isLightboxOpen) {
        if (e.key === 'ArrowLeft') navigateLightbox(-1);
        if (e.key === 'ArrowRight') navigateLightbox(1);
        if (e.key === 'Escape') closeLightbox();
    } else if (document.getElementById('carousel')) {
        if (e.key === 'ArrowLeft') moveSlide(-1);
        if (e.key === 'ArrowRight') moveSlide(1);
    }
});

/* --- Masonry Grid Logic --- */
function resizeGridItem(item) {
    const grid = document.querySelector(".masonry-grid");
    if (!grid) return;
    const rowHeight = parseInt(window.getComputedStyle(grid).getPropertyValue('grid-auto-rows'));
    const rowGap = parseInt(window.getComputedStyle(grid).getPropertyValue('gap').split(' ')[0]) || 0;
    const imgHolder = item.querySelector('.image-holder');
    const metaHolder = item.querySelector('.meta-holder');
    if(!imgHolder) return;
    let contentHeight = imgHolder.getBoundingClientRect().height;
    if (metaHolder) contentHeight += metaHolder.getBoundingClientRect().height;
    contentHeight += 10; 
    const rowSpan = Math.ceil((contentHeight + rowGap) / (rowHeight + rowGap));
    item.style.gridRowEnd = "span " + rowSpan;
}

function resizeAllGridItems() {
    const allItems = document.getElementsByClassName("grid-item");
    for (let x = 0; x < allItems.length; x++) {
        resizeGridItem(allItems[x]);
    }
}
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
    
    // Clear old dynamic elements
    ['palette-container', 'lightbox-location', 'lightbox-details'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.remove();
    });

    lightboxImg.src = src;
    
    // Decode Filename for Info
    const filename = src.split('/').pop();
    
    // Structure: Date-Camera_ISO_Aperture_Shutter--Coords.jpg
    // 1. Tech Specs
    const parts = filename.split('--');
    const namePart = parts[0];
    
    // Ensure we have enough data (Date is 15 chars + 1 hyphen = 16)
    if (namePart.length > 16) {
        // Remove date "YYYYMMDD_HHMMSS-"
        const techString = namePart.substring(16); 
        const techInfo = techString.split('_');
        
        // We expect at least 4 parts: Camera (can be multiple words), ISO, Aperture, Shutter
        if (techInfo.length >= 4) {
            let shutter = techInfo.pop();
            let aperture = techInfo.pop();
            let iso = techInfo.pop();
            let camera = techInfo.join(' '); // Join remaining parts as Camera Name

            // Format values
            shutter = shutter.replace('1-', '1/') + ' s';
            aperture = 'f/' + aperture;
            iso = 'ISO ' + iso;

            const detailsDiv = document.createElement('div');
            detailsDiv.id = 'lightbox-details';
            detailsDiv.innerHTML = `<span>📷 ${camera}</span> <span>${iso}</span> <span>${aperture}</span> <span>${shutter}</span>`;
            lightbox.appendChild(detailsDiv);
        }
    }

    // 2. Palette extraction
    const paletteContainer = document.createElement('div');
    paletteContainer.id = 'palette-container';
    lightbox.appendChild(paletteContainer);

    // 3. Location extraction
    if (parts.length > 1) {
        let coordsRaw = parts[parts.length - 1].replace(/\.(jpg|jpeg|png|webp|gif)$/i, "");
        const latLon = coordsRaw.split('_');
        if (latLon.length >= 2) {
            const lat = latLon[0]; const lon = latLon[1];
            const locDiv = document.createElement('div');
            locDiv.id = 'lightbox-location';
            locDiv.innerHTML = `📍 ${lat}, ${lon}`;
            locDiv.onclick = (e) => {
                e.stopPropagation();
                window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lon}`, '_blank');
            };
            lightbox.appendChild(locDiv);
        }
    }

    const extractColors = () => {
        try {
            const colors = colorThief.getPalette(lightboxImg
