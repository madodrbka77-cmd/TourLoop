import { useState, useEffect, useCallback, useRef } from 'react';
import { View, User } from '../types';
import { useNotify, NotificationType } from '../context/NotificationContext';

export const useUI = (initialUser: User) => {
  const [currentView, setView] = useState<View>('home');
  const [viewingProfile, setViewingProfile] = useState<User>(initialUser);
  const [isGlobalLoading, setIsGlobalLoading] = useState(true);

  // NEW: Global State for "View As" Mode
  // This allows the user to toggle viewing their own profile as a stranger.
  // It persists across tab changes within the profile but resets when navigating away.
  const [isViewAsMode, setIsViewAsMode] = useState(false);

  // Use the centralized notification context
  const notify = useNotify();

  /**
   * Ref to store the last notification details (message, type, timestamp).
   * This acts as a memory buffer to detect and prevent duplicate notifications
   * without causing re-renders.
   */
  const lastNotificationRef = useRef<{ message: string; type: string; timestamp: number } | null>(null);

  // Simulate global loading state when view changes
  useEffect(() => {
    setIsGlobalLoading(true);
    const timer = setTimeout(() => {
      setIsGlobalLoading(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, [currentView]);

  // NEW: Automatically reset "View As" mode when navigating away from Profile view
  // This ensures the user doesn't get stuck in "View As" mode when going to Home or Feed.
  useEffect(() => {
    if (currentView !== 'profile') {
      setIsViewAsMode(false);
    }
  }, [currentView]);

  // NEW: Automatically reset "View As" mode when switching to a different user profile
  // (e.g. clicking a friend's profile from your own profile).
  useEffect(() => {
    setIsViewAsMode(false);
  }, [viewingProfile?.id]);

  /**
   * Helper to toggle View As Mode.
   * Can be used by the profile header/settings.
   */
  const toggleViewAsMode = useCallback(() => {
    setIsViewAsMode(prev => !prev);
  }, []);

  /**
   * Enhanced showNotification function with strict Debouncing/Throttling.
   * This prevents the "spam" effect where a function call (e.g., inside a loop or rapid clicks)
   * triggers multiple identical toasts instantly.
   */
  const showNotification = useCallback((message: string | { message: string, type?: NotificationType }, type: NotificationType = 'success') => {
    // Normalize input to handle both string and object signatures
    let msgText = '';
    let msgType: NotificationType = 'success';

    if (typeof message === 'object' && message !== null) {
        msgText = message.message;
        msgType = message.type || 'success';
    } else {
        msgText = String(message);
        msgType = type;
    }

    const now = Date.now();

    // Debounce Check: 
    // If the same message with the same type is triggered within 1000ms, ignore it.
    if (
      lastNotificationRef.current &&
      lastNotificationRef.current.message === msgText &&
      lastNotificationRef.current.type === msgType &&
      (now - lastNotificationRef.current.timestamp < 1000)
    ) {
      return; // Suppress duplicate
    }

    // Update the ref with the new notification details
    lastNotificationRef.current = { message: msgText, type: msgType, timestamp: now };

    // Trigger the actual notification via the Provider
    notify(msgText, msgType);
  }, [notify]);

  /**
   * Backward Compatibility Adapter for components using `setAppNotification`.
   * Redirects calls to `showNotification` to ensure they also benefit from debouncing.
   */
  const setAppNotification = useCallback((val: { message: string; type: NotificationType } | null) => {
    if (val && val.message) {
      showNotification(val.message, val.type);
    }
  }, [showNotification]);

  return {
    currentView,
    setView,
    viewingProfile,
    setViewingProfile,
    /**
     * intentionally return null for appNotification.
     * We have migrated to NotificationProvider (Toast), so we disable the old 
     * local state-based notification in AppOverlays by passing null here.
     * This prevents double rendering of notifications.
     */
    appNotification: null,
    setAppNotification,
    showNotification,
    isGlobalLoading,
    // Export new "View As" capabilities
    isViewAsMode,
    setIsViewAsMode,
    toggleViewAsMode
  };
};