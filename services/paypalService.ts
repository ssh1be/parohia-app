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
    // Check if it's a valid PayPal donation URL
    const paypalUrlRegex = /^https?:\/\/(www\.)?paypal\.com\/(donate|cgi-bin\/webscr|us\/cgi-bin\/webscr)/;
    return paypalUrlRegex.test(url.trim());
  }

  /**
   * Clean and format PayPal donation URL
   * @param url - The raw PayPal donation URL
   * @returns Cleaned PayPal donation URL
   */
  static cleanPayPalDonationUrl(url: string): string {
    let cleanedUrl = url.trim();
    
    // Add https:// if missing
    if (!cleanedUrl.startsWith('http://') && !cleanedUrl.startsWith('https://')) {
      cleanedUrl = `https://${cleanedUrl}`;
    }
    
    // Ensure it's https
    if (cleanedUrl.startsWith('http://')) {
      cleanedUrl = cleanedUrl.replace('http://', 'https://');
    }
    
    return cleanedUrl;
  }

  /**
   * Open PayPal donation URL
   * @param donationUrl - The PayPal donation URL
   * @param message - Optional message to include
   */
  static async openPayPalDonation(
    donationUrl: string,
    message?: string
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
          'Unable to open PayPal. Please make sure you have a web browser installed.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error opening PayPal donation:', error);
      Alert.alert(
        'Error',
        'Failed to open PayPal donation link. Please try again.',
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