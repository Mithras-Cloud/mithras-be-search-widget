import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { jsxs, jsx } from 'react/jsx-runtime';

// src/Widget.tsx

// src/core/format.ts
var DEFAULT_GROUP = {
  rooms: 1,
  adults: 2,
  childrenAges: [],
  infants: 0
};
var GROUP_SEPARATOR = ";";
var CHILD_SEPARATOR = ".";
var safeInt = (value, fallback = 0) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};
var safeFloat = (value) => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
};
var parseGroupsForm = (input) => {
  if (!input) return [DEFAULT_GROUP];
  return input.split(GROUP_SEPARATOR).map((segment) => segment.trim()).filter(Boolean).map((segment) => {
    const [roomsRaw, rest] = segment.split(":");
    const [adultsRaw, childrenRaw = "0", infantsRaw = "0"] = (rest != null ? rest : "").split(",");
    const childrenAges = childrenRaw.split(CHILD_SEPARATOR).map((age) => age.trim()).filter(Boolean).map((age) => safeFloat(age)).filter((age) => age >= 0);
    return {
      rooms: Math.max(1, safeInt(roomsRaw, 1)),
      adults: Math.max(1, safeInt(adultsRaw, 1)),
      childrenAges,
      infants: Math.max(0, safeInt(infantsRaw, 0))
    };
  });
};
var formatGroupsForm = (groups) => groups.map((group) => {
  const children = group.childrenAges.length ? group.childrenAges.map((age) => age.toString()).join(CHILD_SEPARATOR) : "0";
  return `${group.rooms}:${group.adults},${children},${group.infants}`;
}).join(GROUP_SEPARATOR);
var summarizeGuests = (groups) => {
  const summary = groups.reduce(
    (acc, group) => {
      acc.rooms += group.rooms;
      acc.adults += group.adults;
      acc.children += group.childrenAges.length;
      acc.infants += group.infants;
      return acc;
    },
    { rooms: 0, adults: 0, children: 0, infants: 0 }
  );
  return summary;
};
var cloneGroups = (groups) => groups.map((group) => ({ ...group, childrenAges: [...group.childrenAges] }));

// src/core/state.ts
var ISO_DATE_PATTERN = /\d{4}-\d{2}-\d{2}/;
var todayIso = () => {
  const now = /* @__PURE__ */ new Date();
  now.setHours(0, 0, 0, 0);
  return now.toISOString().slice(0, 10);
};
var addDays = (iso, days) => {
  const date = new Date(iso);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};
