import React, { useEffect, useMemo, useRef, useState } from "react";
import ForceGraph2D from "react-force-graph-2d";
import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { getTransliterateSuggestions } from "@sarthak1407/react-transliterate";
import {
  Search, Plus, Users, GitBranch, CalendarDays, MapPin, Settings2,
  Sun, Moon, Globe2, ChevronDown, ChevronRight, Heart, Upload,
  ShieldCheck, Download, Image, Menu, X, Filter, UserRound, Clock3, ZoomIn, ZoomOut, LocateFixed,
  LogIn, LogOut, Link2, Trash2, Check, RefreshCw
} from "lucide-react";
import { auth, familyId, firebaseConfigured, googleProvider } from "./firebaseClient";
import { suggestTamilName, romanizeTamil } from "./nameTransliteration";
import { approveJoinRequest, deleteMemberAndRelationships, deleteRelationship, isDuplicatePerson, loadFamily, rejectJoinRequest, requestFamilyAccess, savePerson, saveRelationships, updateRelationship, watchFamily, watchJoinRequests } from "./familyRepository";
import { getRelationshipLabel } from "./kinship";

const copy = {
  en: {
    overview:"Overview", tree:"Family tree", timeline:"Heritage timeline", people:"People",
    geography:"Family map", albums:"Photo albums", approvals:"Approvals", settings:"Settings",
    search:"Search name, Tamil name, place…", add:"Add member", generations:"Generations",
    members:"Family members", branches:"Family branches", events:"Timeline events",
    treeTitle:"Explore your family", treeSub:"A living record of the people and relationships that connect your generations.",
    vertical:"Vertical", horizontal:"Horizontal", radial:"Radial", all:"All members",
    generation:"Generation", branch:"Branch", location:"Location", status:"Status", gender:"Gender",
    living:"Living", deceased:"Deceased", selectPerson:"Select a person", selectSub:"Choose a family member to view their profile and connections.",
    profile:"Member profile", parents:"Parents", spouse:"Spouse", children:"Children", native:"Native / current place",
    born:"Born", relationship:"Relationship", addTitle:"Add a family member", fullName:"Full name",
    tamilName:"Tamil name", nameHint:"Type in either field; a suggestion appears after a short pause. English names are sent to Google Input Tools for suggestions. Review and edit before saving.", suggestName:"Suggest now", suggestingName:"Suggesting…", suggestionReady:"Suggestion added. Please review the spelling before saving.", suggestionFailed:"Could not suggest a spelling. Please enter it manually.", year:"Birth year", save:"Add family member", cancel:"Cancel",
    demo:"PRIVATE FAMILY",
    empty:"No matching family members", clear:"Clear filters", light:"Light mode", dark:"Dark mode",
    treeView:"Tree", horizontalView:"Horizontal", horizontalSub:"Follow family generations from left to right", graphView:"Graph", memberPreview:"Family member", adminPreview:"Administrator", previewRole:"Preview role",
    browseGenerations:"Browse family members by generation", exploreNetwork:"Explore the family network",
    signInGoogle:"Continue with Google", signOut:"Sign out", authTitle:"Sign in to ROOTS", authSub:"Use your approved Google account to access your family space.",
    noAccessTitle:"Access is not set up yet", noAccessSub:"Request access with this Google account. A family owner or admin can approve it.", requestAccess:"Request family access", requestSent:"Request sent — waiting for a family admin.", requestAgain:"Request access again", checkAccess:"Check access", checkingAccess:"Checking…", firstOwnerSetup:"First owner setup", requestFailed:"Could not send the request. Please try again.",
    approvalsTitle:"Family access requests", approvalsSub:"Review requests from relatives who signed in with Google.", noRequests:"No pending access requests.", approveMember:"Approve as member", approveContributor:"Approve as contributor", rejectRequest:"Decline", requestedBy:"Requested by", requestApproved:"Access approved.", requestRejected:"Request declined.", adminOnly:"Only family owners and admins can review access requests.",
    setupTitle:"Connect ROOTS to Firebase", setupSub:"Add your Firebase web app settings and family ID to the local environment file, then restart Vite.",
    setupSteps:"In Firebase Console, enable Google sign-in, create a Firestore database, publish the included firestore.rules, then add your first owner membership.",
    loading:"Loading your family space…", addLink:"Add relationship", parentOf:"Parent of", childOf:"Child of", spouseOf:"Spouse of", choosePerson:"Choose a person",
    relationLabel:"Relationship", siblingOf:"Sibling (brother / sister)", grandparentOf:"Grandparent of", grandchildOf:"Grandchild of", auntUncleOf:"Aunt / uncle of", cousinOf:"Cousin of", contextParent:"Parent in this family line", sharedParent:"Shared parent", sharedGrandparent:"Shared grandparent", relativeParent:"Parent of this relative", relationshipPathHint:"Extended relationships are created from parent and spouse records. ROOTS will ask for the family path it needs.", addParentFirst:"To add a sibling, first record at least one parent for this person.",
    saveLink:"Save relationship", editLink:"Edit connection", updateLink:"Save changes", removeConnection:"Remove connection", removeConnectionTitle:"Remove this family connection?", removeConnectionHint:"This only removes the relationship; both people remain in the family.", remove:"Remove connection", parentCycleError:"This would create a parent-child loop. Check the existing connections first.", duplicatePerson:"A person with this name and birth details is already recorded. Check the existing profile before adding.", duplicateConfirm:"I checked the existing profile; this is a different person.", possibleDuplicate:"A family member has the same name. Confirm this is a different person before adding.", connectionError:"Could not load family data. Check the Firebase setup and Firestore rules."
  },
  ta: {
    overview:"கண்ணோட்டம்", tree:"குடும்ப மரம்", timeline:"குடும்ப வரலாற்றுக் காலவரிசை", people:"உறுப்பினர்கள்",
    geography:"குடும்ப வரைபடம்", albums:"புகைப்படத் தொகுப்புகள்", approvals:"ஒப்புதல்கள்", settings:"அமைப்புகள்",
    search:"பெயர், தமிழ் பெயர், இடம் தேடுக…", add:"உறுப்பினரைச் சேர்க்க", generations:"தலைமுறைகள்",
    members:"குடும்ப உறுப்பினர்கள்", branches:"குடும்பக் கிளைகள்", events:"நிகழ்வுகள்",
    treeTitle:"உங்கள் குடும்பத்தை ஆராயுங்கள்", treeSub:"தலைமுறைகளை இணைக்கும் உறவுகளின் வாழும் பதிவேடு.",
    vertical:"செங்குத்து", horizontal:"கிடைமட்டம்", radial:"வட்ட வடிவம்", all:"அனைத்து உறுப்பினர்கள்",
    generation:"தலைமுறை", branch:"கிளை", location:"இடம்", status:"நிலை", gender:"பாலினம்",
    living:"உயிருடன்", deceased:"மறைந்தவர்", selectPerson:"ஒருவரைத் தேர்ந்தெடுக்கவும்", selectSub:"சுயவிவரத்தையும் உறவுகளையும் காண குடும்ப உறுப்பினரைத் தேர்ந்தெடுக்கவும்.",
    profile:"உறுப்பினர் விவரம்", parents:"பெற்றோர்", spouse:"துணைவர்", children:"குழந்தைகள்", native:"சொந்த / தற்போதைய இடம்",
    born:"பிறந்த ஆண்டு", relationship:"உறவு", addTitle:"குடும்ப உறுப்பினரைச் சேர்க்க", fullName:"முழுப் பெயர்",
    tamilName:"தமிழ்ப் பெயர்", nameHint:"இரு பெட்டிகளில் ஏதேனும் ஒன்றில் தட்டச்சு செய்யுங்கள்; சிறிது நேரத்தில் பரிந்துரை வரும். ஆங்கிலப் பெயர் பரிந்துரைக்க Google Input Tools-க்கு அனுப்பப்படும். சேமிப்பதற்கு முன் சரிபார்த்து திருத்தவும்.", suggestName:"இப்போது பரிந்துரை செய்", suggestingName:"பரிந்துரைக்கிறது…", suggestionReady:"பரிந்துரை சேர்க்கப்பட்டது. சேமிப்பதற்கு முன் சரிபார்க்கவும்.", suggestionFailed:"பரிந்துரைக்க முடியவில்லை. பெயரை நீங்களே உள்ளிடவும்.", year:"பிறந்த ஆண்டு", save:"சேர்", cancel:"ரத்து செய்",
    demo:"தனிப்பட்ட குடும்பம்",
    empty:"பொருந்தும் உறுப்பினர்கள் இல்லை", clear:"வடிகட்டிகளை நீக்கு", light:"ஒளி முறை", dark:"இருள் முறை",
    treeView:"குடும்ப மரம்", horizontalView:"கிடைமட்டம்", horizontalSub:"குடும்பத் தலைமுறைகளை இடமிருந்து வலமாகப் பாருங்கள்", graphView:"வரைபடம்", memberPreview:"குடும்ப உறுப்பினர்", adminPreview:"நிர்வாகி", previewRole:"முன்னோட்டப் பங்கு",
    browseGenerations:"தலைமுறைகளின்படி குடும்ப உறுப்பினர்களைப் பாருங்கள்", exploreNetwork:"குடும்ப உறவுகளை ஆராயுங்கள்",
    signInGoogle:"Google மூலம் தொடரவும்", signOut:"வெளியேறு", authTitle:"ROOTS-இல் உள்நுழைக", authSub:"அனுமதிக்கப்பட்ட Google கணக்கைப் பயன்படுத்தவும்.",
    noAccessTitle:"அணுகல் இன்னும் அமைக்கப்படவில்லை", noAccessSub:"இந்த Google கணக்கில் அணுகல் கோருங்கள். குடும்ப உரிமையாளர் அல்லது நிர்வாகி அனுமதிக்கலாம்.", requestAccess:"குடும்ப அணுகலைக் கோருங்கள்", requestSent:"கோரிக்கை அனுப்பப்பட்டது — நிர்வாகியின் அனுமதிக்காகக் காத்திருக்கிறது.", requestAgain:"மீண்டும் அணுகலைக் கோருங்கள்", checkAccess:"அணுகலைச் சரிபார்க்கவும்", checkingAccess:"சரிபார்க்கிறது…", firstOwnerSetup:"முதல் உரிமையாளர் அமைப்பு", requestFailed:"கோரிக்கையை அனுப்ப முடியவில்லை. மீண்டும் முயற்சிக்கவும்.",
    approvalsTitle:"குடும்ப அணுகல் கோரிக்கைகள்", approvalsSub:"Google மூலம் உள்நுழைந்த உறவினர்களின் கோரிக்கைகளை மதிப்பாய்வு செய்யவும்.", noRequests:"நிலுவையில் கோரிக்கைகள் இல்லை.", approveMember:"உறுப்பினராக அனுமதி", approveContributor:"பங்களிப்பாளராக அனுமதி", rejectRequest:"நிராகரி", requestedBy:"கோரியவர்", requestApproved:"அணுகல் அனுமதிக்கப்பட்டது.", requestRejected:"கோரிக்கை நிராகரிக்கப்பட்டது.", adminOnly:"குடும்ப உரிமையாளர் அல்லது நிர்வாகி மட்டுமே கோரிக்கைகளை மதிப்பாய்வு செய்யலாம்.",
    setupTitle:"ROOTS-ஐ Firebase-உடன் இணைக்கவும்", setupSub:"Firebase வலைச் செயலி அமைப்புகளையும் குடும்ப ID-யையும் உள்ளூர் environment கோப்பில் சேர்த்து Vite-ஐ மீண்டும் தொடங்கவும்.",
    setupSteps:"Firebase Console-இல் Google உள்நுழைவை இயக்கி, Firestore தரவுத்தளத்தை உருவாக்கி, firestore.rules-ஐ வெளியிட்டு, முதல் உரிமையாளர் உறுப்பினர் பதிவைச் சேர்க்கவும்.",
    loading:"குடும்ப இடத்தை ஏற்றுகிறது…", addLink:"உறவைச் சேர்க்க", parentOf:"பெற்றோர்", childOf:"குழந்தை", spouseOf:"துணைவர்", choosePerson:"ஒருவரைத் தேர்ந்தெடுக்கவும்",
    relationLabel:"உறவு", siblingOf:"உடன்பிறப்பு", grandparentOf:"தாத்தா / பாட்டி", grandchildOf:"பேரக்குழந்தை", auntUncleOf:"அத்தை / மாமா", cousinOf:"ஒன்றுவிட்ட உறவினர்", contextParent:"இந்த குடும்பப் பாதையில் பெற்றோர்", sharedParent:"பொதுப் பெற்றோர்", sharedGrandparent:"பொதுவான தாத்தா / பாட்டி", relativeParent:"இந்த உறவினரின் பெற்றோர்", relationshipPathHint:"விரிவான உறவுகள் பெற்றோர் மற்றும் துணைவர் பதிவுகளிலிருந்து உருவாக்கப்படும்.", addParentFirst:"உடன்பிறப்பைச் சேர்க்க முதலில் ஒருவருக்காவது பெற்றோர் உறவைப் பதிவு செய்யுங்கள்.",
    saveLink:"உறவைச் சேமி", editLink:"உறவைத் திருத்து", updateLink:"மாற்றங்களைச் சேமி", removeConnection:"உறவை நீக்கு", removeConnectionTitle:"இந்தக் குடும்ப உறவை நீக்கவா?", removeConnectionHint:"உறவு மட்டும் நீக்கப்படும்; இருவரும் குடும்பத்தில் இருப்பார்கள்.", remove:"உறவை நீக்கு", parentCycleError:"இது பெற்றோர்–குழந்தை உறவு வட்டத்தை உருவாக்கும். ஏற்கனவே உள்ள உறவுகளைச் சரிபார்க்கவும்.", duplicatePerson:"இந்தப் பெயரும் பிறந்த விவரங்களும் கொண்ட பதிவு ஏற்கனவே உள்ளது. சேர்ப்பதற்கு முன் பழைய பதிவைச் சரிபார்க்கவும்.", duplicateConfirm:"பழைய பதிவைச் சரிபார்த்தேன்; இது வேறு நபர்.", possibleDuplicate:"அதே பெயரில் ஒருவர் உள்ளார். புதிய நபர் வேறு நபர் என்பதை உறுதிப்படுத்தவும்.", connectionError:"குடும்பத் தரவை ஏற்ற முடியவில்லை. Firebase அமைப்புகளையும் விதிகளையும் சரிபார்க்கவும்."
  }
};

