import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { LayoutChangeEvent, Pressable, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
    FadeIn,
    FadeInLeft,
    FadeInRight,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { EventDetailSheet } from "../../../components/liturgical/EventDetailSheet";
import { FastingBadge } from "../../../components/liturgical/FastingBadge";
import { ReadingsCarousel } from "../../../components/liturgical/ReadingsCarousel";
import { ReadingSheet } from "../../../components/liturgical/ReadingSheet";
import { TimelineItem } from "../../../components/liturgical/TimelineItem";
import ParishCalendarSetup, { CalendarSetupCallout } from "../../../components/ParishCalendarSetup";
import { AppRefreshControl, RefreshSpinnerOverlay } from "../../../components/ui/AppRefreshControl";
import { Button } from "../../../components/ui/Button";
import { EmptyState } from "../../../components/ui/EmptyState";
import { PressableScale } from "../../../components/ui/PressableScale";
import { CompactHeader, LargeHeader, useScrollHeader } from "../../../components/ui/ScreenHeader";
import { SectionHeader } from "../../../components/ui/SectionHeader";
import { SegmentedControl } from "../../../components/ui/SegmentedControl";
import { SkeletonRows } from "../../../components/ui/Skeleton";
import { Spinner } from "../../../components/ui/Spinner";
import { useThemeColors } from "../../../components/ui/useThemeColors";
import { contentBottomPadding, entrance, eventKindStyle, fastingStyle, getFastingKind, palette, springs } from "../../../constants/theme";
import { useAuth } from "../../../contexts/AuthContext";
import { useCalendarTradition } from "../../../contexts/CalendarTraditionContext";
import { useNotifications } from "../../../contexts/NotificationContext";
import { useParishScope } from "../../../contexts/ParishScopeContext";
import { useTabScrollToTop } from "../../../hooks/useTabScrollToTop";
import { toLocalDateKey } from "../../../utils/dateUtils";
import { BulletinEvent, BulletinService } from "@parohia/shared";
import {
    Commemoration,
    fetchOrthodoxCalendarData,
    fetchParishEventsForMultipleDays,
    fetchParishEventsForToday,
    OrthodoxCalendarData,
    ParishEvent,
} from "@parohia/shared";
import { ChannelService } from "@parohia/shared";
import { ChantService, ChantSignup, isChantServiceEvent } from "@parohia/shared";
import { ConfessionReservationWithSchedule, ConfessionService } from "@parohia/shared";
import { getUserProfile } from "@parohia/shared";
import { confessionPriest, getParishByAdminId, getParishByUserId } from "@parohia/shared";

type PersonalItem = {
  id: string;
  type: 'confession' | 'event';
  title: string;
  timeDisplay: string;
  isAllDay: boolean;
  notes?: string;
  location?: string;
  link?: string;
  eventType?: 'event' | 'volunteer' | 'announcement';
  data: any;
};

type ViewMode = 'month' | 'week';

const DAY_DOT_SIZE = 40;

/**
 * Selection circle that moves between day cells.
 * Mount only with valid x/y so shared values never initialize off-cell (which flashed on day 1).
 * - slide: spring between cells (week view)
 * - grid: enter from off-screen on month change / first tap (keeping prior Y), then spring
 */
function MovingDayDot({
  x,
  y,
  size = DAY_DOT_SIZE,
  moveMode = 'slide',
  popOnMount = false,
  enterFrom = null,
  enterY = -1,
  trackWidth = 0,
}: {
  x: number;
  y: number;
  size?: number;
  moveMode?: 'slide' | 'grid';
  popOnMount?: boolean;
  enterFrom?: 'left' | 'right' | null;
  enterY?: number;
  trackWidth?: number;
}) {
  const startX =
    enterFrom === 'left' ? -size : enterFrom === 'right' ? Math.max(trackWidth, x) + size : x;
  const startY = enterFrom && enterY >= 0 ? enterY : y;

  const translateX = useSharedValue(startX);
  const translateY = useSharedValue(startY);
  const scale = useSharedValue(1);
  // enter → placed (quiet mount) → interactive
  const phase = useRef<'enter' | 'placed' | 'interactive'>('enter');

  useEffect(() => {
    if (phase.current === 'enter') {
      if (enterFrom) {
        translateX.value = withSpring(x, springs.snappy);
        translateY.value = withSpring(y, springs.snappy);
        scale.value = withSequence(withSpring(1.12, springs.snappy), withSpring(1, springs.gentle));
        phase.current = 'interactive';
        return;
      }

      translateX.value = x;
      translateY.value = y;
      if (moveMode === 'slide' || popOnMount) {
        scale.value = withSequence(withSpring(1.14, springs.snappy), withSpring(1, springs.snappy));
        phase.current = 'interactive';
      } else {
        scale.value = 1;
        phase.current = 'placed';
      }
      return;
    }

    if (phase.current === 'placed') {
      translateX.value = x;
      translateY.value = y;
      scale.value = withSequence(withSpring(1.14, springs.snappy), withSpring(1, springs.snappy));
      phase.current = 'interactive';
      return;
    }

    translateX.value = withSpring(x, springs.snappy);
    translateY.value = withSpring(y, springs.snappy);
    scale.value = withSequence(withSpring(1.12, springs.snappy), withSpring(1, springs.gentle));
  }, [x, y, moveMode, popOnMount, enterFrom]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          left: 0,
          top: 0,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: palette.accent,
          zIndex: 0,
        },
        style,
      ]}
    />
  );
}

const pad2 = (n: number) => String(n).padStart(2, '0');
const localDateKey = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const parseDateOnly = (value: string) => {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d);
};

/** Groups events by the local days they occur on; all-day events span until their exclusive end date. */
function groupEventsByDay(events: ParishEvent[], dayKeys: Set<string>) {
  const byDay: Record<string, ParishEvent[]> = {};
  const add = (key: string, event: ParishEvent) => {
    if (dayKeys.has(key)) (byDay[key] ??= []).push(event);
  };

  events.forEach((event) => {
    if (!event.startTime) return;
    if (event.startTime.includes('T')) {
      add(localDateKey(new Date(event.startTime)), event);
      return;
    }
    const cursor = parseDateOnly(event.startTime);
    const end = event.endTime && !event.endTime.includes('T') ? parseDateOnly(event.endTime) : null;
    let guard = 0;
    do {
      add(localDateKey(cursor), event);
      cursor.setDate(cursor.getDate() + 1);
      guard++;
    } while (end && cursor < end && guard < 14);
  });

  Object.values(byDay).forEach((list) =>
    list.sort((a, b) => {
      const aAllDay = !a.startTime.includes('T');
      const bAllDay = !b.startTime.includes('T');
      if (aAllDay !== bAllDay) return aAllDay ? -1 : 1;
      return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
    })
  );
  return byDay;
}

