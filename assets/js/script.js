// Global State
let carouselInterval;
let touchStartX = 0;
let touchEndX = 0;
let logoRotation = 0;
const colorThief = new ColorThief();

document.addEventListener('DOMContentLoaded', init);

function init() {
    setupLayoutSwitcher();
    setupArchiveControls();

    // 1. Mobile Menu & Collections Popover
    const toggle = document.getElementById('menu-toggle');
    const nav = document.getElementById('nav-links');
    const collectionsDropdown = document.getElementById('collections-dropdown');
    const collectionsToggle = document.getElementById('collections-toggle');
    const siteHeader = document.querySelector('.site-header');

    const closeMobileMenu = () => {
        if (nav) nav.classList.remove('active');
        if (toggle) {
            toggle.classList.remove('open');
            toggle.setAttribute('aria-expanded', 'false');
        }
    };

    const closeCollectionsMenu = () => {
        if (collectionsDropdown) collectionsDropdown.classList.remove('open');
        if (collectionsToggle) collectionsToggle.setAttribute('aria-expanded', 'false');
    };

    if (toggle && nav) {
        toggle.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = nav.classList.toggle('active');
            toggle.classList.toggle('open', isOpen);
            toggle.setAttribute('aria-expanded', String(isOpen));
            if (!isOpen) closeCollectionsMenu();
        });
    }

    if (collectionsDropdown && collectionsToggle) {
        collectionsToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = collectionsDropdown.classList.toggle('open');
            collectionsToggle.setAttribute('aria-expanded', String(isOpen));
        });
    }

    if (nav) {
        nav.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (link && link.id !== 'theme-toggle') {
                closeMobileMenu();
                closeCollectionsMenu();
            }
        });
    }

    document.addEventListener('click', (e) => {
        if (siteHeader && !siteHeader.contains(e.target)) {
            closeMobileMenu();
            closeCollectionsMenu();
        } else if (collectionsDropdown && !collectionsDropdown.contains(e.target)) {
            closeCollectionsMenu();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeCollectionsMenu();
            closeMobileMenu();
        }
    });

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
        initDynamicCarousel();
        startCarousel();
        setupSwipe();
    }

    // 4. Dark Mode
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;

    const syncThemeIcon = () => {
        if (!themeToggle) return;
        const isDark = body.classList.contains('dark-mode');
        themeToggle.textContent = isDark ? '☀' : '🌙';
        themeToggle.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
        themeToggle.setAttribute('title', isDark ? 'Switch to light mode' : 'Switch to dark mode');
    };

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        body.classList.remove('dark-mode');
    } else if (savedTheme === 'dark') {
        body.classList.add('dark-mode');
    }
    syncThemeIcon();

    if (themeToggle) {
        themeToggle.addEventListener('click', (e) => {
            e.preventDefault();
            body.classList.toggle('dark-mode');
            localStorage.setItem('theme', body.classList.contains('dark-mode') ? 'dark' : 'light');
            syncThemeIcon();
        });
    }
}

/* --- Layout Switcher --- */
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
        feed.classList.remove('layout-list', 'layout-grid');
        feed.classList.add(`layout-${mode}`);
        
        btnList.classList.toggle('active', mode === 'list');
        btnGrid.classList.toggle('active', mode === 'grid');
        
        localStorage.setItem('layoutPreference', mode);
    }
}

