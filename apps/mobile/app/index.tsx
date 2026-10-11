import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { Spinner } from "../components/ui/Spinner";
import { useAuth } from "../contexts/AuthContext";
import { AuthDestination, resolveAuthDestination } from "../utils/onboardingStorage";

export default function Index() {
  const { user, loading } = useAuth();
  const [destinationChecked, setDestinationChecked] = useState(false);
  const [destination, setDestination] = useState<AuthDestination>('tabs');

  useEffect(() => {
    const checkDestination = async () => {
      if (user && !destinationChecked) {
        const next = await resolveAuthDestination(user.id);
        setDestination(next);
        setDestinationChecked(true);
      }
    };

    checkDestination();
  }, [user, destinationChecked]);

  useEffect(() => {
    if (!user) {
      setDestinationChecked(false);
    }
  }, [user]);

  if (user && !destinationChecked) {
    return (
      <View className="flex-1 bg-gray-50 dark:bg-black justify-center items-center">
        <Spinner size="lg" />
        <Text className="text-gray-900 dark:text-white mt-4">Loading...</Text>
      </View>
    );
  }

  if (loading && !user) {
    return (
      <View className="flex-1 bg-gray-50 dark:bg-black justify-center items-center">
        <Spinner size="lg" />
        <Text className="text-gray-900 dark:text-white mt-4">Loading...</Text>
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/(auth)/welcome" />;
  }

  if (destination === 'onboarding') {
    return <Redirect href="/(auth)/onboarding/user-type" />;
  }

  if (destination === 'parish-selection') {
    return <Redirect href="/(auth)/onboarding/parish-selection" />;
  }

  return <Redirect href="/(tabs)" />;
}