export default function Calendar() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const { scrollY, onScroll } = useScrollHeader();
  const scrollRef = useRef<Animated.ScrollView>(null);
  useTabScrollToTop(scrollRef);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [monthDirection, setMonthDirection] = useState<'prev' | 'next'>('next');
  const [calendarData, setCalendarData] = useState<OrthodoxCalendarData | null>(null);
  const [parishEvents, setParishEvents] = useState<ParishEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSaint, setSelectedSaint] = useState<Commemoration | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedReading, setSelectedReading] = useState<{ display: string; passage: string } | null>(null);
  const [readingModalVisible, setReadingModalVisible] = useState(false);
  const [showCalendarSetup, setShowCalendarSetup] = useState(false);
  const [isParishAdmin, setIsParishAdmin] = useState(false);
  const [parishHasCalendar, setParishHasCalendar] = useState(true);
  const [parishName, setParishName] = useState<string>('');
  const [parishId, setParishId] = useState<string | null>(null);
  const [eventNotificationStates, setEventNotificationStates] = useState<Record<string, boolean>>({});
  const [togglingEvent, setTogglingEvent] = useState<string | null>(null);
  const [chantSubscribed, setChantSubscribed] = useState(false);
  const [chantSignups, setChantSignups] = useState<ChantSignup[]>([]);
  const [chantLoading, setChantLoading] = useState(false);
  const [chantToggling, setChantToggling] = useState(false);
  const [personalConfessions, setPersonalConfessions] = useState<ConfessionReservationWithSchedule[]>([]);
  const [confessionDetails, setConfessionDetails] = useState<Record<string, any>>({});
  const [parishDetails, setParishDetails] = useState<any>(null);
  const [personalEvents, setPersonalEvents] = useState<BulletinEvent[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [fastingData, setFastingData] = useState<Record<string, string>>({});
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [weekEvents, setWeekEvents] = useState<ParishEvent[]>([]);
  const [weekLoading, setWeekLoading] = useState(false);
  const [weekReload, setWeekReload] = useState(0);
  const [weekAnchor, setWeekAnchor] = useState(new Date());
  const [activeEvent, setActiveEvent] = useState<ParishEvent | null>(null);
  const [activePersonal, setActivePersonal] = useState<PersonalItem | null>(null);
  const [eventSheetVisible, setEventSheetVisible] = useState(false);
  const [monthGridWidth, setMonthGridWidth] = useState(0);
  const [weekStripWidth, setWeekStripWidth] = useState(0);
  const [weekDotY, setWeekDotY] = useState(-1);
  const prevMonthKeyRef = useRef<string | null>(null);
  const monthOpenedWithoutSelection = useRef(false);
  const lastMonthDotY = useRef(-1);
  const monthEnterFrom = useRef<'left' | 'right' | null>(null);
  const monthEnterY = useRef(-1);

  const { user } = useAuth();
  const { tradition } = useCalendarTradition();
  const { parishEpoch } = useParishScope();
  const { preferences, setParishEventNotificationEnabled, isParishEventNotificationEnabled } = useNotifications();

  // Fetch fasting data for multiple days
  const fetchFastingDataForDays = async (days: Date[]) => {
    try {
      const fastingPromises = days.map(async (date) => {
        const data = await fetchOrthodoxCalendarData(date, tradition);
        return {
          dateKey: toLocalDateKey(date),
          fasting: data.fasting
        };
      });
      
      const results = await Promise.all(fastingPromises);
      const fastingMap: Record<string, string> = {};
      
      results.forEach(({ dateKey, fasting }) => {
        fastingMap[dateKey] = fasting;
      });
      
      setFastingData(fastingMap);
    } catch (error) {
      console.error('Error fetching fasting data for multiple days:', error);
    }
  };

  // Fetch data for selected date
  const fetchDataForDate = async (date: Date) => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch calendar data and parish events
      const [calendar, parish] = await Promise.all([
        fetchOrthodoxCalendarData(date, tradition),
        fetchParishEventsForToday(date, user?.id)
      ]);
      setCalendarData(calendar);
      setParishEvents(parish);
      
      // Load notification states for the events
      if (parish && parish.length > 0) {
        await loadEventNotificationStates(parish);
      }
      
      // Fetch personal confessions for the selected date
      if (user) {
        try {
          // Get user profile to determine user type
          const profile = await getUserProfile(user.id);
          const isAdmin = profile?.user_type === 'parish_admin';
          
          let confessionsForDate: ConfessionReservationWithSchedule[] = [];
          
          if (isAdmin) {
            // For parish admins, get all reservations for their parish on the selected date
            const parish = await getParishByAdminId(user.id);
            
            if (parish) {
              confessionsForDate = await ConfessionService.getParishReservations(parish.id, date);
            }
          } else {
            // For regular users, get their own reservations
            const userReservations = await ConfessionService.getUserReservations(user.id);
            // Use local date formatting to avoid timezone issues
            const dateStr = date.getFullYear() + '-' + 
              String(date.getMonth() + 1).padStart(2, '0') + '-' + 
              String(date.getDate()).padStart(2, '0');
            
            confessionsForDate = userReservations.filter(reservation => {
              // Check if the reservation is for the selected date
              const reservationDate = reservation.confession_schedules?.date;
              
              // Handle different date formats
              if (!reservationDate) return false;
              
              // Try direct comparison first
              if (reservationDate === dateStr) return true;
              
              // Try parsing as Date and comparing
              try {
                const parsedReservationDate = new Date(reservationDate);
                const parsedSelectedDate = new Date(dateStr);
                return parsedReservationDate.toISOString().split('T')[0] === parsedSelectedDate.toISOString().split('T')[0];
              } catch (e) {
                return false;
              }
            });
          }
          
          setPersonalConfessions(confessionsForDate);
          
          // Fetch additional details for each confession
          const details: Record<string, any> = {};
          for (const confession of confessionsForDate) {
            try {
              const reservationDetails = await ConfessionService.getReservationDetails(confession.schedule_id);
              details[confession.id] = reservationDetails;
            } catch (error) {
              console.error('Error fetching confession details:', error);
            }
          }
          setConfessionDetails(details);
          
          // Fetch parish details to get priest name for regular users
          if (user && !isParishAdmin) {
            try {
              const parish = await getParishByUserId(user.id);
              if (parish) {
                setParishDetails(parish);
              }
            } catch (error) {
              console.error('Error fetching parish details:', error);
            }
          }

          // Fetch personal events (events user has responded to)
          if (user) {
            try {
              const userPersonalEvents = await BulletinService.getUserPersonalEvents(user.id, date);
              setPersonalEvents(userPersonalEvents);
            } catch (error) {
              console.error('Error fetching personal events:', error);
              setPersonalEvents([]);
            }
          }

          // Scheduling is handled globally via refreshNotifications()
        } catch (confessionError) {
          console.error('Error fetching personal confessions:', confessionError);
          setPersonalConfessions([]);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch calendar data');
      console.error('Error fetching data for date:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkUserAndParish = async () => {
    if (user) {
      const profile = await getUserProfile(user.id);
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
        const subscribed = await ChannelService.isUserSubscribedToChant(user.id, nextParishId);
        setChantSubscribed(subscribed);
      } else {
        setChantSubscribed(false);
      }
    }
  };

  // Check user type and parish calendar status
  useEffect(() => {
    checkUserAndParish();
  }, [user, parishEpoch]);

  // Load notification states for events
  const loadEventNotificationStates = async (events: ParishEvent[]) => {
    const states: Record<string, boolean> = {};
    for (const event of events) {
      // Parish events are OFF by default; check explicit enable list
      const isEnabled = await isParishEventNotificationEnabled(event.id);
      states[event.id] = !!isEnabled;
    }
    setEventNotificationStates(prev => ({ ...prev, ...states }));
  };

  const handleNotificationToggle = async (eventId: string) => {
    try {
      setTogglingEvent(eventId);
      const currentState = eventNotificationStates[eventId];
      const newEnabledState = !currentState;
      const eventData = parishEvents.find(e => e.id === eventId) ?? weekEvents.find(e => e.id === eventId);
      await setParishEventNotificationEnabled(eventId, newEnabledState, eventData);
      setEventNotificationStates(prev => ({ ...prev, [eventId]: newEnabledState }));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch (error) {
      console.error('Error toggling notification for event:', error);
    } finally {
      setTogglingEvent(null);
    }
  };

  // Fetch data when selected date, calendar tradition, or parish changes
  useEffect(() => {
    fetchDataForDate(selectedDate);
  }, [selectedDate, user, tradition, parishEpoch]);

  const handleCalendarSetupSuccess = () => {
    setParishHasCalendar(true);
    fetchDataForDate(selectedDate);
    setWeekReload(n => n + 1);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await checkUserAndParish(); // Refresh parish information
      await fetchDataForDate(selectedDate);
      setWeekReload(n => n + 1);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Generate calendar days for the current month
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const today = new Date();
    
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const isCurrentMonth = date.getMonth() === month;
      const isToday = date.toDateString() === today.toDateString();
      const isSelected = date.toDateString() === selectedDate.toDateString();
      days.push({
        date,
        isCurrentMonth,
        isToday,
        isSelected
      });
    }
    
    return days;
  };

  const calendarDays = generateCalendarDays();

  // Fetch fasting data when calendar days or tradition change
  useEffect(() => {
    const dates = calendarDays.map(day => day.date);
    fetchFastingDataForDays(dates);
  }, [currentMonth, tradition]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    Haptics.selectionAsync().catch(() => {});
    setMonthDirection(direction);
    setCurrentMonth(newMonth);
  };

  const jumpToToday = () => {
    const today = new Date();
    setMonthDirection(today < currentMonth ? 'prev' : 'next');
    setCurrentMonth(today);
    setSelectedDate(today);
    setWeekAnchor(today);
    Haptics.selectionAsync().catch(() => {});
  };

  const selectDay = (date: Date, isCurrentMonth: boolean) => {
    Haptics.selectionAsync().catch(() => {});
    setSelectedDate(date);
    if (!isCurrentMonth) {
      setMonthDirection(date < currentMonth ? 'prev' : 'next');
      setCurrentMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    }
  };

  const swipe = Gesture.Pan()
    .activeOffsetX([-24, 24])
    .failOffsetY([-14, 14])
    .onEnd((e) => {
      if (e.translationX < -50) runOnJS(navigateMonth)('next');
      else if (e.translationX > 50) runOnJS(navigateMonth)('prev');
    });

  const weekStart = new Date(weekAnchor.getFullYear(), weekAnchor.getMonth(), weekAnchor.getDate());
  const weekDays = Array.from({ length: 7 }, (_, i) => new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + i));
  const weekKey = localDateKey(weekStart);
  const isInWeekWindow = (date: Date) => weekDays.some((d) => d.toDateString() === date.toDateString());

  const changeViewMode = (mode: ViewMode) => {
    if (mode === 'week' && !isInWeekWindow(selectedDate)) setWeekAnchor(selectedDate);
    setViewMode(mode);
  };

  useEffect(() => {
    if (viewMode !== 'week' || !user) return;
    let cancelled = false;
    (async () => {
      setWeekLoading(true);
      try {
        const events = await fetchParishEventsForMultipleDays(weekStart, 7, user.id);
        if (cancelled) return;
        setWeekEvents(events);
        if (events.length > 0) await loadEventNotificationStates(events);
      } catch (err) {
        console.error('Error fetching parish events for week:', err);
        if (!cancelled) setWeekEvents([]);
      } finally {
        if (!cancelled) setWeekLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [weekKey, viewMode, user, weekReload, parishEpoch]);

  const navigateWeek = (direction: 'prev' | 'next') => {
    const next = new Date(weekAnchor);
    next.setDate(next.getDate() + (direction === 'next' ? 7 : -7));
    Haptics.selectionAsync().catch(() => {});
    setMonthDirection(direction);
    setWeekAnchor(next);
    setSelectedDate(next);
    if (next.getMonth() !== currentMonth.getMonth() || next.getFullYear() !== currentMonth.getFullYear()) {
      setCurrentMonth(new Date(next.getFullYear(), next.getMonth(), 1));
    }
  };

  const weekSwipe = Gesture.Pan()
    .activeOffsetX([-24, 24])
    .failOffsetY([-14, 14])
    .onEnd((e) => {
      if (e.translationX < -50) runOnJS(navigateWeek)('next');
      else if (e.translationX > 50) runOnJS(navigateWeek)('prev');
    });

  const daysOfWeek = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  const formatEventTimeRange = (start: string, end: string) => {
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
  };

  const formatConfessionTimeRange = (timeSlot: string) => {
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

  const convertTimeToMinutes = (timeString: string): number => {
    if (!timeString) return 0;
    const timeMatch = timeString.match(/(\d{1,2}):(\d{2})/);
    if (timeMatch) {
      const hours = parseInt(timeMatch[1], 10);
      const minutes = parseInt(timeMatch[2], 10);
      return hours * 60 + minutes;
    }
    return 0;
  };

  const buildPersonalSchedule = (): PersonalItem[] => {
    const allEvents: PersonalItem[] = [];
    const priestName = confessionPriest(parishDetails)?.name;

    personalConfessions.forEach((confession) => {
      const details = confessionDetails[confession.id];
      const timeRange = formatConfessionTimeRange(confession.confession_schedules?.time_slot);

      let title = "Confession";
      if (isParishAdmin && details?.user_profiles?.full_name) {
        title = `Confession with ${details.user_profiles.full_name}`;
      } else if (!isParishAdmin && priestName) {
        title = `Confession with ${priestName}`;
      }
      allEvents.push({
        id: confession.id,
        type: 'confession',
        title,
        timeDisplay: timeRange,
        isAllDay: false,
        notes: confession.notes || undefined,
        data: confession
      });
    });

    personalEvents.forEach((event) => {
      const timeDisplay = event.event_time ? formatEventTime(event.event_time) : '';
      const isAllDay = event.event_date && !event.event_time;
      const dateDisplay = event.event_date ? (() => {
        // Parse date as local date to avoid timezone issues
        const [year, month, day] = event.event_date.split('-').map(Number);
        const localDate = new Date(year, month - 1, day);
        return formatDate(localDate);
      })() : '';
      allEvents.push({
        id: event.id,
        type: 'event',
        title: event.title,
        timeDisplay: isAllDay ? dateDisplay : `Starts at ${timeDisplay}`,
        isAllDay: !!isAllDay,
        notes: event.user_response?.notes || undefined,
        location: event.location,
        link: event.link || undefined,
        eventType: event.event_type,
        data: event
      });
    });

    // All-day events first, then chronological across confessions and events
    allEvents.sort((a, b) => {
      if (a.isAllDay && !b.isAllDay) return -1;
      if (!a.isAllDay && b.isAllDay) return 1;

      if (a.isAllDay && b.isAllDay) {
        const parseLocalDate = (dateString: string) => {
          const [year, month, day] = dateString.split('-').map(Number);
          return new Date(year, month - 1, day);
        };
        const dateA = parseLocalDate(a.data.event_date || '1970-01-01');
        const dateB = parseLocalDate(b.data.event_date || '1970-01-01');
        return dateA.getTime() - dateB.getTime();
      }

      const timeOf = (item: PersonalItem) =>
        item.type === 'confession' ? item.data.confession_schedules?.time_slot || '' : item.data.event_time || '';

      if (a.type === b.type) return timeOf(a).localeCompare(timeOf(b));
      return convertTimeToMinutes(timeOf(a)) - convertTimeToMinutes(timeOf(b));
    });

    return allEvents;
  };

  const renderReminderBell = (event: ParishEvent) => {
    if (!event.startTime.includes('T')) return undefined;
    const isNotificationEnabled = eventNotificationStates[event.id];
    const isUpcoming = new Date(event.startTime) > new Date() && event.startTime.includes('T');
    const canToggle = isUpcoming && preferences.enabled;

    return (
      <PressableScale
        onPress={() =>
          canToggle
            ? handleNotificationToggle(event.id)
            : router.push('/(tabs)/calendar/notification-settings')
        }
        disabled={!isUpcoming || togglingEvent === event.id}
        accessibilityRole={canToggle ? "switch" : "button"}
        accessibilityState={{ checked: canToggle && !!isNotificationEnabled, disabled: !isUpcoming }}
        accessibilityLabel={
          !isUpcoming
            ? `Reminders unavailable for ${event.title}`
            : canToggle
              ? `Reminder for ${event.title}`
              : 'Turn on reminders in notification settings'
        }
        scaleTo={0.9}
        style={{ opacity: isUpcoming ? 1 : 0.4 }}
        className={`h-9 w-9 rounded-xl items-center justify-center ${
          canToggle && isNotificationEnabled ? 'bg-emerald-500/15' : 'bg-gray-100 dark:bg-white/10'
        }`}
      >
        {togglingEvent === event.id ? (
          <Spinner size="sm" />
        ) : (
          <Ionicons
            name={canToggle && isNotificationEnabled ? "notifications" : "notifications-off-outline"}
            size={16}
            color={canToggle && isNotificationEnabled ? palette.green : palette.gray400}
          />
        )}
      </PressableScale>
    );
  };

  const loadChantSignups = async (event: ParishEvent) => {
    if (!user || !parishId || (!chantSubscribed && !isParishAdmin)) {
      setChantSignups([]);
      return;
    }
    if (!isChantServiceEvent(event.title, event.startTime, event.endTime)) {
      setChantSignups([]);
      return;
    }
    try {
      setChantLoading(true);
      const list = await ChantService.listSignups(parishId, event.id);
      setChantSignups(list);
    } catch (error) {
      console.error('Error loading chant signups:', error);
      setChantSignups([]);
    } finally {
      setChantLoading(false);
    }
  };

  const toggleChantSignup = async () => {
    if (!user || !parishId || !activeEvent || chantToggling) return;
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
            calendarEventId: activeEvent.id,
            userId: user.id,
          })
        : await ChantService.signUp({
            parishId,
            calendarEventId: activeEvent.id,
            userId: user.id,
            eventTitle: activeEvent.title,
            eventStart: activeEvent.startTime,
          });
      if (!result.success) {
        console.error('Chant signup failed:', result.error);
        setChantSignups(previous);
        return;
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      const list = await ChantService.listSignups(parishId, activeEvent.id);
      setChantSignups(list);
    } catch (error) {
      console.error('Chant signup failed:', error);
      setChantSignups(previous);
    } finally {
      setChantToggling(false);
    }
  };

  const openEvent = (event: ParishEvent) => {
    Haptics.selectionAsync().catch(() => {});
    setActivePersonal(null);
    setActiveEvent(event);
    setEventSheetVisible(true);
    void loadChantSignups(event);
  };

  const openPersonalItem = (item: PersonalItem) => {
    Haptics.selectionAsync().catch(() => {});
    setActiveEvent(null);
    setActivePersonal(item);
    setChantSignups([]);
    setEventSheetVisible(true);
  };

  const showChantSignup =
    !activePersonal &&
    !!activeEvent &&
    (chantSubscribed || isParishAdmin) &&
    isChantServiceEvent(activeEvent.title, activeEvent.startTime, activeEvent.endTime);

  const personalKind = (item: PersonalItem) =>
    item.type === 'confession' ? 'confession' : item.eventType === 'volunteer' ? 'volunteer' : 'event';

  const weekDayKeys = new Set(weekDays.map(localDateKey));
  const weekEventsByDay = groupEventsByDay(weekEvents, weekDayKeys);
  const weekEnd = weekDays[6];
  const weekRangeLabel =
    weekStart.getMonth() === weekEnd.getMonth()
      ? `${weekStart.toLocaleDateString('en-US', { month: 'short' })} ${weekStart.getDate()} - ${weekEnd.getDate()}`
      : `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  const weekYearLabel = weekEnd.getFullYear();
  const daysWithEvents = weekDays.filter((d) => weekEventsByDay[localDateKey(d)]?.length);

  const isViewingTodayMonth =
    currentMonth.getMonth() === new Date().getMonth() && currentMonth.getFullYear() === new Date().getFullYear();
  const isTodaySelected = selectedDate.toDateString() === new Date().toDateString();
  const monthKey = `${currentMonth.getFullYear()}-${currentMonth.getMonth()}`;
  const personalSchedule = buildPersonalSchedule();
  const monthLabel = currentMonth.toLocaleDateString('en-US', { month: 'long' });
  const yearLabel = currentMonth.getFullYear();

  const monthCellWidth = monthGridWidth > 0 ? monthGridWidth / 7 : 0;
  const monthSelectedIndex = calendarDays.findIndex((day) => day.isSelected);
  const monthDotX =
    monthSelectedIndex >= 0 && monthCellWidth > 0
      ? (monthSelectedIndex % 7) * monthCellWidth + (monthCellWidth - DAY_DOT_SIZE) / 2
      : -1;
  const monthDotY =
    monthSelectedIndex >= 0 && monthCellWidth > 0
      ? Math.floor(monthSelectedIndex / 7) * 50 + 3
      : -1;
  const monthDotReady = monthDotX >= 0 && monthDotY >= 0;

  // On month page change: prepare a slide-in from the off-screen side, keeping the previous Y.
  // Applies both when the selection carries over and on the first tap in the new month.
  if (prevMonthKeyRef.current !== monthKey) {
    const isFirstMonth = prevMonthKeyRef.current === null;
    prevMonthKeyRef.current = monthKey;
    monthOpenedWithoutSelection.current = monthSelectedIndex < 0;
    if (!isFirstMonth && lastMonthDotY.current >= 0) {
      // Page carry-over follows the grid transition; first tap enters from the opposite side.
      const withPage = monthDirection === 'next' ? 'right' : 'left';
      const againstPage = monthDirection === 'next' ? 'left' : 'right';
      monthEnterFrom.current = monthOpenedWithoutSelection.current ? againstPage : withPage;
      monthEnterY.current = lastMonthDotY.current;
    } else {
      monthEnterFrom.current = null;
      monthEnterY.current = -1;
    }
  }
  if (monthDotReady) {
    lastMonthDotY.current = monthDotY;
  }
  const monthDotEnterFrom = monthEnterFrom.current;
  const monthDotEnterY = monthEnterY.current;
  // Pop only when we have no slide entrance to use (e.g. first launch).
  const popMonthDotOnMount = monthOpenedWithoutSelection.current && !monthDotEnterFrom;

  const weekCellWidth = weekStripWidth > 0 ? weekStripWidth / 7 : 0;
  const weekSelectedIndex = weekDays.findIndex((date) => date.toDateString() === selectedDate.toDateString());
  const weekDotX =
    weekSelectedIndex >= 0 && weekCellWidth > 0 && weekDotY >= 0
      ? weekSelectedIndex * weekCellWidth + (weekCellWidth - DAY_DOT_SIZE) / 2
      : -1;
  const weekDotReady = weekDotX >= 0 && weekDotY >= 0;

  return (
    <View className="flex-1 bg-gray-50 dark:bg-black">
      <CompactHeader title={formatDate(selectedDate)} scrollY={scrollY} />
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
          title="Calendar"
          subtitle={parishName || undefined}
          right={
            !(isViewingTodayMonth && isTodaySelected) ? (
              <Animated.View entering={entrance.pop()}>
                <Pressable
                  onPress={jumpToToday}
                  accessibilityRole="button"
                  className="h-9 px-4 rounded-full bg-red-600 flex-row items-center active:opacity-80 mb-1.5"
                >
                  <Ionicons name="today-outline" size={14} color="white" />
                  <Text className="font-sans-semibold text-[13px] text-white ml-1.5">Today</Text>
                </Pressable>
              </Animated.View>
            ) : undefined
          }
        />

        <View className="mx-4 mt-3">
          <SegmentedControl
            segments={[
              { key: 'month', label: 'Month', icon: 'grid-outline' },
              { key: 'week', label: 'Week', icon: 'list-outline' },
            ]}
            value={viewMode}
            onChange={changeViewMode}
          />
        </View>

        {/* Month / week card */}
        <View className="mx-4 mt-3 rounded-[28px] bg-white dark:bg-white/[0.04] border border-gray-100 dark:border-white/[0.06] px-3 pt-4 pb-3">
          <View className="flex-row items-center justify-between px-2">
            <Animated.View
              key={`label-${viewMode}-${viewMode === 'month' ? monthKey : weekKey}`}
              entering={FadeIn.duration(220)}
              style={{ flexDirection: 'row', alignItems: 'baseline', flexShrink: 1 }}
            >
              <Text className="font-display text-[28px] text-gray-900 dark:text-white" numberOfLines={1}>
                {viewMode === 'month' ? monthLabel : weekRangeLabel}
              </Text>
              <Text className="font-display text-[28px] text-gray-400 dark:text-gray-500 ml-2">
                {viewMode === 'month' ? yearLabel : weekYearLabel}
              </Text>
            </Animated.View>
            <View className="flex-row">
              <Pressable
                onPress={() => (viewMode === 'month' ? navigateMonth('prev') : navigateWeek('prev'))}
                hitSlop={6}
                accessibilityRole="button"
                accessibilityLabel={viewMode === 'month' ? 'Previous month' : 'Previous week'}
                className="h-9 w-9 rounded-full bg-gray-100 dark:bg-white/10 items-center justify-center active:opacity-70 mr-2"
              >
                <Ionicons name="chevron-back" size={17} color={colors.icon} />
              </Pressable>
              <Pressable
                onPress={() => (viewMode === 'month' ? navigateMonth('next') : navigateWeek('next'))}
                hitSlop={6}
                accessibilityRole="button"
                accessibilityLabel={viewMode === 'month' ? 'Next month' : 'Next week'}
                className="h-9 w-9 rounded-full bg-gray-100 dark:bg-white/10 items-center justify-center active:opacity-70"
              >
                <Ionicons name="chevron-forward" size={17} color={colors.icon} />
              </Pressable>
            </View>
          </View>

          {viewMode === 'week' ? (
            <GestureDetector gesture={weekSwipe}>
              <Animated.View
                key={`week-${weekKey}`}
                entering={(monthDirection === 'next' ? FadeInRight : FadeInLeft).duration(260)}
                onLayout={(e: LayoutChangeEvent) => setWeekStripWidth(e.nativeEvent.layout.width)}
                style={{ flexDirection: 'row', marginTop: 14, position: 'relative' }}
              >
                {weekDotReady && <MovingDayDot key={`week-dot-${weekKey}`} x={weekDotX} y={weekDotY} />}
                {weekDays.map((date) => {
                  const key = localDateKey(date);
                  const isSelected = date.toDateString() === selectedDate.toDateString();
                  const isToday = date.toDateString() === new Date().toDateString();
                  const isSunday = date.getDay() === 0;
                  const fastingKind = getFastingKind(fastingData[toLocalDateKey(date)] || '');
                  const fasting = fastingStyle[fastingKind];
                  const count = weekEventsByDay[key]?.length ?? 0;

                  return (
                    <Pressable
                      key={key}
                      onPress={() => selectDay(date, date.getMonth() === currentMonth.getMonth())}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isSelected }}
                      accessibilityLabel={`${formatDate(date)}${count ? `, ${count} parish event${count > 1 ? 's' : ''}` : ''}${fastingKind !== 'none' ? `, ${fasting.label}` : ''}`}
                      className="flex-1 items-center py-1"
                      style={{ zIndex: 1 }}
                    >
                      <Text
                        className={`font-sans-bold text-[11px] ${
                          isSunday ? 'text-red-600 dark:text-red-400' : 'text-gray-400 dark:text-gray-500'
                        }`}
                      >
                        {daysOfWeek[date.getDay()]}
                      </Text>
                      <View
                        className="h-10 w-10 mt-2 items-center justify-center"
                        onLayout={(e: LayoutChangeEvent) => {
                          const nextY = e.nativeEvent.layout.y;
                          if (nextY !== weekDotY) setWeekDotY(nextY);
                        }}
                      >
                        {isToday && !isSelected && (
                          <View style={{ position: 'absolute', width: 40, height: 40, borderRadius: 20, borderWidth: 1.5, borderColor: palette.accentSoft }} />
                        )}
                        <Text
                          className={`font-sans-semibold text-[16px] ${
                            isSelected
                              ? 'text-white'
                              : isToday || isSunday
                                ? 'text-red-600 dark:text-red-400'
                                : 'text-gray-900 dark:text-gray-100'
                          }`}
                        >
                          {date.getDate()}
                        </Text>
                      </View>
                      <View className="h-3 mt-1.5 items-center justify-center">
                        {fastingKind !== 'none' && (
                          <Ionicons name={fasting.icon as keyof typeof Ionicons.glyphMap} size={10} color={fasting.color} />
                        )}
                      </View>
                      <View className="h-1.5 mt-1 flex-row items-center">
                        {Array.from({ length: Math.min(count, 3) }).map((_, i) => (
                          <View
                            key={i}
                            style={{
                              width: 5,
                              height: 5,
                              borderRadius: 2.5,
                              marginHorizontal: 1,
                              backgroundColor: palette.accent,
                              opacity: 1 - i * 0.25,
                            }}
                          />
                        ))}
                      </View>
                    </Pressable>
                  );
                })}
              </Animated.View>
            </GestureDetector>
          ) : (
          <>
          <View className="flex-row mt-4 mb-1">
            {daysOfWeek.map((day, i) => (
              <View key={`${day}-${i}`} className="flex-1 items-center">
                <Text className={`font-sans-bold text-[11px] ${i === 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-400 dark:text-gray-500'}`}>
                  {day}
                </Text>
              </View>
            ))}
          </View>

          <GestureDetector gesture={swipe}>
            <Animated.View
              key={monthKey}
              entering={(monthDirection === 'next' ? FadeInRight : FadeInLeft).duration(260)}
              onLayout={(e: LayoutChangeEvent) => setMonthGridWidth(e.nativeEvent.layout.width)}
              style={{ flexDirection: 'row', flexWrap: 'wrap', position: 'relative' }}
            >
              {monthDotReady && (
                <MovingDayDot
                  key={`month-dot-${monthKey}`}
                  x={monthDotX}
                  y={monthDotY}
                  moveMode="grid"
                  popOnMount={popMonthDotOnMount}
                  enterFrom={monthDotEnterFrom}
                  enterY={monthDotEnterY}
                  trackWidth={monthGridWidth}
                />
              )}
              {calendarDays.map((day, index) => {
                const dateKey = toLocalDateKey(day.date);
                const fastingKind = getFastingKind(fastingData[dateKey] || '');
                const fasting = fastingStyle[fastingKind];
                const isSunday = day.date.getDay() === 0;

                return (
                  <Pressable
                    key={index}
                    onPress={() => selectDay(day.date, day.isCurrentMonth)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: day.isSelected }}
                    accessibilityLabel={`${formatDate(day.date)}${fastingKind !== 'none' ? `, ${fasting.label}` : ''}`}
                    style={{ width: '14.2857%', height: 50, zIndex: 1 }}
                    className="items-center justify-center"
                  >
                    {day.isToday && !day.isSelected && (
                      <View
                        style={{ position: 'absolute', width: 40, height: 40, borderRadius: 20, top: 3, borderWidth: 1.5, borderColor: palette.accentSoft }}
                      />
                    )}
                    <Text
                      className={`font-sans-semibold text-[15px] -mt-1.5 ${
                        day.isSelected
                          ? 'text-white'
                          : !day.isCurrentMonth
                            ? 'text-gray-300 dark:text-gray-700'
                            : day.isToday || isSunday
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-gray-900 dark:text-gray-100'
                      }`}
                    >
                      {day.date.getDate()}
                    </Text>
                    <View style={{ position: 'absolute', bottom: day.isSelected ? 9 : 4, height: 10, justifyContent: 'center' }}>
                      {fastingKind !== 'none' && day.isCurrentMonth && (
                        <Ionicons
                          name={fasting.icon as keyof typeof Ionicons.glyphMap}
                          size={9}
                          color={day.isSelected ? 'rgba(255,255,255,0.9)' : fasting.color}
                        />
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </Animated.View>
          </GestureDetector>
          </>
          )}

          <View className="flex-row items-center justify-center mt-2 pt-3 border-t border-gray-100 dark:border-white/[0.06]">
            {(['fish', 'wine', 'strict'] as const).map((kind) => (
              <View key={kind} className="flex-row items-center mx-2.5">
                <Ionicons name={fastingStyle[kind].icon as keyof typeof Ionicons.glyphMap} size={11} color={fastingStyle[kind].color} />
                <Text className="font-sans-medium text-[11px] text-gray-500 dark:text-gray-400 ml-1">{fastingStyle[kind].label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Week agenda */}
        {viewMode === 'week' && (
          <Animated.View entering={FadeIn.duration(260)} style={{ paddingHorizontal: 20, marginTop: 32 }}>
            <SectionHeader
              title="The week ahead"
              caption={
                weekLoading
                  ? 'Loading parish events'
                  : weekEvents.length > 0
                    ? `${weekEvents.length} ${weekEvents.length === 1 ? 'event' : 'events'} at ${parishName || 'your parish'}`
                    : parishHasCalendar
                      ? 'Nothing scheduled this week'
                      : parishName || undefined
              }
              actionLabel="Reminders"
              actionIcon={preferences.enabled ? "notifications" : "notifications-off"}
              actionIconColor={preferences.enabled ? palette.green : palette.gray400}
              onAction={() => router.push('/(tabs)/calendar/notification-settings')}
            />

            {isParishAdmin && !parishHasCalendar && (
              <View className="mb-4">
                <CalendarSetupCallout onPress={() => setShowCalendarSetup(true)} />
              </View>
            )}

            {weekLoading && weekEvents.length === 0 ? (
              <SkeletonRows rows={3} />
            ) : !parishHasCalendar && daysWithEvents.length === 0 ? (
              <EmptyState
                compact
                icon="calendar-clear-outline"
                title="A quiet week"
                message={
                  !parishHasCalendar
                    ? (isParishAdmin
                        ? "Set up your parish calendar to see events here."
                        : "Your parish hasn't set up their calendar yet.")
                    : "No parish events scheduled this week."
                }
                action={
                  isParishAdmin && !parishHasCalendar ? (
                    <Button label="Set up calendar" icon="link-outline" size="sm" onPress={() => setShowCalendarSetup(true)} />
                  ) : undefined
                }
              />
            ) : (
              <Animated.View key={`agenda-${weekKey}`}>
                {weekDays.map((date, groupIndex) => {
                  const key = localDateKey(date);
                  const events = weekEventsByDay[key] ?? [];
                  const isSelected = date.toDateString() === selectedDate.toDateString();
                  const isToday = date.toDateString() === new Date().toDateString();

                  return (
                    <Animated.View
                      key={key}
                      entering={entrance.card(Math.min(groupIndex, 6) * 60)}
                      style={{ marginBottom: 12 }}
                    >
                      <Pressable
                        onPress={() => selectDay(date, date.getMonth() === currentMonth.getMonth())}
                        accessibilityRole="button"
                        accessibilityState={{ selected: isSelected }}
                        className="flex-row items-center mb-2 ml-1"
                      >
                        <View
                          className={`h-1.5 w-1.5 rounded-full mr-2 ${isSelected ? 'bg-red-600' : 'bg-gray-300 dark:bg-gray-600'}`}
                        />
                        <Text
                          className={`font-sans-bold text-[12px] tracking-[1.2px] uppercase ${
                            isSelected ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'
                          }`}
                        >
                          {date.toLocaleDateString('en-US', { weekday: 'long' })}
                        </Text>
                        <Text className="font-sans-medium text-[12px] text-gray-400 dark:text-gray-500 ml-2">
                          {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </Text>
                        {isToday && (
                          <View className="ml-2 rounded-full px-2 py-0.5 bg-red-600/10">
                            <Text className="font-sans-bold text-[10px] text-red-600 dark:text-red-400">TODAY</Text>
                          </View>
                        )}
                      </Pressable>
                      {events.length === 0 ? (
                        <View className="rounded-2xl px-4 py-3 border border-dashed border-gray-200 dark:border-white/10">
                          <Text className="font-sans text-[13px] text-gray-400 dark:text-gray-500">
                            No parish events
                          </Text>
                        </View>
                      ) : (
                      <View className="-ml-1">
                        {events.map((event, i) => (
                          <TimelineItem
                            key={`${key}-${event.id}`}
                            kind="parish"
                            title={event.title}
                            time={event.startTime.includes('T') ? formatEventTimeRange(event.startTime, event.endTime) : undefined}
                            meta={event.location}
                            isLast={i === events.length - 1}
                            right={renderReminderBell(event)}
                            onPress={() => openEvent(event)}
                          />
                        ))}
                      </View>
                      )}
                    </Animated.View>
                  );
                })}
              </Animated.View>
            )}
          </Animated.View>
        )}

        {/* Selected day */}
        <Animated.View key={selectedDate.toDateString()} entering={FadeIn.duration(280)}>
          <View className="px-6 mt-8">
            <Text className="font-sans-bold text-[12px] tracking-[1.4px] uppercase text-red-600 dark:text-red-400">
              {selectedDate.toLocaleDateString('en-US', { weekday: 'long' })}
              {isTodaySelected ? ' · Today' : ''}
            </Text>
            <Text className="font-display text-[34px] leading-[38px] text-gray-900 dark:text-white mt-1">
              {formatDate(selectedDate)}
            </Text>
            {loading && !calendarData ? null : (
              <>
                {!!calendarData?.title && (
                  <Text className="font-display-italic text-[19px] leading-[25px] text-gray-600 dark:text-gray-300 mt-1">
                    {calendarData.title}
                  </Text>
                )}
                <FastingBadge fasting={calendarData?.fasting} className="mt-4" />
              </>
            )}
          </View>

          {/* Feast days & commemorations */}
          {calendarData?.saintsFull && calendarData.saintsFull.length > 0 && (
            <View className="px-5 mt-8">
              <SectionHeader title="Commemorations" caption={`${calendarData.saintsFull.length} remembered today`} />
              <View className="rounded-3xl bg-white dark:bg-white/[0.04] border border-gray-100 dark:border-white/[0.06] overflow-hidden">
                {calendarData.saintsFull.map((item, index) => {
                  const hasStory = !!item.story && item.story.length > 0;
                  const isFeast = item.kind === 'feast';
                  const icon = isFeast ? 'star' : 'sparkles';
                  const iconColor = isFeast ? palette.accent : palette.amber;
                  const iconTint = isFeast ? palette.accentMuted : 'rgba(245, 158, 11, 0.12)';
                  const actionLabel = isFeast ? 'Read about the feast' : 'Read the life';
                  return (
                    <Pressable
                      key={`${item.kind}-${item.title}-${index}`}
                      disabled={!hasStory}
                      onPress={() => {
                        if (hasStory) {
                          setSelectedSaint(item);
                          setModalVisible(true);
                        }
                      }}
                      accessibilityRole={hasStory ? 'button' : 'text'}
                      accessibilityLabel={hasStory ? `${item.title}. ${actionLabel}` : item.title}
                      className={`flex-row items-center px-4 py-3.5 active:bg-gray-50 dark:active:bg-white/5 ${
                        index > 0 ? 'border-t border-gray-100 dark:border-white/[0.06]' : ''
                      }`}
                    >
                      <View
                        className="h-9 w-9 rounded-full items-center justify-center mr-3"
                        style={{ backgroundColor: iconTint }}
                      >
                        <Ionicons name={icon} size={15} color={iconColor} />
                      </View>
                      <View className="flex-1">
                        <Text className="font-serif text-[18px] leading-[23px] text-gray-900 dark:text-white">{item.title}</Text>
                        {hasStory && (
                          <Text className="font-sans-medium text-xs text-gray-500 dark:text-gray-400 mt-0.5">{actionLabel}</Text>
                        )}
                      </View>
                      {hasStory && <Ionicons name="chevron-forward" size={16} color={colors.textFaint} />}
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {/* Parish schedule (the week agenda covers this in week view) */}
          {viewMode === 'month' && (
          <View className="px-5 mt-8">
            <SectionHeader
              title="Parish schedule"
              actionLabel="Reminders"
              actionIcon={preferences.enabled ? "notifications" : "notifications-off"}
              actionIconColor={preferences.enabled ? palette.green : palette.gray400}
              onAction={() => router.push('/(tabs)/calendar/notification-settings')}
            />

            {isParishAdmin && !parishHasCalendar && (
              <View className="mb-4">
                <CalendarSetupCallout onPress={() => setShowCalendarSetup(true)} />
              </View>
            )}

            {loading ? (
              <SkeletonRows rows={2} />
            ) : error ? (
              <EmptyState compact icon="cloud-offline-outline" title="Couldn't load events" message={error} />
            ) : parishEvents && parishEvents.length > 0 ? (
              <View className="-ml-1">
                {parishEvents.map((event, i) => (
                  <TimelineItem
                    key={event.id}
                    kind="parish"
                    title={event.title}
                    time={formatEventTimeRange(event.startTime, event.endTime)}
                    meta={event.location}
                    isLast={i === parishEvents.length - 1}
                    right={renderReminderBell(event)}
                    onPress={() => openEvent(event)}
                  />
                ))}
              </View>
            ) : (
              <EmptyState
                compact
                icon="calendar-clear-outline"
                title="Nothing on the parish calendar"
                message={
                  !parishHasCalendar
                    ? (isParishAdmin
                        ? "Set up your parish calendar to see events here."
                        : "Your administrator hasn't set up the parish calendar yet.")
                    : "No events scheduled for this day."
                }
                action={
                  isParishAdmin && !parishHasCalendar ? (
                    <Button label="Set up calendar" icon="link-outline" size="sm" onPress={() => setShowCalendarSetup(true)} />
                  ) : undefined
                }
              />
            )}
          </View>
          )}

          {/* Personal schedule */}
          <View className="px-5 mt-8">
            <SectionHeader
              title="Your schedule"
              actionLabel="Schedule"
              actionIcon="add"
              actionIconColor={palette.accentSoft}
              onAction={() => router.push('/(tabs)/events')}
            />
            {personalSchedule.length > 0 ? (
              <View className="-ml-1">
                {personalSchedule.map((event, i) => (
                  <TimelineItem
                    key={event.id}
                    kind={personalKind(event)}
                    title={event.title}
                    time={event.timeDisplay}
                    meta={event.location}
                    isLast={i === personalSchedule.length - 1}
                    onPress={() => openPersonalItem(event)}
                  />
                ))}
              </View>
            ) : (
              <EmptyState
                compact
                icon="person-outline"
                title="Nothing planned"
                message="No personal events scheduled for this day. Book confession or RSVP to parish events from the Events tab."
              />
            )}
          </View>

          {/* Daily readings */}
          <View className="mt-8">
            <View className="px-5">
              <SectionHeader title="Readings" caption="Appointed for this day" />
            </View>
            <ReadingsCarousel
              readings={calendarData?.readingsFull}
              readingsLink={calendarData?.readingsLink}
              loading={loading}
              error={error}
              onSelect={(reading) => {
                setSelectedReading(reading);
                setReadingModalVisible(true);
              }}
            />
          </View>
        </Animated.View>
      </Animated.ScrollView>

      <ReadingSheet
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        eyebrow={selectedSaint?.kind === 'feast' ? 'Feast day' : 'Synaxarion'}
        title={selectedSaint?.title}
        body={selectedSaint?.story}
      />

      <ReadingSheet
        visible={readingModalVisible}
        onClose={() => setReadingModalVisible(false)}
        eyebrow="Scripture"
        title={selectedReading?.display}
        subtitle="King James Version"
        body={selectedReading?.passage}
      />

      <EventDetailSheet
        visible={eventSheetVisible}
        onClose={() => setEventSheetVisible(false)}
        eyebrow={
          activePersonal
            ? eventKindStyle[personalKind(activePersonal)].label
            : parishName || 'Parish event'
        }
        title={activePersonal?.title ?? activeEvent?.title}
        when={
          activePersonal
            ? activePersonal.timeDisplay
            : activeEvent
              ? activeEvent.startTime.includes('T')
                ? formatEventTimeRange(activeEvent.startTime, activeEvent.endTime)
                : 'All day'
              : undefined
        }
        whenDetail={
          activePersonal
            ? selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
            : activeEvent
              ? (activeEvent.startTime.includes('T') ? new Date(activeEvent.startTime) : parseDateOnly(activeEvent.startTime))
                  .toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
              : undefined
        }
        location={activePersonal?.location ?? activeEvent?.location}
        link={activePersonal?.link}
        description={activePersonal ? undefined : activeEvent?.description}
        notes={activePersonal?.notes}
        reminder={
          !activePersonal && activeEvent?.startTime.includes('T')
            ? {
                isTimed: activeEvent.startTime.includes('T'),
                isUpcoming: activeEvent.startTime.includes('T') && new Date(activeEvent.startTime) > new Date(),
                isOn: !!eventNotificationStates[activeEvent.id],
                loading: togglingEvent === activeEvent.id,
                onToggle: () => handleNotificationToggle(activeEvent.id),
                onOpenSettings: () => {
                  setEventSheetVisible(false);
                  setTimeout(() => router.push('/(tabs)/calendar/notification-settings'), 320);
                },
              }
            : undefined
        }
        chantSignup={
          showChantSignup
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
          activePersonal
            ? {
                label: 'Open in Events',
                icon: 'arrow-forward',
                onPress: () => {
                  setEventSheetVisible(false);
                  setTimeout(() => router.push('/(tabs)/events'), 320);
                },
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
