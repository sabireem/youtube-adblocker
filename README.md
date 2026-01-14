# YouTube AdBlocker 2026 (Stealth Mode) 🛡️

A next-generation adblocker designed to bypass YouTube's 2025/2026 anti-adblock detection systems using "Stealth Acceleration" technology instead of traditional blocking.

## 🚀 Why "Stealth Mode"?

Traditional adblockers work by **blocking** network requests (e.g., stopping `googleads.g.doubleclick.net`). YouTube detects this easily: "You requested the video, but didn't request the ad -> You are using an adblocker."

**Stealth Mode 2026** takes a different approach called **Malicious Compliance**:
1.  **Allow the Ad:** The ad is allowed to load normally, so YouTube sees a "clean" viewer.
2.  **Temporal Acceleration:** The moment the ad starts, the engine sets the playback speed to **16x** (browser limit) and mutes the audio.
3.  **Instant Skip:** The 30-second ad finishes in ~0.1 seconds.
4.  **Heuristic Zapping:** Visual AI-lite algorithms find "Skip" buttons in any language and auto-click them instantly.

## ✨ Features

- **Undetectable Engine:** No `declarativeNetRequest` rules that trigger anti-adblockers.
- **Universal Skip:** Intellgently finds "Skip Ad", "Passer", "Saltar" buttons in 20+ languages.
- **Overlay Zapper:** Removes banner ads and "Promoted" shelf items using DOM zapping.
- **Anti-Anti-Adblock:** Automatically detects and closes "Ad blockers violate our terms" popups.
- **Zero Config:** Works out of the box. Install and forget.

## 🛠️ Technology Stack

- **Manifest V3:** Fully compliant with Chrome's latest extension standard.
- **Heuristic Engine:** Custom `content.js` logic that monitors video state 50 times per second.
- **Shadow DOM Piercing:** Capable of detecting buttons within Shadow DOMs.
- **State Management:** Uses `chrome.storage` for real-time stats tracking (Ads Skipped / Accelerated).

## 🔧 Installation

1.  Clone this repository:
    ```bash
    git clone https://github.com/sabireem/youtube-adblocker.git
    ```
2.  Open Chrome and navigate to `chrome://extensions`.
3.  Enable **Developer Mode** (top right).
4.  Click **Load unpacked**.
5.  Select the folder where you cloned this repo.

## 📊 Statistics

The extension popup tracks:
- **Ads Accelereted:** Video ads that were speed-hacked.
- **Ads Skipped:** Skip buttons that were auto-clicked.

## ⚖️ Disclaimer

This project is for educational purposes only. It demonstrates how client-side heuristics can effectively bypass server-side detection.
