import React, { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { WidgetConfig, WidgetState, GroupSpec, WidgetEventType, SearchResponse } from './core/types';
import { cloneGroups, formatGroupsForm, summarizeGuests } from './core/format';
import { buildSearchPayload, createInitialState, forwardEvent, validateState } from './core/state';

export type BookingSearchWidgetProps = WidgetConfig & {
  redirect?: boolean;
};

const POS_OPTIONS = ['GLOBAL', 'HotelEscuela', 'HotelDelSol'];
const LOCALE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
  { value: 'pt', label: 'Português' },
];
const CURRENCY_OPTIONS = ['USD', 'EUR', 'ARS', 'BRL'];
const THEME_CLASS = 'yw-container';

const styles = `
.${THEME_CLASS} {
  font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: var(--yw-bg, #ffffff);
  color: var(--yw-fg, #101828);
  border: 1px solid rgba(16, 24, 40, 0.1);
  border-radius: 12px;
  padding: 1rem;
  min-width: 280px;
  max-width: 420px;
  box-shadow: 0 8px 24px rgba(16, 24, 40, 0.08);
}
.${THEME_CLASS}[data-theme='dark'] {
  background: var(--yw-bg, #101828);
  color: var(--yw-fg, #ffffff);
  border-color: rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.75);
}
.${THEME_CLASS} h2 {
  font-size: 1.1rem;
  margin: 0 0 0.75rem;
}
.${THEME_CLASS} form {
  display: grid;
  gap: 0.75rem;
}
.${THEME_CLASS} label {
  display: flex;
  flex-direction: column;
  font-size: 0.85rem;
  gap: 0.35rem;
}
.${THEME_CLASS} input,
.${THEME_CLASS} select,
.${THEME_CLASS} button {
  font: inherit;
}
.${THEME_CLASS} input,
.${THEME_CLASS} select {
  border-radius: 8px;
  border: 1px solid rgba(16, 24, 40, 0.18);
  padding: 0.5rem 0.6rem;
  background: var(--yw-bg, #ffffff);
  color: inherit;
}
.${THEME_CLASS}[data-theme='dark'] input,
.${THEME_CLASS}[data-theme='dark'] select {
  border-color: rgba(255, 255, 255, 0.18);
}
.${THEME_CLASS} .yw-row {
  display: grid;
  gap: 0.75rem;
}
.${THEME_CLASS} .yw-row--inline {
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
}
.${THEME_CLASS} .yw-groups {
  display: grid;
  gap: 0.75rem;
  border: 1px dashed rgba(16, 24, 40, 0.15);
  padding: 0.75rem;
  border-radius: 8px;
}
.${THEME_CLASS} .yw-group {
  display: grid;
  gap: 0.5rem;
}
.${THEME_CLASS} .yw-group-controls {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.${THEME_CLASS} .yw-group-controls label {
  flex: 1;
  min-width: 120px;
}
.${THEME_CLASS} .yw-actions {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  align-items: center;
}
.${THEME_CLASS} .yw-primary {
  background: var(--yw-accent, #2563eb);
  border: none;
  color: #ffffff;
  border-radius: 999px;
  padding: 0.65rem 1.25rem;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.2s ease;
}
.${THEME_CLASS} .yw-primary:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.${THEME_CLASS} .yw-secondary {
  background: transparent;
  border: 1px solid rgba(16, 24, 40, 0.2);
  color: inherit;
  border-radius: 999px;
  padding: 0.55rem 1rem;
  cursor: pointer;
}
.${THEME_CLASS} .yw-error {
  color: #dc2626;
  font-size: 0.8rem;
}
.${THEME_CLASS}[data-theme='dark'] .yw-error {
  color: #f87171;
}
.${THEME_CLASS} .yw-summary {
  font-size: 0.85rem;
  opacity: 0.8;
}
`;

