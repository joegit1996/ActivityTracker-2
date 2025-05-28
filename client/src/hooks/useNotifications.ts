import { useState, useEffect, useCallback } from 'react';

interface NotificationMessage {
  type: 'NOTIFICATION_PERMISSION_REQUEST' | 'NOTIFICATION_PERMISSION_RESPONSE' | 'NOTIFICATION_TOGGLE';
  enabled?: boolean;
  permission?: NotificationPermission;
}

export function useNotifications() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isWebView, setIsWebView] = useState(false);

  // Detect if running in a webview
  useEffect(() => {
    const userAgent = navigator.userAgent;
    const isInWebView = /wv|WebView|(iPhone|iPod|iPad).*AppleWebKit(?!.*Safari)|Android.*(wv|\.0\.0\.0)/i.test(userAgent);
    setIsWebView(isInWebView);
  }, []);

  // Listen for messages from parent app (webview)
  useEffect(() => {
    const handleMessage = (event: MessageEvent<NotificationMessage>) => {
      const { data } = event;
      
      if (data.type === 'NOTIFICATION_PERMISSION_RESPONSE') {
        setPermission(data.permission || 'default');
        setNotificationsEnabled(data.enabled || false);
      }
    };

    if (isWebView) {
      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
    }
  }, [isWebView]);

  // Request notification permission
  const requestPermission = useCallback(async () => {
    if (isWebView) {
      // Send message to parent app to handle notifications
      window.parent.postMessage({
        type: 'NOTIFICATION_PERMISSION_REQUEST'
      }, '*');
    } else {
      // Handle browser notifications directly
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        setPermission(permission);
        setNotificationsEnabled(permission === 'granted');
      }
    }
  }, [isWebView]);

  // Toggle notifications
  const toggleNotifications = useCallback(async (enabled: boolean) => {
    if (isWebView) {
      // Send toggle message to parent app
      window.parent.postMessage({
        type: 'NOTIFICATION_TOGGLE',
        enabled
      }, '*');
    } else {
      // Handle browser notifications
      if (enabled && permission !== 'granted') {
        await requestPermission();
      } else {
        setNotificationsEnabled(enabled);
        // Store preference locally
        localStorage.setItem('notifications_enabled', enabled.toString());
      }
    }
  }, [isWebView, permission, requestPermission]);

  // Load initial state
  useEffect(() => {
    if (!isWebView) {
      // Check browser notification permission
      if ('Notification' in window) {
        setPermission(Notification.permission);
        const stored = localStorage.getItem('notifications_enabled');
        setNotificationsEnabled(stored === 'true' && Notification.permission === 'granted');
      }
    } else {
      // Request current state from parent app
      window.parent.postMessage({
        type: 'NOTIFICATION_PERMISSION_REQUEST'
      }, '*');
    }
  }, [isWebView]);

  return {
    notificationsEnabled,
    permission,
    isWebView,
    toggleNotifications,
    requestPermission
  };
}