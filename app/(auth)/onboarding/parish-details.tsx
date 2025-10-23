import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useOnboarding } from '../../../contexts/OnboardingContext';
import AddressAutocomplete from '../../../components/AddressAutocomplete';



export default function ParishDetailsScreen() {
  const { data, updateData, previousStep } = useOnboarding();
  
  const [parishName, setParishName] = useState(data.parishName || '');
  const [jurisdiction, setJurisdiction] = useState(data.jurisdiction || '');
  const [address, setAddress] = useState(data.address || '');
  const [city, setCity] = useState(data.city || '');
  const [state, setState] = useState(data.state || '');
  const [zipCode, setZipCode] = useState(data.zipCode || '');
  const [parishPhoneNumber, setParishPhoneNumber] = useState(data.parishPhoneNumber || '');
  const [parishWebsite, setParishWebsite] = useState(data.parishWebsite || '');
  const [parishEmail, setParishEmail] = useState(data.parishEmail || '');

  const handleAddressSelect = (addressData: any) => {
    // Auto-fill the address fields based on the selected address
    if (addressData.street_number && addressData.route) {
      setAddress(`${addressData.street_number} ${addressData.route}`);
    } else if (addressData.route) {
      setAddress(addressData.route);
    }
    
    if (addressData.locality) {
      setCity(addressData.locality);
    }
    
    if (addressData.administrative_area_level_1) {
      setState(addressData.administrative_area_level_1);
    }
    
    if (addressData.postal_code) {
      setZipCode(addressData.postal_code);
    }
  };

  const clearAddressFields = () => {
    setAddress('');
    setCity('');
    setState('');
    setZipCode('');
  };

  const handleComplete = () => {
    if (!parishName.trim()) {
      Alert.alert('Error', 'Please enter your parish name');
      return;
    }
    
    if (!address.trim()) {
      Alert.alert('Error', 'Please enter your parish address');
      return;
    }
    
    if (!city.trim()) {
      Alert.alert('Error', 'Please enter your city');
      return;
    }
    
    if (!state.trim()) {
      Alert.alert('Error', 'Please enter your state');
      return;
    }
    
    updateData({
      parishName: parishName.trim(),
      jurisdiction,
      address: address.trim(),
      city: city.trim(),
      state: state.trim(),
      zipCode: zipCode.trim(),
      parishPhoneNumber: parishPhoneNumber.trim(),
      parishWebsite: parishWebsite.trim(),
      parishEmail: parishEmail.trim(),
    });
    
    router.push('/onboarding/welcome-complete');
  };

  return (
    <KeyboardAvoidingView 
      className="flex-1 bg-black"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView 
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-1 px-6 pt-12 pb-8">
        {/* Back and Title */}
        <View className="flex-row items-center mb-6">
          <TouchableOpacity 
            className="h-8 w-8 rounded-full bg-gray-800 flex items-center justify-center"
            onPress={previousStep}
          >
            <Ionicons name="arrow-back" size={16} color="white" />
          </TouchableOpacity>
          <Text className="ml-4 text-xl font-bold text-white">Parish Details</Text>
        </View>
        
        {/* Progress Indicator */}
        <View className="flex-row items-center justify-between mb-8">
          <View className="flex-1 h-1 rounded-full bg-red-600" />
          <View className="flex-1 h-1 rounded-full mx-1 bg-red-600" />
          <View className="flex-1 h-1 rounded-full bg-red-600" />
        </View>
        
        <Text className="text-white text-lg font-bold mb-6">Parish Information</Text>
        {/* Parish Form */}
        <View className="space-y-4">
          <View className="mb-2">
            <Text className="text-white text-sm font-medium mb-2">Parish Name</Text>
            <TextInput
              className="w-full py-3 px-4 rounded-xl text-white font-medium bg-gray-800 border border-gray-700"
              placeholder="St. Mary Orthodox Church"
              placeholderTextColor="#9CA3AF"
              value={parishName}
              onChangeText={setParishName}
            />
          </View>
          
          <View className="mb-2">
            <Text className="text-white text-sm font-medium mb-2">Jurisdiction</Text>
            <TextInput
              className="w-full py-3 px-4 rounded-xl text-white font-medium bg-gray-800 border border-gray-700"
              placeholder="Orthodox Church in America (OCA)"
              placeholderTextColor="#9CA3AF"
              value={jurisdiction}
              onChangeText={setJurisdiction}
            />
          </View>
          
          <View className="">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-white text-sm font-medium">Street Address</Text>
              {(address || city || state || zipCode) && (
                <TouchableOpacity
                  onPress={clearAddressFields}
                  className="px-2 py-1 rounded-lg bg-gray-700"
                >
                  <Text className="text-xs text-white opacity-70">Clear</Text>
                </TouchableOpacity>
              )}
            </View>
            <AddressAutocomplete
              onAddressSelect={handleAddressSelect}
              placeholder="123 Main St"
              className="mb-2"
              value={address}
              onChangeText={setAddress}
              onClear={clearAddressFields}
            />
          </View>
          
          <View className="flex-row space-x-3 mb-2">
            <View className="flex-1 mr-2">
              <Text className="text-white text-sm font-medium mb-2">City</Text>
              <TextInput
                className="w-full py-3 px-4 rounded-xl text-white font-medium bg-gray-800 border border-gray-700"
                placeholder="Portland"
                placeholderTextColor="#9CA3AF"
                value={city}
                onChangeText={setCity}
              />
            </View>
            <View className="flex-1">
              <Text className="text-white text-sm font-medium mb-2">State</Text>
              <TextInput
                className="w-full py-3 px-4 rounded-xl text-white font-medium bg-gray-800 border border-gray-700"
                placeholder="OR"
                placeholderTextColor="#9CA3AF"
                value={state}
                onChangeText={setState}
                maxLength={2}
                autoCapitalize="characters"
              />
            </View>
          </View>
          
          <View className="mb-2">
            <Text className="text-white text-sm font-medium mb-2">ZIP Code</Text>
            <TextInput
              className="w-full py-3 px-4 rounded-xl text-white font-medium bg-gray-800 border border-gray-700"
              placeholder="97201"
              placeholderTextColor="#9CA3AF"
              value={zipCode}
              onChangeText={setZipCode}
              keyboardType="numeric"
              maxLength={10}
            />
          </View>
          
          <View className="mb-2">
            <Text className="text-white text-sm font-medium mb-2">Parish Phone Number (Optional)</Text>
            <TextInput
              className="w-full py-3 px-4 rounded-xl text-white font-medium bg-gray-800 border border-gray-700"
              placeholder="(503) 123-4567"
              placeholderTextColor="#9CA3AF"
              value={parishPhoneNumber}
              onChangeText={setParishPhoneNumber}
              keyboardType="phone-pad"
            />
          </View>
          
          <View className="mb-2">
            <Text className="text-white text-sm font-medium mb-2">Parish Website (Optional)</Text>
            <TextInput
              className="w-full py-3 px-4 rounded-xl text-white font-medium bg-gray-800 border border-gray-700"
              placeholder="https://www.stmaryorthodox.org"
              placeholderTextColor="#9CA3AF"
              value={parishWebsite}
              onChangeText={setParishWebsite}
              keyboardType="url"
              autoCapitalize="none"
            />
          </View>
          
          <View className="mb-2">
            <Text className="text-white text-sm font-medium mb-2">Parish Email (Optional)</Text>
            <TextInput
              className="w-full py-3 px-4 rounded-xl text-white font-medium bg-gray-800 border border-gray-700"
              placeholder="info@stmaryorthodox.org"
              placeholderTextColor="#9CA3AF"
              value={parishEmail}
              onChangeText={setParishEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </View>
        
        <Text className="text-xs text-white opacity-70 mt-6 mb-6">
          Your parish will need to be verified before you can fully access administrator features. We'll guide you through this process after registration.
        </Text>
        
        <TouchableOpacity
          className="w-full py-3.5 rounded-xl text-white font-medium bg-red-600 shadow-md mb-8"
          onPress={handleComplete}
        >
          <Text className="text-white font-medium text-center">Complete Registration</Text>
        </TouchableOpacity>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
} 