// Mirror of backend Pydantic — keep in sync.

export type QuoteStyle =
  | "stoic"
  | "modern"
  | "spiritual"
  | "romanian_authors"
  | "existentialist";

export type EventType =
  | "birthday"
  | "anniversary"
  | "celebration"
  | "reminder"
  | "other";

export type MorningStyle = "energetic" | "slow" | "variable" | "no_routine";
export type MotivationStyle = "challenging" | "gentle" | "mixed" | "self";

export type FocusArea =
  | "career"
  | "health"
  | "relationships"
  | "creativity"
  | "peace"
  | "finance"
  | "self_knowledge";

export interface SpecialEvent {
  label: string;
  month: number;
  day: number;
  event_type: EventType;
}

export interface UserProfile {
  productive_days: number[];
  rest_days: number[];
  reflection_day: number;
  morning_style: MorningStyle;
  motivation_style: MotivationStyle;
  focus_areas: FocusArea[];
  quote_styles: QuoteStyle[];
}

export interface IconMapping {
  productive: string[];
  rest: string[];
  reflection: string[];
  celebration: string[];
  other: string[];
}

export interface CalendarConfig {
  template: "template1";
  first_name: string;
  start_date: string; // ISO (yyyy-mm-dd)
  special_events: SpecialEvent[];
  selected_holidays: string[];
  user_profile: UserProfile;
  icon_mapping: IconMapping;
  cover_message?: string | null;
  closing_message?: string | null;
  calendar_name: string;
}

export interface OrderCreateRequest {
  calendar_config: CalendarConfig;
  email: string;
  gdpr_consent: boolean;
  marketing_consent: boolean;
  withdrawal_waiver: boolean;
}

export interface OrderCreateResponse {
  order_id: string;
  checkout_url: string;
}

export type OrderStatusValue =
  | "pending_payment"
  | "generating"
  | "ready"
  | "failed"
  | "deleted";

export interface OrderStatusResponse {
  order_id: string;
  status: OrderStatusValue;
  download_url?: string | null;
  estimated_ready_at?: string | null;
  error_message?: string | null;
}
