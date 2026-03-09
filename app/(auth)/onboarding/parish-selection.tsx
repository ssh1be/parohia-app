import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useOnboarding } from '../../../contexts/OnboardingContext';
import { getParishes } from '../../../services/onboardingService';

interface Parish {
  id: string;
  name: string;
  city: string;
  state: string;
  is_verified: boolean;
}

export default function ParishSelectionScreen() {
  const { data, updateData, previousStep } = useOnboarding();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [searchQuery, setSearchQuery] = useState('');
  const [parishes, setParishes] = useState<Parish[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedParishId, setSelectedParishId] = useState(data.selectedParishId || '');

  // Fetch parishes from Supabase
  useEffect(() => {
    const fetchParishes = async () => {
      try {
        console.log('Fetching parishes...');
        const parishesData = await getParishes();
        console.log('Parishes fetched:', parishesData);
        setParishes(parishesData);
      } catch (error) {
        console.error('Error fetching parishes:', error);
        // Fallback to empty array if fetch fails
        setParishes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchParishes();
  }, []);

  const handleComplete = () => {
    updateData({ selectedParishId });
    router.push('/onboarding/welcome-complete');
  };

  const handleSkip = () => {
    router.push('/onboarding/welcome-complete');
  };

  const filteredParishes = parishes.filter(parish =>
    parish.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    `${parish.city}, ${parish.state}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View className="flex-1 bg-gray-50 dark:bg-black">
      <View className="flex-1 px-6 pt-12">
        {/* Back and Title */}
        <View className="flex-row items-center mb-6">
          <Pressable 
            className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center active:opacity-70"
            onPress={previousStep}
          >
            <Ionicons name="arrow-back" size={16} color={isDark ? 'white' : '#374151'} />
          </Pressable>
          <Text className="ml-4 text-xl font-bold text-gray-900 dark:text-white">Find Your Parish</Text>
        </View>
        
        {/* Progress Indicator */}
        <View className="flex-row items-center justify-between mb-8">
          <View className="flex-1 h-1 rounded-full bg-red-500" />
          <View className="flex-1 h-1 rounded-full mx-1 bg-red-500" />
          <View className="flex-1 h-1 rounded-full bg-red-500" />
        </View>
        
        <Text className="text-gray-900 dark:text-white opacity-70 text-sm mb-6">Connect with your local Orthodox community</Text>
        
        {/* Search Bar */}
        <View className="relative mb-6">
          <TextInput
            className="w-full py-3 pl-10 pr-4 rounded-xl text-gray-900 dark:text-white font-medium bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
            placeholder="Search by parish name or location"
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <View style={{ position: 'absolute', left: 10, top: 10 }} pointerEvents="none">
            <Ionicons name="search" size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
          </View>
        </View>
        
        {/* Parishes List */}
        <ScrollView className="flex-1 mb-6">
          {loading ? (
            <View className="flex-row items-center justify-center py-8">
              <ActivityIndicator color={isDark ? 'white' : '#374151'} size="small" />
              <Text className="text-gray-900 dark:text-white text-sm ml-2">Loading parishes...</Text>
            </View>
          ) : parishes.length === 0 ? (
            <View className="flex-col items-center justify-center py-12">
              <View className="h-16 w-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mb-4">
                <Ionicons name="business" size={32} color={isDark ? 'white' : '#374151'} />
              </View>
              <Text className="text-gray-900 dark:text-white text-lg font-semibold mb-2 text-center">
                No Parishes Available
              </Text>
              <Text className="text-gray-900 dark:text-white opacity-70 text-center mb-4 px-4">
                There are currently no parishes in our database. You can skip this step and complete your registration.
              </Text>
              <Text className="text-gray-900 dark:text-white opacity-50 text-xs text-center px-4">
                Parishes will be added as parish administrators register their communities.
              </Text>
            </View>
          ) : filteredParishes.length === 0 ? (
            <View className="flex-col items-center justify-center py-8">
              <View className="h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mb-3">
                <Ionicons name="search" size={24} color={isDark ? 'white' : '#374151'} />
              </View>
              <Text className="text-gray-900 dark:text-white text-base font-medium mb-2 text-center">
                No Results Found
              </Text>
              <Text className="text-gray-900 dark:text-white opacity-70 text-center text-sm">
                Try adjusting your search terms
              </Text>
            </View>
          ) : (
            <View className="space-y-4">
              {filteredParishes.map((parish) => (
                <Pressable
                  key={parish.id}
                  className="bg-gray-100 dark:bg-gray-800 rounded-xl p-4 mb-2 active:opacity-70"
                  onPress={() => setSelectedParishId(parish.id)}
                >
                  <View className="flex-row justify-between items-center">
                    <View className="flex-1">
                      <View className="flex-row items-center">
                        <Text className="text-gray-900 dark:text-white font-medium">{parish.name}</Text>
                        {parish.is_verified && (
                          <View className="ml-2 flex-row items-center">
                            <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                            <Text className="text-green-400 text-xs ml-1">Verified</Text>
                          </View>
                        )}
                      </View>
                      <Text className="text-gray-900 dark:text-white opacity-60 text-xs mt-1">
                        {parish.city}, {parish.state}
                      </Text>
                      {!parish.is_verified && (
                        <Text className="text-yellow-400 text-xs mt-1">
                          Pending verification
                        </Text>
                      )}
                    </View>
                    <View className="h-5 w-5 rounded-full border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center">
                      {selectedParishId === parish.id && (
                        <View className="h-3 w-3 rounded-full bg-red-500" />
                      )}
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </ScrollView>
        
        {/* Info Note */}
        <View className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-500/30 rounded-xl p-4 mb-4">
          <View className="flex-row items-start">
            <Ionicons name="information-circle" size={20} color="#3B82F6" />
            <View className="ml-3 flex-1">
              <Text className="text-blue-700 dark:text-blue-400 font-semibold mb-1">Don't see your parish?</Text>
              <Text className="text-blue-600 dark:text-gray-300 text-sm">
                Let your parish priest or administrator know about Parohia so they can register.
              </Text>
            </View>
          </View>
        </View>

        {/* Buttons */}
        <Pressable
          className="w-full py-3.5 rounded-xl text-white font-medium bg-red-500 shadow-md mb-3 active:opacity-70"
          onPress={handleComplete}
        >
          <Text className="text-white font-medium text-center">Complete Registration</Text>
        </Pressable>
        
        <Pressable
          className="w-full py-3 active:opacity-70"
          onPress={handleSkip}
        >
          <Text className="text-gray-900 dark:text-white text-sm opacity-70 text-center">Skip for now</Text>
        </Pressable>
      </View>
    </View>
  );
} 