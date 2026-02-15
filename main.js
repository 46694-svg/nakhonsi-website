class NakhonSiApp {
    constructor() {
        this.init();
    }

    async init() {
        console.log('🚀 NakhonSiApp Initializing...');

        // Modules
        this.ui = new UIManager();
        this.navigation = new NavigationManager();
        this.favorites = new FavoritesManager();

        // Initialize based on current page
        this.route();

        // Reveal content
        window.addEventListener('load', () => this.ui.revealContent());
    }

    route() {
        const path = window.location.pathname;
        if (path.includes('explore-map')) {
            new MapManager();
        } else if (path.includes('destination/')) {
            new LightboxManager();
        }
    }
}

/**
 * Manages Local Favorites with State Sync
 */
class FavoritesManager {
    constructor() {
        this.storageKey = 'nakhonSi_favorites';
        this.favorites = this.load();
        this.initUI();
    }

    load() {
        return JSON.parse(localStorage.getItem(this.storageKey)) || [];
    }

    save() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.favorites));
    }

    toggle(id) {
        const index = this.favorites.indexOf(id);
        const isAdded = index === -1;

        if (isAdded) {
            this.favorites.push(id);
        } else {
            this.favorites.splice(index, 1);
        }

        this.save();
        this.updateButtons(id, isAdded);
        return isAdded;
    }

    initUI() {
        // Find all cards or detail buttons
        document.querySelectorAll('[data-fav-id], #add-favorite-detail').forEach(btn => {
            const id = btn.dataset.favId || this.getCurrentDestinationId();
            if (!id) return;

            const isFav = this.favorites.includes(id);
            this.updateButtonStyle(btn, isFav);

            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.toggle(id);
            });
        });

        // Filter functionality
        const filterBtn = document.getElementById('filter-favorites');
        if (filterBtn) {
            filterBtn.addEventListener('click', () => {
                filterBtn.classList.toggle('active');
                this.applyFilter(filterBtn.classList.contains('active'));
            });
        }
    }

    getCurrentDestinationId() {
        const path = window.location.pathname;
        const match = path.match(/destination(\d+)\.html/);
        return match ? match[1] : null;
    }

    updateButtons(id, isFav) {
        document.querySelectorAll(`[data-fav-id="${id}"]`).forEach(btn => {
            this.updateButtonStyle(btn, isFav);
        });
        // Check detail page button
        const detailBtn = document.getElementById('add-favorite-detail');
        if (detailBtn && this.getCurrentDestinationId() === id) {
            this.updateButtonStyle(detailBtn, isFav);
        }
    }

    updateButtonStyle(btn, isFav) {
        btn.classList.toggle('active', isFav);
        if (btn.id === 'add-favorite-detail') {
            btn.innerHTML = isFav
                ? 'บันทึกแล้ว ❤️'
                : 'เพิ่มในรายการโปรด 🤍';
            btn.style.display = 'inline-flex';
        }
    }

    updateGlobalCounters() {
        // Concept for future: badge on navbar
    }

    applyFilter(isActive) {
        const cards = document.querySelectorAll('.gallery .card');
        cards.forEach(card => {
            const href = card.getAttribute('href');
            const match = href.match(/destination(\d+)\.html/);
            const id = match ? match[1] : null;

            if (isActive && id && !this.favorites.includes(id)) {
                card.style.display = 'none';
            } else {
                card.style.display = 'flex';
            }
        });
    }
}

/**
 * Handles Global UI Enhancements
 */
class UIManager {
    constructor() {
        this.initLucide();
        this.handleScroll();
    }

    initLucide() {
        if (window.lucide) {
            lucide.createIcons();
        }
    }

    handleScroll() {
        const header = document.querySelector('header');
        if (!header) return;

        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });
    }

    revealContent() {
        document.querySelectorAll('.animate-in').forEach((el, i) => {
            setTimeout(() => {
                el.style.opacity = '1';
                el.classList.add('loaded');
            }, i * 100);
        });
    }
}

/**
 * Manages Navigation States and Generation
 */
class NavigationManager {
    constructor() {
        this.container = document.querySelector('header');
        this.isSubPage = window.location.pathname.includes('/destination/');
        this.render();
        this.updateActiveLink();
    }

