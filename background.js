// YouTube Stealth Mode 2026 - Background Script
// Minimal footprint to avoid detection

chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({
        enabled: true,
        stats: { skipped: 0, spedUp: 0 }
    });
    console.log('🥷 Stealth Mode Installed');
});

// Update badge with "Stealth" look
function updateBadge(count) {
    const text = count > 0 ? count.toString() : '';
    chrome.action.setBadgeText({ text: text });
    chrome.action.setBadgeBackgroundColor({ color: '#333333' }); // Dark/Stealth color
}

// Handle messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'updateStats') {
        const total = (message.skipped || 0) + (message.spedUp || 0);
        updateBadge(total);

        // Save to storage
        chrome.storage.local.get(['stats'], (result) => {
            const currentStats = result.stats || { skipped: 0, spedUp: 0 };
            currentStats.skipped += message.skipped || 0;
            currentStats.spedUp += message.spedUp || 0;
            chrome.storage.local.set({ stats: currentStats });
        });
    }
});
