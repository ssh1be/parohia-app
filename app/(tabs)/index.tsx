import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { ActivityIndicator, Linking, Modal, Pressable, RefreshControl, ScrollView, Text, TouchableOpacity, View } from "react-native";
import ParishCalendarSetup from '../../components/ParishCalendarSetup';
import { useAuth } from "../../contexts/AuthContext";
import { useOrthodoxCalendar } from "../../hooks/useOrthodoxCalendar";
import { BulletinEvent, BulletinService } from '../../services/bulletinService';
import { ConfessionReservationWithSchedule, ConfessionService } from '../../services/confessionService';
import { getUserProfile } from '../../services/onboardingService';
import { getParishByAdminId, getParishByUserId } from '../../services/parishService';

export default function Index() {
  const { user, loading: authLoading } = useAuth();
  const { 
    calendarData, 
    greeting, 
    todayDate, 
    loading, 
    error,
    parishEvents,
    refreshData
  } = useOrthodoxCalendar(user?.id);
  
  // State for modal
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedReading, setSelectedReading] = useState<{ display: string; passage: string } | null>(null);
  const [profileName, setProfileName] = useState<string | null>(null);
  const [showCalendarSetup, setShowCalendarSetup] = useState(false);
  const [isParishAdmin, setIsParishAdmin] = useState(false);
  const [parishHasCalendar, setParishHasCalendar] = useState(true);
  const [parishName, setParishName] = useState<string>('');
  const [personalConfessions, setPersonalConfessions] = useState<ConfessionReservationWithSchedule[]>([]);
  const [confessionDetails, setConfessionDetails] = useState<Record<string, any>>({});
  const [parishDetails, setParishDetails] = useState<any>(null);
  const [personalEvents, setPersonalEvents] = useState<BulletinEvent[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProfile = async () => {
    if (user) {
      const profile = await getUserProfile(user.id);
      if (profile && profile.full_name) {
        setProfileName(profile.full_name.split(' ')[0]);
      } else {
        setProfileName(null);
      }

      // Check if user is parish admin and if parish has calendar set up
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

  useEffect(() => {
    const initializeData = async () => {
      await fetchProfile();
      // Fetch personal confessions after profile is loaded
      await fetchPersonalConfessions();
    };
    initializeData();
  }, [user]);



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

  // Show auth loading state
  if (authLoading) {
    return (
      <View className="flex-1 bg-black justify-center items-center">
        <ActivityIndicator size="large" color="white" />
        <Text className="text-white mt-4">Authenticating...</Text>
      </View>
    );
  }

  // Show user state debug info in development
  if (__DEV__ && !user) {
    return (
      <View className="flex-1 bg-black justify-center items-center p-6">
        <Text className="text-red-400 text-lg font-bold mb-4">DEBUG: No User Found</Text>
        <Text className="text-white text-center">
          The user is null, which means authentication failed or user is not logged in.
        </Text>
        <Text className="text-gray-400 text-sm text-center mt-4">
          This debug screen only shows in development builds.
        </Text>
      </View>
    );
  }

  // In production, if no user, show a generic error
  if (!user) {
    return (
      <View className="flex-1 bg-black justify-center items-center p-6">
        <Text className="text-white text-lg font-bold mb-4">Please log in</Text>
        <Text className="text-gray-400 text-center">
          You need to be logged in to view this content.
        </Text>
      </View>
    );
  }

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
        
        <View className="p-6 bg-gradient-to-b from-gray-900 to-gray-800 border-b border-gray-800">
          {/* Header */}
          <View className="flex-row justify-between items-center pt-4">
            <View>
              <Text className="text-3xl font-bold text-white">Home</Text>
              <Text className="text-sm text-white opacity-70">
                {greeting}, <Text className="font-semibold">{profileName ? profileName + '!' : 'User!'}</Text>
              </Text>
            </View>
            <View className="h-10 w-10 rounded-full bg-transparent flex items-center justify-center">
              <Ionicons name="home" size={25} color="white" />
            </View>
          </View>
          
          {/* Today's Card */}
          <View className="mt-6 rounded-xl shadow-md p-4 bg-gray-800/50">
            {loading ? (
              <View className="flex-row items-center justify-center py-4">
                <ActivityIndicator color="white" size="small" />
                <Text className="text-white text-sm ml-2">Loading calendar data...</Text>
              </View>
            ) : error ? (
              <View className="py-4">
                <Text className="text-red-400 text-sm">Error loading calendar data</Text>
                <Text className="text-white text-xs opacity-70 mt-1">{error}</Text>
              </View>
            ) : (
              <View>
                <View className="flex-row justify-between items-center">
                  <View>
                    <Text className="text-white text-xs">TODAY</Text>
                    <Text className="text-white text-lg font-bold">{todayDate}</Text>
                    {calendarData?.title && (
                      <Text className="text-white text-md font-light mt-1">{calendarData.title}</Text>
                    )}
                  </View>
                </View>
                <View className="mt-1">
                  <Text className="text-white text-sm">{calendarData?.fasting || ''}</Text>
                  {calendarData?.saintsFeasts && (
                    <Text className="text-white text-sm font-semibold mt-1">
                      {calendarData.saintsFeasts}
                    </Text>
                  )}
                </View>
              </View>
            )}
          </View>
        </View>
        
        {/* Today's Schedule */}
        <View className="bg-gradient-to-b from-gray-800 to-gray-900 p-6">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-white text-lg font-bold">Today's Schedule</Text>
            <TouchableOpacity className=" bg-red-600 text-xs rounded-lg px-2 py-1 flex-row items-center">
              <Text className="text-xs text-white">{parishName || 'Loading...'}</Text>
              {/* <Ionicons name="chevron-down" size={10} color="white" className="ml-1" /> */}
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

          {/* Schedule Cards */}
          <View className="space-y-4">
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
            ) : (
              (() => {
                // Combine and sort all events chronologically
                const allEvents: Array<{
                  id: string;
                  title: string;
                  timeRange: string;
                  description?: string;
                  type: 'confession' | 'parish' | 'personal';
                  notes?: string;
                  isAllDay: boolean;
                  eventType?: 'event' | 'volunteer' | 'announcement';
                  location?: string;
                }> = [];

                // Add personal confessions
                personalConfessions.forEach((confession) => {
                  const details = confessionDetails[confession.id];
                  const timeRange = formatConfessionTimeRange(confession.confession_schedules?.time_slot);
                  
                  // For regular users, show "Confession with priest_name"
                  // For parish admins, show "Confession with user_name"
                  let title = "Confession";
                  if (isParishAdmin && details?.user_profiles?.full_name) {
                    title = `Confession with ${details.user_profiles.full_name}`;
                  } else if (!isParishAdmin && parishDetails?.priest_name) {
                    title = `Confession with ${parishDetails.priest_name}`;
                  }

                  if (__DEV__) {
                    console.log('Adding confession to display:', { title, timeRange, isParishAdmin });
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

                // Add personal events from bulletin board
                personalEvents.forEach((event) => {
                  const timeDisplay = event.event_time ? formatBulletinEventTime(event.event_time) : '';
                  const locationDisplay = event.location ? ` • ${event.location}` : '';
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
                  
                  const timeRange = isAllDay ? `${dateDisplay}${locationDisplay}` : `Starts at ${timeDisplay}${locationDisplay}`;

                  allEvents.push({
                    id: event.id,
                    title: event.title,
                    timeRange,
                    type: 'personal',
                    notes: event.user_response?.notes || undefined,
                    isAllDay: !!isAllDay,
                    eventType: event.event_type // Add event type for icon selection
                  });
                });

                // Add parish events
                parishEvents.forEach((event) => {
                  allEvents.push({
                    id: event.id,
                    title: event.title,
                    timeRange: formatEventTimeRange(event.startTime, event.endTime),
                    description: event.description,
                    type: 'parish',
                    isAllDay: false,
                    location: event.location
                  });
                });

                // Sort events: all-day events first, then by time
                allEvents.sort((a, b) => {
                  // All-day events come first
                  if (a.isAllDay && !b.isAllDay) return -1;
                  if (!a.isAllDay && b.isAllDay) return 1;
                  
                  // If both are all-day or both have times, sort by time
                  if (a.isAllDay && b.isAllDay) {
                    // For all-day events, sort by date
                    const parseLocalDate = (dateString: string) => {
                      const match = dateString.match(/(\w+)\s+(\d+),\s+(\d+)/);
                      if (match) {
                        const [_, month, day, year] = match;
                        const monthIndex = new Date(`${month} 1, 2000`).getMonth();
                        return new Date(parseInt(year), monthIndex, parseInt(day));
                      }
                      return new Date(0);
                    };
                    const dateA = parseLocalDate(a.timeRange);
                    const dateB = parseLocalDate(b.timeRange);
                    return dateA.getTime() - dateB.getTime();
                  }
                  
                  // For timed events, sort by time
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

                if (allEvents.length > 0) {
                  return allEvents.map((event) => (
                    <View 
                      key={event.id} 
                      className={`rounded-xl shadow-sm p-4 mb-2 ${
                        event.type === 'confession' 
                          ? 'bg-red-900/20 border border-red-500/30' 
                          : event.type === 'personal' && event.eventType === 'volunteer'
                          ? 'bg-green-900/20 border border-green-500/30'
                          : event.type === 'personal'
                          ? 'bg-purple-900/20 border border-purple-500/30'
                          : 'bg-gray-800/50'
                      }`}
                    >
                      <View className="flex-row justify-between items-start">
                        <View className="flex-1">
                          <Text className="text-sm text-white font-semibold pr-1">{event.title}</Text>
                          <Text className="text-xs text-white opacity-70 mt-1">
                            {event.timeRange}
                          </Text>
                          {event.location && (
                            <Text className="text-xs text-white opacity-80 mt-1">
                              {event.location}
                            </Text>
                          )}
                        </View>
                        <View className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                          event.type === 'confession' 
                            ? 'bg-red-600/20' 
                            : event.type === 'personal' && event.eventType === 'volunteer'
                            ? 'bg-green-600/20'
                            : event.type === 'personal'
                            ? 'bg-purple-600/20'
                            : 'bg-gray-700'
                        }`}>
                          <Ionicons 
                            name={
                              event.type === 'confession' ? 'person' : 
                              event.type === 'personal' ? (event.eventType === 'volunteer' ? 'hand-right' : 'people') : 
                              'calendar'
                            } 
                            size={16} 
                            color={
                              event.type === 'confession' ? '#EF4444' : 
                              event.type === 'personal' && event.eventType === 'volunteer' ? '#10B981' : 
                              event.type === 'personal' ? '#A855F7' : 
                              'white'
                            } 
                          />
                        </View>
                      </View>
                    </View>
                  ));
                } else {
                  return (
                    <Text className="text-xs text-white opacity-70">
                      {!parishHasCalendar 
                        ? (isParishAdmin 
                            ? "Set up your parish calendar to see events here." 
                            : "Your administrator hasn't set up the parish calendar yet.")
                        : "No events scheduled for today."}
                    </Text>
                  );
                }
              })()
            )}
          </View>
        </View>
        
        {/* Daily Scripture Readings */}
        <View className="bg-gradient-to-b from-gray-900 to-black p-4 pb-8">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-white text-lg font-bold ml-2">Daily Readings</Text>
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
                        setModalVisible(true);
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
                <Text className="text-xl text-white font-bold mb-6 text-center">{selectedReading?.display + " (KJV)"}</Text>
                <ScrollView className="max-h-96 mb-4">
                  <Text className="text-white text-base leading-relaxed italic">"{selectedReading?.passage}"</Text>
                </ScrollView>
              </View>
            </View>
          </Modal>
        </View>
        
        {/* Remove Sign Out Button from here */}
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
      return `${startStr} – ${endStr}`;
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

// Helper function to convert time strings to minutes since midnight
function convertTimeToMinutes(timeString: string): number {
  if (!timeString) return 0;
  
  // Handle different time formats
  const timeMatch = timeString.match(/(\d{1,2}):(\d{2})/);
  if (timeMatch) {
    const hours = parseInt(timeMatch[1], 10);
    const minutes = parseInt(timeMatch[2], 10);
    return hours * 60 + minutes;
  }
  
  return 0;
}
