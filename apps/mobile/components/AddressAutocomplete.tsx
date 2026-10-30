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

type PlaceSuggestion = {
  placeId: string;
  primary: string;
  secondary: string;
};

const PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_CALENDAR_API_KEY;

function newSessionToken(): string {
  // Places session tokens only need to be unique per session; UUID shape is fine.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function componentOf(
  components: { longText?: string; shortText?: string; types?: string[] }[] | undefined,
  type: string,
  preferShort = false
): string {
  const match = components?.find((c) => c.types?.includes(type));
  if (!match) return '';
  return (preferShort ? match.shortText : match.longText) || match.longText || match.shortText || '';
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
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const sessionTokenRef = useRef(newSessionToken());
  const requestIdRef = useRef(0);

  const address = value !== undefined ? value : internalAddress;
  const setAddress = onChangeText || setInternalAddress;

  const searchAddresses = async (query: string) => {
    if (!query.trim() || query.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    if (!PLACES_API_KEY) {
      console.warn('AddressAutocomplete: EXPO_PUBLIC_GOOGLE_CALENDAR_API_KEY is missing');
      return;
    }

    const requestId = ++requestIdRef.current;
    setIsLoading(true);

    try {
      const response = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': PLACES_API_KEY,
        },
        body: JSON.stringify({
          input: query,
          includedRegionCodes: ['us'],
          sessionToken: sessionTokenRef.current,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error('Places autocomplete failed:', response.status, errText);
        return;
      }

      const data = await response.json();
      if (requestId !== requestIdRef.current) return;

      const next: PlaceSuggestion[] = (data.suggestions || [])
        .map((item: any) => {
          const prediction = item.placePrediction;
          if (!prediction?.placeId) return null;
          return {
            placeId: prediction.placeId as string,
            primary: prediction.structuredFormat?.mainText?.text || prediction.text?.text || '',
            secondary: prediction.structuredFormat?.secondaryText?.text || '',
          };
        })
        .filter(Boolean);

      setSuggestions(next);
      setShowSuggestions(next.length > 0);
    } catch (error) {
      console.error('Error fetching address suggestions:', error);
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  };

  const handleAddressChange = (text: string) => {
    setAddress(text);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      searchAddresses(text);
    }, 350);
  };

  const handleAddressSelect = async (suggestion: PlaceSuggestion) => {
    setAddress(suggestion.primary);
    setShowSuggestions(false);
    setSuggestions([]);
    setIsLoading(true);

    try {
      if (!PLACES_API_KEY) return;

      const response = await fetch(
        `https://places.googleapis.com/v1/places/${encodeURIComponent(suggestion.placeId)}?sessionToken=${encodeURIComponent(sessionTokenRef.current)}`,
        {
          headers: {
            'X-Goog-Api-Key': PLACES_API_KEY,
            'X-Goog-FieldMask': 'formattedAddress,addressComponents',
          },
        }
      );

      // End this billing session whether details succeeded or not
      sessionTokenRef.current = newSessionToken();

      if (!response.ok) {
        const errText = await response.text();
        console.error('Places details failed:', response.status, errText);
        onAddressSelect({ route: suggestion.primary });
        return;
      }

      const data = await response.json();
      const components = data.addressComponents as
        | { longText?: string; shortText?: string; types?: string[] }[]
        | undefined;

      const streetNumber = componentOf(components, 'street_number');
      const route = componentOf(components, 'route');
      const streetLine = [streetNumber, route].filter(Boolean).join(' ').trim();

      onAddressSelect({
        street_number: streetNumber,
        route: route || suggestion.primary,
        locality:
          componentOf(components, 'locality') ||
          componentOf(components, 'sublocality') ||
          componentOf(components, 'postal_town'),
        administrative_area_level_1: componentOf(components, 'administrative_area_level_1', true),
        postal_code: componentOf(components, 'postal_code'),
        country: componentOf(components, 'country', true),
      });

      if (streetLine || data.formattedAddress) {
        setAddress(streetLine || data.formattedAddress);
      }
    } catch (error) {
      console.error('Error getting address details:', error);
      sessionTokenRef.current = newSessionToken();
      onAddressSelect({
        route: suggestion.primary,
        locality: '',
        administrative_area_level_1: '',
        postal_code: '',
      });
    } finally {
      setIsLoading(false);
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
        <View className="mt-1.5 rounded-2xl overflow-hidden bg-white dark:bg-gray-900 border border-gray-100 dark:border-white/10">
          {suggestions.map((item, index) => (
            <Pressable
              key={item.placeId}
              className={`py-3 px-4 active:opacity-70 ${
                index < suggestions.length - 1 ? 'border-b border-gray-100 dark:border-white/5' : ''
              }`}
              onPress={() => handleAddressSelect(item)}
            >
              <Text className="font-sans text-[13px] leading-[18px] text-gray-900 dark:text-white">
                {item.primary}
              </Text>
              {!!item.secondary && (
                <Text className="font-sans text-[12px] leading-[16px] text-gray-500 dark:text-gray-400 mt-0.5">
                  {item.secondary}
                </Text>
              )}
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}
