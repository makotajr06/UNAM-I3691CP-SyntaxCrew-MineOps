import { collection, deleteDoc, doc, getDoc, increment, limit, onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import { createAlert } from "./alertService";
import { deleteStoredImage, uploadHazardImage } from "./storageService";

const imageStorageMode = (url) => (url?.startsWith("data:") ? "firestore-data-url" : "firebase-storage");

export const createHazardAlert = async ({ type, zone, severity, description, photoUri, photoBase64, photoContentType }) => {
  const user = auth.currentUser;
  if (!user) throw new Error("You must be signed in to report a hazard.");
  if (!type || !zone || !severity || !description?.trim()) {
    throw new Error("Complete the hazard type, zone, severity, and description.");
  }

  const hazardRef = doc(collection(db, "hazards"));
  let imageUrls = [];
  let imageStorage = null;
  let imagePath = null;

  if (photoUri) {
    imagePath = `hazards/${hazardRef.id}/${Date.now()}.jpg`;
    const url = await uploadHazardImage({
      hazardId: hazardRef.id,
      path: imagePath,
      uri: photoUri,
      base64: photoBase64,
      contentType: photoContentType || "image/jpeg",
    });
    imageUrls = [url];
    imageStorage = imageStorageMode(url);
  }

  await setDoc(hazardRef, {
    type,
    zone,
    severity,
    description: description.trim(),
    status: "active",
    reportedBy: {
      uid: user.uid,
      name: user.displayName || user.email || "MineOps user",
      email: user.email || "",
    },
    imageUrls,
    imageStorage,
    imagePath,
    ackCount: 0,
    crewTotal: 14,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await createAlert({
    title: `${severity.toUpperCase()} ${type}`,
    message: description.trim(),
    severity,
    type: "hazard",
    zone,
    relatedId: hazardRef.id,
    target: "shift",
  });

  return { id: hazardRef.id, imageUrls, imageStorage };
};

export const deleteHazard = async (hazard) => {
  const user = auth.currentUser;
  if (!user) throw new Error("You must be signed in to delete a hazard.");
  const hazardId = typeof hazard === "string" ? hazard : hazard?.id;
  if (!hazardId) throw new Error("No hazard selected.");

  const profileSnap = await getDoc(doc(db, "users", user.uid));
  const role = profileSnap.exists() ? profileSnap.data()?.role : null;
  if (!["supervisor", "admin"].includes(role)) {
    throw new Error("sorry consult supervisor");
  }

  if (hazard?.imagePath && hazard?.imageStorage !== "firestore-data-url") {
    try {
      await deleteStoredImage(hazard.imagePath);
    } catch {
      // Do not leave the hazard visible if the storage cleanup is blocked by rules.
    }
  }

  await deleteDoc(doc(db, "hazards", hazardId));
};

export const watchActiveHazards = (callback) => {
  const hazardsQuery = query(collection(db, "hazards"), orderBy("createdAt", "desc"), limit(30));
  return onSnapshot(hazardsQuery, (snapshot) => {
    callback(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
  }, () => callback([]));
};

export const acknowledgeHazard = async (hazardId) => {
  const user = auth.currentUser;
  if (!user) throw new Error("You must be signed in to acknowledge a hazard.");
  if (!hazardId) throw new Error("No hazard selected.");

  await setDoc(doc(db, "hazards", hazardId, "acknowledgements", user.uid), {
    uid: user.uid,
    name: user.displayName || user.email || "MineOps user",
    acknowledgedAt: serverTimestamp(),
  }, { merge: true });

  await updateDoc(doc(db, "hazards", hazardId), {
    ackCount: increment(1),
    updatedAt: serverTimestamp(),
  });
};