function Avatar({person, size="md"}) {
  const initials = (person?.name || "?").split(" ").map(x=>x[0]).slice(0,2).join("").toUpperCase();
  return <div className={`avatar ${size} ${person?.gender === "Female" ? "female" : ""}`}>{initials}</div>;
}

function createsParentCycle(relationships, fromId, toId, ignoredId) {
  const childrenByParent = new Map();
  relationships.forEach(item => {
    if (item.id === ignoredId || item.relationshipType !== "parent") return;
    const children = childrenByParent.get(item.fromId) || [];
    children.push(item.toId);
    childrenByParent.set(item.fromId, children);
  });
  const pending = [toId];
  const visited = new Set();
  while (pending.length) {
    const current = pending.pop();
    if (current === fromId) return true;
    if (visited.has(current)) continue;
    visited.add(current);
    pending.push(...(childrenByParent.get(current) || []));
  }
  return false;
}

function PersonCard({person, selected, onClick, compact=false, lang="en", canDelete=false, onDelete, deleteLabel="Delete member"}) {
  return <div className={`person-card-wrap ${compact ? "compact" : ""}`}>
    <button type="button" className={`person-card ${selected ? "selected" : ""} ${compact ? "compact" : ""}`} onClick={onClick}>
      <Avatar person={person} />
      <span className="person-copy">
        <strong>{lang==="ta" && person.tamil ? person.tamil : person.name}</strong>
        <small>{(lang==="ta"?person.name:person.tamil)?`${lang==="ta"?person.name:person.tamil} · `:""}{person.birthYear || (lang==="ta"?"ஆண்டு தெரியவில்லை":"Year unknown")} · {person.status}</small>
      </span>
      {person.status==="Deceased" && <span className="status-dot deceased-dot" title="Deceased"/>}
    </button>
    {canDelete&&<button type="button" className="person-delete-btn" title={deleteLabel} aria-label={`${deleteLabel}: ${person.name}`} onClick={event=>{event.stopPropagation();onDelete?.(person)}}><Trash2 size={14}/></button>}
  </div>;
}

function GenerationView({people, selectedId, onSelect, lang, canDelete=false, onDelete, deleteLabel}) {
  const generations = [...new Set(people.map(person => person.generation))].sort((a,b)=>a-b);
  const getNames = ids => (ids || []).map(id => people.find(person => person.id === id)).filter(Boolean).map(person => lang === "ta" && person.tamil ? person.tamil : person.name);
  return <div className="family-tree-view">
    {generations.map(generation => <section className="generation-lane" key={generation}>
      <div className="generation-title">{lang === "ta" ? `தலைமுறை ${generation}` : `Generation ${generation}`}</div>
      <div className="generation-members">{people.filter(person => person.generation === generation).map(person => <div className="tree-person-wrap" key={person.id}>
        <PersonCard person={person} selected={selectedId === person.id} onClick={() => onSelect(person.id)} lang={lang} canDelete={canDelete} onDelete={onDelete} deleteLabel={deleteLabel}/>
        <div className="tree-relation-note">{getNames(person.parentIds).length ? `← ${getNames(person.parentIds).join(" · ")}` : (getNames(person.spouseIds).length ? `♥ ${getNames(person.spouseIds).join(" · ")}` : person.branch)}</div>
      </div>)}</div>
    </section>)}
  </div>;
}

function HorizontalGenerationView({people, selectedId, onSelect, lang, canDelete=false, onDelete, deleteLabel}) {
  const generations=[...new Set(people.map(person=>person.generation))].sort((a,b)=>a-b);
  const nameFor=id=>{const person=people.find(item=>item.id===id);return person?(lang==="ta"&&person.tamil?person.tamil:person.name):""};
  return <div className="horizontal-family-tree">
    {generations.map((generation,index)=><React.Fragment key={generation}>
      {index>0&&<div className="horizontal-generation-arrow" aria-hidden="true"><ChevronRight size={20}/></div>}
      <section className="horizontal-generation-column">
        <header className="horizontal-generation-heading"><span>{lang==="ta"?`தலைமுறை ${generation}`:`Generation ${generation}`}</span><small>{people.filter(person=>person.generation===generation).length}</small></header>
        <div className="horizontal-generation-people">{people.filter(person=>person.generation===generation).map(person=><article className="horizontal-person" key={person.id}>
          <PersonCard person={person} selected={selectedId===person.id} onClick={()=>onSelect(person.id)} lang={lang} canDelete={canDelete} onDelete={onDelete} deleteLabel={deleteLabel}/>
          {(person.parentIds||[]).some(id=>nameFor(id))&&<small className="horizontal-connection-note"><GitBranch size={11}/><span>{lang==="ta"?"பெற்றோர்":"Parent"}: {(person.parentIds||[]).map(nameFor).filter(Boolean).join(", ")}</span></small>}
          {(person.spouseIds||[]).some(id=>nameFor(id))&&<small className="horizontal-connection-note spouse-note"><Heart size={11}/><span>{lang==="ta"?"துணைவர்":"Spouse"}: {(person.spouseIds||[]).map(nameFor).filter(Boolean).join(", ")}</span></small>}
        </article>)}</div>
      </section>
    </React.Fragment>)}
  </div>;
}

