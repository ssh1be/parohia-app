import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Text, View } from "react-native";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { EventDetailSheet } from "../../components/liturgical/EventDetailSheet";
import { FastingBadge } from "../../components/liturgical/FastingBadge";
import { ReadingsCarousel } from "../../components/liturgical/ReadingsCarousel";
import { ReadingSheet } from "../../components/liturgical/ReadingSheet";
import { TimelineItem } from "../../components/liturgical/TimelineItem";
import ParishCalendarSetup, { CalendarSetupCallout } from '../../components/ParishCalendarSetup';
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { PressableScale } from "../../components/ui/PressableScale";
import { Reveal } from "../../components/ui/Reveal";
import { AppRefreshControl, RefreshSpinnerOverlay } from "../../components/ui/AppRefreshControl";
import { CompactHeader, LargeHeader, useScrollHeader } from "../../components/ui/ScreenHeader";
import { SectionHeader } from "../../components/ui/SectionHeader";
import { Skeleton, SkeletonRows } from "../../components/ui/Skeleton";
import { Spinner } from "../../components/ui/Spinner";
import { useThemeColors } from "../../components/ui/useThemeColors";
import { contentBottomPadding, EventKind, eventKindStyle, palette } from "../../constants/theme";
import { useAuth } from "../../contexts/AuthContext";
import { useNotifications } from "../../contexts/NotificationContext";
import { useParishScope } from "../../contexts/ParishScopeContext";
import { useOrthodoxCalendar } from "../../hooks/useOrthodoxCalendar";
import { useTabScrollToTop } from "../../hooks/useTabScrollToTop";
import { BulletinEvent, BulletinService } from '../../services/bulletinService';
import { ChannelService } from '../../services/channelService';
import { ChantService, ChantSignup, isChantServiceEvent } from '../../services/chantService';
import { ConfessionReservationWithSchedule, ConfessionService } from '../../services/confessionService';
import { getUserProfile } from '../../services/onboardingService';
import { getParishByAdminId, getParishByUserId } from '../../services/parishService';

type ScheduleItem = {
  id: string;
  title: string;
  timeRange: string;
  description?: string;
  type: 'confession' | 'parish' | 'personal';
  notes?: string;
  isAllDay: boolean;
  eventType?: 'event' | 'volunteer' | 'announcement';
  location?: string;
  startTime?: string;
  endTime?: string;
};

