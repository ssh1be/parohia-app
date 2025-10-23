import { Text, View, ScrollView, TouchableOpacity, ActivityIndicator, Modal, TextInput, Alert, Linking, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'
import { faDiamondTurnRight } from '@fortawesome/free-solid-svg-icons/faDiamondTurnRight'
import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { getUserProfile } from "../../services/onboardingService";
import { getParishByAdminId, getParishByUserId, updateParishCalendarId, updateParishPriestInfo, updateParishDonationSettings } from "../../services/parishService";
import { getParishes } from "../../services/onboardingService";
import { supabase } from "../../config/supabase";
import { PayPalService } from "../../services/paypalService";

interface Parish {
  id: string;
  name: string;
  jurisdiction: string;
  address: string;
  city: string;
  state: string;
  zip_code?: string;
  phone_number?: string;
  website?: string;
  email?: string;
  admin_user_id: string;
  is_verified: boolean;
  parish_calendar_id?: string;
  created_at: string;
  updated_at: string;
  priest_name?: string;
  priest_phone_number?: string;
  priest_email?: string;
  paypal_donation_url?: string;
  donation_enabled?: boolean;
  donation_message?: string;
}

interface ParishListItem {
  id: string;
  name: string;
  jurisdiction: string;
  city: string;
  state: string;
  is_verified: boolean;
}

export default function Parish() {
  const { user, signOut } = useAuth();
  const [parish, setParish] = useState<Parish | null>(null);
  const [loading, setLoading] = useState(true);
  const [isParishAdmin, setIsParishAdmin] = useState(false);
  const [showParishSelector, setShowParishSelector] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  
  // Parish selector state
  const [parishes, setParishes] = useState<ParishListItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedParishId, setSelectedParishId] = useState('');
  
  // Edit form state
  const [editForm, setEditForm] = useState({
    name: '',
    jurisdiction: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    phone_number: '',
    website: '',
    email: '',
    parish_calendar_id: ''
  });

  // Priest edit modal state
  const [showPriestEditModal, setShowPriestEditModal] = useState(false);
  const [priestEditLoading, setPriestEditLoading] = useState(false);
  const [priestForm, setPriestForm] = useState({
    priest_name: '',
    priest_phone_number: '',
    priest_email: ''
  });

  // Donation modal state
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [donationEditLoading, setDonationEditLoading] = useState(false);
  const [donationForm, setDonationForm] = useState({
    paypal_donation_url: '',
    donation_enabled: false,
    donation_message: ''
  });

  const fetchParishData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const profile = await getUserProfile(user.id);
      
      if (profile?.user_type === 'parish_admin') {
        setIsParishAdmin(true);
        const parishData = await getParishByAdminId(user.id);
        setParish(parishData);
        
        if (parishData) {
          setEditForm({
            name: parishData.name || '',
            jurisdiction: parishData.jurisdiction || '',
            address: parishData.address || '',
            city: parishData.city || '',
            state: parishData.state || '',
            zip_code: parishData.zip_code || '',
            phone_number: parishData.phone_number || '',
            website: parishData.website || '',
            email: parishData.email || '',
            parish_calendar_id: parishData.parish_calendar_id || ''
          });
        }
      } else if (profile?.user_type === 'regular_user') {
        const parishData = await getParishByUserId(user.id);
        setParish(parishData);
      }
    } catch (error) {
      console.error('Error fetching parish data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParishData();
  }, [user]);



  const handleParishChange = async () => {
    if (!selectedParishId || !user) return;
    
    try {
      // Remove existing connection
      if (parish) {
        await supabase
          .from('user_parish_connections')
          .delete()
          .eq('user_id', user.id);
      }
      
      // Add new connection
      const { error } = await supabase
        .from('user_parish_connections')
        .insert({
          user_id: user.id,
          parish_id: selectedParishId,
        });
      
      if (error) throw error;
      
      // Refresh parish data
      const newParish = await getParishByUserId(user.id);
      setParish(newParish);
      setShowParishSelector(false);
      setSelectedParishId('');
      setSearchQuery('');
      
      Alert.alert('Success', 'Parish changed successfully!');
    } catch (error) {
      console.error('Error changing parish:', error);
      Alert.alert('Error', 'Failed to change parish. Please try again.');
    }
  };

  const handleEditParish = async () => {
    if (!parish || !user) return;
    
    try {
      setEditLoading(true);
      
      const { error } = await supabase
        .from('parishes')
        .update({
          name: editForm.name,
          jurisdiction: editForm.jurisdiction,
          address: editForm.address,
          city: editForm.city,
          state: editForm.state,
          zip_code: editForm.zip_code || null,
          phone_number: editForm.phone_number || null,
          website: editForm.website || null,
          email: editForm.email || null,
          parish_calendar_id: editForm.parish_calendar_id || null,
        })
        .eq('id', parish.id);
      
      if (error) throw error;
      
      // Refresh parish data
      const updatedParish = await getParishByAdminId(user.id);
      setParish(updatedParish);
      setShowEditModal(false);
      
      Alert.alert('Success', 'Parish information updated successfully!');
    } catch (error) {
      console.error('Error updating parish:', error);
      Alert.alert('Error', 'Failed to update parish information. Please try again.');
    } finally {
      setEditLoading(false);
    }
  };

  const handleEditPriest = async () => {
    if (!parish || !user) return;
    
    try {
      setPriestEditLoading(true);
      
      const result = await updateParishPriestInfo(parish.id, {
        priest_name: priestForm.priest_name,
        priest_phone_number: priestForm.priest_phone_number,
        priest_email: priestForm.priest_email,
      });
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      // Refresh parish data
      const updatedParish = await getParishByAdminId(user.id);
      setParish(updatedParish);
      setShowPriestEditModal(false);
      
      Alert.alert('Success', 'Priest information updated successfully!');
    } catch (error) {
      console.error('Error updating priest info:', error);
      Alert.alert('Error', 'Failed to update priest information. Please try again.');
    } finally {
      setPriestEditLoading(false);
    }
  };

  const openParishSelector = async () => {
    try {
      console.log('Opening parish selector...');
      console.log('Current user:', user?.id);
      const parishesData = await getParishes();
      console.log('Fetched parishes:', parishesData);
      setParishes(parishesData);
      setShowParishSelector(true);
    } catch (error) {
      console.error('Error fetching parishes:', error);
      Alert.alert('Error', 'Failed to load parishes. Please try again.');
    }
  };

  const openPriestEditModal = () => {
    if (parish) {
      setPriestForm({
        priest_name: parish.priest_name || '',
        priest_phone_number: parish.priest_phone_number || '',
        priest_email: parish.priest_email || ''
      });
      setShowPriestEditModal(true);
    }
  };

  const openDonationEditModal = () => {
    if (parish) {
      setDonationForm({
        paypal_donation_url: parish.paypal_donation_url || '',
        donation_enabled: parish.donation_enabled || false,
        donation_message: parish.donation_message || ''
      });
      setShowDonationModal(true);
    }
  };

  const handleEditDonation = async () => {
    if (!parish || !user) return;
    
    try {
      setDonationEditLoading(true);
      
      // Validate PayPal donation URL if donation is enabled
      if (donationForm.donation_enabled && donationForm.paypal_donation_url) {
        if (!PayPalService.validatePayPalDonationUrl(donationForm.paypal_donation_url)) {
          Alert.alert('Error', 'Please enter a valid donation URL (e.g., https://www.paypal.com/donate/?token=...).');
          return;
        }
      }
      
      const result = await updateParishDonationSettings(parish.id, {
        paypal_donation_url: donationForm.paypal_donation_url,
        donation_enabled: donationForm.donation_enabled,
        donation_message: donationForm.donation_message,
      });
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      // Refresh parish data
      const updatedParish = await getParishByAdminId(user.id);
      setParish(updatedParish);
      setShowDonationModal(false);
      
      Alert.alert('Success', 'Donation settings updated successfully!');
    } catch (error) {
      console.error('Error updating donation settings:', error);
      Alert.alert('Error', 'Failed to update donation settings. Please try again.');
    } finally {
      setDonationEditLoading(false);
    }
  };

  const handleDonate = () => {
    if (parish?.paypal_donation_url && parish?.donation_enabled) {
      PayPalService.openPayPalDonation(
        parish.paypal_donation_url,
        parish.donation_message
      );
    }
  };

  const filteredParishes = parishes.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    `${p.city}, ${p.state}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  
  const handleCall = (phoneNumber: string) => {
    if (phoneNumber) {
      Linking.openURL(`tel:${phoneNumber}`);
    }
  };

  const handleSMS = (phoneNumber: string) => {
    if (phoneNumber) {
      Linking.openURL(`sms:${phoneNumber}`);
    }
  };

  const handleEmail = (email: string) => {
    if (email) {
      Linking.openURL(`mailto:${email}`);
    }
  };

  const handleWebsite = (website: string) => {
    if (website) {
      const url = website.startsWith('http') ? website : `https://${website}`;
      Linking.openURL(url);
    }
  };

  const handleAddress = (address: string, city: string, state: string, zipCode?: string) => {
    const fullAddress = `${address}, ${city}, ${state}${zipCode ? ` ${zipCode}` : ''}`;
    const encodedAddress = encodeURIComponent(fullAddress);
    
    // Use Apple Maps on iOS, Google Maps on Android
    const mapsUrl = Platform.OS === 'ios' 
      ? `http://maps.apple.com/?q=${encodedAddress}`
      : `https://maps.google.com/maps?q=${encodedAddress}`;
    
    Linking.openURL(mapsUrl);
  };

  const formatPhoneNumber = (phoneNumber: string) => {
    // Remove all non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // Format based on length
    if (cleaned.length === 10) {
      // (XXX) XXX-XXXX
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
      // 1 (XXX) XXX-XXXX
      return `1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    } else if (cleaned.length === 7) {
      // XXX-XXXX
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
    }
    
    // Return original if no pattern matches
    return phoneNumber;
  };

  if (loading) {
    return (
      <View className="flex-1 bg-black pt-0">
        <View className="p-6 bg-gradient-to-b from-gray-900 to-gray-800 border-b border-gray-800">
          <View className="flex-row justify-between items-center pt-4">
            <View>
              <Text className="text-3xl font-bold text-white">Parish</Text>
              <Text className="text-sm text-white opacity-70">Parish information</Text>
            </View>
          </View>
        </View>
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="white" />
          <Text className="text-white mt-4">Loading parish information...</Text>
        </View>
      </View>
    );
  }

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
          {/* Header */}
          <View className="p-6 bg-gradient-to-b from-gray-900 to-gray-800 border-b border-gray-800">
            <View className="flex-row justify-between items-center pt-4">
              <View>
                <Text className="text-3xl font-bold text-white">Parish</Text>
                <Text className="text-sm text-white opacity-70">
                  {parish?.name || 'No parish selected'}
                </Text>
              </View>
              <View className="h-10 w-10 rounded-full bg-transparent flex items-center justify-center">
                <Ionicons name="location" size={25} color="white" />
              </View>
            </View>
            
            {/* Parish Information Card */}
            {parish && (
              <View className="mt-6 rounded-xl shadow-md p-4 bg-gray-800/50">
                <View className="flex-row justify-between items-start mb-2">
                  <View className="flex-1">
                    <Text className="text-white text-lg font-bold">{parish.name}</Text>
                    <Text className="text-white text-xs font-light opacity-70">{parish.jurisdiction}</Text>
                  </View>
                  {!isParishAdmin && (
                    <TouchableOpacity
                      className="bg-red-600 rounded-lg px-3 py-1 mt-0.5"
                      onPress={openParishSelector}
                    >
                      <Text className="text-white text-xs font-medium">Change Parish</Text>
                    </TouchableOpacity>
                  )}
                  {isParishAdmin && (
                    <TouchableOpacity
                      className="bg-red-600 rounded-lg px-3 py-1"
                      onPress={() => setShowEditModal(true)}
                    >
                      <Text className="text-white text-xs font-medium">Edit</Text>
                    </TouchableOpacity>
                  )}
                </View>
                
                <View className="space-y-2 mt-3">
                  <TouchableOpacity 
                    className="flex-row items-center mb-1"
                    onPress={() => handleAddress(parish.address, parish.city, parish.state, parish.zip_code)}
                  >
                    <Ionicons name="location" size={12} color="white" style={{ opacity: 0.7, marginRight: 8 }} />
                    <Text className="text-white text-xs text-blue-400">
                      {parish.address}, {parish.city}, {parish.state} {parish.zip_code}
                    </Text>
                  </TouchableOpacity>
                  
                  {parish.phone_number && (
                    <TouchableOpacity 
                      className="flex-row items-center mb-1"
                      onPress={() => handleCall(parish.phone_number!)}
                    >
                      <Ionicons name="call" size={12} color="white" style={{ opacity: 0.7, marginRight: 8 }} />
                      <Text className="text-white text-xs text-blue-400">{formatPhoneNumber(parish.phone_number)}</Text>
                    </TouchableOpacity>
                  )}
                  
                  {parish.website && (
                    <TouchableOpacity 
                      className="flex-row items-center mb-1"
                      onPress={() => handleWebsite(parish.website!)}
                    >
                      <Ionicons name="globe" size={12} color="white" style={{ opacity: 0.7, marginRight: 8 }} />
                      <Text className="text-white text-xs text-blue-400">{parish.website}</Text>
                    </TouchableOpacity>
                  )}
                  
                  {parish.email && (
                    <TouchableOpacity 
                      className="flex-row items-center mb-1"
                      onPress={() => handleEmail(parish.email!)}
                    >
                      <Ionicons name="mail" size={12} color="white" style={{ opacity: 0.7, marginRight: 8 }} />
                      <Text className="text-white text-xs text-blue-400">{parish.email}</Text>
                    </TouchableOpacity>
                  )}
                </View>
                
                {/* Calendar Status */}
                <View className="mt-4 pt-3 border-t border-gray-700">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-white text-xs opacity-70">Calendar Status</Text>
                    <View className="flex-row items-center">
                      {parish.parish_calendar_id ? (
                        <>
                          <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                          <Text className="text-green-400 text-xs ml-1">Connected</Text>
                        </>
                      ) : (
                        <>
                          <Ionicons name="alert-circle" size={14} color="#F59E0B" />
                          <Text className="text-yellow-400 text-xs ml-1">Not Set Up</Text>
                        </>
                      )}
                    </View>
                  </View>
                </View>
              </View>
            )}
          </View>
          
          {/* Content Area */}
          <View className="flex-1 p-6 bg-gradient-to-b from-gray-800 to-gray-900">
            {!parish ? (
              <View className="flex-col items-center justify-center py-12">
                <View className="h-16 w-16 rounded-full bg-gray-700 flex items-center justify-center mb-4">
                  <Ionicons name="business" size={32} color="white" />
                </View>
                <Text className="text-white text-lg font-semibold mb-2 text-center">
                  No Parish Selected
                </Text>
                <Text className="text-white opacity-70 text-center mb-6 px-4">
                  Select a parish to view information and connect with your community.
                </Text>
                <TouchableOpacity
                  className="bg-red-600 rounded-lg px-6 py-3"
                  onPress={openParishSelector}
                >
                  <Text className="text-white font-medium">Select Parish</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                {/* Priest Information Section */}
                <View className="bg-gray-800/50 rounded-xl p-4 mb-6">
                  <View className="flex-row justify-between items-center mb-4">
                    <View className="flex-row items-center">
                      <Text className="text-white font-semibold">Priest Information</Text>
                    </View>
                    {isParishAdmin && (
                      <TouchableOpacity
                        className="bg-red-600 rounded-lg px-3 py-1"
                        onPress={openPriestEditModal}
                      >
                        <Text className="text-white text-xs font-medium">Edit</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  
                  {parish.priest_name ? (
                    <View className="space-y-2">
                      <View className="flex-row items-center">
                        <Ionicons name="person" size={16} color="white" style={{ marginRight: 8 }} />
                        <Text className="text-white font-normal flex-1">{parish.priest_name}</Text>
                        <View className="flex-row items-center space-x-2">
                          {parish.priest_phone_number && (
                            <TouchableOpacity 
                              className="bg-gray-600 rounded-full p-2 mr-2"
                              onPress={() => handleSMS(parish.priest_phone_number!)}
                            >
                              <Ionicons name="chatbubble" size={16} color="white" />
                            </TouchableOpacity>
                          )}
                          
                          {parish.priest_email && (
                            <TouchableOpacity 
                              className="bg-gray-600 rounded-full p-2"
                              onPress={() => handleEmail(parish.priest_email!)}
                            >
                              <Ionicons name="mail" size={16} color="white" />
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    </View>
                  ) : (
                    <View className="flex-col items-center justify-center py-4">
                      <Ionicons name="person-outline" size={24} color="white" style={{ opacity: 0.5, marginBottom: 8 }} />
                      <Text className="text-white opacity-50 text-sm text-center">
                        {isParishAdmin ? 'No priest information added yet' : 'No priest information available yet'}
                      </Text>
                      {isParishAdmin && (
                        <TouchableOpacity
                          className="bg-red-600 rounded-lg px-4 py-2 mt-3"
                          onPress={openPriestEditModal}
                        >
                          <Text className="text-white text-xs font-medium">Add Priest Info</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Donation Section */}
            <View className="bg-gray-800/50 rounded-xl p-4 mb-6">
              <View className="flex-row justify-between items-center mb-4">
                <View className="flex-row items-center">
                  <Text className="text-white font-semibold">Support Our Parish</Text>
                </View>
                {isParishAdmin && (
                  <TouchableOpacity
                    className="bg-red-600 rounded-lg px-3 py-1"
                    onPress={openDonationEditModal}
                  >
                    <Text className="text-white text-xs font-medium">Setup</Text>
                  </TouchableOpacity>
                )}
              </View>
              
              {parish?.donation_enabled && parish?.paypal_donation_url ? (
                <View className="space-y-3">
                  <Text className="text-white text-sm opacity-80 mb-4">
                    {parish.donation_message || 'Support our parish with a donation'}
                  </Text>
                  
                  <TouchableOpacity
                    className="bg-red-600 rounded-lg py-3 px-4 flex-row items-center justify-center mb-2"
                    onPress={handleDonate}
                  >
                    <Ionicons name="heart" size={16} color="white" style={{ marginRight: 8 }} />
                    <Text className="text-white font-medium">Donate Now</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View className="flex-col items-center justify-center py-4">
                  <Ionicons name="heart-outline" size={24} color="white" style={{ opacity: 0.5, marginBottom: 8 }} />
                  <Text className="text-white opacity-50 text-sm text-center">
                    {isParishAdmin ? 'Donation feature not set up yet' : 'Donation feature not available yet'}
                  </Text>
                  {isParishAdmin && (
                    <TouchableOpacity
                      className="bg-red-600 rounded-lg px-4 py-2 mt-3"
                      onPress={openDonationEditModal}
                    >
                      <Text className="text-white text-xs font-medium">Setup Donations</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          </View>
          
          {/* Sign Out Button */}
          <View className="p-6 bg-black">
            <TouchableOpacity
              // className="bg-red-600/20 border border-red-500/30 rounded-xl py-4 px-6 flex-row items-center justify-center"
              className="rounded-xl py-4 px-6 flex-row items-center justify-center"
              onPress={signOut}
            >
              <Ionicons name="log-out-outline" size={20} color="#ef4444" />
              <Text className="text-red-400 font-semibold ml-2">Sign Out</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>

      {/* Floating Directions Button */}
      {parish && (
        <View className="absolute bottom-6 right-6 z-50">
          <TouchableOpacity
            className="bg-red-600 rounded-full p-4 shadow-lg"
            onPress={() => handleAddress(parish.address, parish.city, parish.state, parish.zip_code)}
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
            <FontAwesomeIcon icon={faDiamondTurnRight} size={30} color="white" />
          </TouchableOpacity>
        </View>
      )}

      {/* Parish Selector Modal */}
      <Modal
        visible={showParishSelector}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowParishSelector(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/80 px-4">
          <View className="bg-gray-900 rounded-2xl p-6 w-full max-w-md shadow-lg border border-gray-700" style={{ maxHeight: '80%' }}>
            <View className="flex-row justify-between items-center mb-6">
              <View>
                <Text className="text-xl text-white font-bold">Select Parish</Text>
                <Text className="text-xs text-white opacity-60">({filteredParishes.length} parishes)</Text>
              </View>
              <TouchableOpacity onPress={() => setShowParishSelector(false)}>
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>

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
                className="w-full py-3 pl-4 pr-4 rounded-xl text-white font-medium bg-gray-800 border border-gray-700"
                placeholder="Search by parish name or location"
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {/* Parishes List */}
            <ScrollView 
              className="mb-6" 
              style={{ maxHeight: 300 }}
              showsVerticalScrollIndicator={true}
            >
              {filteredParishes.length === 0 ? (
                <View className="flex-col items-center justify-center py-8">
                  <Ionicons name="search" size={24} color="white" />
                  <Text className="text-white text-base font-medium mb-2 text-center mt-3">
                    No Results Found
                  </Text>
                  <Text className="text-white opacity-70 text-center text-sm">
                    Try adjusting your search terms
                  </Text>
                </View>
              ) : (
                <View className="space-y-4">
                  {filteredParishes.map((p) => (
                    <TouchableOpacity
                      key={p.id}
                      className="bg-gray-800 rounded-xl p-4 mb-2"
                      onPress={() => setSelectedParishId(p.id)}
                    >
                      <View className="flex-row justify-between items-center">
                        <View className="flex-1">
                          <View className="flex-row items-center">
                            <Text className="text-white font-medium">{p.name}</Text>
                            {p.is_verified && (
                              <View className="ml-2 flex-row items-center">
                                <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                                {/* <Text className="text-green-400 text-xs ml-1">Verified</Text> */}
                              </View>
                            )}
                          </View>
                          <Text className="text-white opacity-60 text-xs mt-1">
                            {p.city}, {p.state}
                          </Text>
                          {!p.is_verified && (
                            <Text className="text-yellow-400 text-xs mt-1">
                              Pending verification
                            </Text>
                          )}
                        </View>
                        <View className="h-5 w-5 rounded-full border-2 border-gray-600 flex items-center justify-center">
                          {selectedParishId === p.id && (
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
            <View className="flex-row space-x-3">
              <TouchableOpacity
                className="flex-1 bg-gray-700 rounded-lg py-3 mr-2"
                onPress={() => setShowParishSelector(false)}
              >
                <Text className="text-white text-center font-medium">Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                className={`flex-1 rounded-lg py-3 ${
                  !selectedParishId
                    ? 'bg-gray-600 opacity-50'
                    : 'bg-red-600'
                }`}
                onPress={handleParishChange}
                disabled={!selectedParishId}
              >
                <Text className={`text-center font-medium ${
                  !selectedParishId
                    ? 'text-gray-400'
                    : 'text-white'
                }`}>
                  {selectedParishId ? 'Change Parish' : 'Select Parish'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Parish Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditModal(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/80 px-4">
            <ScrollView 
              className="w-full max-w-md"
              contentContainerStyle={{ paddingVertical: 20, paddingBottom: 150, paddingTop: 50 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
            <View className="bg-gray-900 rounded-2xl p-6 shadow-lg border border-gray-700">
              <View className="flex-row justify-between items-center mb-6">
                <Text className="text-xl text-white font-bold">Edit Parish</Text>
                <TouchableOpacity onPress={() => setShowEditModal(false)}>
                  <Ionicons name="close" size={24} color="white" />
                </TouchableOpacity>
              </View>

              <View className="space-y-4">
                <View className="mb-2">
                  <Text className="text-gray-300 text-xs mb-2">Parish Name *</Text>
                  <TextInput
                    className="bg-gray-800 text-white p-3 rounded-lg border border-gray-600"
                    value={editForm.name}
                    onChangeText={(text) => setEditForm({...editForm, name: text})}
                    placeholder="Parish name"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>

                <View className="mb-2">
                  <Text className="text-gray-300 text-xs mb-2">Jurisdiction *</Text>
                  <TextInput
                    className="bg-gray-800 text-white p-3 rounded-lg border border-gray-600"
                    value={editForm.jurisdiction}
                    onChangeText={(text) => setEditForm({...editForm, jurisdiction: text})}
                    placeholder="e.g., Orthodox Church in America"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>

                <View className="mb-2">
                  <Text className="text-gray-300 text-xs mb-2">Address *</Text>
                  <TextInput
                    className="bg-gray-800 text-white p-3 rounded-lg border border-gray-600"
                    value={editForm.address}
                    onChangeText={(text) => setEditForm({...editForm, address: text})}
                    placeholder="Street address"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>

                <View className="flex-row space-x-2 mb-2">
                  <View className="flex-1 mr-2">
                    <Text className="text-gray-300 text-xs mb-2">City *</Text>
                    <TextInput
                      className="bg-gray-800 text-white p-3 rounded-lg border border-gray-600"
                      value={editForm.city}
                      onChangeText={(text) => setEditForm({...editForm, city: text})}
                      placeholder="City"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-300 text-xs mb-2">State *</Text>
                    <TextInput
                      className="bg-gray-800 text-white p-3 rounded-lg border border-gray-600"
                      value={editForm.state}
                      onChangeText={(text) => setEditForm({...editForm, state: text})}
                      placeholder="State"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                </View>

                <View className="mb-2">
                  <Text className="text-gray-300 text-xs mb-2">ZIP Code</Text>
                  <TextInput
                    className="bg-gray-800 text-white p-3 rounded-lg border border-gray-600"
                    value={editForm.zip_code}
                    onChangeText={(text) => setEditForm({...editForm, zip_code: text})}
                    placeholder="ZIP code"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                  />
                </View>

                <View className="mb-2">
                  <Text className="text-gray-300 text-xs mb-2">Phone Number</Text>
                  <TextInput
                    className="bg-gray-800 text-white p-3 rounded-lg border border-gray-600"
                    value={editForm.phone_number}
                    onChangeText={(text) => setEditForm({...editForm, phone_number: text})}
                    placeholder="Phone number"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="phone-pad"
                  />
                </View>

                <View className="mb-2">
                  <Text className="text-gray-300 text-xs mb-2">Website</Text>
                  <TextInput
                    className="bg-gray-800 text-white p-3 rounded-lg border border-gray-600"
                    value={editForm.website}
                    onChangeText={(text) => setEditForm({...editForm, website: text})}
                    placeholder="Website URL"
                    placeholderTextColor="#9CA3AF"
                    autoCapitalize="none"
                  />
                </View>

                <View className="mb-2">
                  <Text className="text-gray-300 text-xs mb-2">Email</Text>
                  <TextInput
                    className="bg-gray-800 text-white p-3 rounded-lg border border-gray-600"
                    value={editForm.email}
                    onChangeText={(text) => setEditForm({...editForm, email: text})}
                    placeholder="Email address"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                <View className="mb-6">
                  <Text className="text-gray-300 text-xs mb-2">Google Calendar ID</Text>
                  <TextInput
                    className="bg-gray-800 text-white p-3 rounded-lg border border-gray-600"
                    value={editForm.parish_calendar_id}
                    onChangeText={(text) => setEditForm({...editForm, parish_calendar_id: text})}
                    placeholder="parish@example.com"
                    placeholderTextColor="#9CA3AF"
                    autoCapitalize="none"
                  />
                  <Text className="text-gray-400 text-xs mt-1">
                    Email address associated with your parish's Google Calendar
                  </Text>
                </View>
              </View>

              <View className="flex-row space-x-3 mt-6">
                <TouchableOpacity
                  className="flex-1 bg-gray-700 rounded-lg py-3 mr-2"
                  onPress={() => setShowEditModal(false)}
                  disabled={editLoading}
                >
                  <Text className="text-white text-center font-medium">Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  className="flex-1 bg-red-600 rounded-lg py-3 flex-row items-center justify-center"
                  onPress={handleEditParish}
                  disabled={editLoading}
                >
                  {editLoading ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <Ionicons name="checkmark" size={20} color="white" />
                  )}
                  <Text className="text-white text-center font-medium ml-2">
                    {editLoading ? 'Saving...' : 'Save Changes'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Edit Priest Modal */}
      <Modal
        visible={showPriestEditModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPriestEditModal(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View className="flex-1 justify-center items-center bg-black/80 px-4">
            <View className="bg-gray-900 rounded-2xl p-6 w-full max-w-md shadow-lg border border-gray-700">
              <View className="flex-row justify-between items-center mb-6">
                <Text className="text-xl text-white font-bold">Edit Priest Information</Text>
                <TouchableOpacity onPress={() => setShowPriestEditModal(false)}>
                  <Ionicons name="close" size={24} color="white" />
                </TouchableOpacity>
              </View>

              <View className="space-y-4">
                <View className="mb-2">
                  <Text className="text-gray-300 text-xs mb-2">Priest Name</Text>
                  <TextInput
                    className="bg-gray-800 text-white p-3 rounded-lg border border-gray-600"
                    value={priestForm.priest_name}
                    onChangeText={(text) => setPriestForm({...priestForm, priest_name: text})}
                    placeholder="Priest's full name"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>

                <View className="mb-2">
                  <Text className="text-gray-300 text-xs mb-2">Phone Number</Text>
                  <TextInput
                    className="bg-gray-800 text-white p-3 rounded-lg border border-gray-600"
                    value={priestForm.priest_phone_number}
                    onChangeText={(text) => setPriestForm({...priestForm, priest_phone_number: text})}
                    placeholder="Phone number"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="phone-pad"
                  />
                </View>

                <View className="mb-6">
                  <Text className="text-gray-300 text-xs mb-2">Email</Text>
                  <TextInput
                    className="bg-gray-800 text-white p-3 rounded-lg border border-gray-600"
                    value={priestForm.priest_email}
                    onChangeText={(text) => setPriestForm({...priestForm, priest_email: text})}
                    placeholder="Email address"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <View className="flex-row space-x-3 mt-6">
                <TouchableOpacity
                  className="flex-1 bg-gray-700 rounded-lg py-3 mr-2"
                  onPress={() => setShowPriestEditModal(false)}
                  disabled={priestEditLoading}
                >
                  <Text className="text-white text-center font-medium">Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  className="flex-1 bg-red-600 rounded-lg py-3 flex-row items-center justify-center"
                  onPress={handleEditPriest}
                  disabled={priestEditLoading}
                >
                  {priestEditLoading ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <Ionicons name="checkmark" size={20} color="white" />
                  )}
                  <Text className="text-white text-center font-medium ml-2">
                    {priestEditLoading ? 'Saving...' : 'Save Changes'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Donation Settings Modal */}
      <Modal
        visible={showDonationModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDonationModal(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View className="flex-1 justify-center items-center bg-black/80 px-4">
            <View className="bg-gray-900 rounded-2xl p-6 w-full max-w-md shadow-lg border border-gray-700">
              <View className="flex-row justify-between items-center mb-6">
                <Text className="text-xl text-white font-bold">Setup Donations</Text>
                <TouchableOpacity onPress={() => setShowDonationModal(false)}>
                  <Ionicons name="close" size={24} color="white" />
                </TouchableOpacity>
              </View>

              <View className="space-y-4">
                <View className="mb-2">
                  <Text className="text-gray-300 text-xs mb-2">Enable Donations</Text>
                  <TouchableOpacity
                    className={`flex-row items-center p-3 rounded-lg border ${
                      donationForm.donation_enabled 
                        ? 'bg-red-600/20 border-red-500/50' 
                        : 'bg-gray-800 border-gray-600'
                    }`}
                    onPress={() => setDonationForm({
                      ...donationForm,
                      donation_enabled: !donationForm.donation_enabled
                    })}
                  >
                    <View className={`h-5 w-5 rounded border-2 mr-3 flex items-center justify-center ${
                      donationForm.donation_enabled 
                        ? 'border-red-500 bg-red-500' 
                        : 'border-gray-500'
                    }`}>
                      {donationForm.donation_enabled && (
                        <Ionicons name="checkmark" size={12} color="white" />
                      )}
                    </View>
                    <Text className="text-white">Enable donations</Text>
                  </TouchableOpacity>
                </View>

                {donationForm.donation_enabled && (
                  <>
                    <View className="mb-2">
                      <Text className="text-gray-300 text-xs mb-2">Donation URL *</Text>
                      <TextInput
                        className="bg-gray-800 text-white p-3 rounded-lg border border-gray-600"
                        value={donationForm.paypal_donation_url}
                        onChangeText={(text) => setDonationForm({...donationForm, paypal_donation_url: text})}
                        placeholder="e.g., https://www.paypal.com/donate/?token=..."
                        placeholderTextColor="#9CA3AF"
                        autoCapitalize="none"
                      />
                      <Text className="text-gray-400 text-xs mt-1">
                        Your donation page URL
                      </Text>
                    </View>

                    <View className="mb-6">
                      <Text className="text-gray-300 text-xs mb-2">Donation Message (Optional)</Text>
                      <TextInput
                        className="bg-gray-800 text-white p-3 rounded-lg border border-gray-600"
                        value={donationForm.donation_message}
                        onChangeText={(text) => setDonationForm({...donationForm, donation_message: text})}
                        placeholder="e.g., Thank you for supporting our parish"
                        placeholderTextColor="#9CA3AF"
                        multiline
                        numberOfLines={3}
                      />
                      <Text className="text-gray-400 text-xs mt-1">
                        This message will appear on the donation page
                      </Text>
                    </View>
                  </>
                )}
              </View>

              <View className="flex-row space-x-3 mt-6">
                <TouchableOpacity
                  className="flex-1 bg-gray-700 rounded-lg py-3 mr-2"
                  onPress={() => setShowDonationModal(false)}
                  disabled={donationEditLoading}
                >
                  <Text className="text-white text-center font-medium">Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  className="flex-1 bg-red-600 rounded-lg py-3 flex-row items-center justify-center"
                  onPress={handleEditDonation}
                  disabled={donationEditLoading}
                >
                  {donationEditLoading ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <Ionicons name="checkmark" size={20} color="white" />
                  )}
                  <Text className="text-white text-center font-medium ml-2">
                    {donationEditLoading ? 'Saving...' : 'Save Settings'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </KeyboardAvoidingView>
  );
} 