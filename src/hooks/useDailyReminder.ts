/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  ReminderSettings,
  getStoredReminderSettings,
  saveStoredReminderSettings,
  getNotificationPermission,
  requestNotificationPermission,
  isNotificationSupported,
  isServiceWorkerSupported,
  sendDailyExpenseReminder,
  calculateMsUntilTime,
  getTodayDateString,
} from '../utils/notifications';

export function useDailyReminder(onShowToast?: (msg: string) => void) {
  const [settings, setSettings] = useState<ReminderSettings>(() => getStoredReminderSettings());
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const timerRef = useRef<number | null>(null);

  // Update permission status
  const refreshPermission = useCallback(() => {
    setPermission(getNotificationPermission());
  }, []);

  useEffect(() => {
    refreshPermission();
  }, [refreshPermission]);

  // Save settings whenever they change
  const updateSettings = useCallback(
    (newSettings: Partial<ReminderSettings>) => {
      setSettings((prev) => {
        const updated = { ...prev, ...newSettings };
        saveStoredReminderSettings(updated);
        return updated;
      });
    },
    []
  );

  // Request permission explicitly
  const requestPermission = useCallback(async () => {
    if (!isNotificationSupported()) {
      onShowToast?.('Le notifiche push non sono supportate da questo browser.');
      return false;
    }

    try {
      const res = await requestNotificationPermission();
      setPermission(res);
      if (res === 'granted') {
        onShowToast?.('Notifiche autorizzate con successo!');
        return true;
      } else if (res === 'denied') {
        onShowToast?.('I permessi per le notifiche sono stati bloccati dal browser.');
        return false;
      }
      return false;
    } catch (err) {
      console.error(err);
      onShowToast?.('Errore durante la richiesta permessi notifiche.');
      return false;
    }
  }, [onShowToast]);

  // Toggle enabled
  const toggleReminder = useCallback(
    async (enabled: boolean) => {
      if (enabled) {
        let currentPerm = getNotificationPermission();
        if (currentPerm === 'default') {
          currentPerm = await requestNotificationPermission();
          setPermission(currentPerm);
        }

        if (currentPerm !== 'granted') {
          onShowToast?.(
            currentPerm === 'denied'
              ? 'Le notifiche sono bloccate nel browser. Abilitale dalle impostazioni del sito.'
              : 'È necessario concedere il permesso per ricevere il promemoria.'
          );
          updateSettings({ enabled: false });
          return;
        }

        updateSettings({ enabled: true });
        onShowToast?.(`Promemoria giornaliero attivato alle ore ${settings.time}!`);
      } else {
        updateSettings({ enabled: false });
        onShowToast?.('Promemoria giornaliero disattivato.');
      }
    },
    [settings.time, onShowToast, updateSettings]
  );

  // Send a test notification immediately
  const sendTestNotification = useCallback(async () => {
    if (!isNotificationSupported()) {
      onShowToast?.('Le notifiche push non sono supportate da questo dispositivo.');
      return false;
    }

    let currentPerm = getNotificationPermission();
    if (currentPerm === 'default') {
      currentPerm = await requestNotificationPermission();
      setPermission(currentPerm);
    }

    if (currentPerm !== 'granted') {
      onShowToast?.('Notifiche non autorizzate. Abilita i permessi nel browser.');
      return false;
    }

    try {
      const sent = await sendDailyExpenseReminder(
        '🔔 Questa è una notifica di prova! Il promemoria spese giornaliere funziona correttamente.'
      );
      if (sent) {
        onShowToast?.('Notifica di prova inviata!');
        return true;
      } else {
        onShowToast?.('Impossibile mostrare la notifica. Verifica le autorizzazioni di sistema.');
        return false;
      }
    } catch (err) {
      console.error(err);
      onShowToast?.('Errore durante l\'invio della notifica di prova.');
      return false;
    }
  }, [onShowToast]);

  // Schedule timer whenever settings.enabled or settings.time changes
  useEffect(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (!settings.enabled || permission !== 'granted') {
      return;
    }

    const checkAndNotify = async () => {
      const today = getTodayDateString();
      const current = getStoredReminderSettings();

      if (current.enabled && current.lastNotifiedDate !== today) {
        await sendDailyExpenseReminder(current.message);
        const updated = { ...current, lastNotifiedDate: today };
        saveStoredReminderSettings(updated);
        setSettings(updated);
      }

      // Re-schedule for next day
      const nextDelay = calculateMsUntilTime(settings.time);
      timerRef.current = window.setTimeout(checkAndNotify, nextDelay);
    };

    const msUntil = calculateMsUntilTime(settings.time);
    timerRef.current = window.setTimeout(checkAndNotify, msUntil);

    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [settings.enabled, settings.time, permission]);

  // Check on visibility change (e.g. user opens or resumes app)
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && settings.enabled && permission === 'granted') {
        const today = getTodayDateString();
        const current = getStoredReminderSettings();
        if (current.lastNotifiedDate !== today) {
          // Check if current time is past or equal to scheduled time
          const now = new Date();
          const [hStr, mStr] = current.time.split(':');
          const schedH = parseInt(hStr, 10);
          const schedM = parseInt(mStr, 10);
          const nowH = now.getHours();
          const nowM = now.getMinutes();

          if (nowH > schedH || (nowH === schedH && nowM >= schedM)) {
            await sendDailyExpenseReminder(current.message);
            const updated = { ...current, lastNotifiedDate: today };
            saveStoredReminderSettings(updated);
            setSettings(updated);
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [settings.enabled, permission]);

  return {
    settings,
    permission,
    isSupported: isNotificationSupported(),
    isServiceWorkerActive: isServiceWorkerSupported(),
    toggleReminder,
    updateTime: (time: string) => updateSettings({ time }),
    updateMessage: (message: string) => updateSettings({ message }),
    requestPermission,
    sendTestNotification,
    refreshPermission,
  };
}
