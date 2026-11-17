// (P3-05, audit 2026-11-18) A CWS upload pins the extension ID to the
// packaging key. The development build carries that key so local passkey
// assertions work; a production build must NOT include it, or the published
// ID will not match and every passkey RP origin check fails silently. This
// guard makes `npm run zip` (the CWS packaging path) refuse to run outside a
// production build, so a dev artifact can never reach the store.
const isProd =
  process.env.NODE_ENV === "production" ||
  process.env.FURLPAY_EXTENSION_PACKAGING === "production";

if (!isProd) {
  console.error(
    [
      "",
      "✖ REFUSED: packaging the extension for CWS outside a production build.",
      "",
      "  A development build embeds the extension's packaging public key;",
      "  uploading it would change the extension ID and break passkey RP",
      "  origin validation for every user.",
      "",
      "  Build with:  npm run build   (then)   NODE_ENV=production npm run zip",
      "  Or set FURLPAY_EXTENSION_PACKAGING=production to acknowledge.",
      "",
    ].join("\n")
  );
  process.exit(1);
}
console.log("[+] production packaging confirmed — CWS zip may proceed");
