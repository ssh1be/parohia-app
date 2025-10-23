import { Text, View, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Modal, TextInput, RefreshControl, Switch } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../config/supabase";
import { getUserProfile } from "../../services/onboardingService";
import { getParishByAdminId, getParishByUserId } from "../../services/parishService";
import { ConfessionService, DaySchedule, TimeSlot } from "../../services/confessionService";
import { BulletinService, BulletinEvent, CreateEventData, EventResponse } from "../../services/bulletinService";
import CustomDateTimePicker from "../../components/DateTimePicker";
import { notificationService } from "../../services/notificationService";

type TabType = 'confession' | 'bulletin';

export default function Events() {
  const { user, session } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('bulletin');
  const [loading, setLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());
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

  const loadBulletinEvents = async () => {
    if (!parishId) return;
    
    try {
      setLoadingBulletin(true);
      const events = await BulletinService.getParishEvents(parishId, user?.id);
      setBulletinEvents(events);
    } catch (error) {
      console.error('Error loading bulletin events:', error);
      Alert.alert('Error', 'Failed to load bulletin events');
    } finally {
      setLoadingBulletin(false);
    }
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
        return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`;
      } else if (diffInHours < 24) {
        return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
      } else if (diffInDays === 1) {
        return 'yesterday';
      } else if (diffInDays < 7) {
        return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
      } else if (diffInWeeks < 4) {
        return `${diffInWeeks} week${diffInWeeks === 1 ? '' : 's'} ago`;
      } else if (diffInMonths < 12) {
        return `${diffInMonths} month${diffInMonths === 1 ? '' : 's'} ago`;
      } else {
        const diffInYears = Math.floor(diffInDays / 365);
        return `${diffInYears} year${diffInYears === 1 ? '' : 's'} ago`;
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
      // For now, we'll return 'reserved' and check ownership in handleTimeSlotPress
      // This is because we need to fetch reservation details to know ownership
      return 'reserved';
    }
    
    return timeSlot.available ? 'available' : 'unavailable';
  };

  // Bulletin board functions
  const handleSaveEvent = async () => {
    if (!parishId || !user) return;
    
    try {
      setCreatingEvent(true);
      
      // Prepare event data, only including date/time/location if they have values
      const eventData: CreateEventData & { notify?: boolean } = {
        title: createEventData.title,
        description: createEventData.description,
        event_type: createEventData.event_type,
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
          setCreateEventData({
            title: '',
            description: '',
            event_type: 'announcement',
            event_date: '',
            event_time: '',
            location: '',
            contact_info: '',
            volunteers_needed: undefined
          });
          setNotifyParishioners(false);
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
                body: { parishId, eventId: result.event.id },
                headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined,
              });
            }
          } catch (err) {
            console.error('Error invoking remote push function:', err);
          }
          Alert.alert('Success', 'Event created successfully!');
          setShowCreateEventModal(false);
          setCreateEventData({
            title: '',
            description: '',
            event_type: 'announcement',
            event_date: '',
            event_time: '',
            location: '',
            contact_info: '',
            volunteers_needed: undefined
          });
          setNotifyParishioners(false);
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
        Alert.alert('Success', 'Response submitted successfully!');
        setShowEventDetailsModal(false);
        setResponseData({
          response_type: 'attending',
          notes: ''
        });
        await loadBulletinEvents();
        // Refresh scheduled notifications after RSVP/volunteer
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
    if (!user) return;
    
    try {
      const result = await BulletinService.removeResponse(eventId, user.id);
      
      if (result.success) {
        Alert.alert('Success', 'Response removed successfully!');
        setShowEventDetailsModal(false);
        await loadBulletinEvents();
        // Refresh scheduled notifications after removing response
        try { await notificationService.refreshEventNotifications(user.id); } catch {}
      } else {
        Alert.alert('Error', result.error || 'Failed to remove response');
      }
    } catch (error) {
      console.error('Error removing response:', error);
      Alert.alert('Error', 'Failed to remove response');
    }
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

  const renderConfessionTab = () => (
    <ScrollView 
      className="flex-1" 
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="white"
          colors={["white"]}
        />
      }
    >
      <View className="p-5">
        {/* Header */}
        <View className="mb-6">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-white text-lg font-semibold">Confession {parish?.priest_name ? `with ${parish.priest_name}` : `Schedule`}</Text>
          </View>
          <Text className="text-white opacity-70 text-sm">
            {isParishAdmin 
              ? 'Tap slots to enable/disable availability'
              : `Select a time slot to schedule your confession`
            }
          </Text>
        </View>

        {/* Days Selection */}
        <ScrollView 
          showsHorizontalScrollIndicator={false}
          horizontal={true}
          className="mb-6"
        >
          <View className="flex-row space-x-3">
            {weekSchedule.map((daySchedule, index) => {
              const isSelected = daySchedule.date.toDateString() === selectedDay.toDateString();
              const isToday = daySchedule.date.toDateString() === new Date().toDateString();
              
              return (
                <TouchableOpacity
                  key={index}
                  className={`px-1.5 py-1 rounded-xl border m-1 ${
                    isSelected 
                      ? 'bg-red-600 border-red-500' 
                      : 'bg-gray-800 border-gray-700'
                  }`}
                  onPress={() => setSelectedDay(daySchedule.date)}
                >
                  <Text className={`text-center font-medium ${
                    isSelected ? 'text-white' : 'text-white opacity-70'
                  }`}>
                    {daySchedule.dayName}
                  </Text>
                  <Text className={`text-center text-xs mt-1 ${
                    isSelected ? 'text-white' : 'text-white opacity-50'
                  }`}>
                    {daySchedule.dateString}
                  </Text>
                  {isToday && (
                    <View className="absolute -top-1 -right-1 h-2 w-2 bg-green-500 rounded-full" />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* Time Slots */}
        <View className="space-y-4">
          <Text className="text-white font-medium mb-3">
            {isParishAdmin ? 'Manage' : 'Available'} Times for {selectedDay.toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'long', 
              day: 'numeric' 
            })}
          </Text>
          
          <View className="flex-row flex-wrap justify-between">
            {weekSchedule
              .find(day => day.date.toDateString() === selectedDay.toDateString())
              ?.timeSlots.map((timeSlot, index) => {
                const selectedDaySchedule = weekSchedule.find(day => day.date.toDateString() === selectedDay.toDateString())!;
                const slotStatus = getSlotStatus(selectedDaySchedule, timeSlot);
                const isPassed = isTimeSlotPassed(selectedDaySchedule, timeSlot);
                const isReservedByCurrentUser = !!timeSlot.reservationId && userReservations.has(timeSlot.reservationId);
                const showAsPassed = isPassed && !isReservedByCurrentUser;

                return (
                <TouchableOpacity
                  key={timeSlot.id}
                  className={`w-[48%] p-3 rounded-xl border mb-3 ${
                      showAsPassed
                        ? 'bg-gray-900 border-gray-800 opacity-50'
                        : slotStatus === 'reserved' || (isPassed && isReservedByCurrentUser)
                        ? 'bg-gray-700 border-gray-600'
                        : slotStatus === 'available'
                        ? 'bg-gray-800 border-gray-700'
                        : 'bg-gray-800 border-gray-700 opacity-70'
                  }`}
                  onPress={() => handleTimeSlotPress(
                    selectedDaySchedule,
                    timeSlot
                  )}
                    disabled={
                      (!isParishAdmin && slotStatus === 'reserved' && !isReservedByCurrentUser) || 
                      (!isParishAdmin && slotStatus === 'unavailable') ||
                      (!isParishAdmin && isPassed && !isReservedByCurrentUser)
                    }
                >
                  <View className="items-center">
                    <View className="flex-row items-center mb-1">
                      <Ionicons 
                          name={showAsPassed ? "close-circle" : slotStatus === 'available' ? "time-outline" : "close-circle"} 
                        size={16} 
                          color={showAsPassed ? "#6B7280" : slotStatus === 'available' ? "#10B981" : "#9CA3AF"} 
                      />
                      <Text className={`ml-2 font-medium text-sm ${
                          showAsPassed ? 'text-gray-500' : slotStatus === 'available' ? 'text-white' : 'text-gray-300'
                      }`}>
                        {timeSlot.displayTime}
                      </Text>
                    </View>
                    
                      {isReservedByCurrentUser ? (
                      <View className="flex-row items-center">
                        <Ionicons name="person" size={12} color="#6B7280" />
                        <Text className="text-gray-500 text-xs ml-1">
                          Reserved by you
                        </Text>
                      </View>
                      ) : showAsPassed ? (
                        <Text className="text-gray-500 text-xs">
                          Passed
                        </Text>
                      ) : slotStatus === 'reserved' ? (
                      <View className="flex-row items-center">
                        <Ionicons name="person" size={12} color="#6B7280" />
                        <Text className="text-gray-500 text-xs ml-1">
                          Reserved
                        </Text>
                      </View>
                      ) : slotStatus === 'available' ? (
                      <View className="flex-row items-center">
                        <Ionicons name="checkmark-circle" size={12} color="#10B981" />
                        <Text className="text-green-400 text-xs ml-1">
                            {"Available"}
                        </Text>
                      </View>
                    ) : (
                      <Text className="text-gray-400 text-xs">
                          {isParishAdmin ? 'Tap to enable' : 'Closed'}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
                );
              })}
          </View>
        </View>
      </View>
    </ScrollView>
  );

  const renderBulletinTab = () => (
    <View className="flex-1">
      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="white"
            colors={["white"]}
          />
        }
      >
        <View className="p-6">
          {/* Header */}
          <View className="mb-6">
            <Text className="text-white text-lg font-semibold mb-1">Parish Bulletin Board</Text>
            <Text className="text-white opacity-70 text-sm">
              Latest announcements and opportunities at your parish
            </Text>
          </View>

          {/* Events List */}
          {loadingBulletin ? (
            <View className="items-center py-8">
              <ActivityIndicator size="large" color="white" />
              <Text className="text-white mt-4">Loading events...</Text>
            </View>
          ) : bulletinEvents.length === 0 ? (
            <View className="items-center py-8">
              <Ionicons name="document-text-outline" size={48} color="#6B7280" />
              <Text className="text-white mt-4 text-center">No events posted yet</Text>
              <Text className="text-gray-400 text-sm text-center mt-2">
                {isParishAdmin ? 'Create the first event to get started!' : 'Check back later for announcements'}
              </Text>
            </View>
          ) : (
            <View className="space-y-4">
              {bulletinEvents.map((event) => (
                <TouchableOpacity
                  key={event.id}
                  className="bg-gray-900 rounded-xl p-4 border border-gray-700 mb-2"
                  onPress={() => {
                    setSelectedEvent(event);
                    setShowEventDetailsModal(true);
                    // Load responses if parish admin and event type
                    if (isParishAdmin && (event.event_type === 'event' || event.event_type === 'volunteer')) {
                      loadEventResponses(event.id);
                    }
                  }}
                >
                  <View className="flex-row justify-between items-start mb-2">
                    <View className="flex-1">
                      <View className="flex-row items-center mb-2">
                        <View className={`px-2 py-1 rounded-full mr-2 ${
                          event.event_type === 'announcement' 
                            ? 'bg-blue-600' 
                            : event.event_type === 'volunteer'
                            ? 'bg-green-600'
                            : 'bg-purple-600'
                        }`}>
                          <Text className="text-white text-xs font-medium">
                            {event.event_type === 'announcement' ? 'Announcement' : 
                             event.event_type === 'volunteer' ? 'Volunteer' : 'Event'}
                          </Text>
                        </View>
                        {event.created_by === user?.id && (
                          <View className="px-2 py-1 rounded-full bg-gray-600">
                            <Text className="text-white text-xs">Your Post</Text>
                          </View>
                        )}
                      </View>
                      
                      <Text className="text-white font-semibold text-lg mb-1">
                        {event.title}
                      </Text>
                      
                      {event.description && (
                        <Text className="text-gray-300 text-sm mb-2" numberOfLines={2}>
                          {event.description}
                        </Text>
                      )}
                      
                      <View className="flex-row items-center space-x-4">
                        {(event.event_type === 'volunteer' || event.event_type === 'event') && event.event_date && (
                          <View className="flex-row items-center mr-2">
                            <Ionicons name="calendar-outline" size={14} color="#9CA3AF" />
                            <Text className="text-gray-400 text-xs ml-1">
                          {(() => {
                            // Parse date as local date to avoid timezone issues
                            const [year, month, day] = event.event_date?.split('-').map(Number) || [];
                            const localDate = new Date(year, month - 1, day);
                            return localDate.toLocaleDateString('en-US', {
                              weekday: 'long',
                              month: 'long',
                              day: 'numeric'
                            });
                          })()}
                        </Text>
                          </View>
                        )}
                        
                        {(event.event_type === 'volunteer' || event.event_type === 'event') && event.event_time && (
                          <View className="flex-row items-center mr-2">
                            <Ionicons name="time-outline" size={14} color="#9CA3AF" />
                            <Text className="text-gray-400 text-xs ml-1">
                              {formatEventTime(event.event_time)}
                            </Text>
                          </View>
                        )}
                        
                        {(event.event_type === 'volunteer' || event.event_type === 'event') && event.location && (
                          <View className="flex-row items-center mr-2">
                            <Ionicons name="location-outline" size={14} color="#9CA3AF" />
                            <Text className="text-gray-400 text-xs ml-1">
                              {event.location}
                            </Text>
                          </View>
                        )}
                      </View>
                      
                      <View className="flex-row justify-between items-center mt-3">
                        <Text className="text-gray-500 text-xs">
                          Posted {formatRelativeTime(event.created_at)}
                        </Text>
                        
                        <View className="flex-row items-center space-x-2">
                          {event.event_type === 'event' && event.user_response && (
                            <View className="flex-row items-center">
                              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                              <Text className="text-green-400 text-xs ml-1">
                                {event.user_response.response_type === 'interested' ? 'Interested' :
                                 event.user_response.response_type === 'unavailable' ? 'Unavailable' : 'Attending'}
                              </Text>
                            </View>
                          )}
                          
                          {event.event_type === 'volunteer' && event.volunteers_needed && (
                            <View className="flex-row items-center">
                              <Ionicons name="people" size={16} color="#10B981" />
                              <Text className="text-green-400 text-xs ml-1">
                                {event.volunteer_count || 0}/{event.volunteers_needed} volunteers
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>
                    

                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Floating Action Button for Parish Admins */}
      {isParishAdmin && (
      <View className="absolute bottom-6 right-6 z-50">
        <TouchableOpacity
        className="bg-red-600 rounded-full p-4 shadow-lg"
        onPress={() => setShowCreateEventModal(true)}
        style={{
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 4,
          },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
          <Ionicons name="add" size={30} color="white" />
        </TouchableOpacity>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <View className="flex-1 bg-black pt-0">
        <View className="p-6 bg-gradient-to-b from-gray-900 to-gray-800 border-b border-gray-800">
          <View className="flex-row justify-between items-center pt-4">
            <View>
              <Text className="text-3xl font-bold text-white">Events</Text>
              <Text className="text-sm text-white opacity-70">Parish events and announcements</Text>
            </View>
          </View>
        </View>
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="white" />
          <Text className="text-white mt-4">Loading events...</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black pt-0">
      {/* Header */}
      <View className="p-6 bg-gradient-to-b from-gray-900 to-gray-800 border-b border-gray-800">
        <View className="flex-row justify-between items-center pt-4">
          <View>
            <Text className="text-3xl font-bold text-white">Events</Text>
            <Text className="text-sm text-white opacity-70">Parish events and announcements</Text>
          </View>
          <View className="h-10 w-10 rounded-full bg-transparent flex items-center justify-center">
              <Ionicons name="notifications" size={25} color="white" />
          </View>
        </View>
      </View>

      {/* Tab Navigation */}
      <View className="flex-row border-b border-gray-700">
        <TouchableOpacity
          className={`flex-1 py-4 px-6 ${
            activeTab === 'bulletin' 
              ? 'border-b-2 border-red-500' 
              : ''
          }`}
          onPress={() => setActiveTab('bulletin')}
        >
          <View className="flex-row items-center justify-center">
            <Ionicons 
              name={activeTab === 'bulletin' ? 'pin' : 'pin-outline'} 
              size={20} 
              color={activeTab === 'bulletin' ? '#EF4444' : '#9CA3AF'} 
            />
            <Text className={`ml-2 font-medium ${
              activeTab === 'bulletin' ? 'text-red-500' : 'text-gray-400'
            }`}>
              Bulletin Board
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          className={`flex-1 py-4 px-6 ${
            activeTab === 'confession' 
              ? 'border-b-2 border-red-500' 
              : ''
          }`}
          onPress={() => setActiveTab('confession')}
        >
          <View className="flex-row items-center justify-center">
            <Ionicons 
              name={activeTab === 'confession' ? 'time' : 'time-outline'}  
              size={20} 
              color={activeTab === 'confession' ? '#EF4444' : '#9CA3AF'} 
            />
            <Text className={`ml-2 font-medium ${
              activeTab === 'confession' ? 'text-red-500' : 'text-gray-400'
            }`}>
              Confession
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      <View className="flex-1">
        {activeTab === 'confession' ? renderConfessionTab() : renderBulletinTab()}
      </View>

      {/* Reservation Modal */}
      <Modal
        visible={showReservationModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowReservationModal(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/80 px-4">
          <View className="bg-gray-900 rounded-2xl p-6 w-full max-w-md shadow-lg border border-gray-700">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl text-white font-bold">Make Reservation</Text>
              <TouchableOpacity onPress={() => setShowReservationModal(false)}>
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>

            <View className="mb-6">
              <Text className="text-white text-lg">
                {selectedTimeSlot?.time}
              </Text>
              <Text className="text-white opacity-70 text-sm">
                {selectedDay.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </Text>
            </View>

            <View className="mb-6">
              <Text className="text-gray-300 text-xs mb-2">Notes (Optional)</Text>
              <TextInput
                className="bg-gray-800 text-white p-3 rounded-lg border border-gray-600"
                value={reservationNotes}
                onChangeText={setReservationNotes}
                placeholder="Any special requests or notes..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
                autoComplete="street-address"
                textContentType="location"
              />
            </View>

            <View className="flex-row space-x-3">
              <TouchableOpacity
                className="flex-1 bg-gray-700 rounded-lg py-3 mr-2"
                onPress={() => setShowReservationModal(false)}
                disabled={reservationLoading}
              >
                <Text className="text-white text-center font-medium">Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                className="flex-1 bg-red-600 rounded-lg py-3 flex-row items-center justify-center"
                onPress={handleMakeReservation}
                disabled={reservationLoading}
              >
                {reservationLoading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Ionicons name="checkmark" size={20} color="white" />
                )}
                <Text className="text-white text-center font-medium ml-2">
                  {reservationLoading ? 'Confirming...' : 'Confirm'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Reservation Details Modal */}
      <Modal
        visible={showReservationDetailsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowReservationDetailsModal(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/80 px-4">
          <View className="bg-gray-900 rounded-2xl p-6 w-full max-w-md shadow-lg border border-gray-700">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl text-white font-bold">Reservation Details</Text>
              <TouchableOpacity onPress={() => setShowReservationDetailsModal(false)}>
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>

            {loadingReservationDetails ? (
              <View className="items-center py-8">
                <ActivityIndicator size="large" color="white" />
                <Text className="text-white mt-4">Loading details...</Text>
              </View>
            ) : reservationDetails ? (
              <View className="space-y-4">
                <View className="bg-gray-800 rounded-lg p-4 mb-2">
                  <Text className="text-white font-semibold text-lg mb-2">
                    {selectedTimeSlot?.time}
                  </Text>
                  <Text className="text-white opacity-70 text-sm">
                    {selectedDay.toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </Text>
                </View>

                <View className="bg-gray-800 rounded-lg p-4 mb-2">
                  <Text className="text-gray-300 text-xs mb-2">Reserved By</Text>
                  <Text className="text-white font-medium">
                    {reservationDetails.user_profiles?.full_name || 'Unknown User'}
                  </Text>
                  <Text className="text-white opacity-70 text-sm mt-1">
                    {reservationDetails.user_profiles?.email || 'No email provided'}
                  </Text>
                  {reservationDetails.user_profiles?.phone_number && (
                    <Text className="text-white opacity-70 text-sm mt-1">
                      {formatPhoneNumber(reservationDetails.user_profiles.phone_number)}
                    </Text>
                  )}
                </View>

                {reservationDetails.notes && (
                  <View className="bg-gray-800 rounded-lg p-4 mb-2">
                    <Text className="text-gray-300 text-xs mb-2">Notes</Text>
                    <Text className="text-white">
                      {reservationDetails.notes}
                    </Text>
                  </View>
                )}

                <View className="bg-gray-800 rounded-lg p-4 mb-2">
                  <Text className="text-gray-300 text-xs mb-2">Reservation Date</Text>
                  <Text className="text-white">
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
              <View className="items-center py-8">
                <Ionicons name="alert-circle" size={48} color="#6B7280" />
                <Text className="text-white mt-4 text-center">Failed to load reservation details</Text>
              </View>
            )}

            <View className="mt-6">
              <TouchableOpacity
                className="w-full bg-gray-700 rounded-lg py-3"
                onPress={() => setShowReservationDetailsModal(false)}
              >
                <Text className="text-white text-center font-medium">Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Create Event Modal */}
      <Modal
        visible={showCreateEventModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateEventModal(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/80 px-4">
          <View className="bg-gray-900 rounded-2xl p-6 w-full max-w-md shadow-lg border border-gray-700 max-h-[90%]">
            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="flex-row justify-between items-center mb-6">
                <Text className="text-xl text-white font-bold">{editingEventId ? 'Edit Post' : 'Create New Post'}</Text>
                <TouchableOpacity onPress={() => setShowCreateEventModal(false)}>
                  <Ionicons name="close" size={24} color="white" />
                </TouchableOpacity>
              </View>

              <View className="space-y-4">
                {/* Event Type */}
                {!editingEventId && (
                  <View className="mb-2">
                    <Text className="text-gray-300 text-sm mb-2">Type</Text>
                    <View className="flex-row space-x-2 mb-2">
                      <TouchableOpacity
                        className={`flex-1 pt-2 pb-2 rounded-lg border mr-1 ${
                          createEventData.event_type === 'announcement'
                            ? 'bg-blue-600 border-blue-500'
                            : 'bg-gray-800 border-gray-600'
                        }`}
                        onPress={() => setCreateEventData({
                          ...createEventData, 
                          event_type: 'announcement',
                          event_date: '',
                          event_time: '',
                          location: ''
                        })}
                      >
                        <Text className={`text-center text-xs ${
                          createEventData.event_type === 'announcement' ? 'text-white' : 'text-gray-400'
                        }`}>
                          Announcement
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        className={`flex-1 pt-2 pb-2 rounded-lg border mr-1 ${
                          createEventData.event_type === 'event'
                            ? 'bg-purple-600 border-purple-500'
                            : 'bg-gray-800 border-gray-600'
                        }`}
                        onPress={() => setCreateEventData({...createEventData, event_type: 'event'})}
                      >
                        <Text className={`text-center text-xs ${
                          createEventData.event_type === 'event' ? 'text-white' : 'text-gray-400'
                        }`}>
                          Event
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        className={`flex-1 pt-2 pb-2 rounded-lg border ${
                          createEventData.event_type === 'volunteer'
                            ? 'bg-green-600 border-green-500'
                            : 'bg-gray-800 border-gray-600'
                        }`}
                        onPress={() => setCreateEventData({...createEventData, event_type: 'volunteer'})}
                      >
                        <Text className={`text-center text-xs ${
                          createEventData.event_type === 'volunteer' ? 'text-white' : 'text-gray-400'
                        }`}>
                          Volunteer
                        </Text>
                      </TouchableOpacity>
                      
                    </View>
                  </View>
                )}

                

                {/* Title */}
                <View className="mb-2">
                  <Text className="text-gray-300 text-sm mb-2">Title *</Text>
                  <TextInput
                    className="bg-gray-800 text-white p-3 rounded-lg border border-gray-600"
                    value={createEventData.title}
                    onChangeText={(text) => setCreateEventData({...createEventData, title: text})}
                    placeholder={createEventData.event_type === 'announcement' ? 'Announcement title...' : 'Event title...'}
                    placeholderTextColor="#9CA3AF"
                    autoComplete="street-address"
                    textContentType="location"
                  />
                </View>
                
                {/* Description */}
                <View className="mb-2">
                  <Text className="text-gray-300 text-sm mb-2">Description</Text>
                  <TextInput
                    className="bg-gray-800 text-white p-3 rounded-lg border border-gray-600"
                    value={createEventData.description}
                    onChangeText={(text) => setCreateEventData({...createEventData, description: text})}
                    placeholder={createEventData.event_type === 'announcement' ? 'Announcement description...' : 'Event description...'}
                    placeholderTextColor="#9CA3AF"
                    multiline
                    numberOfLines={3}
                    autoComplete="street-address"
                    textContentType="location"
                  />
                </View>
                
                {/* Volunteers Needed */}
                {createEventData.event_type === 'volunteer' && (
                  <View className="mb-2">
                    <Text className="text-gray-300 text-sm mb-2">Volunteers Needed *</Text>
                    <TextInput
                      className="bg-gray-800 text-white p-3 rounded-lg border border-gray-600"
                      value={createEventData.volunteers_needed?.toString() || ''}
                      onChangeText={(text) => {
                        const num = parseInt(text) || undefined;
                        setCreateEventData({...createEventData, volunteers_needed: num});
                      }}
                      placeholder="Number of volunteers needed..."
                      placeholderTextColor="#9CA3AF"
                      keyboardType="numeric"
                      autoComplete="off"
                      textContentType="none"
                    />
                  </View>
                )}

                

                {/* Date and Time - Only show for volunteer and event types */}
                {(createEventData.event_type === 'volunteer' || createEventData.event_type === 'event') && (
                  <View className="flex-row space-x-2 mb-2">
                    <View className="flex-1 mr-1">
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
                )}

                {/* Location - Only show for volunteer and event types */}
                {(createEventData.event_type === 'volunteer' || createEventData.event_type === 'event') && (
                  <View className="mb-2">
                    <Text className="text-gray-300 text-sm mb-2">Location</Text>
                    <TextInput
                      className="bg-gray-800 text-white p-3 rounded-lg border border-gray-600"
                      value={createEventData.location}
                      onChangeText={(text) => setCreateEventData({...createEventData, location: text})}
                      placeholder="Event location..."
                      placeholderTextColor="#9CA3AF"
                      autoComplete="street-address"
                      textContentType="location"
                    />
                  </View>
                )}

                {/* Contact Info */}
                {(createEventData.event_type === 'volunteer' || createEventData.event_type === 'event') && (
                <View className="mb-2">
                  <Text className="text-gray-300 text-sm mb-2">Contact Information</Text>
                  <TextInput
                    className="bg-gray-800 text-white p-3 rounded-lg border border-gray-600"
                    value={createEventData.contact_info}
                    onChangeText={(text) => setCreateEventData({...createEventData, contact_info: text})}
                    placeholder="Contact details..."
                      placeholderTextColor="#9CA3AF"
                      autoComplete="tel"
                      textContentType="telephoneNumber"
                    />
                  </View>
                )}

                {/* Volunteers Needed - Only for volunteer type */}
                
                {/* Notify Parishioners */}
                <View className="flex-row items-center mb-2 mt-2">
                  <Text className="text-gray-300 text-md">Notify Parishioners?</Text>
                  <Switch
                    value={notifyParishioners}
                    onValueChange={setNotifyParishioners}
                    trackColor={{ false: "#374151", true: "#EF4444" }}
                    thumbColor="white"
                    className="ml-2"
                  />
                </View>
              </View>

              <View className="flex-row space-x-3 mt-6">
                <TouchableOpacity
                  className="flex-1 bg-gray-700 rounded-lg py-3 mr-2"
                  onPress={() => { setShowCreateEventModal(false); setEditingEventId(null); }}
                  disabled={creatingEvent}
                >
                  <Text className="text-white text-center font-medium">Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  className={`flex-1 rounded-lg py-3 flex-row items-center justify-center ${
                    creatingEvent || !createEventData.title.trim() || (createEventData.event_type === 'volunteer' && !createEventData.volunteers_needed)
                      ? 'bg-gray-600 opacity-50'
                      : 'bg-red-600'
                  }`}
                  onPress={handleSaveEvent}
                  disabled={creatingEvent || !createEventData.title.trim() || (createEventData.event_type === 'volunteer' && !createEventData.volunteers_needed)}
                >
                  {creatingEvent ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <Ionicons name="checkmark" size={20} color={creatingEvent || !createEventData.title.trim() || (createEventData.event_type === 'volunteer' && !createEventData.volunteers_needed) ? "#9CA3AF" : "white"} />
                  )}
                  <Text className={`text-center font-medium ml-2 ${
                    creatingEvent || !createEventData.title.trim() || (createEventData.event_type === 'volunteer' && !createEventData.volunteers_needed)
                      ? 'text-gray-400'
                      : 'text-white'
                  }`}>
                    {creatingEvent ? (editingEventId ? 'Saving...' : 'Creating...') : (editingEventId ? 'Save Changes' : 'Create Event')}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Event Details Modal */}
      <Modal
        visible={showEventDetailsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEventDetailsModal(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/80 px-4">
          <View className="bg-gray-900 rounded-2xl p-6 w-full max-w-md shadow-lg border border-gray-700 max-h-[90%]">
            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-xl text-white font-bold">Post Details</Text>
                <TouchableOpacity onPress={() => setShowEventDetailsModal(false)}>
                  <Ionicons name="close" size={24} color="white" />
                </TouchableOpacity>
              </View>

              {selectedEvent && (
                <View className="space-y-4">
                  <View className="flex-row items-center mb-4">
                    <View className={`px-2 py-1 rounded-full mr-2 ${
                      selectedEvent.event_type === 'announcement' 
                        ? 'bg-blue-600' 
                        : selectedEvent.event_type === 'volunteer'
                        ? 'bg-green-600'
                        : 'bg-purple-600'
                    }`}>
                      <Text className="text-white text-xs font-medium">
                        {selectedEvent.event_type === 'announcement' ? 'Announcement' : 
                         selectedEvent.event_type === 'volunteer' ? 'Volunteer' : 'Event'}
                      </Text>
                    </View>
                    {selectedEvent.created_by === user?.id && (
                      <View className="px-2 py-1 rounded-full bg-gray-600">
                        <Text className="text-white text-xs">Your Post</Text>
                      </View>
                    )}
                  </View>

                  <Text className="text-white font-semibold text-xl">
                    {selectedEvent.title}
                  </Text>

                  {selectedEvent.description && (
                    <Text className="text-gray-300 text-base">
                      {selectedEvent.description}
                    </Text>
                  )}

                  <View className="space-y-2 mt-4 mb-4">
                    {(selectedEvent.event_type === 'volunteer' || selectedEvent.event_type === 'event') && selectedEvent.event_date && (
                      <View className="flex-row items-center mb-1">
                        <Ionicons name="calendar-outline" size={16} color="#9CA3AF" />
                        <Text className="text-gray-400 text-sm ml-2">
                          {(() => {
                            // Parse date as local date to avoid timezone issues
                            const [year, month, day] = selectedEvent.event_date.split('-').map(Number);
                            const localDate = new Date(year, month - 1, day);
                            return localDate.toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            });
                          })()}
                        </Text>
                      </View>
                    )}
                    
                    {(selectedEvent.event_type === 'volunteer' || selectedEvent.event_type === 'event') && selectedEvent.event_time && (
                      <View className="flex-row items-center mb-1">
                        <Ionicons name="time-outline" size={16} color="#9CA3AF" />
                        <Text className="text-gray-400 text-sm ml-2">
                          {formatEventTime(selectedEvent.event_time)}
                        </Text>
                      </View>
                    )}
                    
                    {(selectedEvent.event_type === 'volunteer' || selectedEvent.event_type === 'event') && selectedEvent.location && (
                      <View className="flex-row items-center mb-1">
                        <Ionicons name="location-outline" size={16} color="#9CA3AF" />
                        <Text className="text-gray-400 text-sm ml-2">
                          {selectedEvent.location}
                        </Text>
                      </View>
                    )}
                    
                    {selectedEvent.contact_info && (
                      <View className="flex-row items-center mb-1">
                        <Ionicons name="call-outline" size={16} color="#9CA3AF" />
                        <Text className="text-gray-400 text-sm ml-2">
                          {selectedEvent.contact_info}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View className="border-t border-gray-700 pt-2">
                    <Text className="text-gray-500 text-sm">{"Posted on "}
                      {new Date(selectedEvent.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Text>
                    

                  </View>

                  {/* Response Section for Non-Admins - Only for Event type */}
                  {!isParishAdmin && selectedEvent.event_type === 'event' && (
                    <View className="pt-4">
                      {selectedEvent.user_response ? (
                        <View className="space-y-2">
                          <View className="flex-row items-center mb-2">
                            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                            <Text className="text-green-400 text-sm ml-2">
                              You responded: {selectedEvent.user_response.response_type === 'interested' ? 'Interested' :
                               selectedEvent.user_response.response_type === 'unavailable' ? 'Unavailable' : 'Attending'}
                            </Text>
                          </View>
                          {selectedEvent.user_response.notes && (
                            <Text className="text-gray-300 text-sm">
                              Your notes: "{selectedEvent.user_response.notes}"
                            </Text>
                          )}
                          <TouchableOpacity
                            className="bg-red-600 rounded-lg py-3 mt-4"
                            onPress={() => handleRemoveResponse(selectedEvent.id)}
                          >
                            <Text className="text-white text-center font-medium">Remove Response</Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <View className="space-y-4">
                          <Text className="text-white font-medium mb-2">RSVP for this event:</Text>
                          
                          <View className="flex-row space-x-2 mb-2">
                          <TouchableOpacity
                              className={`flex-1 py-2 px-3 rounded-lg border mr-1 ${
                                responseData.response_type === 'unavailable'
                                  ? 'bg-red-600 border-red-500'
                                  : 'bg-gray-800 border-gray-600'
                              }`}
                              onPress={() => setResponseData({...responseData, response_type: 'unavailable'})}
                            >
                              <Text className={`text-center text-sm ${
                                responseData.response_type === 'unavailable' ? 'text-white' : 'text-gray-400'
                              }`}>
                                Unavailable
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              className={`flex-1 py-2 px-3 rounded-lg border mr-1 ${
                                responseData.response_type === 'interested'
                                  ? 'bg-blue-600 border-blue-500'
                                  : 'bg-gray-800 border-gray-600'
                              }`}
                              onPress={() => setResponseData({...responseData, response_type: 'interested'})}
                            >
                              <Text className={`text-center text-sm ${
                                responseData.response_type === 'interested' ? 'text-white' : 'text-gray-400'
                              }`}>
                                Interested
                              </Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity
                              className={`flex-1 py-2 px-3 rounded-lg border mr-1 ${
                                responseData.response_type === 'attending'
                                  ? 'bg-green-600 border-green-500'
                                  : 'bg-gray-800 border-gray-600'
                              }`}
                              onPress={() => setResponseData({...responseData, response_type: 'attending'})}
                            >
                              <Text className={`text-center text-sm ${
                                responseData.response_type === 'attending' ? 'text-white' : 'text-gray-400'
                              }`}>
                                Attending
                              </Text>
                            </TouchableOpacity>
                          </View>

                          <View className="mb-4">
                            <Text className="text-gray-300 text-sm mb-2">Notes (Optional)</Text>
                            <TextInput
                              className="bg-gray-800 text-white p-3 rounded-lg border border-gray-600"
                              value={responseData.notes}
                              onChangeText={(text) => setResponseData({...responseData, notes: text})}
                              placeholder="Any additional notes..."
                              placeholderTextColor="#9CA3AF"
                              multiline
                              numberOfLines={2}
                              autoComplete="street-address"
                              textContentType="location"
                            />
                          </View>

                          <TouchableOpacity
                            className="bg-red-600 rounded-lg py-3 flex-row items-center justify-center"
                            onPress={handleRespondToEvent}
                            disabled={respondingToEvent}
                          >
                            {respondingToEvent ? (
                              <ActivityIndicator color="white" size="small" />
                            ) : (
                              <Ionicons name="send" size={20} color="white" />
                            )}
                            <Text className="text-white text-center font-medium ml-2">
                              {respondingToEvent ? 'Submitting...' : 'Submit Response'}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  )}

                  {/* Volunteer Response Section for Non-Admins - Only for Volunteer type */}
                  {!isParishAdmin && selectedEvent.event_type === 'volunteer' && (
                    <View className="pt-4">
                      {/* Volunteer Count Display */}
                      <View className="bg-gray-800 rounded-lg p-3 mb-4 border border-gray-700">
                        <Text className="text-white font-medium mb-2">Volunteer Progress</Text>
                        <View className="flex-row items-center justify-between">
                          <Text className="text-gray-300 text-sm">
                            {selectedEvent.volunteer_count || 0} of {selectedEvent.volunteers_needed || 0} volunteers
                          </Text>
                          <View className="bg-gray-700 rounded-full h-2 flex-1 mx-3">
                            <View 
                              className="bg-green-500 rounded-full h-2" 
                              style={{ 
                                width: `${Math.min(100, ((selectedEvent.volunteer_count || 0) / (selectedEvent.volunteers_needed || 1)) * 100)}%` 
                              }}
                            />
                          </View>
                          <Text className="text-gray-300 text-sm">
                            {Math.round(((selectedEvent.volunteer_count || 0) / (selectedEvent.volunteers_needed || 1)) * 100)}%
                          </Text>
                        </View>
                        <Text className="text-gray-400 text-xs mt-2">
                          {selectedEvent.volunteers_needed && selectedEvent.volunteer_count && 
                           selectedEvent.volunteer_count >= selectedEvent.volunteers_needed 
                           ? 'Volunteer goal reached! 🎉' 
                           : `${(selectedEvent.volunteers_needed || 0) - (selectedEvent.volunteer_count || 0)} more volunteers needed`}
                        </Text>
                      </View>

                      {selectedEvent.user_response ? (
                        <View className="space-y-2">
                          <View className="flex-row items-center mb-2">
                            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                            <Text className="text-green-400 text-sm ml-2">
                              You volunteered for this event!
                            </Text>
                          </View>
                          {selectedEvent.user_response.notes && (
                            <Text className="text-gray-300 text-sm">
                              Your notes: "{selectedEvent.user_response.notes}"
                            </Text>
                          )}
                          <TouchableOpacity
                            className="bg-red-600 rounded-lg py-3 mt-4"
                            onPress={() => handleRemoveResponse(selectedEvent.id)}
                          >
                            <Text className="text-white text-center font-medium">Remove Response</Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <View className="space-y-4">
                          <Text className="text-white font-medium mb-2">Volunteer for this event:</Text>
                          
                          <View className="flex-row space-x-2 mb-2">
                            <TouchableOpacity
                              className={`flex-1 py-2 px-3 rounded-lg border ${
                                responseData.response_type === 'volunteer'
                                  ? 'bg-green-600 border-green-500'
                                  : 'bg-gray-800 border-gray-600'
                              }`}
                              onPress={() => setResponseData({
                                ...responseData, 
                                response_type: responseData.response_type === 'volunteer' ? 'attending' : 'volunteer'
                              })}
                            >
                              <View className="flex-row items-center justify-center">
                                <Ionicons 
                                  name={responseData.response_type === 'volunteer' ? 'checkmark-circle' : 'hand-left'} 
                                  size={24} 
                                  color={responseData.response_type === 'volunteer' ? 'white' : '#9CA3AF'} 
                                />
                                <Text className={`text-center text-sm ml-2 font-medium py-1 ${
                                  responseData.response_type === 'volunteer' ? 'text-white' : 'text-gray-400'
                                }`}>
                                  I'll Volunteer
                                </Text>
                              </View>
                            </TouchableOpacity>
                          </View>

                          <View className="mb-4">
                            <Text className="text-gray-300 text-sm mb-2">Notes (Optional)</Text>
                            <TextInput
                              className="bg-gray-800 text-white p-3 rounded-lg border border-gray-600"
                              value={responseData.notes}
                              onChangeText={(text) => setResponseData({...responseData, notes: text})}
                              placeholder="Any additional notes..."
                              placeholderTextColor="#9CA3AF"
                              multiline
                              numberOfLines={2}
                              autoComplete="street-address"
                              textContentType="location"
                            />
                          </View>

                          <TouchableOpacity
                            className={`rounded-lg py-3 flex-row items-center justify-center ${
                              responseData.response_type === 'volunteer' && !respondingToEvent
                                ? 'bg-red-600'
                                : 'bg-gray-600'
                            }`}
                            onPress={handleRespondToEvent}
                            disabled={respondingToEvent || responseData.response_type !== 'volunteer'}
                          >
                            {respondingToEvent ? (
                              <ActivityIndicator color="white" size="small" />
                            ) : (
                              <Ionicons name="send" size={20} color="white" />
                            )}
                            <Text className="text-white text-center font-medium ml-2">
                              {respondingToEvent ? 'Submitting...' : 'Submit Response'}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  )}

                  {/* RSVP Summary for Parish Admins - Only for Event type */}
                  {isParishAdmin && selectedEvent.event_type === 'event' && (
                    <View className="pt-2">
                      <View className="flex-row items-center justify-between mb-4">
                        {loadingResponses && (
                          <ActivityIndicator size="small" color="white" />
                        )}
                      </View>

                      {/* Response Count Summary */}
                      {!loadingResponses && eventResponses.length > 0 && (
                        <View className="bg-gray-800 rounded-lg p-3 mb-4 border border-gray-700">
                          <Text className="text-white font-medium mb-2">RSVP Response Summary</Text>
                          <View className="flex-row justify-between">
                            <View className="items-center">
                              <Text className="text-green-400 text-lg font-bold">
                                {eventResponses.filter(r => r.response_type === 'attending').length}
                              </Text>
                              <Text className="text-gray-400 text-xs">Attending</Text>
                            </View>
                            <View className="items-center">
                              <Text className="text-blue-400 text-lg font-bold">
                                {eventResponses.filter(r => r.response_type === 'interested').length}
                              </Text>
                              <Text className="text-gray-400 text-xs">Interested</Text>
                            </View>
                            <View className="items-center">
                              <Text className="text-red-400 text-lg font-bold">
                                {eventResponses.filter(r => r.response_type === 'unavailable').length}
                              </Text>
                              <Text className="text-gray-400 text-xs">Unavailable</Text>
                            </View>
                            <View className="items-center">
                              <Text className="text-white text-lg font-bold">
                                {eventResponses.length}
                              </Text>
                              <Text className="text-gray-400 text-xs">Total</Text>
                            </View>
                          </View>
                        </View>
                      )}
                      
                      {eventResponses.length === 0 ? (
                        <View className="items-center py-4">
                          <Ionicons name="people-outline" size={32} color="#6B7280" />
                          <Text className="text-gray-400 text-sm mt-2">No responses yet</Text>
                        </View>
                      ) : (
                        <View className="space-y-3">
                          {eventResponses.map((response, index) => (
                            <View key={index} className="bg-gray-800 rounded-lg p-3 border border-gray-700 mb-2">
                              <View className="flex-row items-center justify-between mb-2">
                                <Text className="text-white font-medium">
                                  {response.user_profile?.full_name || 'Unknown User'}
                                </Text>
                                <View className={`px-2 py-1 rounded-full ${
                                  response.response_type === 'attending' ? 'bg-green-600' :
                                  response.response_type === 'interested' ? 'bg-blue-600' : 'bg-red-600'
                                }`}>
                                  <Text className="text-white text-xs font-medium">
                                    {response.response_type === 'attending' ? 'Attending' :
                                     response.response_type === 'interested' ? 'Interested' : 'Unavailable'}
                                  </Text>
                                </View>
                              </View>
                              
                              {response.notes && (
                                <Text className="text-gray-300 text-sm mt-1">
                                  "{response.notes}"
                                </Text>
                              )}
                              
                              <Text className="text-gray-500 text-xs mt-2">
                                {new Date(response.created_at).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  )}

                  {/* Volunteer Summary for Parish Admins - Only for Volunteer type */}
                  {isParishAdmin && selectedEvent.event_type === 'volunteer' && (
                    <View className="pt-2">
                      <View className="flex-row items-center justify-between mb-4">
                        {loadingResponses && (
                          <ActivityIndicator size="small" color="white" />
                        )}
                      </View>

                      {/* Volunteer Progress Summary */}
                      <View className="bg-gray-800 rounded-lg p-3 mb-4 border border-gray-700">
                        <Text className="text-white font-medium mb-2">Volunteer Progress</Text>
                        <View className="flex-row items-center justify-between mb-2">
                          <Text className="text-gray-300 text-sm">
                            {selectedEvent.volunteer_count || 0} of {selectedEvent.volunteers_needed || 0} volunteers
                          </Text>
                          <View className="bg-gray-700 rounded-full h-2 flex-1 mx-3">
                            <View 
                              className="bg-green-500 rounded-full h-2" 
                              style={{ 
                                width: `${Math.min(100, ((selectedEvent.volunteer_count || 0) / (selectedEvent.volunteers_needed || 1)) * 100)}%` 
                              }}
                            />
                          </View>
                          <Text className="text-gray-300 text-sm">
                            {Math.round(((selectedEvent.volunteer_count || 0) / (selectedEvent.volunteers_needed || 1)) * 100)}%
                          </Text>
                        </View>
                        <Text className="text-gray-400 text-xs">
                          {selectedEvent.volunteers_needed && selectedEvent.volunteer_count && 
                           selectedEvent.volunteer_count >= selectedEvent.volunteers_needed 
                           ? 'Volunteer goal reached! 🎉' 
                           : `${(selectedEvent.volunteers_needed || 0) - (selectedEvent.volunteer_count || 0)} more volunteers needed`}
                        </Text>
                      </View>

                      {/* Volunteer List */}
                      {eventResponses.length === 0 ? (
                        <View className="items-center py-4">
                          <Ionicons name="people-outline" size={32} color="#6B7280" />
                          <Text className="text-gray-400 text-sm mt-2">No volunteers yet</Text>
                        </View>
                      ) : (
                        <View className="space-y-3">
                          {eventResponses.map((response, index) => (
                            <View key={index} className="bg-gray-800 rounded-lg p-3 border border-gray-700 mb-2">
                              <View className="flex-row items-center justify-between mb-2">
                                <Text className="text-white font-medium">
                                  {response.user_profile?.full_name || 'Unknown User'}
                                </Text>
                                <View className="px-2 py-1 rounded-full bg-green-600">
                                  <Text className="text-white text-xs font-medium">
                                    Volunteer
                                  </Text>
                                </View>
                              </View>
                              
                              {response.notes && (
                                <Text className="text-gray-300 text-sm">
                                  Notes: "{response.notes}"
                                </Text>
                              )}
                              
                              <Text className="text-gray-500 text-xs mt-2">
                                {new Date(response.created_at).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  )}
                </View>
              )}

              <View className="mt-2 space-y-3">
                <TouchableOpacity
                  className="w-full bg-gray-700 rounded-lg py-3 mb-2"
                  onPress={() => setShowEventDetailsModal(false)}
                >
                  <Text className="text-white text-center font-medium">Close</Text>
                </TouchableOpacity>
                
                {/* Edit/Delete Buttons for Parish Admins */}
                {isParishAdmin && selectedEvent?.created_by === user?.id && (
                  <View className="flex-row space-x-3">
                    <TouchableOpacity
                      className="flex-1 bg-blue-600 rounded-lg py-3 flex-row items-center justify-center mr-2"
                      onPress={() => {
                        if (!selectedEvent) return;
                        setCreateEventData({
                          title: selectedEvent.title || '',
                          description: selectedEvent.description || '',
                          event_type: selectedEvent.event_type,
                          event_date: selectedEvent.event_type !== 'announcement' ? (selectedEvent.event_date || '') : '',
                          event_time: selectedEvent.event_type !== 'announcement' ? (selectedEvent.event_time || '') : '',
                          location: selectedEvent.event_type !== 'announcement' ? (selectedEvent.location || '') : '',
                          contact_info: selectedEvent.contact_info || '',
                          volunteers_needed: selectedEvent.event_type === 'volunteer' ? (selectedEvent.volunteers_needed || undefined) : undefined
                        });
                        setNotifyParishioners(false);
                        setEditingEventId(selectedEvent.id);
                        setShowEventDetailsModal(false);
                        setShowCreateEventModal(true);
                      }}
                    >
                      <Ionicons name="pencil" size={16} color="white" />
                      <Text className="text-white text-center font-medium ml-2">Edit Post</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      className="flex-1 bg-red-600 rounded-lg py-3 flex-row items-center justify-center"
                      onPress={() => handleDeleteEvent(selectedEvent!.id)}
                    >
                      <Ionicons name="trash-outline" size={16} color="white" />
                      <Text className="text-white text-center font-medium ml-2">Delete Post</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}