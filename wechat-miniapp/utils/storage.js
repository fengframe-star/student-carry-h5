const SUBMISSIONS_KEY = "studentCarrySubmissions";
const REGISTRATIONS_KEY = "studentCarryRegistrations";

function getCloudDb() {
  if (wx.cloud) {
    return wx.cloud.database();
  }

  return null;
}

function nowDate() {
  return new Date().toISOString().slice(0, 10);
}

function withMeta(data) {
  return {
    ...data,
    createdAt: Date.now(),
    publishedDate: data.publishedDate || nowDate()
  };
}

function readLocal(key) {
  return wx.getStorageSync(key) || [];
}

function writeLocal(key, item) {
  const current = readLocal(key);
  const next = [{ _id: `${Date.now()}`, ...item }, ...current];
  wx.setStorageSync(key, next);
  return next[0];
}

async function addSubmission(data) {
  const item = withMeta(data);
  const db = getCloudDb();

  if (db) {
    try {
      return await db.collection("submissions").add({ data: item });
    } catch (error) {
      return writeLocal(SUBMISSIONS_KEY, item);
    }
  }

  return writeLocal(SUBMISSIONS_KEY, item);
}

async function addRegistration(data) {
  const item = {
    ...data,
    createdAt: Date.now()
  };
  const db = getCloudDb();

  if (db) {
    try {
      return await db.collection("registrations").add({ data: item });
    } catch (error) {
      return writeLocal(REGISTRATIONS_KEY, item);
    }
  }

  return writeLocal(REGISTRATIONS_KEY, item);
}

async function getSubmissions() {
  const db = getCloudDb();

  if (db) {
    try {
      const result = await db
        .collection("submissions")
        .orderBy("createdAt", "desc")
        .get();
      return result.data || [];
    } catch (error) {
      return readLocal(SUBMISSIONS_KEY);
    }
  }

  return readLocal(SUBMISSIONS_KEY);
}

async function getRegistrations() {
  const db = getCloudDb();

  if (db) {
    try {
      const result = await db
        .collection("registrations")
        .orderBy("createdAt", "desc")
        .get();
      return result.data || [];
    } catch (error) {
      return readLocal(REGISTRATIONS_KEY);
    }
  }

  return readLocal(REGISTRATIONS_KEY);
}

async function updatePublishedDate(id, publishedDate) {
  const db = getCloudDb();

  if (db) {
    try {
      return await db.collection("submissions").doc(id).update({
        data: { publishedDate }
      });
    } catch (error) {
      const current = readLocal(SUBMISSIONS_KEY);
      const next = current.map((item) =>
        item._id === id ? { ...item, publishedDate } : item
      );
      wx.setStorageSync(SUBMISSIONS_KEY, next);
      return next;
    }
  }

  const current = readLocal(SUBMISSIONS_KEY);
  const next = current.map((item) =>
    item._id === id ? { ...item, publishedDate } : item
  );
  wx.setStorageSync(SUBMISSIONS_KEY, next);
  return next;
}

async function updateSubmissionDate(id, field, value) {
  const db = getCloudDb();

  if (db) {
    try {
      return await db.collection("submissions").doc(id).update({
        data: { [field]: value }
      });
    } catch (error) {
      const current = readLocal(SUBMISSIONS_KEY);
      const next = current.map((item) =>
        item._id === id ? { ...item, [field]: value } : item
      );
      wx.setStorageSync(SUBMISSIONS_KEY, next);
      return next;
    }
  }

  const current = readLocal(SUBMISSIONS_KEY);
  const next = current.map((item) =>
    item._id === id ? { ...item, [field]: value } : item
  );
  wx.setStorageSync(SUBMISSIONS_KEY, next);
  return next;
}

module.exports = {
  addSubmission,
  addRegistration,
  getRegistrations,
  getSubmissions,
  updateSubmissionDate,
  updatePublishedDate
};