function MobileGenerationView({people, selectedId, onSelect, lang, canDelete=false, onDelete, deleteLabel}) {
  const generations=[...new Set(people.map(person=>person.generation))].sort((a,b)=>a-b);
  const nameFor=id=>{const person=people.find(item=>item.id===id);return person?(lang==="ta"&&person.tamil?person.tamil:person.name):""};
  return <div className="mobile-family-tree">{generations.map(generation=>{
    const members=people.filter(person=>person.generation===generation);
    return <section className="mobile-family-generation" key={generation}>
      <header><strong>{lang==="ta"?`தலைமுறை ${generation}`:`Generation ${generation}`}</strong><small>{members.length} {lang==="ta"?"உறுப்பினர்கள்":"members"}</small></header>
      <div className="mobile-family-members">{members.map(person=><article className="mobile-family-person" key={person.id}>
        <PersonCard person={person} selected={selectedId===person.id} onClick={()=>onSelect(person.id)} lang={lang} canDelete={canDelete} onDelete={onDelete} deleteLabel={deleteLabel}/>
        {(person.parentIds||[]).some(id=>nameFor(id))&&<small className="mobile-family-note"><GitBranch size={12}/><span>{lang==="ta"?"பெற்றோர்":"Parent"}: {(person.parentIds||[]).map(nameFor).filter(Boolean).join(", ")}</span></small>}
        {(person.spouseIds||[]).some(id=>nameFor(id))&&<small className="mobile-family-note spouse-note"><Heart size={12}/><span>{lang==="ta"?"துணைவர்":"Spouse"}: {(person.spouseIds||[]).map(nameFor).filter(Boolean).join(", ")}</span></small>}
      </article>)}</div>
    </section>;
  })}</div>;
}

function FocusView({person, parents, spouses, children, onSelect, lang, labels}) {
  const displayName = value => lang === "ta" && value.tamil ? value.tamil : value.name;
  const node = (relative, kind) => <button type="button" className={`focus-node ${kind}`} key={relative.id} onClick={()=>onSelect(relative.id)} title={displayName(relative)}>
    <Avatar person={relative} size="sm"/><span><strong>{displayName(relative)}</strong><small>{lang === "ta" ? relative.name : relative.tamil || relative.birthYear || ""}</small></span>
  </button>;
  return <section className="focus-view" aria-label={lang==="ta"?"உறவுகள் வரைபடம்":"Relationship focus view"}>
    {parents.length>0&&<><div className="focus-relative-row">{parents.map(person=>node(person,"parent"))}</div><div className="focus-stem" aria-hidden="true"/></>}
    <div className="focus-core-row"><div className="focus-node focus-selected"><Avatar person={person} size="sm"/><span><strong>{displayName(person)}</strong><small>{lang==="ta"?person.name:person.tamil||person.birthYear||""}</small></span></div>
      {spouses.map(relative=>node(relative,"spouse"))}</div>
    {children.length>0&&<><div className="focus-stem" aria-hidden="true"/><div className="focus-relative-row">{children.map(relative=>node(relative,"child"))}</div></>}
    {!parents.length&&!spouses.length&&!children.length&&<p className="focus-empty">{lang==="ta"?"இன்னும் உறவுகள் இணைக்கப்படவில்லை":"No relatives linked yet"}</p>}
    <div className="focus-key"><span><i className="focus-key-parent"/>{labels.parents}</span><span><i className="focus-key-spouse"/>{labels.spouse}</span><span><i className="focus-key-child"/>{labels.children}</span></div>
  </section>;
}

function FamilyGraph({people, selectedId, onSelect, lang, theme, query}) {
  const graphRef = useRef();
  const stageRef = useRef();
  const [size, setSize] = useState({width: 640, height: 450});
  const [hoveredId, setHoveredId] = useState(null);
  useEffect(() => {
    if (!stageRef.current) return;
    const observer = new ResizeObserver(([entry]) => setSize({width: Math.max(320, entry.contentRect.width), height: Math.max(320, entry.contentRect.height)}));
    observer.observe(stageRef.current);
    return () => observer.disconnect();
  }, []);
  const graphData = useMemo(() => {
    const ids = new Set(people.map(person => person.id));
    const links = [];
    const seen = new Set();
    people.forEach(person => {
      (person.parentIds || []).forEach(parentId => {
        if (ids.has(parentId)) links.push({source: parentId, target: person.id, kind: "parent"});
      });
      (person.spouseIds || []).forEach(spouseId => {
        const key = [person.id, spouseId].sort().join(":");
        if (ids.has(spouseId) && !seen.has(key)) {
          seen.add(key);
          links.push({source: person.id, target: spouseId, kind: "spouse"});
        }
      });
    });
    const generations = [...new Set(people.map(person => person.generation))].sort((a,b)=>a-b);
    return {
      nodes: people.map((person, index) => ({
        id: person.id, person,
        x: (generations.indexOf(person.generation) - (generations.length - 1) / 2) * 170,
        y: (index % 2 ? 1 : -1) * (45 + Math.floor(index / 2) * 28)
      })),
      links
    };
  }, [people]);
  const focusId = hoveredId || selectedId;
  const neighborIds = useMemo(() => {
    const ids = new Set([focusId]);
    graphData.links.forEach(link => {
      const source = typeof link.source === "object" ? link.source.id : link.source;
      const target = typeof link.target === "object" ? link.target.id : link.target;
      if (source === focusId) ids.add(target);
      if (target === focusId) ids.add(source);
    });
    return ids;
  }, [graphData, focusId]);

  React.useEffect(() => {
    if (!graphRef.current) return;
    const match = graphData.nodes.find(node => node.person.name.toLowerCase().includes(query.trim().toLowerCase()) || (node.person.tamil || "").toLowerCase().includes(query.trim().toLowerCase()));
    if (match && query.trim()) {
      onSelect(match.id);
      graphRef.current.centerAt(match.x || 0, match.y || 0, 500);
      graphRef.current.zoom(2.1, 600);
    }
  }, [query, graphData]);

  const dark = theme === "dark";
  const zoom = factor => graphRef.current?.zoom(Math.max(.45, Math.min(4, (graphRef.current.zoom() || 1) * factor)), 250);
  return <div className="graph-stage" ref={stageRef}>
    <ForceGraph2D ref={graphRef} graphData={graphData} width={size.width} height={size.height}
      backgroundColor="rgba(0,0,0,0)" dagMode={null} cooldownTicks={100}
      d3AlphaDecay={0.025} d3VelocityDecay={0.32} d3Force="charge"
      onNodeClick={node => onSelect(node.id)}
      linkColor={link => {
        const source = typeof link.source === "object" ? link.source.id : link.source;
        const target = typeof link.target === "object" ? link.target.id : link.target;
        const color = link.kind === "spouse" ? (dark ? "#d79aaf" : "#bf7894") : (dark ? "#83b79a" : "#648c70");
        return !focusId || (neighborIds.has(source) && neighborIds.has(target)) ? color : (dark ? "#35414c" : "#dfe5e8");
      }}
      linkWidth={link => {
        const source = typeof link.source === "object" ? link.source.id : link.source;
        const target = typeof link.target === "object" ? link.target.id : link.target;
        return neighborIds.has(source) && neighborIds.has(target) ? 2 : 1;
      }}
      linkLineDash={link => link.kind === "spouse" ? [5,4] : null}
      linkDirectionalArrowLength={link => link.kind === "parent" ? 3 : 0}
      linkDirectionalArrowRelPos={0.96}
      linkLabel={link => link.kind === "spouse" ? "Spouse" : "Parent / child"}
      nodeRelSize={5} enableNodeDrag enableZoomInteraction enablePanInteraction
      onNodeHover={node => setHoveredId(node?.id || null)}
      nodeCanvasObject={(node, ctx, scale) => {
        const p = node.person;
        const label = lang === "ta" && p.tamil ? p.tamil : p.name;
        const active = node.id === selectedId;
        const nearby = neighborIds.has(node.id);
        const dim = focusId && !nearby;
        const fontSize = Math.max(10, 12 / scale);
        const radius = active ? 9 : 7;
        ctx.globalAlpha = dim ? .3 : 1;
        ctx.beginPath(); ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
        ctx.fillStyle = p.gender === "Female" ? (dark ? "#d89bb5" : "#c985a2") : (dark ? "#8eaddb" : "#7898c7");
        ctx.fill();
        if (active) { ctx.lineWidth = 3 / scale; ctx.strokeStyle = dark ? "#d8f0df" : "#315c49"; ctx.stroke(); }
        ctx.font = `${active || node.id === hoveredId ? 600 : 500} ${fontSize}px 'DM Sans', sans-serif`;
        const labelWidth = ctx.measureText(label).width;
        const showLabel = active || node.id === hoveredId || (scale > .82 && (nearby || scale > 1.35));
        if (!showLabel) { ctx.globalAlpha = 1; return; }
        const box = {left:node.x-labelWidth/2-7,right:node.x+labelWidth/2+7,top:node.y+radius+1,bottom:node.y+radius+fontSize+13};
        const collision = graphData.nodes.some(other => {
          if (other === node || other.x == null || other.y == null) return false;
          const otherName = lang === "ta" && other.person.tamil ? other.person.tamil : other.person.name;
          ctx.font = `500 ${fontSize}px 'DM Sans', sans-serif`;
          const width = ctx.measureText(otherName).width;
          const otherBox = {left:other.x-width/2-7,right:other.x+width/2+7,top:other.y+8,bottom:other.y+fontSize+21};
          return box.left < otherBox.right+5 && box.right > otherBox.left-5 && box.top < otherBox.bottom+4 && box.bottom > otherBox.top-4;
        });
        if (collision && !active && node.id !== hoveredId) { ctx.globalAlpha = 1; return; }
        ctx.font = `${active || node.id === hoveredId ? 600 : 500} ${fontSize}px 'DM Sans', sans-serif`;
        const x = node.x - labelWidth / 2;
        const y = node.y + radius + fontSize + 5;
        ctx.fillStyle = dark ? "#19232e" : "#ffffff";
        ctx.beginPath(); ctx.roundRect(x - 7, y - fontSize - 5, labelWidth + 14, fontSize + 12, 7 / scale); ctx.fill();
        ctx.strokeStyle = active ? (dark ? "#8fbea4" : "#7da38c") : (dark ? "#354554" : "#e4e9ed");
        ctx.lineWidth = 1 / scale; ctx.stroke();
        ctx.fillStyle = dark ? "#edf2f7" : "#263346";
        ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(label, node.x, y);
        ctx.globalAlpha = 1;
      }}
      onEngineStop={() => graphRef.current?.zoomToFit(450, 60)} />
    <div className="graph-controls">
      <button title="Zoom in" onClick={() => zoom(1.25)}><ZoomIn size={16}/></button>
      <button title="Zoom out" onClick={() => zoom(.8)}><ZoomOut size={16}/></button>
      <button title="Fit graph" onClick={() => graphRef.current?.zoomToFit(450, 70)}><LocateFixed size={16}/></button>
    </div>
    <div className="graph-legend"><span><i className="parent-line"/> Parent / child</span><span><i className="spouse-line"/> Spouse</span></div>
    <span className="graph-hint">Drag to arrange · scroll to zoom · drag canvas to pan</span>
  </div>;
}

