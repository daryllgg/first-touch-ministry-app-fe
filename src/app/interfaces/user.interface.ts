export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  profilePicture?: string;
  contactNumber?: string;
  birthday?: string;
  gender?: 'MALE' | 'FEMALE';
  address?: string;
  isApproved: boolean;
  roles: { id: number; name: string }[];
  createdAt: string;
}

export interface LoginResponse {
  accessToken: string;
  user: User;
}
