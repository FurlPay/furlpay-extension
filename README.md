# Furlpay Browser Extension

[![CI](https://github.com/FurlPay/furlpay-extension/actions/workflows/ci.yml/badge.svg)](https://github.com/FurlPay/furlpay-extension/actions)
[![license](https://img.shields.io/badge/license-MIT-green)](./LICENSE)

The [Furlpay](https://furlpay.com) Manifest V3 extension for Chrome and Firefox —
injects the Furlpay checkout button on merchant pages and provides one-tap
virtual cards from the popup.

**Open-sourced so anyone can audit exactly what the extension does with card
credentials and page content.**

## Structure

```
manifest.json        MV3 manifest (permissions: storage, activeTab, scripting)
src/background.js    Service worker
src/content.js       Checkout detection + button injection
src/popup/           Popup UI (one-tap cards)
```

## Load locally

1. Open `chrome://extensions` and enable **Developer mode**
2. Click **Load unpacked** and select this folder

## Permissions rationale

- `storage` — persist session + preferences
- `activeTab`, `scripting` — inject the checkout button only when you interact
- Host access is limited to `https://api.furlpay.app/*`

## License

MIT