var ensureIsoDate = (value, fallback) => value && ISO_DATE_PATTERN.test(value) ? value : fallback;
var DEFAULT_LOCALE = "en";
var DEFAULT_CURRENCY = "USD";
var DEFAULT_POS = "GLOBAL";
var DEFAULT_PRODUCT_ID = 1e3;
var createInitialState = (config) => {
  var _a, _b, _c, _d;
  const baseStart = ensureIsoDate(config.initialStart, todayIso());
  const baseEnd = ensureIsoDate(config.initialEnd, addDays(baseStart, 1));
  const startDate = baseStart;
  let endDate = baseEnd;
  if (endDate <= startDate) {
    endDate = addDays(startDate, 1);
  }
  const parsedGroups = parseGroupsForm(config.initialGroups);
  const groups = parsedGroups.length ? parsedGroups : [DEFAULT_GROUP];
  return {
    startDate,
    endDate,
    pos: (_a = config.pos) != null ? _a : DEFAULT_POS,
    locale: (_b = config.locale) != null ? _b : DEFAULT_LOCALE,
    currency: (_c = config.currency) != null ? _c : DEFAULT_CURRENCY,
    productId: (_d = config.productId) != null ? _d : DEFAULT_PRODUCT_ID,
    groups: cloneGroups(groups),
    redirect: Boolean(config.redirect),
    isSearching: false,
    errors: {}
  };
};
var validateDateRange = (start, end) => {
  if (!ISO_DATE_PATTERN.test(start)) return "Start date is invalid.";
  if (!ISO_DATE_PATTERN.test(end)) return "End date is invalid.";
  if (end <= start) return "End date must be after start date.";
  return null;
};
var validateGroups = (groups) => {
  if (!groups.length) return "At least one room group is required.";
  for (const [index, group] of groups.entries()) {
    if (group.rooms <= 0) return `Room ${index + 1}: rooms must be greater than 0.`;
    if (group.adults <= 0) return `Room ${index + 1}: adults must be greater than 0.`;
    if (group.childrenAges.some((age) => age < 0)) {
      return `Room ${index + 1}: child ages must be >= 0.`;
    }
    if (group.infants < 0) return `Room ${index + 1}: infants must be >= 0.`;
  }
  return null;
};
var validateState = (state) => {
  const errors = {};
  const dateError = validateDateRange(state.startDate, state.endDate);
  if (dateError) errors.dates = dateError;
  if (!state.productId || state.productId <= 0) {
    errors.productId = "Product is required.";
  }
  const groupError = validateGroups(state.groups);
  if (groupError) errors.groups = groupError;
  if (!state.pos) errors.pos = "POS is required.";
  if (!state.locale) errors.locale = "Language is required.";
  if (!state.currency) errors.currency = "Currency is required.";
  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
};
var buildSearchPayload = (state, config) => {
  var _a, _b;
  const groups_form = formatGroupsForm(state.groups);
  return {
    start_date: state.startDate,
    end_date: state.endDate,
    product_id: state.productId,
    groups_form,
    pos: state.pos,
    language: state.locale,
    currency: state.currency,
    redirect: (_b = (_a = state.redirect) != null ? _a : config.redirect) != null ? _b : false
  };
};
var emit = (emitter, event) => {
  if (emitter) emitter(event);
};
var forwardEvent = (emitter, type, payload) => emit(emitter, { type, payload });
var POS_OPTIONS = ["GLOBAL", "HotelEscuela", "HotelDelSol"];
var LOCALE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "es", label: "Espa\xF1ol" },
  { value: "pt", label: "Portugu\xEAs" }
];
var CURRENCY_OPTIONS = ["USD", "EUR", "ARS", "BRL"];
var THEME_CLASS = "yw-container";
var styles = `
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
var ensureStyles = () => {
  if (typeof document === "undefined") return;
  if (document.getElementById("yw-styles")) return;
  const tag = document.createElement("style");
  tag.id = "yw-styles";
  tag.textContent = styles;
  document.head.appendChild(tag);
};
var mergeGroups = (groups, index, patch) => {
  var _a;
  const next = cloneGroups(groups);
  next[index] = {
    ...next[index],
    ...patch,
    childrenAges: (_a = patch.childrenAges) != null ? _a : next[index].childrenAges
  };
  return next;
};
var parseChildrenInput = (value) => value.split(/[.,]/).map((age) => age.trim()).filter(Boolean).map(Number).filter((age) => Number.isFinite(age) && age >= 0);
var BookingSearchWidget = (props) => {
  var _a;
  const [state, setState] = useState(() => createInitialState(props));
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
    props.redirect
  ]);
  const emit2 = useCallback(
    (type, payload) => {
      forwardEvent(props.onEvent, type, payload);
    },
    [props.onEvent]
  );
  useEffect(() => {
    emit2("ready", { state });
  }, []);
  const handleStateChange = useCallback(
    (next) => {
      setState((prev) => {
        const candidate = typeof next === "function" ? next(prev) : { ...prev, ...next };
        emit2("change", { state: candidate });
        return candidate;
      });
    },
    [emit2]
  );
  const handleSubmit = async (event) => {
    event.preventDefault();
    const validation = validateState(state);
    if (!validation.valid) {
      handleStateChange({ errors: validation.errors });
      emit2("validate_error", validation);
      return;
    }
    const payload = buildSearchPayload({ ...state}, props);
    handleStateChange({ isSearching: true, errors: {} });
    emit2("search_start", payload);
    try {
      const response = await fetch("https://gateway-prod.pxsol.com/v2/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${props.token}`
        },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        throw new Error(`Search failed with status ${response.status}`);
      }
      const data = await response.json();
      handleStateChange({ isSearching: false, lastResponse: data });
      emit2("search_success", { request: payload, response: data });
      if ((payload.redirect || props.redirect) && data.booking_engine_url) {
        window.location.assign(data.booking_engine_url);
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error("Unexpected error");
      handleStateChange({ isSearching: false });
      emit2("search_error", { request: payload, error: err });
      console.error("[booking-search-widget]", err);
    }
  };
  const groupsSummary = useMemo(() => summarizeGuests(state.groups), [state.groups]);
  const errorMessage = Object.values(state.errors)[0];
  const addGroup = () => {
    handleStateChange((prev) => ({
      ...prev,
      groups: [...cloneGroups(prev.groups), { rooms: 1, adults: 2, childrenAges: [], infants: 0 }]
    }));
  };
  const removeGroup = (index) => {
    handleStateChange((prev) => ({
      ...prev,
      groups: prev.groups.filter((_, idx) => idx !== index)
    }));
  };
  const onGroupChange = (index, patch) => {
    handleStateChange((prev) => ({
      ...prev,
      groups: mergeGroups(prev.groups, index, patch)
    }));
  };
  const onChildrenChange = (index, value) => {
    const childrenAges = parseChildrenInput(value);
    onGroupChange(index, { childrenAges });
  };
  return /* @__PURE__ */ jsxs("div", { className: THEME_CLASS, "data-theme": (_a = props.theme) != null ? _a : "light", role: "region", "aria-live": "polite", children: [
    /* @__PURE__ */ jsx("h2", { children: "Booking search" }),
    /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, noValidate: true, children: [
      /* @__PURE__ */ jsxs("div", { className: "yw-row yw-row--inline", children: [
        /* @__PURE__ */ jsxs("label", { children: [
          /* @__PURE__ */ jsx("span", { children: "Check-in" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "date",
              value: state.startDate,
              onChange: (event) => handleStateChange({ startDate: event.target.value }),
              required: true
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("label", { children: [
          /* @__PURE__ */ jsx("span", { children: "Check-out" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "date",
              value: state.endDate,
              min: state.startDate,
              onChange: (event) => handleStateChange({ endDate: event.target.value }),
              required: true
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "yw-row yw-row--inline", children: [
        /* @__PURE__ */ jsxs("label", { children: [
          /* @__PURE__ */ jsx("span", { children: "POS" }),
          /* @__PURE__ */ jsx("select", { value: state.pos, onChange: (event) => handleStateChange({ pos: event.target.value }), children: POS_OPTIONS.map((option) => /* @__PURE__ */ jsx("option", { value: option, children: option }, option)) })
        ] }),
        /* @__PURE__ */ jsxs("label", { children: [
          /* @__PURE__ */ jsx("span", { children: "Language" }),
          /* @__PURE__ */ jsx("select", { value: state.locale, onChange: (event) => handleStateChange({ locale: event.target.value }), children: LOCALE_OPTIONS.map((option) => /* @__PURE__ */ jsx("option", { value: option.value, children: option.label }, option.value)) })
        ] }),
        /* @__PURE__ */ jsxs("label", { children: [
          /* @__PURE__ */ jsx("span", { children: "Currency" }),
          /* @__PURE__ */ jsx("select", { value: state.currency, onChange: (event) => handleStateChange({ currency: event.target.value }), children: CURRENCY_OPTIONS.map((currency) => /* @__PURE__ */ jsx("option", { value: currency, children: currency }, currency)) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("label", { children: [
        /* @__PURE__ */ jsx("span", { children: "Product ID" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "number",
            min: 1,
            value: state.productId,
            onChange: (event) => handleStateChange({ productId: Number(event.target.value) }),
            required: true
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("section", { className: "yw-groups", "aria-label": "Guests", children: [
        state.groups.map((group, index) => /* @__PURE__ */ jsxs("div", { className: "yw-group", children: [
          /* @__PURE__ */ jsxs("header", { className: "yw-summary", children: [
            "Room ",
            index + 1
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "yw-group-controls", children: [
            /* @__PURE__ */ jsxs("label", { children: [
              /* @__PURE__ */ jsx("span", { children: "Rooms" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "number",
                  min: 1,
                  value: group.rooms,
                  onChange: (event) => onGroupChange(index, { rooms: Math.max(1, Number(event.target.value) || 1) }),
                  required: true
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("label", { children: [
              /* @__PURE__ */ jsx("span", { children: "Adults" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "number",
                  min: 1,
                  value: group.adults,
                  onChange: (event) => onGroupChange(index, { adults: Math.max(1, Number(event.target.value) || 1) }),
                  required: true
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("label", { children: [
              /* @__PURE__ */ jsx("span", { children: "Children ages" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  placeholder: "e.g. 5.8",
                  value: group.childrenAges.join("."),
                  onChange: (event) => onChildrenChange(index, event.target.value)
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("label", { children: [
              /* @__PURE__ */ jsx("span", { children: "Infants" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "number",
                  min: 0,
                  value: group.infants,
                  onChange: (event) => onGroupChange(index, { infants: Math.max(0, Number(event.target.value) || 0) })
                }
              )
            ] })
          ] }),
          state.groups.length > 1 && /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              className: "yw-secondary",
              onClick: () => removeGroup(index),
              "aria-label": `Remove room ${index + 1}`,
              children: "Remove room"
            }
          )
        ] }, index)),
        /* @__PURE__ */ jsx("button", { type: "button", className: "yw-secondary", onClick: addGroup, children: "Add room" }),
        /* @__PURE__ */ jsxs("p", { className: "yw-summary", children: [
          groupsSummary.rooms,
          " rooms \xB7 ",
          groupsSummary.adults,
          " adults \xB7 ",
          groupsSummary.children,
          " children \xB7",
          " ",
          groupsSummary.infants,
          " infants"
        ] })
      ] }),
      /* @__PURE__ */ jsx("label", { children: /* @__PURE__ */ jsxs("span", { children: [
        "Redirect to booking engine",
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "checkbox",
            checked: state.redirect,
            onChange: (event) => handleStateChange({ redirect: event.target.checked }),
            style: { marginLeft: "0.5rem" }
          }
        )
      ] }) }),
      errorMessage && /* @__PURE__ */ jsx("p", { className: "yw-error", children: errorMessage }),
      /* @__PURE__ */ jsxs("div", { className: "yw-actions", children: [
        /* @__PURE__ */ jsx("button", { type: "submit", className: "yw-primary", disabled: state.isSearching, children: state.isSearching ? "Searching\u2026" : "Search" }),
        /* @__PURE__ */ jsx("small", { className: "yw-summary", children: formatGroupsForm(state.groups) })
      ] })
    ] })
  ] });
};
BookingSearchWidget.displayName = "BookingSearchWidget";

export { BookingSearchWidget, buildSearchPayload, createInitialState, formatGroupsForm, parseGroupsForm, summarizeGuests, validateState };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map