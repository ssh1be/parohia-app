// deno-lint-ignore-file no-explicit-any
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

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
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const jwt = authHeader.replace('Bearer ', '');
    const { data: userData, error: authError } = await supabase.auth.getUser(jwt);
    const callerId = userData.user?.id;
    if (authError || !callerId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Ownership, not the self-editable user_type, decides whether parishes get wiped.
    // Users who abandoned onboarding have no profile and no parish and fall straight through.
    const { data: ownedParishes, error: parishError } = await supabase
      .from('parishes')
      .select('id')
      .eq('admin_user_id', callerId);

    if (parishError) {
      throw parishError;
    }

    // Wipe each owned parish and unassign its members first
    for (const { id: parishId } of ownedParishes || []) {
      {
        // Confession: reservations → schedules
        const { data: schedules } = await supabase
          .from('confession_schedules')
          .select('id')
          .eq('parish_id', parishId);
        const scheduleIds = (schedules || []).map((s) => s.id);
        if (scheduleIds.length > 0) {
          const { error } = await supabase
            .from('confession_reservations')
            .delete()
            .in('schedule_id', scheduleIds);
          if (error) throw error;
        }
        {
          const { error } = await supabase.from('confession_schedules').delete().eq('parish_id', parishId);
          if (error) throw error;
        }

        // Bulletin: responses → events → channels (subs/managers cascade from channels)
        const { data: events } = await supabase
          .from('bulletin_events')
          .select('id')
          .eq('parish_id', parishId);
        const eventIds = (events || []).map((e) => e.id);
        if (eventIds.length > 0) {
          const { error } = await supabase.from('bulletin_responses').delete().in('event_id', eventIds);
          if (error) throw error;
        }
        {
          const { error } = await supabase.from('bulletin_events').delete().eq('parish_id', parishId);
          if (error) throw error;
        }

        const { data: channels } = await supabase
          .from('bulletin_channels')
          .select('id')
          .eq('parish_id', parishId);
        const channelIds = (channels || []).map((c) => c.id);
        if (channelIds.length > 0) {
          await supabase.from('bulletin_channel_managers').delete().in('channel_id', channelIds);
          await supabase.from('bulletin_channel_subscriptions').delete().in('channel_id', channelIds);
          const { error } = await supabase.from('bulletin_channels').delete().eq('parish_id', parishId);
          if (error) throw error;
        }

        // Unassign members (they keep their profiles; next sign-in → parish selection)
        {
          const { error } = await supabase
            .from('user_parish_connections')
            .delete()
            .eq('parish_id', parishId);
          if (error) throw error;
        }

        {
          const { error } = await supabase.from('parishes').delete().eq('id', parishId);
          if (error) throw error;
        }
      }
    }

    // Posts this user authored (e.g. channel managers). created_by is NOT NULL, so delete.
    {
      const { data: ownEvents, error: ownEventsError } = await supabase
        .from('bulletin_events')
        .select('id')
        .eq('created_by', callerId);
      if (ownEventsError) throw ownEventsError;
      const ownEventIds = (ownEvents || []).map((e) => e.id);
      if (ownEventIds.length > 0) {
        const { error: respError } = await supabase
          .from('bulletin_responses')
          .delete()
          .in('event_id', ownEventIds);
        if (respError) throw respError;
        const { error: eventsError } = await supabase
          .from('bulletin_events')
          .delete()
          .in('id', ownEventIds);
        if (eventsError) throw eventsError;
      }
    }

    // Clean remaining rows that reference this user / profile
    await supabase.from('bulletin_channel_managers').update({ assigned_by: null }).eq('assigned_by', callerId);
    await supabase.from('bulletin_channel_managers').delete().eq('user_id', callerId);
    await supabase.from('bulletin_channel_subscriptions').delete().eq('user_id', callerId);
    await supabase.from('bulletin_responses').delete().eq('user_id', callerId);
    await supabase.from('confession_reservations').delete().eq('user_id', callerId);
    await supabase.from('user_parish_connections').delete().eq('user_id', callerId);
    await supabase.from('user_push_tokens').delete().eq('user_id', callerId);

    // Null created_by on leftover channels (nullable)
    await supabase.from('bulletin_channels').update({ created_by: null }).eq('created_by', callerId);

    {
      const { error } = await supabase.from('user_profiles').delete().eq('id', callerId);
      if (error) throw error;
    }

    const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(callerId);
    if (deleteAuthError) {
      throw deleteAuthError;
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('delete-parish-admin-account error:', error);
    return new Response(JSON.stringify({ error: error?.message || 'Failed to delete account' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
