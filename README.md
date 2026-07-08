<div align="center">

<img src="public/icon128.png" alt="FurlPay" width="80" height="80" />

# FurlPay Browser Extension

**Stablecoin payments in your browser — x402 checkout, biometric 3DS2 approvals, and a fee scanner that shows what cards really cost.**

[![CI](https://github.com/FurlPay/furlpay-extension/actions/workflows/ci.yml/badge.svg)](https://github.com/FurlPay/furlpay-extension/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-00E599.svg)](LICENSE)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-4285F4.svg)](https://developer.chrome.com/docs/extensions/develop/migrate/what-is-mv3)

[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React_18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![WXT](https://img.shields.io/badge/WXT-67D55E?style=for-the-badge&logo=wxt&logoColor=black)](https://wxt.dev/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Chrome](https://img.shields.io/badge/Chrome-supported-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white)](#build--ship)
[![Firefox](https://img.shields.io/badge/Firefox-supported-FF7139?style=for-the-badge&logo=firefoxbrowser&logoColor=white)](#build--ship)

</div>

The extension brings [furlpay.com](https://furlpay.com) to every tab: it detects [x402](https://www.x402.org/) payment challenges on any site and settles them in USDC, surfaces 3DS2 card-transaction approvals as native notifications, compares card fees against FurlPay at checkout, and ships a DevTools inspector for developers building on x402.

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

## Tech stack

| | |
| --- | --- |
| [WXT](https://wxt.dev) 0.20 | Extension framework — MV3 manifest generation, HMR dev server, Chrome + Firefox targets from one codebase |
| [React](https://react.dev) 18 | Popup, side panel, and x402 checkout UI |
| [TypeScript](https://www.typescriptlang.org) 5 | Strict mode across all entrypoints |
| [Vite](https://vitejs.dev) | Bundling (via WXT) — the production Chrome build is ~240 kB total |
| Manifest V3 | Service-worker background, content scripts in isolated + MAIN worlds, `sidePanel` and `devtools_page` surfaces |

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
npm install
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

Store listing copy and promo tiles live in [`store-assets/`](store-assets/). Remaining submission
items: privacy policy at furlpay.com/privacy, data-disclosure questionnaire, 1280×800 screenshots.

## License

[MIT](LICENSE)
