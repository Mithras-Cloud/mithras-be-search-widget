import {
  WidgetConfig,
  WidgetEvent,
  WidgetEventType,
  WidgetState,
  GroupSpec,
  SearchResponse,
} from './core/types';
import { cloneGroups, formatGroupsForm, summarizeGuests } from './core/format';
import { buildSearchPayload, createInitialState, validateState } from './core/state';

const STYLE_TEXT = `
:host {
  all: initial;
  display: inline-block;
  font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}
.yw-container {
  font-family: inherit;
  background: var(--yw-bg, #ffffff);
  color: var(--yw-fg, #101828);
  border: 1px solid rgba(16, 24, 40, 0.1);
  border-radius: 12px;
  padding: 1rem;
  min-width: 260px;
  max-width: 420px;
  box-sizing: border-box;
  box-shadow: 0 8px 24px rgba(16, 24, 40, 0.08);
}
.yw-container[data-theme='dark'] {
  background: var(--yw-bg, #101828);
  color: var(--yw-fg, #ffffff);
  border-color: rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.75);
}
.yw-container h2 {
  font-size: 1.1rem;
  margin: 0 0 0.75rem;
}
form {
  display: grid;
  gap: 0.75rem;
}
label {
  display: flex;
  flex-direction: column;
  font-size: 0.85rem;
  gap: 0.35rem;
}
input,
select,
button {
  font: inherit;
}
input,
select {
  border-radius: 8px;
  border: 1px solid rgba(16, 24, 40, 0.18);
  padding: 0.5rem 0.6rem;
  background: var(--yw-bg, #ffffff);
  color: inherit;
}
[data-theme='dark'] input,
[data-theme='dark'] select {
  border-color: rgba(255, 255, 255, 0.18);
}
.yw-row {
  display: grid;
  gap: 0.75rem;
}
.yw-row--inline {
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
}
.yw-groups {
  display: grid;
  gap: 0.75rem;
  border: 1px dashed rgba(16, 24, 40, 0.15);
  padding: 0.75rem;
  border-radius: 8px;
}
.yw-group {
  display: grid;
  gap: 0.5rem;
}
.yw-group-controls {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.yw-group-controls label {
  flex: 1;
  min-width: 120px;
}
.yw-actions {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  align-items: center;
}
.yw-primary {
  background: var(--yw-accent, #2563eb);
  border: none;
  color: #ffffff;
  border-radius: 999px;
  padding: 0.65rem 1.25rem;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.2s ease;
}
.yw-primary:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.yw-secondary {
  background: transparent;
  border: 1px solid rgba(16, 24, 40, 0.2);
  color: inherit;
  border-radius: 999px;
  padding: 0.55rem 1rem;
  cursor: pointer;
}
.yw-error {
  color: #dc2626;
  font-size: 0.8rem;
}
[data-theme='dark'] .yw-error {
  color: #f87171;
}
.yw-summary {
  font-size: 0.85rem;
  opacity: 0.8;
}
small {
  font-size: 0.8rem;
  opacity: 0.7;
}
`;

const observed = [
  'token',
  'theme',
  'locale',
  'currency',
  'pos',
  'product-id',
  'initial-start',
  'initial-end',
  'initial-groups',
  'redirect',
];

type AttributeName = (typeof observed)[number];

const booleanAttr = (host: HTMLElement, name: AttributeName): boolean | undefined => {
  if (!host.hasAttribute(name)) return undefined;
  const value = host.getAttribute(name);
  if (value === null || value === '' || value.toLowerCase() === 'true') return true;
  if (value.toLowerCase() === 'false') return false;
  return true;
};

