import { User } from './user.interface';

export interface LineupMember {
  id: string;
  user: User;
  instrumentRole: {
    id: string;
    name: string;
    isDefault: boolean;
  };
  createdAt: string;
}

export interface LineupSong {
  id: string;
  title: string;
  link?: string;
  singer?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  orderIndex: number;
}

export interface InstrumentRole {
  id: string;
  name: string;
  isDefault: boolean;
  orderIndex: number;
}

export interface LineupReview {
  id: string;
  reviewer: {
    id: string;
    firstName: string;
    lastName: string;
    profilePicture?: string;
  };
  status: string;
  comment?: string;
  createdAt: string;
}

export interface WorshipLineup {
  id: string;
  dates: string[];
  serviceType: 'SUNDAY_SERVICE' | 'PLUG_IN_WORSHIP' | 'YOUTH_SERVICE' | 'SPECIAL_EVENT';
  customServiceName?: string;
  submittedBy: User;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED';
  notes: string;
  reviewedBy: User | null;
  reviewedAt: string | null;
  members: LineupMember[];
  songs: LineupSong[];
  reviews: LineupReview[];
  createdAt: string;
  updatedAt: string;
}

export interface SubstitutionRequest {
  id: string;
  lineupMember: LineupMember;
  requestedBy: User;
  substituteUser: User | null;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ACCEPTED';
  respondedBy: User | null;
  respondedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
