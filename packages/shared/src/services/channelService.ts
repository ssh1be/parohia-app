import { supabase } from '../client';

export interface BulletinChannel {
  id: string;
  parish_id: string;
  name: string;
  description?: string | null;
  is_default: boolean;
  is_chant: boolean;
  is_archived: boolean;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  is_subscribed?: boolean;
  subscriber_count?: number;
  manager_count?: number;
  manager_ids?: string[];
}

export interface ChannelManager {
  user_id: string;
  channel_id: string;
  assigned_by?: string | null;
  created_at?: string;
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
      .order('is_chant', { ascending: false })
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

    if (channels.length > 0) {
      const channelIds = channels.map((c) => c.id);

      if (options?.userId) {
        const { data: subs } = await supabase
          .from('bulletin_channel_subscriptions')
          .select('channel_id')
          .eq('user_id', options.userId)
          .in('channel_id', channelIds);

        const subscribed = new Set((subs || []).map((s) => s.channel_id));
        channels.forEach((c) => {
          c.is_subscribed = subscribed.has(c.id);
        });
      }

      const { data: managers } = await supabase
        .from('bulletin_channel_managers')
        .select('channel_id, user_id')
        .in('channel_id', channelIds);

      const managersByChannel = new Map<string, string[]>();
      for (const row of managers || []) {
        const list = managersByChannel.get(row.channel_id) || [];
        list.push(row.user_id);
        managersByChannel.set(row.channel_id, list);
      }
      channels.forEach((c) => {
        const ids = managersByChannel.get(c.id) || [];
        c.manager_ids = ids;
        c.manager_count = ids.length;
      });
    }

    return channels;
  }

  static async listChannelManagers(channelId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('bulletin_channel_managers')
      .select('user_id')
      .eq('channel_id', channelId);

    if (error) {
      console.error('Error listing channel managers:', error);
      throw error;
    }

    return (data || []).map((row) => row.user_id);
  }

  static async getManagedChannelIds(userId: string, parishId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('bulletin_channel_managers')
      .select('channel_id, bulletin_channels!inner(parish_id, is_archived)')
      .eq('user_id', userId)
      .eq('bulletin_channels.parish_id', parishId)
      .eq('bulletin_channels.is_archived', false);

    if (error) {
      console.error('Error fetching managed channels:', error);
      throw error;
    }

    return (data || []).map((row: any) => row.channel_id);
  }

  static async getParishManagerUserIds(parishId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('bulletin_channel_managers')
      .select('user_id, bulletin_channels!inner(parish_id, is_archived)')
      .eq('bulletin_channels.parish_id', parishId)
      .eq('bulletin_channels.is_archived', false);

    if (error) {
      console.error('Error fetching parish managers:', error);
      throw error;
    }

    return Array.from(new Set((data || []).map((row: any) => row.user_id).filter(Boolean)));
  }

  /** Replace the manager set for a channel; also ensures each manager is subscribed. */
  static async setChannelManagers(
    channelId: string,
    userIds: string[],
    assignedBy: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const uniqueIds = Array.from(new Set(userIds.filter(Boolean)));

      const { data: existing, error: existingError } = await supabase
        .from('bulletin_channel_managers')
        .select('user_id')
        .eq('channel_id', channelId);

      if (existingError) {
        return { success: false, error: existingError.message };
      }

      const existingIds = new Set((existing || []).map((row) => row.user_id));
      const nextIds = new Set(uniqueIds);
      const toRemove = [...existingIds].filter((id) => !nextIds.has(id));
      const toAdd = uniqueIds.filter((id) => !existingIds.has(id));

      if (toRemove.length > 0) {
        const { error: deleteError } = await supabase
          .from('bulletin_channel_managers')
          .delete()
          .eq('channel_id', channelId)
          .in('user_id', toRemove);
        if (deleteError) {
          return { success: false, error: deleteError.message };
        }
      }

      if (toAdd.length > 0) {
        const { error: insertError } = await supabase.from('bulletin_channel_managers').insert(
          toAdd.map((userId) => ({
            channel_id: channelId,
            user_id: userId,
            assigned_by: assignedBy,
          }))
        );
        if (insertError) {
          return { success: false, error: insertError.message };
        }
      }

      // Managers should see the channel feed
      for (const userId of uniqueIds) {
        await this.subscribe(channelId, userId);
      }

      return { success: true };
    } catch (error) {
      console.error('Error setting channel managers:', error);
      return { success: false, error: 'Failed to update channel managers' };
    }
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
          is_chant: false,
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

  /** Opt-in Chant channel — created per parish, never auto-subscribed. */
  static async ensureChantChannel(
    parishId: string,
    createdBy?: string
  ): Promise<{ success: boolean; channel?: BulletinChannel; error?: string }> {
    try {
      const { data: existing } = await supabase
        .from('bulletin_channels')
        .select('*')
        .eq('parish_id', parishId)
        .eq('is_chant', true)
        .eq('is_archived', false)
        .maybeSingle();

      if (existing) {
        return { success: true, channel: existing as BulletinChannel };
      }

      const { data, error } = await supabase
        .from('bulletin_channels')
        .insert({
          parish_id: parishId,
          name: 'Chant',
          description: 'Opt-in channel for service chanting',
          is_default: false,
          is_chant: true,
          created_by: createdBy || null,
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, channel: data as BulletinChannel };
    } catch (error) {
      console.error('Error ensuring Chant channel:', error);
      return { success: false, error: 'Failed to create Chant channel' };
    }
  }

  static async isUserSubscribedToChant(
    userId: string,
    parishId: string
  ): Promise<boolean> {
    try {
      const { data: chant } = await supabase
        .from('bulletin_channels')
        .select('id')
        .eq('parish_id', parishId)
        .eq('is_chant', true)
        .eq('is_archived', false)
        .maybeSingle();

      if (!chant?.id) return false;

      const { data: sub } = await supabase
        .from('bulletin_channel_subscriptions')
        .select('id')
        .eq('channel_id', chant.id)
        .eq('user_id', userId)
        .maybeSingle();

      return !!sub?.id;
    } catch (error) {
      console.error('Error checking Chant subscription:', error);
      return false;
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
        .select('id, is_default, is_chant')
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
          is_chant: false,
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
        .select('id, is_default, is_chant')
        .eq('id', channelId)
        .single();

      if (channelError || !channel) {
        return { success: false, error: channelError?.message || 'Channel not found' };
      }
      if (channel.is_default) {
        return { success: false, error: 'The General channel cannot be renamed' };
      }
      if (channel.is_chant) {
        return { success: false, error: 'The Chant channel cannot be renamed' };
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
        .select('id, is_default, is_chant')
        .eq('id', channelId)
        .single();

      if (channelError || !channel) {
        return { success: false, error: channelError?.message || 'Channel not found' };
      }
      if (channel.is_default) {
        return { success: false, error: 'The General channel cannot be archived' };
      }
      if (channel.is_chant) {
        return { success: false, error: 'The Chant channel cannot be archived' };
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
