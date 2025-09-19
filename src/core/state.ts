import {
  WidgetConfig,
  WidgetState,
  ValidationResult,
  SearchRequest,
  GroupSpec,
  WidgetEvent,
  WidgetEventType,
} from './types';
import { cloneGroups, DEFAULT_GROUP, formatGroupsForm, parseGroupsForm } from './format';

const ISO_DATE_PATTERN = /\d{4}-\d{2}-\d{2}/;

const todayIso = () => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now.toISOString().slice(0, 10);
};

const addDays = (iso: string, days: number) => {
  const date = new Date(iso);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

const ensureIsoDate = (value: string | undefined, fallback: string) =>
  value && ISO_DATE_PATTERN.test(value) ? value : fallback;

const DEFAULT_LOCALE = 'en';
const DEFAULT_CURRENCY = 'USD';
const DEFAULT_POS = 'GLOBAL';
const DEFAULT_PRODUCT_ID = 1000;

export const createInitialState = (config: WidgetConfig): WidgetState => {
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
    pos: config.pos ?? DEFAULT_POS,
    locale: config.locale ?? DEFAULT_LOCALE,
    currency: config.currency ?? DEFAULT_CURRENCY,
    productId: config.productId ?? DEFAULT_PRODUCT_ID,
    groups: cloneGroups(groups),
    redirect: Boolean(config.redirect),
    isSearching: false,
    errors: {},
  };
};

const validateDateRange = (start: string, end: string) => {
  if (!ISO_DATE_PATTERN.test(start)) return 'Start date is invalid.';
  if (!ISO_DATE_PATTERN.test(end)) return 'End date is invalid.';
  if (end <= start) return 'End date must be after start date.';
  return null;
};

const validateGroups = (groups: GroupSpec[]) => {
  if (!groups.length) return 'At least one room group is required.';
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

export const validateState = (state: WidgetState): ValidationResult => {
  const errors: ValidationResult['errors'] = {};

  const dateError = validateDateRange(state.startDate, state.endDate);
  if (dateError) errors.dates = dateError;

  if (!state.productId || state.productId <= 0) {
    errors.productId = 'Product is required.';
  }

  const groupError = validateGroups(state.groups);
  if (groupError) errors.groups = groupError;

  if (!state.pos) errors.pos = 'POS is required.';
  if (!state.locale) errors.locale = 'Language is required.';
  if (!state.currency) errors.currency = 'Currency is required.';

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
};

export const buildSearchPayload = (
  state: WidgetState,
  config: WidgetConfig
): SearchRequest => {
  const groups_form = formatGroupsForm(state.groups);
  return {
    start_date: state.startDate,
    end_date: state.endDate,
    product_id: state.productId,
    groups_form,
    pos: state.pos,
    language: state.locale,
    currency: state.currency,
    redirect: state.redirect ?? config.redirect ?? false,
  };
};

export const emit = (emitter: WidgetConfig['onEvent'] | undefined, event: WidgetEvent) => {
  if (emitter) emitter(event);
};

export const forwardEvent = (
  emitter: WidgetConfig['onEvent'] | undefined,
  type: WidgetEventType,
  payload?: unknown
) => emit(emitter, { type, payload });
