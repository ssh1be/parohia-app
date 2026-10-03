import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';
import { BulletinChannel, ChannelService } from '../services/channelService';
import { palette } from '../constants/theme';
import { Button } from './ui/Button';
import { Field } from './ui/Field';
import { PressableScale } from './ui/PressableScale';
import { Sheet } from './ui/Sheet';
import { Skeleton } from './ui/Skeleton';
import { useThemeColors } from './ui/useThemeColors';

interface ChannelsSheetProps {
  visible: boolean;
  onClose: () => void;
  parishId: string;
  userId: string;
  isParishAdmin: boolean;
  onChanged: () => void;
}

export function ChannelsSheet({
  visible,
  onClose,
  parishId,
  userId,
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

  useEffect(() => {
    if (visible && parishId) {
      load();
      setShowCreate(false);
      setEditingChannel(null);
      setName('');
      setDescription('');
    }
  }, [visible, parishId, userId, isParishAdmin]);

  const resetForm = () => {
    setShowCreate(false);
    setEditingChannel(null);
    setName('');
    setDescription('');
  };

  const handleJoinLeave = async (channel: BulletinChannel) => {
    if (channel.is_default) return;
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
    if (!name.trim()) return;
    try {
      setSaving(true);
      if (editingChannel) {
        const result = await ChannelService.renameChannel(
          editingChannel.id,
          name,
          description
        );
        if (!result.success) {
          Alert.alert('Error', result.error || 'Failed to update channel');
          return;
        }
      } else {
        const result = await ChannelService.createChannel(
          parishId,
          userId,
          name,
          description
        );
        if (!result.success) {
          Alert.alert('Error', result.error || 'Failed to create channel');
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
    if (channel.is_default) return;
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
            ? 'Create channels and organize posts for your parish.'
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
              disabled={!name.trim() || saving}
              onPress={handleSaveChannel}
              style={{ flex: 1 }}
            />
          </View>
        ) : isParishAdmin ? (
          <Button
            label="New channel"
            icon="add"
            onPress={() => {
              setEditingChannel(null);
              setName('');
              setDescription('');
              setShowCreate(true);
            }}
            fullWidth
          />
        ) : undefined
      }
    >
      {formOpen ? (
        <View>
          <Field
            label="Name"
            required
            value={name}
            onChangeText={setName}
            placeholder="e.g. Choir, Youth, Outreach"
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
          {editingChannel && !editingChannel.is_default && (
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
          return (
            <View
              key={channel.id}
              className="rounded-2xl p-4 mb-3 bg-gray-50 dark:bg-white/[0.04] border border-gray-100 dark:border-white/[0.06]"
            >
              <View className="flex-row items-start">
                <View className="h-10 w-10 rounded-xl bg-red-600/10 items-center justify-center mr-3">
                  <Ionicons
                    name={channel.is_default ? 'home' : 'radio-outline'}
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
                  </View>
                  {!!channel.description && (
                    <Text className="font-sans text-[13px] text-gray-500 dark:text-gray-400 mt-1">
                      {channel.description}
                    </Text>
                  )}
                </View>
              </View>

              <View className="flex-row mt-3">
                {isParishAdmin ? (
                  !channel.is_default ? (
                    <Button
                      label="Edit"
                      variant="secondary"
                      icon="pencil"
                      onPress={() => {
                        setShowCreate(false);
                        setEditingChannel(channel);
                        setName(channel.name);
                        setDescription(channel.description || '');
                      }}
                      style={{ flex: 1 }}
                    />
                  ) : (
                    <View className="flex-1 flex-row items-center justify-center py-2.5 rounded-2xl bg-gray-100 dark:bg-white/5">
                      <Ionicons name="lock-closed" size={14} color={colors.textMuted} />
                      <Text className="font-sans-semibold text-[13px] text-gray-500 dark:text-gray-400 ml-1.5">
                        Default channel
                      </Text>
                    </View>
                  )
                ) : channel.is_default ? (
                  <View className="flex-1 flex-row items-center justify-center py-2.5 rounded-2xl bg-gray-100 dark:bg-white/5">
                    <Ionicons name="checkmark-circle" size={16} color={palette.green} />
                    <Text className="font-sans-semibold text-[13px] text-gray-600 dark:text-gray-300 ml-1.5">
                      Joined
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
                        <ActivityIndicator color={colors.textMuted} />
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
                      <ActivityIndicator color="white" />
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
