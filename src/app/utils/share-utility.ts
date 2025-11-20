import { Share } from '@capacitor/share';

/**
 * Handles the native sharing of content from the MedGuide app.
 * @param title The title for the share dialog and the message preview.
 * @param text The body content (e.g., the medicine schedule or a log entry).
 */
export async function shareContent(title: string, text: string): Promise<void> {
    
  // Check if the device is capable of sharing.
  if (!(await Share.canShare()).value) {
    console.warn('Sharing is not available on this device.');
    // Use an alert or a toast for a user-friendly message
    alert('Sharing features are not available on this platform.'); 
    return;
  }

  try {
    await Share.share({
      title: title,
      text: text,
      dialogTitle: 'Share your MedGuide information with...',
    });
    console.log('Content shared successfully or user cancelled.');
  } catch (e) {
    // This often catches user cancellation, which is a normal flow, 
    // but we log it just in case of a true error.
    console.error('Error sharing content:', e);
  }
}