# WebTuner – Guitar & Bass

A modern, single‑page web app to tune guitar and bass directly in the browser. I built it with the Web Audio API for real‑time pitch detection, a smooth cents meter, reference tones for standard strings, and PWA/SEO best practices.

---

## Overview

- **Purpose**: Fast, accurate, installable tuner for guitar and bass, plus a chromatic mode.
- **Tech**: Vanilla JS, CSS, HTML; Web Audio API; offline‑first PWA; accessible, responsive UI.
- **Status**: Production‑ready static site; no build step required.

---

## Features

- **Automatic tuning**: Real‑time microphone pitch detection with autocorrelation for stability.
- **Tuning modes**: Guitar (E standard), Bass (E standard), and Chromatic mode.
- **Cents meter**: ±50 cent range with color feedback for in‑tune and out‑of‑tune.
- **Reference tones**: Built‑in sine oscillator per string for ear‑based tuning.
- **A4 calibration**: Adjustable diapason from 430 Hz to 450 Hz (default 440 Hz).
- **PWA support**: Installable on desktop/mobile; offline cache for instant reloads.
- **Accessibility**: Keyboard‑friendly, high contrast, reduced motion by default, ARIA labels.
- **Performance**: No frameworks, minimal assets, quick first paint.

---

## Project structure

```
/WebTuner
│
├── index.html                # App shell with SEO meta and JSON-LD
├── styles.css                # Responsive, accessible UI
├── app.js                    # Pitch detection + UI logic
├── manifest.webmanifest      # PWA metadata
├── sw.js                     # Service Worker (offline cache)
├── favicon.svg               # App icon
├── robots.txt                # Robots policy
└── LICENSE                   # MIT License
```

---

## Usage

1. **Get the code**
   - **Option A**: Clone the repository.
   - **Option B**: Download as ZIP and extract.

2. **Run locally**
   - **Open**: Double‑click `index.html`, or
   - **Serve**: Use any static server (recommended for HTTPS/mic access), e.g.:
     ```bash
     npx serve .
     ```

3. **Use the tuner**
   - **Start**: Click “Start Tuner” and allow microphone access.
   - **Select mode**: Guitar, Bass, or Chromatic.
   - **Tune**: Play a string and center the needle at 0 cents.
   - **Reference tones**: Click a string button to play its tone.
   - **Calibrate**: Adjust the A4 slider if needed.

4. **Deploy (GitHub Pages)**
   - **Push**: Commit and push to your default branch.
   - **Enable Pages**: Settings → Pages → Source: deploy from branch.
   - **Visit**: Open the published URL.

---

## Notes

- **SEO**: Title/description, keywords, Open Graph/Twitter tags, and JSON‑LD (WebApplication) are included for rich previews and discoverability.
- **PWA**: The manifest and service worker cache the app shell for offline access; the app is installable on supported browsers.
- **Accessibility**: Semantic HTML, ARIA labels for dynamic regions, keyboard‑reachable controls, and high‑contrast colors.
- **Privacy**: Microphone input stays in the browser; no audio leaves the device. Permissions can be revoked in browser settings.
- **Compatibility**: Modern Chromium‑based browsers and Safari. HTTPS (or localhost) is required for microphone access.

---

## License and author

- **License**: GPL v3 — see LICENSE for details.
- **Author**: Luca Bocaletto — https://github.com/bocaletto-luca
