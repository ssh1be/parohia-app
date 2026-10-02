import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, Modal, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import DateTimePicker from '@react-native-community/datetimepicker';

interface DateTimePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  mode: 'date' | 'time';
  label: string;
}

export default function CustomDateTimePicker({ 
  value, 
  onChange, 
  placeholder, 
  mode, 
  label 
}: DateTimePickerProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [showPicker, setShowPicker] = useState(false);
  
  // Parse date value properly to avoid timezone issues
  const parseDateValue = (dateString: string): Date => {
    if (!dateString) return new Date();
    
    // For date strings in YYYY-MM-DD format, parse them as local dates
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = dateString.split('-').map(Number);
      return new Date(year, month - 1, day); // month is 0-indexed
    }
    
    // For time strings in HH:mm format, create a date with that time
    if (dateString.match(/^\d{1,2}:\d{2}$/)) {
      const [hours, minutes] = dateString.split(':').map(Number);
      const date = new Date();
      date.setHours(hours, minutes, 0, 0);
      return date;
    }
    
    // For other formats, use the default Date constructor
    return new Date(dateString);
  };
  
  const [tempDate, setTempDate] = useState<Date>(parseDateValue(value));

  // Update tempDate when value changes
  useEffect(() => {
    setTempDate(parseDateValue(value));
  }, [value]);

  const handleConfirm = () => {
    if (mode === 'date') {
      // Use local date formatting to avoid timezone issues
      const year = tempDate.getFullYear();
      const month = String(tempDate.getMonth() + 1).padStart(2, '0');
      const day = String(tempDate.getDate()).padStart(2, '0');
      onChange(`${year}-${month}-${day}`);
    } else {
      onChange(tempDate.toTimeString().slice(0, 5));
    }
    setShowPicker(false);
  };

  const handleCancel = () => {
    setShowPicker(false);
  };

  const formatDisplayValue = () => {
    if (!value) return placeholder;
    
    if (mode === 'date') {
      // Use the same parsing logic to avoid timezone issues
      const parsedDate = parseDateValue(value);
      return parsedDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } else {
      // Format time in 12-hour format with AM/PM
      const parsedDate = parseDateValue(value);
      return parsedDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    }
  };

  return (
    <View>
      {label ? <Text className="font-sans-semibold text-[13px] text-gray-700 dark:text-gray-300 mb-2">{label}</Text> : null}
      <Pressable
        className="h-12 bg-gray-100 dark:bg-white/5 px-4 rounded-2xl border border-transparent dark:border-white/5 flex-row items-center justify-between active:opacity-70"
        onPress={() => setShowPicker(true)}
        accessibilityRole="button"
        accessibilityLabel={`${label || placeholder}: ${formatDisplayValue()}`}
      >
        <Text className={`font-sans text-[15px] ${value ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
          {formatDisplayValue()}
        </Text>
        <Ionicons 
          name={mode === 'date' ? 'calendar-outline' : 'time-outline'} 
          size={18} 
          color="#9CA3AF" 
        />
      </Pressable>

      {showPicker && (
        <Modal
          visible={showPicker}
          transparent={true}
          animationType="fade"
        >
          <View className="flex-1 justify-center items-center bg-black/50 dark:bg-black/70 px-6">
            <View className="bg-white dark:bg-gray-950 rounded-[28px] p-6 w-full max-w-sm border border-gray-100 dark:border-white/10">
              <Text className="font-display text-[26px] text-gray-900 dark:text-white mb-4 text-center">
                Select {mode === 'date' ? 'Date' : 'Time'}
              </Text>
              
              <View className="items-center mb-6">
                <DateTimePicker
                  value={tempDate}
                  mode={mode}
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, selectedDate) => {
                    if (selectedDate) {
                      setTempDate(selectedDate);
                    }
                  }}
                  style={{ 
                    backgroundColor: 'transparent',
                    width: Platform.OS === 'ios' ? 200 : '100%',
                    height: Platform.OS === 'ios' ? 200 : 50
                  }}
                  textColor={isDark ? 'white' : 'black'}
                />
              </View>

              <View className="flex-row space-x-3">
                <Pressable
                  className="flex-1 h-12 justify-center bg-gray-200/80 dark:bg-white/10 rounded-full mr-2 active:opacity-70"
                  onPress={handleCancel}
                >
                  <Text className="font-sans-semibold text-gray-900 dark:text-white text-center">Cancel</Text>
                </Pressable>
                
                <Pressable
                  className="flex-1 h-12 justify-center bg-red-600 rounded-full active:opacity-80"
                  onPress={handleConfirm}
                >
                  <Text className="font-sans-semibold text-white text-center">Confirm</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
} 