function App() {
  const [people, setPeople] = useState([]);
  const [relationships, setRelationships] = useState([]);
  const [authUser, setAuthUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [membership, setMembership] = useState(null);
  const [membershipRequest, setMembershipRequest] = useState(null);
  const [membershipLoading, setMembershipLoading] = useState(false);
  const [requestingAccess, setRequestingAccess] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [reviewingRequestId, setReviewingRequestId] = useState("");
  const [appError, setAppError] = useState("");
  const [activePage, setActivePage] = useState("tree");
  const [view, setView] = useState("tree");
  const [selectedId, setSelectedId] = useState("");
  const [query, setQuery] = useState("");
  const [gender, setGender] = useState("All");
  const [status, setStatus] = useState("All");
  const [generation, setGeneration] = useState("All");
  const [branch, setBranch] = useState("All");
  const [theme, setTheme] = useState("light");
  const [lang, setLang] = useState("en");
  const [showAdd, setShowAdd] = useState(false);
  const [showLink, setShowLink] = useState(false);
  const [editingRelationship, setEditingRelationship] = useState(null);
  const [pendingDeleteRelationship, setPendingDeleteRelationship] = useState(null);
  const [pendingDeletePerson, setPendingDeletePerson] = useState(null);
  const [linkMode, setLinkMode] = useState("child");
  const [linkTargetId, setLinkTargetId] = useState("");
  const [linkContextParentId, setLinkContextParentId] = useState("");
  const [linkOtherParentId, setLinkOtherParentId] = useState("");
  const [linkSharedParentId, setLinkSharedParentId] = useState("");
  const [saving, setSaving] = useState(false);
  const [lastNameField, setLastNameField] = useState("name");
  const [suggestingName, setSuggestingName] = useState(false);
  const [suggestionMessage, setSuggestionMessage] = useState("");
  const [isManuallyEdited, setIsManuallyEdited] = useState({name:false, tamil:false});
  const [duplicateConfirmed, setDuplicateConfirmed] = useState(false);
  const transliterationRequest = useRef(0);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [newPerson, setNewPerson] = useState({name:"", tamil:"", gender:"Female", birthYear:"", place:"", status:"Living", generation:"4", branch:"New branch"});
  const t = copy[lang];
  const selected = people.find(p=>p.id===selectedId);
  const normalizedFullName = newPerson.name.normalize("NFKC").toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim().replace(/\s+/g, " ");
  const hasDuplicatePerson = Boolean(normalizedFullName && people.some(person => isDuplicatePerson(person, newPerson)));
  const hasSimilarName = Boolean(normalizedFullName && people.some(person => person.name.normalize("NFKC").toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim().replace(/\s+/g, " ") === normalizedFullName));
  const isAdmin = membership?.status === "approved" && ["owner", "admin"].includes(membership.role);
  const canEditPeople = membership?.status === "approved" && ["owner", "admin", "contributor"].includes(membership.role);

  useEffect(() => {
    if (!authUser || !firebaseConfigured) { setMembershipLoading(false); return; }
    let active = true;
    let stopWatching = null;
    setMembershipLoading(true);
    setAppError("");
    loadFamily(familyId, authUser.uid)
      .then(result => {
        if (!active) return;
        setMembership(result.member);
        setMembershipRequest(result.request);
        setPeople(result.people);
        setRelationships(result.relationships);
        if (result.people.length) setSelectedId(current => result.people.some(person => person.id === current) ? current : result.people[0].id);
        setView(result.member?.status === "approved" && ["owner", "admin"].includes(result.member.role) ? "graph" : "tree");
        if (result.member?.status === "approved") {
          stopWatching = watchFamily(familyId, records => {
            if (!active) return;
            setPeople(records.people);
            setRelationships(records.relationships);
            setSelectedId(current => records.people.some(person => person.id === current) ? current : (records.people[0]?.id || ""));
          }, error => { if (active) setAppError(error.message || t.connectionError); });
        }
      })
      .catch(error => { if (active) setAppError(error.message || t.connectionError); })
      .finally(() => { if (active) setMembershipLoading(false); });
    return () => { active = false; stopWatching?.(); };
  }, [authUser, membership?.status]);

  useEffect(() => {
    if (!isAdmin || activePage !== "approvals") { setPendingRequests([]); return undefined; }
    return watchJoinRequests(familyId, setPendingRequests, error => setAppError(error.message || t.connectionError));
  }, [isAdmin, activePage]);

  useEffect(() => {
    if (!showAdd) return undefined;
    const targetField = lastNameField === "name" ? "tamil" : "name";
    const sourceText = newPerson[lastNameField].trim();
    if (!sourceText || isManuallyEdited[targetField]) return undefined;
    const requestId = ++transliterationRequest.current;
    const timer = window.setTimeout(async () => {
      setSuggestingName(true);
      setSuggestionMessage("");
      try {
        const suggestion = lastNameField === "name"
          ? (await getTransliterateSuggestions(sourceText, {lang:"ta",numOptions:1,showCurrentWordAsLastSuggestion:false}))?.[0]
          : romanizeTamil(sourceText);
        if (requestId === transliterationRequest.current && suggestion) {
          setNewPerson(current => ({...current, [targetField]:suggestion}));
          setSuggestionMessage(t.suggestionReady);
        }
      } catch {
        if (requestId === transliterationRequest.current) {
          const fallback = lastNameField === "name" ? suggestTamilName(sourceText) : romanizeTamil(sourceText);
          if (fallback) setNewPerson(current => ({...current, [targetField]:fallback}));
          setSuggestionMessage(fallback ? t.suggestionReady : t.suggestionFailed);
        }
      } finally {
        if (requestId === transliterationRequest.current) setSuggestingName(false);
      }
    }, 500);
    return () => {
      window.clearTimeout(timer);
      transliterationRequest.current += 1;
    };
  }, [showAdd, lastNameField, newPerson[lastNameField], isManuallyEdited[lastNameField === "name" ? "tamil" : "name"]]);

  useEffect(() => {
    if (!auth) { setAuthLoading(false); return; }
    return onAuthStateChanged(auth, user => {
      setAuthUser(user);
      setMembershipLoading(Boolean(user));
      setMembership(null);
      setMembershipRequest(null);
      setPeople([]);
      setRelationships([]);
      setAppError("");
      setAuthLoading(false);
    });
  }, []);

  async function handleGoogleSignIn() {
    setAppError("");
    try { await signInWithPopup(auth, googleProvider); }
    catch (error) { setAppError(error.message || "Google sign-in failed."); }
  }

  async function handleSignOut() {
    if (auth) await signOut(auth);
  }

  const filtered = useMemo(() => people.filter(p => {
    const q = query.trim().toLowerCase();
    const matchesQuery = !q || [p.name,p.tamil,p.place,p.branch].some(v=>(v||"").toLowerCase().includes(q));
    return matchesQuery &&
      (gender==="All" || p.gender===gender) &&
      (status==="All" || p.status===status) &&
      (generation==="All" || String(p.generation)===generation) &&
      (branch==="All" || p.branch===branch);
  }), [people, query, gender, status, generation, branch]);
  useEffect(() => {
    if (query.trim() && filtered.length) setSelectedId(filtered[0].id);
  }, [query, filtered]);
  const graphPeople = useMemo(() => people.filter(p =>
    (gender === "All" || p.gender === gender) &&
    (status === "All" || p.status === status) &&
    (generation === "All" || String(p.generation) === generation) &&
    (branch === "All" || p.branch === branch)
  ), [people, gender, status, generation, branch]);

  const branches = [...new Set(people.map(p=>p.branch))];
  const generations = [...new Set(people.map(p=>String(p.generation)))].sort();
  const getPeople = ids => (ids||[]).map(id=>people.find(p=>p.id===id)).filter(Boolean);
  const inferredRelations = selected ? people.filter(person => person.id !== selected.id &&
    !(selected.parentIds || []).includes(person.id) && !(selected.children || []).includes(person.id) && !(selected.spouseIds || []).includes(person.id))
    .map(person => ({person,label:getRelationshipLabel(person,selected,relationships,people,lang)})).filter(item=>item.label) : [];
  const connectionRow = (person, relationship) => <div className="profile-relation-row" key={relationship?.id || person.id}>
    <PersonCard person={person} compact onClick={()=>setSelectedId(person.id)} lang={lang}/>
    {isAdmin && relationship && <><button type="button" className="icon-btn edit-connection-btn" title={t.editLink} aria-label={t.editLink} onClick={()=>openRelationshipEditor(relationship, person.id)}><Settings2 size={14}/></button><button type="button" className="icon-btn delete-connection-btn" title={t.removeConnection} aria-label={t.removeConnection} onClick={()=>setPendingDeleteRelationship(relationship)}><Trash2 size={14}/></button></>}
  </div>;

  async function addMember(e) {
    e.preventDefault();
    if (!canEditPeople || !authUser) return;
    if (hasSimilarName && !duplicateConfirmed) { setAppError(t.duplicatePerson); return; }
    setSaving(true); setAppError("");
    try {
      const person = await savePerson(familyId, authUser, newPerson, {allowDuplicate:duplicateConfirmed});
      setPeople(prev => [...prev, person]); setSelectedId(person.id); setShowAdd(false);
      setNewPerson({name:"", tamil:"", gender:"Female", birthYear:"", place:"", status:"Living", generation:"4", branch:"New branch"});
      setIsManuallyEdited({name:false,tamil:false}); setLastNameField("name");
      setDuplicateConfirmed(false);
    } catch (error) { setAppError(error.message === "DUPLICATE_PERSON" ? t.duplicatePerson : error.message || t.connectionError); }
    finally { setSaving(false); }
  }

  function updateName(field, value) {
    setNewPerson(current => ({...current, [field]: value}));
    setLastNameField(field);
    setIsManuallyEdited(current => ({...current, [field]:true}));
    setDuplicateConfirmed(false);
    setSuggestionMessage("");
  }

  async function suggestOtherName() {
    const sourceField = lastNameField;
    const source = newPerson[sourceField].trim();
    if (!source) return;
    const targetField = sourceField === "name" ? "tamil" : "name";
    const requestId = ++transliterationRequest.current;
    setSuggestingName(true);
    setSuggestionMessage("");
    try {
      let suggestion = sourceField === "name"
        ? (await getTransliterateSuggestions(source, {lang:"ta",numOptions:1,showCurrentWordAsLastSuggestion:false}))?.[0]
        : romanizeTamil(source);
      if (!suggestion) suggestion = sourceField === "name" ? suggestTamilName(source) : romanizeTamil(source);
      if (!suggestion) throw new Error("No suggestion");
      if (requestId === transliterationRequest.current) {
        setNewPerson(current => ({...current, [targetField]: suggestion}));
        setSuggestionMessage(t.suggestionReady);
      }
    } catch (error) {
      const fallback = sourceField === "name" ? suggestTamilName(source) : romanizeTamil(source);
      if (requestId === transliterationRequest.current) {
        if (fallback) setNewPerson(current => ({...current, [targetField]:fallback}));
        setSuggestionMessage(fallback ? t.suggestionReady : t.suggestionFailed);
      }
    } finally {
      if (requestId === transliterationRequest.current) setSuggestingName(false);
    }
  }

  async function addRelationship(e) {
    e.preventDefault();
    if (!isAdmin || !authUser || !selected || !linkTargetId) return;
    setSaving(true); setAppError("");
    try {
      let edges = [];
      const edge = (fromId,toId,relationshipType="parent") => edges.push({fromId,toId,relationshipType});
      if (linkMode === "child") edge(selected.id,linkTargetId);
      else if (linkMode === "parent") edge(linkTargetId,selected.id);
      else if (linkMode === "spouse") edge(selected.id,linkTargetId,"spouse");
      else if (linkMode === "sibling") {
        if (!linkSharedParentId || !(selected.parentIds || []).includes(linkSharedParentId)) throw new Error(`${t.addParentFirst} Choose a recorded parent as the shared parent.`);
        edge(linkSharedParentId,linkTargetId);
      } else if (linkMode === "grandparent") {
        if (!linkOtherParentId) throw new Error("Choose the parent through whom this grandparent is connected.");
        edge(selected.id,linkOtherParentId);
        edge(linkOtherParentId,linkTargetId);
      } else if (linkMode === "grandchild") {
        if (!linkContextParentId || !(selected.parentIds || []).includes(linkContextParentId)) throw new Error("Choose which recorded parent this grandchild relationship belongs to.");
        edge(linkTargetId,linkContextParentId);
      } else if (linkMode === "aunt_uncle") {
        if (!linkContextParentId || !linkSharedParentId) throw new Error("Choose the person's parent and one of that parent's recorded parents (the shared grandparent).");
        if (!(people.find(p=>p.id===linkTargetId)?.parentIds || []).includes(linkContextParentId) || !(people.find(p=>p.id===linkContextParentId)?.parentIds || []).includes(linkSharedParentId)) throw new Error("Choose a valid parent and shared grandparent from the existing family connections.");
        edge(linkSharedParentId,selected.id);
      } else if (linkMode === "cousin") {
        if (!linkContextParentId || !linkOtherParentId || !linkSharedParentId) throw new Error("Choose each cousin's parent and a shared grandparent to establish the family path.");
        if (!(selected.parentIds || []).includes(linkContextParentId) || !(people.find(p=>p.id===linkContextParentId)?.parentIds || []).includes(linkSharedParentId)) throw new Error("Choose a valid parent and shared grandparent for this person.");
        edge(linkSharedParentId,linkOtherParentId);
        edge(linkOtherParentId,linkTargetId);
      }
      if (editingRelationship && edges.length !== 1) throw new Error("Extended family links are added through the family path wizard; edit the underlying parent or spouse connection directly.");
      const canonicalize = item => item.relationshipType === "spouse" && item.fromId.localeCompare(item.toId)>0 ? {...item,fromId:item.toId,toId:item.fromId} : item;
      edges = edges.map(canonicalize);
      const working = relationships.filter(item=>item.id!==editingRelationship?.id).map(item=>({...item}));
      const newEdges = [];
      for (const item of edges) {
        if (item.fromId === item.toId) throw new Error("A person cannot be connected to themselves.");
        const exists = working.some(current=>current.relationshipType===item.relationshipType && (current.fromId===item.fromId && current.toId===item.toId || item.relationshipType==="spouse" && current.fromId===item.toId && current.toId===item.fromId));
        if (exists) continue;
        if (item.relationshipType === "parent" && createsParentCycle(working,item.fromId,item.toId)) throw new Error(t.parentCycleError);
        working.push(item); newEdges.push(item);
      }
      if (editingRelationship) {
        const relation = edges[0];
        if (!relation) throw new Error("That relationship is already recorded.");
        const updated = await updateRelationship(familyId,editingRelationship.id,relation);
        setRelationships(prev=>prev.map(item=>item.id===updated.id?{...item,...updated}:item));
      } else {
        if (!newEdges.length) throw new Error("That relationship is already recorded.");
        const saved = await saveRelationships(familyId,authUser,newEdges);
        setRelationships(prev=>[...prev,...saved]);
      }
      closeRelationshipModal();
    } catch (error) { setAppError(error.message || t.connectionError); }
    finally { setSaving(false); }
  }

  function openNewRelationship() {
    setEditingRelationship(null);
    setLinkMode("child");
    setLinkTargetId("");
    setLinkContextParentId(""); setLinkOtherParentId(""); setLinkSharedParentId("");
    setAppError("");
    setShowLink(true);
  }

  function openRelationshipEditor(relationship, otherId) {
    setEditingRelationship(relationship);
    setLinkMode(relationship.relationshipType === "spouse" ? "spouse" : relationship.fromId === selected?.id ? "child" : "parent");
    setLinkTargetId(otherId);
    setLinkContextParentId(""); setLinkOtherParentId(""); setLinkSharedParentId("");
    setAppError("");
    setShowLink(true);
  }

  function closeRelationshipModal() {
    setShowLink(false);
    setEditingRelationship(null);
    setLinkTargetId("");
    setLinkContextParentId(""); setLinkOtherParentId(""); setLinkSharedParentId("");
    setAppError("");
  }

  async function removeConnection() {
    if (!isAdmin || !pendingDeleteRelationship) return;
    setSaving(true);
    setAppError("");
    try {
      await deleteRelationship(familyId, pendingDeleteRelationship.id);
      setRelationships(current => current.filter(item => item.id !== pendingDeleteRelationship.id));
      setPendingDeleteRelationship(null);
    } catch (error) {
      setAppError(error.message || t.connectionError);
    } finally {
      setSaving(false);
    }
  }

  async function removePerson() {
    if (!isAdmin || !pendingDeletePerson) return;
    const target = pendingDeletePerson;
    setSaving(true); setAppError("");
    try {
      await deleteMemberAndRelationships(target.id);
      setRelationships(current=>current.filter(item=>item.fromId!==target.id&&item.toId!==target.id));
      setPeople(current=>current.filter(person=>person.id!==target.id));
      if (selectedId===target.id) setSelectedId(people.find(person=>person.id!==target.id)?.id || "");
      setPendingDeletePerson(null);
    } catch (error) {
      setAppError(error.code==="permission-denied" || /permission|insufficient/i.test(error.message||"")
        ? (lang==="ta"?"உறுப்பினரை நீக்க உங்களுக்கு அனுமதி இல்லை. குடும்ப உரிமையாளர் அல்லது நிர்வாகியிடம் கேளுங்கள்.":"You do not have permission to delete family members. Ask a family owner or admin.")
        : (lang==="ta"?"உறுப்பினரை நீக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்.":"Could not delete this member. Please try again."));
    } finally { setSaving(false); }
  }

  async function submitAccessRequest() {
    if (!authUser || requestingAccess) return;
    setRequestingAccess(true);
    setAppError("");
    try {
      const request = await requestFamilyAccess(familyId, authUser);
      setMembershipRequest(request);
    } catch (error) {
      setAppError(error.message || t.requestFailed);
    } finally {
      setRequestingAccess(false);
    }
  }

  async function checkFamilyAccess() {
    if (!authUser || checkingAccess) return;
    setCheckingAccess(true);
    setAppError("");
    try {
      const result = await loadFamily(familyId, authUser.uid);
      setMembership(result.member);
      setMembershipRequest(result.request);
      setPeople(result.people);
      setRelationships(result.relationships);
      if (result.people.length) setSelectedId(current => result.people.some(person => person.id === current) ? current : result.people[0].id);
    } catch (error) {
      setAppError(error.message || t.connectionError);
    } finally {
      setCheckingAccess(false);
    }
  }

  async function reviewAccessRequest(request, action, role = "member") {
    if (!isAdmin || !authUser) return;
    setReviewingRequestId(request.id);
    setAppError("");
    try {
      if (action === "approve") await approveJoinRequest(familyId, request, role, authUser.uid);
      else await rejectJoinRequest(familyId, request.id, authUser.uid);
    } catch (error) {
      setAppError(error.message || t.connectionError);
    } finally {
      setReviewingRequestId("");
    }
  }

  const navItems = [
    ["overview",t.overview,Users],["tree",t.tree,GitBranch],["timeline",t.timeline,CalendarDays],
    ["people",t.people,UserRound],["geography",t.geography,MapPin],["albums",t.albums,Image],
    ["approvals",t.approvals,ShieldCheck]
  ];

  if (!firebaseConfigured) return <div className="connection-screen"><div className="connection-card"><div className="brand-mark"><GitBranch size={22}/></div><h1>{t.setupTitle}</h1><p>{t.setupSub}</p><ol><li>Create a Firebase project and add a Web app.</li><li>Enable Google in Authentication and create a Firestore database.</li><li>Copy the Web app settings into a local <code>.env</code> file using <code>.env.example</code>.</li><li>Publish <code>firestore.rules</code> and set the family ID.</li></ol><p>{t.setupSteps}</p><small>No family data is stored until your Firebase project is connected.</small></div></div>;
  if (authLoading) return <div className="connection-screen"><div className="connection-card"><h1>{t.loading}</h1></div></div>;
  if (!authUser) return <div className="connection-screen"><div className="connection-card"><div className="brand-mark"><GitBranch size={22}/></div><h1>{t.authTitle}</h1><p>{t.authSub}</p>{appError && <p className="connection-error">{appError}</p>}<button className="primary-btn" onClick={handleGoogleSignIn}><LogIn size={17}/>{t.signInGoogle}</button></div></div>;
  if (membershipLoading) return <div className="connection-screen"><div className="connection-card"><h1>{t.loading}</h1></div></div>;
  if (!membership || membership.status !== "approved") return <div className="connection-screen"><div className="connection-card"><div className="brand-mark"><ShieldCheck size={22}/></div><h1>{t.noAccessTitle}</h1><p>{t.noAccessSub}</p><div className="bootstrap-details"><b>Signed in as</b><span>{authUser.email || "Google account"}</span><b>Account ID</b><code>{authUser.uid}</code><b>Family document ID</b><code>{familyId}</code></div>{membershipRequest?.status === "pending" && <p className="request-status" role="status">{t.requestSent}</p>}{membershipRequest?.status === "rejected" && <p className="request-status" role="status">{t.requestRejected}</p>}{membershipRequest?.status !== "pending" && <button className="primary-btn" onClick={submitAccessRequest} disabled={requestingAccess}><LogIn size={16}/>{requestingAccess?"Sending…":membershipRequest?.status === "rejected"?t.requestAgain:t.requestAccess}</button>}{(membershipRequest?.status === "pending" || membership?.status === "pending") && <button className="secondary-btn" onClick={checkFamilyAccess} disabled={checkingAccess}><RefreshCw size={15}/>{checkingAccess?t.checkingAccess:t.checkAccess}</button>}<details className="bootstrap-help"><summary>{t.firstOwnerSetup}</summary><small>For the first owner only, create Firestore document <code>families/{"{"}familyId{"}"}/members/{"{"}uid{"}"}</code> with role <code>owner</code> and status <code>approved</code>. Then sign out and back in.</small></details>{appError && <p className="connection-error">{appError}</p>}<button className="secondary-btn" onClick={handleSignOut}><LogOut size={15}/>{t.signOut}</button></div></div>;

  return <div className={`app ${theme}`}>
    <aside className={`sidebar ${mobileMenu?"open":""}`}>
      <div className="brand"><div className="brand-mark"><GitBranch size={21}/></div><div><b>ROOTS</b><small>OUR FAMILY HERITAGE</small></div><button className="mobile-close" onClick={()=>setMobileMenu(false)}><X size={18}/></button></div>
      <div className="workspace-label">WORKSPACE</div>
      <div className="nav-list">{navItems.map(([id,label,Icon])=><button key={id} className={`nav-item ${activePage===id?"active":""}`} onClick={()=>{setActivePage(id);setMobileMenu(false)}}><Icon size={18}/><span>{label}</span></button>)}</div>
      <div className="sidebar-bottom"><div className="privacy-note"><ShieldCheck size={17}/><div><b>Private family space</b><small>Approved members only</small></div></div><div className="user-row"><div className="user-avatar">{(authUser.displayName || authUser.email || "R").slice(0,1).toUpperCase()}</div><div><b>{authUser.displayName || authUser.email}</b><small>{membership.role} · Google</small></div><button className="icon-btn" title={t.signOut} onClick={handleSignOut}><LogOut size={15}/></button></div></div>
    </aside>

    <main className="main">
      <header className="topbar">
        <button className="icon-btn mobile-menu-btn" onClick={()=>setMobileMenu(true)}><Menu size={20}/></button>
        <div className="breadcrumbs">ROOTS <ChevronRight size={14}/> <span>{navItems.find(n=>n[0]===activePage)?.[1]}</span></div>
        <div className="top-actions">
          <span className="demo-pill"><i/> {t.demo}</span>
          <button className="icon-btn" title={theme==="light"?t.dark:t.light} onClick={()=>setTheme(theme==="light"?"dark":"light")}>{theme==="light"?<Moon size={18}/>:<Sun size={18}/>}</button>
          <button className="language-btn" onClick={()=>setLang(lang==="en"?"ta":"en")}><Globe2 size={16}/>{lang==="en"?"தமிழ்":"English"}</button>
          <button className="icon-btn" title="Settings"><Settings2 size={18}/></button>
        </div>
      </header>

      <div className="content">
        {appError && <div className="app-error" role="alert">{appError}</div>}
        <section className="welcome-row">
          <div><div className="eyebrow">YOUR FAMILY, CONNECTED</div><h1>{activePage==="tree"?t.treeTitle:navItems.find(n=>n[0]===activePage)?.[1]}</h1><p>{activePage==="tree"?t.treeSub:"Discover, preserve and grow your family's shared history."}</p></div>
          {canEditPeople && <button className="primary-btn" onClick={()=>setShowAdd(true)}><Plus size={17}/>{t.add}</button>}
        </section>

        <section className="stats-grid">
          <div className="stat-card"><div className="stat-icon purple"><Users size={18}/></div><div><small>{t.members}</small><b>{people.length}</b><span>Across all branches</span></div></div>
          <div className="stat-card"><div className="stat-icon blue"><GitBranch size={18}/></div><div><small>{t.generations}</small><b>{people.length ? Math.max(...people.map(p=>p.generation)) : 0}</b><span>Recorded generations</span></div></div>
          <div className="stat-card"><div className="stat-icon green"><Heart size={18}/></div><div><small>{t.branches}</small><b>{branches.length}</b><span>Connected family lines</span></div></div>
          <div className="stat-card"><div className="stat-icon amber"><CalendarDays size={18}/></div><div><small>{t.events}</small><b>0</b><span>Events not added</span></div></div>
        </section>

        {activePage==="tree" && <section className="tree-layout">
          <div className="tree-main panel">
            <div className="panel-heading"><div><h2>{t.tree}</h2><p>{view === "graph" ? t.exploreNetwork : view === "horizontal" ? t.horizontalSub : t.browseGenerations}</p></div><div className="tree-heading-actions"><div className="view-switch"><button className={view === "tree" ? "chosen" : ""} onClick={()=>setView("tree")}>{t.treeView}</button><button className={view === "horizontal" ? "chosen" : ""} onClick={()=>setView("horizontal")}>{t.horizontalView}</button>{isAdmin&&<button className={view === "graph" ? "chosen" : ""} onClick={()=>setView("graph")}>{t.graphView}</button>}</div><span className="graph-count">{filtered.length} results</span></div></div>
            <div className="filter-bar">
              <div className="search-box"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder={t.search}/>{query&&<button onClick={()=>setQuery("")}>×</button>}</div>
              <select value={gender} onChange={e=>setGender(e.target.value)}><option value="All">{t.gender}: All</option><option>Male</option><option>Female</option><option>Other</option></select>
              <select value={generation} onChange={e=>setGeneration(e.target.value)}><option value="All">{t.generation}: All</option>{generations.map(g=><option key={g} value={g}>{g}</option>)}</select>
              <select value={branch} onChange={e=>setBranch(e.target.value)}><option value="All">{t.branch}: All</option>{branches.map(b=><option key={b}>{b}</option>)}</select>
              <select value={status} onChange={e=>setStatus(e.target.value)}><option value="All">{t.status}: All</option><option value="Living">{t.living}</option><option value="Deceased">{t.deceased}</option></select>
            </div>
            {view === "graph" && isAdmin ? <div className="tree-canvas graph-canvas">{graphPeople.length ? <FamilyGraph people={graphPeople} selectedId={selectedId} onSelect={setSelectedId} lang={lang} theme={theme} query={query}/> : <p className="graph-empty">{canEditPeople ? "Add a family member to start your graph." : t.empty}</p>}</div> : view === "horizontal" ? <div className="tree-canvas horizontal-tree-canvas">{graphPeople.length ? <><div className="horizontal-desktop-layout"><HorizontalGenerationView people={graphPeople} selectedId={selectedId} onSelect={setSelectedId} lang={lang} canDelete={isAdmin} onDelete={person=>{setAppError("");setPendingDeletePerson(person)}} deleteLabel={lang==="ta"?"உறுப்பினரை நீக்கு":"Delete member"}/></div><div className="horizontal-mobile-layout"><MobileGenerationView people={graphPeople} selectedId={selectedId} onSelect={setSelectedId} lang={lang} canDelete={isAdmin} onDelete={person=>{setAppError("");setPendingDeletePerson(person)}} deleteLabel={lang==="ta"?"உறுப்பினரை நீக்கு":"Delete member"}/></div></> : <p className="graph-empty">{canEditPeople ? "Add a family member to start your family tree." : t.empty}</p>}</div> : <div className="tree-canvas conventional-canvas">{graphPeople.length ? <GenerationView people={graphPeople} selectedId={selectedId} onSelect={setSelectedId} lang={lang} canDelete={isAdmin} onDelete={person=>{setAppError("");setPendingDeletePerson(person)}} deleteLabel={lang==="ta"?"உறுப்பினரை நீக்கு":"Delete member"}/> : <p className="graph-empty">{canEditPeople ? "Add a family member to start your family tree." : t.empty}</p>}</div>}
            <div className="tree-footer"><span><i className="legend-dot male-dot"/> Male <i className="legend-dot female-dot"/> Female <i className="legend-dot deceased-dot"/> Deceased</span><span>{filtered.length} matching members</span></div>
          </div>
          <aside className="profile-panel panel">
            {selected ? <>
              <div className="profile-top"><span>{t.profile}</span>{isAdmin && people.length > 1 && <button className="secondary-btn add-relation-btn" onClick={openNewRelationship}><Link2 size={14}/>{t.addLink}</button>}</div>
              <div className="profile-hero"><Avatar person={selected} size="xl"/><h2>{lang==="ta"&&selected.tamil?selected.tamil:selected.name}</h2><p>{lang==="ta"?selected.name:selected.tamil} · {selected.role}</p><span className={`life-badge ${selected.status==="Living"?"alive":"passed"}`}>{selected.status}</span></div>
              <FocusView person={selected} parents={getPeople(selected.parentIds)} spouses={getPeople(selected.spouseIds)} children={getPeople(selected.children)} onSelect={setSelectedId} lang={lang} labels={{parents:t.parents,spouse:t.spouse,children:t.children}}/>
              <div className="profile-details"><div><small>{t.gender}</small><b>{selected.gender}</b></div><div><small>{t.born}</small><b>{selected.birthYear||"Unknown"}</b></div><div><small>{t.generation}</small><b>{selected.generation}</b></div><div><small>{t.branch}</small><b>{selected.branch}</b></div><div className="wide"><small>{t.native}</small><b><MapPin size={14}/>{selected.place||"Not added"}</b></div></div>
              <div className="relation-block"><h3>{t.parents}</h3>{getPeople(selected.parentIds).length?getPeople(selected.parentIds).map(p=>connectionRow(p,relationships.find(r=>r.relationshipType==="parent"&&r.fromId===p.id&&r.toId===selected.id))):<p className="muted">No parent links recorded</p>}</div>
              <div className="relation-block"><h3>{t.spouse}</h3>{getPeople(selected.spouseIds).length?getPeople(selected.spouseIds).map(p=>connectionRow(p,relationships.find(r=>r.relationshipType==="spouse"&&((r.fromId===selected.id&&r.toId===p.id)||(r.fromId===p.id&&r.toId===selected.id))))):<p className="muted">No spouse recorded</p>}</div>
              <div className="relation-block"><h3>{t.children}</h3>{getPeople(selected.children).length?getPeople(selected.children).map(p=>connectionRow(p,relationships.find(r=>r.relationshipType==="parent"&&r.fromId===selected.id&&r.toId===p.id))):<p className="muted">No children recorded</p>}</div>
              {inferredRelations.length>0&&<div className="relation-block inferred-kinship"><h3>{lang==="ta"?"பிற உறவுகள்":"Other family connections"}</h3>{inferredRelations.map(({person,label})=><div className="kinship-line" key={person.id}><PersonCard person={person} compact onClick={()=>setSelectedId(person.id)} lang={lang}/><small>{label}</small></div>)}</div>}
            </>:<div className="empty-profile"><UserRound size={30}/><h3>{t.selectPerson}</h3><p>{t.selectSub}</p></div>}
          </aside>
        </section>}

        {activePage==="timeline" && <section className="panel simple-page placeholder-page"><div className="placeholder-icon"><CalendarDays/></div><h2>Heritage timeline</h2><p>Family events will appear here when event recording is added.</p></section>}

        {activePage==="people" && <section className="panel simple-page"><div className="panel-heading"><div><h2>Family members</h2><p>Browse approved family records.</p></div>{canEditPeople && <button className="primary-btn" onClick={()=>setShowAdd(true)}><Plus size={16}/> Add member</button>}</div><div className="people-grid">{filtered.map(p=><PersonCard key={p.id} person={p} selected={selectedId===p.id} onClick={()=>{setSelectedId(p.id);setActivePage("tree")}} lang={lang}/>)}</div>{filtered.length===0&&<p className="muted">{t.empty}</p>}</section>}

        {activePage==="overview" && <section className="panel simple-page"><div className="panel-heading"><div><h2>Welcome to ROOTS</h2><p>Your private space for preserving family connections and memories.</p></div></div><div className="overview-cards"><div><GitBranch/><b>Explore the family tree</b><p>Explore a living network of family relationships.</p><button onClick={()=>setActivePage("tree")}>Open family tree <ChevronRight size={14}/></button></div><div><CalendarDays/><b>Preserve family history</b><p>Record births, marriages and important milestones.</p><button onClick={()=>setActivePage("timeline")}>Open timeline <ChevronRight size={14}/></button></div><div><Users/><b>Grow your family archive</b><p>Add relatives gradually and invite family contributors.</p><button onClick={()=>setShowAdd(true)}>Add a member <ChevronRight size={14}/></button></div></div></section>}

        {activePage==="approvals" && <section className="panel simple-page approvals-page"><div className="panel-heading"><div><h2>{t.approvalsTitle}</h2><p>{t.approvalsSub}</p></div>{isAdmin&&<span className="graph-count">{pendingRequests.length} pending</span>}</div>{!isAdmin?<p className="muted">{t.adminOnly}</p>:pendingRequests.length===0?<div className="approvals-empty"><ShieldCheck size={24}/><p>{t.noRequests}</p></div>:<div className="approval-list">{pendingRequests.map(request=><article className="approval-row" key={request.id}><div className="approval-person"><div className="user-avatar">{(request.displayName||request.email||"?").slice(0,1).toUpperCase()}</div><div><b>{request.displayName||"Family member"}</b><span>{request.email}</span><small>{t.requestedBy}</small></div></div><div className="approval-actions"><button className="primary-btn" onClick={()=>reviewAccessRequest(request,"approve","member")} disabled={reviewingRequestId===request.id}><Check size={14}/>{t.approveMember}</button><button className="secondary-btn" onClick={()=>reviewAccessRequest(request,"approve","contributor")} disabled={reviewingRequestId===request.id}><Check size={14}/>{t.approveContributor}</button><button className="text-danger-btn" onClick={()=>reviewAccessRequest(request,"reject")} disabled={reviewingRequestId===request.id}>{t.rejectRequest}</button></div></article>)}</div>}</section>}

        {["geography","albums","settings"].includes(activePage) && <section className="panel simple-page placeholder-page"><div className="placeholder-icon">{activePage==="geography"?<MapPin/>:activePage==="albums"?<Image/>:<Settings2/>}</div><h2>{navItems.find(n=>n[0]===activePage)?.[1]}</h2><p>This module is planned for the next development phase. The interface and data model will be connected to secure cloud services before real family information is uploaded.</p>{activePage==="geography"&&<div className="map-placeholder"><MapPin size={24}/><b>Family geography map</b><span>Native places and current locations will appear here.</span></div>}{activePage==="albums"&&<div className="map-placeholder"><Upload size={24}/><b>Private family albums</b><span>Invited members will be able to contribute photographs.</span></div>}</section>}
      </div>
      <footer className="footer"><span>ROOTS · Our Family Heritage</span><span>Private family workspace · {familyId}</span></footer>
    </main>

    {showAdd && <div className="modal-backdrop" onClick={()=>setShowAdd(false)}><form className="modal" onSubmit={addMember} onClick={e=>e.stopPropagation()}><div className="modal-heading"><div><h2>{t.addTitle}</h2><p>This record is saved to the family database.</p></div><button type="button" className="icon-btn" onClick={()=>setShowAdd(false)}><X size={18}/></button></div>
      <label>{t.fullName}<input required value={newPerson.name} onChange={e=>updateName("name",e.target.value)}/></label>
      <label>{t.tamilName}<input value={newPerson.tamil} onChange={e=>updateName("tamil",e.target.value)}/></label>
      <p className="field-hint">{t.nameHint}</p>
      {hasSimilarName&&<><p className={hasDuplicatePerson?"connection-error":"duplicate-warning"} role="status">{hasDuplicatePerson?t.duplicatePerson:t.possibleDuplicate}</p><label className="duplicate-confirm"><input type="checkbox" checked={duplicateConfirmed} onChange={e=>setDuplicateConfirmed(e.target.checked)}/>{t.duplicateConfirm}</label></>}
      <div className="translation-actions"><button type="button" className="secondary-btn" onClick={suggestOtherName} disabled={suggestingName||(!newPerson.name.trim()&&!newPerson.tamil.trim())}>{t.suggestName}</button>{suggestingName&&<small className="transliteration-loading" role="status"><span className="transliteration-spinner" aria-hidden="true"/>{t.suggestingName}</small>}{suggestionMessage&&!suggestingName&&<small role="status">{suggestionMessage}</small>}</div>
      <div className="form-row"><label>{t.gender}<select value={newPerson.gender} onChange={e=>setNewPerson({...newPerson,gender:e.target.value})}><option>Female</option><option>Male</option><option>Other</option></select></label><label>{t.year}<input type="number" min="1800" max="2026" value={newPerson.birthYear} onChange={e=>{setNewPerson({...newPerson,birthYear:e.target.value});setDuplicateConfirmed(false)}}/></label></div>
      <label>{t.location}<input value={newPerson.place} onChange={e=>setNewPerson({...newPerson,place:e.target.value})} placeholder="Town / city, state"/></label>
      <div className="form-row"><label>{t.generation}<input type="number" min="1" value={newPerson.generation} onChange={e=>setNewPerson({...newPerson,generation:e.target.value})}/></label><label>{t.status}<select value={newPerson.status} onChange={e=>setNewPerson({...newPerson,status:e.target.value})}><option>Living</option><option>Deceased</option></select></label></div>
      <label>{t.branch}<input value={newPerson.branch} onChange={e=>setNewPerson({...newPerson,branch:e.target.value})}/></label>
      <div className="modal-actions"><button type="button" className="secondary-btn" onClick={()=>setShowAdd(false)}>{t.cancel}</button><button type="submit" className="primary-btn" disabled={saving||(hasSimilarName&&!duplicateConfirmed)}><Plus size={16}/>{saving?"Saving…":t.save}</button></div>
    </form></div>}
    {showLink && selected && <div className="modal-backdrop" onClick={closeRelationshipModal}><form className="modal" onSubmit={addRelationship} onClick={e=>e.stopPropagation()}><div className="modal-heading"><div><h2>{editingRelationship?t.editLink:t.addLink}</h2><p>{lang==="ta"&&selected.tamil?selected.tamil:selected.name}</p></div><button type="button" className="icon-btn" onClick={closeRelationshipModal}><X size={18}/></button></div>
      <label>{t.relationLabel}<select value={linkMode} onChange={e=>{setLinkMode(e.target.value);setLinkContextParentId("");setLinkOtherParentId("");setLinkSharedParentId("")}}><option value="child">{t.parentOf}</option><option value="parent">{t.childOf}</option><option value="spouse">{t.spouseOf}</option>{!editingRelationship&&<><option value="sibling">{t.siblingOf}</option><option value="grandparent">{t.grandparentOf}</option><option value="grandchild">{t.grandchildOf}</option><option value="aunt_uncle">{t.auntUncleOf}</option><option value="cousin">{t.cousinOf}</option></>}</select></label>
      <label>{t.choosePerson}<select required value={linkTargetId} onChange={e=>{setLinkTargetId(e.target.value);setLinkContextParentId("");setLinkOtherParentId("");setLinkSharedParentId("")}}><option value="">Select a family member…</option>{people.filter(person=>person.id!==selected.id).map(person=><option key={person.id} value={person.id}>{lang==="ta"&&person.tamil?person.tamil:person.name}</option>)}</select></label>
      {!editingRelationship&&["grandchild","aunt_uncle","cousin"].includes(linkMode)&&<label>{t.contextParent}<select required value={linkContextParentId} onChange={e=>{setLinkContextParentId(e.target.value);setLinkSharedParentId("")}}><option value="">Choose the family-line parent…</option>{getPeople(linkMode==="aunt_uncle"?people.find(person=>person.id===linkTargetId)?.parentIds:selected.parentIds).map(person=><option key={person.id} value={person.id}>{lang==="ta"&&person.tamil?person.tamil:person.name}</option>)}</select></label>}
      {!editingRelationship&&linkMode==="sibling"&&<label>{t.sharedParent}<select required value={linkSharedParentId} onChange={e=>setLinkSharedParentId(e.target.value)}><option value="">Choose a shared recorded parent…</option>{getPeople(selected.parentIds).map(person=><option key={person.id} value={person.id}>{lang==="ta"&&person.tamil?person.tamil:person.name}</option>)}</select></label>}
      {!editingRelationship&&linkMode==="aunt_uncle"&&<label>{t.sharedGrandparent}<select required value={linkSharedParentId} onChange={e=>setLinkSharedParentId(e.target.value)}><option value="">Choose a grandparent…</option>{getPeople(people.find(person=>person.id===linkContextParentId)?.parentIds).map(person=><option key={person.id} value={person.id}>{lang==="ta"&&person.tamil?person.tamil:person.name}</option>)}</select></label>}
      {!editingRelationship&&["grandparent","cousin"].includes(linkMode)&&<label>{t.relativeParent}<select required value={linkOtherParentId} onChange={e=>setLinkOtherParentId(e.target.value)}><option value="">Choose the parent for this family path…</option>{people.filter(person=>person.id!==selected.id&&person.id!==linkTargetId).map(person=><option key={person.id} value={person.id}>{lang==="ta"&&person.tamil?person.tamil:person.name}</option>)}</select><small className="field-hint">{linkMode==="cousin"?"This person will be recorded as the cousin's parent, then linked through the shared grandparent.":"ROOTS will link this person as the grandparent of the selected relative through this parent."}</small></label>}
      {!editingRelationship&&linkMode==="cousin"&&<label>{t.sharedGrandparent}<select required value={linkSharedParentId} onChange={e=>setLinkSharedParentId(e.target.value)}><option value="">Choose a recorded grandparent…</option>{getPeople(people.find(person=>person.id===linkContextParentId)?.parentIds).map(person=><option key={person.id} value={person.id}>{lang==="ta"&&person.tamil?person.tamil:person.name}</option>)}</select></label>}
      {!editingRelationship&&["sibling","grandparent","grandchild","aunt_uncle","cousin"].includes(linkMode)&&<p className="field-hint relationship-path-hint">{t.relationshipPathHint}</p>}
      {appError && <p className="connection-error">{appError}</p>}
      <div className="modal-actions"><button type="button" className="secondary-btn" onClick={closeRelationshipModal}>{t.cancel}</button><button type="submit" className="primary-btn" disabled={saving||!linkTargetId}><Link2 size={16}/>{saving?"Saving…":editingRelationship?t.updateLink:t.saveLink}</button></div>
    </form></div>}
    {pendingDeletePerson && <div className="modal-backdrop" onClick={()=>!saving&&setPendingDeletePerson(null)}><div className="modal confirm-delete-modal" role="alertdialog" aria-modal="true" aria-labelledby="delete-person-title" onClick={e=>e.stopPropagation()}><div className="modal-heading"><div><h2 id="delete-person-title">{lang==="ta"?"இந்தக் குடும்ப உறுப்பினரை நீக்கவா?":"Delete this family member?"}</h2><p>{lang==="ta"?`${pendingDeletePerson.name} மற்றும் அவருடன் இணைக்கப்பட்டுள்ள அனைத்து உறவுகளும் நிரந்தரமாக நீக்கப்படும். மீட்டெடுக்க முடியாது.`:`${pendingDeletePerson.name} and all their family connections will be permanently deleted. This cannot be undone.`}</p></div><button type="button" className="icon-btn" aria-label={t.cancel} onClick={()=>setPendingDeletePerson(null)} disabled={saving}><X size={18}/></button></div>{appError&&<p className="connection-error" role="alert">{appError}</p>}<div className="modal-actions"><button type="button" className="secondary-btn" onClick={()=>{setPendingDeletePerson(null);setAppError("")}} disabled={saving}>{t.cancel}</button><button type="button" className="danger-btn" onClick={removePerson} disabled={saving}><Trash2 size={15}/>{saving?(lang==="ta"?"நீக்குகிறது…":"Deleting…"):(lang==="ta"?"உறுப்பினரை நீக்கு":"Delete member")}</button></div></div></div>}
    {pendingDeleteRelationship && <div className="modal-backdrop" onClick={()=>setPendingDeleteRelationship(null)}><div className="modal confirm-delete-modal" role="alertdialog" aria-modal="true" aria-labelledby="delete-connection-title" onClick={e=>e.stopPropagation()}><div className="modal-heading"><div><h2 id="delete-connection-title">{t.removeConnectionTitle}</h2><p>{t.removeConnectionHint}</p></div><button type="button" className="icon-btn" onClick={()=>setPendingDeleteRelationship(null)}><X size={18}/></button></div><div className="modal-actions"><button type="button" className="secondary-btn" onClick={()=>setPendingDeleteRelationship(null)}>{t.cancel}</button><button type="button" className="danger-btn" onClick={removeConnection} disabled={saving}><Trash2 size={15}/>{saving?"Removing…":t.remove}</button></div></div></div>}
  </div>;
}

export default App;
