import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TextInput, View } from 'react-native';
import { AuthHeader, AuthScaffold, OnboardingProgress } from '../../../components/auth/AuthChrome';
import { Button } from '../../../components/ui/Button';
import { EmptyState } from '../../../components/ui/EmptyState';
import { PressableScale } from '../../../components/ui/PressableScale';
import { Reveal } from '../../../components/ui/Reveal';
import { useThemeColors } from '../../../components/ui/useThemeColors';
import { palette } from '../../../constants/theme';
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
  const colors = useThemeColors();
  const [searchQuery, setSearchQuery] = useState('');
  const [parishes, setParishes] = useState<Parish[]>([]);
  const [loading, setLoading] = useState(true);
  const [focused, setFocused] = useState(false);
  const [selectedParishId, setSelectedParishId] = useState(data.selectedParishId || '');

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

  const handleComplete = () => {
    updateData({ selectedParishId });
    router.push('/(auth)/onboarding/welcome-complete');
  };

  const handleSkip = () => {
    router.push('/(auth)/onboarding/welcome-complete');
  };

  const filteredParishes = parishes.filter(
    (parish) =>
      parish.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${parish.city}, ${parish.state}`.toLowerCase().includes(searchQuery.toLowerCase()),
  );

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
            onPress={handleComplete}
          />
          <View className="mt-2">
            <Button label="Skip for now" variant="ghost" fullWidth onPress={handleSkip} />
          </View>
        </Reveal>
      }
    >
      <AuthHeader
        eyebrow="Step 3 of 3"
        title="Find Your Parish"
        subtitle="Connect with your local Orthodox community."
        onBack={previousStep}
      />

      <OnboardingProgress step={3} />

      <Reveal index={2}>
        <View className="relative mb-4">
          <View
            className={`flex-row items-center h-12 rounded-2xl bg-gray-100 dark:bg-white/5 border px-4 ${
              focused ? 'border-red-500/70' : 'border-transparent dark:border-white/5'
            }`}
          >
            <Ionicons name="search" size={18} color={colors.textMuted} />
            <TextInput
              className="flex-1 font-sans text-[15px] text-gray-900 dark:text-white ml-2.5"
              placeholder="Search by name or location"
              placeholderTextColor={palette.gray400}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              autoCorrect={false}
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
            <ActivityIndicator color={colors.textMuted} size="small" />
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
            keyboardShouldPersistTaps="handled"
          >
            {filteredParishes.map((parish) => {
              const selected = selectedParishId === parish.id;
              return (
                <PressableScale
                  key={parish.id}
                  onPress={() => setSelectedParishId(parish.id)}
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
                        {parish.is_verified && (
                          <View className="flex-row items-center ml-2">
                            <Ionicons name="checkmark-circle" size={14} color={palette.green} />
                            <Text className="font-sans-semibold text-[11px] text-emerald-600 dark:text-emerald-400 ml-1">
                              Verified
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text className="font-sans text-[13px] text-gray-500 dark:text-gray-400 mt-1">
                        {parish.city}, {parish.state}
                      </Text>
                      {!parish.is_verified && (
                        <Text className="font-sans-medium text-[11px] text-amber-600 dark:text-amber-400 mt-1">
                          Pending verification
                        </Text>
                      )}
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
