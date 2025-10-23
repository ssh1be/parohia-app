import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Linking, Modal, Pressable, RefreshControl, ScrollView, Text, TouchableOpacity, View } from "react-native";
import ParishCalendarSetup from "../../../components/ParishCalendarSetup";
import { useAuth } from "../../../contexts/AuthContext";
import { useNotifications } from "../../../contexts/NotificationContext";
import { BulletinEvent, BulletinService } from "../../../services/bulletinService";
import { fetchOrthodoxCalendarData, fetchParishEventsForToday, OrthodoxCalendarData, ParishEvent } from "../../../services/calendarService";
import { ConfessionReservationWithSchedule, ConfessionService } from "../../../services/confessionService";
import { getUserProfile } from "../../../services/onboardingService";
import { getParishByAdminId, getParishByUserId } from "../../../services/parishService";

export default function Calendar() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarData, setCalendarData] = useState<OrthodoxCalendarData | null>(null);
  const [parishEvents, setParishEvents] = useState<ParishEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSaint, setSelectedSaint] = useState<{ title: string; story: string } | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedReading, setSelectedReading] = useState<{ display: string; passage: string } | null>(null);
  const [readingModalVisible, setReadingModalVisible] = useState(false);
  const [showCalendarSetup, setShowCalendarSetup] = useState(false);
  const [isParishAdmin, setIsParishAdmin] = useState(false);
  const [parishHasCalendar, setParishHasCalendar] = useState(true);
  const [parishName, setParishName] = useState<string>('');
  const [eventNotificationStates, setEventNotificationStates] = useState<Record<string, boolean>>({});
  const [togglingEvent, setTogglingEvent] = useState<string | null>(null);
  const [personalConfessions, setPersonalConfessions] = useState<ConfessionReservationWithSchedule[]>([]);
  const [confessionDetails, setConfessionDetails] = useState<Record<string, any>>({});
  const [parishDetails, setParishDetails] = useState<any>(null);
  const [personalEvents, setPersonalEvents] = useState<BulletinEvent[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [fastingData, setFastingData] = useState<Record<string, string>>({});

  const { signOut, user } = useAuth();
  const { preferences, setParishEventNotificationEnabled, isParishEventNotificationEnabled } = useNotifications();

  // Fetch fasting data for multiple days
  const fetchFastingDataForDays = async (days: Date[]) => {
    try {
      const fastingPromises = days.map(async (date) => {
        const data = await fetchOrthodoxCalendarData(date);
        return {
          dateKey: date.toISOString().split('T')[0],
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

  // Helper function to get fasting emoji
  const getFastingEmoji = (fastingText: string): string => {
    if (!fastingText || fastingText.includes('No Fast')) {
      return '';
    }
    if (fastingText.includes('Fish')) {
      return '🐟';
    }
    if (fastingText.includes('Wine')) {
      return '🍷';
    }
    if (fastingText.includes('Fast')) {
      return '🌱';
    }
    return '';
  };

  // Fetch data for selected date
  const fetchDataForDate = async (date: Date) => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch calendar data and parish events
      const [calendar, parish] = await Promise.all([
        fetchOrthodoxCalendarData(date),
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
      if (profile?.user_type === 'parish_admin') {
        setIsParishAdmin(true);
        const parish = await getParishByAdminId(user.id);
        if (parish) {
          setParishHasCalendar(!!parish.parish_calendar_id);
          setParishName(parish.name);
        }
      } else if (profile?.user_type === 'regular_user') {
        const parish = await getParishByUserId(user.id);
        if (parish) {
          setParishHasCalendar(!!parish.parish_calendar_id);
          setParishName(parish.name);
        }
      }
    }
  };

  // Check user type and parish calendar status
  useEffect(() => {
    checkUserAndParish();
  }, [user]);

  // Load notification states for events
  const loadEventNotificationStates = async (events: ParishEvent[]) => {
    const states: Record<string, boolean> = {};
    for (const event of events) {
      // Parish events are OFF by default; check explicit enable list
      const isEnabled = await isParishEventNotificationEnabled(event.id);
      states[event.id] = !!isEnabled;
    }
    setEventNotificationStates(states);
  };

  // Handle notification toggle for an event
  const handleNotificationToggle = async (eventId: string) => {
    try {
      setTogglingEvent(eventId);
      const currentState = eventNotificationStates[eventId];
      const newEnabledState = !currentState; // toggle
      await setParishEventNotificationEnabled(eventId, newEnabledState);
      setEventNotificationStates(prev => ({ ...prev, [eventId]: newEnabledState }));
    } catch (error) {
      console.error('Error toggling notification for event:', error);
    } finally {
      setTogglingEvent(null);
    }
  };

  // Fetch data when selected date changes
  useEffect(() => {
    fetchDataForDate(selectedDate);
  }, [selectedDate, user]);

  // Scheduling is handled globally via refreshNotifications() on init and settings changes



  const handleCalendarSetupSuccess = () => {
    setParishHasCalendar(true);
    fetchDataForDate(selectedDate);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await checkUserAndParish(); // Refresh parish information
      await fetchDataForDate(selectedDate);
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
    const lastDay = new Date(year, month + 1, 0);
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

  // Fetch fasting data when calendar days change
  useEffect(() => {
    const dates = calendarDays.map(day => day.date);
    fetchFastingDataForDays(dates);
  }, [currentMonth]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
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
    setCurrentMonth(newMonth);
  };

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Helper function for formatting event time range (same as in index.tsx)
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
        return `${startStr} – ${endStr}`;
      }
      return startStr;
    }
  };

  const formatConfessionTime = (timeSlot: string) => {
    // Convert database time format (HH:MM:SS) to display format
    const [hours, minutes] = timeSlot.split(':').slice(0, 2);
    const hour = parseInt(hours);
    const displayHour = hour > 12 ? hour - 12 : hour;
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const minuteStr = minutes === '00' ? '00' : minutes;
    return `${displayHour}:${minuteStr} ${ampm}`;
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

  return (
    <View className="flex-1 bg-black pt-0">
      <ScrollView 
        className="flex-1"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="white"
            colors={["white"]}
          />
        }
      >
        {/* Header */}
        <View className="p-6">
          <View className="flex-row justify-between items-center pt-4">
            <View>
              <Text className="text-3xl font-bold text-white">Calendar</Text>
              <TouchableOpacity className="rounded-lg flex-row items-center">
                <Text className="text-sm text-white opacity-70">{parishName || 'Loading...'}</Text>
                {/* <Ionicons name="chevron-down" size={10} color="white" className="ml-1 opacity-70" /> */}
              </TouchableOpacity>
            </View>
            <View className="h-10 w-10 rounded-full bg-transparent flex items-center justify-center">
              <Ionicons name="calendar" size={25} color="white" />
            </View>
          </View>
          
          {/* Month Navigation */}
          <View className="flex-row justify-between items-center mt-6">
            <TouchableOpacity 
              className="h-8 w-8 rounded-full bg-transparent flex items-center justify-center"
              onPress={() => navigateMonth('prev')}
            >
              <Ionicons name="chevron-back" size={16} color="white" />
            </TouchableOpacity>
            <Text className="text-white text-base font-semibold">{formatMonthYear(currentMonth)}</Text>
            <TouchableOpacity 
              className="h-8 w-8 rounded-full bg-transparent flex items-center justify-center"
              onPress={() => navigateMonth('next')}
            >
              <Ionicons name="chevron-forward" size={16} color="white" />
            </TouchableOpacity>
          </View>
          
          {/* Days of Week */}
          <View className="flex-row mt-4">
            {daysOfWeek.map((day) => (
              <View key={day} className="flex-1 items-center">
                <Text className="text-white text-xs font-medium">{day}</Text>
              </View>
            ))}
          </View>
          
          {/* Calendar Grid */}
          <View className="mt-2">
            <View className="flex-row flex-wrap">
              {calendarDays.map((day, index) => {
                const dateKey = day.date.toISOString().split('T')[0];
                const fastingEmoji = getFastingEmoji(fastingData[dateKey] || '');
                
                return (
                  <TouchableOpacity
                    key={index}
                    className={`w-[14.28%] h-10 aspect-square items-center justify-center ${
                      day.isSelected ? 'bg-red-600 rounded-3xl' : ''
                    }`}
                    onPress={() => setSelectedDate(day.date)}
                  >
                    <View className="relative w-full h-full items-center justify-center">
                      <Text 
                        className={`text-xs ${
                          day.isSelected 
                            ? 'text-white font-bold' 
                            : day.isCurrentMonth 
                              ? 'text-white' 
                              : 'text-white opacity-30'
                        }`}
                      >
                        {day.date.getDate()}
                      </Text>
                      {day.isToday && !day.isSelected && (
                        <View className={`absolute h-1 w-1 bg-green-500 rounded-full ${
                          day.date.getDate() < 10 ? 'right-2' : 'right-3'
                        } top-15`} />
                      )}
                      {fastingEmoji && day.isCurrentMonth && (
                        <Text className="absolute text-xs bottom-1 left-0 right-0 text-center">
                          {fastingEmoji}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
        
        {/* Selected Day Details */}
        <View className="p-6 pb-8 bg-gradient-to-b from-gray-800 to-gray-900">
          <View className="flex-row justify-between items-start mb-8">
            <Text className="text-white text-lg font-bold flex-shrink-0">{formatDate(selectedDate)}</Text>
            {calendarData?.fasting && (
              <View className="flex-row items-center pt-1" style={{ maxWidth: '40%' }}>
                {!calendarData.fasting.startsWith('No') && (
                  <View className="h-2 w-2 rounded-full bg-red-500 mr-1 flex-shrink-0"></View>
                )}
                <Text className="text-xs text-white leading-4 text-right">{calendarData.fasting}</Text>
              </View>
            )}
          </View>
          
          {/* Feast Days & Commemorations */}
          {calendarData?.saintsFull && calendarData.saintsFull.length > 0 && (
            <View className="mb-6">
                <Text className="text-white text-sm font-semibold mb-4">Feast Days & Commemorations</Text>
                <View className="space-y-2">
                    {calendarData.saintsFull.map((saint, index) => (
                        <TouchableOpacity 
                            key={index} 
                            className="bg-gray-800/50 rounded-xl shadow-md p-3 mb-2" 
                            onPress={() => {
                                if (saint.story && saint.story.length > 0) {
                                    setSelectedSaint(saint);
                                    setModalVisible(true);
                                }
                            }}
                            disabled={!saint.story || saint.story.length === 0}
                        >
                            <View className="flex-row justify-between items-start">
                                <View className="flex-1">
                                    <Text className="text-sm text-white font-semibold">{saint.title}</Text>
                                </View>
                                <View className="h-8 w-8 rounded-lg bg-gray-700 flex items-center justify-center ml-3">
                                    <Ionicons name="star" size={16} color="white" />
                                </View>
                            </View>
                            {saint.story && saint.story.length > 0 && (
                                <Text className="text-xs text-white opacity-70 mt-1">{"tap to learn more..."}</Text>
                            )}
                        </TouchableOpacity>
                    ))}
                </View>
                <Modal
                    visible={modalVisible}
                    animationType="fade"
                    transparent={true}
                    onRequestClose={() => setModalVisible(false)}
                >
                    <View className="flex-1 justify-center items-center bg-black/80 px-4">
                        <Pressable
                            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                            onPress={() => setModalVisible(false)}
                            pointerEvents="auto"
                        />
                        <View
                            className="bg-black/80 rounded-2xl p-6 w-full max-w-xl shadow-lg border border-gray-700"
                        // Prevent background press from closing modal when interacting with card
                        >
                            <Text className="text-xl text-white font-bold mb-6 text-center">{selectedSaint?.title}</Text>
                            <ScrollView className="max-h-96 mb-4">
                                <Text className="text-white text-md leading-relaxed">{selectedSaint?.story}</Text>
                            </ScrollView>
                        </View>
                    </View>
                </Modal>
            </View>
          )}
          
          {/* Parish Schedule */}
          <View>
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-white text-sm font-semibold">Parish Schedule</Text>
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/calendar/notification-settings')}
                className="flex-row items-center rounded-lg px-3 py-1"
              >
                <Ionicons 
                  name={preferences.enabled ? "notifications" : "notifications-off"} 
                  size={16} 
                  color={preferences.enabled ? "#10B981" : "#9CA3AF"} 
                />
                <Text className="text-white opacity-80 font-medium text-xs ml-1">Notifications</Text>
              </TouchableOpacity>
            </View>
            
            {/* Calendar Setup Prompt for Parish Admins */}
            {isParishAdmin && !parishHasCalendar && (
              <View className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-4 mb-4">
                <View className="flex-row items-start">
                  <Ionicons name="calendar-outline" size={20} color="#3B82F6" className="mt-0.5" />
                  <View className="flex-1 ml-3">
                    <Text className="text-blue-400 font-semibold text-sm">Set Up Parish Calendar</Text>
                    <Text className="text-blue-300 text-xs mt-1">
                      Connect your Google Calendar to display parish events in the app.
                    </Text>
                    <TouchableOpacity
                      className="bg-blue-600 rounded-lg px-4 py-2 mt-3 self-start"
                      onPress={() => setShowCalendarSetup(true)}
                    >
                      <Text className="text-white text-xs font-medium">Set Up Calendar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}

            {loading ? (
              <View className="flex-row items-center justify-center py-4">
                <ActivityIndicator color="white" size="small" />
                <Text className="text-white text-sm ml-2">Loading events...</Text>
              </View>
            ) : error ? (
              <View className="py-4">
                <Text className="text-red-400 text-sm">Error loading events</Text>
                <Text className="text-white text-xs opacity-70 mt-1">{error}</Text>
              </View>
            ) : parishEvents && parishEvents.length > 0 ? (
              <View className="space-y-3">
                {parishEvents.map((event) => {
                  const isNotificationEnabled = eventNotificationStates[event.id];
                  const isUpcoming = new Date(event.startTime) > new Date() && event.startTime.includes('T');
                  
                  return (
                    <View key={event.id} className="bg-gray-800/50 rounded-xl shadow-sm p-3 mb-2">
                      <View className="flex-row justify-between items-start">
                        <View className="flex-1">
                          <Text className="text-sm text-white font-semibold">{event.title}</Text>
                          <Text className="text-xs text-white opacity-70 mt-1">
                            {formatEventTimeRange(event.startTime, event.endTime)}
                          </Text>
                          {/* {event.description && (
                            <Text className="text-xs text-white mt-2">{event.description}</Text>
                          )} */}
                          {event.location && (
                            <Text className="text-xs text-white opacity-80 mt-1">
                              {event.location}
                            </Text>
                          )}
                        </View>
                        {isUpcoming && preferences.enabled && (
                          <TouchableOpacity
                            onPress={() => handleNotificationToggle(event.id)}
                            disabled={togglingEvent === event.id}
                            className="ml-3 p-2 rounded-lg bg-gray-700/50"
                          >
                            {togglingEvent === event.id ? (
                              <ActivityIndicator size="small" color="white" />
                            ) : (
                              <Ionicons 
                                name={isNotificationEnabled ? "notifications" : "notifications-off"} 
                                size={16} 
                                color={isNotificationEnabled ? "#10B981" : "#9CA3AF"} 
                              />
                            )}
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : (
              <Text className="text-xs text-white opacity-70">
                {!parishHasCalendar 
                  ? (isParishAdmin 
                      ? "Set up your parish calendar to see events here." 
                      : "Your administrator hasn't set up the parish calendar yet.")
                  : "No events scheduled for this day."}
              </Text>
            )}
          </View>
        </View>
        {/* Personal Schedule */}
        <View className="p-6 bg-gradient-to-b from-gray-800 to-gray-900 pb-4">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-white text-sm font-semibold">Personal Schedule</Text>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/events')}
              className="flex-row items-center rounded-lg px-3 py-1"
            >
              <Ionicons name="add-circle" size={16} color="#EF4444" />
              <Text className="text-white opacity-80 font-medium text-xs ml-1">Schedule</Text>
            </TouchableOpacity>
          </View>
          
          {(personalConfessions && personalConfessions.length > 0) || (personalEvents && personalEvents.length > 0) ? (
            <View className="space-y-3">
              {(() => {
                // Combine and sort all personal events chronologically
                const allEvents: Array<{
                  id: string;
                  type: 'confession' | 'event';
                  title: string;
                  timeDisplay: string;
                  isAllDay: boolean;
                  notes?: string;
                  icon: string;
                  iconColor: string;
                  bgColor: string;
                  data: any;
                }> = [];

                // Add confessions
                personalConfessions.forEach((confession) => {
                  const details = confessionDetails[confession.id];
                  const timeRange = formatConfessionTimeRange(confession.confession_schedules?.time_slot);
                  
                  let title = "Confession";
                  if (isParishAdmin && details?.user_profiles?.full_name) {
                    title = `Confession with ${details.user_profiles.full_name}`;
                  } else if (!isParishAdmin && parishDetails?.priest_name) {
                    title = `Confession with ${parishDetails.priest_name}`;
                  }
                    allEvents.push({
                     id: confession.id,
                     type: 'confession',
                     title,
                     timeDisplay: timeRange,
                     isAllDay: false,
                     notes: confession.notes || undefined,
                     icon: 'person',
                     iconColor: '#EF4444',
                     bgColor: 'bg-red-600/20',
                     data: confession
                   });
                });

                // Add personal events
                personalEvents.forEach((event) => {
                  const timeDisplay = event.event_time ? formatEventTime(event.event_time) : '';
                  const locationDisplay = event.location ? ` • ${event.location}` : '';
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
                     timeDisplay: isAllDay ? `${dateDisplay}${locationDisplay}` : `Starts at ${timeDisplay}${locationDisplay}`,
                     isAllDay: !!isAllDay,
                     notes: event.user_response?.notes || undefined,
                     icon: event.event_type === 'event' ? 'people' : 'hand-right',
                     iconColor: event.event_type === 'event' ? '#A855F7' : '#10B981',
                     bgColor: event.event_type === 'event' ? 'bg-purple-600/20' : 'bg-green-600/20',
                     data: event
                   });
                });

                // Helper function to convert time strings to minutes since midnight
                const convertTimeToMinutes = (timeString: string): number => {
                  if (!timeString) return 0;
                  
                  // Handle different time formats
                  const timeMatch = timeString.match(/(\d{1,2}):(\d{2})/);
                  if (timeMatch) {
                    const hours = parseInt(timeMatch[1], 10);
                    const minutes = parseInt(timeMatch[2], 10);
                    return hours * 60 + minutes;
                  }
                  
                  return 0;
                };

                // Sort events: all-day events first, then by time
                allEvents.sort((a, b) => {
                  // All-day events come first
                  if (a.isAllDay && !b.isAllDay) return -1;
                  if (!a.isAllDay && b.isAllDay) return 1;
                  
                  // If both are all-day or both have times, sort by time
                  if (a.isAllDay && b.isAllDay) {
                    // For all-day events, sort by date
                    const parseLocalDate = (dateString: string) => {
                      const [year, month, day] = dateString.split('-').map(Number);
                      return new Date(year, month - 1, day);
                    };
                    const dateA = parseLocalDate(a.data.event_date || '1970-01-01');
                    const dateB = parseLocalDate(b.data.event_date || '1970-01-01');
                    return dateA.getTime() - dateB.getTime();
                  }
                  
                  // For timed events, sort by time
                  if (a.type === 'confession' && b.type === 'confession') {
                    // Both are confessions, sort by time slot
                    const timeA = a.data.confession_schedules?.time_slot || '';
                    const timeB = b.data.confession_schedules?.time_slot || '';
                    return timeA.localeCompare(timeB);
                  }
                  
                  if (a.type === 'event' && b.type === 'event') {
                    // Both are events, sort by time
                    const timeA = a.data.event_time || '';
                    const timeB = b.data.event_time || '';
                    return timeA.localeCompare(timeB);
                  }
                  
                  // Mixed types - convert times to comparable format
                  if (a.type === 'confession' && b.type === 'event') {
                    const timeA = a.data.confession_schedules?.time_slot || '';
                    const timeB = b.data.event_time || '';
                    
                    // Convert both times to minutes since midnight for comparison
                    const minutesA = convertTimeToMinutes(timeA);
                    const minutesB = convertTimeToMinutes(timeB);
                    
                    return minutesA - minutesB;
                  }
                  
                  if (a.type === 'event' && b.type === 'confession') {
                    const timeA = a.data.event_time || '';
                    const timeB = b.data.confession_schedules?.time_slot || '';
                    
                    // Convert both times to minutes since midnight for comparison
                    const minutesA = convertTimeToMinutes(timeA);
                    const minutesB = convertTimeToMinutes(timeB);
                    
                    return minutesA - minutesB;
                  }
                  
                  return 0;
                });

                return allEvents.map((event) => (
                  <View key={event.id} className="bg-gray-800/50 rounded-xl shadow-sm p-4 mb-2">
                    <View className="flex-row justify-between items-start">
                      <View className="flex-1">
                        <Text className="text-sm text-white font-semibold">{event.title}</Text>
                        {event.timeDisplay && (
                          <Text className="text-xs text-white opacity-70 mt-1">
                            {event.timeDisplay}
                          </Text>
                        )}
                        {/* {event.notes && (
                          <Text className="text-xs text-white mt-2 opacity-80">
                            "{event.notes}"
                          </Text>
                        )} */}
                      </View>
                      <View className={`h-8 w-8 rounded-lg flex items-center justify-center ${event.bgColor}`}>
                        <Ionicons 
                          name={event.icon as any} 
                          size={16} 
                          color={event.iconColor} 
                        />
                      </View>
                    </View>
                  </View>
                ));
              })()}
            </View>
          ) : (
            <Text className="text-xs text-white opacity-70">
              No personal events scheduled for this day.
            </Text>
          )}
        </View>
        
        {/* Daily Scripture Readings */}
        <View className="bg-gradient-to-b from-gray-900 to-black p-4 pb-8">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-white text-sm font-semibold ml-2">Daily Readings</Text>
          </View>
          <View className="rounded-xl p-2">
            {loading ? (
              <View className="flex-row items-center justify-center py-4">
                <ActivityIndicator color="white" size="small" />
                <Text className="text-white text-sm ml-2">Loading readings...</Text>
              </View>
            ) : error ? (
              <View className="py-4">
                <Text className="text-red-400 text-sm">Error loading readings</Text>
                <Text className="text-white text-xs opacity-70 mt-1">{error}</Text>
              </View>
            ) : (
              <View className="space-y-2">
                {calendarData?.readingsFull && calendarData.readingsFull.length > 0 ? (
                  calendarData.readingsFull.map((reading, idx) => (
                    <TouchableOpacity
                      key={idx}
                      className="bg-gray-800/50 rounded-xl shadow-sm p-4 mb-2"
                      onPress={() => {
                        setSelectedReading(reading);
                        setReadingModalVisible(true);
                      }}
                    >
                      <View className="flex-row justify-between items-start">
                        <View className="flex-1">
                          <Text className="text-sm text-gray-200 font-semibold">{reading.display}</Text>
                          <Text className="text-xs text-white opacity-70">{"tap to read..."}</Text>
                        </View>
                        <View className="h-8 w-8 rounded-lg bg-gray-700 flex items-center justify-center">
                          <Ionicons name="book" size={16} color="white" />
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))
                ) : (
                  <Text className="text-xs text-white opacity-70">No readings for today.</Text>
                )}
                {calendarData?.readingsLink && (
                  <TouchableOpacity onPress={() => Linking.openURL(calendarData.readingsLink!)} className="mt-2">
                    <Text className="text-lg text-blue-400 underline">Full readings</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
          {/* Modal for full reading */}
          <Modal
            visible={readingModalVisible}
            animationType="fade"
            transparent={true}
            onRequestClose={() => setReadingModalVisible(false)}
          >
            <View className="flex-1 justify-center items-center bg-black/80 px-4">
              <Pressable
                style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                onPress={() => setReadingModalVisible(false)}
                pointerEvents="auto"
              />
              <View
                className="bg-black/80 rounded-2xl p-6 w-full max-w-xl shadow-lg border border-gray-700"
                // Prevent background press from closing modal when interacting with card
              >
                <Text className="text-xl text-white font-bold mb-6 text-center">{selectedReading?.display + " (KJV)"}</Text>
                <ScrollView className="max-h-96 mb-4">
                  <Text className="text-white text-base leading-relaxed italic">"{selectedReading?.passage}"</Text>
                </ScrollView>
              </View>
            </View>
          </Modal>
        </View>
      </ScrollView>

      {/* Calendar Setup Modal */}
      <ParishCalendarSetup
        visible={showCalendarSetup}
        onClose={() => setShowCalendarSetup(false)}
        onSuccess={handleCalendarSetupSuccess}
      />
      
    </View>
  );
} 