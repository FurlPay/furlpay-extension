# FurlPay Browser Extension

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black)
![WXT](https://img.shields.io/badge/WXT-67D55E?style=flat-square)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)
![Chrome MV3](https://img.shields.io/badge/Chrome%20MV3-4285F4?style=flat-square&logo=googlechrome&logoColor=white)
![Firefox](https://img.shields.io/badge/Firefox-FF7139?style=flat-square&logo=firefoxbrowser&logoColor=white)
![WebAuthn](https://img.shields.io/badge/WebAuthn-3423A6?style=flat-square)
![x402](https://img.shields.io/badge/x402-0052FF?style=flat-square)
[![CI](https://github.com/FurlPay/furlpay-extension/actions/workflows/ci.yml/badge.svg)](https://github.com/FurlPay/furlpay-extension/actions/workflows/ci.yml)

MV3 extension (Chrome / Edge / Firefox via [WXT](https://wxt.dev) + React + TypeScript).
<img width="497" height="767" alt="image" src="https://github.com/user-attachments/assets/c1e07de6-8c1c-46f8-a1ea-338dd1ac693e" />



## Features

| Surface | What it does |
| --- | --- |
| **Popup** | Wallet (net worth + recent transactions), 3DS2 approvals inbox, Earn (rewards, missions, tier progress), Settings (backend URL, session, x402 activity) |
| **Toolbar badge** | Live USDC balance, refreshed every minute by the service worker |
| **Notifications** | New 3DS2 card challenges raise a native notification with Approve / Decline buttons |
| **x402 detector** (content script, MAIN world) | Patches `fetch`/XHR to catch HTTP 402 responses and slides up a checkout bottom-sheet |
| **Fee scanner** (content script) | On checkout pages, shows the card-fee vs FurlPay-fee comparison pill (7-day per-site dismissal) |
| **Side panel** | AI travel agent — free-text hotel search against `/api/travel/search`, book on furlpay.com |
| **DevTools panel** | "FurlPay x402" — live inspector for 402 responses with decoded PaymentRequirements |

## Security model

- **No tokens in extension storage.** Auth is the furlpay.com session cookie (HttpOnly), sent
  automatically thanks to host permissions. Nothing to exfiltrate from `chrome.storage`.
- **Biometric approval happens on furlpay.com**, never in the extension: WebAuthn credentials are
  bound to the `furlpay.com` rpID and cannot be asserted from a `chrome-extension://` origin.
  The extension only deep-links to `/cards/approve` — this is what makes the flow phishing-proof.
- Declining a transaction (safe direction) is allowed in-extension via the session-authed API.
- Content scripts are observe-only, render in **closed shadow roots**, and never read page forms.
- Minimal permissions: `storage`, `notifications`, `sidePanel`, `alarms`, `activeTab`.
  Host permissions limited to `furlpay.com` + `localhost` (dev). No `scripting`, no `webRequest`,
  no clipboard.
- Message handlers validate `sender.id === browser.runtime.id`.

## Develop

```bash
npm install               # from repo root (workspace)
cd apps/extension
npm run dev               # live-reload Chrome build
npm run dev:firefox
```

Point the extension at a local backend from **Settings → Backend URL** (`http://localhost:3000`).

## Build & ship

```bash
npm run build             # .output/chrome-mv3 (Load unpacked)
npm run zip               # .output/furlpayextension-<version>-chrome.zip for the Web Store
npm run build:firefox     # Firefox MV3 build
```

Store submission checklist lives in `docs/` (publishing playbook): privacy policy at
furlpay.com/privacy, data-disclosure questionnaire, 1280×800 screenshots, promo tiles.
