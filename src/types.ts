export const STATUSES = [
  "Open",
  "Matched",
] as const;

export type SubmissionStatus = (typeof STATUSES)[number] | "Pending";

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
  ownerId?: string;
  ownerNickname?: string;
  contact: string;
  fromCountry?: string;
  fromLocation: string;
  toCountry?: string;
  toLocation: string;
  itemName: string;
  itemCategory?: ItemCategory;
  itemPhotoDataUrl?: string;
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
  updatedAt?: Date;
  matchedAt?: number;
}

export interface CarrierSubmission {
  id: string;
  type: "carrier";
  name: string;
  ownerId?: string;
  ownerNickname?: string;
  contact: string;
  fromCountry?: string;
  fromLocation?: string;
  toCountry?: string;
  toLocation?: string;
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
  updatedAt?: Date;
  matchedAt?: number;
}

export type Submission = RequestSubmission | CarrierSubmission;

export interface RegistrationSubmission {
  id: string;
  firstName: string;
  lastName: string;
  nickname: string;
  email: string;
  phoneNumber?: string;
  currentCity: string;
  schoolOrUniversity?: string;
  verificationLater: VerificationLater;
  studentVerification?: boolean;
  identityVerified?: boolean;
  createdAt?: Date;
}
