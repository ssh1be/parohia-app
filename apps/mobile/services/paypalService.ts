import { cleanDonationUrl, validatePayPalDonationUrl } from '@parohia/shared';
import { Linking, Alert } from 'react-native';

export interface PayPalDonationSettings {
  paypal_donation_url: string;
  donation_enabled: boolean;
  donation_message?: string;
}

export class PayPalService {
  /**
   * Validate PayPal donation URL format
   * @param url - The PayPal donation URL to validate
   * @returns true if valid, false otherwise
   */
  static validatePayPalDonationUrl(url: string): boolean {
    return validatePayPalDonationUrl(url);
  }

  /**
   * Clean and format PayPal donation URL
   * @param url - The raw PayPal donation URL
   * @returns Cleaned PayPal donation URL
   */
  static cleanPayPalDonationUrl(url: string): string {
    return cleanDonationUrl(url);
  }

  /**
   * Open a donation URL in the browser (any provider).
   * @param donationUrl - The donation URL
   * @param message - Optional message (unused; kept for call-site compatibility)
   */
  static async openPayPalDonation(
    donationUrl: string,
    _message?: string
  ): Promise<void> {
    try {
      const url = this.cleanPayPalDonationUrl(donationUrl);
      
      // Check if the URL can be opened
      const canOpen = await Linking.canOpenURL(url);
      
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert(
          'Error',
          'Unable to open this link. Please make sure you have a web browser installed.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error opening donation link:', error);
      Alert.alert(
        'Error',
        'Failed to open donation link. Please try again.',
        [{ text: 'OK' }]
      );
    }
  }

  /**
   * Extract business name from PayPal donation URL
   * @param url - The PayPal donation URL
   * @returns The business name if found
   */
  static extractBusinessNameFromUrl(url: string): string {
    // Try to extract business name from various PayPal URL formats
    const patterns = [
      /business=([^&]+)/,
      /cmd=_donations&business=([^&]+)/,
      /receiver=([^&]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return decodeURIComponent(match[1]);
      }
    }
    
    return '';
  }

  /**
   * Format donation amount for display
   * @param amount - The amount in cents
   * @returns Formatted amount string
   */
  static formatAmount(amount: number): string {
    return `$${(amount / 100).toFixed(2)}`;
  }

  /**
   * Parse amount from string to cents
   * @param amountString - The amount string (e.g., "10.50")
   * @returns Amount in cents
   */
  static parseAmount(amountString: string): number {
    const amount = parseFloat(amountString);
    return Math.round(amount * 100);
  }
} 