    render() {
        if (!this.container) return;

        const basePath = this.isSubPage ? '../' : '';

        this.container.innerHTML = `
            <a href="${basePath}index.html" class="logo">
                <h1>พาเที่ยวนครศรีธรรมราช 🌴</h1>
            </a>
            <nav>
                <a href="${basePath}index.html" class="nav-link" data-path="index.html">
                    <i data-lucide="home"></i>
                    <span>หน้าหลัก</span>
                </a>
                <a href="${basePath}explore-map.html" class="nav-link" data-path="explore-map.html">
                    <i data-lucide="map"></i>
                    <span>สำรวจตามโซน</span>
                </a>
                <a href="${basePath}suggested-routes.html" class="nav-link" data-path="suggested-routes.html">
                    <i data-lucide="route"></i>
                    <span>แผนเที่ยว</span>
                </a>
            </nav>
        `;

        if (window.lucide) lucide.createIcons();
    }

    updateActiveLink() {
        const path = window.location.pathname;
        const links = document.querySelectorAll('.nav-link');
        links.forEach(link => {
            const dataPath = link.dataset.path;
            if (path.endsWith(dataPath) || (path.endsWith('/') && dataPath === 'index.html')) {
                link.classList.add('active');
            }
        });
    }
}

/**
 * Interactive SVG Map Logic
 */
class MapManager {
    constructor() {
        this.init();
    }

    init() {
        const districts = document.querySelectorAll('.map-district');
        const zoneText = document.getElementById('zone-text');
        const zoneHighlights = document.getElementById('zone-highlights');

        const zoneData = {
            'Mountain': {
                desc: 'โซนเทือกเขาและป่าไม้: สัมผัสอากาศดีที่สุดในไทยที่คีรีวง และความยิ่งใหญ่ของเทือกเขาหลวง',
                tags: ['คีรีวง', 'น้ำตกกรุงชิง', 'เขาหลวง']
            },
            'Coastal': {
                desc: 'โซนชายฝั่งทะเล: ชมโลมาสีชมพูที่ขนอม และพักผ่อนที่หาดหินงาม-พลายดำ',
                tags: ['หาดขนอม', 'เขาพลายดำ', 'แหลมตะลุมพุก']
            },
            'City': {
                desc: 'โซนเมืองและประวัติศาสตร์: ไหว้พระธาตุคู่บ้านคู่เมือง และชมกำแพงเมืองเก่าอันศรัทธา',
                tags: ['วัดพระธาตุ', 'เมืองเก่า', 'วัดเจดีย์']
            }
        };

        districts.forEach(d => {
            d.addEventListener('mouseenter', () => {
                const zone = d.dataset.zone;
                const data = zoneData[zone];

                zoneText.style.opacity = '0';
                setTimeout(() => {
                    zoneText.innerHTML = `<strong>${zone}:</strong> ${data.desc}`;
                    zoneText.style.opacity = '1';

                    zoneHighlights.innerHTML = data.tags.map(t =>
                        `<span class="badge">${t}</span>`
                    ).join('');
                }, 150);
            });
        });
    }
}

/**
 * Premium Image Lightbox Manager
 */
class LightboxManager {
    constructor() {
        this.init();
    }

    init() {
        const images = document.querySelectorAll('.detail-img-container img');
        if (images.length === 0) return;

        // Create overlay if not exists
        let overlay = document.getElementById('lightbox-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'lightbox-overlay';
            overlay.className = 'lightbox-overlay';
            overlay.innerHTML = `
                <div class="lightbox-content">
                    <img id="lightbox-img" src="" alt="Full size image">
                    <button class="lightbox-close">&times;</button>
                </div>
            `;
            document.body.appendChild(overlay);
        }

        const closeBtn = overlay.querySelector('.lightbox-close');
        const lbImg = document.getElementById('lightbox-img');

        images.forEach(img => {
            img.addEventListener('click', () => {
                lbImg.src = img.src;
                overlay.classList.add('active');
                document.body.style.overflow = 'hidden';
            });
        });

        const close = () => {
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        };

        closeBtn.addEventListener('click', close);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) close();
        });

        // Escape key support
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') close();
        });
    }
}

// Start Application
new NakhonSiApp();
