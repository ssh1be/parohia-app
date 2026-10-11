import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import { palette } from '../constants/theme';
import { BulletinChannel, ChannelService } from '@parohia/shared';
import { getParishMembers, ParishMember } from '@parohia/shared';
import { Button } from './ui/Button';
import { Field } from './ui/Field';
import { PressableScale } from './ui/PressableScale';
import { Sheet } from './ui/Sheet';
import { Skeleton } from './ui/Skeleton';
import { Spinner } from './ui/Spinner';
import { useThemeColors } from './ui/useThemeColors';

interface ChannelsSheetProps {
  visible: boolean;
  onClose: () => void;
  parishId: string;
  userId: string;
  adminUserId: string;
  isParishAdmin: boolean;
  onChanged: () => void;
}

export function ChannelsSheet({
  visible,
  onClose,
  parishId,
  userId,
  adminUserId,
  isParishAdmin,
  onChanged,
}: ChannelsSheetProps) {
  const colors = useThemeColors();
  const [channels, setChannels] = useState<BulletinChannel[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editingChannel, setEditingChannel] = useState<BulletinChannel | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [members, setMembers] = useState<ParishMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [selectedManagerIds, setSelectedManagerIds] = useState<string[]>([]);
  const [managerSearch, setManagerSearch] = useState('');

  const assignableMembers = useMemo(
    () => members.filter((m) => m.role !== 'admin' && m.user_id !== adminUserId),
    [members, adminUserId]
  );

  const filteredAssignable = useMemo(() => {
    const q = managerSearch.trim().toLowerCase();
    if (!q) return assignableMembers;
    return assignableMembers.filter(
      (m) =>
        m.full_name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q)
    );
  }, [assignableMembers, managerSearch]);

  const load = async () => {
    try {
      setLoading(true);
      const list = await ChannelService.listChannels(parishId, { userId });
      setChannels(list);
    } catch (error) {
      console.error('Error loading channels:', error);
      Alert.alert('Error', 'Failed to load channels');
    } finally {
      setLoading(false);
    }
  };

  const loadMembers = async () => {
    if (!isParishAdmin || !parishId || !adminUserId) return;
    try {
      setMembersLoading(true);
      const roster = await getParishMembers(parishId, adminUserId);
      setMembers(roster);
    } catch (error) {
      console.error('Error loading parish members:', error);
    } finally {
      setMembersLoading(false);
    }
  };

  useEffect(() => {
    if (visible && parishId) {
      load();
      loadMembers();
      setShowCreate(false);
      setEditingChannel(null);
      setName('');
      setDescription('');
      setSelectedManagerIds([]);
      setManagerSearch('');
    }
  }, [visible, parishId, userId, isParishAdmin, adminUserId]);

  const resetForm = () => {
    setShowCreate(false);
    setEditingChannel(null);
    setName('');
    setDescription('');
    setSelectedManagerIds([]);
    setManagerSearch('');
  };

  const openCreate = () => {
    setEditingChannel(null);
    setName('');
    setDescription('');
    setSelectedManagerIds([]);
    setManagerSearch('');
    setShowCreate(true);
  };

  const openEdit = async (channel: BulletinChannel) => {
    setShowCreate(false);
    setEditingChannel(channel);
    setName(channel.name);
    setDescription(channel.description || '');
    setManagerSearch('');
    setSelectedManagerIds(channel.manager_ids || []);
    try {
      const ids = await ChannelService.listChannelManagers(channel.id);
      setSelectedManagerIds(ids);
    } catch (error) {
      console.error('Error loading channel managers:', error);
    }
  };

  const toggleManager = (memberId: string) => {
    setSelectedManagerIds((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]
    );
  };

  const handleJoinLeave = async (channel: BulletinChannel) => {
    if (channel.is_default) return;
    if (channel.is_subscribed && channel.manager_ids?.includes(userId)) {
      Alert.alert(
        'Still managing this channel',
        'Ask a parish admin to remove you as a manager before leaving.'
      );
      return;
    }
    try {
      setBusyId(channel.id);
      const result = channel.is_subscribed
        ? await ChannelService.unsubscribe(channel.id, userId)
        : await ChannelService.subscribe(channel.id, userId);
      if (!result.success) {
        Alert.alert('Error', result.error || 'Something went wrong');
        return;
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      await load();
      onChanged();
    } finally {
      setBusyId(null);
    }
  };

  const handleSaveChannel = async () => {
    if (!editingChannel?.is_default && !editingChannel?.is_chant && !name.trim()) return;
    try {
      setSaving(true);
      let channelId = editingChannel?.id;

      if (editingChannel) {
        if (!editingChannel.is_default && !editingChannel.is_chant) {
          const result = await ChannelService.renameChannel(
            editingChannel.id,
            name,
            description
          );
          if (!result.success) {
            Alert.alert('Error', result.error || 'Failed to update channel');
            return;
          }
        }
      } else {
        const result = await ChannelService.createChannel(
          parishId,
          userId,
          name,
          description
        );
        if (!result.success || !result.channel) {
          Alert.alert('Error', result.error || 'Failed to create channel');
          return;
        }
        channelId = result.channel.id;
      }

      if (channelId) {
        const managersResult = await ChannelService.setChannelManagers(
          channelId,
          selectedManagerIds,
          userId
        );
        if (!managersResult.success) {
          Alert.alert('Error', managersResult.error || 'Failed to update managers');
          return;
        }
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      resetForm();
      await load();
      onChanged();
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = (channel: BulletinChannel) => {
    if (channel.is_default || channel.is_chant) return;
    Alert.alert(
      'Archive channel',
      `Archive “${channel.name}”? It will be hidden from parishioners. Existing posts stay in the archive.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Archive',
          style: 'destructive',
          onPress: async () => {
            const result = await ChannelService.archiveChannel(channel.id);
            if (!result.success) {
              Alert.alert('Error', result.error || 'Failed to archive channel');
              return;
            }
            resetForm();
            await load();
            onChanged();
          },
        },
      ]
    );
  };

  const formOpen = showCreate || !!editingChannel;
  const editingLocked = !!(editingChannel?.is_default || editingChannel?.is_chant);

  return (
    <Sheet
      visible={visible}
      onClose={() => {
        resetForm();
        onClose();
      }}
      eyebrow="Channels"
      title={formOpen ? (editingChannel ? 'Edit channel' : 'New channel') : 'Parish channels'}
      subtitle={
        formOpen
          ? undefined
          : isParishAdmin
            ? 'Create channels and assign managers for your parish.'
            : 'Join channels to add their posts to your bulletin.'
      }
      footer={
        formOpen ? (
          <View className="flex-row">
            <Button
              label="Cancel"
              variant="secondary"
              onPress={resetForm}
              disabled={saving}
              style={{ flex: 1, marginRight: 8 }}
            />
            <Button
              label={saving ? 'Saving…' : editingChannel ? 'Save' : 'Create'}
              icon="checkmark"
              loading={saving}
              disabled={(!editingLocked && !name.trim()) || saving}
              onPress={handleSaveChannel}
              style={{ flex: 1 }}
            />
          </View>
        ) : isParishAdmin ? (
          <Button
            label="New channel"
            icon="add"
            onPress={openCreate}
            fullWidth
          />
        ) : undefined
      }
    >
      {formOpen ? (
        <View>
          {!editingLocked && (
            <>
              <Field
                label="Name"
                required
                value={name}
                onChangeText={setName}
                placeholder="e.g. Youth, Fellowship, Outreach"
                autoFocus
              />
              <Field
                label="Description"
                value={description}
                onChangeText={setDescription}
                placeholder="What is this channel for?"
                multiline
                numberOfLines={3}
              />
            </>
          )}

          {isParishAdmin && (
            <View className="mt-2 mb-4">
              <Text className="font-sans-semibold text-[13px] text-gray-700 dark:text-gray-300 mb-1">
                Managers
              </Text>
              <Text className="font-sans text-xs text-gray-500 dark:text-gray-400 mb-3">
                Managers can create and manage posts in this channel.
              </Text>

              <View className="flex-row items-center h-11 rounded-2xl px-3.5 mb-3 bg-gray-100 dark:bg-white/5">
                <Ionicons name="search" size={16} color={palette.gray400} />
                <TextInput
                  className="flex-1 font-sans text-[14px] text-gray-900 dark:text-white ml-2"
                  placeholder="Search members"
                  placeholderTextColor={palette.gray400}
                  value={managerSearch}
                  onChangeText={setManagerSearch}
                  autoCorrect={false}
                />
                {!!managerSearch && (
                  <Pressable onPress={() => setManagerSearch('')} hitSlop={8}>
                    <Ionicons name="close-circle" size={16} color={palette.gray400} />
                  </Pressable>
                )}
              </View>

              {membersLoading ? (
                [0, 1, 2].map((i) => (
                  <View key={i} className="mb-2">
                    <Skeleton height={52} radius={14} />
                  </View>
                ))
              ) : filteredAssignable.length === 0 ? (
                <Text className="font-sans text-sm text-gray-500 dark:text-gray-400">
                  {assignableMembers.length === 0
                    ? 'No parish members to assign yet.'
                    : 'No members match your search.'}
                </Text>
              ) : (
                filteredAssignable.map((member) => {
                  const active = selectedManagerIds.includes(member.user_id);
                  return (
                    <Pressable
                      key={member.user_id}
                      onPress={() => toggleManager(member.user_id)}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: active }}
                      className={`flex-row items-center rounded-2xl p-3.5 mb-2 border ${
                        active
                          ? 'bg-red-600/[0.06] border-red-500/40'
                          : 'bg-gray-50 dark:bg-white/[0.04] border-transparent'
                      }`}
                    >
                      <View
                        className={`h-5 w-5 rounded-md border-2 mr-3 items-center justify-center ${
                          active ? 'border-red-500 bg-red-500' : 'border-gray-300 dark:border-gray-600'
                        }`}
                      >
                        {active && <Ionicons name="checkmark" size={12} color="white" />}
                      </View>
                      <View className="flex-1">
                        <Text className="font-sans-semibold text-[14px] text-gray-900 dark:text-white">
                          {member.full_name}
                        </Text>
                        <Text className="font-sans text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                          {member.email}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })
              )}
            </View>
          )}

          {editingChannel && !editingChannel.is_default && !editingChannel.is_chant && (
            <Pressable
              onPress={() => handleArchive(editingChannel)}
              className="mt-2 py-3 items-center"
            >
              <Text className="font-sans-semibold text-sm text-red-600">Archive channel</Text>
            </Pressable>
          )}
        </View>
      ) : loading ? (
        <View>
          {[0, 1, 2].map((i) => (
            <View key={i} className="rounded-2xl p-4 mb-3 bg-gray-50 dark:bg-white/[0.04]">
              <Skeleton width="40%" height={16} />
              <Skeleton width="70%" height={12} className="mt-2" />
            </View>
          ))}
        </View>
      ) : channels.length === 0 ? (
        <Text className="font-sans text-sm text-gray-500 dark:text-gray-400">
          No channels yet.
        </Text>
      ) : (
        channels.map((channel) => {
          const busy = busyId === channel.id;
          const managerCount = channel.manager_count ?? 0;
          const isManaging = channel.manager_ids?.includes(userId) ?? false;
          return (
            <View
              key={channel.id}
              className="rounded-2xl p-4 mb-3 bg-gray-50 dark:bg-white/[0.04] border border-gray-100 dark:border-white/[0.06]"
            >
              <View className="flex-row items-start">
                <View className="h-10 w-10 rounded-xl bg-red-600/10 items-center justify-center mr-3">
                  <Ionicons
                    name={channel.is_default ? 'home' : channel.is_chant ? 'musical-notes' : 'radio-outline'}
                    size={18}
                    color={palette.accent}
                  />
                </View>
                <View className="flex-1 pr-2">
                  <View className="flex-row items-center flex-wrap">
                    <Text className="font-sans-bold text-[16px] text-gray-900 dark:text-white">
                      {channel.name}
                    </Text>
                    {channel.is_default && (
                      <View className="ml-2 rounded-full pl-1.5 pr-2 py-0.5 bg-gray-200/80 dark:bg-white/10 flex-row items-center">
                        <Ionicons name="lock-closed" size={9} color={colors.textMuted} />
                        <Text className="font-sans-semibold text-[10px] text-gray-600 dark:text-gray-300 ml-1">
                          Required
                        </Text>
                      </View>
                    )}
                    {!isParishAdmin && isManaging && (
                      <View
                        className="ml-2 rounded-full pl-1.5 pr-2 py-0.5 flex-row items-center"
                        style={{ backgroundColor: 'rgba(59, 130, 246, 0.14)' }}
                      >
                        <Ionicons name="briefcase" size={9} color={palette.blue} />
                        <Text className="font-sans-semibold text-[10px] ml-1" style={{ color: palette.blue }}>
                          Manager
                        </Text>
                      </View>
                    )}
                  </View>
                  {!!channel.description && (
                    <Text className="font-sans text-[13px] text-gray-500 dark:text-gray-400 mt-1">
                      {channel.description}
                    </Text>
                  )}
                  {isParishAdmin && (
                    <Text className="font-sans-medium text-[11px] text-gray-400 dark:text-gray-500 mt-1.5">
                      {managerCount === 0
                        ? 'No managers'
                        : `${managerCount} ${managerCount === 1 ? 'manager' : 'managers'}`}
                    </Text>
                  )}
                </View>
              </View>

              <View className="flex-row mt-3">
                {isParishAdmin ? (
                  <Button
                    label="Edit"
                    variant="secondary"
                    icon="pencil"
                    onPress={() => openEdit(channel)}
                    style={{ flex: 1 }}
                  />
                ) : channel.is_default ? (
                  <View className="flex-1 flex-row items-center justify-center py-2.5 rounded-2xl bg-gray-100 dark:bg-white/5">
                    <Ionicons name="checkmark-circle" size={16} color={palette.green} />
                    <Text className="font-sans-semibold text-[13px] text-gray-600 dark:text-gray-300 ml-1.5">
                      Joined
                    </Text>
                  </View>
                ) : channel.is_subscribed && isManaging ? (
                  <View className="flex-1 flex-row items-center justify-center py-2.5 rounded-2xl bg-gray-100 dark:bg-white/5">
                    <Ionicons name="lock-closed" size={14} color={colors.textMuted} />
                    <Text className="font-sans-semibold text-[13px] text-gray-500 dark:text-gray-400 ml-1.5">
                      Managing this channel
                    </Text>
                  </View>
                ) : channel.is_subscribed ? (
                  <View className="flex-1 flex-row">
                    <View className="flex-1 flex-row items-center justify-center py-2.5 rounded-2xl bg-gray-100 dark:bg-white/5 mr-2">
                      <Ionicons name="checkmark-circle" size={16} color={palette.green} />
                      <Text className="font-sans-semibold text-[13px] text-gray-600 dark:text-gray-300 ml-1.5">
                        Joined
                      </Text>
                    </View>
                    <PressableScale
                      onPress={() => handleJoinLeave(channel)}
                      disabled={busy}
                      accessibilityRole="button"
                      accessibilityLabel={`Leave ${channel.name}`}
                      style={{ flex: 1 }}
                      className="flex-row items-center justify-center rounded-2xl py-2.5 border border-gray-200 dark:border-white/10"
                    >
                      {busy ? (
                        <Spinner size="sm" />
                      ) : (
                        <>
                          <Ionicons name="exit-outline" size={15} color={colors.textMuted} />
                          <Text className="font-sans-bold text-[13px] text-gray-700 dark:text-gray-200 ml-1.5">
                            Leave
                          </Text>
                        </>
                      )}
                    </PressableScale>
                  </View>
                ) : (
                  <PressableScale
                    onPress={() => handleJoinLeave(channel)}
                    disabled={busy}
                    style={{ flex: 1 }}
                    className="rounded-2xl py-2.5 items-center border border-red-600 bg-red-600"
                  >
                    {busy ? (
                      <Spinner size="sm" />
                    ) : (
                      <Text className="font-sans-bold text-[13px] text-white">Join</Text>
                    )}
                  </PressableScale>
                )}
              </View>
            </View>
          );
        })
      )}
    </Sheet>
  );
}
