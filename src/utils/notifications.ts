import { playGentleChime } from './effects';

export const isNotificationSupported = (): boolean => {
  return typeof window !== 'undefined' && 'Notification' in window;
};

export const getNotificationPermission = (): NotificationPermission => {
  if (!isNotificationSupported()) return 'denied';
  return Notification.permission;
};

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!isNotificationSupported()) return false;
  try {
    const perm = await Notification.requestPermission();
    return perm === 'granted';
  } catch {
    return false;
  }
};

export const formatTimeDisplay = (time24?: string): string => {
  if (!time24) return '';
  const [hourStr, minStr] = time24.split(':');
  const h = parseInt(hourStr, 10);
  if (isNaN(h)) return time24;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${minStr || '00'} ${ampm}`;
};

export const triggerSystemNotification = (title: string, body: string) => {
  playGentleChime();
  if (isNotificationSupported() && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon: 'https://api.iconify.design/lucide:bell.svg',
      });
    } catch {
      // In case iframe restricts notification constructor
    }
  }
};

export interface ActiveReminderAlert {
  id: string;
  sankalpId: string;
  title: string;
  emoji?: string;
  time: string;
  duration: string;
}
