// src/types/index.ts

export type CourtSurface = "clay" | "hard" | "grass" | "synthetic";
export type CourtStatus = "available" | "maintenance" | "inactive";
export type BookingStatus = "confirmed" | "cancelled" | "completed" | "no_show";
export type BookingType = "casual" | "doubles" | "tournament" | "training";
export type TournamentStatus =
  | "draft"
  | "registration"
  | "in_progress"
  | "completed"
  | "cancelled";
export type TournamentModality =
  | "singles_men"
  | "singles_women"
  | "doubles_men"
  | "doubles_women"
  | "doubles_mixed";
export type TournamentFormat =
  | "single_elimination"
  | "double_elimination"
  | "round_robin";

export interface Court {
  id: string;
  name: string;
  surface: CourtSurface;
  status: CourtStatus;
  has_lighting: boolean;
  created_at: string;
}

export interface Member {
  id: string;
  user_id: string;
  full_name: string;
  member_number: string;
  email: string;
  phone?: string;
  status: "active" | "inactive" | "suspended";
  created_at: string;
}

export interface Booking {
  id: string;
  court_id: string;
  member_id: string;
  partner_name?: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  type: BookingType;
  status: BookingStatus;
  notes?: string;
  created_at: string;
  court?: Court;
  member?: Member;
}

export interface Tournament {
  id: string;
  name: string;
  description?: string;
  modality: TournamentModality;
  format: TournamentFormat;
  max_participants: number;
  start_date: string;
  end_date: string;
  registration_deadline?: string;
  status: TournamentStatus;
  created_by?: string;
  created_at: string;
  registrations_count?: number;
}

export interface TournamentRegistration {
  id: string;
  tournament_id: string;
  member_id: string;
  partner_name?: string;
  seed?: number;
  status: "registered" | "confirmed" | "withdrawn";
  registered_at: string;
  member?: Member;
}

export interface TournamentMatch {
  id: string;
  tournament_id: string;
  round: string;
  match_number: number;
  player1_name?: string;
  player2_name?: string;
  player1_id?: string;
  player2_id?: string;
  winner_id?: string;
  winner_name?: string;
  score?: string;
  scheduled_at?: string;
  status: "pending" | "scheduled" | "in_progress" | "completed" | "walkover";
}
