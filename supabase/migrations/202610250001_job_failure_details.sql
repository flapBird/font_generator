begin;

alter table public.ai_font_jobs add column failure_code text
  check (failure_code in ('service_unavailable','service_busy','request_rejected','generation_failed','output_invalid','output_blocked','review_failed'));

-- Preserve the existing moderation and atomic credit-restoration gates. Store
-- only fixed public reason codes, never provider bodies, keys or private URLs.
create function public.ai_font_finish_job_with_reason(
  p_id uuid,p_status text,p_path text default null,p_name text default null,p_reason text default null
) returns void language plpgsql security definer set search_path=public as $$
declare j ai_font_jobs; owner_id uuid;
begin
  if p_status not in ('succeeded','failed') then raise exception 'INVALID_STATUS'; end if;
  if p_reason is not null and p_reason not in ('service_unavailable','service_busy','request_rejected','generation_failed','output_invalid','output_blocked','review_failed') then raise exception 'INVALID_REASON'; end if;
  if p_status='succeeded' and p_reason is not null then raise exception 'INVALID_REASON'; end if;
  select user_id into strict owner_id from ai_font_jobs where id=p_id;
  perform 1 from ai_font_wallets where user_id=owner_id for update;
  select * into strict j from ai_font_jobs where id=p_id for update;
  if j.status in ('succeeded','failed') then return; end if;
  perform ai_font_finish_job(p_id,p_status,p_path,p_name);
  update ai_font_jobs set failure_code=case when p_status='failed' then p_reason else null end where id=p_id;
end;
$$;
revoke all on function public.ai_font_finish_job_with_reason(uuid,text,text,text,text) from public,anon,authenticated;
grant execute on function public.ai_font_finish_job_with_reason(uuid,text,text,text,text) to service_role;

-- Historical failures deliberately remain unknown; no guessed backfill.
notify pgrst, 'reload schema';
commit;
