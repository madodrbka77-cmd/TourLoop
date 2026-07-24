/**
 * Web Push Notifications Utility
 * Enables browser desktop & mobile web push notifications for messages and post interactions.
 */

export const isWebPushSupported = (): boolean => {
  return typeof window !== 'undefined' && 'Notification' in window;
};

export const getWebPushPermission = (): NotificationPermission => {
  if (!isWebPushSupported()) return 'denied';
  return Notification.permission;
};

export const requestWebPushPermission = async (): Promise<NotificationPermission> => {
  if (!isWebPushSupported()) return 'denied';
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return 'denied';
  }
};

export interface WebPushOptions {
  body?: string;
  icon?: string;
  badge?: string;
  tag?: string;
  url?: string;
}

export const sendWebPushNotification = (
  title: string,
  options: WebPushOptions = {}
): Notification | null => {
  if (!isWebPushSupported()) return null;
  if (Notification.permission !== 'granted') return null;

  try {
    const defaultIcon = 'https://picsum.photos/100/100?random=1';
    const notification = new Notification(title, {
      body: options.body || '',
      icon: options.icon || defaultIcon,
      badge: options.badge || defaultIcon,
      tag: options.tag || 'app-notification-' + Date.now(),
      dir: 'auto',
    });

    notification.onclick = (event) => {
      event.preventDefault();
      window.focus();
      if (options.url) {
        window.location.href = options.url;
      }
      notification.close();
    };

    return notification;
  } catch (e) {
    console.error('Error sending web push notification:', e);
    return null;
  }
};
