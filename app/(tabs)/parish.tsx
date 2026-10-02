import { Ionicons } from "@expo/vector-icons";
import { faDiamondTurnRight } from '@fortawesome/free-solid-svg-icons/faDiamondTurnRight';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { LinearGradient } from "expo-linear-gradient";
import { ReactNode, useEffect, useState } from "react";
import { Alert, Linking, Modal, Platform, Pressable, RefreshControl, Text, TextInput, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import GeneralSettings from "../../components/GeneralSettings";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { Field } from "../../components/ui/Field";
import { PressableScale } from "../../components/ui/PressableScale";
import { Reveal } from "../../components/ui/Reveal";
import { CompactHeader, LargeHeader, useScrollHeader } from "../../components/ui/ScreenHeader";
import { SectionHeader } from "../../components/ui/SectionHeader";
import { SettingsHeader } from "../../components/ui/Settings";
import { Sheet } from "../../components/ui/Sheet";
import { Skeleton } from "../../components/ui/Skeleton";
import { useThemeColors } from "../../components/ui/useThemeColors";
import { contentBottomPadding, entrance, palette } from "../../constants/theme";
import { supabase } from "../../config/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { getParishes, getUserProfile } from "../../services/onboardingService";
import { getParishByAdminId, getParishByUserId, updateParishDonationSettings, updateParishPriestInfo } from "../../services/parishService";
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
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const { scrollY, onScroll } = useScrollHeader();
  const { user, signOut } = useAuth();
  const [parish, setParish] = useState<Parish | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isParishAdmin, setIsParishAdmin] = useState(false);
  const [showParishSelector, setShowParishSelector] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [showGeneralSettings, setShowGeneralSettings] = useState(false);
  
  // Parish selector state
  const [parishes, setParishes] = useState<ParishListItem[]>([]);
  const [parishesLoading, setParishesLoading] = useState(false);
  const [animateParishRows, setAnimateParishRows] = useState(true);
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

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchParishData();
    } finally {
      setRefreshing(false);
    }
  };

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

  // Preloaded so the selector sheet can render its full list offscreen before sliding in.
  useEffect(() => {
    getParishes()
      .then(setParishes)
      .catch((error) => console.error('Error preloading parishes:', error));
  }, []);

  const openParishSelector = async () => {
    const hasList = parishes.length > 0;
    setAnimateParishRows(!hasList);
    setParishesLoading(!hasList);
    setShowParishSelector(true);
    try {
      // Re-rendering the list mid-entrance makes the sheet stutter, so fresh results wait for the slide-up to settle.
      const [parishesData] = await Promise.all([
        getParishes(),
        new Promise((resolve) => setTimeout(resolve, 520)),
      ]);
      setParishes(parishesData);
    } catch (error) {
      console.error('Error fetching parishes:', error);
      if (!hasList) {
        setShowParishSelector(false);
        Alert.alert('Error', 'Failed to load parishes. Please try again.');
      }
    } finally {
      setParishesLoading(false);
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

  const initials = (name: string) =>
    name
      .replace(/^(Fr\.?|Father|Rev\.?|V\. Rev\.?|Very Rev\.?|Archpriest|Protopresbyter)\s+/i, '')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('');

  const quickActions: { key: string; label: string; icon: ReactNode; onPress: () => void }[] = parish
    ? [
        {
          key: 'directions',
          label: 'Directions',
          icon: <FontAwesomeIcon icon={faDiamondTurnRight} size={18} color="white" />,
          onPress: () => handleAddress(parish.address, parish.city, parish.state, parish.zip_code),
        },
        ...(parish.phone_number
          ? [{ key: 'call', label: 'Call', icon: <Ionicons name="call" size={18} color={colors.icon} />, onPress: () => handleCall(parish.phone_number!) }]
          : []),
        ...(parish.website
          ? [{ key: 'web', label: 'Website', icon: <Ionicons name="globe-outline" size={18} color={colors.icon} />, onPress: () => handleWebsite(parish.website!) }]
          : []),
        ...(parish.email
          ? [{ key: 'email', label: 'Email', icon: <Ionicons name="mail-outline" size={18} color={colors.icon} />, onPress: () => handleEmail(parish.email!) }]
          : []),
      ]
    : [];

  const InfoRow = ({ icon, label, value, onPress, first }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string; onPress: () => void; first?: boolean }) => (
    <Pressable
      onPress={onPress}
      accessibilityRole="link"
      className={`flex-row items-center px-4 py-3.5 active:bg-gray-50 dark:active:bg-white/5 ${first ? '' : 'border-t border-gray-100 dark:border-white/[0.06]'}`}
    >
      <View className="h-9 w-9 rounded-xl bg-gray-100 dark:bg-white/[0.06] items-center justify-center mr-3">
        <Ionicons name={icon} size={16} color={colors.icon} />
      </View>
      <View className="flex-1">
        <Text className="font-sans-medium text-[11px] text-gray-500 dark:text-gray-400">{label}</Text>
        <Text className="font-sans-semibold text-[14px] text-gray-900 dark:text-white mt-0.5" numberOfLines={2}>{value}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.textFaint} />
    </Pressable>
  );

  return (
    <View className="flex-1 bg-gray-50 dark:bg-black">
      <CompactHeader title={parish?.name || 'Parish'} scrollY={scrollY} />
      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top, paddingBottom: contentBottomPadding(insets.bottom) }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.textMuted}
            colors={[palette.accent]}
            progressViewOffset={insets.top}
          />
        }
      >
        <LargeHeader scrollY={scrollY} title="Parish" subtitle={loading ? undefined : parish ? 'Your spiritual home' : 'No parish selected'} />

        {loading ? (
          <View className="px-5 mt-3">
            <View className="rounded-[28px] p-6 bg-white dark:bg-white/[0.04]">
              <Skeleton width="75%" height={30} />
              <Skeleton width="45%" height={13} className="mt-3" />
              <View className="flex-row mt-6">
                {[0, 1, 2, 3].map((i) => <Skeleton key={i} width={56} height={56} radius={18} className="mr-3" />)}
              </View>
            </View>
            <Skeleton height={180} radius={24} className="mt-5" />
          </View>
        ) : !parish ? (
          <View className="px-5 mt-6">
            <EmptyState
              icon="business-outline"
              title="No parish selected"
              message="Select a parish to view information and connect with your community."
              action={<Button label="Select parish" icon="search" onPress={openParishSelector} />}
            />
          </View>
        ) : (
          <>
            {/* Hero */}
            <Reveal index={1} style={{ paddingHorizontal: 20, marginTop: 12 }}>
              <View className="rounded-[28px] overflow-hidden border border-red-100 dark:border-red-500/15">
                <LinearGradient
                  colors={colors.isDark ? ['#1C0A0B', '#0A0A0D'] : ['#FFFFFF', '#FEF2F2']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ padding: 22 }}
                >
                  <View className="flex-row items-start justify-between">
                    <Text className="flex-1 pr-3 font-display text-[32px] leading-[35px] text-gray-900 dark:text-white">{parish.name}</Text>
                    <Button
                      label={isParishAdmin ? 'Edit' : 'Change'}
                      icon={isParishAdmin ? 'create-outline' : 'swap-horizontal'}
                      variant="secondary"
                      size="sm"
                      onPress={isParishAdmin ? () => setShowEditModal(true) : openParishSelector}
                    />
                  </View>
                  <View className="flex-row items-center mt-2">
                    <Text className="flex-shrink font-sans-medium text-[13px] leading-[18px] text-gray-500 dark:text-gray-400">
                      {parish.jurisdiction}
                    </Text>
                    {parish.is_verified && (
                      <Ionicons name="checkmark-circle" size={14} color={palette.green} style={{ marginLeft: 8 }} />
                    )}
                  </View>

                  <View className="flex-row mt-6">
                    {quickActions.map((action, i) => (
                      <PressableScale
                        key={action.key}
                        onPress={action.onPress}
                        scaleTo={0.92}
                        haptic
                        accessibilityRole="button"
                        accessibilityLabel={action.label}
                        style={{ marginRight: i < quickActions.length - 1 ? 14 : 0 }}
                        className="items-center"
                      >
                        <View
                          className={`h-14 w-14 rounded-[18px] items-center justify-center ${
                            i === 0 ? 'bg-red-600' : 'bg-white dark:bg-white/10 border border-gray-100 dark:border-white/10'
                          }`}
                        >
                          {action.icon}
                        </View>
                        <Text className="font-sans-semibold text-[11px] text-gray-600 dark:text-gray-300 mt-1.5">{action.label}</Text>
                      </PressableScale>
                    ))}
                  </View>
                </LinearGradient>
              </View>
            </Reveal>

            {/* Contact details */}
            <Reveal index={2} style={{ paddingHorizontal: 20, marginTop: 28 }}>
              <SectionHeader title="Visit & contact" />
              <View className="rounded-3xl bg-white dark:bg-white/[0.04] border border-gray-100 dark:border-white/[0.06] overflow-hidden">
                <InfoRow
                  first
                  icon="location-outline"
                  label="Address"
                  value={`${parish.address}, ${parish.city}, ${parish.state} ${parish.zip_code ?? ''}`.trim()}
                  onPress={() => handleAddress(parish.address, parish.city, parish.state, parish.zip_code)}
                />
                {parish.phone_number && (
                  <InfoRow icon="call-outline" label="Phone" value={formatPhoneNumber(parish.phone_number)} onPress={() => handleCall(parish.phone_number!)} />
                )}
                {parish.website && (
                  <InfoRow icon="globe-outline" label="Website" value={parish.website} onPress={() => handleWebsite(parish.website!)} />
                )}
                {parish.email && (
                  <InfoRow icon="mail-outline" label="Email" value={parish.email} onPress={() => handleEmail(parish.email!)} />
                )}
                <View className="flex-row items-center justify-between px-4 py-3.5 border-t border-gray-100 dark:border-white/[0.06]">
                  <Text className="font-sans-medium text-[13px] text-gray-500 dark:text-gray-400">Parish calendar</Text>
                  {parish.parish_calendar_id ? (
                    <View className="flex-row items-center rounded-full px-2.5 py-1 bg-emerald-500/10">
                      <Ionicons name="checkmark-circle" size={13} color={palette.green} />
                      <Text className="font-sans-bold text-[11px] text-emerald-600 dark:text-emerald-400 ml-1">Connected</Text>
                    </View>
                  ) : (
                    <View className="flex-row items-center rounded-full px-2.5 py-1 bg-amber-500/10">
                      <Ionicons name="alert-circle" size={13} color={palette.amber} />
                      <Text className="font-sans-bold text-[11px] text-amber-600 dark:text-amber-400 ml-1">Not set up</Text>
                    </View>
                  )}
                </View>
              </View>
            </Reveal>

            {/* Clergy */}
            <Reveal index={3} style={{ paddingHorizontal: 20, marginTop: 28 }}>
              <SectionHeader
                title="Clergy"
                actionLabel={isParishAdmin ? 'Edit' : undefined}
                actionIcon={isParishAdmin ? 'create-outline' : undefined}
                onAction={isParishAdmin ? openPriestEditModal : undefined}
              />
              {parish.priest_name ? (
                <View className="rounded-3xl p-5 bg-white dark:bg-white/[0.04] border border-gray-100 dark:border-white/[0.06] flex-row items-center">
                  <View className="h-14 w-14 rounded-full bg-red-600/10 items-center justify-center mr-4">
                    <Text className="font-display text-[22px] text-red-600 dark:text-red-400">{initials(parish.priest_name) || 'Fr'}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="font-display text-[22px] leading-[26px] text-gray-900 dark:text-white">{parish.priest_name}</Text>
                    <Text className="font-sans-medium text-xs text-gray-500 dark:text-gray-400 mt-0.5">Parish priest</Text>
                  </View>
                  {parish.priest_phone_number && (
                    <PressableScale
                      onPress={() => handleSMS(parish.priest_phone_number!)}
                      scaleTo={0.9}
                      accessibilityRole="button"
                      accessibilityLabel={`Message ${parish.priest_name}`}
                      style={{ marginLeft: 8 }}
                      className="h-11 w-11 rounded-full bg-gray-100 dark:bg-white/10 items-center justify-center"
                    >
                      <Ionicons name="chatbubble" size={17} color={colors.icon} />
                    </PressableScale>
                  )}
                  {parish.priest_email && (
                    <PressableScale
                      onPress={() => handleEmail(parish.priest_email!)}
                      scaleTo={0.9}
                      accessibilityRole="button"
                      accessibilityLabel={`Email ${parish.priest_name}`}
                      style={{ marginLeft: 8 }}
                      className="h-11 w-11 rounded-full bg-gray-100 dark:bg-white/10 items-center justify-center"
                    >
                      <Ionicons name="mail" size={17} color={colors.icon} />
                    </PressableScale>
                  )}
                </View>
              ) : (
                <EmptyState
                  compact
                  icon="person-outline"
                  title={isParishAdmin ? 'No priest information added yet' : 'No priest information available yet'}
                  action={isParishAdmin ? <Button label="Add priest info" size="sm" onPress={openPriestEditModal} /> : undefined}
                />
              )}
            </Reveal>
          </>
        )}

        {/* Donations */}
        {!loading && (
          <Reveal index={4} style={{ paddingHorizontal: 20, marginTop: 28 }}>
            <SectionHeader
              title="Support our parish"
              actionLabel={isParishAdmin ? 'Setup' : undefined}
              actionIcon={isParishAdmin ? 'settings-outline' : undefined}
              onAction={isParishAdmin ? openDonationEditModal : undefined}
            />
            {parish?.donation_enabled && parish?.paypal_donation_url ? (
              <View className="rounded-3xl overflow-hidden">
                <LinearGradient colors={['#DC2626', '#991B1B']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 22 }}>
                  <Ionicons name="heart" size={22} color="rgba(255,255,255,0.9)" />
                  <Text className="font-display text-[24px] leading-[29px] text-white mt-3">
                    {parish.donation_message || 'Support our parish with a donation'}
                  </Text>
                  <PressableScale
                    onPress={handleDonate}
                    haptic
                    accessibilityRole="button"
                    style={{ marginTop: 18, alignSelf: 'flex-start' }}
                    className="h-11 px-5 rounded-full bg-white flex-row items-center"
                  >
                    <Text className="font-sans-bold text-[15px] text-red-700">Donate now</Text>
                    <Ionicons name="arrow-forward" size={15} color={palette.accent} style={{ marginLeft: 6 }} />
                  </PressableScale>
                </LinearGradient>
              </View>
            ) : (
              <EmptyState
                compact
                icon="heart-outline"
                title={isParishAdmin ? 'Donations not set up yet' : 'Donations not available yet'}
                action={isParishAdmin ? <Button label="Set up donations" size="sm" onPress={openDonationEditModal} /> : undefined}
              />
            )}
          </Reveal>
        )}

        {/* Account */}
        <View className="px-5 mt-10">
          <View className="rounded-3xl bg-white dark:bg-white/[0.04] border border-gray-100 dark:border-white/[0.06] overflow-hidden">
            <Pressable
              onPress={() => setShowGeneralSettings(true)}
              accessibilityRole="button"
              className="flex-row items-center px-4 py-4 active:bg-gray-50 dark:active:bg-white/5"
            >
              <View className="h-9 w-9 rounded-xl bg-gray-100 dark:bg-white/[0.06] items-center justify-center mr-3">
                <Ionicons name="settings-outline" size={17} color={colors.icon} />
              </View>
              <Text className="font-sans-semibold text-[15px] text-gray-900 dark:text-white flex-1">General settings</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textFaint} />
            </Pressable>
            <Pressable
              onPress={signOut}
              accessibilityRole="button"
              className="flex-row items-center px-4 py-4 border-t border-gray-100 dark:border-white/[0.06] active:bg-gray-50 dark:active:bg-white/5"
            >
              <View className="h-9 w-9 rounded-xl bg-red-600/10 items-center justify-center mr-3">
                <Ionicons name="log-out-outline" size={17} color={palette.accentSoft} />
              </View>
              <Text className="font-sans-semibold text-[15px] text-red-600 dark:text-red-400 flex-1">Sign out</Text>
            </Pressable>
          </View>
        </View>
      </Animated.ScrollView>

      {/* Parish selector */}
      <Sheet
        visible={showParishSelector}
        onClose={() => setShowParishSelector(false)}
        eyebrow="Find your parish"
        title="Select parish"
        subtitle={parishesLoading ? 'Loading parishes' : `${filteredParishes.length} parishes`}
        footer={
          <View className="flex-row">
            <Button label="Cancel" variant="secondary" onPress={() => setShowParishSelector(false)} style={{ flex: 1, marginRight: 8 }} />
            <Button
              label={selectedParishId ? 'Change parish' : 'Select parish'}
              disabled={!selectedParishId}
              onPress={handleParishChange}
              style={{ flex: 1 }}
            />
          </View>
        }
      >
        <View className="flex-row items-center h-12 rounded-2xl px-4 mb-4 bg-gray-100 dark:bg-white/5">
          <Ionicons name="search" size={17} color={palette.gray400} />
          <TextInput
            className="flex-1 font-sans text-[15px] text-gray-900 dark:text-white ml-2.5"
            placeholder="Search by parish name or location"
            placeholderTextColor={palette.gray400}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
            accessibilityLabel="Search parishes"
          />
          {!!searchQuery && (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={8} accessibilityLabel="Clear search">
              <Ionicons name="close-circle" size={17} color={palette.gray400} />
            </Pressable>
          )}
        </View>

        {parishesLoading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <View key={i} style={{ marginBottom: 8 }}>
              <Skeleton height={68} radius={16} />
            </View>
          ))
        ) : filteredParishes.length === 0 ? (
          <EmptyState compact icon="search" title="No results found" message="Try adjusting your search terms." />
        ) : (
          filteredParishes.map((p, i) => {
            const active = selectedParishId === p.id;
            return (
              <Animated.View key={p.id} entering={animateParishRows && i < 12 ? entrance.card(i * 35) : undefined}>
              <Pressable
                onPress={() => setSelectedParishId(p.id)}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                className={`flex-row items-center rounded-2xl p-4 mb-2 border ${
                  active ? 'bg-red-600/[0.06] border-red-500/40' : 'bg-gray-50 dark:bg-white/[0.04] border-transparent'
                }`}
              >
                <View className="flex-1">
                  <View className="flex-row items-center">
                    <Text className="font-sans-semibold text-[15px] text-gray-900 dark:text-white flex-shrink">{p.name}</Text>
                    {p.is_verified && <Ionicons name="checkmark-circle" size={14} color={palette.green} style={{ marginLeft: 6 }} />}
                  </View>
                  <Text className="font-sans text-xs text-gray-500 dark:text-gray-400 mt-0.5">{p.city}, {p.state}</Text>
                  {!p.is_verified && (
                    <Text className="font-sans-medium text-xs text-amber-600 dark:text-amber-400 mt-0.5">Pending verification</Text>
                  )}
                </View>
                <View className={`h-5 w-5 rounded-full border-2 items-center justify-center ${active ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}>
                  {active && <Animated.View entering={entrance.pop()} style={{ height: 10, width: 10, borderRadius: 5, backgroundColor: palette.accentSoft }} />}
                </View>
              </Pressable>
              </Animated.View>
            );
          })
        )}
      </Sheet>

      {/* Edit parish */}
      <Sheet
        visible={showEditModal}
        onClose={() => setShowEditModal(false)}
        eyebrow="Parish details"
        title="Edit parish"
        footer={
          <View className="flex-row">
            <Button label="Cancel" variant="secondary" onPress={() => setShowEditModal(false)} disabled={editLoading} style={{ flex: 1, marginRight: 8 }} />
            <Button label={editLoading ? 'Saving…' : 'Save changes'} icon="checkmark" loading={editLoading} onPress={handleEditParish} style={{ flex: 1 }} />
          </View>
        }
      >
        <Field label="Parish name" required value={editForm.name} onChangeText={(text) => setEditForm({...editForm, name: text})} placeholder="Parish name" />
        <Field label="Jurisdiction" required value={editForm.jurisdiction} onChangeText={(text) => setEditForm({...editForm, jurisdiction: text})} placeholder="e.g., Orthodox Church in America" />
        <Field label="Address" required value={editForm.address} onChangeText={(text) => setEditForm({...editForm, address: text})} placeholder="Street address" />
        <View className="flex-row">
          <Field containerClassName="flex-1 mr-2" label="City" required value={editForm.city} onChangeText={(text) => setEditForm({...editForm, city: text})} placeholder="City" />
          <Field containerClassName="flex-1" label="State" required value={editForm.state} onChangeText={(text) => setEditForm({...editForm, state: text})} placeholder="State" />
        </View>
        <Field label="ZIP code" value={editForm.zip_code} onChangeText={(text) => setEditForm({...editForm, zip_code: text})} placeholder="ZIP code" keyboardType="numeric" />
        <Field label="Phone number" value={editForm.phone_number} onChangeText={(text) => setEditForm({...editForm, phone_number: text})} placeholder="Phone number" keyboardType="phone-pad" />
        <Field label="Website" value={editForm.website} onChangeText={(text) => setEditForm({...editForm, website: text})} placeholder="Website URL" autoCapitalize="none" />
        <Field label="Email" value={editForm.email} onChangeText={(text) => setEditForm({...editForm, email: text})} placeholder="Email address" keyboardType="email-address" autoCapitalize="none" />
        <Field
          label="Google Calendar ID"
          value={editForm.parish_calendar_id}
          onChangeText={(text) => setEditForm({...editForm, parish_calendar_id: text})}
          placeholder="parish@example.com"
          autoCapitalize="none"
          helper="Email address associated with your parish's Google Calendar"
        />
      </Sheet>

      {/* Edit priest */}
      <Sheet
        visible={showPriestEditModal}
        onClose={() => setShowPriestEditModal(false)}
        eyebrow="Clergy"
        title="Edit priest information"
        footer={
          <View className="flex-row">
            <Button label="Cancel" variant="secondary" onPress={() => setShowPriestEditModal(false)} disabled={priestEditLoading} style={{ flex: 1, marginRight: 8 }} />
            <Button label={priestEditLoading ? 'Saving…' : 'Save changes'} icon="checkmark" loading={priestEditLoading} onPress={handleEditPriest} style={{ flex: 1 }} />
          </View>
        }
      >
        <Field label="Priest name" value={priestForm.priest_name} onChangeText={(text) => setPriestForm({...priestForm, priest_name: text})} placeholder="Priest's full name" />
        <Field label="Phone number" value={priestForm.priest_phone_number} onChangeText={(text) => setPriestForm({...priestForm, priest_phone_number: text})} placeholder="Phone number" keyboardType="phone-pad" />
        <Field label="Email" value={priestForm.priest_email} onChangeText={(text) => setPriestForm({...priestForm, priest_email: text})} placeholder="Email address" keyboardType="email-address" autoCapitalize="none" />
      </Sheet>

      {/* Donation settings */}
      <Sheet
        visible={showDonationModal}
        onClose={() => setShowDonationModal(false)}
        eyebrow="Giving"
        title="Set up donations"
        footer={
          <View className="flex-row">
            <Button label="Cancel" variant="secondary" onPress={() => setShowDonationModal(false)} disabled={donationEditLoading} style={{ flex: 1, marginRight: 8 }} />
            <Button label={donationEditLoading ? 'Saving…' : 'Save settings'} icon="checkmark" loading={donationEditLoading} onPress={handleEditDonation} style={{ flex: 1 }} />
          </View>
        }
      >
        <Pressable
          onPress={() => setDonationForm({ ...donationForm, donation_enabled: !donationForm.donation_enabled })}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: donationForm.donation_enabled }}
          className={`flex-row items-center rounded-2xl p-4 mb-5 border ${
            donationForm.donation_enabled ? 'bg-red-600/[0.06] border-red-500/40' : 'bg-gray-50 dark:bg-white/[0.04] border-transparent'
          }`}
        >
          <View className={`h-6 w-6 rounded-lg border-2 mr-3 items-center justify-center ${
            donationForm.donation_enabled ? 'border-red-500 bg-red-500' : 'border-gray-300 dark:border-gray-600'
          }`}>
            {donationForm.donation_enabled && <Ionicons name="checkmark" size={14} color="white" />}
          </View>
          <View className="flex-1">
            <Text className="font-sans-semibold text-[15px] text-gray-900 dark:text-white">Enable donations</Text>
            <Text className="font-sans text-xs text-gray-500 dark:text-gray-400 mt-0.5">Show a donate button on your parish page</Text>
          </View>
        </Pressable>

        {donationForm.donation_enabled && (
          <Animated.View entering={FadeIn.duration(200)}>
            <Field
              label="Donation URL"
              required
              value={donationForm.paypal_donation_url}
              onChangeText={(text) => setDonationForm({...donationForm, paypal_donation_url: text})}
              placeholder="e.g., https://www.paypal.com/donate/?token=..."
              autoCapitalize="none"
              helper="Your donation page URL"
            />
            <Field
              label="Donation message (optional)"
              value={donationForm.donation_message}
              onChangeText={(text) => setDonationForm({...donationForm, donation_message: text})}
              placeholder="e.g., Thank you for supporting our parish"
              multiline
              numberOfLines={3}
              helper="This message will appear on the donation page"
            />
          </Animated.View>
        )}
      </Sheet>

      {/* General settings */}
      <Modal
        visible={showGeneralSettings}
        animationType="slide"
        presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : undefined}
        onRequestClose={() => setShowGeneralSettings(false)}
      >
        <View className="flex-1 bg-gray-50 dark:bg-black">
          <SettingsHeader eyebrow="Settings" title="General" onClose={() => setShowGeneralSettings(false)} />
          <GeneralSettings />
        </View>
      </Modal>
    </View>
  );
}
