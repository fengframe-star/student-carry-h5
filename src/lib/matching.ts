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

export function itemCategoryLabel(category: ItemCategory | string | undefined, language: "en" | "zh") {
  if (!category) {
    return language === "zh" ? "其他" : "Others";
  }

  const labels: Record<string, string> = {
    Documents: "文件",
    Clothes: "衣物",
    Cosmetics: "美妆",
    Electronics: "电子产品",
    Gifts: "礼品",
    Food: "食品",
    "Medicine (restricted)": "药品（受限）",
    Others: "其他",
  };

  return language === "zh" ? labels[category] || category : category;
}

function normalize(value: string) {
  return value.toLowerCase().replace(/\s/g, "").replace(/'/g, "");
}

function sameValue(a?: string, b?: string) {
  return Boolean(a && b && normalize(a) === normalize(b));
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
    pastMatches: [5, 3, 8, 2][index % 4],
    responseSpeed: ["Usually replies in 10 min", "Replies within 1 hour", "Fast response", "Same-day reply"][index % 4],
    active: index % 2 === 0 ? "Active today" : "Active recently",
    verified: index % 3 === 0,
  };
}

export function scoreCarrierForRequest(request: Partial<RequestSubmission>, carrier: CarrierSubmission) {
  if (
    request.fromCountry &&
    carrier.fromCountry &&
    !sameValue(request.fromCountry, carrier.fromCountry)
  ) {
    return 0;
  }
  if (
    request.toCountry &&
    carrier.toCountry &&
    !sameValue(request.toCountry, carrier.toCountry)
  ) {
    return 0;
  }

  let score = 0;

  if (sameValue(request.fromCountry, carrier.fromCountry) && sameValue(request.toCountry, carrier.toCountry)) score += 60;
  if (sameValue(request.fromLocation, carrier.fromLocation) && sameValue(request.toLocation, carrier.toLocation)) score += 25;
  else if (sameValue(request.toLocation, carrier.toLocation)) score += 14;
  else if (sameValue(request.fromLocation, carrier.fromLocation)) score += 8;
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
  if (
    carrier.fromCountry &&
    request.fromCountry &&
    !sameValue(carrier.fromCountry, request.fromCountry)
  ) {
    return 0;
  }
  if (
    carrier.toCountry &&
    request.toCountry &&
    !sameValue(carrier.toCountry, request.toCountry)
  ) {
    return 0;
  }

  let score = 0;

  if (sameValue(carrier.fromCountry, request.fromCountry) && sameValue(carrier.toCountry, request.toCountry)) score += 60;
  if (sameValue(carrier.fromLocation, request.fromLocation) && sameValue(carrier.toLocation, request.toLocation)) score += 25;
  else if (sameValue(carrier.toLocation, request.toLocation)) score += 14;
  else if (sameValue(carrier.fromLocation, request.fromLocation)) score += 8;
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
    .filter((item) => item.score >= 80)
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
    .filter((item) => item.score >= 80)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}