/* --- Archive Filter & Sort Controls --- */
function setupArchiveControls() {
    const controls = document.getElementById('archive-controls');
    const feed = document.getElementById('gallery-feed');
    if (!controls || !feed) return;

    const itemEls = Array.from(feed.querySelectorAll('.gallery-item'));
    if (!itemEls.length) return;

    const items = itemEls.map(el => ({
        el,
        camera: (el.dataset.camera || '').trim().toLowerCase(),
        collection: (el.dataset.collection || '').trim().toLowerCase(),
        year: (el.dataset.year || '').trim(),
        date: (el.dataset.date || '').trim()
    }));

    const cameras = Array.from(new Set(items.map(i => i.camera).filter(Boolean))).sort();
    const collections = Array.from(new Set(items.map(i => i.collection).filter(Boolean))).sort();
    const years = Array.from(new Set(items.map(i => i.year).filter(Boolean))).sort((a, b) => b.localeCompare(a));

    const state = {
        camera: 'all',
        collection: 'all',
        year: 'all',
        sort: 'newest'
    };

    const cameraContainer = document.getElementById('filter-camera');
    const collectionContainer = document.getElementById('filter-collection');
    const yearContainer = document.getElementById('filter-year');
    const sortContainer = document.getElementById('sort-order');
    const countBadge = document.getElementById('archive-count-badge');
    const resetBtn = document.getElementById('archive-reset');
    const emptyState = document.getElementById('archive-empty');
    const emptyResetBtn = document.getElementById('archive-empty-reset');

    function matchesFilters(item, excludeGroup = null) {
        if (excludeGroup !== 'camera' && state.camera !== 'all' && item.camera !== state.camera) return false;
        if (excludeGroup !== 'collection' && state.collection !== 'all' && item.collection !== state.collection) return false;
        if (excludeGroup !== 'year' && state.year !== 'all' && item.year !== state.year) return false;
        return true;
    }

    function createChip(group, value, label) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `filter-chip${value === 'all' ? ' active' : ''}`;
        btn.dataset.group = group;
        btn.dataset.value = value;
        btn.innerHTML = `<span class="filter-chip-label">${label}</span><span class="filter-count">0</span>`;
        btn.addEventListener('click', () => {
            state[group] = value;
            const siblings = btn.parentElement.querySelectorAll('.filter-chip');
            siblings.forEach(s => s.classList.toggle('active', s === btn));
            applyFiltersAndSort();
        });
        return btn;
    }

    function populateGroup(container, group, values) {
        if (!container) return;
        container.innerHTML = '';
        container.appendChild(createChip(group, 'all', 'all'));
        values.forEach(val => container.appendChild(createChip(group, val, val)));
    }

    populateGroup(cameraContainer, 'camera', cameras);
    populateGroup(collectionContainer, 'collection', collections);
    populateGroup(yearContainer, 'year', years);

    if (sortContainer) {
        sortContainer.querySelectorAll('.filter-chip').forEach(btn => {
            btn.addEventListener('click', () => {
                state.sort = btn.dataset.sort;
                sortContainer.querySelectorAll('.filter-chip').forEach(s => s.classList.toggle('active', s === btn));
                applyFiltersAndSort();
            });
        });
    }

    function resetAll() {
        state.camera = 'all';
        state.collection = 'all';
        state.year = 'all';
        state.sort = 'newest';

        controls.querySelectorAll('.filter-options').forEach(groupEl => {
            const chips = groupEl.querySelectorAll('.filter-chip');
            chips.forEach((chip, idx) => chip.classList.toggle('active', idx === 0));
        });

        applyFiltersAndSort();
    }

    if (resetBtn) resetBtn.addEventListener('click', resetAll);
    if (emptyResetBtn) emptyResetBtn.addEventListener('click', resetAll);

    function updateGroupCounts(container, group) {
        if (!container) return;
        const baseItems = items.filter(item => matchesFilters(item, group));
        container.querySelectorAll('.filter-chip').forEach(chip => {
            const val = chip.dataset.value;
            const count = val === 'all'
                ? baseItems.length
                : baseItems.filter(item => item[group] === val).length;
            const countEl = chip.querySelector('.filter-count');
            if (countEl) countEl.textContent = count;
            chip.classList.toggle('is-empty', count === 0 && !chip.classList.contains('active'));
        });
    }

    function applyFiltersAndSort() {
        const sorted = [...items].sort((a, b) => {
            return state.sort === 'oldest'
                ? a.date.localeCompare(b.date)
                : b.date.localeCompare(a.date);
        });

        let visibleCount = 0;
        const fragment = document.createDocumentFragment();

        sorted.forEach(item => {
            const isVisible = matchesFilters(item);
            item.el.classList.toggle('is-filtered-out', !isVisible);
            if (isVisible) visibleCount++;
            fragment.appendChild(item.el);
        });

        feed.appendChild(fragment);

        const isFiltered = state.camera !== 'all' || state.collection !== 'all' || state.year !== 'all';
        const isModified = isFiltered || state.sort !== 'newest';

        if (countBadge) {
            countBadge.textContent = isFiltered
                ? `${visibleCount} of ${items.length} photos`
                : `${items.length} photos`;
        }
        if (resetBtn) resetBtn.classList.toggle('hidden', !isModified);
        if (emptyState) emptyState.classList.toggle('hidden', visibleCount > 0);

        updateGroupCounts(cameraContainer, 'camera');
        updateGroupCounts(collectionContainer, 'collection');
        updateGroupCounts(yearContainer, 'year');
    }

    applyFiltersAndSort();
}


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
const preloadedLightboxUrls = new Set();
let currentLightboxSrc = '';
let lightboxToastTimer = null;
let lightboxTouchStartX = 0;
let lightboxTouchStartY = 0;

