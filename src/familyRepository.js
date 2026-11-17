import {
  addDoc, collection, doc, getDoc, getDocs, onSnapshot, serverTimestamp, setDoc,
} from "firebase/firestore";
import { db } from "./firebaseClient";

const familyCollection = (familyId, name) => collection(db, "families", familyId, name);

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
  if (!memberSnapshot.exists()) return { member: null, people: [], relationships: [] };
  const member = { id: memberSnapshot.id, ...memberSnapshot.data() };
  if (member.status !== "approved") return { member, people: [], relationships: [] };

  const [peopleSnapshot, relationSnapshot] = await Promise.all([
    getDocs(familyCollection(familyId, "people")),
    getDocs(familyCollection(familyId, "relationships")),
  ]);
  return { member, ...mapFamilyRecords(peopleSnapshot.docs, relationSnapshot.docs) };
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

export async function savePerson(familyId, user, person) {
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
