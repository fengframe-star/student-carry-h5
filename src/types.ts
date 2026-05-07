export const STATUSES = [
  "Open",
  "Negotiating",
  "Matched",
  "In Transit",
  "Completed",
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
export type ItemCategory =
  | "Documents"
  | "Clothes"
  | "Cosmetics"
  | "Electronics"
  | "Gifts"
  | "Food"
  | "Medicine (restricted)"
  | "Others";

export interface RequestSubmission {
  id: string;
  type: "request";
  name: string;
  contact: string;
  fromLocation: string;
  toLocation: string;
  itemName: string;
  itemCategory?: ItemCategory;
  estimatedValueEur: number;
  desiredDeliveryDate: string;
  budgetEur: number;
  chinaDomesticShipping: ChinaDomesticShipping;
  notes: string;
  confirmation: boolean;
  complianceConfirmation?: boolean;
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
  acceptedItemTypes?: ItemCategory[];
  expectedReward: string;
  notes: string;
  agreement: boolean;
  complianceConfirmation?: boolean;
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
