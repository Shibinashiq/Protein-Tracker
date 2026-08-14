import { useState, useEffect } from 'react';

const LOCAL_VERSION_KEY = 'pt_app_version';

export function useAppUpdate() {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  const checkVersion = async () => {
    try {
      // Fetch /version.json bypassing cache completely
      const res = await fetch(`/version.json?t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
      });
      if (!res.ok) return;

      const data = await res.json();
      const serverVersion = data.version;
      const storedVersionStr = localStorage.getItem(LOCAL_VERSION_KEY);

      if (!storedVersionStr) {
        // First run: store server version
        localStorage.setItem(LOCAL_VERSION_KEY, String(serverVersion));
      } else {
        const storedVersion = Number(storedVersionStr);
        if (serverVersion > storedVersion) {
          setUpdateAvailable(true);
        }
      }
    } catch (e) {
      console.warn('Version check error:', e);
    }
  };

  useEffect(() => {
    // Check version immediately on mount
    checkVersion();

    // Check version whenever app comes back to foreground (iOS PWA resume)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkVersion();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', checkVersion);

    // Also check via ServiceWorker message if available
    if ('serviceWorker' in navigator) {
      const handleSWMessage = (event: MessageEvent) => {
        if (event.data?.type === 'SW_UPDATED') {
          setUpdateAvailable(true);
        }
      };
      navigator.serviceWorker.addEventListener('message', handleSWMessage);
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('focus', checkVersion);
        navigator.serviceWorker.removeEventListener('message', handleSWMessage);
      };
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', checkVersion);
    };
  }, []);

  const applyUpdate = async () => {
    // Save new version into localStorage so warning hides on reload
    try {
      const res = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem(LOCAL_VERSION_KEY, String(data.version));
      }
    } catch (_) {}

    // Unregister any service workers to clear cached bundles
    if ('serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          await reg.unregister();
        }
      } catch (_) {}
    }

    // Force hard reload bypassing browser cache
    window.location.reload();
  };

  return { updateAvailable, applyUpdate, checkVersion };
}
