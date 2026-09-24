-- Let an archived city lead be reopened on purpose.
--
-- Migration 228's city_lead_archive_guard copied archived_at back on EVERY
-- update to an archived lead, so nothing could ever reopen one. City
-- campaigns' "Not right, put them back" (unarchive_lead) has therefore never
-- worked, and Care Seeker Relationships could not archive a family's city
-- lead without that archive becoming permanent.
--
-- The guard's purpose was to stop an old offer or a late reply from reopening
-- a lead by accident. Those writes never touch archived_at, and the only code
-- that sets it to NULL is unarchive_lead, so an explicit NULL is always a
-- person reopening it. That is the one thing now allowed.
--
-- On reopen: status goes from 'stopped' back to 'new' (the relay only moves
-- new, offered and unfilled leads, so a reopened lead left 'stopped' would
-- never route), and the archive fields clear. Offers the archive expired stay
-- expired, so the relay skips providers who already saw it.
--
-- Never for an opt-out. A lead archived because they asked us to stop cannot
-- be reopened here; that has to go through do_not_contact.

CREATE OR REPLACE FUNCTION public.city_lead_archive_guard() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF OLD.archived_at IS NOT NULL THEN
    IF NEW.archived_at IS NULL THEN
      IF OLD.archive_reason = 'opted_out' THEN
        RAISE EXCEPTION 'Lead opted out and cannot be reopened';
      END IF;
      IF NEW.status = 'stopped' THEN NEW.status := 'new'; END IF;
      NEW.archive_reason := NULL;
      NEW.archived_by := NULL;
      NEW.next_offer_at := NULL;
      RETURN NEW;
    END IF;
    IF NEW.status <> 'stopped' THEN RAISE EXCEPTION 'Lead is archived'; END IF;
    NEW.archived_at := OLD.archived_at;
    NEW.archive_reason := OLD.archive_reason;
    NEW.archived_by := OLD.archived_by;
  END IF;
  IF NEW.archived_at IS NOT NULL THEN
    NEW.status := 'stopped';
    NEW.next_offer_at := NULL;
  END IF;
  RETURN NEW;
END $$;
