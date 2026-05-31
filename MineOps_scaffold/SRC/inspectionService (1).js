import { addDoc, collection, doc, limit, onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import { uploadInspectionImage } from "./storageService";

export const watchInspectionReports = (callback) => {
  const reportsQuery = query(collection(db, "inspections"), orderBy("createdAt", "desc"), limit(30));
  return onSnapshot(reportsQuery, (snapshot) => {
    callback(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
  }, () => callback([]));
};

export const createInspectionReport = async ({ zone, checks, findings, photos = [] }) => {
  const user = auth.currentUser;
  if (!user) throw new Error("You must be signed in to upload an inspection report.");
  if (!zone) throw new Error("Select an inspection zone.");
  if (!checks?.length || checks.some((item) => !item.status)) throw new Error("Complete every checklist item.");

  const passCount = checks.filter((item) => item.status === "pass").length;
  const failCount = checks.filter((item) => item.status === "fail").length;
  const naCount = checks.filter((item) => item.status === "na").length;
  const reportRef = await addDoc(collection(db, "inspections"), {
    zone,
    inspectorId: user.uid,
    inspectorName: user.displayName || user.email || "MineOps user",
    status: failCount > 0 ? "fail" : "pass",
    checks,
    findings: findings || "",
    passCount,
    failCount,
    naCount,
    photoUrls: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  const photoUrls = [];
  for (const photo of photos) {
    if (photo.uri) {
      photoUrls.push(await uploadInspectionImage({
        inspectionId: reportRef.id,
        uri: photo.uri,
        contentType: photo.mimeType || "image/jpeg",
      }));
    }
  }

  if (photoUrls.length) {
    await updateDoc(doc(db, "inspections", reportRef.id), { photoUrls, updatedAt: serverTimestamp() });
  }

  return { id: reportRef.id, zone, passCount, failCount, naCount, photoUrls };
};

export const acknowledgeInspectionReport = async (reportId) => {
  const user = auth.currentUser;
  if (!user) throw new Error("You must be signed in to acknowledge reports.");
  if (!reportId) throw new Error("No report selected.");

  await setDoc(doc(db, "inspections", reportId, "acknowledgements", user.uid), {
    uid: user.uid,
    name: user.displayName || user.email || "MineOps user",
    acknowledgedAt: serverTimestamp(),
  }, { merge: true });

  await updateDoc(doc(db, "inspections", reportId), {
    acknowledged: true,
    acknowledgedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};
