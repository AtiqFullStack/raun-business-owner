export type UserRole = 'user' | 'admin' | 'moderator' | 'vendor';

export type UserProfileDetails = {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  role: UserRole;
  profileImage?: string;
};

export type User = {
  id: string;
  userAuthId?: string;
  name: string;
  email: string;
  role: UserRole;
  profileDetails: UserProfileDetails;
};

export type AuthState = {
  user: User | null;
  token: string | null;
  hasHydrated: boolean;
  setHasHydrated: (hasHydrated: boolean) => void;
  login: (user: User, token: string) => void;
  updateUserProfile: (profileDetails: UserProfileDetails) => void;
  logout: () => void;
};
