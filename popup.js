// YouTube Stealth Mode 2026 - Popup Script

document.addEventListener('DOMContentLoaded', () => {
    const enableToggle = document.getElementById('enableToggle');
    const statusIcon = document.getElementById('statusIcon');
    const statusText = document.getElementById('statusText');
    const adsBlockedEl = document.getElementById('adsBlocked');
    const resetStatsBtn = document.getElementById('resetStats');

    // Load current settings
    function loadSettings() {
        chrome.storage.local.get(['enabled', 'stats'], (result) => {
            const isEnabled = result.enabled !== false;
            enableToggle.checked = isEnabled;
            updateStatus(isEnabled);

            updateStatsDisplay(result.stats);
        });
    }

    // Update stats display
    function updateStatsDisplay(stats) {
        if (!stats) stats = { skipped: 0, spedUp: 0 };
        const total = (stats.skipped || 0) + (stats.spedUp || 0);
        adsBlockedEl.textContent = formatNumber(total);
        if (adsBlockedEl.nextElementSibling) {
            adsBlockedEl.nextElementSibling.textContent = 'Ads Accelerated';
        }
    }

    // Update status display
    function updateStatus(isEnabled) {
        if (isEnabled) {
            statusIcon.classList.add('active');
            statusIcon.classList.remove('inactive');
            statusText.textContent = 'Stealth Active';
            statusText.style.color = '#22c55e';
        } else {
            statusIcon.classList.remove('active');
            statusIcon.classList.add('inactive');
            statusText.textContent = 'Stealth Disabled';
            statusText.style.color = '#ef4444';
        }
    }

    // Format large numbers
    function formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }

    // Handle toggle change
    enableToggle.addEventListener('change', () => {
        const isEnabled = enableToggle.checked;
        chrome.storage.local.set({ enabled: isEnabled });
        updateStatus(isEnabled);
    });

    // Handle reset stats
    resetStatsBtn.addEventListener('click', () => {
        chrome.storage.local.set({ stats: { skipped: 0, spedUp: 0 } });
        updateStatsDisplay({ skipped: 0, spedUp: 0 });

        // Update badge
        chrome.action.setBadgeText({ text: '' });

        // Visual feedback
        resetStatsBtn.textContent = 'Reset ✓';
        setTimeout(() => {
            resetStatsBtn.textContent = 'Reset Stats';
        }, 1500);
    });

    // Listen for storage changes (real-time updates)
    chrome.storage.onChanged.addListener((changes) => {
        if (changes.stats) {
            updateStatsDisplay(changes.stats.newValue);
        }
        if (changes.enabled !== undefined) {
            enableToggle.checked = changes.enabled.newValue;
            updateStatus(changes.enabled.newValue);
        }
    });

    // Load settings on popup open
    loadSettings();
});
