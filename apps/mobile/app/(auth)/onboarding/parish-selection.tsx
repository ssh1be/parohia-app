import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Keyboard, ScrollView, Text, TextInput, View } from 'react-native';
import { AuthHeader, AuthScaffold, OnboardingProgress } from '../../../components/auth/AuthChrome';
import { Button } from '../../../components/ui/Button';
import { EmptyState } from '../../../components/ui/EmptyState';
import { PressableScale } from '../../../components/ui/PressableScale';
import { Reveal } from '../../../components/ui/Reveal';
import { Spinner } from '../../../components/ui/Spinner';
import { useThemeColors } from '../../../components/ui/useThemeColors';
import { palette } from '../../../constants/theme';
import { useAuth } from '../../../contexts/AuthContext';
import { useOnboarding } from '../../../contexts/OnboardingContext';
import { NO_PARISH_ID } from '@parohia/shared';
import { getParishes, getUserProfile } from '@parohia/shared';
import { filterParishesBySearch } from '@parohia/shared';

interface Parish {
  id: string;
  name: string;
  city: string;
  state: string;
  is_verified: boolean;
}

export default function ParishSelectionScreen() {
  const { data, updateData, previousStep } = useOnboarding();
  const { user } = useAuth();
  const colors = useThemeColors();
  const [searchQuery, setSearchQuery] = useState('');
  const [parishes, setParishes] = useState<Parish[]>([]);
  const [loading, setLoading] = useState(true);
  const [focused, setFocused] = useState(false);
  const [selectedParishId, setSelectedParishId] = useState(data.selectedParishId || '');
  const [isRejoin, setIsRejoin] = useState(false);

  useEffect(() => {
    const fetchParishes = async () => {
      try {
        const parishesData = await getParishes();
        setParishes(parishesData);
      } catch (error) {
        console.error('Error fetching parishes:', error);
        setParishes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchParishes();
  }, []);

  // Members whose parish was deleted land here with an existing profile — hydrate context.
  useEffect(() => {
    const hydrateFromProfile = async () => {
      if (!user || (data.fullName && data.userType)) return;
      const profile = await getUserProfile(user.id);
      if (!profile) return;
      setIsRejoin(true);
      updateData({
        fullName: profile.full_name,
        userType: profile.user_type,
        phoneNumber: profile.phone_number || undefined,
        email: profile.email || undefined,
      });
    };
    hydrateFromProfile();
  }, [user]);

  const handleComplete = () => {
    updateData({
      selectedParishId,
      userType: data.userType || 'regular_user',
    });
    router.push('/(auth)/onboarding/welcome-complete');
  };

  const handleSkip = () => {
    // Assign sentinel "No Parish" so auth routing doesn't bounce back to this screen.
    updateData({
      selectedParishId: NO_PARISH_ID,
      userType: data.userType || 'regular_user',
    });
    router.push('/(auth)/onboarding/welcome-complete');
  };

  const filteredParishes = filterParishesBySearch(parishes, searchQuery);

  return (
    <AuthScaffold
      scroll={false}
      bottom={
        <Reveal index={5}>
          <View className="rounded-3xl p-4 mb-4 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20">
            <View className="flex-row items-start">
              <View className="h-10 w-10 rounded-2xl bg-blue-500/15 items-center justify-center">
                <Ionicons name="information-circle-outline" size={18} color={palette.blue} />
              </View>
              <View className="flex-1 ml-3">
                <Text className="font-sans-bold text-[14px] text-gray-900 dark:text-white">
                  Don't see your parish?
                </Text>
                <Text className="font-sans text-[13px] leading-5 text-gray-600 dark:text-gray-300 mt-1">
                  Let your parish priest or administrator know about Parohia so they can register.
                </Text>
              </View>
            </View>
          </View>

          <Button
            label="Complete Registration"
            icon="checkmark-circle-outline"
            size="lg"
            fullWidth
            disabled={!selectedParishId}
            onPress={handleComplete}
          />
          <View className="mt-2">
            <Button label="Skip for now" variant="ghost" fullWidth onPress={handleSkip} />
          </View>
        </Reveal>
      }
    >
      <AuthHeader
        eyebrow={isRejoin ? 'Choose a parish' : 'Step 3 of 3'}
        title="Find Your Parish"
        subtitle={
          isRejoin
            ? 'Your previous parish is no longer available. Select a new one to continue.'
            : 'Connect with your local Orthodox community.'
        }
        onBack={isRejoin ? undefined : previousStep}
      />

      {!isRejoin && <OnboardingProgress step={3} />}

      <Reveal index={2}>
        <View className="relative mb-4">
          <View
            className={`flex-row items-center h-12 rounded-full px-4 ${
              focused
                ? 'bg-gray-100/90 dark:bg-white/[0.08] border border-red-500/40'
                : 'bg-gray-100/70 dark:bg-white/[0.05] border border-transparent'
            }`}
          >
            <Ionicons name="search" size={17} color={colors.textMuted} />
            <TextInput
              className="flex-1 font-sans text-[15px] text-gray-900 dark:text-white ml-2.5"
              placeholder="Search by name or location"
              placeholderTextColor={palette.gray400}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              autoCorrect={false}
              autoCapitalize="none"
            />
            {searchQuery.length > 0 && (
              <PressableScale onPress={() => setSearchQuery('')} haptic>
                <Ionicons name="close-circle" size={18} color={colors.textFaint} />
              </PressableScale>
            )}
          </View>
        </View>
      </Reveal>

      <Reveal index={3} style={{ flex: 1, minHeight: 0 }}>
        {loading ? (
          <View className="flex-row items-center justify-center py-10">
            <Spinner size="sm" />
            <Text className="font-sans-medium text-[13px] text-gray-500 dark:text-gray-400 ml-2">
              Loading parishes…
            </Text>
          </View>
        ) : parishes.length === 0 ? (
          <EmptyState
            icon="business-outline"
            title="No parishes available"
            message="You can skip this step and complete your registration. Parishes will appear as administrators register."
            compact
          />
        ) : filteredParishes.length === 0 ? (
          <EmptyState
            icon="search-outline"
            title="No results found"
            message="Try adjusting your search terms."
            compact
          />
        ) : (
          <ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="always"
            keyboardDismissMode="on-drag"
          >
            {filteredParishes.map((parish) => {
              const selected = selectedParishId === parish.id;
              return (
                <PressableScale
                  key={parish.id}
                  onPress={() => {
                    Keyboard.dismiss();
                    setSelectedParishId(parish.id);
                  }}
                  haptic
                  className={`mb-2.5 rounded-3xl p-4 border ${
                    selected
                      ? 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/25'
                      : 'bg-white dark:bg-white/[0.04] border-gray-100 dark:border-white/[0.06]'
                  }`}
                >
                  <View className="flex-row items-center">
                    <View className="flex-1 pr-3">
                      <View className="flex-row items-center flex-wrap">
                        <Text className="font-sans-semibold text-[15px] text-gray-900 dark:text-white">
                          {parish.name}
                        </Text>
                        {parish.is_verified ? (
                          <Ionicons
                            name="checkmark-circle"
                            size={14}
                            color={palette.green}
                            style={{ marginLeft: 6 }}
                          />
                        ) : (
                          <Ionicons
                            name="alert-circle"
                            size={14}
                            color={palette.amber}
                            style={{ marginLeft: 6 }}
                          />
                        )}
                      </View>
                      <Text className="font-sans text-[13px] text-gray-500 dark:text-gray-400 mt-1">
                        {parish.city}, {parish.state}
                      </Text>
                    </View>
                    <View
                      className={`h-6 w-6 rounded-full border-2 items-center justify-center ${
                        selected
                          ? 'border-red-600 bg-red-600'
                          : 'border-gray-300 dark:border-white/20'
                      }`}
                    >
                      {selected ? <Ionicons name="checkmark" size={14} color="#FFFFFF" /> : null}
                    </View>
                  </View>
                </PressableScale>
              );
            })}
          </ScrollView>
        )}
      </Reveal>
    </AuthScaffold>
  );
}