export default function Index() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const { scrollY, onScroll } = useScrollHeader();
  const scrollRef = useRef<Animated.ScrollView>(null);
  useTabScrollToTop(scrollRef);
  const { user, loading: authLoading } = useAuth();
  const { parishEpoch } = useParishScope();
  const { 
    calendarData, 
    greeting, 
    loading, 
    error,
    parishEvents,
    refreshData
  } = useOrthodoxCalendar(user?.id);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedReading, setSelectedReading] = useState<{ display: string; passage: string } | null>(null);
  const [profileName, setProfileName] = useState<string | null>(null);
  const [showCalendarSetup, setShowCalendarSetup] = useState(false);
  const [isParishAdmin, setIsParishAdmin] = useState(false);
  const [parishHasCalendar, setParishHasCalendar] = useState(true);
  const [parishName, setParishName] = useState<string>('');
  const [parishId, setParishId] = useState<string | null>(null);
  const [personalConfessions, setPersonalConfessions] = useState<ConfessionReservationWithSchedule[]>([]);
  const [confessionDetails, setConfessionDetails] = useState<Record<string, any>>({});
  const [parishDetails, setParishDetails] = useState<any>(null);
  const [personalEvents, setPersonalEvents] = useState<BulletinEvent[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [activeItem, setActiveItem] = useState<ScheduleItem | null>(null);
  const [itemSheetVisible, setItemSheetVisible] = useState(false);
  const [reminderStates, setReminderStates] = useState<Record<string, boolean>>({});
  const [togglingReminder, setTogglingReminder] = useState<string | null>(null);
  const [chantSubscribed, setChantSubscribed] = useState(false);
  const [chantSignups, setChantSignups] = useState<ChantSignup[]>([]);
  const [chantLoading, setChantLoading] = useState(false);
  const [chantToggling, setChantToggling] = useState(false);
  const { isParishEventNotificationEnabled, setParishEventNotificationEnabled } = useNotifications();

  const loadChantSignupsForItem = async (item: ScheduleItem) => {
    if (
      !user ||
      !parishId ||
      (!chantSubscribed && !isParishAdmin) ||
      item.type !== 'parish' ||
      !item.startTime ||
      !isChantServiceEvent(item.title, item.startTime, item.endTime)
    ) {
      setChantSignups([]);
      return;
    }
    try {
      setChantLoading(true);
      const list = await ChantService.listSignups(parishId, item.id);
      setChantSignups(list);
    } catch (error) {
      console.error('Error loading chant signups:', error);
      setChantSignups([]);
    } finally {
      setChantLoading(false);
    }
  };

  const toggleChantSignup = async () => {
    if (!user || !parishId || !activeItem || activeItem.type !== 'parish' || chantToggling) return;
    const signedUp = chantSignups.some((s) => s.userId === user.id);
    const previous = chantSignups;
    // Optimistic update so the nested sheet doesn't flash loading/empty states.
    if (signedUp) {
      setChantSignups((prev) => prev.filter((s) => s.userId !== user.id));
    } else {
      setChantSignups((prev) => [
        ...prev,
        {
          id: `optimistic-${user.id}`,
          userId: user.id,
          name: 'You',
          createdAt: new Date().toISOString(),
        },
      ]);
    }
    try {
      setChantToggling(true);
      const result = signedUp
        ? await ChantService.removeSignup({
            parishId,
            calendarEventId: activeItem.id,
            userId: user.id,
          })
        : await ChantService.signUp({
            parishId,
            calendarEventId: activeItem.id,
            userId: user.id,
            eventTitle: activeItem.title,
            eventStart: activeItem.startTime,
          });
      if (!result.success) {
        console.error('Chant signup failed:', result.error);
        setChantSignups(previous);
        return;
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      const list = await ChantService.listSignups(parishId, activeItem.id);
      setChantSignups(list);
    } catch (error) {
      console.error('Chant signup failed:', error);
      setChantSignups(previous);
    } finally {
      setChantToggling(false);
    }
  };

  const openItem = async (item: ScheduleItem) => {
    Haptics.selectionAsync().catch(() => {});
    setActiveItem(item);
    setItemSheetVisible(true);
    if (item.type === 'parish') {
      const enabled = await isParishEventNotificationEnabled(item.id);
      setReminderStates(prev => ({ ...prev, [item.id]: !!enabled }));
      void loadChantSignupsForItem(item);
    } else {
      setChantSignups([]);
    }
  };

  const toggleReminder = async (eventId: string) => {
    try {
      setTogglingReminder(eventId);
      const next = !reminderStates[eventId];
      await setParishEventNotificationEnabled(eventId, next, parishEvents.find(e => e.id === eventId));
      setReminderStates(prev => ({ ...prev, [eventId]: next }));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch (error) {
      console.error('Error toggling notification for event:', error);
    } finally {
      setTogglingReminder(null);
    }
  };

  const closeItemThen = (navigate: () => void) => {
    setItemSheetVisible(false);
    setTimeout(navigate, 320);
  };

  const fetchProfile = async () => {
    if (user) {
      const profile = await getUserProfile(user.id);
      if (profile && profile.full_name) {
        setProfileName(profile.full_name.split(' ')[0]);
      } else {
        setProfileName(null);
      }

      // Check if user is parish admin and if parish has calendar set up
      let nextParishId: string | null = null;
      if (profile?.user_type === 'parish_admin') {
        setIsParishAdmin(true);
        const parish = await getParishByAdminId(user.id);
        if (parish) {
          setParishHasCalendar(!!parish.parish_calendar_id);
          setParishName(parish.name);
          nextParishId = parish.id;
          await ChannelService.ensureChantChannel(parish.id, user.id);
        }
      } else if (profile?.user_type === 'regular_user') {
        setIsParishAdmin(false);
        const parish = await getParishByUserId(user.id);
        if (parish) {
          setParishHasCalendar(!!parish.parish_calendar_id);
          setParishName(parish.name);
          nextParishId = parish.id;
          await ChannelService.ensureChantChannel(parish.id);
        }
      }
      setParishId(nextParishId);
      if (nextParishId) {
        setChantSubscribed(await ChannelService.isUserSubscribedToChant(user.id, nextParishId));
      } else {
        setChantSubscribed(false);
      }
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      await fetchProfile();
      // Fetch personal confessions after profile is loaded
      await fetchPersonalConfessions();
    };
    initializeData();
  }, [user, parishEpoch]);

  const handleCalendarSetupSuccess = () => {
    setParishHasCalendar(true);
    refreshData();
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchProfile(); // Refresh parish information
      await fetchPersonalConfessions();
      refreshData(); // Refresh Orthodox calendar data too
    } catch (error) {
      if (__DEV__) {
        console.error('Error refreshing data:', error);
      }
    } finally {
      setRefreshing(false);
    }
  };

  const fetchPersonalConfessions = async () => {
    if (!user) return;
    
    try {
      // Get user profile to determine user type
      const profile = await getUserProfile(user.id);
      const isAdmin = profile?.user_type === 'parish_admin';
      
      if (__DEV__) {
        console.log('Fetching confessions for user type:', profile?.user_type);
        console.log('Is parish admin:', isAdmin);
      }
      
      let confessionsForToday: ConfessionReservationWithSchedule[] = [];
      const today = new Date();
      
      if (isAdmin) {
        // For parish admins, get all reservations for their parish today
        const parish = await getParishByAdminId(user.id);
        if (__DEV__) {
          console.log('Parish admin parish:', parish);
        }
        
        if (parish) {
          confessionsForToday = await ConfessionService.getParishReservations(parish.id, today);
          if (__DEV__) {
            console.log('Parish reservations found:', confessionsForToday.length);
          }
        }
      } else {
        // For regular users, get their own reservations
        const userReservations = await ConfessionService.getUserReservations(user.id);
        const todayStr = today.getFullYear() + '-' + 
          String(today.getMonth() + 1).padStart(2, '0') + '-' + 
          String(today.getDate()).padStart(2, '0');
        
        confessionsForToday = userReservations.filter(reservation => {
          const reservationDate = reservation.confession_schedules?.date;
          if (!reservationDate) return false;
          return reservationDate === todayStr;
        });
        if (__DEV__) {
          console.log('User reservations found:', confessionsForToday.length);
        }
      }
      
      setPersonalConfessions(confessionsForToday);
      
      // Fetch additional details for each confession
      const details: Record<string, any> = {};
      for (const confession of confessionsForToday) {
        try {
          const reservationDetails = await ConfessionService.getReservationDetails(confession.schedule_id);
          details[confession.id] = reservationDetails;
        } catch (error) {
          if (__DEV__) {
            console.error('Error fetching confession details:', error);
          }
        }
      }
      setConfessionDetails(details);
      
      // Fetch parish details to get priest name for regular users
      if (user && !isAdmin) {
        try {
          const parish = await getParishByUserId(user.id);
          if (parish) {
            setParishDetails(parish);
          }
        } catch (error) {
          if (__DEV__) {
            console.error('Error fetching parish details:', error);
          }
        }
      }

      // Fetch personal events (events user has responded to)
      if (user) {
        try {
          const userPersonalEvents = await BulletinService.getUserPersonalEvents(user.id, new Date());
          setPersonalEvents(userPersonalEvents);
        } catch (error) {
          if (__DEV__) {
            console.error('Error fetching personal events:', error);
          }
          setPersonalEvents([]);
        }
      }
    } catch (error) {
      if (__DEV__) {
        console.error('Error fetching personal confessions:', error);
      }
      setPersonalConfessions([]);
    }
  };

  const buildSchedule = (): ScheduleItem[] => {
    const allEvents: ScheduleItem[] = [];

    personalConfessions.forEach((confession) => {
      const details = confessionDetails[confession.id];
      const timeRange = formatConfessionTimeRange(confession.confession_schedules?.time_slot);

      // Regular users see "Confession with <priest>", parish admins see "Confession with <parishioner>"
      let title = "Confession";
      if (isParishAdmin && details?.user_profiles?.full_name) {
        title = `Confession with ${details.user_profiles.full_name}`;
      } else if (!isParishAdmin && parishDetails?.priest_name) {
        title = `Confession with ${parishDetails.priest_name}`;
      }

      allEvents.push({
        id: confession.id,
        title,
        timeRange,
        type: 'confession',
        notes: confession.notes || undefined,
        isAllDay: false
      });
    });

    personalEvents.forEach((event) => {
      const timeDisplay = event.event_time ? formatBulletinEventTime(event.event_time) : '';
      const isAllDay = event.event_date && !event.event_time;
      const dateDisplay = event.event_date ? (() => {
        // Parse date as local date to avoid timezone issues
        const [year, month, day] = event.event_date.split('-').map(Number);
        const localDate = new Date(year, month - 1, day);
        return localDate.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });
      })() : '';

      allEvents.push({
        id: event.id,
        title: event.title,
        timeRange: isAllDay ? dateDisplay : `Starts at ${timeDisplay}`,
        type: 'personal',
        notes: event.user_response?.notes || undefined,
        isAllDay: !!isAllDay,
        eventType: event.event_type,
        location: event.location,
      });
    });

    parishEvents.forEach((event) => {
      allEvents.push({
        id: event.id,
        title: event.title,
        timeRange: formatEventTimeRange(event.startTime, event.endTime),
        description: event.description,
        type: 'parish',
        isAllDay: !event.startTime.includes('T'),
        location: event.location,
        startTime: event.startTime,
        endTime: event.endTime,
      });
    });

    // All-day events first, then chronological
    allEvents.sort((a, b) => {
      if (a.isAllDay && !b.isAllDay) return -1;
      if (!a.isAllDay && b.isAllDay) return 1;

      if (a.isAllDay && b.isAllDay) {
        const parseLocalDate = (dateString: string) => {
          const match = dateString.match(/(\w+)\s+(\d+),\s+(\d+)/);
          if (match) {
            const [_, month, day, year] = match;
            const monthIndex = new Date(`${month} 1, 2000`).getMonth();
            return new Date(parseInt(year), monthIndex, parseInt(day));
          }
          return new Date(0);
        };
        return parseLocalDate(a.timeRange).getTime() - parseLocalDate(b.timeRange).getTime();
      }

      const getStartTime = (timeRange: string) => {
        const match = timeRange.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/);
        if (match) {
          let hour = parseInt(match[1]);
          const minute = parseInt(match[2]);
          const ampm = match[3];
          if (ampm === 'PM' && hour !== 12) hour += 12;
          if (ampm === 'AM' && hour === 12) hour = 0;
          return hour * 60 + minute;
        }
        return 0;
      };

      return getStartTime(a.timeRange) - getStartTime(b.timeRange);
    });

    return allEvents;
  };

  const kindFor = (item: ScheduleItem): EventKind => {
    if (item.type === 'confession') return 'confession';
    if (item.type === 'personal') return item.eventType === 'volunteer' ? 'volunteer' : 'event';
    return 'parish';
  };

  if (authLoading) {
    return (
      <View className="flex-1 bg-gray-50 dark:bg-black justify-center items-center">
        <Spinner size="sm" />
        <Text className="font-sans-medium text-gray-500 dark:text-gray-400 mt-3">Signing you in…</Text>
      </View>
    );
  }

  if (__DEV__ && !user) {
    return (
      <View className="flex-1 bg-gray-50 dark:bg-black justify-center items-center p-6">
        <Text className="font-sans-bold text-red-400 text-lg mb-4">DEBUG: No User Found</Text>
        <Text className="font-sans text-gray-900 dark:text-white text-center">
          The user is null, which means authentication failed or user is not logged in.
        </Text>
        <Text className="font-sans text-gray-500 dark:text-gray-400 text-sm text-center mt-4">
          This debug screen only shows in development builds.
        </Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View className="flex-1 bg-gray-50 dark:bg-black justify-center items-center p-6">
        <Text className="font-display text-3xl text-gray-900 dark:text-white mb-2">Please log in</Text>
        <Text className="font-sans text-gray-500 dark:text-gray-400 text-center">
          You need to be logged in to view this content.
        </Text>
      </View>
    );
  }

  const today = new Date();
  const weekdayLine = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const schedule = loading ? [] : buildSchedule();

  return (
    <View className="flex-1 bg-gray-50 dark:bg-black">
      <CompactHeader title="Home" scrollY={scrollY} />
      <RefreshSpinnerOverlay refreshing={refreshing} scrollY={scrollY} top={insets.top} />
      <Animated.ScrollView
        ref={scrollRef}
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top, paddingBottom: contentBottomPadding(insets.bottom) }}
        refreshControl={
          <AppRefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            progressViewOffset={insets.top}
          />
        }
      >
        <LargeHeader
          scrollY={scrollY}
          eyebrow={weekdayLine}
          title={`${greeting}, ${profileName ?? 'friend'}`}
          subtitle={
            parishName ? (
              <View className="flex-row items-center">
                <Ionicons name="location" size={13} color={palette.accentSoft} />
                <Text className="font-sans-medium text-[14px] text-gray-500 dark:text-gray-400 ml-1" numberOfLines={1}>
                  {parishName}
                </Text>
              </View>
            ) : undefined
          }
        />

        {/* Liturgical day */}
        <Reveal index={1} style={{ paddingHorizontal: 20, marginTop: 12 }}>
          <PressableScale
            onPress={() => router.push('/(tabs)/calendar')}
            scaleTo={0.985}
            accessibilityRole="button"
            accessibilityHint="Opens the calendar"
            className="rounded-[28px] overflow-hidden border border-red-100 dark:border-red-500/15"
          >
            <LinearGradient
              colors={colors.isDark ? ['#1C0A0B', '#0A0A0D'] : ['#FFFFFF', '#FEF2F2']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ padding: 22 }}
            >
              <View className="flex-row items-center justify-between">
                <Text className="font-sans-bold text-[11px] tracking-[1.6px] uppercase text-red-600 dark:text-red-400">
                  Today in the Church
                </Text>
                <Ionicons name="arrow-forward" size={16} color={palette.accentSoft} />
              </View>

              {loading ? (
                <View className="mt-4">
                  <Skeleton width="80%" height={26} />
                  <Skeleton width="55%" height={26} className="mt-2" />
                  <Skeleton width="90%" height={13} className="mt-5" />
                  <Skeleton width={150} height={26} radius={13} className="mt-5" />
                </View>
              ) : error ? (
                <View className="mt-4">
                  <Text className="font-display text-[26px] leading-[30px] text-gray-900 dark:text-white">
                    The calendar couldn't load
                  </Text>
                  <Text className="font-sans text-[13px] text-gray-500 dark:text-gray-400 mt-2">{error}</Text>
                  <Button label="Try again" variant="secondary" size="sm" icon="refresh" onPress={refreshData} className="mt-4 self-start" />
                </View>
              ) : (
                <View className="mt-3">
                  {!!calendarData?.title && (
                    <Text className="font-display text-[30px] leading-[34px] text-gray-900 dark:text-white">
                      {calendarData.title}
                    </Text>
                  )}
                  {!!calendarData?.saintsFeasts && (
                    <Text
                      className="font-display-italic text-[18px] leading-[24px] text-gray-600 dark:text-gray-300 mt-3"
                      numberOfLines={4}
                    >
                      {calendarData.saintsFeasts}
                    </Text>
                  )}
                  <FastingBadge fasting={calendarData?.fasting} className="mt-5" />
                </View>
              )}
            </LinearGradient>
          </PressableScale>
        </Reveal>

        {/* Calendar setup prompt for parish admins */}
        {isParishAdmin && !parishHasCalendar && (
          <Reveal index={2} style={{ paddingHorizontal: 20, marginTop: 16 }}>
            <CalendarSetupCallout onPress={() => setShowCalendarSetup(true)} />
          </Reveal>
        )}

        {/* Today's schedule */}
        <Reveal index={3} style={{ paddingHorizontal: 20, marginTop: 32 }}>
          <SectionHeader title="Today's schedule" caption={parishName || undefined} />
          {loading ? (
            <View className="mt-2"><SkeletonRows rows={3} /></View>
          ) : error ? (
            <EmptyState compact icon="cloud-offline-outline" title="Couldn't load events" message={error} />
          ) : schedule.length > 0 ? (
            <View className="mt-1 -ml-1">
              {schedule.map((item, i) => (
                <TimelineItem
                  key={item.id}
                  kind={kindFor(item)}
                  title={item.title}
                  time={item.timeRange}
                  meta={item.location}
                  isLast={i === schedule.length - 1}
                  onPress={() => openItem(item)}
                />
              ))}
            </View>
          ) : (
            <EmptyState
              compact
              icon="sunny-outline"
              title={parishHasCalendar ? 'A quiet day' : 'No parish calendar yet'}
              message={
                !parishHasCalendar
                  ? (isParishAdmin
                      ? "Set up your parish calendar to see events here."
                      : "Your administrator hasn't set up the parish calendar yet.")
                  : "No events scheduled for today."
              }
              action={
                isParishAdmin && !parishHasCalendar ? (
                  <Button label="Set up calendar" icon="link-outline" size="sm" onPress={() => setShowCalendarSetup(true)} />
                ) : undefined
              }
            />
          )}
        </Reveal>

        {/* Daily readings */}
        <Reveal index={4} style={{ marginTop: 32 }}>
          <View className="px-5">
            <SectionHeader title="Daily readings" caption="Tap a passage to read" />
          </View>
          <ReadingsCarousel
            readings={calendarData?.readingsFull}
            readingsLink={calendarData?.readingsLink}
            loading={loading}
            error={error}
            onSelect={(reading) => {
              setSelectedReading(reading);
              setModalVisible(true);
            }}
          />
        </Reveal>
      </Animated.ScrollView>

      <ReadingSheet
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        eyebrow="Scripture"
        title={selectedReading?.display}
        subtitle="King James Version"
        body={selectedReading?.passage}
      />

      <EventDetailSheet
        visible={itemSheetVisible}
        onClose={() => setItemSheetVisible(false)}
        eyebrow={
          activeItem?.type === 'parish'
            ? parishName || 'Parish event'
            : activeItem
              ? eventKindStyle[kindFor(activeItem)].label
              : undefined
        }
        title={activeItem?.title}
        when={activeItem?.timeRange}
        whenDetail={today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        location={activeItem?.location}
        description={activeItem?.description}
        notes={activeItem?.notes}
        reminder={
          activeItem?.type === 'parish' && activeItem.startTime?.includes('T')
            ? {
                isTimed: activeItem.startTime.includes('T'),
                isUpcoming: activeItem.startTime.includes('T') && new Date(activeItem.startTime) > new Date(),
                isOn: !!reminderStates[activeItem.id],
                loading: togglingReminder === activeItem.id,
                onToggle: () => toggleReminder(activeItem.id),
                onOpenSettings: () => closeItemThen(() => router.push('/(tabs)/calendar/notification-settings')),
              }
            : undefined
        }
        chantSignup={
          activeItem?.type === 'parish' &&
          (chantSubscribed || isParishAdmin) &&
          !!activeItem.startTime &&
          isChantServiceEvent(activeItem.title, activeItem.startTime, activeItem.endTime)
            ? {
                loading: chantLoading,
                toggling: chantToggling,
                signedUp: !!user && chantSignups.some((s) => s.userId === user.id),
                currentUserId: user?.id,
                signups: chantSignups.map((s) => ({ userId: s.userId, name: s.name })),
                onToggle: () => void toggleChantSignup(),
              }
            : undefined
        }
        secondaryAction={
          activeItem && activeItem.type !== 'parish'
            ? {
                label: 'Open in Events',
                icon: 'arrow-forward',
                onPress: () => closeItemThen(() => router.push('/(tabs)/events')),
              }
            : undefined
        }
      />

      <ParishCalendarSetup
        visible={showCalendarSetup}
        onClose={() => setShowCalendarSetup(false)}
        onSuccess={handleCalendarSetupSuccess}
      />
    </View>
  );
}

