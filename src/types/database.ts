// Baseline types matching the versioned supabase/migrations files.
// Regenerate from your Supabase project after future schema changes (see README).
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Event = {
  id: string;
  owner_id: string;
  slug: string;
  title: string;
  description: string;
  starts_at: string;
  venue: string;
  is_published: boolean;
  theme_id: string;
  invitation_content: Json | null;
  music_enabled: boolean;
  published_at: string | null;
  timezone: string;
  public_function_ids: string[] | null;
  created_at: string;
};
type Rsvp = {
  id: string;
  event_id: string;
  user_id: string;
  name: string;
  attendance: "yes" | "no";
  guests: number;
  created_at: string;
};
type EventUpdate = { id: string; event_id: string; message: string; created_at: string; updated_at: string; is_published: boolean; pinned: boolean };
type Profile = { id: string; full_name: string; created_at: string };
type Theme = { id: string; name: string; description: string };
type Segment = { id: string; event_id: string; title: string; description: string; starts_at: string; venue: string; maps_url: string; sort_order: number; created_at: string };
type Media = { id: string; event_id: string; storage_path: string; alt_text: string; mime_type: string; size_bytes: number; created_at: string; width: number | null; height: number | null };
type GuestGroup = { id: string; event_id: string; name: string; function_ids: string[] | null; created_at: string };
type Guest = { id: string; event_id: string; group_id: string | null; name: string; email: string; phone: string; max_party_size: number; token_hash: string; created_at: string };
type GuestResponse = { guest_id: string; event_id: string; status: "attending" | "maybe" | "declined"; party_size: number; note: string; updated_at: string };
type EventRelationship<Name extends string> = [{ foreignKeyName: Name; columns: ["event_id"]; isOneToOne: false; referencedRelation: "events"; referencedColumns: ["id"] }];
type Table<Row, Required extends keyof Row, Relationships = []> = { Row: Row; Insert: Pick<Row, Required> & Partial<Omit<Row, Required>>; Update: Partial<Row>; Relationships: Relationships };

export type Database = {
  public: {
    Tables: {
      profiles: Table<Profile, "id">;
      themes: Table<Theme, "id" | "name">;
      event_segments: Table<Segment, "event_id" | "title" | "starts_at", EventRelationship<"event_segments_event_id_fkey">>;
      media: Table<Media, "event_id" | "storage_path" | "mime_type" | "size_bytes", EventRelationship<"media_event_id_fkey">>;
      guest_groups: Table<GuestGroup, "event_id" | "name", EventRelationship<"guest_groups_event_id_fkey">>;
      guests: Table<Guest, "event_id" | "name" | "token_hash", [...EventRelationship<"guests_event_id_fkey">, { foreignKeyName: "guests_group_id_event_id_fkey"; columns: ["group_id", "event_id"]; isOneToOne: false; referencedRelation: "guest_groups"; referencedColumns: ["id", "event_id"] }]>;
      guest_responses: Table<GuestResponse, "guest_id" | "event_id" | "status" | "party_size", [...EventRelationship<"guest_responses_event_id_fkey">, { foreignKeyName: "guest_responses_guest_id_event_id_fkey"; columns: ["guest_id", "event_id"]; isOneToOne: true; referencedRelation: "guests"; referencedColumns: ["id", "event_id"] }]>;
      events: {
        Row: Event;
        Insert: Pick<Event, "owner_id" | "slug" | "title" | "starts_at"> & Partial<Omit<Event, "owner_id" | "slug" | "title" | "starts_at">>;
        Update: Partial<Event>;
        Relationships: [{ foreignKeyName: "events_theme_id_fkey"; columns: ["theme_id"]; isOneToOne: false; referencedRelation: "themes"; referencedColumns: ["id"] }];
      };
      rsvps: {
        Row: Rsvp;
        Insert: Pick<Rsvp, "event_id" | "user_id" | "name" | "attendance"> & Partial<Pick<Rsvp, "id" | "guests" | "created_at">>;
        Update: Partial<Rsvp>;
        Relationships: [{ foreignKeyName: "rsvps_event_id_fkey"; columns: ["event_id"]; isOneToOne: false; referencedRelation: "events"; referencedColumns: ["id"] }];
      };
      event_updates: {
        Row: EventUpdate;
        Insert: Pick<EventUpdate, "event_id" | "message"> & Partial<Omit<EventUpdate, "event_id" | "message">>;
        Update: Partial<EventUpdate>;
        Relationships: [{ foreignKeyName: "event_updates_event_id_fkey"; columns: ["event_id"]; isOneToOne: false; referencedRelation: "events"; referencedColumns: ["id"] }];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      get_public_invitation: { Args: { p_slug: string }; Returns: Json };
      get_guest_invitation: { Args: { p_token: string }; Returns: Json };
      submit_guest_response: { Args: { p_token: string; p_status: string; p_party_size: number; p_note?: string }; Returns: Json };
      get_published_media: { Args: { p_media_id: string }; Returns: Json };
      is_invitation_published: { Args: { p_event_id: string }; Returns: boolean };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
