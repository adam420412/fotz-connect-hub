CREATE OR REPLACE FUNCTION public.record_crm_contact(
  p_entity_type text, p_entity_id uuid, p_contact_type text,
  p_result text, p_note text, p_next_step text, p_next_date date
) RETURNS uuid
LANGUAGE plpgsql SECURITY INVOKER SET search_path = public
AS $function$
DECLARE v_history_id uuid; v_lead_id uuid; v_status text;
BEGIN
  IF auth.uid() IS NULL OR NOT (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager')) THEN
    RAISE EXCEPTION 'Brak uprawnien';
  END IF;
  IF p_entity_type NOT IN ('lead', 'deal') OR p_contact_type NOT IN ('call', 'email', 'sms', 'meeting')
    OR p_result NOT IN ('no_answer', 'meeting', 'offer', 'callback', 'lost')
    OR length(COALESCE(p_note, '')) > 8000 OR length(COALESCE(p_next_step, '')) > 500 THEN
    RAISE EXCEPTION 'Nieprawidlowe dane kontaktu';
  END IF;
  IF p_result <> 'lost' AND (p_next_date IS NULL OR NULLIF(btrim(p_next_step), '') IS NULL) THEN
    RAISE EXCEPTION 'Wymagany nastepny krok i termin';
  END IF;
  IF p_result = 'lost' AND (p_next_date IS NOT NULL OR p_next_step IS NOT NULL) THEN
    RAISE EXCEPTION 'Przegrany rekord nie moze miec nastepnego kroku';
  END IF;
  v_status := CASE p_result WHEN 'meeting' THEN 'qualified' WHEN 'offer' THEN 'proposal' WHEN 'lost' THEN 'lost' ELSE NULL END;
  IF p_entity_type = 'lead' THEN
    UPDATE public.leads SET status = COALESCE(v_status, status), next_step = p_next_step, next_step_date = p_next_date
    WHERE id = p_entity_id RETURNING id INTO v_lead_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Lead niedostepny'; END IF;
  ELSE
    UPDATE public.deals SET stage = CASE p_result WHEN 'meeting' THEN 'qualification' WHEN 'offer' THEN 'proposal' WHEN 'lost' THEN 'lost' ELSE stage END,
      next_step = p_next_step, next_step_date = p_next_date
    WHERE id = p_entity_id RETURNING lead_id INTO v_lead_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Deal niedostepny'; END IF;
  END IF;
  INSERT INTO public.contact_history(lead_id, deal_id, contact_type, subject, content, contact_date, created_by)
  VALUES(v_lead_id, CASE WHEN p_entity_type = 'deal' THEN p_entity_id ELSE NULL END, p_contact_type,
    CASE p_result WHEN 'no_answer' THEN 'Nie odbiera' WHEN 'meeting' THEN 'Umowione spotkanie' WHEN 'offer' THEN 'Wyslana oferta' WHEN 'callback' THEN 'Oddzwonic w terminie' WHEN 'lost' THEN 'Niezainteresowany' END,
    COALESCE(NULLIF(btrim(p_note), ''), 'Zapis kontaktu'), now(), auth.uid())
  RETURNING id INTO v_history_id;
  RETURN v_history_id;
END;
$function$;
REVOKE ALL ON FUNCTION public.record_crm_contact(text, uuid, text, text, text, text, date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_crm_contact(text, uuid, text, text, text, text, date) TO authenticated;