const ensureStyles = () => {
  if (typeof document === 'undefined') return;
  if (document.getElementById('yw-styles')) return;
  const tag = document.createElement('style');
  tag.id = 'yw-styles';
  tag.textContent = styles;
  document.head.appendChild(tag);
};

const mergeGroups = (groups: GroupSpec[], index: number, patch: Partial<GroupSpec>): GroupSpec[] => {
  const next = cloneGroups(groups);
  next[index] = {
    ...next[index],
    ...patch,
    childrenAges: patch.childrenAges ?? next[index].childrenAges,
  };
  return next;
};

const parseChildrenInput = (value: string): number[] =>
  value
    .split(/[.,]/)
    .map((age) => age.trim())
    .filter(Boolean)
    .map(Number)
    .filter((age) => Number.isFinite(age) && age >= 0);

export const BookingSearchWidget: React.FC<BookingSearchWidgetProps> = (props) => {
  const [state, setState] = useState<WidgetState>(() => createInitialState(props));
  const hasHydrated = useRef(false);

  useEffect(() => {
    ensureStyles();
  }, []);

  useEffect(() => {
    if (!hasHydrated.current) {
      hasHydrated.current = true;
      return;
    }
    setState(createInitialState(props));
  }, [
    props.initialStart,
    props.initialEnd,
    props.initialGroups,
    props.locale,
    props.currency,
    props.pos,
    props.productId,
    props.redirect,
  ]);

  const emit = useCallback(
    (type: WidgetEventType, payload?: unknown) => {
      forwardEvent(props.onEvent, type, payload);
    },
    [props.onEvent]
  );

  useEffect(() => {
    emit('ready', { state });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStateChange = useCallback(
    (next: Partial<WidgetState> | ((prev: WidgetState) => WidgetState)) => {
      setState((prev) => {
        const candidate = typeof next === 'function' ? (next as (prev: WidgetState) => WidgetState)(prev) : { ...prev, ...next };
        emit('change', { state: candidate });
        return candidate;
      });
    },
    [emit]
  );

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const validation = validateState(state);
    if (!validation.valid) {
      handleStateChange({ errors: validation.errors });
      emit('validate_error', validation);
      return;
    }

    const payload = buildSearchPayload({ ...state, errors: {} }, props);
    handleStateChange({ isSearching: true, errors: {} });
    emit('search_start', payload);

    try {
      const response = await fetch('https://gateway-prod.pxsol.com/v2/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${props.token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Search failed with status ${response.status}`);
      }

      const data = (await response.json()) as SearchResponse;
      handleStateChange({ isSearching: false, lastResponse: data });
      emit('search_success', { request: payload, response: data });

      if ((payload.redirect || props.redirect) && data.booking_engine_url) {
        window.location.assign(data.booking_engine_url);
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unexpected error');
      handleStateChange({ isSearching: false });
      emit('search_error', { request: payload, error: err });
      console.error('[booking-search-widget]', err);
    }
  };

  const groupsSummary = useMemo(() => summarizeGuests(state.groups), [state.groups]);

  const errorMessage = Object.values(state.errors)[0];

  const addGroup = () => {
    handleStateChange((prev) => ({
      ...prev,
      groups: [...cloneGroups(prev.groups), { rooms: 1, adults: 2, childrenAges: [], infants: 0 }],
    }));
  };

  const removeGroup = (index: number) => {
    handleStateChange((prev) => ({
      ...prev,
      groups: prev.groups.filter((_, idx) => idx !== index),
    }));
  };

  const onGroupChange = (index: number, patch: Partial<GroupSpec>) => {
    handleStateChange((prev) => ({
      ...prev,
      groups: mergeGroups(prev.groups, index, patch),
    }));
  };

  const onChildrenChange = (index: number, value: string) => {
    const childrenAges = parseChildrenInput(value);
    onGroupChange(index, { childrenAges });
  };

  return (
    <div className={THEME_CLASS} data-theme={props.theme ?? 'light'} role="region" aria-live="polite">
      <h2>Booking search</h2>
      <form onSubmit={handleSubmit} noValidate>
        <div className="yw-row yw-row--inline">
          <label>
            <span>Check-in</span>
            <input
              type="date"
              value={state.startDate}
              onChange={(event) => handleStateChange({ startDate: event.target.value })}
              required
            />
          </label>
          <label>
            <span>Check-out</span>
            <input
              type="date"
              value={state.endDate}
              min={state.startDate}
              onChange={(event) => handleStateChange({ endDate: event.target.value })}
              required
            />
          </label>
        </div>

        <div className="yw-row yw-row--inline">
          <label>
            <span>POS</span>
            <select value={state.pos} onChange={(event) => handleStateChange({ pos: event.target.value })}>
              {POS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Language</span>
            <select value={state.locale} onChange={(event) => handleStateChange({ locale: event.target.value })}>
              {LOCALE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Currency</span>
            <select value={state.currency} onChange={(event) => handleStateChange({ currency: event.target.value })}>
              {CURRENCY_OPTIONS.map((currency) => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label>
          <span>Product ID</span>
          <input
            type="number"
            min={1}
            value={state.productId}
            onChange={(event) => handleStateChange({ productId: Number(event.target.value) })}
            required
          />
        </label>

        <section className="yw-groups" aria-label="Guests">
          {state.groups.map((group, index) => (
            <div key={index} className="yw-group">
              <header className="yw-summary">Room {index + 1}</header>
              <div className="yw-group-controls">
                <label>
                  <span>Rooms</span>
                  <input
                    type="number"
                    min={1}
                    value={group.rooms}
                    onChange={(event) =>
                      onGroupChange(index, { rooms: Math.max(1, Number(event.target.value) || 1) })
                    }
                    required
                  />
                </label>
                <label>
                  <span>Adults</span>
                  <input
                    type="number"
                    min={1}
                    value={group.adults}
                    onChange={(event) =>
                      onGroupChange(index, { adults: Math.max(1, Number(event.target.value) || 1) })
                    }
                    required
                  />
                </label>
                <label>
                  <span>Children ages</span>
                  <input
                    type="text"
                    placeholder="e.g. 5.8"
                    value={group.childrenAges.join('.')}
                    onChange={(event) => onChildrenChange(index, event.target.value)}
                  />
                </label>
                <label>
                  <span>Infants</span>
                  <input
                    type="number"
                    min={0}
                    value={group.infants}
                    onChange={(event) =>
                      onGroupChange(index, { infants: Math.max(0, Number(event.target.value) || 0) })
                    }
                  />
                </label>
              </div>
              {state.groups.length > 1 && (
                <button
                  type="button"
                  className="yw-secondary"
                  onClick={() => removeGroup(index)}
                  aria-label={`Remove room ${index + 1}`}
                >
                  Remove room
                </button>
              )}
            </div>
          ))}
          <button type="button" className="yw-secondary" onClick={addGroup}>
            Add room
          </button>
          <p className="yw-summary">
            {groupsSummary.rooms} rooms · {groupsSummary.adults} adults · {groupsSummary.children} children ·{' '}
            {groupsSummary.infants} infants
          </p>
        </section>

        <label>
          <span>
            Redirect to booking engine
            <input
              type="checkbox"
              checked={state.redirect}
              onChange={(event) => handleStateChange({ redirect: event.target.checked })}
              style={{ marginLeft: '0.5rem' }}
            />
          </span>
        </label>

        {errorMessage && <p className="yw-error">{errorMessage}</p>}

        <div className="yw-actions">
          <button type="submit" className="yw-primary" disabled={state.isSearching}>
            {state.isSearching ? 'Searching…' : 'Search'}
          </button>
          <small className="yw-summary">{formatGroupsForm(state.groups)}</small>
        </div>
      </form>
    </div>
  );
};

BookingSearchWidget.displayName = 'BookingSearchWidget';
