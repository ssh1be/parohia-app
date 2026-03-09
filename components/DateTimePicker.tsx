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
      {label ? <Text className="text-gray-600 dark:text-gray-300 text-sm mb-2">{label}</Text> : null}
      <Pressable
        className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg border border-gray-300 dark:border-gray-600 flex-row items-center justify-between active:opacity-70"
        onPress={() => setShowPicker(true)}
      >
        <Text className={`${value ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>
          {formatDisplayValue()}
        </Text>
        <Ionicons 
          name={mode === 'date' ? 'calendar-outline' : 'time-outline'} 
          size={20} 
          color="#9CA3AF" 
        />
      </Pressable>

      {showPicker && (
        <Modal
          visible={showPicker}
          transparent={true}
          animationType="slide"
        >
          <View className="flex-1 justify-center items-center bg-black/40 dark:bg-black/80 px-4">
            <View className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-sm border border-gray-200 dark:border-gray-700">
              <Text className="text-gray-900 dark:text-white text-lg font-semibold mb-4 text-center">
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
                  className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-lg py-3 mr-2 active:opacity-70"
                  onPress={handleCancel}
                >
                  <Text className="text-gray-900 dark:text-white text-center font-medium">Cancel</Text>
                </Pressable>
                
                <Pressable
                  className="flex-1 bg-red-600 rounded-lg py-3 active:opacity-70"
                  onPress={handleConfirm}
                >
                  <Text className="text-white text-center font-medium">Confirm</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
} 