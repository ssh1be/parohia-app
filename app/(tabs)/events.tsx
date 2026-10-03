import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  Switch,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import ConfettiCannon from "react-native-confetti-cannon";
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  ZoomIn,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  BulletinFeedHeader,
  BulletinTimeFilter,
  isWithinBulletinTimeRange,
} from "../../components/BulletinFeedHeader";
import { ChannelsSheet } from "../../components/ChannelsSheet";
import CustomDateTimePicker from "../../components/DateTimePicker";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { Field } from "../../components/ui/Field";
import { Portal } from "../../components/ui/Portal";
import { PressableScale } from "../../components/ui/PressableScale";
import { CompactHeader, LargeHeader, useScrollHeader } from "../../components/ui/ScreenHeader";
import { SegmentedControl } from "../../components/ui/SegmentedControl";
import { Sheet, SHEET_EXIT_DURATION } from "../../components/ui/Sheet";
import { Skeleton, SkeletonRows } from "../../components/ui/Skeleton";
import { useThemeColors } from "../../components/ui/useThemeColors";
import { contentBottomPadding, entrance, eventKindStyle, palette, TAB_BAR_GAP, TAB_BAR_HEIGHT } from "../../constants/theme";
import { supabase } from "../../config/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { BulletinEvent, BulletinService, CreateEventData, EventResponse } from "../../services/bulletinService";
import { BulletinChannel, ChannelService } from "../../services/channelService";
import { ConfessionService, DaySchedule, TimeSlot } from "../../services/confessionService";
import { notificationService } from "../../services/notificationService";
import { getUserProfile } from "../../services/onboardingService";
import { getParishByAdminId, getParishByUserId } from "../../services/parishService";

type TabType = 'confession' | 'bulletin';
type BulletinFilter = 'all' | 'announcement' | 'event' | 'volunteer';
type ChannelFilter = 'all' | string;

const RESPONSE_LABEL: Record<string, string> = {
  interested: 'Interested',
  unavailable: 'Unavailable',
  attending: 'Attending',
  volunteer: 'Volunteering',
};

/** Duration of the volunteer bar update ease — keep in sync with close stagger on remove. */
const VOLUNTEER_PROGRESS_MS = 320;
const VOLUNTEER_CLOSE_STAGGER_MS = 140;

const CONFETTI_COLORS = [
  palette.accent,
  palette.accentSoft,
  palette.green,
  palette.amber,
  palette.blue,
  '#FFFFFF',
];

/** Animated emerald fill for volunteer signup progress. */
function VolunteerProgressFill({
  ratio,
  height = 8,
  animateFromZero = false,
}: {
  ratio: number;
  height?: number;
  /** When true, starts empty and fills on mount (detail sheet). */
  animateFromZero?: boolean;
}) {
  const clamped = Math.min(1, Math.max(0, ratio));
  const [trackWidth, setTrackWidth] = useState(0);
  const fillWidth = useSharedValue(0);
  const hasMounted = useSharedValue(false);

  useEffect(() => {
    if (trackWidth <= 0) return;
    const target = clamped * trackWidth;
    if (!hasMounted.value) {
      hasMounted.value = true;
      fillWidth.value = animateFromZero
        ? withTiming(target, { duration: 520, easing: Easing.out(Easing.cubic) })
        : target;
      return;
    }
    fillWidth.value = withTiming(target, {
      duration: VOLUNTEER_PROGRESS_MS,
      easing: Easing.out(Easing.cubic),
    });
  }, [clamped, trackWidth, animateFromZero]);

  const fillStyle = useAnimatedStyle(() => ({
    width: fillWidth.value,
  }));

  return (
    <View
      className="rounded-full bg-emerald-500/15 overflow-hidden"
      style={{ height }}
      onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
    >
      <Animated.View className="h-full rounded-full bg-emerald-500" style={fillStyle} />
    </View>
  );
}

