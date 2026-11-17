import React, { useEffect, useMemo, useRef, useState } from "react";
import ForceGraph2D from "react-force-graph-2d";
import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { getTransliterateSuggestions } from "@sarthak1407/react-transliterate";
import {
  Search, Plus, Users, GitBranch, CalendarDays, MapPin, Settings2,
  Sun, Moon, Globe2, ChevronDown, ChevronRight, Heart, Upload,
  ShieldCheck, Download, Image, Menu, X, Filter, UserRound, Clock3, ZoomIn, ZoomOut, LocateFixed,
  LogIn, LogOut, Link2
} from "lucide-react";
import { auth, familyId, firebaseConfigured, googleProvider } from "./firebaseClient";
import { suggestTamilName, romanizeTamil } from "./nameTransliteration";
import { isDuplicatePerson, loadFamily, savePerson, saveRelationship, updateRelationship, watchFamily } from "./familyRepository";

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
    treeView:"Tree", graphView:"Graph", memberPreview:"Family member", adminPreview:"Administrator", previewRole:"Preview role",
    browseGenerations:"Browse family members by generation", exploreNetwork:"Explore the family network",
    signInGoogle:"Continue with Google", signOut:"Sign out", authTitle:"Sign in to ROOTS", authSub:"Use your approved Google account to access your family space.",
    noAccessTitle:"Access is not set up yet", noAccessSub:"Ask your family administrator to approve this Google account.",
    setupTitle:"Connect ROOTS to Firebase", setupSub:"Add your Firebase web app settings and family ID to the local environment file, then restart Vite.",
    setupSteps:"In Firebase Console, enable Google sign-in, create a Firestore database, publish the included firestore.rules, then add your first owner membership.",
    loading:"Loading your family space…", addLink:"Add relationship", parentOf:"Parent of", childOf:"Child of", spouseOf:"Spouse of", choosePerson:"Choose a person",
    saveLink:"Save relationship", editLink:"Edit connection", updateLink:"Save changes", duplicatePerson:"A person with this name and birth details is already recorded. Check the existing profile before adding.", duplicateConfirm:"I checked the existing profile; this is a different person.", possibleDuplicate:"A family member has the same name. Confirm this is a different person before adding.", connectionError:"Could not load family data. Check the Firebase setup and Firestore rules."
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
    treeView:"குடும்ப மரம்", graphView:"வரைபடம்", memberPreview:"குடும்ப உறுப்பினர்", adminPreview:"நிர்வாகி", previewRole:"முன்னோட்டப் பங்கு",
    browseGenerations:"தலைமுறைகளின்படி குடும்ப உறுப்பினர்களைப் பாருங்கள்", exploreNetwork:"குடும்ப உறவுகளை ஆராயுங்கள்",
    signInGoogle:"Google மூலம் தொடரவும்", signOut:"வெளியேறு", authTitle:"ROOTS-இல் உள்நுழைக", authSub:"அனுமதிக்கப்பட்ட Google கணக்கைப் பயன்படுத்தவும்.",
    noAccessTitle:"அணுகல் இன்னும் அமைக்கப்படவில்லை", noAccessSub:"இந்த Google கணக்கை குடும்ப நிர்வாகியிடம் அனுமதிக்கச் சொல்லுங்கள்.",
    setupTitle:"ROOTS-ஐ Firebase-உடன் இணைக்கவும்", setupSub:"Firebase வலைச் செயலி அமைப்புகளையும் குடும்ப ID-யையும் உள்ளூர் environment கோப்பில் சேர்த்து Vite-ஐ மீண்டும் தொடங்கவும்.",
    setupSteps:"Firebase Console-இல் Google உள்நுழைவை இயக்கி, Firestore தரவுத்தளத்தை உருவாக்கி, firestore.rules-ஐ வெளியிட்டு, முதல் உரிமையாளர் உறுப்பினர் பதிவைச் சேர்க்கவும்.",
    loading:"குடும்ப இடத்தை ஏற்றுகிறது…", addLink:"உறவைச் சேர்க்க", parentOf:"பெற்றோர்", childOf:"குழந்தை", spouseOf:"துணைவர்", choosePerson:"ஒருவரைத் தேர்ந்தெடுக்கவும்",
    saveLink:"உறவைச் சேமி", editLink:"உறவைத் திருத்து", updateLink:"மாற்றங்களைச் சேமி", duplicatePerson:"இந்தப் பெயரும் பிறந்த விவரங்களும் கொண்ட பதிவு ஏற்கனவே உள்ளது. சேர்ப்பதற்கு முன் பழைய பதிவைச் சரிபார்க்கவும்.", duplicateConfirm:"பழைய பதிவைச் சரிபார்த்தேன்; இது வேறு நபர்.", possibleDuplicate:"அதே பெயரில் ஒருவர் உள்ளார். புதிய நபர் வேறு நபர் என்பதை உறுதிப்படுத்தவும்.", connectionError:"குடும்பத் தரவை ஏற்ற முடியவில்லை. Firebase அமைப்புகளையும் விதிகளையும் சரிபார்க்கவும்."
  }
};

