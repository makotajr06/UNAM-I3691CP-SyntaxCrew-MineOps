import {
  addDoc,
  collection,
  doc,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "./firebase";

const clean = (value) => Object.fromEntries(Object.entries(value || {}).filter(([, item]) => item !== undefined));

export const createAlert = async ({
  title,
  message,
  severity = "medium",
  type = "general",
  zone = "",
  relatedId = "",
  target = "all",
}) => {
  const user = auth.currentUser;
  if (!user) throw new Error("You must be signed in to create alerts.");
  if (!title || !message) throw new Error("Alert title and message are required.");

  return addDoc(collection(db, "alerts"), clean({
    title,
    message,
    severity,
    type,
    zone,
    relatedId,
    target,
    status: "active",
    createdBy: user.uid,
    createdByName: user.displayName || user.email || "MineOps user",
    ackCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }));
};

export const createUserNotification = async ({ userId, title, message, severity = "medium", type = "general", relatedId = "" }) => {
  const user = auth.currentUser;
  if (!user) throw new Error("You must be signed in to create notifications.");
  if (!userId) throw new Error("No notification recipient selected.");

  return addDoc(collection(db, "users", userId, "notifications"), clean({
    title,
    message,
    severity,
    type,
    relatedId,
    read: false,
    createdBy: user.uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }));
};

export const watchAlerts = (callback, { onlyActive = true } = {}) => {
  const alertsQuery = query(collection(db, "alerts"), orderBy("createdAt", "desc"), limit(40));
  return onSnapshot(alertsQuery, (snapshot) => {
    const items = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
    callback(onlyActive ? items.filter((item) => item.status === "active") : items);
  }, () => callback([]));
};

export const watchCurrentUserNotifications = (callback) => {
  const user = auth.currentUser;
  if (!user) {
    callback([]);
    return () => {};
  }

  const notificationsQuery = query(collection(db, "users", user.uid, "notifications"), orderBy("createdAt", "desc"), limit(40));
  return onSnapshot(notificationsQuery, (snapshot) => {
    callback(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
  }, () => callback([]));
};

export const markNotificationRead = async (notificationId) => {
  const user = auth.currentUser;
  if (!user) throw new Error("You must be signed in to update notifications.");
  if (!notificationId) throw new Error("No notification selected.");

  await updateDoc(doc(db, "users", user.uid, "notifications", notificationId), {
    read: true,
    readAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

export const acknowledgeAlert = async (alertId) => {
  const user = auth.currentUser;
  if (!user) throw new Error("You must be signed in to acknowledge alerts.");
  if (!alertId) throw new Error("No alert selected.");

  await setDoc(doc(db, "alerts", alertId, "acknowledgements", user.uid), {
    uid: user.uid,
    name: user.displayName || user.email || "MineOps user",
    acknowledgedAt: serverTimestamp(),
  }, { merge: true });

  await updateDoc(doc(db, "alerts", alertId), {
    ackCount: increment(1),
    updatedAt: serverTimestamp(),
  });
};

export const saveShiftReminder = async ({ startsAt = "07:00", endsAt = "19:00", leadTime = "30 minutes before", enabled = true } = {}) => {
  const user = auth.currentUser;
  if (!user) throw new Error("You must be signed in to save reminders.");

  await setDoc(doc(db, "users", user.uid, "reminders", "shift"), {
    type: "shift",
    startsAt,
    endsAt,
    leadTime,
    enabled,
    updatedAt: serverTimestamp(),
  }, { merge: true });
};

export const watchCurrentUserReminders = (callback) => {
  const user = auth.currentUser;
  if (!user) {
    callback([]);
    return () => {};
  }

  return onSnapshot(collection(db, "users", user.uid, "reminders"), (snapshot) => {
    callback(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
  }, () => callback([]));
};
