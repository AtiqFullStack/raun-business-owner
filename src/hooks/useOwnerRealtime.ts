import { useEffect } from 'react';
import {
  AppState,
  DeviceEventEmitter,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import { getApps } from '@react-native-firebase/app';
import {
  getMessaging,
  getToken,
  onMessage,
  onNotificationOpenedApp,
  getInitialNotification,
  onTokenRefresh,
  requestPermission,
} from '@react-native-firebase/messaging';
import useAxios from './useAxios';
import { useAuth } from '../store/useAuth';
import { useToast } from '../store/useToast';
import {
  useOwnerNotifications,
  type DemandEvent,
} from '../store/useOwnerNotifications';
import {
  connectSocket,
  disconnectSocket,
  socket,
} from '../services/socketService';
import {
  clearDemandNotification,
  flushDemandNotification,
  openDemandNotification,
} from '../services/demandNotificationNavigation';

export default function useOwnerRealtime() {
  const token = useAuth(state => state.token),
    hydrated = useAuth(state => state.hasHydrated);
  const { fetchData } = useAxios();
  useEffect(() => {
    let active = true,
      initializing = false,
      ready = false,
      retries = 0;
    let socketListening = false,
      pushListening = false,
      permissionRequested = false;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    const cleanup: (() => void)[] = [];
    disconnectSocket();
    useOwnerNotifications.getState().reset(null);
    if (!hydrated || !token) {
      clearDemandNotification();
      return;
    }
    const ownerId = useAuth.getState().user?.id;
    const receive = (data: DemandEvent) => {
      if (
        !active ||
        useAuth.getState().token !== token ||
        data.providerId !== ownerId
      )
        return;
      const fresh = useOwnerNotifications.getState().receive(data);
      DeviceEventEmitter.emit('demandBookingUpdated', data);
      if (fresh)
        useToast
          .getState()
          .showToast(
            data.body || data.title || 'Service booking updated',
            'success',
          );
    };
    const initialize = async () => {
      if (!active || initializing || ready) return;
      initializing = true;
      try {
        const profile = await fetchData<{
          userAuthId?: string;
          verificationStatus?: string;
          type?: string;
          isProfileCompleted?: boolean;
          fullName?: string;
          businessName?: string;
        }>({ url: '/business-owners/me', service: false });
        if (
          !active ||
          useAuth.getState().token !== token ||
          !profile.data?.userAuthId ||
          profile.data.verificationStatus !== 'APPROVED'
        )
          return;
        const user = useAuth.getState().user;
        if (!user || user.id !== ownerId) return;
        useAuth.setState({
          user: {
            ...user,
            userAuthId: profile.data.userAuthId,
            name:
              profile.data.fullName || profile.data.businessName || user.name,
          },
          ownerType: profile.data.type || useAuth.getState().ownerType,
          isProfileCompleted:
            profile.data.isProfileCompleted ??
            useAuth.getState().isProfileCompleted,
        });
        if (!socketListening) {
          useOwnerNotifications.getState().reset(ownerId);
          socket.on('DEMAND_BOOKING_UPDATED', receive);
          cleanup.push(() => socket.off('DEMAND_BOOKING_UPDATED', receive));
          socketListening = true;
        }
        connectSocket(token);
        flushDemandNotification();
        // Firebase config is supplied by the native app. Socket updates also work without a push token.
        if (!getApps().length) {
          ready = true;
          return;
        }
        const messaging = getMessaging();
        const saveToken = async (fcmToken: string) => {
          if (active && useAuth.getState().token === token)
            await fetchData({
              url: '/auth/fcm-token',
              method: 'POST',
              data: { fcmToken },
              service: false,
            });
        };
        if (!pushListening) {
          cleanup.push(
            onMessage(messaging, message => receive(message.data || {})),
          );
          cleanup.push(
            onTokenRefresh(messaging, value => {
              saveToken(value).catch(() => {
                ready = false;
              });
            }),
          );
          cleanup.push(
            onNotificationOpenedApp(messaging, message =>
              openDemandNotification(message.data || {}),
            ),
          );
          pushListening = true;
          const initial = await getInitialNotification(messaging);
          if (active && initial) openDemandNotification(initial.data || {});
        }
        if (!permissionRequested) {
          permissionRequested = true;
          if (Platform.OS === 'android' && Number(Platform.Version) >= 33)
            await PermissionsAndroid.request(
              PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
            );
          if (Platform.OS === 'ios') await requestPermission(messaging);
        }
        if (active) await saveToken(await getToken(messaging));
        ready = true;
      } catch (error) {
        if (active) {
          console.warn(
            'Owner notification initialization failed',
            error instanceof Error ? error.message : 'Unavailable',
          );
          const status =
            error && typeof error === 'object' && 'status' in error
              ? Number(error.status)
              : 0;
          if (
            (!status || status >= 500 || status === 408 || status === 429) &&
            retries++ < 5
          ) {
            retryTimer = setTimeout(() => {
              initialize();
            }, 10000);
          }
        }
      } finally {
        initializing = false;
      }
    };
    initialize();
    const appState = AppState.addEventListener('change', state => {
      if (state === 'active' && active) {
        initialize();
        DeviceEventEmitter.emit('demandBookingUpdated', {});
      }
    });
    return () => {
      active = false;
      if (retryTimer) clearTimeout(retryTimer);
      cleanup.forEach(unsubscribe => unsubscribe());
      appState.remove();
      disconnectSocket();
      useOwnerNotifications.getState().reset(null);
      if (!useAuth.getState().token) {
        clearDemandNotification();
        // Use the captured session token to clear the previous owner's device registration.
        fetchData({
          url: '/auth/fcm-token',
          method: 'POST',
          data: { fcmToken: null },
          service: false,
        }).catch(() => {});
      }
    };
  }, [fetchData, hydrated, token]);
}
