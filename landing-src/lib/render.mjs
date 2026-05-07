// Shared rendering helpers used by both the landing build and the blog build.

export function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Escape `</script` to prevent any payload from breaking out of the script tag.
export function safeJson(data) {
  return JSON.stringify(data).replace(/<\/script/gi, "<\\/script");
}

// Replace {{key}} placeholders in `template` with values from `strings`.
// Keys ending in `_html` are inlined raw; everything else is HTML-escaped.
// Unknown keys are left untouched (so the macro pass can fill them later).
export function applyStrings(template, strings) {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    if (!(key in strings)) return match;
    const val = strings[key];
    return key.endsWith("_html") ? val : escapeHtml(val);
  });
}

// Replace {{KEY}} placeholders with prebuilt strings (e.g. CANONICAL, JSON_LD).
// Values are inlined verbatim — caller is responsible for safety.
export function applyMacros(html, macros) {
  for (const [key, val] of Object.entries(macros)) {
    html = html.replaceAll(`{{${key}}}`, val);
  }
  return html;
}

// Build the OpenPanel web tracker snippet from LANDING_OPENPANEL_CLIENT_ID.
// Web SDK uses clientId only (publicly served HTML — secret would leak).
// Returns empty string when env var is unset, so unconfigured local builds
// emit no tracker. CI must export the env var or docs/ drift check fails.
export function buildOpenpanelScript() {
  const clientId = process.env.LANDING_OPENPANEL_CLIENT_ID;
  if (!clientId) return "";
  if (!/^[A-Za-z0-9-]+$/.test(clientId)) {
    throw new Error(
      `LANDING_OPENPANEL_CLIENT_ID has unexpected characters: ${clientId}`,
    );
  }
  return `
    <script>
      window.op = window.op || function(...args){(window.op.q=window.op.q||[]).push(args);};
      window.op('init', {
        clientId: '${clientId}',
        trackScreenViews: true,
        trackOutgoingLinks: true,
        trackAttributes: true,
      });
    </script>
    <script src="https://openpanel.dev/op1.js" defer async></script>`;
}
