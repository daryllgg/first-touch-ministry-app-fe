export interface GivingProgram {
  id: string;
  name: string;
  type: 'SEED_FAITH' | 'FAITH_PLEDGE' | 'CUSTOM';
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  conductedDate: string | null;
  programMonths: string[] | null;
  isActive: boolean;
  createdBy: { id: string; firstName: string; lastName: string };
  createdAt: string;
  updatedAt: string;
}

export interface Pledge {
  id: string;
  user: { id: string; firstName: string; lastName: string; email: string; profilePicture?: string };
  program: GivingProgram;
  pledgeAmount: number;
  totalMonths: number | null;
  startMonth: string | null;
  monthlyAmounts: Record<string, number> | null;
  notes: string | null;
  createdBy: { id: string; firstName: string; lastName: string };
  payments: PledgePayment[];
  createdAt: string;
  updatedAt: string;
}

export interface PledgePayment {
  id: string;
  amount: number;
  date: string;
  month: string | null;
  paymentMethod: 'CASH' | 'GCASH' | 'BANK_TRANSFER' | 'CHECK' | 'OTHER';
  referenceNumber: string | null;
  notes: string | null;
  recordedBy: { id: string; firstName: string; lastName: string };
  createdAt: string;
}

export interface PledgeSummary {
  year: number;
  programs: {
    programId: string;
    programName: string;
    programType: string;
    total: string;
    pledgeeCount: string;
  }[];
  grandTotal: number;
}

export interface ComplianceData {
  program: GivingProgram;
  pledgees: CompliancePledgee[];
  complianceRate: number;
}

export interface CompliancePledgee {
  pledgeId: string;
  userId: string;
  firstName: string;
  lastName: string;
  pledgeAmount: number;
  totalMonths: number;
  monthsPaid: number;
  monthsDue: number;
  totalPaid: number;
  amountDue: number;
  status: 'COMPLETE' | 'ON_TRACK' | 'BEHIND' | 'NEW';
}

export interface MonthlyTrend {
  month: string;
  programType: string;
  total: string;
}
