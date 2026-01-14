// Universal Stealth Mode 2026 - Content Script
// Handles both YouTube-specific logic and Generic Site ad zapping

const STEALTH_CONFIG = {
    checkInterval: 50,      // Check every 50ms (very aggressive)
    speedupRate: 16.0,      // Max playback rate
    skipText: ['Skip', 'Skip Ad', 'Skip Ads', 'Schließen', 'Saltar', 'Passer', 'Ignora', 'Close'], // Multilanguage support

    // Generic Ad Keywords for Iframe Zapping
    adKeywords: [
        'googleads', 'doubleclick', 'amazon-adsystem', 'adservice',
        'googlesyndication', 'moatads', 'criteo', 'outbrain', 'taboola', 'adroll'
    ]
};

// ============================================
// BASE CLASS
// ============================================
class StealthEngine {
    constructor() {
        this.isEnabled = true;
        this.stats = { skipped: 0, spedUp: 0 };
        this.init();
    }

    init() {
        // Load settings
        chrome.storage.local.get(['enabled'], (result) => {
            this.isEnabled = result.enabled !== false;
        });

        chrome.storage.onChanged.addListener((changes) => {
            if (changes.enabled) this.isEnabled = changes.enabled.newValue;
        });

        this.startProtection();
    }

    startProtection() {
        // Override in subclasses
    }

    updateBadge() {
        // Send stats to background to update badge
        chrome.runtime.sendMessage({
            type: 'updateStats',
            skipped: this.stats.skipped,
            spedUp: this.stats.spedUp
        }).catch(() => { });
    }

    isVisible(elem) {
        if (!elem) return false;
        return !!(elem.offsetWidth || elem.offsetHeight || elem.getClientRects().length);
    }
}

// ============================================
// YOUTUBE SPECIALIST
// ============================================
class YouTubeStealth extends StealthEngine {
    constructor() {
        super();
        this.video = null;
        this.player = null;
        console.log('🥷 Stealth Mode: YouTube Module Engaged');
    }

    startProtection() {
        this.setupNavigationListener();
        this.startLoop();
    }

    startLoop() {
        setInterval(() => {
            if (!this.isEnabled) return;

            this.findElements();
            this.handleVideoAds();
            this.handleOverlayAds();
            this.clickSkipButtons();
            this.nukeAntiAdblock();
        }, STEALTH_CONFIG.checkInterval);
    }

    findElements() {
        this.video = document.querySelector('video.html5-main-video');
        this.player = document.querySelector('#movie_player');
    }

    handleVideoAds() {
        if (!this.video) return;

        const isAd = this.detectAdState();

        if (isAd) {
            // 1. Mute
            if (!this.video.muted) this.video.muted = true;

            // 2. Teleport
            if (isFinite(this.video.duration) && this.video.currentTime < this.video.duration - 0.1) {
                this.video.currentTime = this.video.duration - 0.1;
                this.stats.spedUp++;
            }

            // 3. Hyper-speed
            if (this.video.playbackRate !== STEALTH_CONFIG.speedupRate) {
                this.video.playbackRate = STEALTH_CONFIG.speedupRate;
            }

            // 4. Force play
            if (this.video.paused) {
                this.video.play().catch(() => { });
            }

            this.updateBadge();
        } else {
            // Restore normal state
            if (this.video.playbackRate === STEALTH_CONFIG.speedupRate) {
                this.video.playbackRate = 1.0;
                this.video.muted = false;
            }
        }
    }

    detectAdState() {
        if (!this.player) return false;
        if (this.player.classList.contains('ad-showing')) return true;
        if (this.player.classList.contains('ad-interrupting')) return true;

        const adModule = document.querySelector('.ytp-ad-module');
        if (adModule && adModule.children.length > 0) return true;

        return false;
    }

    clickSkipButtons() {
        // XPath for text matching
        const xpath = `//button[contains(text(), 'Skip') or contains(text(), 'Passer') or contains(text(), 'Saltar')]`;
        const result = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);