function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('');
}

function copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
        return navigator.clipboard.writeText(text);
    }
    return new Promise((resolve, reject) => {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try {
            document.execCommand('copy');
            resolve();
        } catch (err) {
            reject(err);
        } finally {
            ta.remove();
        }
    });
}

function showLightboxToast(message, hexColor) {
    if (!lightbox) return;
    let toast = document.getElementById('lightbox-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'lightbox-toast';
        toast.className = 'lightbox-toast';
        toast.setAttribute('aria-live', 'polite');
        lightbox.appendChild(toast);
    }

    toast.innerHTML = '';
    if (hexColor) {
        const dot = document.createElement('span');
        dot.className = 'lightbox-toast-dot';
        dot.style.backgroundColor = hexColor;
        toast.appendChild(dot);
    }
    const label = document.createElement('span');
    label.textContent = message;
    toast.appendChild(label);

    toast.classList.add('visible');
    if (lightboxToastTimer) clearTimeout(lightboxToastTimer);
    lightboxToastTimer = setTimeout(() => {
        toast.classList.remove('visible');
    }, 1800);
}

function getLightboxPlaylist() {
    if (Array.isArray(window.lightboxImages) && window.lightboxImages.length > 0) {
        return window.lightboxImages;
    }

    const frames = Array.from(document.querySelectorAll('.gallery-item:not(.is-filtered-out) .media-frame'));
    if (frames.length > 0) {
        const urls = frames.map(frame => {
            if (frame.dataset && frame.dataset.src) return frame.dataset.src;
            const attr = frame.getAttribute('onclick') || '';
            const match = attr.match(/openLightbox\('([^']+)'\)/);
            return match ? match[1] : null;
        }).filter(Boolean);
        if (urls.length > 0) return urls;
    }

    const carouselImgs = Array.from(document.querySelectorAll('.carousel-img[data-original]'));
    if (carouselImgs.length > 0) {
        return carouselImgs.map(img => img.dataset.original).filter(Boolean);
    }

    return [];
}

function findLightboxIndex(playlist, targetSrc) {
    if (!targetSrc || playlist.length === 0) return -1;
    let idx = playlist.indexOf(targetSrc);
    if (idx !== -1) return idx;
    const decodedTarget = decodeURIComponent(targetSrc);
    return playlist.findIndex(url => decodeURIComponent(url) === decodedTarget || url.includes(targetSrc) || targetSrc.includes(url));
}

