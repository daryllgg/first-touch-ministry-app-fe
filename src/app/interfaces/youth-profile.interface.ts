export interface YouthProfile {
  id: string;
  firstName: string;
  lastName: string;
  nickname?: string;
  birthDate: string;
  gender: 'MALE' | 'FEMALE';
  photo?: string;
  station?: { id: string; name: string };
  motherName?: string;
  fatherName?: string;
  parentsName?: string;
  facebookLink?: string;
  contactNumber?: string;
  address?: string;
  notes?: string;
  isActive: boolean;
  createdBy: { id: string; firstName: string; lastName: string };
  createdAt: string;
  updatedAt: string;
}

export interface Station {
  id: string;
  name: string;
  isActive: boolean;
}