// Helper function for formatting confession time range
function formatConfessionTimeRange(timeSlot: string) {
  if (!timeSlot) return '';
  
  // Parse the time slot (format: "HH:MM:SS")
  const [hours, minutes] = timeSlot.split(':').map(Number);
  
  // Convert to 12-hour format for start time
  const displayHour = hours > 12 ? hours - 12 : hours;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const minuteStr = minutes === 0 ? '00' : minutes.toString();
  const startTime = `${displayHour}:${minuteStr} ${ampm}`;
  
  // Calculate end time (15 minutes later)
  const endMinutes = minutes + 15;
  const endHours = hours + Math.floor(endMinutes / 60);
  const endMinutesRemainder = endMinutes % 60;
  
  const endDisplayHour = endHours > 12 ? endHours - 12 : endHours;
  const endAmpm = endHours >= 12 ? 'PM' : 'AM';
  const endMinuteStr = endMinutesRemainder === 0 ? '00' : endMinutesRemainder.toString();
  const endTime = `${endDisplayHour}:${endMinuteStr} ${endAmpm}`;
  
  return `${startTime} - ${endTime}`;
}

// Helper function for formatting event time range
function formatEventTimeRange(start: string, end: string) {
  if (!start) return '';
  // If start/end are dateTime, show time range
  const isDateTime = start.length > 10 || (end && end.length > 10);
  if (isDateTime) {
    const startDate = new Date(start);
    const endDate = end ? new Date(end) : null;
    const startStr = startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    let endStr = '';
    if (endDate) {
      endStr = endDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    }
    return endStr ? `${startStr} - ${endStr}` : startStr;
  } else {
    // All-day or multi-day event
    const startDate = new Date(start + 'T00:00:00');
    const endDate = end ? new Date(end) : null;
    const startStr = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    if (endDate) {
      // Google Calendar all-day events: end date is exclusive, so subtract one day
      endDate.setDate(endDate.getDate());
      const endStr = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      if (startStr === endStr) return startStr;
      return `${startStr} - ${endStr}`;
    }
    return startStr;
  }
}

// Helper function for formatting bulletin event time
function formatBulletinEventTime(timeString: string): string {
  try {
    // Handle different time formats
    if (timeString.includes(':')) {
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours, 10);
      const minute = parseInt(minutes, 10);
      
      // Convert to 12-hour format
      const period = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      const displayMinute = minute.toString().padStart(2, '0');
      
      return `${displayHour}:${displayMinute} ${period}`;
    }
    
    return timeString; // Return original if can't parse
  } catch (error) {
    console.error('Error formatting time:', error);
    return timeString; // Return original on error
  }
}
