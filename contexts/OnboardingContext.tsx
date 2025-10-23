import React, { createContext, useContext, useState, ReactNode } from 'react';
import { router } from 'expo-router';

export type UserType = 'regular_user' | 'parish_admin';

export interface OnboardingData {
  // Step 1: User Type Selection
  userType?: UserType;
  
  // Step 2: User Information
  fullName?: string;
  email?: string;
  password?: string;
  phoneNumber?: string;
  termsAccepted?: boolean;
  
  // Step 3: Parish Selection (for regular users)
  selectedParishId?: string;
  
  // Step 4: Parish Information (for parish admins)
  parishName?: string;
  jurisdiction?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  parishPhoneNumber?: string;
  parishWebsite?: string;
  parishEmail?: string;
}

interface OnboardingContextType {
  data: OnboardingData;
  currentStep: number;
  totalSteps: number;
  updateData: (updates: Partial<OnboardingData>) => void;
  nextStep: (userTypeOverride?: UserType) => void;
  previousStep: () => void;
  goToStep: (step: number) => void;
  resetOnboarding: () => void;
  isStepComplete: (step: number) => boolean;
  getNextStepRoute: (step?: number, userTypeOverride?: UserType) => string;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};

interface OnboardingProviderProps {
  children: ReactNode;
  userType?: UserType;
}

export const OnboardingProvider: React.FC<OnboardingProviderProps> = ({ 
  children, 
  userType 
}) => {
  const [data, setData] = useState<OnboardingData>({
    userType: userType || undefined,
  });
  
  const [currentStep, setCurrentStep] = useState(1);
  
  // Determine total steps based on user type
  const getTotalSteps = (userType?: UserType) => {
    if (!userType) return 1; // User type selection
    if (userType === 'regular_user') return 4; // User type + info + parish selection + welcome complete
    if (userType === 'parish_admin') return 4; // User type + info + parish details + welcome complete
    return 1;
  };
  
  const totalSteps = getTotalSteps(data.userType);
  
  const updateData = (updates: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...updates }));
  };
  
  const nextStep = (userTypeOverride?: UserType) => {
    // Use the override user type if provided, otherwise use the current data
    const userTypeToUse = userTypeOverride || data.userType;
    
    // Recalculate total steps based on the user type
    const currentTotalSteps = getTotalSteps(userTypeToUse);
    
    console.log('nextStep called:', { 
      currentStep, 
      currentTotalSteps, 
      userTypeToUse, 
      dataUserType: data.userType 
    });
    
    if (currentStep < currentTotalSteps) {
      const nextStepNumber = currentStep + 1;
      setCurrentStep(nextStepNumber);
      
      // Navigate to the next screen
      const nextRoute = getNextStepRoute(nextStepNumber, userTypeToUse);
      console.log('Navigating to next step:', nextRoute, 'step:', nextStepNumber, 'totalSteps:', currentTotalSteps);
      router.push(`/(auth)/onboarding/${nextRoute}`);
    }
  };

  const getNextStepRoute = (step?: number, userTypeOverride?: UserType) => {
    const targetStep = step || currentStep;
    const userTypeToUse = userTypeOverride || data.userType;
    
    console.log('getNextStepRoute called:', { targetStep, userTypeToUse, dataUserType: data.userType });
    
    if (targetStep === 1) {
      return 'user-type'; // Step 1: User type selection
    } else if (targetStep === 2) {
      return 'user-info'; // Step 2: User information (for both user types)
    } else if (targetStep === 3) {
      if (userTypeToUse === 'parish_admin') {
        return 'parish-details';
      } else {
        return 'parish-selection';
      }
    } else if (targetStep === 4) {
      return 'welcome-complete';
    }
    return 'user-info';
  };
  
  const previousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const goToStep = (step: number) => {
    if (step >= 1 && step <= totalSteps) {
      setCurrentStep(step);
    }
  };
  
  const resetOnboarding = () => {
    setData({ userType: userType || undefined });
    setCurrentStep(1);
  };
  
  const isStepComplete = (step: number): boolean => {
    switch (step) {
      case 1: // User type selection
        return !!data.userType;
      case 2: // User information
        return !!(data.fullName && data.termsAccepted);
      case 3: // Parish selection or parish details
        if (data.userType === 'regular_user') {
          return true; // Parish selection is optional
        } else if (data.userType === 'parish_admin') {
          return !!(data.parishName && data.jurisdiction && data.address && data.city && data.state);
        }
        return false;
      default:
        return false;
    }
  };
  
  const value: OnboardingContextType = {
    data,
    currentStep,
    totalSteps,
    updateData,
    nextStep,
    previousStep,
    goToStep,
    resetOnboarding,
    isStepComplete,
    getNextStepRoute,
  };
  
  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}; 