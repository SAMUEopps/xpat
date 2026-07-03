// lib/notifications.ts
export function showBrowserNotification(title: string, body: string, icon?: string) {
  if (!('Notification' in window)) {
    return;
  }

  if (Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: icon || '/notification-icon.png',
    });
  } else if (Notification.permission === 'default') {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        new Notification(title, {
          body,
          icon: icon || '/notification-icon.png',
        });
      }
    });
  }
}