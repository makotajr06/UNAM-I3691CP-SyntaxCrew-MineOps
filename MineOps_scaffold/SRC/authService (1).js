import {
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  EmailAuthProvider,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db, firebaseConfig } from "./firebase";

export const defaultUserSettings = {
  hazardAlerts: true,
  shiftReminders: true,
  shiftReminderLeadTime: "30 minutes before",
  offlineMode: true,
  theme: "Dark",
  language: "English",
};

const friendlyAuthError = (error) => {
  switch (error?.code) {
    case "auth/invalid-credential":
    case "auth/invalid-email":
    case "auth/user-not-found":
    case "auth/wrong-password":
      return "Wrong password or email.";
    case "auth/network-request-failed":
      return "Check your connection and try again.";
    case "auth/too-many-requests":
      return "Too many failed attempts. Try again later.";
    default:
      return error?.message || "Unable to sign in.";
  }
};

const friendlyResetError = (error) => {
  switch (error?.code) {
    case "auth/invalid-email":
      return "Enter a valid email address.";
    case "auth/missing-email":
      return "Enter your email.";
    case "auth/network-request-failed":
      return "Check your connection and try again.";
    case "auth/too-many-requests":
      return "Too many reset attempts. Try again later.";
    default:
      return error?.message || "Unable to send reset link.";
  }
};