function preloadAdjacentImages(playlist, currentIndex) {
    if (playlist.length <= 1 || currentIndex === -1) return;
    const nextIdx = (currentIndex + 1) % playlist.length;
    const prevIdx = (currentIndex - 1 + playlist.length) % playlist.length;
    [playlist[nextIdx], playlist[prevIdx]].forEach(url => {
        if (url && !preloadedLightboxUrls.has(url)) {
            preloadedLightboxUrls.add(url);
            const preImg = new Image();
            preImg.src = url;
        }
    });
}

function ensureLightboxNavButtons() {
    if (!lightbox) return { prevBtn: null, nextBtn: null };
    let prevBtn = lightbox.querySelector('.lightbox-nav.prev');
    let nextBtn = lightbox.querySelector('.lightbox-nav.next');

    if (!prevBtn) {
        prevBtn = document.createElement('button');
        prevBtn.type = 'button';
        prevBtn.className = 'lightbox-nav prev';
        prevBtn.setAttribute('aria-label', 'Previous photo');
        prevBtn.innerHTML = '&#10094;';
        lightbox.appendChild(prevBtn);
    }
    if (!nextBtn) {
        nextBtn = document.createElement('button');
        nextBtn.type = 'button';
        nextBtn.className = 'lightbox-nav next';
        nextBtn.setAttribute('aria-label', 'Next photo');
        nextBtn.innerHTML = '&#10095;';
        lightbox.appendChild(nextBtn);
    }

    return { prevBtn, nextBtn };
}

const { prevBtn: lightboxPrevBtn, nextBtn: lightboxNextBtn } = ensureLightboxNavButtons();
if (lightboxPrevBtn) {
    lightboxPrevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        navigateLightbox(-1);
    });
}
if (lightboxNextBtn) {
    lightboxNextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        navigateLightbox(1);
    });
}

if (lightbox) {
    lightbox.addEventListener('touchstart', (e) => {
        if (e.changedTouches && e.changedTouches.length > 0) {
            lightboxTouchStartX = e.changedTouches[0].screenX;
            lightboxTouchStartY = e.changedTouches[0].screenY;
        }
    }, { passive: true });

    lightbox.addEventListener('touchend', (e) => {
        if (lightbox.classList.contains('hidden') || !e.changedTouches || e.changedTouches.length === 0) return;
        const dx = e.changedTouches[0].screenX - lightboxTouchStartX;
        const dy = e.changedTouches[0].screenY - lightboxTouchStartY;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
            if (dx < 0) navigateLightbox(1);
            else navigateLightbox(-1);
        }
    }, { passive: true });
}

