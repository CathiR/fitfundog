import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "./supabase";

document.title = "Fit Fun Dog";
document.querySelectorAll("link[rel*='icon']").forEach(el => el.remove());
const fav = document.createElement("link");
fav.rel = "icon"; fav.type = "image/png"; fav.href = "/favicon.png?v=4";
document.head.appendChild(fav);
if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch(() => {}));

const ADMIN_ID = "1bed901d-005a-496e-bf8e-5d55804e6f72";
const VAPID_PUBLIC_KEY = "BPOAPZ3DeTf-FL_rmbeEufuh-bhAEH-zrUR-TPTsRVfNCotxh_jJ-7A5AHu9pWNyM24HxX_E5Ls1dy4Mt82b1F4";
const THERAPIST_EMAIL = "fitfundog@freenet.de";
const BRAND = "#5fb8b9", DARK = "#1E4A4B", MID = "#3D8E8F";
const LIGHT = "#E6F6F6", PALE = "#F3FBFB", ACCENT = "#8FD4D5";
const LOGO_URL = "https://tkgwdmntglzfeulpgfpw.supabase.co/storage/v1/object/public/exercise-images/Logo%20Fit%20Fun%20Dog-Vektor%20ws.png";
const CATEGORIES = ["Regeneration", "Balance", "Kräftigung", "Koordination", "Mobilisation"];
const TARGET_REGIONS = ["Ganzer Körper", "Hinterhand", "Vorderhand", "Rumpf", "Vorderpfoten", "Rücken"];
const EMPTY_PATIENT = { name: "", breed: "", age: "", owner: "", condition: "", avatar: "🐕", ownerEmail: "", ownerPassword: "" };
const EMPTY_TEMPLATE = { title: "", categories: [], target_regions: [], difficulty: "Leicht", description: "", instructions: ["","",""], image_url: "", video_url: "" };
const difficultyColor = { "Leicht": BRAND, "Mittel": MID, "Schwer": "#C0392B" };

// ── SearchInput OUTSIDE App to prevent focus loss on re-render ──
const SearchInput = ({ value, onChange, placeholder }) => (
  <div style={{ position: "relative", marginBottom: 10 }}>
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder || "Suchen..."}
      style={{ width: "100%", padding: "11px 14px 11px 36px", borderRadius: 12, border: "1.5px solid #B8DFE0", fontSize: 16, fontFamily: "'DM Sans',sans-serif", outline: "none", background: "white", color: "#102828", WebkitTextFillColor: "#102828", boxSizing: "border-box" }}
    />
    <svg style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)" }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3D7070" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
  </div>
);

// ── Custom Select with visible arrow ──
const CustomSelect = ({ value, onChange, children, style = {} }) => (
  <div style={{ position: "relative" }}>
    <select
      value={value}
      onChange={onChange}
      style={{
        width: "100%", padding: "12px 40px 12px 14px", borderRadius: 12,
        border: `1.5px solid #B8DFE0`, fontSize: 15, fontFamily: "'DM Sans',sans-serif",
        outline: "none", background: "white", color: "#102828",
        WebkitTextFillColor: "#102828", appearance: "none", cursor: "pointer",
        boxSizing: "border-box", ...style
      }}
    >
      {children}
    </select>
    <div style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", width: 28, height: 28, borderRadius: 8, background: BRAND + "20", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={BRAND} strokeWidth="2.5" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>
    </div>
  </div>
);

