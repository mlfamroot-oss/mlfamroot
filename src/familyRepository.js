import {
  addDoc, collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, query, serverTimestamp, setDoc, updateDoc, where, writeBatch,
} from "firebase/firestore";
import { db, familyId as configuredFamilyId } from "./firebaseClient";

const familyCollection = (familyId, name) => collection(db, "families", familyId, name);

const normalizedName = value => String(value || "").normalize("NFKC").toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim().replace(/\s+/g, " ");

export function isDuplicatePerson(existing, candidate) {
  if (normalizedName(existing.name) !== normalizedName(candidate.name)) return false;
  const existingYear = existing.birthYear ? Number(existing.birthYear) : null;
  const candidateYear = candidate.birthYear ? Number(candidate.birthYear) : null;
  if (existingYear && candidateYear) return existingYear === candidateYear;
  const existingTamil = normalizedName(existing.tamil);
  const candidateTamil = normalizedName(candidate.tamil);
  return Boolean(existingTamil && candidateTamil && existingTamil === candidateTamil);
}

function mapFamilyRecords(peopleDocuments, relationshipDocuments) {
  const relationships = relationshipDocuments.map(snapshot => ({ id: snapshot.id, ...snapshot.data() }));
  const people = peopleDocuments.map(snapshot => {
    const data = snapshot.data();
    const parentIds = relationships.filter(r => r.relationshipType === "parent" && r.toId === snapshot.id).map(r => r.fromId);
    const children = relationships.filter(r => r.relationshipType === "parent" && r.fromId === snapshot.id).map(r => r.toId);
    const spouseIds = relationships.filter(r => r.relationshipType === "spouse" && (r.fromId === snapshot.id || r.toId === snapshot.id)).map(r => r.fromId === snapshot.id ? r.toId : r.fromId);
    return {
      id: snapshot.id,
      name: data.fullName || "",
      tamil: data.tamilName || "",
      gender: data.gender ? data.gender[0].toUpperCase() + data.gender.slice(1) : "Unknown",
      birthYear: data.birthYear ?? null,
      status: data.lifeStatus ? data.lifeStatus[0].toUpperCase() + data.lifeStatus.slice(1) : "Unknown",
      generation: data.generation || 1,
      branch: data.branch || "Family",
      place: data.place || "",
      role: data.familyRole || "Family member",
      parentIds, spouseIds: [...new Set(spouseIds)], children: [...new Set(children)],
    };
  });
  return { people, relationships };
}

export async function loadFamily(familyId, userId) {
  const memberRef = doc(db, "families", familyId, "members", userId);
  const memberSnapshot = await getDoc(memberRef);
  const requestRef = doc(db, "families", familyId, "pending_users", userId);
  const requestSnapshot = memberSnapshot.exists() && memberSnapshot.data().status === "approved" ? null : await getDoc(requestRef);
  const request = requestSnapshot?.exists() ? { id: requestSnapshot.id, ...requestSnapshot.data() } : null;
  if (!memberSnapshot.exists()) return { member: null, request, people: [], relationships: [] };
  const member = { id: memberSnapshot.id, ...memberSnapshot.data() };
  if (member.status !== "approved") return { member, request, people: [], relationships: [] };

  const [peopleSnapshot, relationSnapshot] = await Promise.all([
    getDocs(familyCollection(familyId, "people")),
    getDocs(familyCollection(familyId, "relationships")),
  ]);
  return { member, request, ...mapFamilyRecords(peopleSnapshot.docs, relationSnapshot.docs) };
}

export function watchFamily(familyId, onChange, onError) {
  let peopleDocuments = null;
  let relationDocuments = null;
  const publishWhenReady = () => {
    if (peopleDocuments && relationDocuments) onChange(mapFamilyRecords(peopleDocuments, relationDocuments));
  };
  const stopPeople = onSnapshot(familyCollection(familyId, "people"), snapshot => {
    peopleDocuments = snapshot.docs;
    publishWhenReady();
  }, onError);
  const stopRelationships = onSnapshot(familyCollection(familyId, "relationships"), snapshot => {
    relationDocuments = snapshot.docs;
    publishWhenReady();
  }, onError);
  return () => { stopPeople(); stopRelationships(); };
}

