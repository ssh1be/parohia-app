import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
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
    <View className="flex-1 bg-black">
      <View className="flex-1 px-6 pt-12">
        {/* Back and Title */}
        <View className="flex-row items-center mb-6">
          <TouchableOpacity 
            className="h-8 w-8 rounded-full bg-gray-800 flex items-center justify-center"
            onPress={previousStep}
          >
            <Ionicons name="arrow-back" size={16} color="white" />
          </TouchableOpacity>
          <Text className="ml-4 text-xl font-bold text-white">Find Your Parish</Text>
        </View>
        
        {/* Progress Indicator */}
        <View className="flex-row items-center justify-between mb-8">
          <View className="flex-1 h-1 rounded-full bg-red-500" />
          <View className="flex-1 h-1 rounded-full mx-1 bg-red-500" />
          <View className="flex-1 h-1 rounded-full bg-red-500" />
        </View>
        
        <Text className="text-white opacity-70 text-sm mb-6">Connect with your local Orthodox community</Text>
        
        {/* Search Bar */}
        <View className="relative mb-6">
          <Ionicons 
            name="search" 
            size={20} 
            color="white" 
            style={{ 
              position: 'absolute', 
              left: 12, 
              top: 14, 
              opacity: 0.5 
            }} 
          />
          <TextInput
            className="w-full py-3 pl-10 pr-4 rounded-xl text-white font-medium bg-gray-800 border border-gray-700"
            placeholder="Search by parish name or location"
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        
        {/* Parishes List */}
        <ScrollView className="flex-1 mb-6">
          {loading ? (
            <View className="flex-row items-center justify-center py-8">
              <ActivityIndicator color="white" size="small" />
              <Text className="text-white text-sm ml-2">Loading parishes...</Text>
            </View>
          ) : parishes.length === 0 ? (
            <View className="flex-col items-center justify-center py-12">
              <View className="h-16 w-16 rounded-full bg-gray-700 flex items-center justify-center mb-4">
                <Ionicons name="business" size={32} color="white" />
              </View>
              <Text className="text-white text-lg font-semibold mb-2 text-center">
                No Parishes Available
              </Text>
              <Text className="text-white opacity-70 text-center mb-4 px-4">
                There are currently no parishes in our database. You can skip this step and complete your registration.
              </Text>
              <Text className="text-white opacity-50 text-xs text-center px-4">
                Parishes will be added as parish administrators register their communities.
              </Text>
            </View>
          ) : filteredParishes.length === 0 ? (
            <View className="flex-col items-center justify-center py-8">
              <View className="h-12 w-12 rounded-full bg-gray-700 flex items-center justify-center mb-3">
                <Ionicons name="search" size={24} color="white" />
              </View>
              <Text className="text-white text-base font-medium mb-2 text-center">
                No Results Found
              </Text>
              <Text className="text-white opacity-70 text-center text-sm">
                Try adjusting your search terms
              </Text>
            </View>
          ) : (
            <View className="space-y-4">
              {filteredParishes.map((parish) => (
                <TouchableOpacity
                  key={parish.id}
                  className="bg-gray-800 rounded-xl p-4 mb-2"
                  onPress={() => setSelectedParishId(parish.id)}
                >
                  <View className="flex-row justify-between items-center">
                    <View className="flex-1">
                      <View className="flex-row items-center">
                        <Text className="text-white font-medium">{parish.name}</Text>
                        {parish.is_verified && (
                          <View className="ml-2 flex-row items-center">
                            <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                            <Text className="text-green-400 text-xs ml-1">Verified</Text>
                          </View>
                        )}
                      </View>
                      <Text className="text-white opacity-60 text-xs mt-1">
                        {parish.city}, {parish.state}
                      </Text>
                      {!parish.is_verified && (
                        <Text className="text-yellow-400 text-xs mt-1">
                          Pending verification
                        </Text>
                      )}
                    </View>
                    <View className="h-5 w-5 rounded-full border-2 border-gray-600 flex items-center justify-center">
                      {selectedParishId === parish.id && (
                        <View className="h-3 w-3 rounded-full bg-red-500" />
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
        
        {/* Buttons */}
        <TouchableOpacity
          className="w-full py-3.5 rounded-xl text-white font-medium bg-red-500 shadow-md mb-3"
          onPress={handleComplete}
        >
          <Text className="text-white font-medium text-center">Complete Registration</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          className="w-full py-3"
          onPress={handleSkip}
        >
          <Text className="text-white text-sm opacity-70 text-center">Skip for now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
} 