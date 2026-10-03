// deno-lint-ignore-file no-explicit-any
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders });
    }

    const jwt = authHeader.replace('Bearer ', '');
    const { data: userData } = await supabase.auth.getUser(jwt);
    const callerId = userData.user?.id;
    if (!callerId) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders });
    }

    const { parishId, eventId } = await req.json();
    if (!parishId || !eventId) {
      return new Response('Bad Request', { status: 400, headers: corsHeaders });
    }

    const { data: parish, error: parishErr } = await supabase
      .from('parishes')
      .select('id, name, admin_user_id')
      .eq('id', parishId)
      .single();
    if (parishErr || !parish) {
      return new Response('Parish not found', { status: 404, headers: corsHeaders });
    }
    if (parish.admin_user_id !== callerId) {
      return new Response('Forbidden', { status: 403, headers: corsHeaders });
    }

    const { data: event, error: eventErr } = await supabase
      .from('bulletin_events')
      .select(
        'id, title, description, event_type, event_date, event_time, location, notify, is_active, channel_id, parish_id'
      )
      .eq('id', eventId)
      .single();
    if (eventErr || !event) {
      return new Response('Event not found', { status: 404, headers: corsHeaders });
    }
    if (event.parish_id !== parishId) {
      return new Response('Forbidden', { status: 403, headers: corsHeaders });
    }
    if (!event.is_active || !event.notify) {
      return new Response('No notify required', { status: 200, headers: corsHeaders });
    }
    if (!event.channel_id) {
      return new Response('Event has no channel', { status: 400, headers: corsHeaders });
    }

    // Notify channel subscribers only (not all parish connections)
    const { data: subscriptions, error: subErr } = await supabase
      .from('bulletin_channel_subscriptions')
      .select('user_id')
      .eq('channel_id', event.channel_id);
    if (subErr) throw subErr;

    const userIds = [...new Set((subscriptions ?? []).map((c) => c.user_id).filter(Boolean))];
    // Don't notify the admin who published
    const recipientIds = userIds.filter((id) => id !== callerId);
    if (recipientIds.length === 0) {
      return new Response('No subscribers', { status: 200, headers: corsHeaders });
    }

    const { data: tokens, error: tokenErr } = await supabase
      .from('user_push_tokens')
      .select('token')
      .in('user_id', recipientIds)
      .eq('revoked', false);
    if (tokenErr) throw tokenErr;

    const distinctTokens = [...new Set((tokens ?? []).map((t) => t.token))];
    if (distinctTokens.length === 0) {
      return new Response('No tokens', { status: 200, headers: corsHeaders });
    }

    const { data: channel } = await supabase
      .from('bulletin_channels')
      .select('name')
      .eq('id', event.channel_id)
      .maybeSingle();

    const titlePrefix =
      event.event_type === 'volunteer'
        ? 'Volunteers needed - '
        : event.event_type === 'event'
          ? 'Parish event - '
          : 'Announcement - ';
    const channelSuffix = channel?.name ? ` · ${channel.name}` : '';
    const notificationTitle = `${parish.name || 'Parish Bulletin'}${channelSuffix}`;

    let timing = '';
    try {
      if (event.event_date) {
        const [y, m, d] = event.event_date.split('-').map(Number);
        const localDate = new Date(y, (m ?? 1) - 1, d ?? 1);
        const dateText = localDate.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        });
        if (event.event_time) {
          const [hh, mm] = event.event_time.split(':').map(Number);
          const h12 = hh === 0 ? 12 : hh > 12 ? hh - 12 : hh;
          const ampm = hh >= 12 ? 'PM' : 'AM';
          const min = String(mm ?? 0).padStart(2, '0');
          timing = ` on ${dateText} at ${h12}:${min} ${ampm}`;
        } else {
          timing = ` on ${dateText}`;
        }
      }
    } catch {
      // ignore date formatting errors
    }

    const body = `${titlePrefix}${event.title}${timing}${event.location ? ` • ${event.location}` : ''}`;
    const chunkSize = 100;
    for (let i = 0; i < distinctTokens.length; i += chunkSize) {
      const chunk = distinctTokens.slice(i, i + chunkSize);
      const messages = chunk.map((token) => ({
        to: token,
        sound: 'default',
        title: notificationTitle,
        body,
        data: {
          type: 'bulletin-broadcast',
          eventId: event.id,
          eventType: event.event_type,
          channelId: event.channel_id,
        },
        priority: 'high',
      }));

      const res = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messages),
      });
      if (!res.ok) {
        const errText = await res.text();
        console.error('Expo push send failed:', errText);
      }
    }

    return new Response('ok', { status: 200, headers: corsHeaders });
  } catch (e) {
    console.error(e);
    return new Response('Internal Error', { status: 500, headers: corsHeaders });
  }
});
