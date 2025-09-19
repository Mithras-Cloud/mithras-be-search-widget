# @pxsol/booking-search-widget

Embeddable booking engine search widget that ships a React component and a framework-agnostic Web Component. Both builds reuse the same headless state utilities and formatting helpers so you can embed the widget inside modern React apps or legacy pages with a single configuration.

## Features

- Airbnb-style search form with date range, guests/rooms, POS, language, currency, and product selector.
- Emits stable lifecycle events (`ready`, `change`, `validate_error`, `search_start`, `search_success`, `search_error`).
- Integrates with the Pxsol Search API via client-side `fetch` calls using a public token.
- Shadow DOM styling for the Web Component with themable CSS variables (`--yw-bg`, `--yw-fg`, `--yw-accent`).
- Dual outputs: React (ESM + CJS, peer React) and Custom Element (ESM + IIFE legacy bundle).
- Headless helpers for formatting, validation, and request payload creation.

## Installation

```bash
npm install @pxsol/booking-search-widget
# or
pnpm add @pxsol/booking-search-widget
```

## Scripts

- `npm run build` – produce all distribution bundles via `tsup`.
- `npm run dev` – watch builds for local iteration.
- `npm run typecheck` – static analysis using `tsc --noEmit`.
- `npm run demo` – build once and launch a static server at http://localhost:4173.

## Local demo

```bash
npm run demo
```

The command runs a one-off build and serves `demo/index.html` plus the compiled bundles from `dist/`. Visit [http://localhost:4173](http://localhost:4173) to interact with the widget, inspect emitted events, and iterate on configuration quickly.

## React usage

```tsx
import React from 'react';
import { BookingSearchWidget, BookingSearchWidgetProps } from '@pxsol/booking-search-widget';

const config: BookingSearchWidgetProps = {
  token: 'PUBLIC_SEARCH_TOKEN',
  theme: 'light',
  locale: 'es',
  currency: 'ARS',
  pos: 'HotelEscuela',
  productId: 2475,
  initialStart: '2024-07-01',
  initialEnd: '2024-07-05',
  onEvent: (event) => {
    if (event.type === 'search_success') {
      console.log('Search result', event.payload);
    }
  },
};

export function Demo() {
  return <BookingSearchWidget {...config} />;
}
```

## Web Component usage

### Modern browsers (ES Modules)

```html
<script type="module">
  import '@pxsol/booking-search-widget/wc';
</script>

<your-widget
  token="PUBLIC_SEARCH_TOKEN"
  theme="dark"
  locale="es"
  currency="ARS"
  pos="HotelEscuela"
  product-id="2475"
  initial-start="2024-07-01"
  initial-end="2024-07-05"
></your-widget>

<script>
  document.querySelector('your-widget').addEventListener('yw:event', (event) => {
    console.log('Widget event', event.detail);
  });
</script>
```

### Legacy pages (IIFE bundle)

```html
<script src="/dist/your-widget.iife.js"></script>
<your-widget token="PUBLIC_SEARCH_TOKEN"></your-widget>
```

The IIFE build self-registers the custom element and exposes a `registerYourWidget()` helper when needed.

## Minimal demo snippet

See `demo/index.html` for a copy-paste ready template that logs widget events to the screen. The page is served automatically by `npm run demo`.

## Events

| Event | Payload | Description |
| --- | --- | --- |
| `ready` | `{ state: WidgetState }` | Widget is mounted and hydrated. |
| `change` | `{ state: WidgetState }` | Any user change to the internal state. |
| `validate_error` | `{ valid: false; errors: Record<string, string> }` | Validation failed prior to calling the API. |
| `search_start` | `SearchRequest` | Outgoing payload before calling the API. |
| `search_success` | `{ request: SearchRequest; response: SearchResponse }` | Successful response from the API. |
| `search_error` | `{ request: SearchRequest; error: Error }` | Network or API error. |

On the Web Component build these events are dispatched through `CustomEvent('yw:event', { detail })` with the widget event in `detail`.

## Theming

Override the following CSS variables on the host element:

- `--yw-bg` – primary surface background.
- `--yw-fg` – text color.
- `--yw-accent` – primary button color.

Example:

```css
your-widget {
  --yw-bg: #0f172a;
  --yw-fg: #e2e8f0;
  --yw-accent: #38bdf8;
}
```

## Search API integration

The widget calls `POST https://gateway-prod.pxsol.com/v2/search` with a public bearer token. Responses include `booking_engine_url` that is automatically opened when `redirect` is enabled. All requests are client-side, so ensure the provided token has the correct CORS permissions. Do **not** embed private keys or secrets in markup.

## Security & CSP

- Ship the ESM build and apply a CSP like `script-src 'self' https://cdn.yourdomain.com` so the widget loads from a trusted CDN.
- Avoid `unsafe-eval`; the bundles are plain ESM/CJS/IIFE with no dynamic code execution.
- When embedding in PCI-sensitive contexts, consider wrapping the Web Component in an iframe with a hardened `sandbox` attribute and communicate via `postMessage`.

## Change log

See [`CHANGELOG.md`](./CHANGELOG.md) for release notes.
