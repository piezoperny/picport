// Global State
let carouselInterval;
let touchStartX = 0;
let touchEndX = 0;
let logoRotation = 0;
const colorThief = new ColorThief();

document.addEventListener('DOMContentLoaded', init);

function init() {
    setupLayoutSwitcher(); // New Layout Logic

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
        if(themeToggle) themeToggle.innerText = '☀';
    }
    if (themeToggle) {
        themeToggle.addEventListener('click', (e) => {
            e.preventDefault();
            body.classList.toggle('dark-mode');
            if (body.classList.contains('dark-mode')) {
                localStorage.setItem('theme', 'dark');
                themeToggle.innerText = '☀';
            } else {
                localStorage.setItem('theme', 'light');
                themeToggle.innerText = '🌙';
            }
        });
    }

    // 5. Masonry Grid Calculations (Run initially if we are in grid mode)
    window.addEventListener("resize", resizeAllGridItems);
}

/* --- Layout Switcher (List vs Grid) --- */
function setupLayoutSwitcher() {
    const feed = document.getElementById('gallery-feed');
    const btnList = document.getElementById('btn-list');
    const btnGrid = document.getElementById('btn-grid');
    
    if (!feed || !btnList || !btnGrid) return;

    // Load saved preference
    const savedLayout = localStorage.getItem('layoutPreference') || 'list';
    setLayout(savedLayout);

    btnList.addEventListener('click', () => setLayout('list'));
    btnGrid.addEventListener('click', () => setLayout('grid'));

    function setLayout(mode) {
        // Update Classes
        feed.classList.remove('layout-list', 'layout-grid');
        feed.classList.add(`layout-${mode}`);
        
        // Update Buttons
        btnList.classList.toggle('active', mode === 'list');
        btnGrid.classList.toggle('active', mode === 'grid');
        
        // Save
        localStorage.setItem('layoutPreference', mode);

        // Handle Masonry Logic
        if (mode === 'grid') {
            // Wait for transition or immediate render
            setTimeout(resizeAllGridItems, 50);
        } else {
            // Clear masonry styles
            const items = document.querySelectorAll('.gallery-item');
            items.forEach(item => item.style.removeProperty('grid-row-end'));
        }
    }
}

/* --- Masonry Grid Logic --- */
function resizeGridItem(item) {
    const grid = document.querySelector(".layout-grid"); // Only apply if grid class exists
    if (!grid) return;
    
    const rowHeight = parseInt(window.getComputedStyle(grid).getPropertyValue('grid-auto-rows'));
    const rowGap = parseInt(window.getComputedStyle(grid).getPropertyValue('gap').split(' ')[0]) || 0;
    
    // We need to calculate height of content inside the item
    // In grid mode, the content is just children height + padding
    const rowSpan = Math.ceil((item.getBoundingClientRect().height + rowGap) / (rowHeight + rowGap));
    item.style.gridRowEnd = "span " + rowSpan;
}

function resizeAllGridItems() {
    // Only resize if we are in grid mode
    if (!document.querySelector('.layout-grid')) return;
    
    const allItems = document.getElementsByClassName("gallery-item");
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
    const filename = decodeURIComponent(src.split('/').pop());
    const parts = filename.split('--');
    const namePart = parts[0];
    
    if (namePart.length > 16) {
        const techString = namePart.substring(16); 
        const techInfo = techString.split('_');
        
        if (techInfo.length >= 4) {
            let shutter = techInfo.pop();
            let aperture = techInfo.pop();
            let iso = techInfo.pop();
            let camera = techInfo.join(' '); 

            shutter = shutter.replace('1-', '1/') + ' s';
            aperture = 'f/' + aperture;
            iso = 'iso ' + iso;
            camera = '📷 ' + camera;

            const finalString = `${camera} • ${iso} • ${aperture} • ${shutter}`.toLowerCase();

            const detailsDiv = document.createElement('div');
            detailsDiv.id = 'lightbox-details';
            detailsDiv.innerHTML = `<span>${finalString}</span>`;
            lightbox.appendChild(detailsDiv);
        }
    }

    const paletteContainer = document.createElement('div');
    paletteContainer.id = 'palette-container';
    lightbox.appendChild(paletteContainer);

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
                window.open(`http://googleusercontent.com/maps.google.com/${lat},${lon}`, '_blank');
            };
            lightbox.appendChild(locDiv);
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

function navigateLightbox(dir) {
    // Look for images inside the unified gallery items
    const imgs = Array.from(document.querySelectorAll('.gallery-item img'));
    const currentSrc = lightboxImg.getAttribute('src');
    
    // Find index of image that matches current source
    // Note: The img tag inside media-frame doesn't have onclick, the wrapper does.
    // So we match by src directly.
    let currentIndex = imgs.findIndex(img => img.src.includes(currentSrc) || currentSrc.includes(img.src));
    
    // Fallback if src match is tricky due to relative/absolute paths
    if (currentIndex === -1) {
         // Try to find via wrapper onclick
         const wrappers = Array.from(document.querySelectorAll('.media-frame'));
         currentIndex = wrappers.findIndex(div => {
             const attr = div.getAttribute('onclick');
             return attr && attr.includes(currentSrc);
         });
    }

    if (currentIndex !== -1) {
        let nextIndex = currentIndex + dir;
        if (nextIndex >= imgs.length) nextIndex = 0;
        if (nextIndex < 0) nextIndex = imgs.length - 1;
        
        // Find the wrapper of the next image to get the onclick link
        const nextImg = imgs[nextIndex];
        const wrapper = nextImg.closest('.media-frame');
        
        if (wrapper) {
            const match = wrapper.getAttribute('onclick').match(/openLightbox\('([^']+)'\)/);
            if (match && match[1]) {
                openLightbox(match[1]);
            }
        }
    }
}

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
};
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
