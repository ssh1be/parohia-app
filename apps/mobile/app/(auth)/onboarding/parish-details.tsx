import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import AddressAutocomplete from '../../../components/AddressAutocomplete';
import { AuthHeader, AuthScaffold, OnboardingProgress } from '../../../components/auth/AuthChrome';
import { Button } from '../../../components/ui/Button';
import { Field } from '../../../components/ui/Field';
import { Reveal } from '../../../components/ui/Reveal';
import { useOnboarding } from '../../../contexts/OnboardingContext';

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
    if (addressData.street_number && addressData.route) {
      setAddress(`${addressData.street_number} ${addressData.route}`);
    } else if (addressData.route) {
      setAddress(addressData.route);
    }

    if (addressData.locality) setCity(addressData.locality);
    if (addressData.administrative_area_level_1) setState(addressData.administrative_area_level_1);
    if (addressData.postal_code) setZipCode(addressData.postal_code);
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

    if (!jurisdiction.trim()) {
      Alert.alert('Error', 'Please enter your jurisdiction');
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
      jurisdiction: jurisdiction.trim(),
      address: address.trim(),
      city: city.trim(),
      state: state.trim(),
      zipCode: zipCode.trim(),
      parishPhoneNumber: parishPhoneNumber.trim(),
      parishWebsite: parishWebsite.trim(),
      parishEmail: parishEmail.trim(),
    });

    router.push('/(auth)/onboarding/welcome-complete');
  };

  return (
    <AuthScaffold>
      <AuthHeader
        eyebrow="Step 3 of 3"
        title="Parish Details"
        subtitle="Register your community on Parohia."
        onBack={previousStep}
      />

      <OnboardingProgress step={3} />

      <Reveal index={2}>
        <Field
          label="Parish Name"
          required
          placeholder="St. Mary Orthodox Church"
          value={parishName}
          onChangeText={setParishName}
        />

        <Field
          label="Jurisdiction"
          required
          placeholder="Orthodox Church in America (OCA)"
          value={jurisdiction}
          onChangeText={setJurisdiction}
        />

        <View className="mb-4">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="font-sans-semibold text-[13px] text-gray-700 dark:text-gray-300">
              Street Address
              <Text className="text-red-600 dark:text-red-400"> *</Text>
            </Text>
            {(address || city || state || zipCode) && (
              <Button label="Clear" variant="ghost" size="sm" onPress={clearAddressFields} />
            )}
          </View>
          <AddressAutocomplete
            onAddressSelect={handleAddressSelect}
            placeholder="123 Main St"
            value={address}
            onChangeText={setAddress}
            onClear={clearAddressFields}
          />
        </View>

        <View className="flex-row">
          <View className="flex-1 mr-2">
            <Field label="City" required placeholder="Portland" value={city} onChangeText={setCity} />
          </View>
          <View className="w-24">
            <Field
              label="State"
              required
              placeholder="OR"
              value={state}
              onChangeText={setState}
              maxLength={2}
              autoCapitalize="characters"
            />
          </View>
        </View>

        <Field
          label="ZIP Code"
          placeholder="97201"
          value={zipCode}
          onChangeText={setZipCode}
          keyboardType="numeric"
          maxLength={10}
        />

        <Field
          label="Parish Phone"
          helper="Optional"
          placeholder="(503) 123-4567"
          value={parishPhoneNumber}
          onChangeText={setParishPhoneNumber}
          keyboardType="phone-pad"
        />

        <Field
          label="Parish Website"
          helper="Optional"
          placeholder="https://www.stmaryorthodox.org"
          value={parishWebsite}
          onChangeText={setParishWebsite}
          keyboardType="url"
          autoCapitalize="none"
        />

        <Field
          label="Parish Email"
          helper="Optional"
          placeholder="info@stmaryorthodox.org"
          value={parishEmail}
          onChangeText={setParishEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <View className="rounded-3xl p-4 mb-6 bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20">
          <Text className="font-sans text-[13px] leading-5 text-gray-600 dark:text-gray-300">
            Your parish will need to be verified before you can fully access administrator features.
            We'll guide you through this after registration.
          </Text>
        </View>

        <Button
          label="Complete Registration"
          icon="checkmark-circle-outline"
          size="lg"
          fullWidth
          onPress={handleComplete}
          className="mb-4"
        />
      </Reveal>
    </AuthScaffold>
  );
}
