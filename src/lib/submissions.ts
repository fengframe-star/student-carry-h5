import { cloudbaseDb, ensureCloudbaseLogin } from "../utils/cloudbase";
import { currentOwnerId, profileNickname } from "./profile";
import type {
  CarrierSubmission,
  RegistrationSubmission,
  RequestSubmission,
  Submission,
} from "../types";

type RequestInput = Omit<RequestSubmission, "id" | "type" | "status" | "publishedDate" | "createdAt">;
type CarrierInput = Omit<CarrierSubmission, "id" | "type" | "status" | "publishedDate" | "createdAt">;
type RegistrationInput = Omit<RegistrationSubmission, "id" | "createdAt">;

const postsCollectionName = "posts";
const usersCollectionName = "users";

function today() {
  return new Date().toISOString().slice(0, 10);
}

function timestamp() {
  return Date.now();
}

function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map(stripUndefined) as T;
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, entry]) => entry !== undefined)
        .map(([key, entry]) => [key, stripUndefined(entry)]),
    ) as T;
  }

  return value;
}

function dateFrom(value: unknown) {
  if (!value) {
    return undefined;
  }

  if (value instanceof Date) {
    return value;
  }

  if (typeof value === "number" || typeof value === "string") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date;
  }

  return undefined;
}

function normalizeSubmission(data: Record<string, unknown>): Submission {
  return {
    ...data,
    id: String(data._id || data.id || ""),
    status: data.status === "Matched" ? "Matched" : "Open",
    createdAt: dateFrom(data.createdAt),
  } as Submission;
}

function isOwner(submission: Submission, ownerId = currentOwnerId()) {
  return Boolean(submission.ownerId && submission.ownerId === ownerId);
}

async function getPost(id: string) {
  const result = await cloudbaseDb.collection(postsCollectionName).doc(id).get();
  const post = result.data?.[0];
  return post ? normalizeSubmission(post) : null;
}

function isStatusOnlyUpdate(data: Partial<Submission>) {
  const keys = Object.keys(data);
  return keys.length > 0 && keys.every((key) => key === "status");
}

export async function createRequestSubmission(data: RequestInput) {
  const ownerId = await ensureCloudbaseLogin();
  await cloudbaseDb.collection(postsCollectionName).add(
    stripUndefined({
      ...data,
      ownerId,
      ownerNickname: profileNickname(),
      name: profileNickname(),
      type: "request",
      status: "Open",
      publishedDate: today(),
      createdAt: timestamp(),
      updatedAt: timestamp(),
    }),
  );
}

export async function createCarrierSubmission(data: CarrierInput) {
  const ownerId = await ensureCloudbaseLogin();
  await cloudbaseDb.collection(postsCollectionName).add(
    stripUndefined({
      ...data,
      ownerId,
      ownerNickname: profileNickname(),
      name: profileNickname(),
      type: "carrier",
      status: "Open",
      publishedDate: today(),
      createdAt: timestamp(),
      updatedAt: timestamp(),
    }),
  );
}

export async function getSubmissions() {
  const result = await cloudbaseDb
    .collection(postsCollectionName)
    .orderBy("createdAt", "desc")
    .get();

  return (result.data || []).map(normalizeSubmission);
}

export async function updateSubmissionPublishedDate(id: string, publishedDate: string) {
  return updateSubmission(id, { publishedDate } as Partial<Submission>);
}

export async function updateSubmissionDate(
  id: string,
  field: "desiredDeliveryDate" | "travelDate",
  value: string,
) {
  return updateSubmission(id, { [field]: value } as Partial<Submission>);
}

export async function updateSubmission(id: string, data: Partial<Submission>) {
  const ownerId = await ensureCloudbaseLogin();

  if (!isStatusOnlyUpdate(data)) {
    const post = await getPost(id);
    if (!post || !isOwner(post, ownerId)) {
      throw new Error("Only the post owner can edit this post.");
    }
  }

  await cloudbaseDb
    .collection(postsCollectionName)
    .doc(id)
    .update(stripUndefined({ ...data, updatedAt: timestamp() }));
}

export async function deleteSubmission(id: string) {
  const ownerId = await ensureCloudbaseLogin();
  const post = await getPost(id);
  if (!post || !isOwner(post, ownerId)) {
    throw new Error("Only the post owner can delete this post.");
  }

  await cloudbaseDb.collection(postsCollectionName).doc(id).remove();
}

export async function createRegistrationSubmission(data: RegistrationInput) {
  const ownerId = await ensureCloudbaseLogin();
  await cloudbaseDb.collection(usersCollectionName).add(
    stripUndefined({
      ...data,
      ownerId,
      createdAt: timestamp(),
      updatedAt: timestamp(),
    }),
  );
}