function Avatar({person, size="md"}) {
  const initials = (person?.name || "?").split(" ").map(x=>x[0]).slice(0,2).join("").toUpperCase();
  return <div className={`avatar ${size} ${person?.gender === "Female" ? "female" : ""}`}>{initials}</div>;
}

function PersonCard({person, selected, onClick, compact=false, lang="en"}) {
  return <button className={`person-card ${selected ? "selected" : ""} ${compact ? "compact" : ""}`} onClick={onClick}>
    <Avatar person={person} />
    <span className="person-copy">
      <strong>{lang==="ta" && person.tamil ? person.tamil : person.name}</strong>
      <small>{person.birthYear || "Year unknown"} · {person.status}</small>
    </span>
    {person.status==="Deceased" && <span className="status-dot deceased-dot" title="Deceased"/>}
  </button>;
}

function FamilyTreeView({people, selectedId, onSelect, lang}) {
  const generations = [...new Set(people.map(person => person.generation))].sort((a,b)=>a-b);
  const getNames = ids => (ids || []).map(id => people.find(person => person.id === id)).filter(Boolean).map(person => lang === "ta" && person.tamil ? person.tamil : person.name);
  return <div className="family-tree-view">
    {generations.map(generation => <section className="generation-lane" key={generation}>
      <div className="generation-title">{lang === "ta" ? `தலைமுறை ${generation}` : `Generation ${generation}`}</div>
      <div className="generation-members">{people.filter(person => person.generation === generation).map(person => <div className="tree-person-wrap" key={person.id}>
        <PersonCard person={person} selected={selectedId === person.id} onClick={() => onSelect(person.id)} lang={lang}/>
        <div className="tree-relation-note">{getNames(person.parentIds).length ? `← ${getNames(person.parentIds).join(" · ")}` : (getNames(person.spouseIds).length ? `♥ ${getNames(person.spouseIds).join(" · ")}` : person.branch)}</div>
      </div>)}</div>
    </section>)}
  </div>;
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
        ctx.font = `${active ? 600 : 500} ${fontSize}px 'DM Sans', sans-serif`;
        const labelWidth = ctx.measureText(label).width;
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
  const [membershipLoading, setMembershipLoading] = useState(false);
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
  const [linkMode, setLinkMode] = useState("child");
  const [linkTargetId, setLinkTargetId] = useState("");
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
      setPeople([]);
      setRelationships([]);
      setAppError("");
      setAuthLoading(false);
    });
  }, []);

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
  }, [authUser]);

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
  const connectionRow = (person, relationship) => <div className="profile-relation-row" key={relationship.id}>
    <PersonCard person={person} compact onClick={()=>setSelectedId(person.id)} lang={lang}/>
    {isAdmin && <button type="button" className="icon-btn edit-connection-btn" title={t.editLink} aria-label={t.editLink} onClick={()=>openRelationshipEditor(relationship, person.id)}><Settings2 size={14}/></button>}
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
    let fromId = selected.id;
    let toId = linkTargetId;
    if (linkMode === "parent") { fromId = linkTargetId; toId = selected.id; }
    if (linkMode === "spouse" && fromId.localeCompare(toId) > 0) [fromId, toId] = [toId, fromId];
    const relationshipType = linkMode === "spouse" ? "spouse" : "parent";
    const existsAlready = relationships.some(item => item.id !== editingRelationship?.id && item.relationshipType === relationshipType &&
      (relationshipType === "spouse"
        ? (item.fromId === fromId && item.toId === toId) || (item.fromId === toId && item.toId === fromId)
        : item.fromId === fromId && item.toId === toId));
    if (existsAlready) { setAppError("That relationship is already recorded."); return; }
    setSaving(true); setAppError("");
    try {
      const relationData = {fromId, toId, relationshipType};
      if (editingRelationship) {
        const relation = await updateRelationship(familyId, editingRelationship.id, relationData);
        setRelationships(prev => prev.map(item => item.id === relation.id ? {...item, ...relation} : item));
      } else {
        const relation = await saveRelationship(familyId, authUser, relationData);
        setRelationships(prev => [...prev, relation]);
      }
      closeRelationshipModal();
    } catch (error) { setAppError(error.message || t.connectionError); }
    finally { setSaving(false); }
  }

  function openNewRelationship() {
    setEditingRelationship(null);
    setLinkMode("child");
    setLinkTargetId("");
    setAppError("");
    setShowLink(true);
  }

  function openRelationshipEditor(relationship, otherId) {
    setEditingRelationship(relationship);
    setLinkMode(relationship.relationshipType === "spouse" ? "spouse" : relationship.fromId === selected?.id ? "child" : "parent");
    setLinkTargetId(otherId);
    setAppError("");
    setShowLink(true);
  }

  function closeRelationshipModal() {
    setShowLink(false);
    setEditingRelationship(null);
    setLinkTargetId("");
    setAppError("");
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
  if (!membership || membership.status !== "approved") return <div className="connection-screen"><div className="connection-card"><div className="brand-mark"><ShieldCheck size={22}/></div><h1>{t.noAccessTitle}</h1><p>{t.noAccessSub}</p><div className="bootstrap-details"><b>Signed in as</b><span>{authUser.email || "Google account"}</span><b>Account ID</b><code>{authUser.uid}</code><b>Family document ID</b><code>{familyId}</code><small>For the first owner, create Firestore document <code>families/{"{"}familyId{"}"}/members/{"{"}uid{"}"}</code> with role <code>owner</code> and status <code>approved</code>. Then sign out and back in.</small></div>{appError && <p className="connection-error">{appError}</p>}<button className="secondary-btn" onClick={handleSignOut}><LogOut size={15}/>{t.signOut}</button></div></div>;

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
            <div className="panel-heading"><div><h2>{t.tree}</h2><p>{view === "graph" ? t.exploreNetwork : t.browseGenerations}</p></div><div className="tree-heading-actions">{isAdmin && <div className="view-switch"><button className={view === "tree" ? "chosen" : ""} onClick={()=>setView("tree")}>{t.treeView}</button><button className={view === "graph" ? "chosen" : ""} onClick={()=>setView("graph")}>{t.graphView}</button></div>}<span className="graph-count">{filtered.length} results</span></div></div>
            <div className="filter-bar">
              <div className="search-box"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder={t.search}/>{query&&<button onClick={()=>setQuery("")}>×</button>}</div>
              <select value={gender} onChange={e=>setGender(e.target.value)}><option value="All">{t.gender}: All</option><option>Male</option><option>Female</option><option>Other</option></select>
              <select value={generation} onChange={e=>setGeneration(e.target.value)}><option value="All">{t.generation}: All</option>{generations.map(g=><option key={g} value={g}>{g}</option>)}</select>
              <select value={branch} onChange={e=>setBranch(e.target.value)}><option value="All">{t.branch}: All</option>{branches.map(b=><option key={b}>{b}</option>)}</select>
              <select value={status} onChange={e=>setStatus(e.target.value)}><option value="All">{t.status}: All</option><option value="Living">{t.living}</option><option value="Deceased">{t.deceased}</option></select>
            </div>
            {view === "graph" && isAdmin ? <div className="tree-canvas graph-canvas">{graphPeople.length ? <FamilyGraph people={graphPeople} selectedId={selectedId} onSelect={setSelectedId} lang={lang} theme={theme} query={query}/> : <p className="graph-empty">{canEditPeople ? "Add a family member to start your graph." : t.empty}</p>}</div> : <div className="tree-canvas conventional-canvas">{graphPeople.length ? <FamilyTreeView people={graphPeople} selectedId={selectedId} onSelect={setSelectedId} lang={lang}/> : <p className="graph-empty">{canEditPeople ? "Add a family member to start your family tree." : t.empty}</p>}</div>}
            <div className="tree-footer"><span><i className="legend-dot male-dot"/> Male <i className="legend-dot female-dot"/> Female <i className="legend-dot deceased-dot"/> Deceased</span><span>{filtered.length} matching members</span></div>
          </div>
          <aside className="profile-panel panel">
            {selected ? <>
              <div className="profile-top"><span>{t.profile}</span>{isAdmin && people.length > 1 && <button className="secondary-btn add-relation-btn" onClick={openNewRelationship}><Link2 size={14}/>{t.addLink}</button>}</div>
              <div className="profile-hero"><Avatar person={selected} size="xl"/><h2>{lang==="ta"&&selected.tamil?selected.tamil:selected.name}</h2><p>{lang==="ta"?selected.name:selected.tamil} · {selected.role}</p><span className={`life-badge ${selected.status==="Living"?"alive":"passed"}`}>{selected.status}</span></div>
              <div className="profile-details"><div><small>{t.gender}</small><b>{selected.gender}</b></div><div><small>{t.born}</small><b>{selected.birthYear||"Unknown"}</b></div><div><small>{t.generation}</small><b>{selected.generation}</b></div><div><small>{t.branch}</small><b>{selected.branch}</b></div><div className="wide"><small>{t.native}</small><b><MapPin size={14}/>{selected.place||"Not added"}</b></div></div>
              <div className="relation-block"><h3>{t.parents}</h3>{getPeople(selected.parentIds).length?getPeople(selected.parentIds).map(p=>connectionRow(p,relationships.find(r=>r.relationshipType==="parent"&&r.fromId===p.id&&r.toId===selected.id))):<p className="muted">No parent links recorded</p>}</div>
              <div className="relation-block"><h3>{t.spouse}</h3>{getPeople(selected.spouseIds).length?getPeople(selected.spouseIds).map(p=>connectionRow(p,relationships.find(r=>r.relationshipType==="spouse"&&((r.fromId===selected.id&&r.toId===p.id)||(r.fromId===p.id&&r.toId===selected.id))))):<p className="muted">No spouse recorded</p>}</div>
              <div className="relation-block"><h3>{t.children}</h3>{getPeople(selected.children).length?getPeople(selected.children).map(p=>connectionRow(p,relationships.find(r=>r.relationshipType==="parent"&&r.fromId===selected.id&&r.toId===p.id))):<p className="muted">No children recorded</p>}</div>
            </>:<div className="empty-profile"><UserRound size={30}/><h3>{t.selectPerson}</h3><p>{t.selectSub}</p></div>}
          </aside>
        </section>}

        {activePage==="timeline" && <section className="panel simple-page placeholder-page"><div className="placeholder-icon"><CalendarDays/></div><h2>Heritage timeline</h2><p>Family events will appear here when event recording is added.</p></section>}

        {activePage==="people" && <section className="panel simple-page"><div className="panel-heading"><div><h2>Family members</h2><p>Browse approved family records.</p></div>{canEditPeople && <button className="primary-btn" onClick={()=>setShowAdd(true)}><Plus size={16}/> Add member</button>}</div><div className="people-grid">{filtered.map(p=><PersonCard key={p.id} person={p} selected={selectedId===p.id} onClick={()=>{setSelectedId(p.id);setActivePage("tree")}} lang={lang}/>)}</div>{filtered.length===0&&<p className="muted">{t.empty}</p>}</section>}

        {activePage==="overview" && <section className="panel simple-page"><div className="panel-heading"><div><h2>Welcome to ROOTS</h2><p>Your private space for preserving family connections and memories.</p></div></div><div className="overview-cards"><div><GitBranch/><b>Explore the family tree</b><p>Explore a living network of family relationships.</p><button onClick={()=>setActivePage("tree")}>Open family tree <ChevronRight size={14}/></button></div><div><CalendarDays/><b>Preserve family history</b><p>Record births, marriages and important milestones.</p><button onClick={()=>setActivePage("timeline")}>Open timeline <ChevronRight size={14}/></button></div><div><Users/><b>Grow your family archive</b><p>Add relatives gradually and invite family contributors.</p><button onClick={()=>setShowAdd(true)}>Add a member <ChevronRight size={14}/></button></div></div></section>}

        {["geography","albums","approvals","settings"].includes(activePage) && <section className="panel simple-page placeholder-page"><div className="placeholder-icon">{activePage==="geography"?<MapPin/>:activePage==="albums"?<Image/>:activePage==="approvals"?<ShieldCheck/>:<Settings2/>}</div><h2>{navItems.find(n=>n[0]===activePage)?.[1]}</h2><p>This module is planned for the next development phase. The interface and data model will be connected to secure cloud services before real family information is uploaded.</p>{activePage==="geography"&&<div className="map-placeholder"><MapPin size={24}/><b>Family geography map</b><span>Native places and current locations will appear here.</span></div>}{activePage==="albums"&&<div className="map-placeholder"><Upload size={24}/><b>Private family albums</b><span>Invited members will be able to contribute photographs.</span></div>}</section>}
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
      <label>Relationship<select value={linkMode} onChange={e=>setLinkMode(e.target.value)}><option value="child">{t.parentOf}</option><option value="parent">{t.childOf}</option><option value="spouse">{t.spouseOf}</option></select></label>
      <label>{t.choosePerson}<select required value={linkTargetId} onChange={e=>setLinkTargetId(e.target.value)}><option value="">Select a family member…</option>{people.filter(person=>person.id!==selected.id).map(person=><option key={person.id} value={person.id}>{lang==="ta"&&person.tamil?person.tamil:person.name}</option>)}</select></label>
      {appError && <p className="connection-error">{appError}</p>}
      <div className="modal-actions"><button type="button" className="secondary-btn" onClick={closeRelationshipModal}>{t.cancel}</button><button type="submit" className="primary-btn" disabled={saving||!linkTargetId}><Link2 size={16}/>{saving?"Saving…":editingRelationship?t.updateLink:t.saveLink}</button></div>
    </form></div>}
  </div>;
}

export default App;
