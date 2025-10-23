import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface AddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

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
  placeholder = "Enter address",
  className = "",
  value,
  onChangeText,
  onClear
}: AddressAutocompleteProps) {
  const [internalAddress, setInternalAddress] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  
  // Use controlled value if provided, otherwise use internal state
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
      // Using a free geocoding service (Nominatim) for demo purposes
      // In production, you'd want to use Google Places API or similar
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=us&limit=5`
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
    
    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Debounce the search
    timeoutRef.current = setTimeout(() => {
      searchAddresses(text);
    }, 300);
  };

  const handleAddressSelect = async (suggestion: any) => {
    setAddress(suggestion.display_name);
    setShowSuggestions(false);
    setSuggestions([]);
    
    try {
      // Get detailed address information
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${suggestion.lat}&lon=${suggestion.lon}`
      );
      
      if (response.ok) {
        const data = await response.json();
        const addressData: AddressData = {};
        
        // Parse address components
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
      // Fallback: just use the display name
      onAddressSelect({
        route: suggestion.display_name,
        locality: '',
        administrative_area_level_1: '',
        postal_code: '',
      });
    }
  };

  const handleClear = () => {
    setAddress('');
    setShowSuggestions(false);
    setSuggestions([]);
    if (onClear) {
      onClear();
    }
  };

  return (
    <View className={`relative ${className}`}>
      <View className="relative">
        <TextInput
          className="w-full py-3 px-4 rounded-xl text-white font-medium bg-gray-800 border border-gray-700 pr-10"
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          value={address}
          onChangeText={handleAddressChange}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
        />
        {isLoading && (
          <View className="absolute right-3 top-3">
            <Ionicons name="refresh" size={16} color="white" style={{ opacity: 0.5 }} />
          </View>
        )}
      </View>
      
      {showSuggestions && suggestions.length > 0 && (
        <View className="absolute top-full left-0 right-0 z-50 mt-1 bg-gray-800 rounded-xl border border-gray-700 max-h-48">
          {suggestions.map((item, index) => (
            <TouchableOpacity
              key={item.place_id || index}
              className="py-3 px-4 border-b border-gray-700 bg-gray-800 first:rounded-t-xl last:rounded-b-xl last:border-b-0"
              onPress={() => handleAddressSelect(item)}
            >
              <Text className="text-white text-sm">{item.display_name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
} 