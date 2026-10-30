import type { OnboardingData, UserType } from '@parohia/shared';
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { router, usePathname } from 'expo-router';

const ROUTE_STEPS: Record<string, number> = {
  'user-type': 1,
  'user-info': 2,
  'parish-selection': 3,
  'parish-details': 3,
  'welcome-complete': 4,
};

export type { OnboardingData, UserType };

interface OnboardingContextType {
  data: OnboardingData;
  currentStep: number;
  totalSteps: number;
  updateData: (updates: Partial<OnboardingData>) => void;
  nextStep: (userTypeOverride?: UserType) => void;
  previousStep: () => void;
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
  
  // Derived from the visible screen so swipe-back and hardware back can't desync it
  const pathname = usePathname();
  const currentStep = ROUTE_STEPS[pathname.split('/').pop() ?? ''] ?? 1;
  
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
      router.back();
    }
  };
  
  const resetOnboarding = () => {
    setData({ userType: userType || undefined });
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