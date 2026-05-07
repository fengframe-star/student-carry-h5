import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import type {
  CarrierSubmission,
  RegistrationSubmission,
  RequestSubmission,
  Submission,
} from "../types";

type RequestInput = Omit<RequestSubmission, "id" | "type" | "status" | "publishedDate" | "createdAt">;
type CarrierInput = Omit<CarrierSubmission, "id" | "type" | "status" | "publishedDate" | "createdAt">;
type RegistrationInput = Omit<RegistrationSubmission, "id" | "createdAt">;

const collectionName = "submissions";
const registrationsCollectionName = "registrations";
const localSubmissionsKey = "studentCarrySubmissions";
const localRegistrationsKey = "studentCarryRegistrations";

function requireDb() {
  if (!db) {
    throw new Error("Firebase is not configured. Add Vite Firebase variables to .env.local.");
  }

  return db;
}

function normalizeSubmission(id: string, data: Record<string, unknown>): Submission {
  return {
    ...data,
    id,
    createdAt:
      data.createdAt instanceof Timestamp ? data.createdAt.toDate() : undefined,
  } as Submission;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function readLocal<T>(key: string): T[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    return JSON.parse(window.localStorage.getItem(key) || "[]") as T[];
  } catch {
    return [];
  }
}

function writeLocal<T extends { id: string }>(key: string, item: T) {
  const current = readLocal<T>(key);
  window.localStorage.setItem(key, JSON.stringify([item, ...current]));
}

export async function createRequestSubmission(data: RequestInput) {
  if (!db) {
    writeLocal<Submission>(localSubmissionsKey, {
      ...data,
      id: `${Date.now()}`,
      type: "request",
      status: "Open",
      publishedDate: today(),
      createdAt: new Date(),
    });
    return;
  }

  await addDoc(collection(requireDb(), collectionName), {
    ...data,
    type: "request",
    status: "Open",
    publishedDate: new Date().toISOString().slice(0, 10),
    createdAt: serverTimestamp(),
  });
}

export async function createCarrierSubmission(data: CarrierInput) {
  if (!db) {
    writeLocal<Submission>(localSubmissionsKey, {
      ...data,
      id: `${Date.now()}`,
      type: "carrier",
      status: "Open",
      publishedDate: today(),
      createdAt: new Date(),
    });
    return;
  }

  await addDoc(collection(requireDb(), collectionName), {
    ...data,
    type: "carrier",
    status: "Open",
    publishedDate: new Date().toISOString().slice(0, 10),
    createdAt: serverTimestamp(),
  });
}

export async function getSubmissions() {
  if (!db) {
    return readLocal<Submission>(localSubmissionsKey).map((submission) => ({
      ...submission,
      createdAt: submission.createdAt ? new Date(submission.createdAt) : undefined,
    }));
  }

  const snapshot = await getDocs(
    query(collection(requireDb(), collectionName), orderBy("createdAt", "desc")),
  );

  return snapshot.docs.map((submission) =>
    normalizeSubmission(submission.id, submission.data()),
  );
}

export async function updateSubmissionPublishedDate(id: string, publishedDate: string) {
  if (!db) {
    const next = readLocal<Submission>(localSubmissionsKey).map((submission) =>
      submission.id === id ? { ...submission, publishedDate } : submission,
    );
    window.localStorage.setItem(localSubmissionsKey, JSON.stringify(next));
    return;
  }

  await updateDoc(doc(requireDb(), collectionName, id), { publishedDate });
}

export async function updateSubmissionDate(
  id: string,
  field: "desiredDeliveryDate" | "travelDate",
  value: string,
) {
  if (!db) {
    const next = readLocal<Submission>(localSubmissionsKey).map((submission) =>
      submission.id === id ? { ...submission, [field]: value } : submission,
    );
    window.localStorage.setItem(localSubmissionsKey, JSON.stringify(next));
    return;
  }

  await updateDoc(doc(requireDb(), collectionName, id), { [field]: value });
}

export async function updateSubmission(id: string, data: Partial<Submission>) {
  if (!db) {
    const next = readLocal<Submission>(localSubmissionsKey).map((submission) =>
      submission.id === id ? ({ ...submission, ...data } as Submission) : submission,
    );
    window.localStorage.setItem(localSubmissionsKey, JSON.stringify(next));
    return;
  }

  await updateDoc(doc(requireDb(), collectionName, id), data);
}

export async function deleteSubmission(id: string) {
  if (!db) {
    const next = readLocal<Submission>(localSubmissionsKey).filter(
      (submission) => submission.id !== id,
    );
    window.localStorage.setItem(localSubmissionsKey, JSON.stringify(next));
    return;
  }

  await deleteDoc(doc(requireDb(), collectionName, id));
}

export async function createRegistrationSubmission(data: RegistrationInput) {
  if (!db) {
    writeLocal<RegistrationSubmission>(localRegistrationsKey, {
      ...data,
      id: `${Date.now()}`,
      createdAt: new Date(),
    });
    return;
  }

  await addDoc(collection(requireDb(), registrationsCollectionName), {
    ...data,
    createdAt: serverTimestamp(),
  });
}