window.openLightbox = function(src) {
    if (!lightbox || !lightboxImg) return;
    if (carouselInterval) clearInterval(carouselInterval);

    currentLightboxSrc = src;

    // Clear previous details & ambient glow
    ['palette-container', 'lightbox-location', 'lightbox-details'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.remove();
    });
    lightbox.classList.remove('has-glow');
    lightbox.style.removeProperty('--lightbox-glow-rgb');

    // Update nav visibility and preload adjacent images
    const playlist = getLightboxPlaylist();
    const hasMultiple = playlist.length > 1;
    if (lightboxPrevBtn) lightboxPrevBtn.style.display = hasMultiple ? 'flex' : 'none';
    if (lightboxNextBtn) lightboxNextBtn.style.display = hasMultiple ? 'flex' : 'none';
    if (hasMultiple) {
        const currentIndex = findLightboxIndex(playlist, src);
        preloadAdjacentImages(playlist, currentIndex);
    }

    let colorsExtracted = false;
    const extractColors = () => {
        if (colorsExtracted || !lightboxImg.naturalWidth) return;
        colorsExtracted = true;
        try {
            const colors = colorThief.getPalette(lightboxImg, 5);
            let dominant = null;
            try {
                dominant = colorThief.getColor(lightboxImg);
            } catch (e) {
                dominant = colors && colors.length ? colors[0] : null;
            }
            if (dominant && dominant.length >= 3) {
                lightbox.style.setProperty('--lightbox-glow-rgb', `${dominant[0]}, ${dominant[1]}, ${dominant[2]}`);
                lightbox.classList.add('has-glow');
            }

            if (Array.isArray(colors)) {
                colors.forEach(color => {
                    const hex = rgbToHex(color[0], color[1], color[2]);
                    const swatch = document.createElement('div');
                    swatch.className = 'color-swatch';
                    swatch.style.backgroundColor = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
                    swatch.dataset.hex = hex;
                    swatch.setAttribute('role', 'button');
                    swatch.setAttribute('tabindex', '0');
                    swatch.setAttribute('aria-label', `Copy ${hex}`);

                    const handleCopy = (e) => {
                        e.stopPropagation();
                        copyToClipboard(hex).then(() => {
                            showLightboxToast(`copied ${hex}`, hex);
                        }).catch(() => {
                            showLightboxToast(hex, hex);
                        });
                    };

                    swatch.addEventListener('click', handleCopy);
                    swatch.addEventListener('keydown', (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleCopy(e);
                        }
                    });
                    paletteContainer.appendChild(swatch);
                });
            }
        } catch (e) { }
    };

    lightboxImg.onload = extractColors;
    lightboxImg.src = src;

    const filename = decodeURIComponent(src.split('/').pop());
    const parts = filename.split('--');
    const namePart = parts[0];

    // Metadata Parsing
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

    // Color Palette - INSERTED BEFORE IMAGE
    const paletteContainer = document.createElement('div');
    paletteContainer.id = 'palette-container';
    // This moves the palette above the image
    lightbox.insertBefore(paletteContainer, lightboxImg);

    // GPS Location
    if (parts.length > 1) {
        let coordsRaw = parts[parts.length - 1].replace(/\.(jpg|jpeg|png|webp|gif)$/i, "");
        const latLon = coordsRaw.split('_');
        if (latLon.length >= 2) {
            const lat = latLon[0];
            const lon = latLon[1];

            const locDiv = document.createElement('div');
            locDiv.id = 'lightbox-location';
            locDiv.innerHTML = `📍 ${lat}, ${lon}`;
            locDiv.onclick = (e) => {
                e.stopPropagation();
                // Fixed URL to standard Google Maps format
                window.open(`https://www.google.com/maps?q=${lat},${lon}`, '_blank');
            };
            lightbox.appendChild(locDiv);
        }
    }

    if (lightboxImg.complete && lightboxImg.naturalWidth > 0) extractColors();

    lightbox.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
};

function navigateLightbox(dir) {
    const playlist = getLightboxPlaylist();
    if (playlist.length <= 1) return;

    const currentSrc = currentLightboxSrc || (lightboxImg ? lightboxImg.getAttribute('src') : '');
    const currentIndex = findLightboxIndex(playlist, currentSrc);

    if (currentIndex !== -1) {
        let nextIndex = (currentIndex + dir + playlist.length) % playlist.length;
        openLightbox(playlist[nextIndex]);
    }
}

