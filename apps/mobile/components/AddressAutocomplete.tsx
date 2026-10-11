import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { palette } from '../constants/theme';
import { useThemeColors } from './ui/useThemeColors';

interface AddressData {
  street_number?: string;
  route?: string;
  locality?: string;
  administrative_area_level_1?: string;
  postal_code?: string;
  country?: string;
}

interface AddressAutocompleteProps {
  onAddressSelect: (addressData: AddressData) => void;
  placeholder?: string;
  className?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  onClear?: () => void;
}

export default function AddressAutocomplete({
  onAddressSelect,
  placeholder = 'Enter address',
  className = '',
  value,
  onChangeText,
}: AddressAutocompleteProps) {
  const colors = useThemeColors();
  const [internalAddress, setInternalAddress] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const address = value !== undefined ? value : internalAddress;
  const setAddress = onChangeText || setInternalAddress;

  const searchAddresses = async (query: string) => {
    if (!query.trim() || query.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=us&limit=5`,
      );

      if (response.ok) {
        const data = await response.json();
        setSuggestions(data);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Error fetching address suggestions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddressChange = (text: string) => {
    setAddress(text);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      searchAddresses(text);
    }, 300);
  };

  const handleAddressSelect = async (suggestion: any) => {
    setAddress(suggestion.display_name);
    setShowSuggestions(false);
    setSuggestions([]);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${suggestion.lat}&lon=${suggestion.lon}`,
      );

      if (response.ok) {
        const data = await response.json();
        const addressData: AddressData = {};

        if (data.address) {
          addressData.street_number = data.address.house_number || '';
          addressData.route = data.address.road || '';
          addressData.locality = data.address.city || data.address.town || data.address.village || '';
          addressData.administrative_area_level_1 = data.address.state || '';
          addressData.postal_code = data.address.postcode || '';
          addressData.country = data.address.country || '';
        }

        onAddressSelect(addressData);
      }
    } catch (error) {
      console.error('Error getting address details:', error);
      onAddressSelect({
        route: suggestion.display_name,
        locality: '',
        administrative_area_level_1: '',
        postal_code: '',
      });
    }
  };

  return (
    <View className={`relative ${className}`}>
      <View
        className={`flex-row items-center h-12 rounded-2xl bg-gray-100 dark:bg-white/5 border px-4 ${
          focused ? 'border-red-500/70' : 'border-transparent dark:border-white/5'
        }`}
      >
        <TextInput
          className="flex-1 font-sans text-[15px] text-gray-900 dark:text-white"
          placeholder={placeholder}
          placeholderTextColor={palette.gray400}
          value={address}
          onChangeText={handleAddressChange}
          onFocus={() => {
            setFocused(true);
            if (suggestions.length > 0) setShowSuggestions(true);
          }}
          onBlur={() => setFocused(false)}
        />
        {isLoading && (
          <Ionicons name="refresh" size={16} color={colors.textMuted} style={{ opacity: 0.6 }} />
        )}
      </View>

      {showSuggestions && suggestions.length > 0 && (
        <View className="absolute top-full left-0 right-0 z-50 mt-1.5 rounded-2xl overflow-hidden bg-white dark:bg-gray-900 border border-gray-100 dark:border-white/10 max-h-48">
          {suggestions.map((item, index) => (
            <Pressable
              key={item.place_id || index}
              className={`py-3 px-4 active:opacity-70 ${
                index < suggestions.length - 1 ? 'border-b border-gray-100 dark:border-white/5' : ''
              }`}
              onPress={() => handleAddressSelect(item)}
            >
              <Text className="font-sans text-[13px] leading-[18px] text-gray-900 dark:text-white">
                {item.display_name}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}
