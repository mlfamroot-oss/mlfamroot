const tamil = {
  Father:"Appa · அப்பா", Mother:"Amma · அம்மா", Parent:"Parent · பெற்றோர்",
  Son:"Magan · மகன்", Daughter:"Magal · மகள்", Child:"Child · குழந்தை", Grandson:"Grandson · பேரன்", Granddaughter:"Granddaughter · பேத்தி",
  Husband:"Kanavar · கணவர்", Wife:"Manaivi · மனைவி", Spouse:"Spouse · துணைவர்",
  Brother:"Brother · சகோதரர்", Sister:"Sister · சகோதரி", Sibling:"Sibling · உடன்பிறப்பு", Anna:"Anna · அண்ணன்", Thambi:"Thambi · தம்பி", Akka:"Akka · அக்கா", Thangai:"Thangai · தங்கை",
  Grandfather:"Thatha · தாத்தா", Grandmother:"Paati · பாட்டி", Grandparent:"Grandparent · தாத்தா / பாட்டி",
  Grandchild:"Grandchild · பேரக்குழந்தை", Uncle:"Uncle · மாமா / சித்தப்பா / பெரியப்பா", Aunt:"Aunt · அத்தை / சித்தி / பெரியம்மா",
  Nephew:"Nephew · மருமகன்", Niece:"Niece · மருமகள்", Cousin:"Cousin · உறவினர்"
};

function asLabel(label, lang) { return lang === "ta" ? (tamil[label] || label) : label; }
function gendered(person, male, female, neutral) { return person?.gender === "Male" ? male : person?.gender === "Female" ? female : neutral; }

// Returns the kinship term for personA as viewed from personB. Only parent and spouse
// records are used; sibling, grandparent, aunt/uncle and cousin links are inferred.
export function getRelationshipLabel(personA, personB, allRelationships, people = [], lang = "en") {
  if (!personA || !personB || personA.id === personB.id) return "";
  const parents = new Map(), spouses = new Set();
  allRelationships.forEach(link => {
    if (link.relationshipType === "parent") {
      const list = parents.get(link.toId) || [];
      list.push(link.fromId); parents.set(link.toId, list);
    } else if (link.relationshipType === "spouse") {
      spouses.add(`${link.fromId}:${link.toId}`); spouses.add(`${link.toId}:${link.fromId}`);
    }
  });
  const aParents = parents.get(personA.id) || [], bParents = parents.get(personB.id) || [];
  let label = "";
  if (aParents.includes(personB.id)) label = gendered(personA,"Son","Daughter","Child");
  else if (bParents.includes(personA.id)) label = gendered(personA,"Father","Mother","Parent");
  else if (spouses.has(`${personA.id}:${personB.id}`)) label = gendered(personA,"Husband","Wife","Spouse");
  else if (aParents.some(id => bParents.includes(id))) {
    label = gendered(personA,"Brother","Sister","Sibling");
    if (lang === "ta" && personA.birthYear && personB.birthYear && personA.gender === personB.gender && ["Male","Female"].includes(personA.gender)) {
      const older = Number(personA.birthYear) < Number(personB.birthYear);
      label = personA.gender === "Male" ? (older ? "Anna" : "Thambi") : (older ? "Akka" : "Thangai");
    }
  }
  else if (aParents.some(parentId => (parents.get(parentId) || []).includes(personB.id))) label = gendered(personA,"Grandson","Granddaughter","Grandchild");
  else if (bParents.some(parentId => (parents.get(parentId) || []).includes(personA.id))) label = gendered(personA,"Grandfather","Grandmother","Grandparent");
  else if (aParents.some(parentId => (parents.get(parentId) || []).some(grandId => bParents.includes(grandId)))) label = gendered(personA,"Nephew","Niece","Cousin");
  else if (bParents.some(parentId => (parents.get(parentId) || []).some(grandId => aParents.includes(grandId)))) label = gendered(personA,"Uncle","Aunt","Cousin");
  else if (aParents.some(ap => bParents.some(bp => (parents.get(ap) || []).some(g => (parents.get(bp) || []).includes(g))))) label = "Cousin";
  return asLabel(label, lang);
}

export function getTamilKinshipLabel(englishLabel) { return tamil[englishLabel] || ""; }
