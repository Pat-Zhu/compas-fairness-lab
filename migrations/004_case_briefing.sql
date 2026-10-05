-- Applied migration: add_case_briefing_and_reading_evidence_v4.
-- Run once on the v3 classroom schema. Existing response stage IDs are preserved.
begin;
alter table public.lab_sessions add column if not exists reading_visible boolean not null default false;
alter table public.lab_sessions drop constraint lab_sessions_stage_check;
alter table public.lab_sessions add constraint lab_sessions_stage_check check (stage between 0 and 10);
do $patch$
declare src text;
begin
 select pg_get_functiondef('public.lab_control(uuid,text,text,jsonb)'::regprocedure) into src;
 if position('v>9' in src)=0 then raise exception 'Unexpected lab_control version; migration requires v3'; end if;
 src:=replace(src,'v>9','v>10');
 src:=replace(src,'results_visible=false,timer_end=null','results_visible=false,reading_visible=false,timer_end=null');
 src:=replace(src,'context=p_value#>>''{}'',voting_open=true,results_visible=false','context=p_value#>>''{}'',voting_open=true,results_visible=false,reading_visible=false');
 src:=replace(src, 'elsif p_action=''end'' then',
 'elsif p_action=''reading'' then
  if s.stage not in (2,4,5,7) then raise exception ''This activity has no reading evidence''; end if;
  if jsonb_typeof(p_value) is distinct from ''boolean'' then raise exception ''Choose a boolean reveal state''; end if;
  update public.lab_sessions set reading_visible=(p_value#>>''{}'')::boolean,version=version+1 where id=s.id;
 elsif p_action=''end'' then');
 if position('p_action=''reading''' in src)=0 then raise exception 'Reading command patch failed'; end if;
 execute src;
 select pg_get_functiondef('public.lab_snapshot(uuid,text,text,text)'::regprocedure) into src;
 if position('''results_visible'',s.results_visible,' in src)=0 then raise exception 'Unexpected lab_snapshot version'; end if;
 src:=replace(src,'''results_visible'',s.results_visible,','''results_visible'',s.results_visible,''reading_visible'',s.reading_visible,');
 execute src;
end $patch$;
commit;
