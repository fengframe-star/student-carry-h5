import type { CarrierSubmission, ItemCategory, RequestSubmission, Submission } from "../types";

export const itemCategories: ItemCategory[] = [
  "Documents",
  "Clothes",
  "Cosmetics",
  "Electronics",
  "Gifts",
  "Food",
  "Medicine (restricted)",
  "Others",
];

function normalize(value: string) {
  return value.toLowerCase().replace(/\s/g, "").replace(/'/g, "");
}

function splitRoute(route: string) {
  const [from = "", to = ""] = route.split(/→|->|至|到|-/).map((part) => part.trim());
  return { from, to };
}

function dayDistance(a?: string, b?: string) {
  if (!a || !b) {
    return 99;
  }

  const first = new Date(a).getTime();
  const second = new Date(b).getTime();
  if (Number.isNaN(first) || Number.isNaN(second)) {
    return 99;
  }

  return Math.abs(first - second) / 86_400_000;
}

export function requestRoute(request: Pick<RequestSubmission, "fromLocation" | "toLocation">) {
  return `${request.fromLocation || "From"} → ${request.toLocation || "To"}`;
}

export function reputationFor(index = 0) {
  return {
    completed: [5, 3, 8, 2][index % 4],
    responseSpeed: ["Usually replies in 10 min", "Replies within 1 hour", "Fast response", "Same-day reply"][index % 4],
    active: index % 2 === 0 ? "Active today" : "Active recently",
    verified: index % 3 === 0,
  };
}

export function scoreCarrierForRequest(request: Partial<RequestSubmission>, carrier: CarrierSubmission) {
  const requestFrom = normalize(request.fromLocation || "");
  const requestTo = normalize(request.toLocation || "");
  const carrierRoute = normalize(carrier.travelRoute || "");
  const carrierParts = splitRoute(carrier.travelRoute || "");
  let score = 0;

  if (carrierRoute.includes(requestFrom) && carrierRoute.includes(requestTo)) score += 50;
  if (requestTo && normalize(carrierParts.to).includes(requestTo)) score += 28;
  if (requestFrom && normalize(carrierParts.from).includes(requestFrom)) score += 16;
  if (dayDistance(request.desiredDeliveryDate, carrier.travelDate) <= 7) score += 12;
  if (
    request.itemCategory &&
    carrier.acceptedItemTypes?.some((item) => item === request.itemCategory)
  ) {
    score += 10;
  }

  return score;
}

export function scoreRequestForCarrier(carrier: Partial<CarrierSubmission>, request: RequestSubmission) {
  const carrierParts = splitRoute(carrier.travelRoute || "");
  const carrierRoute = normalize(carrier.travelRoute || "");
  const requestFrom = normalize(request.fromLocation || "");
  const requestTo = normalize(request.toLocation || "");
  let score = 0;

  if (carrierRoute.includes(requestFrom) && carrierRoute.includes(requestTo)) score += 50;
  if (requestTo && normalize(carrierParts.to).includes(requestTo)) score += 28;
  if (requestFrom && normalize(carrierParts.from).includes(requestFrom)) score += 16;
  if (dayDistance(carrier.travelDate, request.desiredDeliveryDate) <= 7) score += 12;
  if (carrier.acceptedItemTypes?.some((item) => item === request.itemCategory)) score += 10;

  return score;
}

export function matchingCarriers(request: Partial<RequestSubmission>, submissions: Submission[]) {
  return submissions
    .filter((submission): submission is CarrierSubmission => submission.type === "carrier")
    .map((carrier, index) => ({
      carrier,
      score: scoreCarrierForRequest(request, carrier),
      reputation: reputationFor(index),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

export function matchingRequests(carrier: Partial<CarrierSubmission>, submissions: Submission[]) {
  return submissions
    .filter((submission): submission is RequestSubmission => submission.type === "request")
    .map((request, index) => ({
      request,
      score: scoreRequestForCarrier(carrier, request),
      reputation: reputationFor(index),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}
