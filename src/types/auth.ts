export type UserRole =
  | 'user'
  | 'admin'
  | 'moderator'
  | 'vendor'
  | 'BUSINESS_OWNER'
  | string;

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
  ownerType: string | null;
  isProfileCompleted: boolean | null;
  hasHydrated: boolean;
  setHasHydrated: (hasHydrated: boolean) => void;
  login: (
    user: User,
    token: string,
    ownerMeta?: {
      ownerType?: string | null;
      isProfileCompleted?: boolean | null;
    },
  ) => void;
  updateUserProfile: (profileDetails: UserProfileDetails) => void;
  logout: () => void;
};
