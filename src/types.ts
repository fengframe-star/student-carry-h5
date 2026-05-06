export const STATUSES = [
  "New",
  "Matched",
  "Paid",
  "Delivered",
  "Disputed",
  "Cancelled",
] as const;

export type SubmissionStatus = (typeof STATUSES)[number];

export type ChinaDomesticShipping =
  | "Yes"
  | "No"
  | "Not sure"
  | "Yes / 是"
  | "No / 否"
  | "Not sure / 不确定";
export type VerificationLater = "Yes" | "No" | "Yes / 是" | "No / 否";

export interface RequestSubmission {
  id: string;
  type: "request";
  name: string;
  contact: string;
  fromLocation: string;
  toLocation: string;
  itemName: string;
  estimatedValueEur: number;
  desiredDeliveryDate: string;
  budgetEur: number;
  chinaDomesticShipping: ChinaDomesticShipping;
  notes: string;
  confirmation: boolean;
  status: SubmissionStatus;
  publishedDate: string;
  createdAt?: Date;
}

export interface CarrierSubmission {
  id: string;
  type: "carrier";
  name: string;
  contact: string;
  travelRoute: string;
  travelDate: string;
  availableLuggageSpace: string;
  expectedReward: string;
  notes: string;
  agreement: boolean;
  status: SubmissionStatus;
  publishedDate: string;
  createdAt?: Date;
}

export type Submission = RequestSubmission | CarrierSubmission;

export interface RegistrationSubmission {
  id: string;
  fullName: string;
  email: string;
  messagingContact: string;
  city: string;
  schoolOrUniversity: string;
  verificationLater: VerificationLater;
  createdAt?: Date;
}