const toNumber = (value: string | null | undefined) => {
  if (value == null) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const mapGroupToMarkup = (group: GroupSpec, index: number) => `
  <div class="yw-group" data-index="${index}">
    <header class="yw-summary">Room ${index + 1}</header>
    <div class="yw-group-controls">
      <label>
        <span>Rooms</span>
        <input type="number" min="1" data-group-field="rooms" data-index="${index}" value="${group.rooms}" />
      </label>
      <label>
        <span>Adults</span>
        <input type="number" min="1" data-group-field="adults" data-index="${index}" value="${group.adults}" />
      </label>
      <label>
        <span>Children ages</span>
        <input type="text" placeholder="e.g. 5.8" data-group-field="children" data-index="${index}" value="${
          group.childrenAges.join('.')
        }" />
      </label>
      <label>
        <span>Infants</span>
        <input type="number" min="0" data-group-field="infants" data-index="${index}" value="${group.infants}" />
      </label>
    </div>
    ${index > 0
      ? `<button class="yw-secondary" type="button" data-remove-group="${index}" aria-label="Remove room ${index + 1}">Remove room</button>`
      : ''}
  </div>
`;

const renderGroups = (groups: GroupSpec[]) => groups.map(mapGroupToMarkup).join('');

const parseChildren = (value: string) =>
  value
    .split(/[.,]/)
    .map((age) => age.trim())
    .filter(Boolean)
    .map(Number)
    .filter((age) => Number.isFinite(age) && age >= 0);

const defaultConfig = (token: string): WidgetConfig => ({ token });

export class YourWidgetElement extends HTMLElement {
  private state: WidgetState;
  private config: WidgetConfig;
  private bootstrapped = false;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.config = defaultConfig(this.getAttribute('token') ?? 'PUBLIC_TOKEN');
    this.state = createInitialState({ ...this.config, initialGroups: this.getAttribute('initial-groups') ?? undefined });
  }

  static get observedAttributes() {
    return observed;
  }

  connectedCallback() {
    this.config = this.readConfig();
    this.state = createInitialState(this.config);
    this.render();
    this.bootstrapped = true;
    this.emit('ready', { state: this.state });
  }

  attributeChangedCallback() {
    if (!this.bootstrapped) return;
    this.config = this.readConfig();
    this.state = createInitialState(this.config);
    this.render();
  }

  private readConfig(): WidgetConfig {
    return {
      token: this.getAttribute('token') ?? 'PUBLIC_TOKEN',
      theme: (this.getAttribute('theme') as WidgetConfig['theme']) ?? undefined,
      locale: this.getAttribute('locale') ?? undefined,
      currency: this.getAttribute('currency') ?? undefined,
      pos: this.getAttribute('pos') ?? undefined,
      productId: toNumber(this.getAttribute('product-id')),
      initialStart: this.getAttribute('initial-start') ?? undefined,
      initialEnd: this.getAttribute('initial-end') ?? undefined,
      initialGroups: this.getAttribute('initial-groups') ?? undefined,
      redirect: booleanAttr(this, 'redirect'),
      onEvent: (event) => this.emit(event.type, event.payload),
    };
  }

  private emit(type: WidgetEventType, payload?: unknown) {
    const detail: WidgetEvent = { type, payload };
    this.dispatchEvent(new CustomEvent('yw:event', { detail, bubbles: true, composed: true }));
  }

  private setState(next: Partial<WidgetState>) {
    this.state = { ...this.state, ...next };
    this.emit('change', { state: this.state });
    this.render();
  }

  private render() {
    if (!this.shadowRoot) return;
    const theme = this.config.theme ?? 'light';
    const { startDate, endDate, pos, locale, currency, productId, groups, isSearching, errors, redirect } = this.state;
    const summary = summarizeGuests(groups);
    const errorMessage = Object.values(errors)[0] ?? '';

    this.shadowRoot.innerHTML = `
      <style>${STYLE_TEXT}</style>
      <div class="yw-container" data-theme="${theme}" role="region" aria-live="polite">
        <h2>Booking search</h2>
        <form>
          <div class="yw-row yw-row--inline">
            <label>
              <span>Check-in</span>
              <input type="date" name="start" value="${startDate}" />
            </label>
            <label>
              <span>Check-out</span>
              <input type="date" name="end" value="${endDate}" min="${startDate}" />
            </label>
          </div>

          <div class="yw-row yw-row--inline">
            <label>
              <span>POS</span>
              <input type="text" name="pos" value="${pos}" />
            </label>
            <label>
              <span>Language</span>
              <input type="text" name="locale" value="${locale}" />
            </label>
            <label>
              <span>Currency</span>
              <input type="text" name="currency" value="${currency}" />
            </label>
          </div>

          <label>
            <span>Product ID</span>
            <input type="number" name="product" min="1" value="${productId}" />
          </label>

          <section class="yw-groups" aria-label="Guests">
            ${renderGroups(groups)}
            <button type="button" class="yw-secondary" data-add-group>Add room</button>
            <p class="yw-summary">${summary.rooms} rooms · ${summary.adults} adults · ${summary.children} children · ${summary.infants} infants</p>
          </section>

          <label>
            <span>
              Redirect to booking engine
              <input type="checkbox" name="redirect" ${redirect ? 'checked' : ''} />
            </span>
          </label>

          ${errorMessage ? `<p class="yw-error">${errorMessage}</p>` : ''}

          <div class="yw-actions">
            <button type="submit" class="yw-primary" ${isSearching ? 'disabled' : ''}>${
      isSearching ? 'Searching…' : 'Search'
    }</button>
            <small>${formatGroupsForm(groups)}</small>
          </div>
        </form>
      </div>
    `;

    this.bindEvents();
  }

  private bindEvents() {
    const root = this.shadowRoot;
    if (!root) return;

    const form = root.querySelector('form');
    form?.addEventListener('submit', (event) => this.onSubmit(event));

    const registerInput = (selector: string, handler: (value: string) => void) => {
      const input = root.querySelector<HTMLInputElement>(selector);
      if (!input) return;
      input.addEventListener('change', (event) => handler((event.target as HTMLInputElement).value));
    };

    registerInput('input[name="start"]', (value) => this.setState({ startDate: value }));
    registerInput('input[name="end"]', (value) => this.setState({ endDate: value }));
    registerInput('input[name="pos"]', (value) => this.setState({ pos: value }));
    registerInput('input[name="locale"]', (value) => this.setState({ locale: value }));
    registerInput('input[name="currency"]', (value) => this.setState({ currency: value }));
    registerInput('input[name="product"]', (value) => this.setState({ productId: Number(value) || 0 }));

    const redirectInput = root.querySelector<HTMLInputElement>('input[name="redirect"]');
    redirectInput?.addEventListener('change', (event) => {
      const target = event.target as HTMLInputElement;
      this.setState({ redirect: target.checked });
    });

    root.querySelectorAll<HTMLInputElement>('[data-group-field]').forEach((input) => {
      input.addEventListener('change', (event) => {
        const target = event.target as HTMLInputElement;
        const index = Number(target.dataset.index ?? '0');
        const field = target.dataset.groupField;
        this.updateGroup(index, field ?? '', target.value);
      });
    });

    root.querySelectorAll<HTMLButtonElement>('[data-remove-group]').forEach((button) => {
      button.addEventListener('click', () => {
        const index = Number(button.dataset.removeGroup ?? '0');
        this.setState({ groups: this.state.groups.filter((_, idx) => idx !== index) });
      });
    });

    const addButton = root.querySelector<HTMLButtonElement>('[data-add-group]');
    addButton?.addEventListener('click', () => {
      this.setState({ groups: [...cloneGroups(this.state.groups), { rooms: 1, adults: 2, childrenAges: [], infants: 0 }] });
    });
  }

  private updateGroup(index: number, field: string, value: string) {
    const groups = cloneGroups(this.state.groups);
    const target = groups[index];
    if (!target) return;

    if (field === 'rooms') target.rooms = Math.max(1, Number(value) || 1);
    if (field === 'adults') target.adults = Math.max(1, Number(value) || 1);
    if (field === 'children') target.childrenAges = parseChildren(value);
    if (field === 'infants') target.infants = Math.max(0, Number(value) || 0);

    this.setState({ groups });
  }

  private async onSubmit(event: Event) {
    event.preventDefault();
    const validation = validateState(this.state);
    if (!validation.valid) {
      this.setState({ errors: validation.errors });
      this.emit('validate_error', validation);
      return;
    }

    const payload = buildSearchPayload({ ...this.state, errors: {} }, this.config);
    this.setState({ isSearching: true, errors: {} });
    this.emit('search_start', payload);

    try {
      const response = await fetch('https://gateway-prod.pxsol.com/v2/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Search failed with status ${response.status}`);
      }

      const data = (await response.json()) as SearchResponse;
      this.setState({ isSearching: false, lastResponse: data });
      this.emit('search_success', { request: payload, response: data });

      if (payload.redirect && data.booking_engine_url) {
        window.location.assign(data.booking_engine_url);
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unexpected error');
      this.setState({ isSearching: false });
      this.emit('search_error', { request: payload, error: err });
      console.error('[booking-search-widget]', err);
    }
  }
}

if (!customElements.get('your-widget')) {
  customElements.define('your-widget', YourWidgetElement);
}

export const registerYourWidget = () => {
  if (!customElements.get('your-widget')) {
    customElements.define('your-widget', YourWidgetElement);
  }
};