export async function savePerson(familyId, user, person, {allowDuplicate = false} = {}) {
  const existingPeople = allowDuplicate ? null : await getDocs(familyCollection(familyId, "people"));
  const duplicate = existingPeople?.docs.some(snapshot => {
    const data = snapshot.data();
    return isDuplicatePerson({name:data.fullName, tamil:data.tamilName, birthYear:data.birthYear}, person);
  });
  if (duplicate) {
    const error = new Error("DUPLICATE_PERSON");
    error.code = "roots/duplicate-person";
    throw error;
  }
  const personRef = doc(familyCollection(familyId, "people"));
  const data = {
    fullName: person.name.trim(),
    tamilName: person.tamil.trim() || null,
    gender: (person.gender || "unknown").toLowerCase(),
    birthYear: person.birthYear ? Number(person.birthYear) : null,
    lifeStatus: (person.status || "unknown").toLowerCase(),
    generation: Number(person.generation) || 1,
    branch: person.branch.trim() || "Family",
    place: person.place.trim() || null,
    familyRole: person.role || "Family member",
    createdBy: user.uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  await setDoc(personRef, data);
  return {
    id: personRef.id, name: data.fullName, tamil: data.tamilName || "", gender: person.gender,
    birthYear: data.birthYear, status: person.status, generation: data.generation,
    branch: data.branch, place: data.place || "", role: data.familyRole,
    parentIds: [], spouseIds: [], children: [],
  };
}

export async function saveRelationship(familyId, user, relationship) {
  const relation = {
    fromId: relationship.fromId,
    toId: relationship.toId,
    relationshipType: relationship.relationshipType,
    status: "approved",
    createdBy: user.uid,
    createdAt: serverTimestamp(),
  };
  const snapshot = await addDoc(familyCollection(familyId, "relationships"), relation);
  return { id: snapshot.id, ...relation };
}

export async function saveRelationships(familyId, user, relationships) {
  const batch = writeBatch(db);
  const saved = relationships.map(relationship => {
    const ref = doc(familyCollection(familyId, "relationships"));
    const data = {
      fromId: relationship.fromId,
      toId: relationship.toId,
      relationshipType: relationship.relationshipType,
      status: "approved",
      createdBy: user.uid,
      createdAt: serverTimestamp(),
    };
    batch.set(ref, data);
    return {id:ref.id,...data};
  });
  await batch.commit();
  return saved;
}

export async function updateRelationship(familyId, relationshipId, relationship) {
  const fields = {
    fromId: relationship.fromId,
    toId: relationship.toId,
    relationshipType: relationship.relationshipType,
  };
  await updateDoc(doc(db, "families", familyId, "relationships", relationshipId), fields);
  return {id:relationshipId, ...fields};
}

export async function deleteRelationship(familyId, relationshipId) {
  await deleteDoc(doc(db, "families", familyId, "relationships", relationshipId));
}

export async function deleteMemberAndRelationships(personId, familyId = configuredFamilyId) {
  if (!familyId) throw new Error("ROOTS family ID is not configured.");
  const relationships = familyCollection(familyId, "relationships");
  const [asParent, asChild] = await Promise.all([
    getDocs(query(relationships, where("fromId", "==", personId))),
    getDocs(query(relationships, where("toId", "==", personId))),
  ]);
  const links = new Map([...asParent.docs, ...asChild.docs].map(snapshot => [snapshot.id, snapshot.ref]));
  const refs = [...links.values()];
  // Firestore limits a write batch to 500 operations. Remove links in smaller chunks,
  // then delete the person only after every relationship cleanup batch succeeds.
  for (let start = 0; start < refs.length; start += 450) {
    const batch = writeBatch(db);
    refs.slice(start, start + 450).forEach(ref => batch.delete(ref));
    await batch.commit();
  }
  await deleteDoc(doc(db, "families", familyId, "people", personId));
  return {removedRelationships:refs.length};
}

export async function requestFamilyAccess(familyId, user) {
  const requestRef = doc(db, "families", familyId, "pending_users", user.uid);
  const existing = await getDoc(requestRef);
  if (existing.exists() && existing.data().status === "pending") return { id: existing.id, ...existing.data() };
  const data = {
    uid: user.uid,
    email: user.email || "",
    displayName: user.displayName || user.email || "Family member",
    status: "pending",
    role: "member",
    createdAt: existing.exists() && existing.data().createdAt ? existing.data().createdAt : serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  await setDoc(requestRef, data);
  return { id: user.uid, ...data };
}

export function watchJoinRequests(familyId, onChange, onError) {
  return onSnapshot(familyCollection(familyId, "pending_users"), snapshot => {
    onChange(snapshot.docs.map(item => ({ id: item.id, ...item.data() })).filter(item => item.status === "pending"));
  }, onError);
}

export async function approveJoinRequest(familyId, request, role, reviewerUid) {
  const batch = writeBatch(db);
  const memberRef = doc(db, "families", familyId, "members", request.uid);
  const requestRef = doc(db, "families", familyId, "pending_users", request.uid);
  batch.set(memberRef, {
    uid: request.uid,
    email: request.email || "",
    displayName: request.displayName || "Family member",
    role: role === "contributor" ? "contributor" : "member",
    status: "approved",
    approvedBy: reviewerUid,
    approvedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  batch.update(requestRef, { status: "approved", role: role === "contributor" ? "contributor" : "member", reviewedBy: reviewerUid, reviewedAt: serverTimestamp() });
  await batch.commit();
}

export async function rejectJoinRequest(familyId, requestId, reviewerUid) {
  await updateDoc(doc(db, "families", familyId, "pending_users", requestId), {
    status: "rejected",
    reviewedBy: reviewerUid,
    reviewedAt: serverTimestamp(),
  });
}