const parseLocalDate = (dateString: string) => {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export default function Events() {
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const colors = useThemeColors();
  const { user, session } = useAuth();
  const { scrollY, onScroll } = useScrollHeader();
  const [showVolunteerConfetti, setShowVolunteerConfetti] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('bulletin');
  const [bulletinFilter, setBulletinFilter] = useState<BulletinFilter>('all');
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>('all');
  const [timeFilter, setTimeFilter] = useState<BulletinTimeFilter>('all');
  const [channels, setChannels] = useState<BulletinChannel[]>([]);
  const [subscribedChannels, setSubscribedChannels] = useState<BulletinChannel[]>([]);
  const [showChannelsSheet, setShowChannelsSheet] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());
  const [slotsExpanded, setSlotsExpanded] = useState(false);
  const [weekSchedule, setWeekSchedule] = useState<DaySchedule[]>([]);
  const [parishId, setParishId] = useState<string | null>(null);
  const [parish, setParish] = useState<any>(null);
  const [isParishAdmin, setIsParishAdmin] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);

  // Modal states
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [showReservationDetailsModal, setShowReservationDetailsModal] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  const [reservationNotes, setReservationNotes] = useState('');
  const [reservationLoading, setReservationLoading] = useState(false);
  const [reservationDetails, setReservationDetails] = useState<any>(null);
  const [loadingReservationDetails, setLoadingReservationDetails] = useState(false);
  const [userReservations, setUserReservations] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);

  // Bulletin board states
  const [bulletinEvents, setBulletinEvents] = useState<BulletinEvent[]>([]);
  const [loadingBulletin, setLoadingBulletin] = useState(false);
  const [showCreateEventModal, setShowCreateEventModal] = useState(false);
  const [showEventDetailsModal, setShowEventDetailsModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<BulletinEvent | null>(null);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [createEventData, setCreateEventData] = useState<CreateEventData>({
    title: '',
    description: '',
    event_type: 'announcement',
    channel_id: '',
    event_date: '',
    event_time: '',
    location: '',
    contact_info: '',
    volunteers_needed: undefined
  });
  const [creatingEvent, setCreatingEvent] = useState(false);
  const [responseData, setResponseData] = useState<EventResponse>({
    response_type: 'interested',
    notes: ''
  });
  const [respondingToEvent, setRespondingToEvent] = useState(false);
  const [removingResponse, setRemovingResponse] = useState(false);
  const [eventResponses, setEventResponses] = useState<any[]>([]);
  const [loadingResponses, setLoadingResponses] = useState(false);
  const [notifyParishioners, setNotifyParishioners] = useState(false);

  const initializeData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Get user profile to determine user type
      const profile = await getUserProfile(user.id);
      setUserProfile(profile);
      
      if (profile?.user_type === 'parish_admin') {
        setIsParishAdmin(true);
        const parishData = await getParishByAdminId(user.id);
        setParish(parishData);
        setParishId(parishData?.id || null);
      } else {
        const parishData = await getParishByUserId(user.id);
        setParish(parishData);
        setParishId(parishData?.id || null);
      }
      
      if (parishId) {
        await loadWeekSchedule();
        await loadBulletinEvents();
      }
    } catch (error) {
      console.error('Error initializing data:', error);
      Alert.alert('Error', 'Failed to load parish data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initializeData();
  }, [user, parishId]);

  const loadWeekSchedule = async (showLoading: boolean = true) => {
    if (!parishId) return;
    
    try {
      if (showLoading) {
        setLoading(true);
      }
      
      // Automatically cleanup old data (7 days retention)
      try {
        await ConfessionService.cleanupOldData(7);
      } catch (cleanupError) {
        console.error('Error during automatic cleanup:', cleanupError);
        // Don't show error to user, just log it
      }
      
      const schedule = await ConfessionService.generateWeekSchedule(parishId, new Date());
      setWeekSchedule(schedule);
      
      // Load user's reservations if not parish admin
      if (!isParishAdmin && user) {
        await loadUserReservations();
      }
    } catch (error) {
      console.error('Error loading week schedule:', error);
      if (showLoading) {
        Alert.alert('Error', 'Failed to load confession schedule');
      }
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await initializeData();
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const loadUserReservations = async () => {
    if (!user) return;
    
    try {
      const reservations = await ConfessionService.getUserReservations(user.id);
      const reservationIds = new Set(reservations.map(r => r.id));
      setUserReservations(reservationIds);
    } catch (error) {
      console.error('Error loading user reservations:', error);
    }
  };

  const loadChannels = async () => {
    if (!parishId || !user) return [];
    try {
      if (!isParishAdmin) {
        await ChannelService.ensureGeneralSubscription(user.id, parishId);
      } else {
        await ChannelService.ensureGeneralChannel(parishId, user.id);
      }

      const list = await ChannelService.listChannels(parishId, { userId: user.id });
      setChannels(list);
      const subscribed = isParishAdmin
        ? list
        : list.filter((c) => c.is_subscribed || c.is_default);
      setSubscribedChannels(subscribed);

      // Keep create form defaulted to General
      const general = list.find((c) => c.is_default);
      if (general && !createEventData.channel_id) {
        setCreateEventData((prev) => ({ ...prev, channel_id: general.id }));
      }

      // Reset filter if selected channel disappeared
      if (
        channelFilter !== 'all' &&
        !subscribed.some((c) => c.id === channelFilter) &&
        !(isParishAdmin && list.some((c) => c.id === channelFilter))
      ) {
        setChannelFilter('all');
      }

      return list;
    } catch (error) {
      console.error('Error loading channels:', error);
      return [];
    }
  };

  const loadBulletinEvents = async (): Promise<BulletinEvent[]> => {
    if (!parishId) return [];
    
    try {
      setLoadingBulletin(true);
      await loadChannels();
      const events = await BulletinService.getParishEvents(parishId, user?.id, {
        isParishAdmin,
      });
      setBulletinEvents(events);
      return events;
    } catch (error) {
      console.error('Error loading bulletin events:', error);
      Alert.alert('Error', 'Failed to load bulletin events');
      return [];
    } finally {
      setLoadingBulletin(false);
    }
  };

  const syncSelectedEvent = (events: BulletinEvent[], eventId: string) => {
    const updated = events.find((event) => event.id === eventId);
    if (updated) setSelectedEvent(updated);
  };

  const handleTimeSlotPress = async (daySchedule: DaySchedule, timeSlot: TimeSlot) => {
    // Check if time slot has passed (for non-admin users)
    // Allow interaction if the passed slot is reserved by the current user
    if (!isParishAdmin && isTimeSlotPassed(daySchedule, timeSlot)) {
      const isReservedByCurrentUser = !!timeSlot.reservationId && userReservations.has(timeSlot.reservationId);
      if (!isReservedByCurrentUser) {
        return; // Do nothing for passed time slots unless it's user's own reservation
      }
    }

    if (isParishAdmin) {
      // Parish admin can toggle availability for any slot (except reserved ones)
      if (!!timeSlot.reservedBy) {
        // Show reservation details for reserved slots
        await loadReservationDetails(timeSlot);
        setSelectedTimeSlot(timeSlot);
        setShowReservationDetailsModal(true);
        return;
      }
      await toggleSlotAvailability(daySchedule, timeSlot);
    } else {
      // Regular user can make reservations or cancel their own
      if (!!timeSlot.reservedBy) {
        // Check if this is the user's own reservation
        if (timeSlot.scheduleId) {
          try {
            const reservationDetails = await ConfessionService.getReservationDetails(timeSlot.scheduleId);
            if (reservationDetails.user_id === user?.id) {
              // This is the user's own reservation - show cancel confirmation
              Alert.alert(
                'Cancel Reservation',
                'Are you sure you want to cancel your reservation?',
                [
                  { text: 'No', style: 'cancel' },
                  { 
                    text: 'Yes, Cancel', 
                    style: 'destructive',
                    onPress: () => cancelUserReservation(timeSlot.reservationId!)
                  }
                ]
              );
              return;
            }
          } catch (error) {
            console.error('Error checking reservation ownership:', error);
          }
        }
        // Not user's reservation or error occurred - do nothing
        return;
      }
      
      // Make new reservation for available slots
      if (!timeSlot.available) return;
      setSelectedTimeSlot(timeSlot);
      setShowReservationModal(true);
    }
  };

  const toggleSlotAvailability = async (daySchedule: DaySchedule, timeSlot: TimeSlot) => {
    if (!parishId) return;
    
    try {
      const dateStr = daySchedule.date.toISOString().split('T')[0];
      const [hour, minute] = timeSlot.id.split('-').slice(-2).map(Number);
      const dbTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;
      const newAvailability = !timeSlot.available;
      const result = await ConfessionService.updateScheduleAvailability(
        parishId,
        dateStr,
        dbTime,
        newAvailability
      );
      
      if (result.success) {
        Haptics.selectionAsync().catch(() => {});
        // Update the local state to match the database operation
        setWeekSchedule(prevSchedule => 
          prevSchedule.map(day => {
            if (day.date.toDateString() === daySchedule.date.toDateString()) {
              return {
                ...day,
                timeSlots: day.timeSlots.map(slot => {
                  if (slot.id === timeSlot.id) {
                    return {
                      ...slot,
                      available: newAvailability // Use the value we sent to the database
                    };
                  }
                  return slot;
                })
              };
            }
            return day;
          })
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to update slot availability');
      }
    } catch (error) {
      console.error('Error toggling slot availability:', error);
      Alert.alert('Error', 'Failed to update slot availability');
    }
  };

  const loadReservationDetails = async (timeSlot: TimeSlot) => {
    if (!timeSlot.scheduleId) return;
    
    try {
      setLoadingReservationDetails(true);
      const details = await ConfessionService.getReservationDetails(timeSlot.scheduleId);
      setReservationDetails(details);
    } catch (error) {
      console.error('Error loading reservation details:', error);
      Alert.alert('Error', 'Failed to load reservation details');
    } finally {
      setLoadingReservationDetails(false);
    }
  };

  const cancelUserReservation = async (reservationId: string) => {
    if (!user) return;
    
    try {
      setReservationLoading(true);
      
      const result = await ConfessionService.cancelReservation(reservationId, user.id);
      
      if (result.success) {
        Alert.alert('Success', 'Reservation cancelled successfully!');
        await loadWeekSchedule(); // Reload to show updated status
        // Refresh scheduled notifications after cancel
        try { await notificationService.refreshEventNotifications(user.id); } catch {}
      } else {
        Alert.alert('Error', result.error || 'Failed to cancel reservation');
      }
    } catch (error) {
      console.error('Error cancelling reservation:', error);
      Alert.alert('Error', 'Failed to cancel reservation');
    } finally {
      setReservationLoading(false);
    }
  };

  const handleMakeReservation = async () => {
    if (!selectedTimeSlot || !user || !parishId) return;
    
    try {
      setReservationLoading(true);
      
      const result = await ConfessionService.makeReservation(
        selectedTimeSlot.scheduleId!,
        user.id,
        reservationNotes.trim() || undefined
      );
      
      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        Alert.alert('Success', 'Reservation confirmed!');
        setShowReservationModal(false);
        setReservationNotes('');
        setSelectedTimeSlot(null);
        await loadWeekSchedule(); // Reload to show updated status
        // Refresh scheduled notifications after making reservation
        try { await notificationService.refreshEventNotifications(user.id); } catch {}
      } else {
        Alert.alert('Error', result.error || 'Failed to make reservation');
      }
    } catch (error) {
      console.error('Error making reservation:', error);
      Alert.alert('Error', 'Failed to make reservation');
    } finally {
      setReservationLoading(false);
    }
  };

  const formatPhoneNumber = (phoneNumber: string): string => {
    // Remove all non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // Format based on length
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    } else {
      // Return original if we can't format it
      return phoneNumber;
    }
  };

  const formatEventTime = (timeString: string): string => {
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
  };

  const formatRelativeTime = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInMs = now.getTime() - date.getTime();
      const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
      const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      const diffInWeeks = Math.floor(diffInDays / 7);
      const diffInMonths = Math.floor(diffInDays / 30);

      if (diffInMinutes < 1) {
        return 'just now';
      } else if (diffInMinutes < 60) {
        return `${diffInMinutes}m ago`;
      } else if (diffInHours < 24) {
        return `${diffInHours}h ago`;
      } else if (diffInDays === 1) {
        return 'yesterday';
      } else if (diffInDays < 7) {
        return `${diffInDays}d ago`;
      } else if (diffInWeeks < 4) {
        return `${diffInWeeks}w ago`;
      } else if (diffInMonths < 12) {
        return `${diffInMonths}mo ago`;
      } else {
        const diffInYears = Math.floor(diffInDays / 365);
        return `${diffInYears}y ago`;
      }
    } catch (error) {
      console.error('Error formatting relative time:', error);
      return 'recently'; // Fallback
    }
  };

  const isTimeSlotPassed = (daySchedule: DaySchedule, timeSlot: TimeSlot): boolean => {
    const now = new Date();
    const slotDate = new Date(daySchedule.date);
    
    // If it's not today, it hasn't passed
    if (slotDate.toDateString() !== now.toDateString()) {
      return false;
    }
    
    // Parse the time slot to get hour and minute
    const [hour, minute] = timeSlot.id.split('-').slice(-2).map(Number);
    const slotTime = new Date(now);
    slotTime.setHours(hour, minute, 0, 0);
    
    return now > slotTime;
  };

  const getSlotStatus = (daySchedule: DaySchedule, timeSlot: TimeSlot) => {
    if (timeSlot.reservedBy) {
      // Ownership is checked in handleTimeSlotPress, which needs to fetch reservation details
      return 'reserved';
    }
    
    return timeSlot.available ? 'available' : 'unavailable';
  };

  const resetCreateForm = () => {
    const generalId = channels.find((c) => c.is_default)?.id || '';
    setCreateEventData({
      title: '',
      description: '',
      event_type: 'announcement',
      channel_id: generalId,
      event_date: '',
      event_time: '',
      location: '',
      contact_info: '',
      volunteers_needed: undefined
    });
    setNotifyParishioners(false);
  };

  // Bulletin board functions
  const handleSaveEvent = async () => {
    if (!parishId || !user) return;
    
    if (!createEventData.channel_id) {
      Alert.alert('Error', 'Please choose a channel for this post');
      return;
    }

    try {
      setCreatingEvent(true);

      const eventData: CreateEventData & { notify?: boolean } = {
        title: createEventData.title,
        description: createEventData.description,
        event_type: createEventData.event_type,
        channel_id: createEventData.channel_id,
        contact_info: createEventData.contact_info
      };
      
      // Only add date/time/location for volunteer and event types with valid values
      if (createEventData.event_type === 'volunteer' || createEventData.event_type === 'event') {
        if (createEventData.event_date) {
          eventData.event_date = createEventData.event_date;
        }
        if (createEventData.event_time) {
          eventData.event_time = createEventData.event_time;
        }
        if (createEventData.location) {
          eventData.location = createEventData.location;
        }
        if (createEventData.contact_info) {
          eventData.contact_info = createEventData.contact_info;
        }
      }
      
      // Add volunteers needed for volunteer events
      if (createEventData.event_type === 'volunteer' && createEventData.volunteers_needed) {
        eventData.volunteers_needed = createEventData.volunteers_needed;
      }

      if (editingEventId) {
        // Update existing event
        const updateResult = await BulletinService.updateEvent(editingEventId, eventData);
        if (updateResult.success) {
          Alert.alert('Success', 'Event updated successfully!');
          setShowCreateEventModal(false);
          setEditingEventId(null);
          resetCreateForm();
          await loadBulletinEvents();
        } else {
          Alert.alert('Error', updateResult.error || 'Failed to update event');
        }
      } else {
        // Include notify flag if enabled
        if (notifyParishioners) {
          eventData.notify = true;
        }
        const result = await BulletinService.createEvent(parishId, user.id, eventData);
        
        if (result.success) {
          // If notify was requested, invoke Edge Function to send remote push
          try {
            if (notifyParishioners && result.event?.id) {
              await supabase.functions.invoke('send-bulletin-push', {
                body: {
                  parishId,
                  eventId: result.event.id,
                  channelId: result.event.channel_id || createEventData.channel_id,
                },
                headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined,
              });
            }
          } catch (err) {
            console.error('Error invoking remote push function:', err);
          }
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          Alert.alert('Success', 'Event created successfully!');
          setShowCreateEventModal(false);
          resetCreateForm();
          await loadBulletinEvents();
        } else {
          Alert.alert('Error', result.error || 'Failed to create event');
        }
      }
    } catch (error) {
      console.error('Error creating event:', error);
      Alert.alert('Error', 'Failed to create event');
    } finally {
      setCreatingEvent(false);
    }
  };

  const handleRespondToEvent = async () => {
    if (!selectedEvent || !user) return;
    
    try {
      setRespondingToEvent(true);
      
      const result = await BulletinService.respondToEvent(selectedEvent.id, user.id, responseData);
      
      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        const eventId = selectedEvent.id;
        const isVolunteerPost = selectedEvent.event_type === 'volunteer';
        const justVolunteered =
          isVolunteerPost &&
          responseData.response_type === 'volunteer' &&
          !selectedEvent.user_response;

        // Optimistic update so the sheet flips to the confirmed state immediately.
        setSelectedEvent({
          ...selectedEvent,
          user_response: {
            response_type: responseData.response_type,
            notes: responseData.notes || undefined,
          },
          volunteer_count:
            justVolunteered
              ? (selectedEvent.volunteer_count || 0) + 1
              : selectedEvent.volunteer_count,
        });
        setResponseData({
          response_type: 'attending',
          notes: ''
        });

        if (justVolunteered) {
          setShowVolunteerConfetti(true);
        }

        const events = await loadBulletinEvents();
        syncSelectedEvent(events, eventId);
        try { await notificationService.refreshEventNotifications(user.id); } catch {}
      } else {
        Alert.alert('Error', result.error || 'Failed to submit response');
      }
    } catch (error) {
      console.error('Error responding to event:', error);
      Alert.alert('Error', 'Failed to submit response');
    } finally {
      setRespondingToEvent(false);
    }
  };

  const handleRemoveResponse = async (eventId: string) => {
    if (!user || !selectedEvent || removingResponse) return;
    
    try {
      setRemovingResponse(true);
      const result = await BulletinService.removeResponse(eventId, user.id);
      
      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

        const isVolunteerPost = selectedEvent.event_type === 'volunteer';
        const wasVolunteer = selectedEvent.user_response?.response_type === 'volunteer';

        // Volunteer posts: ease the progress bar down first, then dismiss.
        if (isVolunteerPost && wasVolunteer) {
          setSelectedEvent({
            ...selectedEvent,
            volunteer_count: Math.max(0, (selectedEvent.volunteer_count || 0) - 1),
          });
          await new Promise((resolve) =>
            setTimeout(resolve, VOLUNTEER_PROGRESS_MS + VOLUNTEER_CLOSE_STAGGER_MS),
          );
        }

        setShowEventDetailsModal(false);
        void loadBulletinEvents();
        void notificationService.refreshEventNotifications(user.id).catch(() => {});
        setTimeout(() => {
          setSelectedEvent(null);
          setResponseData({
            response_type: 'attending',
            notes: '',
          });
          setRemovingResponse(false);
        }, SHEET_EXIT_DURATION + 40);
        return;
      } else {
        Alert.alert('Error', result.error || 'Failed to remove response');
      }
    } catch (error) {
      console.error('Error removing response:', error);
      Alert.alert('Error', 'Failed to remove response');
    }
    setRemovingResponse(false);
  };

  const handleDeleteEvent = async (eventId: string) => {
    Alert.alert(
      'Delete Event',
      'Are you sure you want to delete this event?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await BulletinService.deleteEvent(eventId);
              
              if (result.success) {
                setShowEventDetailsModal(false);
                await loadBulletinEvents();
                Alert.alert('Success', 'Event deleted successfully!');
              } else {
                Alert.alert('Error', result.error || 'Failed to delete event');
              }
            } catch (error) {
              console.error('Error deleting event:', error);
              Alert.alert('Error', 'Failed to delete event');
            }
          }
        }
      ]
    );
  };

  const loadEventResponses = async (eventId: string) => {
    try {
      setLoadingResponses(true);
      const result = await BulletinService.getEventResponses(eventId);
      
      if (result.success) {
        setEventResponses(result.responses || []);
      } else {
        console.error('Error loading responses:', result.error);
      }
    } catch (error) {
      console.error('Error loading event responses:', error);
    } finally {
      setLoadingResponses(false);
    }
  };

  const openEventDetails = (event: BulletinEvent) => {
    setSelectedEvent(event);
    setShowEventDetailsModal(true);
    // Load responses if parish admin and event type
    if (isParishAdmin && (event.event_type === 'event' || event.event_type === 'volunteer')) {
      loadEventResponses(event.id);
    }
  };

  const startEditingSelectedEvent = () => {
    if (!selectedEvent) return;
    setCreateEventData({
      title: selectedEvent.title || '',
      description: selectedEvent.description || '',
      event_type: selectedEvent.event_type,
      channel_id: selectedEvent.channel_id || channels.find((c) => c.is_default)?.id || '',
      event_date: selectedEvent.event_type !== 'announcement' ? (selectedEvent.event_date || '') : '',
      event_time: selectedEvent.event_type !== 'announcement' ? (selectedEvent.event_time || '') : '',
      location: selectedEvent.event_type !== 'announcement' ? (selectedEvent.location || '') : '',
      contact_info: selectedEvent.contact_info || '',
      volunteers_needed: selectedEvent.event_type === 'volunteer' ? (selectedEvent.volunteers_needed || undefined) : undefined
    });
    setNotifyParishioners(false);
    setEditingEventId(selectedEvent.id);
    setShowEventDetailsModal(false);
    // iOS can't present a modal while another is still animating out
    setTimeout(() => setShowCreateEventModal(true), 320);
  };

  const canSubmitPost =
    !creatingEvent &&
    !!createEventData.title.trim() &&
    !!createEventData.channel_id &&
    !(createEventData.event_type === 'volunteer' && !createEventData.volunteers_needed);

  const renderVolunteerProgress = (event: BulletinEvent) => {
    const count = event.volunteer_count || 0;
    const needed = event.volunteers_needed || 0;
    const ratio = Math.min(1, count / (needed || 1));
    const reached = !!needed && !!count && count >= needed;
    return (
      <View className="rounded-2xl p-4 mb-4 bg-emerald-500/[0.08] border border-emerald-500/20">
        <View className="flex-row items-end justify-between">
          <View>
            <Text className="font-sans-semibold text-xs text-emerald-700 dark:text-emerald-400">Volunteers</Text>
            <Text className="font-display text-[30px] leading-[34px] text-gray-900 dark:text-white">
              {count}
              <Text className="font-display text-[20px] text-gray-400"> of {needed}</Text>
            </Text>
          </View>
          <Text className="font-sans-bold text-sm text-emerald-700 dark:text-emerald-400">{Math.round(ratio * 100)}%</Text>
        </View>
        <View className="mt-3">
          <VolunteerProgressFill ratio={ratio} height={8} animateFromZero />
        </View>
        <View className="flex-row items-center mt-2.5">
          {reached && <Ionicons name="checkmark-circle" size={14} color={palette.green} style={{ marginRight: 4 }} />}
          <Text className="font-sans text-xs text-gray-600 dark:text-gray-300">
            {reached ? 'Volunteer goal reached' : `${needed - count} more volunteers needed`}
          </Text>
        </View>
      </View>
    );
  };

  const renderDateTile = (dateString: string, inverted = false) => {
    const date = parseLocalDate(dateString);
    return (
      <View
        className={`w-14 min-h-[68px] rounded-2xl items-center justify-center py-2 mr-4 ${
          inverted ? 'bg-white/15' : 'bg-red-600/[0.08] dark:bg-red-500/[0.12]'
        }`}
      >
        <Text className="font-sans-bold text-[10px] tracking-[1.2px] uppercase text-red-600 dark:text-red-400">
          {date.toLocaleDateString('en-US', { month: 'short' })}
        </Text>
        <Text className="font-display text-[26px] leading-[28px] text-gray-900 dark:text-white">{date.getDate()}</Text>
        <Text className="font-sans-medium text-[10px] text-gray-500 dark:text-gray-400">
          {date.toLocaleDateString('en-US', { weekday: 'short' })}
        </Text>
      </View>
    );
  };

  const renderConfessionTab = () => {
    const selectedDaySchedule = weekSchedule.find(day => day.date.toDateString() === selectedDay.toDateString());
    const slots = selectedDaySchedule?.timeSlots ?? [];
    const INITIAL_VISIBLE_SLOTS = 9; // 3x3 grid
    const hasMoreSlots = slots.length > INITIAL_VISIBLE_SLOTS;
    const visibleSlots = slotsExpanded || !hasMoreSlots ? slots : slots.slice(0, INITIAL_VISIBLE_SLOTS);

    return (
      <View>
        <View className="px-5 pt-4">
          <View className="rounded-3xl p-5 bg-white dark:bg-white/[0.04] border border-gray-100 dark:border-white/[0.06] flex-row items-center">
            <View className="h-12 w-12 rounded-2xl bg-red-600/10 items-center justify-center mr-4">
              <Ionicons name="time" size={22} color={palette.accent} />
            </View>
            <View className="flex-1">
              <Text className="font-display text-[24px] leading-[28px] text-gray-900 dark:text-white">
                Confession{parish?.priest_name ? ` with ${parish.priest_name}` : ''}
              </Text>
              <Text className="font-sans text-[13px] text-gray-500 dark:text-gray-400 mt-0.5">
                {isParishAdmin ? 'Tap slots to enable or disable availability' : 'Choose a time to schedule your confession'}
              </Text>
            </View>
          </View>
        </View>

        {/* Week strip */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 20 }}
        >
          {weekSchedule.map((daySchedule, index) => {
            const isSelected = daySchedule.date.toDateString() === selectedDay.toDateString();
            const isToday = daySchedule.date.toDateString() === new Date().toDateString();
            const openCount = daySchedule.timeSlots.filter(s => s.available && !s.reservedBy).length;

            return (
              <PressableScale
                key={index}
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  setSlotsExpanded(false);
                  setSelectedDay(daySchedule.date);
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={`${daySchedule.dayName} ${daySchedule.dateString}, ${openCount} open`}
                scaleTo={0.94}
                style={{ marginRight: 10 }}
                className={`w-[60px] rounded-[22px] items-center py-3 border ${
                  isSelected
                    ? 'bg-red-600 border-red-600'
                    : 'bg-white dark:bg-white/[0.04] border-gray-100 dark:border-white/[0.06]'
                }`}
              >
                <Text className={`font-sans-semibold text-[11px] uppercase tracking-[1px] ${isSelected ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}`}>
                  {daySchedule.dayName}
                </Text>
                <Text className={`font-display text-[26px] leading-[30px] mt-0.5 ${isSelected ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                  {daySchedule.date.getDate()}
                </Text>
                <View className="h-3 mt-0.5 flex-row items-center">
                  {isToday ? (
                    <Text className={`font-sans-bold text-[9px] ${isSelected ? 'text-white' : 'text-red-600 dark:text-red-400'}`}>TODAY</Text>
                  ) : openCount > 0 ? (
                    <View className={`h-1.5 w-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-emerald-500'}`} />
                  ) : null}
                </View>
              </PressableScale>
            );
          })}
        </ScrollView>

        {/* Time slots */}
        <View className="px-5">
          <View className="flex-row items-end justify-between mb-3">
            <View className="flex-1">
              <Text className="font-display text-[24px] leading-[28px] text-gray-900 dark:text-white">
                {selectedDay.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </Text>
              <Text className="font-sans text-[13px] text-gray-500 dark:text-gray-400 mt-0.5">
                {isParishAdmin ? 'Manage times' : 'Available times'}
              </Text>
            </View>
          </View>

          <View className="flex-row mb-4">
            {[
              { label: 'Open', color: palette.green },
              { label: 'Reserved', color: palette.gray400 },
              { label: isParishAdmin ? 'Closed' : 'Unavailable', color: colors.isDark ? '#374151' : '#D1D5DB' },
            ].map((item) => (
              <View key={item.label} className="flex-row items-center mr-4">
                <View className="h-2 w-2 rounded-full mr-1.5" style={{ backgroundColor: item.color }} />
                <Text className="font-sans-medium text-[11px] text-gray-500 dark:text-gray-400">{item.label}</Text>
              </View>
            ))}
          </View>

          {slots.length === 0 ? (
            <EmptyState compact icon="time-outline" title="No times listed" message="There are no confession times for this day." />
          ) : (
            <>
              <Animated.View
                key={selectedDay.toDateString()}
                entering={FadeIn.duration(220)}
                layout={LinearTransition.duration(220)}
                style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}
              >
                {visibleSlots.map((timeSlot) => {
                  const slotStatus = getSlotStatus(selectedDaySchedule!, timeSlot);
                  const isPassed = isTimeSlotPassed(selectedDaySchedule!, timeSlot);
                  const isReservedByCurrentUser = !!timeSlot.reservationId && userReservations.has(timeSlot.reservationId);
                  const showAsPassed = isPassed && !isReservedByCurrentUser;
                  const isDisabled =
                    (!isParishAdmin && slotStatus === 'reserved' && !isReservedByCurrentUser) ||
                    (!isParishAdmin && slotStatus === 'unavailable') ||
                    (!isParishAdmin && isPassed && !isReservedByCurrentUser);

                  let caption = '';
                  let captionClass = 'text-gray-500 dark:text-gray-400';
                  let containerClass = 'bg-white dark:bg-white/[0.04] border-gray-100 dark:border-white/[0.06]';
                  let icon: keyof typeof Ionicons.glyphMap = 'time-outline';
                  let iconColor = palette.gray400;

                  if (isReservedByCurrentUser) {
                    caption = 'Yours';
                    captionClass = 'text-red-600 dark:text-red-400';
                    containerClass = 'bg-red-600/[0.08] border-red-500/30';
                    icon = 'person';
                    iconColor = palette.accentSoft;
                  } else if (showAsPassed) {
                    caption = 'Passed';
                    containerClass = 'bg-transparent border-gray-200 dark:border-white/[0.06] opacity-50';
                    icon = 'remove-circle-outline';
                  } else if (slotStatus === 'reserved') {
                    caption = 'Reserved';
                    containerClass = 'bg-gray-100 dark:bg-white/[0.06] border-transparent';
                    icon = 'person';
                  } else if (slotStatus === 'available') {
                    caption = 'Open';
                    captionClass = 'text-emerald-600 dark:text-emerald-400';
                    containerClass = 'bg-white dark:bg-white/[0.04] border-emerald-500/30';
                    icon = 'checkmark-circle';
                    iconColor = palette.green;
                  } else {
                    caption = isParishAdmin ? 'Tap to open' : 'Closed';
                    containerClass = 'bg-transparent border-dashed border-gray-300 dark:border-white/10';
                    icon = 'close-circle-outline';
                  }

                  return (
                    <PressableScale
                      key={timeSlot.id}
                      onPress={() => handleTimeSlotPress(selectedDaySchedule!, timeSlot)}
                      disabled={isDisabled}
                      scaleTo={0.94}
                      accessibilityRole="button"
                      accessibilityLabel={`${timeSlot.time}, ${caption}`}
                      style={{ width: '31.5%', marginBottom: 10 }}
                      className={`rounded-2xl border py-3.5 items-center ${containerClass}`}
                    >
                      <Ionicons name={icon} size={16} color={iconColor} />
                      <Text className="font-sans-bold text-[15px] text-gray-900 dark:text-white mt-1">{timeSlot.displayTime}</Text>
                      <Text className={`font-sans-medium text-[11px] mt-0.5 ${captionClass}`}>{caption}</Text>
                    </PressableScale>
                  );
                })}
              </Animated.View>

              {hasMoreSlots && (
                <PressableScale
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {});
                    setSlotsExpanded((prev) => !prev);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={slotsExpanded ? 'Show fewer times' : 'Show all times'}
                  scaleTo={0.97}
                  className="mt-1 mb-2 py-3 rounded-2xl border border-gray-100 dark:border-white/[0.06] bg-white dark:bg-white/[0.04] flex-row items-center justify-center"
                >
                  <Text className="font-sans-semibold text-[14px] text-gray-900 dark:text-white mr-1.5">
                    {slotsExpanded ? 'Show fewer' : 'Show all times'}
                  </Text>
                  <Ionicons
                    name={slotsExpanded ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color={colors.icon}
                  />
                </PressableScale>
              )}
            </>
          )}
        </View>
      </View>
    );
  };

  const channelChipSource = isParishAdmin ? channels : subscribedChannels;
  const timeFilteredEvents = bulletinEvents.filter((e) =>
    isWithinBulletinTimeRange(e.created_at, timeFilter)
  );
  const channelScopedEvents =
    channelFilter === 'all'
      ? timeFilteredEvents
      : timeFilteredEvents.filter((e) => e.channel_id === channelFilter);
  const filteredBulletin =
    bulletinFilter === 'all'
      ? channelScopedEvents
      : channelScopedEvents.filter((e) => e.event_type === bulletinFilter);

  const countsByChannel = channelChipSource.reduce<Record<string, number>>((acc, channel) => {
    acc[channel.id] = timeFilteredEvents.filter((e) => e.channel_id === channel.id).length;
    return acc;
  }, {});

  const renderBulletinTab = () => (
    <View>
      <BulletinFeedHeader
        channels={channelChipSource}
        channelFilter={channelFilter}
        onChannelChange={setChannelFilter}
        typeFilter={bulletinFilter}
        onTypeChange={setBulletinFilter}
        timeFilter={timeFilter}
        onTimeChange={setTimeFilter}
        countsByChannel={countsByChannel}
        visibleCount={filteredBulletin.length}
        totalCount={timeFilteredEvents.length}
        isParishAdmin={isParishAdmin}
        onOpenChannels={() => setShowChannelsSheet(true)}
      />

      <View className="px-5 pt-1">
          {loadingBulletin ? (
            [0, 1, 2].map((i) => (
              <View key={i} className="rounded-3xl p-5 mb-3 bg-white dark:bg-white/[0.04]">
                <Skeleton width={90} height={20} radius={10} />
                <Skeleton width="75%" height={20} className="mt-4" />
                <Skeleton width="95%" height={12} className="mt-3" />
                <Skeleton width="60%" height={12} className="mt-2" />
              </View>
            ))
          ) : bulletinEvents.length === 0 ? (
            <EmptyState
              icon="newspaper-outline"
              title="No posts yet"
              message={isParishAdmin ? 'Create the first post to share news with your parish.' : 'Check back later for announcements.'}
            />
          ) : filteredBulletin.length === 0 ? (
            <EmptyState compact icon="filter-outline" title="Nothing here" message="No posts match this filter." />
          ) : (
            filteredBulletin.map((event, index) => {
              const kind = eventKindStyle[event.event_type];
              const isDated = (event.event_type === 'volunteer' || event.event_type === 'event') && !!event.event_date;
              const hasMeta = (event.event_type === 'volunteer' || event.event_type === 'event') && (!!event.event_time || !!event.location);
              const channelName = event.channel?.name;

              return (
                <Animated.View
                  key={event.id}
                  entering={entrance.card(Math.min(index, 6) * 50)}
                  layout={entrance.layout()}
                >
                  <PressableScale
                    onPress={() => openEventDetails(event)}
                    scaleTo={0.985}
                    accessibilityRole="button"
                    accessibilityLabel={`${kind.label}: ${event.title}`}
                    style={{ marginBottom: 12 }}
                    className="rounded-3xl p-5 bg-white dark:bg-white/[0.04] border border-gray-100 dark:border-white/[0.06]"
                  >
                    <View className="flex-row items-start justify-between mb-3">
                      <View
                        className="flex-row items-center flex-wrap"
                        style={{ flex: 1, paddingRight: 8, rowGap: 6, columnGap: 6 }}
                      >
                        <View className="flex-row items-center rounded-full pl-1.5 pr-2.5 py-1" style={{ backgroundColor: kind.tint }}>
                          <Ionicons name={kind.icon as keyof typeof Ionicons.glyphMap} size={11} color={kind.color} />
                          <Text className="font-sans-bold text-[11px] ml-1" style={{ color: kind.color }}>{kind.label}</Text>
                        </View>
                        {!!channelName && (
                          <View className="rounded-full px-2.5 py-1 bg-gray-100 dark:bg-white/10">
                            <Text className="font-sans-semibold text-[11px] text-gray-600 dark:text-gray-300">{channelName}</Text>
                          </View>
                        )}
                        {event.created_by === user?.id && (
                          <View className="rounded-full px-2.5 py-1 bg-gray-100 dark:bg-white/10">
                            <Text className="font-sans-semibold text-[11px] text-gray-600 dark:text-gray-300">Your post</Text>
                          </View>
                        )}
                      </View>
                      <Text className="font-sans text-xs text-gray-400 dark:text-gray-500 mt-0.5">{formatRelativeTime(event.created_at)}</Text>
                    </View>

                    <View className="flex-row">
                      {isDated && renderDateTile(event.event_date!)}
                      <View className="flex-1">
                        <Text className="font-display text-[23px] leading-[27px] text-gray-900 dark:text-white">{event.title}</Text>
                        {!!event.description && (
                          <Text className="font-sans text-[14px] leading-5 text-gray-600 dark:text-gray-300 mt-1.5" numberOfLines={2}>
                            {event.description}
                          </Text>
                        )}
                        {hasMeta && (
                          <View className="flex-row flex-wrap mt-2.5">
                            {!!event.event_time && (
                              <View className="flex-row items-center mr-3 mb-1">
                                <Ionicons name="time-outline" size={13} color={palette.gray400} />
                                <Text className="font-sans-medium text-xs text-gray-500 dark:text-gray-400 ml-1">{formatEventTime(event.event_time)}</Text>
                              </View>
                            )}
                            {!!event.location && (
                              <View className="flex-row items-center mb-1 flex-shrink">
                                <Ionicons name="location-outline" size={13} color={palette.gray400} />
                                <Text className="font-sans-medium text-xs text-gray-500 dark:text-gray-400 ml-1" numberOfLines={1}>{event.location}</Text>
                              </View>
                            )}
                          </View>
                        )}
                      </View>
                    </View>

                    {((event.event_type === 'event' && event.user_response) || (event.event_type === 'volunteer' && !!event.volunteers_needed)) && (
                      <View className="flex-row items-center mt-4 pt-3 border-t border-gray-100 dark:border-white/[0.06]">
                        {event.event_type === 'event' && event.user_response && (
                          <View className="flex-row items-center">
                            <Ionicons name="checkmark-circle" size={15} color={palette.green} />
                            <Text className="font-sans-semibold text-xs text-emerald-600 dark:text-emerald-400 ml-1">
                              {RESPONSE_LABEL[event.user_response.response_type] ?? 'Attending'}
                            </Text>
                          </View>
                        )}
                        {event.event_type === 'volunteer' && !!event.volunteers_needed && (
                          <View className="flex-1 flex-row items-center">
                            <Ionicons name="people" size={14} color={palette.green} />
                            <Text className="font-sans-semibold text-xs text-emerald-600 dark:text-emerald-400 ml-1">
                              {event.volunteer_count || 0}/{event.volunteers_needed} volunteers
                            </Text>
                            <View className="flex-1 ml-3">
                              <VolunteerProgressFill
                                ratio={Math.min(1, (event.volunteer_count || 0) / (event.volunteers_needed || 1))}
                                height={6}
                                animateFromZero
                              />
                            </View>
                          </View>
                        )}
                      </View>
                    )}
                  </PressableScale>
                </Animated.View>
              );
            })
          )}
      </View>
    </View>
  );

  if (loading && weekSchedule.length === 0 && bulletinEvents.length === 0) {
    return (
      <View className="flex-1 bg-gray-50 dark:bg-black">
        <CompactHeader title="Events" scrollY={scrollY} />
        <View style={{ paddingTop: insets.top }}>
          <LargeHeader
            scrollY={scrollY}
            title="Events"
            subtitle="Parish events and announcements"
          />
          <View className="px-5 mt-2">
            <Skeleton height={44} radius={22} />
            <View className="mt-6"><SkeletonRows rows={4} /></View>
          </View>
        </View>
      </View>
    );
  }

  const selectedKind = selectedEvent ? eventKindStyle[selectedEvent.event_type] : null;
  const fabBottom = Math.max(insets.bottom, TAB_BAR_GAP) + TAB_BAR_HEIGHT + 16;

  return (
    <View className="flex-1 bg-gray-50 dark:bg-black">
      <CompactHeader title="Events" scrollY={scrollY} />

      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top,
          paddingBottom: contentBottomPadding(insets.bottom) + (isParishAdmin && activeTab === 'bulletin' ? 56 : 0),
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.textMuted}
            colors={[palette.accent]}
            progressViewOffset={insets.top}
          />
        }
      >
        <LargeHeader
          scrollY={scrollY}
          title="Events"
          subtitle={parish?.name ? `News and confession at ${parish.name}` : 'Parish events and announcements'}
        />

        <View className="px-5 pt-2 pb-1">
          <SegmentedControl
            value={activeTab}
            onChange={setActiveTab}
            segments={[
              { key: 'bulletin', label: 'Bulletin Board', icon: activeTab === 'bulletin' ? 'pin' : 'pin-outline' },
              { key: 'confession', label: 'Confession', icon: activeTab === 'confession' ? 'time' : 'time-outline' },
            ]}
          />
        </View>

        <Animated.View key={activeTab} entering={FadeIn.duration(220)}>
          {activeTab === 'confession' ? renderConfessionTab() : renderBulletinTab()}
        </Animated.View>
      </Animated.ScrollView>

      {isParishAdmin && activeTab === 'bulletin' && (
        <Animated.View
          entering={entrance.pop()}
          style={{ position: 'absolute', right: 20, bottom: fabBottom }}
        >
          <PressableScale
            onPress={() => {
              resetCreateForm();
              setEditingEventId(null);
              setShowCreateEventModal(true);
            }}
            haptic
            accessibilityRole="button"
            accessibilityLabel="Create a new post"
            className="h-14 pl-5 pr-6 rounded-full bg-red-600 flex-row items-center"
            style={{ shadowColor: palette.accent, shadowOpacity: 0.35, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 8, borderRadius: 999 }}
          >
            <Ionicons name="add" size={22} color="white" />
            <Text className="font-sans-bold text-[15px] text-white ml-1.5">New post</Text>
          </PressableScale>
        </Animated.View>
      )}

      {/* Reservation sheet */}
      <Sheet
        visible={showReservationModal}
        onClose={() => setShowReservationModal(false)}
        eyebrow="Confession"
        title={selectedTimeSlot?.time}
        subtitle={selectedDay.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        footer={
          <View className="flex-row">
            <Button label="Cancel" variant="secondary" onPress={() => setShowReservationModal(false)} disabled={reservationLoading} style={{ flex: 1, marginRight: 8 }} />
            <Button label={reservationLoading ? 'Confirming…' : 'Confirm'} icon="checkmark" loading={reservationLoading} onPress={handleMakeReservation} style={{ flex: 1 }} />
          </View>
        }
      >
        {parish?.priest_name && (
          <View className="flex-row items-center rounded-2xl p-4 mb-5 bg-gray-50 dark:bg-white/[0.04]">
            <Ionicons name="person-circle-outline" size={22} color={colors.textMuted} />
            <Text className="font-sans-medium text-sm text-gray-700 dark:text-gray-300 ml-2">With {parish.priest_name}</Text>
          </View>
        )}
        <Field
          label="Notes (optional)"
          value={reservationNotes}
          onChangeText={setReservationNotes}
          placeholder="Any special requests or notes..."
          multiline
          numberOfLines={3}
        />
      </Sheet>

      {/* Reservation details sheet (admin) */}
      <Sheet
        visible={showReservationDetailsModal}
        onClose={() => setShowReservationDetailsModal(false)}
        eyebrow="Reservation"
        title={selectedTimeSlot?.time}
        subtitle={selectedDay.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        footer={<Button label="Close" variant="secondary" onPress={() => setShowReservationDetailsModal(false)} fullWidth />}
      >
        {loadingReservationDetails ? (
          <View className="py-6"><SkeletonRows rows={2} /></View>
        ) : reservationDetails ? (
          <View>
            <View className="rounded-2xl p-4 mb-3 bg-gray-50 dark:bg-white/[0.04]">
              <Text className="font-sans-semibold text-xs text-gray-500 dark:text-gray-400 mb-1">Reserved by</Text>
              <Text className="font-sans-bold text-base text-gray-900 dark:text-white">
                {reservationDetails.user_profiles?.full_name || 'Unknown User'}
              </Text>
              <Text className="font-sans text-sm text-gray-600 dark:text-gray-300 mt-1">
                {reservationDetails.user_profiles?.email || 'No email provided'}
              </Text>
              {reservationDetails.user_profiles?.phone_number && (
                <Text className="font-sans text-sm text-gray-600 dark:text-gray-300 mt-0.5">
                  {formatPhoneNumber(reservationDetails.user_profiles.phone_number)}
                </Text>
              )}
            </View>

            {reservationDetails.notes && (
              <View className="rounded-2xl p-4 mb-3 bg-gray-50 dark:bg-white/[0.04]">
                <Text className="font-sans-semibold text-xs text-gray-500 dark:text-gray-400 mb-1">Notes</Text>
                <Text className="font-sans text-[15px] text-gray-900 dark:text-white">{reservationDetails.notes}</Text>
              </View>
            )}

            <View className="rounded-2xl p-4 bg-gray-50 dark:bg-white/[0.04]">
              <Text className="font-sans-semibold text-xs text-gray-500 dark:text-gray-400 mb-1">Booked on</Text>
              <Text className="font-sans text-[15px] text-gray-900 dark:text-white">
                {new Date(reservationDetails.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Text>
            </View>
          </View>
        ) : (
          <EmptyState compact icon="alert-circle-outline" title="Failed to load reservation details" />
        )}
      </Sheet>

      {/* Create / edit post sheet */}
      <Sheet
        visible={showCreateEventModal}
        onClose={() => { setShowCreateEventModal(false); setEditingEventId(null); }}
        eyebrow={editingEventId ? 'Edit post' : 'New post'}
        title={editingEventId ? 'Update your post' : 'Share with your parish'}
        footer={
          <View className="flex-row">
            <Button
              label="Cancel"
              variant="secondary"
              onPress={() => { setShowCreateEventModal(false); setEditingEventId(null); }}
              disabled={creatingEvent}
              style={{ flex: 1, marginRight: 8 }}
            />
            <Button
              label={creatingEvent ? (editingEventId ? 'Saving…' : 'Creating…') : (editingEventId ? 'Save changes' : 'Publish')}
              icon="checkmark"
              loading={creatingEvent}
              disabled={!canSubmitPost}
              onPress={handleSaveEvent}
              style={{ flex: 1 }}
            />
          </View>
        }
      >
        {!editingEventId && (
          <View className="mb-5">
            <Text className="font-sans-semibold text-[13px] text-gray-700 dark:text-gray-300 mb-2">Type</Text>
            <View className="flex-row">
              {(['announcement', 'event', 'volunteer'] as const).map((type, i) => {
                const style = eventKindStyle[type];
                const active = createEventData.event_type === type;
                return (
                  <PressableScale
                    key={type}
                    onPress={() => {
                      Haptics.selectionAsync().catch(() => {});
                      setCreateEventData(
                        type === 'announcement'
                          ? { ...createEventData, event_type: 'announcement', event_date: '', event_time: '', location: '' }
                          : { ...createEventData, event_type: type }
                      );
                    }}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: active }}
                    style={{ flex: 1, marginRight: i < 2 ? 8 : 0 }}
                  >
                    <View
                      className={`rounded-2xl py-3.5 items-center border-2 ${active ? '' : 'border-transparent bg-gray-100 dark:bg-white/5'}`}
                      style={active ? { backgroundColor: style.tint, borderColor: style.color } : undefined}
                    >
                      <Ionicons name={style.icon as keyof typeof Ionicons.glyphMap} size={18} color={active ? style.color : palette.gray400} />
                      <Text className={`font-sans-semibold text-xs mt-1.5 ${active ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                        {type === 'announcement' ? 'Announcement' : type === 'event' ? 'Event' : 'Volunteer'}
                      </Text>
                    </View>
                  </PressableScale>
                );
              })}
            </View>
          </View>
        )}

        <View className="mb-5">
          <Text className="font-sans-semibold text-[13px] text-gray-700 dark:text-gray-300 mb-2">Channel</Text>
          {channels.length === 0 ? (
            <Text className="font-sans text-sm text-gray-500 dark:text-gray-400">
              No channels available. Run the channels migration or create one first.
            </Text>
          ) : (
            <View className="flex-row flex-wrap" style={{ marginHorizontal: -4 }}>
              {channels.map((channel) => {
                const active = createEventData.channel_id === channel.id;
                return (
                  <Pressable
                    key={channel.id}
                    onPress={() => {
                      Haptics.selectionAsync().catch(() => {});
                      setCreateEventData({ ...createEventData, channel_id: channel.id });
                    }}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: active }}
                    className={`h-9 px-3.5 m-1 rounded-full flex-row items-center border ${
                      active
                        ? 'bg-red-600 border-red-600'
                        : 'bg-gray-100 dark:bg-white/5 border-transparent'
                    }`}
                  >
                    {channel.is_default && (
                      <Ionicons
                        name="home"
                        size={12}
                        color={active ? 'white' : palette.gray400}
                        style={{ marginRight: 5 }}
                      />
                    )}
                    <Text className={`font-sans-semibold text-[13px] ${active ? 'text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                      {channel.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        <Field
          label="Title"
          required
          value={createEventData.title}
          onChangeText={(text) => setCreateEventData({...createEventData, title: text})}
          placeholder={createEventData.event_type === 'announcement' ? 'Announcement title...' : 'Event title...'}
        />

        <Field
          label="Description"
          value={createEventData.description}
          onChangeText={(text) => setCreateEventData({...createEventData, description: text})}
          placeholder={createEventData.event_type === 'announcement' ? 'Announcement description...' : 'Event description...'}
          multiline
          numberOfLines={3}
        />

        {createEventData.event_type === 'volunteer' && (
          <Animated.View entering={FadeInDown.duration(220)}>
            <Field
              label="Volunteers needed"
              required
              value={createEventData.volunteers_needed?.toString() || ''}
              onChangeText={(text) => {
                const num = parseInt(text) || undefined;
                setCreateEventData({...createEventData, volunteers_needed: num});
              }}
              placeholder="Number of volunteers needed..."
              keyboardType="numeric"
            />
          </Animated.View>
        )}

        {(createEventData.event_type === 'volunteer' || createEventData.event_type === 'event') && (
          <Animated.View entering={FadeInDown.duration(220)}>
            <View className="flex-row mb-4">
              <View className="flex-1 mr-2">
                <CustomDateTimePicker
                  value={createEventData.event_date || ''}
                  onChange={(value) => setCreateEventData({...createEventData, event_date: value})}
                  placeholder="Select date"
                  mode="date"
                  label="Date"
                />
              </View>
              <View className="flex-1">
                <CustomDateTimePicker
                  value={createEventData.event_time || ''}
                  onChange={(value) => setCreateEventData({...createEventData, event_time: value})}
                  placeholder="Select time"
                  mode="time"
                  label="Time"
                />
              </View>
            </View>

            <Field
              label="Location"
              value={createEventData.location}
              onChangeText={(text) => setCreateEventData({...createEventData, location: text})}
              placeholder="Event location..."
              autoComplete="street-address"
              textContentType="fullStreetAddress"
            />

            <Field
              label="Contact information"
              value={createEventData.contact_info}
              onChangeText={(text) => setCreateEventData({...createEventData, contact_info: text})}
              placeholder="Contact details..."
              autoComplete="tel"
              textContentType="telephoneNumber"
            />
          </Animated.View>
        )}

        <View className="flex-row items-center rounded-2xl p-4 mt-1 bg-gray-50 dark:bg-white/[0.04]">
          <View className="h-9 w-9 rounded-xl bg-red-600/10 items-center justify-center mr-3">
            <Ionicons name="notifications" size={16} color={palette.accent} />
          </View>
          <View className="flex-1 pr-3">
            <Text className="font-sans-semibold text-[15px] text-gray-900 dark:text-white">Notify channel subscribers</Text>
            <Text className="font-sans text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Push only to people subscribed to this channel
            </Text>
          </View>
          <Switch
            value={notifyParishioners}
            onValueChange={(value) => {
              Haptics.selectionAsync().catch(() => {});
              setNotifyParishioners(value);
            }}
            trackColor={{ false: colors.isDark ? '#374151' : '#D1D5DB', true: palette.accentSoft }}
            thumbColor="white"
            ios_backgroundColor={colors.isDark ? '#374151' : '#D1D5DB'}
          />
        </View>
      </Sheet>

      {/* Post details sheet */}
      <Sheet
        visible={showEventDetailsModal}
        onClose={() => setShowEventDetailsModal(false)}
        eyebrow={selectedKind?.label}
        title={selectedEvent?.title}
        footer={
          isParishAdmin && selectedEvent?.created_by === user?.id ? (
            <View className="flex-row">
              <Button label="Edit" variant="secondary" icon="pencil" onPress={startEditingSelectedEvent} style={{ flex: 1, marginRight: 8 }} />
              <Button label="Delete" variant="danger" icon="trash-outline" onPress={() => handleDeleteEvent(selectedEvent!.id)} style={{ flex: 1 }} />
            </View>
          ) : undefined
        }
      >
        {selectedEvent && (
          <View>
            <View className="flex-row flex-wrap mb-3" style={{ rowGap: 6, columnGap: 6 }}>
              {!!selectedEvent.channel?.name && (
                <View className="self-start rounded-full px-2.5 py-1 bg-red-600/10">
                  <Text className="font-sans-semibold text-[11px] text-red-700 dark:text-red-300">
                    {selectedEvent.channel.name}
                  </Text>
                </View>
              )}
              {selectedEvent.created_by === user?.id && (
                <View className="self-start rounded-full px-2.5 py-1 bg-gray-100 dark:bg-white/10">
                  <Text className="font-sans-semibold text-[11px] text-gray-600 dark:text-gray-300">Your post</Text>
                </View>
              )}
            </View>

            {!!selectedEvent.description && (
              <Text className="font-sans text-[16px] leading-[25px] text-gray-700 dark:text-gray-200">
                {selectedEvent.description}
              </Text>
            )}

            {(() => {
              const rows: { icon: keyof typeof Ionicons.glyphMap; text: string }[] = [];
              const dated = selectedEvent.event_type === 'volunteer' || selectedEvent.event_type === 'event';
              if (dated && selectedEvent.event_date) {
                rows.push({
                  icon: 'calendar-outline',
                  text: parseLocalDate(selectedEvent.event_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
                });
              }
              if (dated && selectedEvent.event_time) rows.push({ icon: 'time-outline', text: formatEventTime(selectedEvent.event_time) });
              if (dated && selectedEvent.location) rows.push({ icon: 'location-outline', text: selectedEvent.location });
              if (selectedEvent.contact_info) rows.push({ icon: 'call-outline', text: selectedEvent.contact_info });
              if (rows.length === 0) return null;
              return (
                <View className="rounded-2xl mt-5 bg-gray-50 dark:bg-white/[0.04] overflow-hidden">
                  {rows.map((row, i) => (
                    <View key={row.icon} className={`flex-row items-center px-4 py-3.5 ${i > 0 ? 'border-t border-gray-100 dark:border-white/[0.06]' : ''}`}>
                      <Ionicons name={row.icon} size={17} color={colors.textMuted} />
                      <Text className="font-sans-medium text-[14px] text-gray-800 dark:text-gray-200 ml-3 flex-1">{row.text}</Text>
                    </View>
                  ))}
                </View>
              );
            })()}

            <Text className="font-sans text-xs text-gray-400 dark:text-gray-500 mt-4 mb-2">
              Posted {new Date(selectedEvent.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>

            {/* RSVP for parishioners */}
            {!isParishAdmin && selectedEvent.event_type === 'event' && (
              <View className="pt-4 mt-2 border-t border-gray-100 dark:border-white/[0.06]">
                {selectedEvent.user_response ? (
                  <Animated.View entering={FadeInDown.duration(360).springify().damping(26).stiffness(175)}>
                    <View className="flex-row items-center rounded-2xl p-4 bg-emerald-500/[0.08] border border-emerald-500/20 overflow-hidden">
                      <Animated.View entering={ZoomIn.delay(80).springify().damping(18).stiffness(210)}>
                        <View className="h-10 w-10 rounded-full bg-emerald-500/15 items-center justify-center">
                          <Ionicons name="checkmark-circle" size={22} color={palette.green} />
                        </View>
                      </Animated.View>
                      <Animated.View
                        entering={FadeIn.delay(140).duration(280)}
                        className="flex-1 ml-3"
                      >
                        <Text className="font-sans-semibold text-[11px] tracking-[1.2px] uppercase text-emerald-700/80 dark:text-emerald-400/90">
                          Confirmed
                        </Text>
                        <Text className="font-sans-semibold text-[15px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                          You responded: {RESPONSE_LABEL[selectedEvent.user_response.response_type] ?? 'Attending'}
                        </Text>
                        {selectedEvent.user_response.notes && (
                          <Text className="font-sans text-[13px] text-gray-600 dark:text-gray-300 mt-1">
                            Your notes: “{selectedEvent.user_response.notes}”
                          </Text>
                        )}
                      </Animated.View>
                    </View>
                    <Animated.View entering={FadeIn.delay(220).duration(280)}>
                      <Button
                        label={removingResponse ? 'Removing…' : 'Remove response'}
                        variant="danger"
                        loading={removingResponse}
                        disabled={removingResponse}
                        onPress={() => handleRemoveResponse(selectedEvent.id)}
                        fullWidth
                        className="mt-3"
                      />
                    </Animated.View>
                  </Animated.View>
                ) : (
                  <View>
                    <Text className="font-display text-[22px] text-gray-900 dark:text-white mb-3">Will you be there?</Text>
                    <View className="flex-row mb-4">
                      {([
                        { key: 'attending', label: 'Attending', icon: 'checkmark-circle', color: palette.green },
                        { key: 'interested', label: 'Interested', icon: 'star', color: palette.blue },
                        { key: 'unavailable', label: 'Can’t make it', icon: 'close-circle', color: palette.accentSoft },
                      ] as const).map((option, i) => {
                        const active = responseData.response_type === option.key;
                        return (
                          <PressableScale
                            key={option.key}
                            onPress={() => {
                              Haptics.selectionAsync().catch(() => {});
                              setResponseData({ ...responseData, response_type: option.key });
                            }}
                            accessibilityRole="radio"
                            accessibilityState={{ selected: active }}
                            style={{ flex: 1, marginRight: i < 2 ? 8 : 0 }}
                            className={`rounded-2xl py-3 items-center ${active ? '' : 'bg-gray-100 dark:bg-white/5'}`}
                          >
                            {active && (
                              <Animated.View
                                entering={ZoomIn.duration(180)}
                                style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 16, backgroundColor: `${option.color}1F`, borderWidth: 1.5, borderColor: option.color }}
                              />
                            )}
                            <Ionicons name={option.icon} size={18} color={active ? option.color : palette.gray400} />
                            <Text className={`font-sans-semibold text-xs mt-1 ${active ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                              {option.label}
                            </Text>
                          </PressableScale>
                        );
                      })}
                    </View>
                    <Field
                      label="Notes (optional)"
                      value={responseData.notes}
                      onChangeText={(text) => setResponseData({...responseData, notes: text})}
                      placeholder="Any additional notes..."
                      multiline
                      numberOfLines={2}
                    />
                    <Button
                      label={respondingToEvent ? 'Submitting…' : 'Send response'}
                      icon="send"
                      loading={respondingToEvent}
                      onPress={handleRespondToEvent}
                      fullWidth
                    />
                  </View>
                )}
              </View>
            )}

            {/* Volunteer sign-up for parishioners */}
            {!isParishAdmin && selectedEvent.event_type === 'volunteer' && (
              <View className="pt-4 mt-2 border-t border-gray-100 dark:border-white/[0.06]">
                {renderVolunteerProgress(selectedEvent)}

                {selectedEvent.user_response ? (
                  <View>
                    <View className="flex-row items-center rounded-2xl p-4 bg-emerald-500/[0.08]">
                      <Ionicons name="checkmark-circle" size={20} color={palette.green} />
                      <View className="flex-1 ml-2.5">
                        <Text className="font-sans-semibold text-sm text-emerald-700 dark:text-emerald-400">You volunteered for this event</Text>
                        {selectedEvent.user_response.notes && (
                          <Text className="font-sans text-[13px] text-gray-600 dark:text-gray-300 mt-0.5">
                            Your notes: “{selectedEvent.user_response.notes}”
                          </Text>
                        )}
                      </View>
                    </View>
                    <Button
                      label={removingResponse ? 'Removing…' : 'Remove response'}
                      variant="danger"
                      loading={removingResponse}
                      disabled={removingResponse}
                      onPress={() => handleRemoveResponse(selectedEvent.id)}
                      fullWidth
                      className="mt-3"
                    />
                  </View>
                ) : (
                  <View>
                    <PressableScale
                      onPress={() => {
                        Haptics.selectionAsync().catch(() => {});
                        setResponseData({
                          ...responseData,
                          response_type: responseData.response_type === 'volunteer' ? 'attending' : 'volunteer'
                        });
                      }}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: responseData.response_type === 'volunteer' }}
                      className={`flex-row items-center rounded-2xl p-4 mb-4 border-2 ${
                        responseData.response_type === 'volunteer'
                          ? 'bg-emerald-500/10 border-emerald-500'
                          : 'bg-gray-100 dark:bg-white/5 border-transparent'
                      }`}
                    >
                      <Ionicons
                        name={responseData.response_type === 'volunteer' ? 'checkmark-circle' : 'hand-left-outline'}
                        size={24}
                        color={responseData.response_type === 'volunteer' ? palette.green : palette.gray400}
                      />
                      <View className="ml-3 flex-1">
                        <Text className="font-sans-bold text-[15px] text-gray-900 dark:text-white">I'll volunteer</Text>
                        <Text className="font-sans text-xs text-gray-500 dark:text-gray-400 mt-0.5">Let the parish know they can count on you</Text>
                      </View>
                    </PressableScale>

                    <Field
                      label="Notes (optional)"
                      value={responseData.notes}
                      onChangeText={(text) => setResponseData({...responseData, notes: text})}
                      placeholder="Any additional notes..."
                      multiline
                      numberOfLines={2}
                    />

                    <Button
                      label={respondingToEvent ? 'Submitting…' : 'Send response'}
                      icon="send"
                      loading={respondingToEvent}
                      disabled={respondingToEvent || responseData.response_type !== 'volunteer'}
                      onPress={handleRespondToEvent}
                      fullWidth
                    />
                  </View>
                )}
              </View>
            )}

            {/* RSVP summary for parish admins */}
            {isParishAdmin && selectedEvent.event_type === 'event' && (
              <View className="pt-4 mt-2 border-t border-gray-100 dark:border-white/[0.06]">
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="font-display text-[22px] text-gray-900 dark:text-white">Responses</Text>
                  {loadingResponses && <ActivityIndicator size="small" color={colors.textMuted} />}
                </View>

                {!loadingResponses && eventResponses.length > 0 && (
                  <View className="flex-row mb-4">
                    {[
                      { label: 'Attending', value: eventResponses.filter(r => r.response_type === 'attending').length, color: palette.green },
                      { label: 'Interested', value: eventResponses.filter(r => r.response_type === 'interested').length, color: palette.blue },
                      { label: 'Unavailable', value: eventResponses.filter(r => r.response_type === 'unavailable').length, color: palette.accentSoft },
                      { label: 'Total', value: eventResponses.length, color: colors.text },
                    ].map((stat, i) => (
                      <View key={stat.label} className={`flex-1 rounded-2xl py-3 items-center bg-gray-50 dark:bg-white/[0.04] ${i < 3 ? 'mr-2' : ''}`}>
                        <Text className="font-display text-[28px] leading-[30px]" style={{ color: stat.color }}>{stat.value}</Text>
                        <Text className="font-sans-medium text-[10.5px] text-gray-500 dark:text-gray-400 mt-0.5">{stat.label}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {eventResponses.length === 0 ? (
                  !loadingResponses && <EmptyState compact icon="people-outline" title="No responses yet" />
                ) : (
                  eventResponses.map((response, index) => {
                    const tone =
                      response.response_type === 'attending' ? palette.green :
                      response.response_type === 'interested' ? palette.blue : palette.accentSoft;
                    return (
                      <View key={index} className="rounded-2xl p-4 mb-2 bg-gray-50 dark:bg-white/[0.04]">
                        <View className="flex-row items-center justify-between">
                          <Text className="font-sans-semibold text-[15px] text-gray-900 dark:text-white flex-1 pr-2">
                            {response.user_profile?.full_name || 'Unknown User'}
                          </Text>
                          <View className="rounded-full px-2.5 py-1" style={{ backgroundColor: `${tone}1F` }}>
                            <Text className="font-sans-bold text-[11px]" style={{ color: tone }}>
                              {response.response_type === 'attending' ? 'Attending' :
                               response.response_type === 'interested' ? 'Interested' : 'Unavailable'}
                            </Text>
                          </View>
                        </View>
                        {response.notes && (
                          <Text className="font-sans text-[13px] text-gray-600 dark:text-gray-300 mt-1.5">“{response.notes}”</Text>
                        )}
                        <Text className="font-sans text-[11px] text-gray-400 dark:text-gray-500 mt-1.5">
                          {new Date(response.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      </View>
                    );
                  })
                )}
              </View>
            )}

            {/* Volunteer summary for parish admins */}
            {isParishAdmin && selectedEvent.event_type === 'volunteer' && (
              <View className="pt-4 mt-2 border-t border-gray-100 dark:border-white/[0.06]">
                {renderVolunteerProgress(selectedEvent)}
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="font-display text-[22px] text-gray-900 dark:text-white">Volunteers</Text>
                  {loadingResponses && <ActivityIndicator size="small" color={colors.textMuted} />}
                </View>
                {eventResponses.length === 0 ? (
                  !loadingResponses && <EmptyState compact icon="people-outline" title="No volunteers yet" />
                ) : (
                  eventResponses.map((response, index) => (
                    <View key={index} className="rounded-2xl p-4 mb-2 bg-gray-50 dark:bg-white/[0.04]">
                      <View className="flex-row items-center justify-between">
                        <Text className="font-sans-semibold text-[15px] text-gray-900 dark:text-white flex-1 pr-2">
                          {response.user_profile?.full_name || 'Unknown User'}
                        </Text>
                        <View className="rounded-full px-2.5 py-1 bg-emerald-500/15">
                          <Text className="font-sans-bold text-[11px] text-emerald-600 dark:text-emerald-400">Volunteer</Text>
                        </View>
                      </View>
                      {response.notes && (
                        <Text className="font-sans text-[13px] text-gray-600 dark:text-gray-300 mt-1.5">Notes: “{response.notes}”</Text>
                      )}
                      <Text className="font-sans text-[11px] text-gray-400 dark:text-gray-500 mt-1.5">
                        {new Date(response.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                  ))
                )}
              </View>
            )}
          </View>
        )}
      </Sheet>

      {parishId && user && (
        <ChannelsSheet
          visible={showChannelsSheet}
          onClose={() => setShowChannelsSheet(false)}
          parishId={parishId}
          userId={user.id}
          isParishAdmin={isParishAdmin}
          onChanged={() => {
            loadBulletinEvents();
          }}
        />
      )}

      {/* Above the event sheet so volunteer confirmations celebrate on top */}
      {showVolunteerConfetti && (
        <Portal>
          {/* Taller than the screen so pieces settle below the fold instead of pooling on-screen */}
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: windowHeight + 200,
              overflow: 'hidden',
            }}
          >
            <ConfettiCannon
              count={180}
              origin={{ x: windowWidth / 2, y: -20 }}
              fadeOut
              autoStart
              explosionSpeed={1100}
              fallSpeed={3200}
              colors={CONFETTI_COLORS}
              onAnimationEnd={() => setShowVolunteerConfetti(false)}
            />
          </View>
        </Portal>
      )}
    </View>
  );
}
