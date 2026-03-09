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

export interface LineupComment {
  id: string;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    profilePicture?: string;
  };
  content: string;
  mentionedUsers: { id: string; firstName: string; lastName: string }[];
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
  rehearsalDate?: string;
  overallTheme?: string;
  rehearsalTime?: string;
  reviewedBy: User | null;
  reviewedAt: string | null;
  members: LineupMember[];
  songs: LineupSong[];
  reviews: LineupReview[];
  comments: LineupComment[];
  playlistUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubstitutionRequest {
  id: string;
  lineupMember: LineupMember & {
    lineup?: {
      id: string;
      serviceType: string;
      customServiceName?: string;
      dates: string[];
    }
  };
  requestedBy: User;
  substituteUser: User | null;
  reason: string;
  status: 'PENDING' | 'HEAD_APPROVED' | 'HEAD_REJECTED' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED';
  declineReason?: string;
  respondedBy: User | null;
  respondedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