const initialsFromName = (name) =>
  String(name || "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "MO";

const withoutUndefined = (value) =>
  Object.fromEntries(Object.entries(value || {}).filter(([, item]) => item !== undefined));

const canStoreOnAuthProfile = (photoURL) =>
  typeof photoURL === "string"
  && !photoURL.startsWith("data:")
  && photoURL.length < 2048;

const profileFromAuthUser = (user, existing = {}) => {
  const displayName = existing.displayName || user.displayName || user.email?.split("@")[0] || "MineOps User";
  const email = existing.email || user.email || "";
  return withoutUndefined({
    displayName,
    email,
    initials: existing.initials || initialsFromName(displayName),
    role: existing.role || "worker",
    jobTitle: existing.jobTitle || "MineOps Worker",
    phone: existing.phone || "",
    site: existing.site || "Skorpion Mine - Site A",
    siteSupervisor: existing.siteSupervisor || "",
    status: existing.status || "active",
    photoURL: existing.photoURL || user.photoURL || "",
    createdAt: existing.createdAt || serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

export const ensureUserProfile = async (user = auth.currentUser) => {
  if (!user) return null;

  const profileRef = doc(db, "users", user.uid);
  const settingsRef = doc(db, "users", user.uid, "settings", "default");
  const profileSnap = await getDoc(profileRef);
  const settingsSnap = await getDoc(settingsRef);
  const profile = profileFromAuthUser(user, profileSnap.exists() ? profileSnap.data() : {});

  await setDoc(profileRef, profile, { merge: true });
  if (!settingsSnap.exists()) {
    await setDoc(settingsRef, {
      ...defaultUserSettings,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true });
  }

  return profile;
};

export const watchAuthState = (callback) =>
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      callback(null);
      return;
    }

    try {
      const profile = await ensureUserProfile(user);
      callback({ authUser: user, profile });
    } catch (error) {
      callback({ authUser: user, profile: profileFromAuthUser(user) });
    }
  });

export const registerUser = async ({ fullName, email, password }) => {
  const cleanName = fullName.trim();
  const cleanEmail = email.trim().toLowerCase();

  if (!cleanName) throw new Error("Enter your full name.");
  if (!cleanEmail) throw new Error("Enter your email.");
  if (password.length < 6) throw new Error("Password must be at least 6 characters.");

  const credential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
  await updateProfile(credential.user, { displayName: cleanName });

  const userProfile = {
    displayName: cleanName,
    email: cleanEmail,
    initials: initialsFromName(cleanName),
    role: "worker",
    jobTitle: "MineOps Worker",
    phone: "",
    site: "Skorpion Mine - Site A",
    status: "active",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(doc(db, "users", credential.user.uid), userProfile, { merge: true });
  await setDoc(doc(db, "users", credential.user.uid, "settings", "default"), {
    ...defaultUserSettings,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }, { merge: true });

  return credential.user;
};

export const loginUser = async ({ email, password }) => {
  const cleanEmail = email.trim().toLowerCase();

  if (!cleanEmail) throw new Error("Enter your email.");
  if (!password) throw new Error("Enter your password.");

  try {
    const credential = await signInWithEmailAndPassword(auth, cleanEmail, password);
    return credential.user;
  } catch (error) {
    if (error?.code === "auth/network-request-failed" && auth.currentUser?.email?.toLowerCase() === cleanEmail) {
      return auth.currentUser;
    }
    throw new Error(friendlyAuthError(error));
  }
};

export const resetPassword = async (email) => {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail) throw new Error("Enter your email.");

  try {
    const resetUrl = firebaseConfig.authDomain ? `https://${firebaseConfig.authDomain}` : undefined;
    await sendPasswordResetEmail(auth, cleanEmail, resetUrl ? {
      url: resetUrl,
      handleCodeInApp: false,
    } : undefined);
  } catch (error) {
    throw new Error(friendlyResetError(error));
  }
};

export const logoutUser = () => signOut(auth);

export const getCurrentUserProfile = async () => {
  const user = getAuth().currentUser;
  if (!user) return null;

  await ensureUserProfile(user);
  const profileSnap = await getDoc(doc(db, "users", user.uid));
  return {
    authUser: user,
    profile: profileSnap.exists() ? profileSnap.data() : null,
  };
};

export const updateUserProfile = async (updates) => {
  const user = getAuth().currentUser;
  if (!user) throw new Error("You must be signed in to update your profile.");

  const authUpdates = {};
  if (updates.displayName) authUpdates.displayName = updates.displayName;
  if (canStoreOnAuthProfile(updates.photoURL)) authUpdates.photoURL = updates.photoURL;
  if (Object.keys(authUpdates).length) await updateProfile(user, authUpdates);

  const cleanUpdates = withoutUndefined(updates);
  await setDoc(doc(db, "users", user.uid), withoutUndefined({
    ...cleanUpdates,
    initials: cleanUpdates.displayName ? initialsFromName(cleanUpdates.displayName) : undefined,
    updatedAt: serverTimestamp(),
  }), { merge: true });

  return { ...cleanUpdates, uid: user.uid };
};

export const watchCurrentUserProfile = (callback) => {
  const user = getAuth().currentUser;
  if (!user) {
    callback(null);
    return () => {};
  }

  return onSnapshot(doc(db, "users", user.uid), (snapshot) => {
    callback({
      authUser: user,
      profile: snapshot.exists() ? profileFromAuthUser(user, snapshot.data()) : profileFromAuthUser(user),
    });
  }, () => {
    callback({ authUser: user, profile: profileFromAuthUser(user) });
  });
};

export const watchCurrentUserSettings = (callback) => {
  const user = getAuth().currentUser;
  if (!user) {
    callback(null);
    return () => {};
  }

  return onSnapshot(doc(db, "users", user.uid, "settings", "default"), (snapshot) => {
    callback(snapshot.exists() ? { ...defaultUserSettings, ...snapshot.data() } : defaultUserSettings);
  }, () => {
    callback(defaultUserSettings);
  });
};

export const updateUserSettings = async (updates) => {
  const user = getAuth().currentUser;
  if (!user) throw new Error("You must be signed in to update settings.");

  await setDoc(doc(db, "users", user.uid, "settings", "default"), {
    ...withoutUndefined(updates),
    updatedAt: serverTimestamp(),
  }, { merge: true });
};

export const changeCurrentUserPassword = async ({ currentPassword, newPassword }) => {
  const user = getAuth().currentUser;
  if (!user?.email) throw new Error("You must be signed in to change your password.");
  if (!currentPassword) throw new Error("Enter your current password.");
  if (!newPassword || newPassword.length < 6) throw new Error("New password must be at least 6 characters.");

  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
  await updatePassword(user, newPassword);
};
