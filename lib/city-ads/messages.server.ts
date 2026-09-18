import type { SupabaseClient } from '@supabase/supabase-js';
import { sendSMS } from '@/lib/twilio';
import { sendEmail } from '@/lib/email';
// Re-exported for the admin route, which still decides the window at insert
// time. Delivery no longer re-checks it — see deliverCityMessage.
export { citySendWindow } from './send-window';

/** Fail closed, including when checking provider outreach about this family. */
export async function cityLeadBlocked(db: SupabaseClient, leadId: string): Promise<boolean> {
  const { data: lead, error } = await db.from('city_leads').select('phone,email,status,archived_at,is_test').eq('id', leadId).single();
  if (error) throw error;
  if (lead.is_test || lead.archived_at || lead.status === 'stopped') return true;
  const checks = [];
  if (lead.phone) checks.push(db.from('do_not_contact').select('id').eq('phone', String(lead.phone).replace(/\D/g, '').slice(-10)).limit(1));
  if (lead.email) checks.push(db.from('do_not_contact').select('id').eq('email', String(lead.email).trim().toLowerCase()).limit(1));
  for (const result of await Promise.all(checks)) {
    if (result.error) throw result.error;
    if (result.data?.length) return true;
  }
  return false;
}

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));

/** Claim before sending. Ambiguous/crashed sends are never automatically retried. */
export async function deliverCityMessage(db: SupabaseClient, id: string) {
  const { data: row, error } = await db.from('city_lead_messages').update({status:'sending'})
    .eq('id', id).eq('status','pending').lte('send_after', new Date().toISOString()).select('*').maybeSingle();
  if (error) throw error;
  if (!row) return;
  try {
    const {data: lead, error: leadError} = await db.from('city_leads').select('id,slug,phone,email').eq('id',row.lead_id).single();
    if (leadError) throw leadError;
    if (await cityLeadBlocked(db, lead.id)) {
      const {error:e} = await db.from('city_lead_messages').update({status:'canceled',completed_at:new Date().toISOString(),last_error:'Lead archived or opted out'}).eq('id',id);
      if(e) throw e;
      return;
    }
    // No send-window check here, deliberately. Both writers of this table are
    // responses rather than things we start: the native import's confirmation
    // answers a form the family submitted minutes ago, and an admin send is a
    // human choosing to reply. A family filling in a home care form at eleven
    // at night may be in the worst week of their life, and holding their
    // acknowledgement until 8am is not kindness.
    //
    // The window decision lives at INSERT time instead, encoded in send_after:
    // the admin route writes citySendWindow().nextStart when the sender asks to
    // schedule, and `now()` otherwise. Re-checking it here overrode that, so an
    // explicit "send now" at 9pm was silently deferred to the morning.
    //
    // Everything Olera initiates keeps its window and none of it comes through
    // here: provider nudges, day-2 checks and outcome pings live in
    // followups.server.ts behind POLITE_START/POLITE_END.
    //
    // cityLeadBlocked above is untouched and remains the real gate — opt-outs,
    // archived leads and do_not_contact still stop a send at any hour.
    const metadata = {lead_id:lead.id,city_message_id:id,sent_by:row.created_by};
    const result = row.channel === 'sms'
      ? await sendSMS({to:lead.phone,body:row.body,emailType:'city_lead_family_manual',recipientType:'family',metadata})
      : await sendEmail({to:lead.email,subject:row.subject,html:`<p>${escapeHtml(row.body).replace(/\n/g,'<br>')}</p>`,replyTo:'support@olera.care',emailType:'city_lead_family_manual',recipientType:'family',metadata});
    const {error:e} = await db.from('city_lead_messages').update({status:result.skipped?'canceled':result.success?'sent':'failed',completed_at:new Date().toISOString(),last_error:result.skipped?'Contact suppressed':result.success?null:result.error}).eq('id',id);
    if(e) throw e;
  } catch (error) {
    // Keep sending on exceptions: provider acceptance may be uncertain. Retrying
    // would risk a duplicate. Surface this explicitly for manual reconciliation.
    await db.from('city_lead_messages').update({last_error:'Delivery uncertain; check message history before sending again'}).eq('id',id).eq('status','sending');
    throw error;
  }
}

export async function runCityMessages(db: SupabaseClient) {
  const {data, error} = await db.from('city_lead_messages').select('id').eq('status','pending').lte('send_after',new Date().toISOString()).order('send_after').limit(50);
  if(error) throw error;
  let errors = 0;
  for(const row of data ?? []) { try { await deliverCityMessage(db,row.id); } catch(e) { errors++; console.error('[city-message]', row.id, e); } }
  return {processed:data?.length ?? 0,errors};
}
