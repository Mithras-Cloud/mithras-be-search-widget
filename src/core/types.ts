export type Theme = 'light' | 'dark';

export type WidgetEventType =
  | 'ready'
  | 'change'
  | 'validate_error'
  | 'search_start'
  | 'search_success'
  | 'search_error';

export interface WidgetEvent<T = unknown> {
  type: WidgetEventType;
  payload?: T;
}

export interface WidgetConfig {
  token: string;
  theme?: Theme;
  locale?: string;
  currency?: string;
  pos?: string;
  productId?: number;
  initialStart?: string;
  initialEnd?: string;
  initialGroups?: string;
  onEvent?: (event: WidgetEvent) => void;
  redirect?: boolean;
}

export interface GroupSpec {
  rooms: number;
  adults: number;
  childrenAges: number[];
  infants: number;
}

export interface WidgetState {
  startDate: string;
  endDate: string;
  pos: string;
  locale: string;
  currency: string;
  productId: number;
  groups: GroupSpec[];
  redirect: boolean;
  isSearching: boolean;
  lastResponse?: SearchResponse;
  errors: Partial<Record<string, string>>;
}

export interface SearchRequest {
  start_date: string;
  end_date: string;
  product_id: number;
  groups_form: string;
  pos: string;
  language: string;
  currency: string;
  redirect?: boolean;
}

export interface SearchResponse {
  search_id: string;
  booking_engine_url?: string;
  start_date?: string;
  end_date?: string;
  product_id?: number;
  groups_form?: string;
  pos?: string;
  language?: string;
  currency?: string;
  redirect?: boolean;
  [key: string]: unknown;
}

export interface SearchSuccessPayload {
  request: SearchRequest;
  response: SearchResponse;
}

export interface SearchErrorPayload {
  request: SearchRequest;
  error: Error;
}

export interface ValidationResult {
  valid: boolean;
  errors: Partial<Record<string, string>>;
}

export type EventEmitter = (event: WidgetEvent) => void;