        for (let i = 0; i < result.snapshotLength; i++) {
            const btn = result.snapshotItem(i);
            if (this.isVisible(btn)) {
                btn.click();
                this.stats.skipped++;
                this.updateBadge();
            }
        }

        // Fallback selectors
        const classicSelectors = ['.ytp-ad-skip-button', '.ytp-ad-skip-button-modern', '.videoAdUiSkipButton'];
        classicSelectors.forEach(sel => {
            document.querySelectorAll(sel).forEach(btn => {
                if (this.isVisible(btn)) btn.click();
            });
        });
    }

    handleOverlayAds() {
        document.querySelectorAll('.ytp-ad-overlay-container, .ytp-ad-image-overlay').forEach(el => el.style.display = 'none');
        document.querySelectorAll('ytd-ad-slot-renderer').forEach(el => el.remove());
    }

    nukeAntiAdblock() {
        const dialogs = document.querySelectorAll('tp-yt-paper-dialog, .ytd-popup-container');
        dialogs.forEach(dialog => {
            if (dialog.innerText.includes('Ad blockers are not allowed') || dialog.innerText.includes('Terms of Service')) {
                const closeBtn = dialog.querySelector('#dismiss-button, [aria-label="Close"]');
                if (closeBtn) closeBtn.click();
                dialog.remove();
                if (this.video) this.video.play();
                const backdrop = document.querySelector('tp-yt-iron-overlay-backdrop');
                if (backdrop) backdrop.remove();
            }
        });
    }

    setupNavigationListener() {
        let lastUrl = location.href;
        new MutationObserver(() => {
            const url = location.href;
            if (url !== lastUrl) {
                lastUrl = url;
                this.findElements();
            }
        }).observe(document, { subtree: true, childList: true });
    }
}

// ============================================
// GENERIC SITE SPECIALIST
// ============================================
class GenericStealth extends StealthEngine {
    constructor() {
        super();
        console.log('🥷 Stealth Mode: Universal Module Engaged');
    }

    startProtection() {
        // Run immediately and then on interval
        this.zapAds();
        setInterval(() => this.zapAds(), 1000);

        // Watch for new nodes
        const observer = new MutationObserver(() => this.zapAds());
        observer.observe(document, { subtree: true, childList: true });
    }

    zapAds() {
        if (!this.isEnabled) return;

        // 1. Iframe Zapper
        document.querySelectorAll('iframe').forEach(iframe => {
            const src = iframe.src.toLowerCase();
            // Check src against keywords
            if (STEALTH_CONFIG.adKeywords.some(keyword => src.includes(keyword))) {
                iframe.remove();
                this.stats.skipped++; // Count as "skipped" for stats
                this.updateBadge();
            }
            // Check generic ad IDs/classes on the iframe itself
            if (iframe.id.includes('google_ads') || iframe.className.includes('adsbygoogle')) {
                iframe.remove();
            }
        });

        // 2. Generic Video Speedup (Twitch, Vimeo, etc)
        // Harder to detect generic video ads, so we look for 'ad' classes
        document.querySelectorAll('video').forEach(video => {
            const parent = video.closest('[class*="ad"], [id*="ad-"]');
            if (parent) {
                video.muted = true;
                video.playbackRate = 16.0;
                this.stats.spedUp++;
                this.updateBadge(); // Throttle this?
            }
        });

        // 3. Google Ads Ins tags
        document.querySelectorAll('ins.adsbygoogle').forEach(el => el.remove());

        // 4. Common Ad Containers
        document.querySelectorAll('div[id*="taboola-"], div[id*="outbrain-"]').forEach(el => el.remove());
    }
}

// ============================================
// ROUTING
// ============================================
const hostname = location.hostname;
if (hostname.includes('youtube.com')) {
    new YouTubeStealth();
} else {
    // Only run generic stealth on top level or frames that are likely content
    // We already run on all frames, but we don't want to instantiate the engine INSIDE an ad frame we are about to kill
    // But since we are zapping from the parent, it doesn't matter much.
    new GenericStealth();
}
