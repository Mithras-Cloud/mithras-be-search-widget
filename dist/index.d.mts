import React from 'react';

type Theme = 'light' | 'dark';
type WidgetEventType = 'ready' | 'change' | 'validate_error' | 'search_start' | 'search_success' | 'search_error';
interface WidgetEvent<T = unknown> {
    type: WidgetEventType;
    payload?: T;
}
interface WidgetConfig {
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
interface GroupSpec {
    rooms: number;
    adults: number;
    childrenAges: number[];
    infants: number;
}
interface WidgetState {
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
interface SearchRequest {
    start_date: string;
    end_date: string;
    product_id: number;
    groups_form: string;
    pos: string;
    language: string;
    currency: string;
    redirect?: boolean;
}
interface SearchResponse {
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
interface SearchSuccessPayload {
    request: SearchRequest;
    response: SearchResponse;
}
interface SearchErrorPayload {
    request: SearchRequest;
    error: Error;
}
interface ValidationResult {
    valid: boolean;
    errors: Partial<Record<string, string>>;
}
type EventEmitter = (event: WidgetEvent) => void;

type BookingSearchWidgetProps = WidgetConfig & {
    redirect?: boolean;
};
declare const BookingSearchWidget: React.FC<BookingSearchWidgetProps>;

declare const parseGroupsForm: (input?: string) => GroupSpec[];
declare const formatGroupsForm: (groups: GroupSpec[]) => string;
declare const summarizeGuests: (groups: GroupSpec[]) => {
    rooms: number;
    adults: number;
    children: number;
    infants: number;
};

declare const createInitialState: (config: WidgetConfig) => WidgetState;
declare const validateState: (state: WidgetState) => ValidationResult;
declare const buildSearchPayload: (state: WidgetState, config: WidgetConfig) => SearchRequest;

export { BookingSearchWidget, type BookingSearchWidgetProps, type EventEmitter, type GroupSpec, type SearchErrorPayload, type SearchRequest, type SearchResponse, type SearchSuccessPayload, type Theme, type ValidationResult, type WidgetConfig, type WidgetEvent, type WidgetEventType, type WidgetState, buildSearchPayload, createInitialState, formatGroupsForm, parseGroupsForm, summarizeGuests, validateState };