const Icon = ({ name, size = 20, color = BRAND }) => {
  const s = { width: size, height: size };
  const icons = {
    home: <svg {...s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
    practice: <svg {...s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>,
    info: <svg {...s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
    trash: <svg {...s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
    edit: <svg {...s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
    plus: <svg {...s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    assign: <svg {...s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
    check: <svg {...s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
    close: <svg {...s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    play: <svg {...s} viewBox="0 0 24 24" fill={color} stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
    clock: <svg {...s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    lang: <svg {...s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
    chevdown: <svg {...s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>,
    paw: <svg {...s} viewBox="0 0 24 24" fill={color}><circle cx="5.5" cy="6.5" r="2"/><circle cx="12" cy="4.5" r="2"/><circle cx="18.5" cy="6.5" r="2"/><circle cx="3.5" cy="12.5" r="1.5"/><path d="M12 8c-3.5 0-7 3-7 6.5 0 2.5 2 4.5 4.5 4.5h5c2.5 0 4.5-2 4.5-4.5C19 11 15.5 8 12 8z"/></svg>,
    tip: <svg {...s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18h6M10 22h4M12 2a7 7 0 0 1 7 7c0 2.4-1.2 4.5-3 5.7V17a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-2.3A7 7 0 0 1 12 2z"/></svg>,
    rest: <svg {...s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22C6.5 22 2 17.5 2 12S6.5 2 12 2s10 4.5 10 10-4.5 10-10 10z"/><path d="M12 6v6l4 2"/></svg>,
    filter: <svg {...s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>,
    target: <svg {...s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
    logout: <svg {...s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
    user: <svg {...s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    mail: <svg {...s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
    lock: <svg {...s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
    repeat: <svg {...s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>,
  };
  return icons[name] || null;
};

const T = {
  de: { appSub:"Tierphysiotherapie & Osteopathie", navOwner:"Home", navTherapist:"Praxis", navInfo:"Info", progress:"Heutiger Fortschritt", exercisesDone:"Übungen abgeschlossen", allDone:(n)=>`Alle Übungen erledigt! ${n} sagt Danke!`, noPatient:"Noch kein Patient angelegt", noExercises:"Noch keine Übungen zugewiesen.", all:"Alle", selectPatient:"Patient auswählen...", noPatientSelected:"Bitte einen Patienten auswählen.", homeExercises:(n)=>`Heimübungen (${n})`, noExercisesYet:"Noch keine Übungen.", step:"Schritt für Schritt", description:"Beschreibung", watchVideo:"Video ansehen", markDone:"Erledigt!", markUndone:"Zurücksetzen", saving:"Wird gespeichert...", assignBtn:"Übung zuweisen", freq:"Dauer (Text)", freqPh:"z.B. täglich morgens", step1:"1. Patient", step2:"2. Übung auswählen", step3:"3. Dauer", step4:"4. Häufigkeit pro Woche", noCategoryEx:"Keine Übungen in dieser Kategorie.", cancel:"Abbrechen", delete:"Löschen", remove:"Entfernen", filterCategory:"Kategorie", filterRegion:"Zielregion", langLabel:"Sprache", tipsTitle:"Tipps & Wissen", tipsSub:"Wichtige Hinweise für das Training", tabTips:"Trainings-Tipps", tabPause:"Pause & Regeneration", pauseHero:"Pause ist Training!", pauseHeroText:"Pause ist der Zeitraum, in dem die eigentliche Leistungssteigerung stattfindet. Ohne ausreichende Pausen droht Überlastung statt Fortschritt." },
  en: { appSub:"Animal Physiotherapy & Osteopathy", navOwner:"Home", navTherapist:"Practice", navInfo:"Info", progress:"Today's Progress", exercisesDone:"exercises completed", allDone:(n)=>`All done! ${n} says Thank you!`, noPatient:"No patient added yet", noExercises:"No exercises assigned yet.", all:"All", selectPatient:"Select patient...", noPatientSelected:"Please select a patient.", homeExercises:(n)=>`Home exercises (${n})`, noExercisesYet:"No exercises yet.", step:"Step by Step", description:"Description", watchVideo:"Watch video", markDone:"Done!", markUndone:"Reset", saving:"Saving...", assignBtn:"Assign Exercise", freq:"Duration (text)", freqPh:"e.g. daily in the morning", step1:"1. Patient", step2:"2. Select exercise", step3:"3. Duration", step4:"4. Frequency per week", noCategoryEx:"No exercises in this category.", cancel:"Cancel", delete:"Delete", remove:"Remove", filterCategory:"Category", filterRegion:"Target Region", langLabel:"Language", tipsTitle:"Tips & Knowledge", tipsSub:"Important notes for training", tabTips:"Training Tips", tabPause:"Rest & Recovery", pauseHero:"Rest is Training!", pauseHeroText:"Rest is the period where actual performance improvement happens. Without sufficient rest, overtraining replaces progress." },
  es: { appSub:"Fisioterapia & Osteopatía Animal", navOwner:"Home", navTherapist:"Clínica", navInfo:"Info", progress:"Progreso de hoy", exercisesDone:"ejercicios completados", allDone:(n)=>`¡Todo listo! ${n} dice ¡Gracias!`, noPatient:"Aún no hay paciente", noExercises:"Aún no hay ejercicios.", all:"Todos", selectPatient:"Seleccionar paciente...", noPatientSelected:"Por favor selecciona un paciente.", homeExercises:(n)=>`Ejercicios en casa (${n})`, noExercisesYet:"Aún no hay ejercicios.", step:"Paso a Paso", description:"Descripción", watchVideo:"Ver video", markDone:"¡Hecho!", markUndone:"Resetear", saving:"Guardando...", assignBtn:"Asignar ejercicio", freq:"Duración (texto)", freqPh:"ej. diario por la mañana", step1:"1. Paciente", step2:"2. Seleccionar ejercicio", step3:"3. Duración", step4:"4. Frecuencia por semana", noCategoryEx:"No hay ejercicios en esta categoría.", cancel:"Cancelar", delete:"Eliminar", remove:"Quitar", filterCategory:"Categoría", filterRegion:"Región", langLabel:"Idioma", tipsTitle:"Consejos", tipsSub:"Notas importantes", tabTips:"Consejos", tabPause:"Descanso", pauseHero:"¡El descanso es entrenamiento!", pauseHeroText:"El descanso es el periodo donde ocurre la mejora real del rendimiento." }
};

const TIPS = {
  de:[{icon:"tip",title:"Qualität vor Tempo",text:"Langsame Bewegungen sind viel anstrengender und effektiver für den Muskelaufbau als schnelles Hin- und Herspringen."},{icon:"close",title:"Abbruch-Signal",text:"Sofort aufhören, wenn der Hund anfängt zu zittern, stark zu hecheln oder die Übung schlampig ausführt. Das sind Zeichen für Muskelermüdung."},{icon:"target",title:"Belohnung",text:"Das Futter sollte punktgenau gegeben werden, wenn der Hund die gewünschte Position erreicht hat – nicht nur als Lockmittel."}],
  en:[{icon:"tip",title:"Quality over Speed",text:"Slow movements are much more demanding and effective for muscle building."},{icon:"close",title:"Stop Signal",text:"Stop immediately if the dog starts trembling, panting heavily, or performing the exercise sloppily."},{icon:"target",title:"Reward",text:"Treats should be given precisely when the dog reaches the desired position."}],
  es:[{icon:"tip",title:"Calidad sobre Velocidad",text:"Los movimientos lentos son más exigentes y efectivos para el desarrollo muscular."},{icon:"close",title:"Señal de Parada",text:"Detener inmediatamente si el perro tiembla o realiza el ejercicio descuidadamente."},{icon:"target",title:"Recompensa",text:"El alimento debe darse con precisión cuando el perro alcanza la posición deseada."}]
};

const PAUSE = {
  de:[{icon:"rest",title:"Warum Pausen so wichtig sind",text:"Pausen sind aktiver Teil des Muskelaufbaus. Das Prinzip der Superkompensation besagt: der Körper hebt nach einer Belastung das Leistungsniveau über das ursprüngliche Maß hinaus – aber nur bei ausreichender Pause."},{icon:"clock",title:"Pausendauer",items:["Kleine Muskelgruppen: ca. 24 Stunden Regeneration","Große Muskelgruppen / intensive Kraftübungen: 48–96 Stunden","Niemals dieselbe Muskelgruppe an zwei aufeinanderfolgenden Tagen trainieren"]},{icon:"info",title:"Anzeichen für Übermüdung",items:["Zittern der Muskulatur","Hecheln oder Schmatzen (Stressanzeichen)","Unkonzentriertheit oder langsamer werdende Reaktionen","Unsaubere Ausführung – z.B. Pfoten schleifen, Ausweichbewegungen"]},{icon:"rest",title:"Pausen zwischen den Sätzen",text:"Kurze Zwischenpausen helfen die Konzentrationsfähigkeit hochzuhalten."},{icon:"assign",title:"Trainingsrhythmus",items:["Tag 1: Training","Tag 2: Pause (lockere Bewegung / Gassi)","Tag 3: Training","Bei intensivem Aufbau: 2 Pausentage zwischen den Einheiten"]}],
  en:[{icon:"rest",title:"Why Rest Matters",text:"Rest is an active part of muscle building. After exertion, the body raises performance above its original level – but only with sufficient rest."},{icon:"clock",title:"Rest Duration",items:["Small muscle groups: approx. 24 hours recovery","Large muscle groups: 48–96 hours","Never train the same muscle group on two consecutive days"]},{icon:"info",title:"Signs of Fatigue",items:["Muscle trembling","Panting or lip smacking","Loss of focus","Sloppy execution"]},{icon:"rest",title:"Rest Between Sets",text:"Short breaks between sets help maintain concentration."},{icon:"assign",title:"Training Rhythm",items:["Day 1: Training","Day 2: Rest","Day 3: Training"]}],
  es:[{icon:"rest",title:"Por qué el Descanso es Importante",text:"El descanso es parte activa del desarrollo muscular."},{icon:"clock",title:"Duración del Descanso",items:["Grupos pequeños: 24 horas","Grupos grandes: 48–96 horas","Nunca entrenar el mismo grupo dos días consecutivos"]},{icon:"info",title:"Señales de Fatiga",items:["Temblor muscular","Jadeo o chasquido","Pérdida de concentración","Ejecución descuidada"]},{icon:"rest",title:"Descanso Entre Series",text:"Pausas cortas ayudan a mantener la concentración."},{icon:"assign",title:"Ritmo de Entrenamiento",items:["Día 1: Entrenamiento","Día 2: Descanso","Día 3: Entrenamiento"]}]
};

const FilterDropdown = ({ label, icon, options, selected, onChange, color = BRAND }) => {
  const [open, setOpen] = useState(false);
  const count = selected.length;
  return (
    <div style={{ position:"relative", flex:1 }} onClick={e=>e.stopPropagation()}>
      <button onClick={()=>setOpen(o=>!o)} style={{ width:"100%", padding:"9px 12px", borderRadius:10, border:`1.5px solid ${count>0?color:"#B8DFE0"}`, background:count>0?color+"15":"white", display:"flex", alignItems:"center", gap:6, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:600, color:count>0?color:"#3D7070" }}>
        <Icon name={icon} size={13} color={count>0?color:"#3D7070"}/><span style={{flex:1,textAlign:"left"}}>{count>0?`${label} (${count})`:label}</span>
        <div style={{ width:22,height:22,borderRadius:6,background:count>0?color+"30":LIGHT,display:"flex",alignItems:"center",justifyContent:"center" }}><Icon name="chevdown" size={12} color={count>0?color:"#3D7070"}/></div>
      </button>
      {open&&(<div style={{ position:"absolute", top:"calc(100% + 4px)", left:0, right:0, background:"white", borderRadius:12, boxShadow:"0 8px 24px rgba(0,0,0,0.12)", zIndex:30, overflow:"hidden", border:`1px solid ${LIGHT}` }}>
        {selected.length>0&&<button onClick={()=>{onChange([]);setOpen(false);}} style={{ width:"100%", padding:"9px 14px", textAlign:"left", fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:600, color:"#C0392B", background:"#FFF5F5", cursor:"pointer", border:"none", borderBottom:`1px solid ${LIGHT}` }}>Auswahl aufheben</button>}
        {options.map(opt=>{const active=selected.includes(opt);return(<button key={opt} onClick={()=>onChange(active?selected.filter(s=>s!==opt):[...selected,opt])} style={{ width:"100%", padding:"10px 14px", textAlign:"left", fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:active?600:400, color:active?color:"#102828", background:active?color+"10":"white", cursor:"pointer", border:"none", borderBottom:`1px solid ${LIGHT}`, display:"flex", alignItems:"center", gap:8 }}><div style={{ width:16,height:16,borderRadius:4,border:`2px solid ${active?color:"#B8DFE0"}`,background:active?color:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>{active&&<Icon name="check" size={10} color="white"/>}</div>{opt}</button>);})}
      </div>)}
    </div>
  );
};

const MultiSelect = ({ options, selected, onChange, color = BRAND }) => (
  <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
    {options.map(opt=>{const active=selected.includes(opt);return <button key={opt} onClick={()=>onChange(active?selected.filter(s=>s!==opt):[...selected,opt])} style={{ padding:"6px 12px", borderRadius:99, fontSize:12, fontWeight:600, fontFamily:"'DM Sans',sans-serif", cursor:"pointer", border:`2px solid ${active?color:"#B8DFE0"}`, background:active?color:"white", color:active?"#102828":"#3D7070" }}>{opt}</button>;})}
  </div>
);

const InfoCard = ({ icon, title, text, items }) => (
  <div style={{ background:"white", borderRadius:16, boxShadow:"0 2px 16px rgba(95,184,185,0.12)", padding:"18px 20px", textAlign:"left" }}>
    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
      <div style={{ width:34,height:34,borderRadius:9,background:BRAND+"18",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}><Icon name={icon} size={18} color={BRAND}/></div>
      <div style={{ fontFamily:"'Playfair Display',serif", fontSize:15, fontWeight:700, color:"#102828" }}>{title}</div>
    </div>
    {text&&<div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:"#3D6060", lineHeight:1.65 }}>{text}</div>}
    {items&&<div style={{ display:"flex", flexDirection:"column", gap:7 }}>{items.map((item,j)=><div key={j} style={{ display:"flex", gap:9, alignItems:"flex-start" }}><div style={{ width:8,height:8,borderRadius:"50%",background:BRAND,flexShrink:0,marginTop:4 }}/><span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:"#3D6060", lineHeight:1.55, flex:1 }}>{item}</span></div>)}</div>}
  </div>
);

const LoginScreen = () => {
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const inp={width:"100%",padding:"13px 14px",borderRadius:10,border:"1.5px solid #B8DFE0",fontSize:16,fontFamily:"'DM Sans',sans-serif",outline:"none",color:"#102828",background:"white",WebkitTextFillColor:"#102828",boxSizing:"border-box"};
  const handleLogin=async()=>{
    if(!email||!password){setError("Bitte Email und Passwort eingeben.");return;}
    setLoading(true);setError("");
    const{error:err}=await supabase.auth.signInWithPassword({email,password});
    if(err)setError("Login fehlgeschlagen. Bitte Email und Passwort prüfen.");
    else if(email===THERAPIST_EMAIL)sessionStorage.setItem("_tfpw",password);
    setLoading(false);
  };
  return(
    <div style={{minHeight:"100vh",background:`linear-gradient(160deg,${DARK} 0%,#2A7A7B 60%,${BRAND} 100%)`,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
      <div style={{width:"100%",maxWidth:360}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <img src={LOGO_URL} alt="Fit Fun Dog" style={{height:65,objectFit:"contain",marginBottom:10}}/>
          <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:ACCENT,letterSpacing:"1.5px",textTransform:"uppercase"}}>Tierphysiotherapie & Osteopathie</div>
        </div>
        <div style={{background:"white",borderRadius:22,padding:"28px 24px",boxShadow:"0 20px 60px rgba(0,0,0,0.2)"}}>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,color:DARK,marginBottom:4}}>Willkommen zurück</div>
          <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"#3D7070",marginBottom:22}}>Bitte melde dich an um fortzufahren.</div>
          <div style={{marginBottom:14}}><div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:700,color:"#3D7070",letterSpacing:".7px",textTransform:"uppercase",marginBottom:7}}>Email</div><input type="email" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogin()} placeholder="deine@email.de" style={inp}/></div>
          <div style={{marginBottom:20}}><div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:700,color:"#3D7070",letterSpacing:".7px",textTransform:"uppercase",marginBottom:7}}>Passwort</div><input type="password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogin()} placeholder="••••••••" style={inp}/></div>
          {error&&<div style={{background:"#FFE8E8",borderRadius:10,padding:"10px 14px",marginBottom:16,fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"#C0392B"}}>{error}</div>}
          <button onClick={handleLogin} disabled={loading} style={{width:"100%",padding:"14px",borderRadius:12,background:loading?"#B8DFE0":BRAND,color:"#102828",fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:15,border:"none",cursor:"pointer"}}>{loading?"Wird angemeldet...":"Anmelden"}</button>
        </div>
        <div style={{textAlign:"center",marginTop:16,fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"rgba(255,255,255,0.5)"}}>Kein Konto? Bitte wende dich an deine Therapeutin.</div>
      </div>
    </div>
  );
};

export default function App() {
  const [lang,setLang]=useState("de");
  const t=T[lang];
  const [session,setSession]=useState(null);
  const [authLoading,setAuthLoading]=useState(true);
  const isAdmin=session?.user?.id===ADMIN_ID;

  const [view,setView]=useState("owner");
  const [practiceTab,setPracticeTab]=useState("patients");
  const [infoTab,setInfoTab]=useState("tips");
  const [patients,setPatients]=useState([]);
  const [ownerPatient,setOwnerPatient]=useState(null);
  const [exercises,setExercises]=useState([]);
  const [templates,setTemplates]=useState([]);
  const [doneLogs,setDoneLogs]=useState([]);
  const [historyLogs,setHistoryLogs]=useState([]);
  const [feedbacks,setFeedbacks]=useState([]);
  const [feedbackSheet,setFeedbackSheet]=useState(null);
  const [feedbackPain,setFeedbackPain]=useState(0);
  const [feedbackComment,setFeedbackComment]=useState("");
  const [viewFeedbackEx,setViewFeedbackEx]=useState(null);
  const [pushEnabled,setPushEnabled]=useState(false);
  const [pushTime,setPushTime]=useState("09:00");
  const [pushLoading,setPushLoading]=useState(false);

  const today=new Date().toISOString().split("T")[0];
  // Week boundaries (Monday–Sunday)
  const getWeekStart=()=>{const d=new Date();const day=d.getDay();const diff=day===0?-6:1-day;d.setDate(d.getDate()+diff);return d.toISOString().split("T")[0];};
  const weekStart=getWeekStart();
  const [userEmails,setUserEmails]=useState([]);
  const [loading,setLoading]=useState(true);
  const [selectedExercise,setSelectedExercise]=useState(null);
  const [selectedPatient,setSelectedPatient]=useState(null);
  const [saving,setSaving]=useState(false);
  const [deleting,setDeleting]=useState(null);
  const [sheet,setSheet]=useState(null);
  const [sheetData,setSheetData]=useState(null);
  const [selectedTemplate,setSelectedTemplate]=useState(null);
  const [duration,setDuration]=useState("");
  const [repeatCount,setRepeatCount]=useState(1);
  const [newPatient,setNewPatient]=useState(EMPTY_PATIENT);
  const [editPatientData,setEditPatientData]=useState(null);
  const [newTemplate,setNewTemplate]=useState(EMPTY_TEMPLATE);
  const [editTemplateData,setEditTemplateData]=useState(null);
  const [langOpen,setLangOpen]=useState(false);
  const [filterCats,setFilterCats]=useState([]);
  const [filterRegions,setFilterRegions]=useState([]);
  const [assignFilterCats,setAssignFilterCats]=useState([]);
  const [assignFilterRegions,setAssignFilterRegions]=useState([]);
  const [newAccountMode,setNewAccountMode]=useState("new");
  const [selectedExistingUserId,setSelectedExistingUserId]=useState("");
  const [resetEmailSent,setResetEmailSent]=useState(false);
  const [patientSearch,setPatientSearch]=useState("");
  const [assignPatientSearch,setAssignPatientSearch]=useState("");
  const [userSearch,setUserSearch]=useState("");
  const [mustChangePassword,setMustChangePassword]=useState(false);
  const [showPasswordChange,setShowPasswordChange]=useState(false);
  const [newPassword,setNewPassword]=useState("");

  // ── Handle Android back button – close sheet/exercise instead of app ──
  useEffect(()=>{
    const handleBack=(e)=>{
      if(selectedExercise){e.preventDefault();setSelectedExercise(null);return;}
      if(sheet){e.preventDefault();closeSheet();return;}
    };
    window.addEventListener("popstate",handleBack);
    // Push a state so back button has something to pop
    if(selectedExercise||sheet) window.history.pushState({modal:true},"");
    return()=>window.removeEventListener("popstate",handleBack);
  },[selectedExercise,sheet]);

  // ── Auth: load data with userId directly from session ──
  useEffect(()=>{
    supabase.auth.getSession().then(({data:{session:s}})=>{
      setSession(s);
      setAuthLoading(false);
      if(s) loadAll(s.user.id);
    });
    const{data:{subscription}}=supabase.auth.onAuthStateChange((event,s)=>{
      if(event==="SIGNED_OUT"){
        // Clear all state on logout
        setSession(null);
        setPatients([]);setExercises([]);setDoneLogs([]);setHistoryLogs([]);setFeedbacks([]);setTemplates([]);
        setOwnerPatient(null);setSelectedPatient(null);
        setLoading(true);
      } else if(event==="SIGNED_IN"&&s){
        setSession(s);
        loadAll(s.user.id);
        checkPushStatus();
      }
    });
    return()=>subscription.unsubscribe();
  },[]);

  async function loadAll(userId) {
    setLoading(true);
    const uid=userId;
    try{
      const [{data:pd},{data:ed},{data:ld},{data:td},{data:ue},{data:hl},{data:fb}]=await Promise.all([
        supabase.from("patients").select("*").order("name"),
        supabase.from("exercises").select("*").order("created_at"),
        supabase.from("exercise_logs").select("*").gte("done_date",weekStart).lte("done_date",today),
        supabase.from("exercise_templates").select("*").order("title"),
        supabase.from("user_emails").select("id,email"),
        supabase.from("exercise_logs").select("exercise_id,done_date").eq("done",true).gte("done_date",(()=>{const d=new Date();d.setDate(d.getDate()-27);return d.toISOString().split("T")[0];})()),
        supabase.from("exercise_feedback").select("*").order("created_at",{ascending:false})
      ]);
      const pl=pd||[];
      setPatients(pl);
      setExercises(ed||[]);
      setDoneLogs(ld||[]);
      setHistoryLogs(hl||[]);
      setFeedbacks(fb||[]);
      setTemplates(td||[]);
      setUserEmails(ue||[]);

      // Find owner's patient by userId
      let ownerPat=null;
      if(uid&&uid!==ADMIN_ID){
        ownerPat=pl.find(p=>p.user_id===uid)||pl[0]||null;
      } else {
        ownerPat=pl[0]||null;
      }
      setOwnerPatient(ownerPat);
      setSelectedPatient(prev=>prev?pl.find(p=>p.id===prev.id)||null:null);

      if(uid&&uid!==ADMIN_ID){
        const{data:{user}}=await supabase.auth.getUser();
        if(user?.user_metadata?.must_change_password)setMustChangePassword(true);
      }
    }catch(e){console.error("loadAll error",e);}
    setLoading(false);
  }

  const handleLogout=async()=>{
    sessionStorage.removeItem("_tfpw");
    await supabase.auth.signOut();
  };

  const closeSheet=()=>{
    setSheet(null);setSheetData(null);setSelectedTemplate(null);
    setAssignFilterCats([]);setAssignFilterRegions([]);
    setDuration("");setRepeatCount(1);
    setEditTemplateData(null);setEditPatientData(null);
    setNewAccountMode("new");setSelectedExistingUserId("");
    setResetEmailSent(false);setUserSearch("");
    setNewPassword("");setShowPasswordChange(false);
  };

  const exForPatient=(pid)=>exercises.filter(e=>e.patient_id===pid);

  // ── Weekly repeat logic ──
  const getDoneCountThisWeek=(eid)=>doneLogs.filter(l=>l.exercise_id===eid).length;
  const isFullyDone=(ex)=>getDoneCountThisWeek(ex.id)>=(ex.repeat_count||1);

  const toggleRepeat=async(eid,repeatCount)=>{
    const currentCount=getDoneCountThisWeek(eid);
    const maxCount=repeatCount||1;
    if(currentCount<maxCount){
      // Add one log for today
      const{data}=await supabase.from("exercise_logs").insert({exercise_id:eid,done_date:today,done:true}).select().single();
      if(data)setDoneLogs(prev=>[...prev,data]);
    } else {
      // Remove all logs for this week (reset)
      await supabase.from("exercise_logs").delete().eq("exercise_id",eid).gte("done_date",weekStart).lte("done_date",today);
      setDoneLogs(prev=>prev.filter(l=>l.exercise_id!==eid));
    }
  };

  const changePassword=async()=>{
    if(!newPassword||newPassword.length<6){alert("Passwort muss mindestens 6 Zeichen haben.");return;}
    setSaving(true);
    const{error}=await supabase.auth.updateUser({password:newPassword,data:{must_change_password:false}});
    if(error)alert("Fehler: "+error.message);
    else{setMustChangePassword(false);setShowPasswordChange(false);setNewPassword("");}
    setSaving(false);
  };

  // ── Push notifications ──
  function urlBase64ToUint8Array(base64String){
    const padding="=".repeat((4-base64String.length%4)%4);
    const base64=(base64String+padding).replace(/-/g,"+").replace(/_/g,"/");
    const raw=atob(base64);
    return Uint8Array.from([...raw].map(c=>c.charCodeAt(0)));
  }

  const checkPushStatus=async()=>{
    if(!("serviceWorker" in navigator)||!("PushManager" in window))return;
    const reg=await navigator.serviceWorker.ready;
    const sub=await reg.pushManager.getSubscription();
    if(sub){
      setPushEnabled(true);
      // Load saved time
      const{data}=await supabase.from("push_subscriptions").select("reminder_time").eq("endpoint",sub.endpoint).maybeSingle();
      if(data?.reminder_time)setPushTime(data.reminder_time.substring(0,5));
    }
  };

  const enablePush=async()=>{
    if(!("serviceWorker" in navigator)||!("PushManager" in window)){alert("Dein Browser unterstützt keine Push-Benachrichtigungen.");return;}
    setPushLoading(true);
    try{
      const permission=await Notification.requestPermission();
      if(permission!=="granted"){setPushLoading(false);return;}
      const reg=await navigator.serviceWorker.ready;
      const sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:urlBase64ToUint8Array(VAPID_PUBLIC_KEY)});
      const{endpoint,keys}=sub.toJSON();
      await supabase.from("push_subscriptions").upsert({
        user_id:session.user.id,endpoint,p256dh:keys.p256dh,auth:keys.auth,
        reminder_time:pushTime,timezone:Intl.DateTimeFormat().resolvedOptions().timeZone
      },{onConflict:"user_id,endpoint"});
      setPushEnabled(true);
    }catch(e){console.error(e);}
    setPushLoading(false);
  };

  const disablePush=async()=>{
    setPushLoading(true);
    const reg=await navigator.serviceWorker.ready;
    const sub=await reg.pushManager.getSubscription();
    if(sub){
      await supabase.from("push_subscriptions").delete().eq("endpoint",sub.endpoint);
      await sub.unsubscribe();
    }
    setPushEnabled(false);
    setPushLoading(false);
  };

  const updatePushTime=async(time)=>{
    setPushTime(time);
    if(!pushEnabled)return;
    const reg=await navigator.serviceWorker.ready;
    const sub=await reg.pushManager.getSubscription();
    if(sub)await supabase.from("push_subscriptions").update({reminder_time:time}).eq("endpoint",sub.endpoint);
  };

  const addPatient=async()=>{
    if(!newPatient.name)return;
    setSaving(true);
    let userId=null;
    if(newAccountMode==="existing"){
      userId=selectedExistingUserId||null;
    }else if(newAccountMode==="new"&&newPatient.ownerEmail&&newPatient.ownerPassword){
      const{data:sd,error:se}=await supabase.auth.signUp({
        email:newPatient.ownerEmail,password:newPatient.ownerPassword,
        options:{data:{must_change_password:newPatient.ownerPassword===newPatient.ownerEmail}}
      });
      if(se){alert("Account-Fehler: "+se.message);setSaving(false);return;}
      userId=sd?.user?.id||null;
      const storedPw=sessionStorage.getItem("_tfpw");
      if(storedPw)await supabase.auth.signInWithPassword({email:THERAPIST_EMAIL,password:storedPw});
    }
    const{data,error}=await supabase.from("patients").insert({
      name:newPatient.name,breed:newPatient.breed,age:newPatient.age,
      owner:newPatient.owner,condition:newPatient.condition,avatar:newPatient.avatar,user_id:userId
    }).select().single();
    if(error){alert("Fehler: "+error.message);setSaving(false);return;}
    await loadAll(ADMIN_ID);
    setSaving(false);setNewPatient(EMPTY_PATIENT);closeSheet();
  };

  const updatePatient=async()=>{
    if(!editPatientData?.name)return;
    setSaving(true);
    const{id,_newUserId,ownerEmail,ownerPassword,...fields}=editPatientData;
    if(_newUserId!==undefined)fields.user_id=_newUserId||null;
    const{data,error}=await supabase.from("patients").update(fields).eq("id",id).select().single();
    if(error){alert("Fehler: "+error.message);setSaving(false);return;}
    if(data){
      setPatients(prev=>prev.map(p=>p.id===data.id?data:p).sort((a,b)=>a.name.localeCompare(b.name)));
      if(ownerPatient?.id===data.id)setOwnerPatient(data);
      if(selectedPatient?.id===data.id)setSelectedPatient(data);
    }
    setSaving(false);closeSheet();
  };

  const sendPasswordReset=async(email)=>{
    if(!email)return;
    await supabase.auth.resetPasswordForEmail(email);
    setResetEmailSent(true);
  };

  const deletePatient=async(pid)=>{
    setDeleting(pid);
    for(const ex of exForPatient(pid))await supabase.from("exercise_logs").delete().eq("exercise_id",ex.id);
    await supabase.from("exercises").delete().eq("patient_id",pid);
    await supabase.from("patients").delete().eq("id",pid);
    setExercises(prev=>prev.filter(e=>e.patient_id!==pid));
    setPatients(prev=>prev.filter(p=>p.id!==pid));
    if(selectedPatient?.id===pid)setSelectedPatient(null);
    if(ownerPatient?.id===pid)setOwnerPatient(null);
    setDeleting(null);closeSheet();
  };

  const addExercise=async()=>{
    if(!selectedTemplate||!selectedPatient||!duration)return;
    setSaving(true);
    const{data,error}=await supabase.from("exercises").insert({
      patient_id:selectedPatient.id,title:selectedTemplate.title,
      categories:selectedTemplate.categories||[],target_regions:selectedTemplate.target_regions||[],
      difficulty:selectedTemplate.difficulty,description:selectedTemplate.description,
      instructions:selectedTemplate.instructions,image_url:selectedTemplate.image_url||null,
      video_url:selectedTemplate.video_url||null,duration,repeat_count:repeatCount
    }).select().single();
    if(!error&&data)setExercises(prev=>[...prev,data]);
    setSaving(false);closeSheet();
  };

  const deleteExercise=async(eid)=>{
    setDeleting(eid);
    await supabase.from("exercise_logs").delete().eq("exercise_id",eid);
    await supabase.from("exercises").delete().eq("id",eid);
    setExercises(prev=>prev.filter(e=>e.id!==eid));
    setDoneLogs(prev=>prev.filter(l=>l.exercise_id!==eid));
    setDeleting(null);closeSheet();setSelectedExercise(null);
  };

  const addTemplate=async()=>{
    if(!newTemplate.title)return;
    setSaving(true);
    const{data,error}=await supabase.from("exercise_templates").insert({...newTemplate,instructions:newTemplate.instructions.filter(Boolean)}).select().single();
    if(!error&&data)setTemplates(prev=>[...prev,data]);
    setSaving(false);setNewTemplate(EMPTY_TEMPLATE);closeSheet();
  };

  const updateTemplate=async()=>{
    if(!editTemplateData?.title)return;
    setSaving(true);
    const{data,error}=await supabase.from("exercise_templates").update({
      title:editTemplateData.title,categories:editTemplateData.categories||[],
      target_regions:editTemplateData.target_regions||[],difficulty:editTemplateData.difficulty,
      description:editTemplateData.description,instructions:(editTemplateData.instructions||[]).filter(Boolean),
      image_url:editTemplateData.image_url||null,video_url:editTemplateData.video_url||null
    }).eq("id",editTemplateData.id).select().single();
    if(!error&&data)setTemplates(prev=>prev.map(t=>t.id===data.id?data:t));
    setSaving(false);closeSheet();
  };

  const deleteTemplate=async(tid)=>{
    setDeleting(tid);
    await supabase.from("exercise_templates").delete().eq("id",tid);
    setTemplates(prev=>prev.filter(t=>t.id!==tid));
    setDeleting(null);closeSheet();
  };

  const saveFeedback=async()=>{
    if(!feedbackSheet||feedbackPain===0)return;
    setSaving(true);
    const existing=getLatestFeedback(feedbackSheet.id);
    let data,error;
    if(existing){
      ({data,error}=await supabase.from("exercise_feedback").update({
        pain_level:feedbackPain,comment:feedbackComment.trim()||null
      }).eq("id",existing.id).select().single());
      if(!error&&data)setFeedbacks(prev=>prev.map(f=>f.id===data.id?data:f));
    } else {
      ({data,error}=await supabase.from("exercise_feedback").insert({
        exercise_id:feedbackSheet.id,patient_id:feedbackSheet.patient_id,
        pain_level:feedbackPain,comment:feedbackComment.trim()||null
      }).select().single());
      if(!error&&data)setFeedbacks(prev=>[data,...prev]);
    }
    setSaving(false);
    setFeedbackSheet(null);setFeedbackPain(0);setFeedbackComment("");
  };

  const getLatestFeedback=(eid)=>feedbacks.find(f=>f.exercise_id===eid)||null;

  const PAIN_LABELS=["","Kein Schmerz","Leicht","Mittel","Stark","Sehr stark"];
  const PAIN_COLORS=["","#2E7D32","#8BC34A","#FF9800","#F44336","#B71C1C"];
  const ownerExs=ownerPatient?exForPatient(ownerPatient.id):[];
  const doneCount=ownerExs.filter(e=>isFullyDone(e)).length;
  const totalCount=ownerExs.length;
  const progress=totalCount>0?(doneCount/totalCount)*100:0;
  const allDone=totalCount>0&&doneCount===totalCount;

  // ── Streak & calendar logic ──
  const ownerExIds=ownerExs.map(e=>e.id);
  const activeDates=new Set(
    historyLogs.filter(l=>ownerExIds.includes(l.exercise_id)).map(l=>l.done_date)
  );
  if(doneCount>0)activeDates.add(today);
  const calcStreak=()=>{
    let streak=0;
    const d=new Date();
    for(let i=0;i<28;i++){
      const dateStr=d.toISOString().split("T")[0];
      if(activeDates.has(dateStr)){streak++;}
      else if(i===0&&doneCount===0){break;}
      else if(i>0){break;}
      d.setDate(d.getDate()-1);
    }
    return streak;
  };
  const streak=calcStreak();
  const calendarDays=Array.from({length:28},(_,i)=>{
    const d=new Date();
    d.setDate(d.getDate()-(27-i));
    const dateStr=d.toISOString().split("T")[0];
    return{dateStr,isToday:dateStr===today,done:activeDates.has(dateStr)};
  });

  const filteredOwnerExs=ownerExs.filter(ex=>{
    const cOk=filterCats.length===0||(ex.categories||[]).some(c=>filterCats.includes(c));
    const rOk=filterRegions.length===0||(ex.target_regions||[]).some(r=>filterRegions.includes(r));
    return cOk&&rOk;
  });
  const filteredTemplates=templates.filter(t2=>{
    const cOk=assignFilterCats.length===0||(t2.categories||[]).some(c=>assignFilterCats.includes(c));
    const rOk=assignFilterRegions.length===0||(t2.target_regions||[]).some(r=>assignFilterRegions.includes(r));
    return cOk&&rOk;
  });
  const filteredPatients=patients.filter(p=>
    p.name.toLowerCase().includes(patientSearch.toLowerCase())||
    p.owner.toLowerCase().includes(patientSearch.toLowerCase())||
    (p.breed||"").toLowerCase().includes(patientSearch.toLowerCase())
  );
  const filteredAssignPatients=patients.filter(p=>
    p.name.toLowerCase().includes(assignPatientSearch.toLowerCase())||
    p.owner.toLowerCase().includes(assignPatientSearch.toLowerCase())
  );
  const filteredUsers=userEmails.filter(u=>
    u.id!==ADMIN_ID&&u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  const patLabel=(p)=>`${p.avatar||""} ${p.name} - ${p.breed} - ${p.owner}`.trim();
  const getUserEmail=(uid)=>userEmails.find(u=>u.id===uid)?.email||null;

  const inp={width:"100%",padding:"11px 14px",borderRadius:10,border:"1.5px solid #B8DFE0",fontSize:16,fontFamily:"'DM Sans',sans-serif",outline:"none",background:"white",color:"#102828",WebkitTextFillColor:"#102828",boxSizing:"border-box"};
  const SL=({text})=><div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:700,color:"#3D7070",letterSpacing:".7px",textTransform:"uppercase",marginBottom:7}}>{text}</div>;
  const SheetHeader=({title,onClose})=>(<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}><div style={{fontFamily:"'Playfair Display',serif",fontSize:19,fontWeight:700,color:"#102828"}}>{title}</div><button onClick={onClose} style={{background:LIGHT,borderRadius:"50%",width:32,height:32,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Icon name="close" size={14} color="#3D7070"/></button></div>);

  if(authLoading)return <div style={{minHeight:"100vh",background:`linear-gradient(160deg,${DARK},${BRAND})`,display:"flex",alignItems:"center",justifyContent:"center"}}><img src={LOGO_URL} alt="" style={{height:60,objectFit:"contain"}}/></div>;
  if(!session)return <LoginScreen/>;
  if(loading)return <div style={{minHeight:"100vh",background:LIGHT,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12}}><Icon name="paw" size={48} color={BRAND}/><div style={{fontFamily:"'DM Sans',sans-serif",color:"#3D7070"}}>Wird geladen...</div></div>;

  return (
    <div style={{fontFamily:"Georgia,serif",minHeight:"100vh",background:LIGHT,color:"#102828"}} onClick={()=>setLangOpen(false)}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@300;400;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        body{-webkit-text-size-adjust:100%;}
        .btn{cursor:pointer;border:none;transition:all .18s;background:none;}
        .btn:hover{opacity:.85;}
        .card{background:white;border-radius:16px;box-shadow:0 2px 16px rgba(95,184,185,0.10);text-align:left;}
        .ex-card{transition:all .18s;cursor:pointer;}
        .ex-card:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(95,184,185,0.18);}
        .tag{display:inline-block;padding:3px 9px;border-radius:20px;font-size:11px;font-weight:600;font-family:'DM Sans',sans-serif;}
        input,textarea,select{font-family:'DM Sans',sans-serif;outline:none;-webkit-text-fill-color:#102828;color:#102828;font-size:16px;}
        input:focus,textarea:focus,select:focus{border-color:${BRAND}!important;box-shadow:0 0 0 3px rgba(95,184,185,0.15);}
        .overlay{position:fixed;inset:0;background:rgba(16,40,40,0.55);z-index:100;display:flex;align-items:flex-end;justify-content:center;}
        .sheet{background:white;border-radius:24px 24px 0 0;width:100%;max-width:480px;max-height:90vh;overflow-y:auto;padding:24px 20px 40px;}
        .pbar{height:8px;background:rgba(255,255,255,0.2);border-radius:99px;overflow:hidden;}
        .pfill{height:100%;border-radius:99px;background:linear-gradient(90deg,#8FD4D5,#ffffff88);transition:width .6s ease;}
        .nav-tab{padding:9px 0;font-size:12px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;border:none;transition:all .18s;flex:1;display:flex;align-items:center;justify-content:center;gap:5px;}
        .tmpl-row{padding:10px 12px;border-radius:10px;cursor:pointer;border:2px solid transparent;display:flex;align-items:center;gap:10px;transition:all .15s;}
        .tmpl-row:hover{background:${LIGHT};}
        .tmpl-row.sel{border-color:${BRAND};background:${LIGHT};}
        .iBtn{width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;cursor:pointer;border:none;flex-shrink:0;transition:all .15s;}
        .iBtn:hover{opacity:.8;}
        .mode-btn{flex:1;padding:9px 6px;border-radius:9px;font-size:11px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;border:2px solid;transition:all .15s;display:flex;align-items:center;justify-content:center;gap:4px;}
        .repeat-box{width:32px;height:32px;border-radius:8px;border:2px solid;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .2s;flex-shrink:0;}
      `}</style>

      {/* HEADER */}
      <div style={{background:DARK,position:"sticky",top:0,zIndex:20}}>
        <div style={{maxWidth:480,margin:"0 auto"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 16px 10px"}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <img src={LOGO_URL} alt="Fit Fun Dog" style={{height:36,objectFit:"contain"}}/>
              <div>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:700,color:"#E6F6F6",lineHeight:1.1}}>Fit Fun Dog</div>
                <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:9,color:ACCENT,letterSpacing:"0.3px"}}>Tierphysiotherapie & Osteopathie</div>
              </div>
            </div>
            <div style={{display:"flex",gap:6,alignItems:"center"}}>
              <div style={{position:"relative"}} onClick={e=>e.stopPropagation()}>
                <button className="btn" onClick={()=>setLangOpen(o=>!o)} style={{display:"flex",alignItems:"center",gap:5,background:"#2A6364",borderRadius:9,padding:"7px 10px",color:ACCENT,fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:600}}>
                  <Icon name="lang" size={14} color={ACCENT}/>{t.langLabel}
                  <div style={{width:20,height:20,borderRadius:5,background:ACCENT+"30",display:"flex",alignItems:"center",justifyContent:"center"}}><Icon name="chevdown" size={11} color={ACCENT}/></div>
                </button>
                {langOpen&&<div style={{position:"absolute",right:0,top:"calc(100% + 6px)",background:"white",borderRadius:12,boxShadow:"0 8px 24px rgba(0,0,0,0.15)",overflow:"hidden",minWidth:130,zIndex:50}}>
                  {[["de","🇩🇪 Deutsch"],["en","🇬🇧 English"],["es","🇪🇸 Español"]].map(([l,label])=>(
                    <button key={l} className="btn" onClick={()=>{setLang(l);setLangOpen(false);}} style={{width:"100%",padding:"11px 16px",textAlign:"left",fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:l===lang?700:400,color:l===lang?BRAND:"#102828",background:l===lang?LIGHT:"white",display:"block"}}>{label}</button>
                  ))}
                </div>}
              </div>
              <button className="btn" onClick={handleLogout} style={{background:"#2A6364",borderRadius:9,padding:"7px 9px",display:"flex"}}>
                <Icon name="logout" size={15} color={ACCENT}/>
              </button>
            </div>
          </div>
          <div style={{display:"flex",background:"#2A6364"}}>
            {[["owner","home",t.navOwner],...(isAdmin?[["therapist","practice",t.navTherapist]]:[]),["info","info",t.navInfo]].map(([v,ic,lb])=>(
              <button key={v} className="nav-tab" onClick={()=>setView(v)} style={{background:view===v?"white":"transparent",color:view===v?DARK:ACCENT,borderRadius:view===v?"10px 10px 0 0":0,marginTop:view===v?3:0}}>
                <Icon name={ic} size={14} color={view===v?DARK:ACCENT}/>{lb}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* OWNER VIEW */}
      {view==="owner"&&(
        <div style={{maxWidth:480,margin:"0 auto",padding:"16px 14px 80px"}}>
          {mustChangePassword&&(
            <div style={{background:"#FFF8E1",border:"1.5px solid #FFB300",borderRadius:12,padding:"14px 16px",marginBottom:14}}>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,fontWeight:700,color:"#E65100",marginBottom:6,display:"flex",alignItems:"center",gap:8}}><Icon name="lock" size={16} color="#E65100"/>Bitte Passwort ändern</div>
              <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"#5D4037",marginBottom:10}}>Aus Sicherheitsgründen bitte ein eigenes Passwort vergeben.</div>
              {!showPasswordChange?(
                <button className="btn" onClick={()=>setShowPasswordChange(true)} style={{background:"#FFB300",color:"#102828",borderRadius:9,padding:"8px 14px",fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:700}}>Passwort jetzt ändern</button>
              ):(
                <div style={{display:"flex",gap:8}}>
                  <input type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} placeholder="Neues Passwort..." style={{...inp,flex:1}}/>
                  <button className="btn" onClick={changePassword} disabled={saving} style={{background:BRAND,color:"#102828",borderRadius:9,padding:"8px 14px",fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:700,flexShrink:0}}>{saving?"...":"Speichern"}</button>
                </div>
              )}
            </div>
          )}

          {/* Push notification banner */}
          {!isAdmin&&(
            <div style={{background:pushEnabled?"#E8F5E9":"#E6F6F6",border:`1.5px solid ${pushEnabled?"#81C784":"#B8DFE0"}`,borderRadius:12,padding:"12px 16px",marginBottom:14,display:"flex",alignItems:"center",gap:10}}>
              <div style={{flex:1}}>
                <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:700,color:pushEnabled?"#2E7D32":DARK,marginBottom:pushEnabled?6:0}}>
                  {pushEnabled?"🔔 Erinnerungen aktiv":"🔔 Erinnerungen aktivieren"}
                </div>
                {pushEnabled&&(
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"#3D7070"}}>Täglich um</span>
                    <input type="time" value={pushTime} onChange={e=>updatePushTime(e.target.value)}
                      style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:600,color:DARK,border:`1px solid #B8DFE0`,borderRadius:6,padding:"3px 6px",outline:"none"}}/>
                  </div>
                )}
              </div>
              <button className="btn" onClick={pushEnabled?disablePush:enablePush} disabled={pushLoading}
                style={{background:pushEnabled?"#FFE8E8":BRAND,color:pushEnabled?"#C0392B":"#102828",borderRadius:9,padding:"7px 12px",fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:700,flexShrink:0}}>
                {pushLoading?"...":(pushEnabled?"Deaktivieren":"Aktivieren")}
              </button>
            </div>
          )}

          {/* Owner name greeting */}
          {ownerPatient&&(
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:700,color:DARK,marginBottom:12}}>
              Hallo, {ownerPatient.owner}!
            </div>
          )}

          {patients.length>1&&(
            <div style={{marginBottom:12}}>
              <CustomSelect value={ownerPatient?.id||""} onChange={e=>{setOwnerPatient(patients.find(p=>p.id===e.target.value)||null);setFilterCats([]);setFilterRegions([]);}}>
                {patients.map(p=><option key={p.id} value={p.id}>{patLabel(p)}</option>)}
              </CustomSelect>
            </div>
          )}

          {!ownerPatient?(
            <div className="card" style={{padding:28,textAlign:"center",color:"#3D7070"}}>
              <div style={{display:"flex",justifyContent:"center",marginBottom:10}}><Icon name="paw" size={44} color={ACCENT}/></div>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:600}}>{t.noPatient}</div>
            </div>
          ):(<>
            <div style={{padding:"18px 20px",marginBottom:14,background:`linear-gradient(135deg,${DARK} 0%,${BRAND} 100%)`,color:"#E6F6F6",borderRadius:18,boxShadow:"0 4px 24px rgba(95,184,185,0.32)"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <div>
                  <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"#B8E8E8",letterSpacing:"1px",textTransform:"uppercase",marginBottom:3}}>{t.progress}</div>
                  <div style={{fontFamily:"'Playfair Display',serif",fontSize:36,fontWeight:700,lineHeight:1}}>{doneCount}/{totalCount}</div>
                  <div style={{fontSize:13,color:allDone?"white":"#B8E8E8",fontFamily:"'DM Sans',sans-serif",marginTop:5,fontWeight:allDone?700:400}}>
                    {allDone?`🎉 ${t.allDone(ownerPatient.name)}`:t.exercisesDone}
                  </div>
                  {streak>0&&(
                    <div style={{display:"inline-flex",alignItems:"center",gap:5,marginTop:8,background:"rgba(255,255,255,0.15)",borderRadius:20,padding:"4px 10px"}}>
                      <span style={{fontSize:13}}>🔥</span>
                      <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:700,color:"white"}}>{streak} {streak===1?"Tag":"Tage"} in Folge</span>
                    </div>
                  )}
                </div>
                <div style={{textAlign:"center"}}>
                  <div style={{fontSize:48,lineHeight:1}}>{ownerPatient.avatar||"🐕"}</div>
                  <div style={{fontSize:11,color:"#B8E8E8",marginTop:4,fontFamily:"'DM Sans',sans-serif"}}>{ownerPatient.name}</div>
                </div>
              </div>
              <div className="pbar" style={{marginTop:14}}><div className="pfill" style={{width:`${progress}%`}}/></div>
              <div style={{marginTop:14}}>
                <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:"#B8E8E8",letterSpacing:"0.8px",textTransform:"uppercase",marginBottom:6}}>Letzte 28 Tage</div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3}}>
                  {calendarDays.map(({dateStr,isToday,done})=>(
                    <div key={dateStr} style={{height:10,borderRadius:3,background:done?"rgba(255,255,255,0.85)":isToday?"rgba(255,255,255,0.25)":"rgba(255,255,255,0.1)",outline:isToday?"1.5px solid rgba(255,255,255,0.6)":"none",outlineOffset:1}}/>
                  ))}
                </div>
              </div>
            </div>

            <div style={{display:"flex",gap:8,marginBottom:12}}>
              <FilterDropdown label={t.filterCategory} icon="filter" options={CATEGORIES} selected={filterCats} onChange={setFilterCats} color={BRAND}/>
              <FilterDropdown label={t.filterRegion} icon="target" options={TARGET_REGIONS} selected={filterRegions} onChange={setFilterRegions} color={MID}/>
            </div>

            {filteredOwnerExs.length===0&&<div className="card" style={{padding:20,textAlign:"center",color:"#3D7070",fontFamily:"'DM Sans',sans-serif",fontSize:14}}>{t.noExercises}</div>}

            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {filteredOwnerExs.map(ex=>{
                const rc=ex.repeat_count||1;
                const doneNow=getDoneCountThisWeek(ex.id);
                const fullyDone=doneNow>=rc;
                return(
                  <div key={ex.id} className="card ex-card" onClick={()=>setSelectedExercise(ex)} style={{padding:"14px",opacity:fullyDone?0.65:1}}>
                    <div style={{display:"flex",gap:12,alignItems:"center"}}>
                      {ex.image_url?<img src={ex.image_url} alt={ex.title} style={{width:50,height:50,borderRadius:12,objectFit:"contain",flexShrink:0,background:LIGHT,padding:2}}/>
                        :<div style={{width:50,height:50,borderRadius:12,background:BRAND+"18",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Icon name="paw" size={22} color={BRAND}/></div>}
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,fontWeight:600,lineHeight:1.3,textDecoration:fullyDone?"line-through":"none",color:fullyDone?ACCENT:"#102828",marginBottom:5}}>{ex.title}</div>
                        <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:7}}>
                          {(ex.categories||[]).slice(0,2).map(c=><span key={c} className="tag" style={{background:BRAND+"20",color:BRAND}}>{c}</span>)}
                          <span className="tag" style={{background:(difficultyColor[ex.difficulty]||BRAND)+"20",color:difficultyColor[ex.difficulty]||BRAND}}>{ex.difficulty}</span>
                          <span className="tag" style={{background:LIGHT,color:"#3D7070"}}>⏱ {ex.duration}</span>
                        </div>
                        {/* Repeat checkboxes */}
                        <div style={{display:"flex",alignItems:"center",gap:6}} onClick={e=>e.stopPropagation()}>
                          <Icon name="repeat" size={13} color="#3D7070"/>
                          <div style={{display:"flex",gap:5}}>
                            {Array.from({length:rc}).map((_,i)=>{
                              const checked=i<doneNow;
                              return(
                                <button key={i} className="repeat-box" onClick={e=>{e.stopPropagation();toggleRepeat(ex.id,rc);}}
                                  style={{borderColor:checked?BRAND:"#B8DFE0",background:checked?BRAND:"white",width:28,height:28}}>
                                  {checked&&<Icon name="check" size={13} color="white"/>}
                                </button>
                              );
                            })}
                          </div>
                          <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"#3D7070"}}>{doneNow}/{rc}× diese Woche</span>
                        </div>
                        {/* Feedback button + latest feedback indicator */}
                        <div style={{display:"flex",alignItems:"center",gap:6,marginTop:7}} onClick={e=>e.stopPropagation()}>
                          <button className="btn" onClick={e=>{e.stopPropagation();const fb=getLatestFeedback(ex.id);setFeedbackSheet(ex);setFeedbackPain(fb?.pain_level||0);setFeedbackComment(fb?.comment||"");}}
                            style={{display:"flex",alignItems:"center",gap:4,background:LIGHT,borderRadius:8,padding:"4px 10px",fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:600,color:"#3D7070",border:`1px solid #B8DFE0`}}>
                            <Icon name="info" size={12} color="#3D7070"/> Befund melden
                          </button>
                          {(()=>{const fb=getLatestFeedback(ex.id);return fb?(<span style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:PAIN_COLORS[fb.pain_level],fontWeight:600}}>● {PAIN_LABELS[fb.pain_level]}</span>):null;})()}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>)}
        </div>
      )}

      {/* THERAPIST VIEW */}
      {view==="therapist"&&isAdmin&&(
        <div style={{maxWidth:480,margin:"0 auto",padding:"0 0 80px"}}>
          <div style={{display:"flex",gap:0,background:"white",borderBottom:`2px solid ${LIGHT}`,padding:"0 14px"}}>
            {[["patients","Patienten"],["exercises","Übungen"],["assign","Zuweisen"]].map(([tab,lb])=>(
              <button key={tab} className="btn" onClick={()=>setPracticeTab(tab)} style={{flex:1,padding:"13px 8px",fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:700,color:practiceTab===tab?BRAND:"#3D7070",borderBottom:practiceTab===tab?`2px solid ${BRAND}`:"2px solid transparent",marginBottom:-2,display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>
                <Icon name={tab==="patients"?"user":tab==="exercises"?"tip":"assign"} size={14} color={practiceTab===tab?BRAND:"#3D7070"}/>{lb}
              </button>
            ))}
          </div>

          {practiceTab==="patients"&&(
            <div style={{padding:"16px 14px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:700,color:DARK}}>Patienten</div>
                <button className="btn" onClick={()=>{setNewPatient(EMPTY_PATIENT);setNewAccountMode("new");setSheet("addPatient");}} style={{background:BRAND,color:"#102828",borderRadius:10,padding:"9px 14px",fontSize:12,fontFamily:"'DM Sans',sans-serif",fontWeight:700,display:"flex",alignItems:"center",gap:5}}>
                  <Icon name="plus" size={14} color="#102828"/> Neuer Patient
                </button>
              </div>
              <SearchInput value={patientSearch} onChange={setPatientSearch} placeholder="Patient, Besitzer oder Rasse suchen..."/>
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {filteredPatients.map(p=>{
                  const userEmail=getUserEmail(p.user_id);
                  return(
                    <div key={p.id} className="card" style={{padding:"13px 15px",display:"flex",gap:12,alignItems:"center"}}>
                      <div style={{width:42,height:42,borderRadius:12,background:LIGHT,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{p.avatar||"🐕"}</div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:700,color:"#102828"}}>{p.name}</div>
                        <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"#3D7070",marginTop:1}}>{p.breed} · {p.owner}</div>
                        <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"#5a5a5a",marginTop:2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{p.condition}</div>
                        <div style={{marginTop:4}}>
                          {userEmail?<span className="tag" style={{background:"#E8F5E9",color:"#2E7D32",display:"inline-flex",alignItems:"center",gap:3}}><Icon name="mail" size={10} color="#2E7D32"/>{userEmail}</span>
                            :<span className="tag" style={{background:"#FFF3E0",color:"#E65100"}}>Kein Login</span>}
                        </div>
                      </div>
                      <div style={{display:"flex",gap:5}}>
                        <button className="iBtn" onClick={()=>{setEditPatientData({...p});setSheet("editPatient");}} style={{background:BRAND+"20"}}><Icon name="edit" size={14} color={MID}/></button>
                        <button className="iBtn" onClick={()=>{setSheetData(p);setSheet("confirmDeletePt");}} style={{background:"#FFE8E8"}}><Icon name="trash" size={14} color="#C0392B"/></button>
                      </div>
                    </div>
                  );
                })}
                {filteredPatients.length===0&&<div className="card" style={{padding:20,textAlign:"center",color:"#3D7070",fontFamily:"'DM Sans',sans-serif",fontSize:14}}>{patientSearch?"Keine Patienten gefunden.":"Noch keine Patienten angelegt."}</div>}
              </div>
            </div>
          )}

          {practiceTab==="exercises"&&(
            <div style={{padding:"16px 14px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:700,color:DARK}}>Übungsvorlagen</div>
                <button className="btn" onClick={()=>{setNewTemplate(EMPTY_TEMPLATE);setSheet("addTemplate");}} style={{background:BRAND,color:"#102828",borderRadius:10,padding:"9px 14px",fontSize:12,fontFamily:"'DM Sans',sans-serif",fontWeight:700,display:"flex",alignItems:"center",gap:5}}>
                  <Icon name="plus" size={14} color="#102828"/> Neue Übung
                </button>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {templates.map(tmpl=>(
                  <div key={tmpl.id} className="card" style={{padding:"12px 14px",display:"flex",gap:10,alignItems:"center"}}>
                    {tmpl.image_url?<img src={tmpl.image_url} alt={tmpl.title} style={{width:42,height:42,borderRadius:9,objectFit:"contain",flexShrink:0,background:LIGHT,padding:2}}/>
                      :<div style={{width:42,height:42,borderRadius:9,background:LIGHT,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Icon name="paw" size={18} color={ACCENT}/></div>}
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,fontWeight:600,color:"#102828",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{tmpl.title}</div>
                      <div style={{display:"flex",gap:5,marginTop:4,flexWrap:"wrap"}}>
                        {(tmpl.categories||[]).map(c=><span key={c} className="tag" style={{background:BRAND+"18",color:BRAND}}>{c}</span>)}
                        <span className="tag" style={{background:(difficultyColor[tmpl.difficulty]||BRAND)+"18",color:difficultyColor[tmpl.difficulty]||BRAND}}>{tmpl.difficulty}</span>
                      </div>
                    </div>
                    <div style={{display:"flex",gap:5}}>
                      <button className="iBtn" onClick={()=>{setEditTemplateData({...tmpl,instructions:tmpl.instructions?.length?tmpl.instructions:["","",""]});setSheet("editTemplate");}} style={{background:BRAND+"20"}}><Icon name="edit" size={14} color={MID}/></button>
                      <button className="iBtn" onClick={()=>{setSheetData(tmpl);setSheet("confirmDeleteTmpl");}} style={{background:"#FFE8E8"}}><Icon name="trash" size={14} color="#C0392B"/></button>
                    </div>
                  </div>
                ))}
                {templates.length===0&&<div className="card" style={{padding:24,textAlign:"center",color:"#3D7070",fontFamily:"'DM Sans',sans-serif",fontSize:14}}>Noch keine Übungsvorlagen erstellt.</div>}
              </div>
            </div>
          )}

          {practiceTab==="assign"&&(
            <div style={{padding:"16px 14px"}}>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:700,color:DARK,marginBottom:12}}>Übung zuweisen</div>
              <div style={{marginBottom:14}}>
                <SL text="Patient suchen & auswählen"/>
                <SearchInput value={assignPatientSearch} onChange={setAssignPatientSearch} placeholder="Name oder Besitzer..."/>
                <CustomSelect value={selectedPatient?.id||""} onChange={e=>setSelectedPatient(patients.find(p=>p.id===e.target.value)||null)}>
                  <option value="">{t.selectPatient}</option>
                  {filteredAssignPatients.map(p=><option key={p.id} value={p.id}>{patLabel(p)}</option>)}
                </CustomSelect>
              </div>
              {selectedPatient&&(<>
                <button className="btn" onClick={()=>setSheet("addExercise")} style={{width:"100%",background:DARK,color:"#E6F6F6",borderRadius:12,padding:"12px",fontSize:13,fontFamily:"'DM Sans',sans-serif",fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:14}}>
                  <Icon name="assign" size={16} color="#E6F6F6"/> Übung zuweisen
                </button>
                <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:700,color:"#3D7070",textTransform:"uppercase",letterSpacing:".5px",marginBottom:10}}>{t.homeExercises(exForPatient(selectedPatient.id).length)}</div>
                {exForPatient(selectedPatient.id).length===0&&<div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:ACCENT,textAlign:"center",padding:"12px 0"}}>{t.noExercisesYet}</div>}
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {exForPatient(selectedPatient.id).map(ex=>{
                    const rc=ex.repeat_count||1;
                    const doneNow=getDoneCountThisWeek(ex.id);
                    const fullyDone=doneNow>=rc;
                    return(
                      <div key={ex.id} className="card" style={{padding:"11px 13px",display:"flex",gap:10,alignItems:"center",borderLeft:`4px solid ${fullyDone?BRAND:"#E0E0E0"}`,opacity:fullyDone?0.75:1}}>
                        {ex.image_url?<img src={ex.image_url} alt={ex.title} style={{width:38,height:38,borderRadius:8,objectFit:"contain",flexShrink:0,background:LIGHT,padding:2,cursor:"pointer"}} onClick={()=>setSelectedExercise(ex)}/>
                          :<div style={{width:38,height:38,borderRadius:8,background:fullyDone?BRAND+"20":LIGHT,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,cursor:"pointer"}} onClick={()=>setSelectedExercise(ex)}><Icon name="paw" size={17} color={fullyDone?BRAND:ACCENT}/></div>}
                        <div style={{flex:1,minWidth:0,cursor:"pointer"}} onClick={()=>setSelectedExercise(ex)}>
                          <div style={{fontFamily:"'Playfair Display',serif",fontSize:13,fontWeight:600,color:fullyDone?"#3D7070":"#102828",textDecoration:fullyDone?"line-through":"none"}}>{ex.title}</div>
                          <div style={{display:"flex",alignItems:"center",gap:5,marginTop:3}}>
                            {Array.from({length:rc}).map((_,i)=>(
                              <div key={i} style={{width:10,height:10,borderRadius:3,background:i<doneNow?BRAND:"#E0E0E0"}}/>
                            ))}
                            <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"#3D7070"}}>{doneNow}/{rc} · {ex.duration}</span>
                          </div>
                          {(()=>{const fb=getLatestFeedback(ex.id);return fb?(
                            <div style={{marginTop:5,display:"flex",alignItems:"center",gap:6}}>
                              <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:700,color:PAIN_COLORS[fb.pain_level]}}>● {PAIN_LABELS[fb.pain_level]}</span>
                              <button className="btn" onClick={e=>{e.stopPropagation();setViewFeedbackEx(ex);}} style={{display:"flex",alignItems:"center",gap:3,background:LIGHT,borderRadius:6,padding:"2px 8px",fontFamily:"'DM Sans',sans-serif",fontSize:10,fontWeight:600,color:"#3D7070",border:`1px solid #B8DFE0`}}>
                                <Icon name="info" size={10} color="#3D7070"/> anzeigen
                              </button>
                            </div>
                          ):null;})()}
                        </div>
                        <button className="iBtn" onClick={()=>{setSheetData(ex);setSheet("confirmDeleteEx");}} style={{background:"#FFE8E8"}}><Icon name="trash" size={14} color="#C0392B"/></button>
                      </div>
                    );
                  })}
                </div>
              </>)}
              {!selectedPatient&&<div className="card" style={{padding:24,textAlign:"center",color:"#3D7070",fontFamily:"'DM Sans',sans-serif",fontSize:14}}>Bitte zuerst einen Patienten auswählen.</div>}
            </div>
          )}
        </div>
      )}

      {/* INFO VIEW */}
      {view==="info"&&(
        <div style={{maxWidth:480,margin:"0 auto",padding:"16px 14px 80px"}}>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,marginBottom:4}}>{t.tipsTitle}</div>
          <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"#3D7070",marginBottom:14}}>{t.tipsSub}</div>
          <div style={{display:"flex",gap:7,marginBottom:16,background:"white",borderRadius:14,padding:5,boxShadow:"0 2px 12px rgba(95,184,185,0.10)"}}>
            {[["tips","tip",t.tabTips],["pause","rest",t.tabPause]].map(([tab,ic,label])=>(
              <button key={tab} className="btn" onClick={()=>setInfoTab(tab)} style={{flex:1,padding:"10px 8px",borderRadius:10,background:infoTab===tab?BRAND:"transparent",color:infoTab===tab?"#102828":"#3D7070",fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:12,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                <Icon name={ic} size={14} color={infoTab===tab?"#102828":"#3D7070"}/>{label}
              </button>
            ))}
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:11}}>
            {infoTab==="tips"&&TIPS[lang].map((tip,i)=><InfoCard key={i} {...tip}/>)}
            {infoTab==="pause"&&[{icon:"rest",title:t.pauseHero,text:t.pauseHeroText},...PAUSE[lang]].map((sec,i)=><InfoCard key={i} {...sec}/>)}
          </div>
        </div>
      )}

      {/* EXERCISE DETAIL */}
      {selectedExercise&&(
        <div className="overlay" onClick={()=>setSelectedExercise(null)}>
          <div className="sheet" onClick={e=>e.stopPropagation()}>
            <SheetHeader title={selectedExercise.title} onClose={()=>setSelectedExercise(null)}/>
            <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap"}}>
              {(selectedExercise.categories||[]).map(c=><span key={c} className="tag" style={{background:BRAND+"20",color:BRAND}}>{c}</span>)}
              {(selectedExercise.target_regions||[]).map(r=><span key={r} className="tag" style={{background:MID+"20",color:MID}}>{r}</span>)}
              <span className="tag" style={{background:(difficultyColor[selectedExercise.difficulty]||BRAND)+"20",color:difficultyColor[selectedExercise.difficulty]||BRAND}}>{selectedExercise.difficulty}</span>
            </div>
            {selectedExercise.image_url
              ?<div style={{width:"100%",borderRadius:14,overflow:"hidden",marginBottom:16,background:LIGHT}}><img src={selectedExercise.image_url} alt={selectedExercise.title} style={{width:"100%",height:"auto",maxHeight:260,objectFit:"contain",display:"block"}}/></div>
              :<div style={{background:LIGHT,borderRadius:14,height:110,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:16}}><Icon name="paw" size={48} color={ACCENT}/></div>}
            <div style={{display:"flex",gap:9,marginBottom:16}}>
              <div style={{flex:1,background:PALE,borderRadius:10,padding:"12px",textAlign:"center"}}>
                <div style={{display:"flex",justifyContent:"center",marginBottom:3}}><Icon name="clock" size={18} color={BRAND}/></div>
                <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:600,color:"#102828"}}>{selectedExercise.duration}</div>
              </div>
              {selectedExercise.video_url&&(
                <a href={selectedExercise.video_url} target="_blank" rel="noreferrer" style={{flex:1,background:BRAND+"12",borderRadius:10,padding:"12px",textAlign:"center",textDecoration:"none",display:"flex",flexDirection:"column",alignItems:"center",gap:3,border:`1.5px solid ${BRAND}30`}}>
                  <Icon name="play" size={18} color={MID}/>
                  <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:600,color:MID}}>{t.watchVideo}</div>
                </a>
              )}
            </div>
            {selectedExercise.description&&<div style={{marginBottom:16}}><div style={{fontFamily:"'Playfair Display',serif",fontSize:14,fontWeight:700,marginBottom:6,color:"#102828"}}>{t.description}</div><div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:DARK,lineHeight:1.7}}>{selectedExercise.description}</div></div>}
            {selectedExercise.instructions?.length>0&&(
              <div style={{marginBottom:20}}>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,fontWeight:700,marginBottom:10,color:"#102828"}}>{t.step}</div>
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {selectedExercise.instructions.map((step,i)=>(
                    <div key={i} style={{display:"flex",gap:10,alignItems:"flex-start"}}>
                      <div style={{width:22,height:22,borderRadius:"50%",background:BRAND,color:"#102828",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontFamily:"'DM Sans',sans-serif",fontWeight:700,flexShrink:0}}>{i+1}</div>
                      <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:DARK,lineHeight:1.6,paddingTop:2}}>{step}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {view==="owner"&&(()=>{
              const rc=selectedExercise.repeat_count||1;
              const doneNow=getDoneCountThisWeek(selectedExercise.id);
              const fullyDone=doneNow>=rc;
              return(
                <div>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12,justifyContent:"center"}}>
                    {Array.from({length:rc}).map((_,i)=>{
                      const checked=i<doneNow;
                      return(
                        <button key={i} className="repeat-box" onClick={()=>toggleRepeat(selectedExercise.id,rc)}
                          style={{borderColor:checked?BRAND:"#B8DFE0",background:checked?BRAND:"white",width:36,height:36,borderRadius:10}}>
                          {checked&&<Icon name="check" size={18} color="white"/>}
                        </button>
                      );
                    })}
                  </div>
                  <button className="btn" onClick={()=>{toggleRepeat(selectedExercise.id,rc);if(doneNow+1>=rc)setSelectedExercise(null);}} style={{width:"100%",padding:"14px",borderRadius:12,background:fullyDone?LIGHT:BRAND,color:fullyDone?"#3D7070":"#102828",fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:15}}>
                    {fullyDone?t.markUndone:`${t.markDone} (${doneNow+1<rc?doneNow+1:rc}/${rc})`}
                  </button>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* SHEET: ASSIGN EXERCISE */}
      {sheet==="addExercise"&&(
        <div className="overlay" onClick={closeSheet}>
          <div className="sheet" onClick={e=>e.stopPropagation()}>
            <SheetHeader title={t.assignBtn} onClose={closeSheet}/>
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              <div><SL text={t.step1}/>
                <CustomSelect value={selectedPatient?.id||""} onChange={e=>setSelectedPatient(patients.find(p=>p.id===e.target.value)||null)}>
                  <option value="">{t.selectPatient}</option>
                  {patients.map(p=><option key={p.id} value={p.id}>{patLabel(p)}</option>)}
                </CustomSelect>
              </div>
              <div>
                <SL text={t.step2}/>
                <div style={{display:"flex",gap:8,marginBottom:10}}>
                  <FilterDropdown label={t.filterCategory} icon="filter" options={CATEGORIES} selected={assignFilterCats} onChange={setAssignFilterCats} color={BRAND}/>
                  <FilterDropdown label={t.filterRegion} icon="target" options={TARGET_REGIONS} selected={assignFilterRegions} onChange={setAssignFilterRegions} color={MID}/>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:5,maxHeight:200,overflowY:"auto",border:`1px solid ${LIGHT}`,borderRadius:11,padding:6}}>
                  {filteredTemplates.map(tmpl=>(
                    <div key={tmpl.id} className={"tmpl-row"+(selectedTemplate?.id===tmpl.id?" sel":"")} onClick={()=>setSelectedTemplate(selectedTemplate?.id===tmpl.id?null:tmpl)}>
                      {tmpl.image_url?<img src={tmpl.image_url} alt={tmpl.title} style={{width:36,height:36,borderRadius:7,objectFit:"contain",flexShrink:0,background:LIGHT,padding:2}}/>
                        :<div style={{width:36,height:36,borderRadius:7,background:LIGHT,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Icon name="paw" size={16} color={ACCENT}/></div>}
                      <div style={{flex:1}}><div style={{fontFamily:"'Playfair Display',serif",fontSize:13,fontWeight:600,color:"#102828"}}>{tmpl.title}</div><div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"#3D7070"}}>{(tmpl.categories||[]).join(", ")} · {tmpl.difficulty}</div></div>
                      {selectedTemplate?.id===tmpl.id&&<Icon name="check" size={15} color={BRAND}/>}
                    </div>
                  ))}
                  {filteredTemplates.length===0&&<div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:ACCENT,textAlign:"center",padding:"12px 0"}}>{t.noCategoryEx}</div>}
                </div>
              </div>
              <div><SL text={t.step3}/><input value={duration} onChange={e=>setDuration(e.target.value)} placeholder={t.freqPh} style={inp}/></div>
              <div>
                <SL text={t.step4}/>
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  <button className="btn" onClick={()=>setRepeatCount(Math.max(1,repeatCount-1))} style={{width:36,height:36,borderRadius:9,background:LIGHT,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:700,color:DARK}}>−</button>
                  <div style={{flex:1,textAlign:"center",fontFamily:"'Playfair Display',serif",fontSize:28,fontWeight:700,color:DARK}}>{repeatCount}x</div>
                  <button className="btn" onClick={()=>setRepeatCount(Math.min(7,repeatCount+1))} style={{width:36,height:36,borderRadius:9,background:BRAND,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:700,color:"#102828"}}>+</button>
                </div>
                <div style={{display:"flex",justifyContent:"center",gap:6,marginTop:8}}>
                  {Array.from({length:repeatCount}).map((_,i)=>(
                    <div key={i} style={{width:24,height:24,borderRadius:7,background:BRAND+"20",border:`2px solid ${BRAND}`,display:"flex",alignItems:"center",justifyContent:"center"}}>
                      <Icon name="check" size={12} color={BRAND}/>
                    </div>
                  ))}
                </div>
              </div>
              <button className="btn" onClick={addExercise} disabled={saving} style={{width:"100%",padding:"14px",borderRadius:12,background:selectedTemplate&&selectedPatient&&duration?BRAND:"#B8DFE0",color:selectedTemplate&&selectedPatient&&duration?"#102828":"#7ECBCC",fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:15}}>
                {saving?t.saving:t.assignBtn}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SHEET: ADD PATIENT */}
      {sheet==="addPatient"&&(
        <div className="overlay" onClick={closeSheet}>
          <div className="sheet" onClick={e=>e.stopPropagation()}>
            <SheetHeader title="Neuer Patient" onClose={closeSheet}/>
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              {[["Name des Hundes *","name","Bello"],["Rasse","breed","Labrador Retriever"],["Alter","age","7 Jahre"],["Besitzer","owner","Familie Müller"]].map(([label,key,ph])=>(
                <div key={key}><SL text={label}/><input value={newPatient[key]||""} onChange={e=>setNewPatient(p=>({...p,[key]:e.target.value}))} placeholder={ph} style={inp}/></div>
              ))}
              <div><SL text="Diagnose"/><textarea value={newPatient.condition||""} onChange={e=>setNewPatient(p=>({...p,condition:e.target.value}))} rows={3} placeholder="z.B. Hüftdysplasie" style={{...inp,resize:"vertical"}}/></div>
              <div><SL text="Emoji"/><input value={newPatient.avatar||""} onChange={e=>setNewPatient(p=>({...p,avatar:e.target.value}))} placeholder="🐕" style={{...inp,width:60,textAlign:"center"}}/></div>
              <div style={{background:LIGHT,borderRadius:12,padding:"14px"}}>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,fontWeight:700,color:DARK,marginBottom:12}}>Login-Konto</div>
                <div style={{display:"flex",gap:6,marginBottom:12}}>
                  {[["new","Neu"],["existing","Bestehend"],["none","Kein Login"]].map(([mode,label])=>(
                    <button key={mode} className="mode-btn" onClick={()=>setNewAccountMode(mode)} style={{borderColor:newAccountMode===mode?BRAND:"#B8DFE0",background:newAccountMode===mode?BRAND:"white",color:newAccountMode===mode?"#102828":"#3D7070"}}>{label}</button>
                  ))}
                </div>
                {newAccountMode==="new"&&(<>
                  <div style={{marginBottom:10}}><SL text="Email"/><input value={newPatient.ownerEmail||""} onChange={e=>setNewPatient(p=>({...p,ownerEmail:e.target.value}))} placeholder="besitzer@email.de" type="email" style={inp}/></div>
                  <div><SL text="Passwort"/><input value={newPatient.ownerPassword||""} onChange={e=>setNewPatient(p=>({...p,ownerPassword:e.target.value}))} placeholder="Mind. 6 Zeichen" type="text" style={inp}/></div>
                  <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"#3D7070",marginTop:8}}>💡 Tipp: Email als initiales Passwort verwenden</div>
                </>)}
                {newAccountMode==="existing"&&(<>
                  <SearchInput value={userSearch} onChange={setUserSearch} placeholder="User suchen..."/>
                  <CustomSelect value={selectedExistingUserId} onChange={e=>setSelectedExistingUserId(e.target.value)}>
                    <option value="">User auswählen...</option>
                    {filteredUsers.map(u=><option key={u.id} value={u.id}>{u.email}</option>)}
                  </CustomSelect>
                </>)}
                {newAccountMode==="none"&&<div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"#3D7070"}}>Dieser Patient bekommt keinen App-Zugang.</div>}
              </div>
              <button className="btn" onClick={addPatient} disabled={saving||!newPatient.name} style={{width:"100%",padding:"14px",borderRadius:12,background:newPatient.name?BRAND:"#B8DFE0",color:newPatient.name?"#102828":"#7ECBCC",fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:15}}>
                {saving?t.saving:"Patient anlegen"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SHEET: EDIT PATIENT */}
      {sheet==="editPatient"&&editPatientData&&(
        <div className="overlay" onClick={closeSheet}>
          <div className="sheet" onClick={e=>e.stopPropagation()}>
            <SheetHeader title="Patient bearbeiten" onClose={closeSheet}/>
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              {[["Name *","name"],["Rasse","breed"],["Alter","age"],["Besitzer","owner"]].map(([label,key])=>(
                <div key={key}><SL text={label}/><input value={editPatientData[key]||""} onChange={e=>setEditPatientData(p=>({...p,[key]:e.target.value}))} style={inp}/></div>
              ))}
              <div><SL text="Diagnose"/><textarea value={editPatientData.condition||""} onChange={e=>setEditPatientData(p=>({...p,condition:e.target.value}))} rows={4} style={{...inp,resize:"vertical",lineHeight:1.5}}/></div>
              <div><SL text="Emoji"/><input value={editPatientData.avatar||""} onChange={e=>setEditPatientData(p=>({...p,avatar:e.target.value}))} style={{...inp,width:60,textAlign:"center"}}/></div>
              <div style={{background:LIGHT,borderRadius:12,padding:"14px"}}>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,fontWeight:700,color:DARK,marginBottom:10}}>Login-Konto</div>
                {editPatientData.user_id&&getUserEmail(editPatientData.user_id)?(<>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10,background:"white",borderRadius:10,padding:"10px 12px"}}>
                    <Icon name="mail" size={16} color={BRAND}/>
                    <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"#102828",flex:1}}>{getUserEmail(editPatientData.user_id)}</span>
                  </div>
                  {resetEmailSent
                    ?<div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"#2E7D32",background:"#E8F5E9",borderRadius:8,padding:"8px 12px",marginBottom:10}}>✓ Passwort-Reset Email gesendet!</div>
                    :<button className="btn" onClick={()=>sendPasswordReset(getUserEmail(editPatientData.user_id))} style={{background:"white",border:`1.5px solid ${BRAND}`,borderRadius:9,padding:"8px 12px",fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:600,color:BRAND,display:"flex",alignItems:"center",gap:6,marginBottom:10}}>
                      <Icon name="mail" size={13} color={BRAND}/>Passwort-Reset Email senden
                    </button>}
                  <SL text="Anderen User verknüpfen"/>
                  <SearchInput value={userSearch} onChange={setUserSearch} placeholder="User suchen..."/>
                  <CustomSelect value={editPatientData._newUserId!==undefined?(editPatientData._newUserId||""):(editPatientData.user_id||"")} onChange={e=>setEditPatientData(p=>({...p,_newUserId:e.target.value||null}))}>
                    <option value="">Kein Login</option>
                    {filteredUsers.map(u=><option key={u.id} value={u.id}>{u.email}</option>)}
                  </CustomSelect>
                </>):(<>
                  <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"#3D7070",marginBottom:10}}>Kein Login-Konto verknüpft.</div>
                  <SL text="User verknüpfen"/>
                  <SearchInput value={userSearch} onChange={setUserSearch} placeholder="User suchen..."/>
                  <CustomSelect value={editPatientData._newUserId||""} onChange={e=>setEditPatientData(p=>({...p,_newUserId:e.target.value||null}))}>
                    <option value="">User auswählen...</option>
                    {filteredUsers.map(u=><option key={u.id} value={u.id}>{u.email}</option>)}
                  </CustomSelect>
                </>)}
              </div>
              <button className="btn" onClick={updatePatient} disabled={saving||!editPatientData.name} style={{width:"100%",padding:"14px",borderRadius:12,background:editPatientData.name?BRAND:"#B8DFE0",color:editPatientData.name?"#102828":"#7ECBCC",fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:15}}>
                {saving?t.saving:"Änderungen speichern"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SHEET: ADD TEMPLATE */}
      {sheet==="addTemplate"&&(
        <div className="overlay" onClick={closeSheet}>
          <div className="sheet" onClick={e=>e.stopPropagation()}>
            <SheetHeader title="Neue Übung erstellen" onClose={closeSheet}/>
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              <div><SL text="Titel *"/><input value={newTemplate.title} onChange={e=>setNewTemplate(p=>({...p,title:e.target.value}))} placeholder="z.B. Cavaletti-Stangen" style={inp}/></div>
              <div><SL text="Kategorie"/><MultiSelect options={CATEGORIES} selected={newTemplate.categories} onChange={v=>setNewTemplate(p=>({...p,categories:v}))} color={BRAND}/></div>
              <div><SL text="Zielregion"/><MultiSelect options={TARGET_REGIONS} selected={newTemplate.target_regions} onChange={v=>setNewTemplate(p=>({...p,target_regions:v}))} color={MID}/></div>
              <div><SL text="Schwierigkeit"/>
                <CustomSelect value={newTemplate.difficulty} onChange={e=>setNewTemplate(p=>({...p,difficulty:e.target.value}))}>
                  {["Leicht","Mittel","Schwer"].map(d=><option key={d}>{d}</option>)}
                </CustomSelect>
              </div>
              <div><SL text="Beschreibung"/><textarea value={newTemplate.description} onChange={e=>setNewTemplate(p=>({...p,description:e.target.value}))} rows={3} placeholder="Kurze Erklärung..." style={{...inp,resize:"vertical"}}/></div>
              <div><SL text="Schritte"/>{newTemplate.instructions.map((s,i)=><input key={i} value={s} onChange={e=>setNewTemplate(p=>({...p,instructions:p.instructions.map((x,j)=>j===i?e.target.value:x)}))} placeholder={`Schritt ${i+1}...`} style={{...inp,marginBottom:6}}/>)}</div>
              <div><SL text="Bild-URL"/><input value={newTemplate.image_url} onChange={e=>setNewTemplate(p=>({...p,image_url:e.target.value}))} placeholder="https://..." style={inp}/></div>
              <div><SL text="Video-URL (optional)"/><input value={newTemplate.video_url} onChange={e=>setNewTemplate(p=>({...p,video_url:e.target.value}))} placeholder="https://youtube.com/..." style={inp}/></div>
              <button className="btn" onClick={addTemplate} disabled={saving||!newTemplate.title} style={{width:"100%",padding:"14px",borderRadius:12,background:newTemplate.title?BRAND:"#B8DFE0",color:newTemplate.title?"#102828":"#7ECBCC",fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:15}}>
                {saving?t.saving:"Übung speichern"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SHEET: EDIT TEMPLATE */}
      {sheet==="editTemplate"&&editTemplateData&&(
        <div className="overlay" onClick={closeSheet}>
          <div className="sheet" onClick={e=>e.stopPropagation()}>
            <SheetHeader title="Übung bearbeiten" onClose={closeSheet}/>
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              <div><SL text="Titel *"/><input value={editTemplateData.title} onChange={e=>setEditTemplateData(p=>({...p,title:e.target.value}))} style={inp}/></div>
              <div><SL text="Kategorie"/><MultiSelect options={CATEGORIES} selected={editTemplateData.categories||[]} onChange={v=>setEditTemplateData(p=>({...p,categories:v}))} color={BRAND}/></div>
              <div><SL text="Zielregion"/><MultiSelect options={TARGET_REGIONS} selected={editTemplateData.target_regions||[]} onChange={v=>setEditTemplateData(p=>({...p,target_regions:v}))} color={MID}/></div>
              <div><SL text="Schwierigkeit"/>
                <CustomSelect value={editTemplateData.difficulty} onChange={e=>setEditTemplateData(p=>({...p,difficulty:e.target.value}))}>
                  {["Leicht","Mittel","Schwer"].map(d=><option key={d}>{d}</option>)}
                </CustomSelect>
              </div>
              <div><SL text="Beschreibung"/><textarea value={editTemplateData.description||""} onChange={e=>setEditTemplateData(p=>({...p,description:e.target.value}))} rows={3} style={{...inp,resize:"vertical"}}/></div>
              <div><SL text="Schritte"/>{(editTemplateData.instructions||["","",""]).map((s,i)=><input key={i} value={s} onChange={e=>setEditTemplateData(p=>({...p,instructions:(p.instructions||[]).map((x,j)=>j===i?e.target.value:x)}))} placeholder={`Schritt ${i+1}...`} style={{...inp,marginBottom:6}}/>)}</div>
              <div><SL text="Bild-URL"/><input value={editTemplateData.image_url||""} onChange={e=>setEditTemplateData(p=>({...p,image_url:e.target.value}))} placeholder="https://..." style={inp}/></div>
              <div><SL text="Video-URL"/><input value={editTemplateData.video_url||""} onChange={e=>setEditTemplateData(p=>({...p,video_url:e.target.value}))} placeholder="https://youtube.com/..." style={inp}/></div>
              <button className="btn" onClick={updateTemplate} disabled={saving||!editTemplateData.title} style={{width:"100%",padding:"14px",borderRadius:12,background:editTemplateData.title?BRAND:"#B8DFE0",color:editTemplateData.title?"#102828":"#7ECBCC",fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:15}}>
                {saving?t.saving:"Änderungen speichern"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM SHEETS */}
      {sheet==="confirmDeleteEx"&&sheetData&&(<div className="overlay" onClick={closeSheet}><div className="sheet" onClick={e=>e.stopPropagation()}><div style={{display:"flex",justifyContent:"center",marginBottom:12}}><Icon name="trash" size={40} color="#C0392B"/></div><div style={{fontFamily:"'Playfair Display',serif",fontSize:19,fontWeight:700,marginBottom:8,textAlign:"center",color:"#102828"}}>Übung entfernen?</div><div style={{fontFamily:"'DM Sans',sans-serif",fontSize:14,color:"#3D7070",marginBottom:22,textAlign:"center"}}><strong>{sheetData.title}</strong> wird dauerhaft entfernt.</div><div style={{display:"flex",gap:9}}><button className="btn" onClick={closeSheet} style={{flex:1,padding:"14px",borderRadius:12,background:LIGHT,color:"#3D7070",fontFamily:"'DM Sans',sans-serif",fontWeight:700}}>{t.cancel}</button><button className="btn" onClick={()=>deleteExercise(sheetData.id)} style={{flex:1,padding:"14px",borderRadius:12,background:"#C0392B",color:"white",fontFamily:"'DM Sans',sans-serif",fontWeight:700}}>{deleting?"...":t.remove}</button></div></div></div>)}
      {sheet==="confirmDeletePt"&&sheetData&&(<div className="overlay" onClick={closeSheet}><div className="sheet" onClick={e=>e.stopPropagation()}><div style={{display:"flex",justifyContent:"center",marginBottom:12}}><Icon name="trash" size={40} color="#C0392B"/></div><div style={{fontFamily:"'Playfair Display',serif",fontSize:19,fontWeight:700,marginBottom:8,textAlign:"center",color:"#102828"}}>Patient löschen?</div><div style={{fontFamily:"'DM Sans',sans-serif",fontSize:14,color:"#3D7070",marginBottom:22,textAlign:"center"}}><strong>{sheetData.name}</strong> und alle Übungen werden dauerhaft gelöscht.</div><div style={{display:"flex",gap:9}}><button className="btn" onClick={closeSheet} style={{flex:1,padding:"14px",borderRadius:12,background:LIGHT,color:"#3D7070",fontFamily:"'DM Sans',sans-serif",fontWeight:700}}>{t.cancel}</button><button className="btn" onClick={()=>deletePatient(sheetData.id)} style={{flex:1,padding:"14px",borderRadius:12,background:"#C0392B",color:"white",fontFamily:"'DM Sans',sans-serif",fontWeight:700}}>{deleting?"...":t.delete}</button></div></div></div>)}
      {sheet==="confirmDeleteTmpl"&&sheetData&&(<div className="overlay" onClick={closeSheet}><div className="sheet" onClick={e=>e.stopPropagation()}><div style={{display:"flex",justifyContent:"center",marginBottom:12}}><Icon name="trash" size={40} color="#C0392B"/></div><div style={{fontFamily:"'Playfair Display',serif",fontSize:19,fontWeight:700,marginBottom:8,textAlign:"center",color:"#102828"}}>Übungsvorlage löschen?</div><div style={{fontFamily:"'DM Sans',sans-serif",fontSize:14,color:"#3D7070",marginBottom:22,textAlign:"center"}}><strong>{sheetData.title}</strong> wird aus der Bibliothek gelöscht. Bereits zugewiesene Übungen bleiben erhalten.</div><div style={{display:"flex",gap:9}}><button className="btn" onClick={closeSheet} style={{flex:1,padding:"14px",borderRadius:12,background:LIGHT,color:"#3D7070",fontFamily:"'DM Sans',sans-serif",fontWeight:700}}>{t.cancel}</button><button className="btn" onClick={()=>deleteTemplate(sheetData.id)} style={{flex:1,padding:"14px",borderRadius:12,background:"#C0392B",color:"white",fontFamily:"'DM Sans',sans-serif",fontWeight:700}}>{deleting?"...":t.delete}</button></div></div></div>)}

      {/* SHEET: VIEW FEEDBACK (Therapist) */}
      {viewFeedbackEx&&(
        <div className="overlay" onClick={()=>setViewFeedbackEx(null)}>
          <div className="sheet" onClick={e=>e.stopPropagation()}>
            <SheetHeader title="Feedback vom Besitzer" onClose={()=>setViewFeedbackEx(null)}/>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"#3D7070",marginBottom:16}}>{viewFeedbackEx.title}</div>
            {(()=>{
              const exFeedbacks=feedbacks.filter(f=>f.exercise_id===viewFeedbackEx.id);
              if(exFeedbacks.length===0)return <div style={{textAlign:"center",padding:"24px 0",color:ACCENT,fontFamily:"'DM Sans',sans-serif",fontSize:14}}>Noch kein Feedback vorhanden.</div>;
              return(
                <div style={{display:"flex",flexDirection:"column",gap:10}}>
                  {exFeedbacks.map((fb,i)=>(
                    <div key={fb.id} style={{background:PALE,borderRadius:12,padding:"14px 16px",borderLeft:`4px solid ${PAIN_COLORS[fb.pain_level]}`}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:fb.comment?8:0}}>
                        <div style={{display:"flex",alignItems:"center",gap:8}}>
                          <span style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,color:PAIN_COLORS[fb.pain_level]}}>{fb.pain_level}</span>
                          <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:700,color:PAIN_COLORS[fb.pain_level]}}>{PAIN_LABELS[fb.pain_level]}</span>
                        </div>
                        <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"#3D7070"}}>{new Date(fb.created_at).toLocaleDateString("de-DE",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"})}</span>
                      </div>
                      {fb.comment&&<div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:DARK,lineHeight:1.6}}>„{fb.comment}"</div>}
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* SHEET: FEEDBACK */}
      {feedbackSheet&&(
        <div className="overlay" onClick={()=>{setFeedbackSheet(null);setFeedbackPain(0);setFeedbackComment("");}}>
          <div className="sheet" onClick={e=>e.stopPropagation()}>
            <SheetHeader title="Befund melden" onClose={()=>{setFeedbackSheet(null);setFeedbackPain(0);setFeedbackComment("");}}/>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"#3D7070",marginBottom:16}}>{feedbackSheet.title}</div>
            <div style={{marginBottom:18}}>
              <SL text="Schmerzlevel"/>
              <div style={{display:"flex",gap:8,marginTop:4}}>
                {[1,2,3,4,5].map(n=>(
                  <button key={n} className="btn" onClick={()=>setFeedbackPain(n)} style={{flex:1,padding:"12px 0",borderRadius:10,border:`2px solid ${feedbackPain===n?PAIN_COLORS[n]:"#B8DFE0"}`,background:feedbackPain===n?PAIN_COLORS[n]+"18":"white",display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                    <span style={{fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:700,color:feedbackPain===n?PAIN_COLORS[n]:DARK}}>{n}</span>
                    <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:9,fontWeight:600,color:feedbackPain===n?PAIN_COLORS[n]:"#3D7070",textAlign:"center",lineHeight:1.2}}>{PAIN_LABELS[n]}</span>
                  </button>
                ))}
              </div>
            </div>
            <div style={{marginBottom:18}}>
              <SL text="Kommentar (optional)"/>
              <textarea value={feedbackComment} onChange={e=>setFeedbackComment(e.target.value)} rows={3} placeholder="z.B. Hund hat gezittert, Übung abgebrochen..." style={{...inp,resize:"vertical"}}/>
            </div>
            <button className="btn" onClick={saveFeedback} disabled={saving||feedbackPain===0} style={{width:"100%",padding:"14px",borderRadius:12,background:feedbackPain>0?BRAND:"#B8DFE0",color:feedbackPain>0?"#102828":"#7ECBCC",fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:15}}>
              {saving?"Wird gespeichert...":"Befund speichern"}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
