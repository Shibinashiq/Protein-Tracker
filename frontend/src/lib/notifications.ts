// Helper for 100% free mobile & browser push notifications (3-hour interval)

const THREE_HOURS_MS = 3 * 60 * 60 * 1000; // 3 hours gap
const LAST_NOTIF_KEY = 'protein_tracker_last_notif_time';

export function requestNotificationPermission() {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

// Send immediate test notification (when clicking bell or testing)
export function sendImmediateNotification(displayName: string) {
  if (!('Notification' in window)) return;

  if (Notification.permission === 'granted') {
    const title = '💪 Protein Tracker Notification';
    const body = `Hey ${displayName}, reminders are ACTIVE! You will be reminded every 3 hours if you forget to log your protein scoop.`;

    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.showNotification(title, {
          body,
          icon: '/favicon.svg',
          badge: '/favicon.svg',
        });
      });
    } else {
      new Notification(title, { body, icon: '/favicon.svg' });
    }
  }
}

// Check and send reminder if 3 hours have passed since last notification and user hasn't logged today
export function checkAndSend3HourReminder(displayName: string, hasLoggedToday: boolean) {
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  if (hasLoggedToday) return; // User already took their protein today!

  const lastNotifTimeStr = localStorage.getItem(LAST_NOTIF_KEY);
  const lastNotifTime = lastNotifTimeStr ? parseInt(lastNotifTimeStr, 10) : 0;
  const now = Date.now();

  // If 3 hours have passed since last notification (or first time today)
  if (now - lastNotifTime >= THREE_HOURS_MS) {
    const title = '⏰ Protein Scoop Reminder (Every 3h)';
    const body = `Hey ${displayName}, you haven't logged your protein intake for today yet! Tap to log +1 scoop ⚡`;

    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.showNotification(title, {
          body,
          icon: '/favicon.svg',
          badge: '/favicon.svg',
        });
      });
    } else {
      new Notification(title, { body, icon: '/favicon.svg' });
    }

    // Save timestamp of this sent notification
    localStorage.setItem(LAST_NOTIF_KEY, now.toString());
  }
}
