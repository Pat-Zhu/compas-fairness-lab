-- Classroom v3 supersedes the legacy anonymous SELECT/UPDATE policies.
-- The migration classroom_v3_host_controlled_sessions is already installed
-- in the existing Supabase project. See its migration history for the full DDL.
-- Never re-apply the permissive v2 policies from an older Git revision.
-- These idempotent statements close direct browser access while preserving data.
revoke all on public.class_responses from anon, authenticated;
revoke all on public.lab_sessions, public.lab_members from public, anon, authenticated;
alter table public.lab_sessions enable row level security;
alter table public.lab_members enable row level security;
-- Browser operations use capability-checked RPCs only:
-- lab_create, lab_join, lab_snapshot, lab_control, lab_submit.
-- The publishable key is public; it never grants facilitator authority by itself.
