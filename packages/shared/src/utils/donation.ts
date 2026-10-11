/** Platform-agnostic donation URL helpers (opening the link stays in each app). */
export function validatePayPalDonationUrl(url: string): boolean {
  const paypalUrlRegex = /^https?:\/\/(www\.)?paypal\.com\/(donate|cgi-bin\/webscr|us\/cgi-bin\/webscr)/;
  return paypalUrlRegex.test(url.trim());
}

export function cleanDonationUrl(url: string): string {
  let cleanedUrl = url.trim();
  if (!cleanedUrl.startsWith('http://') && !cleanedUrl.startsWith('https://')) {
    cleanedUrl = `https://${cleanedUrl}`;
  }
  if (cleanedUrl.startsWith('http://')) {
    cleanedUrl = cleanedUrl.replace('http://', 'https://');
  }
  return cleanedUrl;
}
