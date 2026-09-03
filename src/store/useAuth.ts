import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthState } from '../types/auth';

export const useAuth = create<AuthState>()(
  persist(
    set => ({
      user: null,
      token: null,
      ownerType: null,
      isProfileCompleted: null,
      hasHydrated: false,

      setHasHydrated: hasHydrated => {
        set({ hasHydrated });
      },

      login: (user, token, ownerMeta) => {
        set({
          user,
          token,
          ownerType: ownerMeta?.ownerType ?? null,
          isProfileCompleted: ownerMeta?.isProfileCompleted ?? null,
        });
      },

      updateUserProfile: profileDetails => {
        set(state => {
          if (!state.user) {
            return state;
          }

          const name =
            `${profileDetails.firstName} ${profileDetails.lastName}`.trim();

          return {
            user: {
              ...state.user,
              name,
              email: profileDetails.email,
              role: profileDetails.role,
              profileDetails,
            },
          };
        });
      },

      logout: () => {
        set({
          user: null,
          token: null,
          ownerType: null,
          isProfileCompleted: null,
        });
      },
    }),
    {
      name: 'auth-storage', // storage key
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => state => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
