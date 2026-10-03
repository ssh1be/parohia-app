import { supabase } from '../config/supabase';

export interface BulletinChannel {
  id: string;
  parish_id: string;
  name: string;
  description?: string | null;
  is_default: boolean;
  is_archived: boolean;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  is_subscribed?: boolean;
  subscriber_count?: number;
}

export class ChannelService {
  static async listChannels(
    parishId: string,
    options?: { includeArchived?: boolean; userId?: string }
  ): Promise<BulletinChannel[]> {
    let query = supabase
      .from('bulletin_channels')
      .select('*')
      .eq('parish_id', parishId)
      .order('is_default', { ascending: false })
      .order('name', { ascending: true });

    if (!options?.includeArchived) {
      query = query.eq('is_archived', false);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error listing channels:', error);
      throw error;
    }

    const channels = (data || []) as BulletinChannel[];

    if (options?.userId && channels.length > 0) {
      const { data: subs } = await supabase
        .from('bulletin_channel_subscriptions')
        .select('channel_id')
        .eq('user_id', options.userId)
        .in(
          'channel_id',
          channels.map((c) => c.id)
        );

      const subscribed = new Set((subs || []).map((s) => s.channel_id));
      channels.forEach((c) => {
        c.is_subscribed = subscribed.has(c.id);
      });
    }

    return channels;
  }

  static async getSubscribedChannelIds(userId: string, parishId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('bulletin_channel_subscriptions')
      .select('channel_id, bulletin_channels!inner(parish_id, is_archived)')
      .eq('user_id', userId)
      .eq('bulletin_channels.parish_id', parishId)
      .eq('bulletin_channels.is_archived', false);

    if (error) {
      console.error('Error fetching subscriptions:', error);
      throw error;
    }

    return (data || []).map((row: any) => row.channel_id);
  }

  static async ensureGeneralSubscription(
    userId: string,
    parishId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: general, error: channelError } = await supabase
        .from('bulletin_channels')
        .select('id')
        .eq('parish_id', parishId)
        .eq('is_default', true)
        .maybeSingle();

      if (channelError) {
        return { success: false, error: channelError.message };
      }
      if (!general?.id) {
        return { success: false, error: 'General channel not found' };
      }

      const { error } = await supabase.from('bulletin_channel_subscriptions').upsert(
        { channel_id: general.id, user_id: userId },
        { onConflict: 'channel_id,user_id', ignoreDuplicates: true }
      );

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (error) {
      console.error('Error ensuring General subscription:', error);
      return { success: false, error: 'Failed to subscribe to General' };
    }
  }

  static async ensureGeneralChannel(
    parishId: string,
    createdBy?: string
  ): Promise<{ success: boolean; channel?: BulletinChannel; error?: string }> {
    try {
      const { data: existing } = await supabase
        .from('bulletin_channels')
        .select('*')
        .eq('parish_id', parishId)
        .eq('is_default', true)
        .maybeSingle();

      if (existing) {
        return { success: true, channel: existing as BulletinChannel };
      }

      const { data, error } = await supabase
        .from('bulletin_channels')
        .insert({
          parish_id: parishId,
          name: 'General',
          description: 'Default parish channel',
          is_default: true,
          created_by: createdBy || null,
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, channel: data as BulletinChannel };
    } catch (error) {
      console.error('Error ensuring General channel:', error);
      return { success: false, error: 'Failed to create General channel' };
    }
  }

  static async subscribe(
    channelId: string,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.from('bulletin_channel_subscriptions').upsert(
        { channel_id: channelId, user_id: userId },
        { onConflict: 'channel_id,user_id', ignoreDuplicates: true }
      );
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (error) {
      console.error('Error subscribing to channel:', error);
      return { success: false, error: 'Failed to join channel' };
    }
  }

  static async unsubscribe(
    channelId: string,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: channel, error: channelError } = await supabase
        .from('bulletin_channels')
        .select('id, is_default')
        .eq('id', channelId)
        .single();

      if (channelError || !channel) {
        return { success: false, error: channelError?.message || 'Channel not found' };
      }
      if (channel.is_default) {
        return { success: false, error: 'You cannot leave the General channel' };
      }

      const { error } = await supabase
        .from('bulletin_channel_subscriptions')
        .delete()
        .eq('channel_id', channelId)
        .eq('user_id', userId);

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (error) {
      console.error('Error unsubscribing from channel:', error);
      return { success: false, error: 'Failed to leave channel' };
    }
  }

  static async createChannel(
    parishId: string,
    userId: string,
    name: string,
    description?: string
  ): Promise<{ success: boolean; channel?: BulletinChannel; error?: string }> {
    try {
      const trimmed = name.trim();
      if (!trimmed) {
        return { success: false, error: 'Channel name is required' };
      }

      const { data, error } = await supabase
        .from('bulletin_channels')
        .insert({
          parish_id: parishId,
          name: trimmed,
          description: description?.trim() || null,
          is_default: false,
          created_by: userId,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          return { success: false, error: 'A channel with this name already exists' };
        }
        return { success: false, error: error.message };
      }
      return { success: true, channel: data as BulletinChannel };
    } catch (error) {
      console.error('Error creating channel:', error);
      return { success: false, error: 'Failed to create channel' };
    }
  }

  static async renameChannel(
    channelId: string,
    name: string,
    description?: string | null
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: channel, error: channelError } = await supabase
        .from('bulletin_channels')
        .select('id, is_default')
        .eq('id', channelId)
        .single();

      if (channelError || !channel) {
        return { success: false, error: channelError?.message || 'Channel not found' };
      }
      if (channel.is_default) {
        return { success: false, error: 'The General channel cannot be renamed' };
      }

      const trimmed = name.trim();
      if (!trimmed) {
        return { success: false, error: 'Channel name is required' };
      }

      const updates: Record<string, unknown> = {
        name: trimmed,
        updated_at: new Date().toISOString(),
      };
      if (description !== undefined) {
        updates.description = description?.trim() || null;
      }

      const { error } = await supabase
        .from('bulletin_channels')
        .update(updates)
        .eq('id', channelId);

      if (error) {
        if (error.code === '23505') {
          return { success: false, error: 'A channel with this name already exists' };
        }
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (error) {
      console.error('Error renaming channel:', error);
      return { success: false, error: 'Failed to rename channel' };
    }
  }

  static async archiveChannel(channelId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: channel, error: channelError } = await supabase
        .from('bulletin_channels')
        .select('id, is_default')
        .eq('id', channelId)
        .single();

      if (channelError || !channel) {
        return { success: false, error: channelError?.message || 'Channel not found' };
      }
      if (channel.is_default) {
        return { success: false, error: 'The General channel cannot be archived' };
      }

      const { error } = await supabase
        .from('bulletin_channels')
        .update({ is_archived: true, updated_at: new Date().toISOString() })
        .eq('id', channelId);

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (error) {
      console.error('Error archiving channel:', error);
      return { success: false, error: 'Failed to archive channel' };
    }
  }
}
