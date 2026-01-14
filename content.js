// YouTube Stealth Mode 2026 - Content Script
// "Malicious Compliance" Edition - Don't block, just accelerate.

const STEALTH_CONFIG = {
    checkInterval: 50,      // Check every 50ms (very aggressive)
    speedupRate: 16.0,      // Max playback rate
    skipText: ['Skip', 'Skip Ad', 'Skip Ads', 'Schließen', 'Saltar', 'Passer', 'Ignora'], // Multilanguage support
    adSelectors: [
        '.ad-showing',
        '.ad-interrupting',
        '[id^="ad-text"]',
        '.ytp-ad-module',
        '.ytp-ad-image-overlay',
        '.ytp-ad-overlay-container'
    ]
};

class StealthEngine {
    constructor() {
        this.isEnabled = true;
        this.stats = { skipped: 0, spedUp: 0 };
        this.video = null;
        this.player = null;

        this.init();
    }

    init() {
        console.log('🥷 Stealth Mode 2026: Engaged');

        // Load settings
        chrome.storage.local.get(['enabled'], (result) => {
            this.isEnabled = result.enabled !== false;
        });

        chrome.storage.onChanged.addListener((changes) => {
            if (changes.enabled) this.isEnabled = changes.enabled.newValue;
        });

        // Start the heuristic engine
        this.startLoop();

        // Handle navigation events
        this.setupNavigationListener();
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

    // ==========================================
    // STRATEGY 1: Temporal Acceleration
    // ==========================================
    handleVideoAds() {
        if (!this.video) return;

        const isAd = this.detectAdState();

        if (isAd) {
            // 1. Mute immediately
            if (!this.video.muted) this.video.muted = true;

            // 2. Teleport to end (leave tiny buffer to trigger 'ended' event)
            if (isFinite(this.video.duration) && this.video.currentTime < this.video.duration - 0.1) {
                this.video.currentTime = this.video.duration - 0.1;
                this.stats.spedUp++;
            }

            // 3. Hyper-speed (playbackRate 16.0)
            if (this.video.playbackRate !== STEALTH_CONFIG.speedupRate) {
                this.video.playbackRate = STEALTH_CONFIG.speedupRate;
            }

            // 4. Force play if paused
            if (this.video.paused) {
                this.video.play().catch(() => { });
            }

            this.updateBadge();
        } else {
            // Restore normal state only if we messed with it
            // Check if we are still sped up but ad is gone
            if (this.video.playbackRate === STEALTH_CONFIG.speedupRate) {
                this.video.playbackRate = 1.0;
                this.video.muted = false; // You might want to be careful unmuting if user muttered it
            }
        }
    }

    detectAdState() {
        if (!this.player) return false;

        // Check 1: Class names (Basic)
        if (this.player.classList.contains('ad-showing')) return true;
        if (this.player.classList.contains('ad-interrupting')) return true;

        // Check 2: Video info (Heuristic)
        // Ads are usually short, but watching a short video isn't an ad. 
        // We rely heavily on the player state classes which are reliable.

        // Check 3: Deep check into ad container
        const adModule = document.querySelector('.ytp-ad-module');
        if (adModule && adModule.children.length > 0) return true;

        return false;
    }

    // ==========================================
    // STRATEGY 2: Visual Heuristic Clicker
    // ==========================================
    clickSkipButtons() {
        // Find buttons that look like skip buttons without relying on exact classes
        // XPath is great for text search
        const xpath = `//button[contains(text(), 'Skip') or contains(text(), 'Passer') or contains(text(), 'Saltar')]`;
        const result = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);

        for (let i = 0; i < result.snapshotLength; i++) {
            const btn = result.snapshotItem(i);
            if (this.isVisible(btn)) {
                btn.click();
                this.stats.skipped++;
                this.updateBadge();
                console.log('🥷 Stealth Click:', btn.innerText);
            }
        }

        // Also check standard classes as fallback
        const classicSelectors = [
            '.ytp-ad-skip-button',
            '.ytp-ad-skip-button-modern',
            '.videoAdUiSkipButton'
        ];

        classicSelectors.forEach(sel => {
            document.querySelectorAll(sel).forEach(btn => {
                if (this.isVisible(btn)) btn.click();
            });
        });
    }

    // ==========================================
    // STRATEGY 3: Overlay Zapper
    // ==========================================
    handleOverlayAds() {
        // Remove banner ads covering the video
        const overlays = document.querySelectorAll('.ytp-ad-overlay-container, .ytp-ad-image-overlay');
        overlays.forEach(el => {
            el.style.display = 'none';
        });

        // Remove "promoted" items in grid
        document.querySelectorAll('ytd-ad-slot-renderer').forEach(el => el.remove());
    }

    // ==========================================
    // STRATEGY 4: Anti-Anti-Adblock
    // ==========================================
    nukeAntiAdblock() {
        // The "Ad blockers violate our terms" popup
        const dialogs = document.querySelectorAll('tp-yt-paper-dialog, .ytd-popup-container');

        dialogs.forEach(dialog => {
            if (dialog.innerText.includes('Ad blockers are not allowed') ||
                dialog.innerText.includes('violate YouTube\'s Terms of Service')) {

                // 1. Click default close button if exists
                const closeBtn = dialog.querySelector('#dismiss-button, [aria-label="Close"]');
                if (closeBtn) closeBtn.click();

                // 2. Hard remove
                dialog.remove();

                // 3. Resume video
                if (this.video) this.video.play();

                // 4. Remove backdrop
                const backdrop = document.querySelector('tp-yt-iron-overlay-backdrop');
                if (backdrop) backdrop.remove();
            }
        });
    }

    // Utility
    isVisible(elem) {
        if (!elem) return false;
        return !!(elem.offsetWidth || elem.offsetHeight || elem.getClientRects().length);
    }

    updateBadge() {
        // Send stats to background to update badge
        chrome.runtime.sendMessage({
            type: 'updateStats',
            skipped: this.stats.skipped,
            spedUp: this.stats.spedUp
        }).catch(() => { }); // Ignore errors if extension context invalidated
    }

    setupNavigationListener() {
        // SPA listener
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

// Start Engine
new StealthEngine();