document.addEventListener('keydown', function(e) {
    const lb = document.getElementById('lightbox');
    const isLightboxOpen = lb && !lb.classList.contains('hidden');
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
    if (!lightbox) return;
    lightbox.classList.add('hidden');
    lightbox.classList.remove('has-glow');
    lightbox.style.removeProperty('--lightbox-glow-rgb');
    const toast = document.getElementById('lightbox-toast');
    if (toast) toast.classList.remove('visible');
    document.body.style.overflow = '';
    setTimeout(() => {
        if (lightbox.classList.contains('hidden')) {
            lightboxImg.src = '';
            currentLightboxSrc = '';
        }
    }, 300);
    if (document.getElementById('carousel')) startCarousel();
}

/* --- Dynamic Carousel --- */
let carouselSlidesData = [];
let currentCarouselIndex = 0;
const CAROUSEL_DURATION_MS = 5000;

function initDynamicCarousel() {
    if (typeof allGalleryImages === 'undefined' || allGalleryImages.length === 0) return;

    const pool = [...allGalleryImages];
    for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    carouselSlidesData = pool.slice(0, 5);
    currentCarouselIndex = 0;

    const carousel = document.getElementById('carousel');
    const prevNav = carousel.querySelector('.prev');
    const progressContainer = document.getElementById('carousel-progress');

    if (progressContainer) progressContainer.innerHTML = '';

    carouselSlidesData.forEach((imgData, index) => {
        const slide = document.createElement('div');
        slide.className = `carousel-slide ${index === 0 ? 'active' : ''}`;

        const bg = document.createElement('div');
        bg.className = 'carousel-bg';
        bg.style.backgroundImage = `url('${imgData.original}')`;

        const img = document.createElement('img');
        img.className = 'carousel-img';
        img.src = imgData.resized;
        img.dataset.original = imgData.original;
        img.alt = imgData.collection ? `${imgData.collection} — featured photo` : 'featured photo';
        img.style.cursor = 'pointer';
        img.onclick = () => openLightbox(imgData.original);

        slide.appendChild(bg);
        slide.appendChild(img);

        carousel.insertBefore(slide, prevNav);

        if (progressContainer) {
            const seg = document.createElement('button');
            seg.type = 'button';
            seg.className = 'progress-segment';
            seg.setAttribute('aria-label', `Go to slide ${index + 1}`);
            seg.innerHTML = '<span class="progress-fill"></span>';
            seg.onclick = () => goToSlide(index);
            progressContainer.appendChild(seg);
        }
    });

    updateCarouselHUD(0);
}

function updateCarouselHUD(index) {
    const data = carouselSlidesData[index];
    if (!data) return;

    const collectionEl = document.getElementById('carousel-collection');
    const exifEl = document.getElementById('carousel-exif');
    const counterEl = document.getElementById('carousel-counter');
    const dateEl = document.getElementById('carousel-date');

    if (collectionEl) {
        if (data.collection) {
            collectionEl.textContent = data.collection;
            collectionEl.href = data.collectionUrl || '#';
            collectionEl.style.display = 'inline-flex';
        } else {
            collectionEl.style.display = 'none';
        }
    }

    if (exifEl) {
        exifEl.textContent = data.exif || '';
        exifEl.style.display = data.exif ? 'block' : 'none';
    }

    if (counterEl) {
        const cur = String(index + 1).padStart(2, '0');
        const tot = String(carouselSlidesData.length).padStart(2, '0');
        counterEl.textContent = `${cur} / ${tot}`;
    }

    if (dateEl) {
        dateEl.textContent = data.date || '';
    }

    const segments = document.querySelectorAll('#carousel-progress .progress-segment');
    segments.forEach((seg, i) => {
        seg.classList.remove('active', 'completed');
        if (i < index) {
            seg.classList.add('completed');
        } else if (i === index) {
            void seg.offsetWidth; // Force reflow so progress animation restarts cleanly
            seg.classList.add('active');
        }
    });
}

function startCarousel() {
    if (carouselInterval) clearInterval(carouselInterval);
    const segments = document.querySelectorAll('#carousel-progress .progress-segment');
    segments.forEach((seg, i) => {
        if (i === currentCarouselIndex) {
            seg.classList.remove('active');
            void seg.offsetWidth;
            seg.classList.add('active');
        }
    });
    carouselInterval = setInterval(() => moveSlide(1), CAROUSEL_DURATION_MS);
}

window.goToSlide = function(targetIndex) {
    const slides = document.querySelectorAll('.carousel-slide');
    if (!slides.length) return;

    slides.forEach(slide => slide.classList.remove('active'));
    currentCarouselIndex = ((targetIndex % slides.length) + slides.length) % slides.length;
    slides[currentCarouselIndex].classList.add('active');

    updateCarouselHUD(currentCarouselIndex);
    startCarousel();
};

window.moveSlide = function(direction) {
    const slides = document.querySelectorAll('.carousel-slide');
    if (!slides.length) return;
    goToSlide(currentCarouselIndex + direction);
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
