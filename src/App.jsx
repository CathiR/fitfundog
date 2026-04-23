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
    bell: <svg {...s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
    belloff: <svg {...s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13.73 21a2 2 0 0 1-3.46 0"/><path d="M18.63 13A17.89 17.89 0 0 1 18 8"/><path d="M6.26 6.26A5.86 5.86 0 0 0 6 8c0 7-3 9-3 9h14"/><path d="M18 8a6 6 0 0 0-9.33-5"/><line x1="1" y1="1" x2="23" y2="23"/></svg>,
    profile: <svg {...s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    print: <svg {...s} viewBox='0 0 24 24' fill='none' stroke={color} strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'><polyline points='6 9 6 2 18 2 18 9'/><path d='M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2'/><rect x='6' y='14' width='12' height='8'/></svg>,
    star: <svg {...s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  };
  return icons[name] || null;
};

const T = {
  de: { appSub:"Tierphysiotherapie & Osteopathie", navOwner:"Home", navTherapist:"Praxis", navInfo:"Info", navProfile:"Profil", progress:"Heutiger Fortschritt", exercisesDone:"Übungen abgeschlossen", allDone:(n)=>`Alle Übungen erledigt! ${n} sagt Danke!`, noPatient:"Noch kein Patient angelegt", noExercises:"Noch keine Übungen zugewiesen.", all:"Alle", selectPatient:"Patient auswählen...", noPatientSelected:"Bitte einen Patienten auswählen.", homeExercises:(n)=>`Heimübungen (${n})`, noExercisesYet:"Noch keine Übungen.", step:"Schritt für Schritt", description:"Beschreibung", watchVideo:"Video ansehen", markDone:"Erledigt!", markUndone:"Zurücksetzen", saving:"Wird gespeichert...", assignBtn:"Übung zuweisen", freq:"Dauer (Text)", freqPh:"z.B. täglich morgens", step1:"1. Patient", step2:"2. Übung auswählen", step3:"3. Dauer", step4:"4. Häufigkeit pro Woche", noCategoryEx:"Keine Übungen in dieser Kategorie.", cancel:"Abbrechen", delete:"Löschen", remove:"Entfernen", filterCategory:"Kategorie", filterRegion:"Zielregion", langLabel:"Sprache", tipsTitle:"Tipps & Wissen", tipsSub:"Wichtige Hinweise für das Training", tabTips:"Trainings-Tipps", tabPause:"Pause & Regeneration", pauseHero:"Pause ist Training!", pauseHeroText:"Pause ist der Zeitraum, in dem die eigentliche Leistungssteigerung stattfindet. Ohne ausreichende Pausen droht Überlastung statt Fortschritt." },
  en: { appSub:"Animal Physiotherapy & Osteopathy", navOwner:"Home", navTherapist:"Practice", navInfo:"Info", navProfile:"Profile", progress:"Today's Progress", exercisesDone:"exercises completed", allDone:(n)=>`All done! ${n} says Thank you!`, noPatient:"No patient added yet", noExercises:"No exercises assigned yet.", all:"All", selectPatient:"Select patient...", noPatientSelected:"Please select a patient.", homeExercises:(n)=>`Home exercises (${n})`, noExercisesYet:"No exercises yet.", step:"Step by Step", description:"Description", watchVideo:"Watch video", markDone:"Done!", markUndone:"Reset", saving:"Saving...", assignBtn:"Assign Exercise", freq:"Duration (text)", freqPh:"e.g. daily in the morning", step1:"1. Patient", step2:"2. Select exercise", step3:"3. Duration", step4:"4. Frequency per week", noCategoryEx:"No exercises in this category.", cancel:"Cancel", delete:"Delete", remove:"Remove", filterCategory:"Category", filterRegion:"Target Region", langLabel:"Language", tipsTitle:"Tips & Knowledge", tipsSub:"Important notes for training", tabTips:"Training Tips", tabPause:"Rest & Recovery", pauseHero:"Rest is Training!", pauseHeroText:"Rest is the period where actual performance improvement happens. Without sufficient rest, overtraining replaces progress." },
  es: { appSub:"Fisioterapia & Osteopatía Animal", navOwner:"Home", navTherapist:"Clínica", navInfo:"Info", navProfile:"Perfil", progress:"Progreso de hoy", exercisesDone:"ejercicios completados", allDone:(n)=>`¡Todo listo! ${n} dice ¡Gracias!`, noPatient:"Aún no hay paciente", noExercises:"Aún no hay ejercicios.", all:"Todos", selectPatient:"Seleccionar paciente...", noPatientSelected:"Por favor selecciona un paciente.", homeExercises:(n)=>`Ejercicios en casa (${n})`, noExercisesYet:"Aún no hay ejercicios.", step:"Paso a Paso", description:"Descripción", watchVideo:"Ver video", markDone:"¡Hecho!", markUndone:"Resetear", saving:"Guardando...", assignBtn:"Asignar ejercicio", freq:"Duración (texto)", freqPh:"ej. diario por la mañana", step1:"1. Paciente", step2:"2. Seleccionar ejercicio", step3:"3. Duración", step4:"4. Frecuencia por semana", noCategoryEx:"No hay ejercicios en esta categoría.", cancel:"Cancelar", delete:"Eliminar", remove:"Quitar", filterCategory:"Categoría", filterRegion:"Región", langLabel:"Idioma", tipsTitle:"Consejos", tipsSub:"Notas importantes", tabTips:"Consejos", tabPause:"Descanso", pauseHero:"¡El descanso es entrenamiento!", pauseHeroText:"El descanso es el periodo donde ocurre la mejora real del rendimiento." }
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

const PasswordResetScreen = ({ onDone }) => {
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const inp = { width:"100%", padding:"13px 14px", borderRadius:10, border:"1.5px solid #B8DFE0", fontSize:16, fontFamily:"'DM Sans',sans-serif", outline:"none", color:"#102828", background:"white", WebkitTextFillColor:"#102828", boxSizing:"border-box" };

  const handleReset = async () => {
    if (!password || password.length < 6) { setError("Passwort muss mindestens 6 Zeichen haben."); return; }
    if (password !== password2) { setError("Passwörter stimmen nicht überein."); return; }
    setLoading(true); setError("");
    const { error: err } = await supabase.auth.updateUser({ password, data: { must_change_password: false } });
    if (err) { setError("Fehler: " + err.message); setLoading(false); return; }
    await supabase.auth.signOut();
    setSuccess(true);
    setLoading(false);
    setTimeout(() => onDone(), 2000);
  };

  return (
    <div style={{ minHeight:"100vh", background:`linear-gradient(160deg,${DARK} 0%,#2A7A7B 60%,${BRAND} 100%)`, display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
      <div style={{ width:"100%", maxWidth:360 }}>
        <div style={{ textAlign:"center", marginBottom:32 }}>
          <img src={LOGO_URL} alt="Fit Fun Dog" style={{ height:65, objectFit:"contain", marginBottom:10 }}/>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:ACCENT, letterSpacing:"1.5px", textTransform:"uppercase" }}>Tierphysiotherapie & Osteopathie</div>
        </div>
        <div style={{ background:"white", borderRadius:22, padding:"28px 24px", boxShadow:"0 20px 60px rgba(0,0,0,0.2)" }}>
          {success ? (
            <div style={{ textAlign:"center", padding:"12px 0" }}>
              <div style={{ width:56, height:56, borderRadius:"50%", background:BRAND+"20", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px" }}>
                <Icon name="check" size={28} color={BRAND}/>
              </div>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:700, color:DARK, marginBottom:8 }}>Passwort gesetzt!</div>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:"#3D7070" }}>Du wirst zum Login weitergeleitet...</div>
            </div>
          ) : (
            <>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:700, color:DARK, marginBottom:4 }}>Neues Passwort</div>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:"#3D7070", marginBottom:22 }}>Bitte wähle ein neues Passwort für deinen Account.</div>
              <div style={{ marginBottom:14 }}>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:700, color:"#3D7070", letterSpacing:".7px", textTransform:"uppercase", marginBottom:7 }}>Neues Passwort</div>
                <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Mindestens 6 Zeichen" style={inp}/>
              </div>
              <div style={{ marginBottom:20 }}>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:700, color:"#3D7070", letterSpacing:".7px", textTransform:"uppercase", marginBottom:7 }}>Passwort wiederholen</div>
                <input type="password" value={password2} onChange={e=>setPassword2(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleReset()} placeholder="••••••••" style={inp}/>
              </div>
              {error && <div style={{ background:"#FFE8E8", borderRadius:10, padding:"10px 14px", marginBottom:16, fontFamily:"'DM Sans',sans-serif", fontSize:13, color:"#C0392B" }}>{error}</div>}
              <button onClick={handleReset} disabled={loading} style={{ width:"100%", padding:"14px", borderRadius:12, background:loading?"#B8DFE0":BRAND, color:"#102828", fontFamily:"'DM Sans',sans-serif", fontWeight:700, fontSize:15, border:"none", cursor:"pointer" }}>
                {loading ? "Wird gespeichert..." : "Passwort speichern"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [lang,setLang]=useState("de");
  const t=T[lang];
  const [session,setSession]=useState(null);
  const [authLoading,setAuthLoading]=useState(true);
  const [isRecoveryMode,setIsRecoveryMode]=useState(()=>{
    if(sessionStorage.getItem("_recovery")==="1")return true;
    return window.location.hash.includes("type=recovery");
  });
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
  const [calendarOpen,setCalendarOpen]=useState(false);

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
      if(event==="PASSWORD_RECOVERY"){
        sessionStorage.setItem("_recovery","1");
        setIsRecoveryMode(true);
        setAuthLoading(false);
        return;
      }
      if(event==="SIGNED_OUT"){
        // Clear all state on logout
        sessionStorage.removeItem("_recovery"); setIsRecoveryMode(false);
        setSession(null);
        setPatients([]);setExercises([]);setDoneLogs([]);setHistoryLogs([]);setFeedbacks([]);setTemplates([]);
        setOwnerPatient(null);setSelectedPatient(null);
        setLoading(true);
      } else if(event==="SIGNED_IN"&&s){
        setIsRecoveryMode(false);
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
        supabase.rpc("get_user_emails"),
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

  const APP_QR = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGMAAABjCAIAAAAAWSnCAAACl0lEQVR4nO2cSVIsMQwFgeAeHAiOCwfiJM3OG3UoUkMxReayvmvgxdO3LNn9eLvdHgTw9NMf8GdQKYpKUVSKolKU53jp5fVt8sTPj3c+mLzrPDAOTt61/lfoKYpKUe5E32EYR+fKVviQwXHM1v8GeoqiUpQs+g6JJ0veTp4cIzS5ktxO3hUht+spikpRUPRtkUyCERKGJEK30FMUlaJcGH0k1krxeBiu6XroKYpKUVD0DSeUJGMkd23Na8Pb9RRFpShZ9A2nmN6abispjYOH6CmKSlEer+u29xLOXv3kuuXeQU9RVIqS9ft6tfrSXWSqIqFaqmf2ip96iqJSlFrmmZhzGAi9Pl0vle2VevQURaUotZoncfKwWkIGb0Vx6cP0FEWlKNm6r1TKGG766rUn1pPSBD1FUSnKnegbVhSH9cz4nITeIpE80H2efVSKcifzTJK3UoK3FYaR3u3DroSeoqgUJZv7Dltlw61zB2RFWQp593luolIUdMbht1UmSx9WerKZ5wIqRUFzX2R43CC5qxdrpX/qLQn1FEWlKKjqUuK60sqwNd8bc9BTFJWioG57b/Yp7diMbO3YjN/TK7/oKYpKUaZz3zDhPFw3Z22hpygqRalF33p3b72pRzDzvBaVovzMGYeEXj2nNCZ5V4KeoqgUJTvj0CP52YdkcFyUJfTOAPbGHPQURaUoqN9H2Pr5iN6W7N5xjAMJQz1FUSkKOuMwrHIMN4Yl70ra5eTJcZpO0FMUlaLUThgN6e1YKyWlybviS0szpp6iqBTlW6OvtDEsWT+SK1s/53LQUxSVoqDoGzbReg0Ckh/2Ts72NrPpKYpKUdBelx4kr1sPn2HX3sxzAZWiXNjv+2foKYpKUVSKolIUlaJ8AU+BJ8XSknpWAAAAAElFTkSuQmCC";
  const BOOKING_QR = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAG8AAABvCAIAAABtpwk3AAADOUlEQVR4nO2cQbLUMAxE+RT34EBwXDgQJxl23mi+St16Saqg33LsxE6XFNuSMh+v1+tLgPj69AT+KaImSdQkiZokUZPkW/3p+4+fmzv++f3rs6Z659P5NNXLpfnUGzYTw580tkkSNUneePqh8dlK4zWSQ3lvg4bJ5dSTxjZJoiZJ5+mHxraXK7i38lafpd4P3pMeYpskUZNk5OkUEz/yVt5Jk7clkIhtkkRNkls9vXG6yS8HqekGBz/ENkmiJsnI0ykfmazXk726t8OfsHzS2CZJ1CTpPH0Zmj5IXvzIVdSTxjZJoibJx3WVM1K0TWpqhqjcsGk/xDZJoiZJl09v1seGZo/dMBli4vvSmu49V0NskyRqkmjndCl43vSRmry9uheRmzxFc8PYJknUJHnj6V6Z2aRzvarB8zWpz2GSAqidK7FNkqhJ8uac7oWnpOW1NtXRpUXZe894obl4+k1ETRK+GnbiPo0XTwpm8Jr25ankENskiZokWuVM42JSlMwrkq9jLYvuvMU95/SbiJoko3x642LL+Jt0ubQ3WEbaJ4NWYpskUZOki8g1SA61LGCTfJZy8EqybHcTNUm6iJwULjtQoTCvlqZBChV604htkkRNEq0a1guw1z7NEJNpeNv4yVSb40nW9LuJmiSjLNvy8LtMrE9uiEfjk09/nqhJouXTr0t/1yFuOF8vfT+792uJmiTbathl9HuyW/aO51TULvn0x4iaJFpErvY5SIG463xtWY9Xm5o7Z02/lqhJMlrTqciV9zGadOdlwa10VSW2SRI1SbQauUmp6uE6p/OgwvINsU2SqEliVsNKkW2v86TeZlnO2jRlTX+eqEnyzH/O4DUwFaq2R3q9xDZJoibJmzV9md5qvnlZ1sA0Yy3j815RbiW2SRI1Sbrd+zKr5X38UvtMPrSZDCpNw3vdxTZJoiaJGXs/UOGyBq8irjL5/k4aPbv3a4maJFpEzkNKnHln8Ovq8KXXQmyTJGqS3OHpHstv4pb1P8myPU/UJNGqYSUm4Wsv5+6t15M+y2hkbJMkapJoX61KUKf7SYCdStl7ybVDbJMkapJcmE//D4ltkkRNkqhJEjVJoibJXzC48S/M7p3rAAAAAElFTkSuQmCC";
  const LOGO_BLACK = "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+CjwhLS0gQ3JlYXRlZCB3aXRoIElua3NjYXBlIChodHRwOi8vd3d3Lmlua3NjYXBlLm9yZy8pIC0tPgoKPHN2ZwogICB3aWR0aD0iMjk3bW0iCiAgIGhlaWdodD0iMjEwbW0iCiAgIHZpZXdCb3g9IjAgMCAyOTcgMjEwIgogICB2ZXJzaW9uPSIxLjEiCiAgIGlkPSJzdmc1IgogICB4bWw6c3BhY2U9InByZXNlcnZlIgogICBpbmtzY2FwZTp2ZXJzaW9uPSIxLjIgKGRjMmFlZGEsIDIwMjItMDUtMTUpIgogICBzb2RpcG9kaTpkb2NuYW1lPSJMb2dvIEZpdCBGdW4gRG9nLVZla3RvciBzY2h3YXJ6Mi5zdmciCiAgIGlua3NjYXBlOmV4cG9ydC1maWxlbmFtZT0iTG9nbyBGaXQgRnVuIERvZy1WZWt0b3Igc2Nod2FyejMucG5nIgogICBpbmtzY2FwZTpleHBvcnQteGRwaT0iOTYiCiAgIGlua3NjYXBlOmV4cG9ydC15ZHBpPSI5NiIKICAgeG1sbnM6aW5rc2NhcGU9Imh0dHA6Ly93d3cuaW5rc2NhcGUub3JnL25hbWVzcGFjZXMvaW5rc2NhcGUiCiAgIHhtbG5zOnNvZGlwb2RpPSJodHRwOi8vc29kaXBvZGkuc291cmNlZm9yZ2UubmV0L0RURC9zb2RpcG9kaS0wLmR0ZCIKICAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogICB4bWxuczpzdmc9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48c29kaXBvZGk6bmFtZWR2aWV3CiAgICAgaWQ9Im5hbWVkdmlldzciCiAgICAgcGFnZWNvbG9yPSIjN2U3ZTdlIgogICAgIGJvcmRlcmNvbG9yPSIjOWQ5ZDlkIgogICAgIGJvcmRlcm9wYWNpdHk9IjEiCiAgICAgaW5rc2NhcGU6c2hvd3BhZ2VzaGFkb3c9IjAiCiAgICAgaW5rc2NhcGU6cGFnZW9wYWNpdHk9IjAiCiAgICAgaW5rc2NhcGU6cGFnZWNoZWNrZXJib2FyZD0iZmFsc2UiCiAgICAgaW5rc2NhcGU6ZGVza2NvbG9yPSIjNzE3MTcxIgogICAgIGlua3NjYXBlOmRvY3VtZW50LXVuaXRzPSJtbSIKICAgICBzaG93Z3JpZD0iZmFsc2UiCiAgICAgaW5rc2NhcGU6em9vbT0iMC40MDg0NzA3NyIKICAgICBpbmtzY2FwZTpjeD0iNjE5LjM4MzM2IgogICAgIGlua3NjYXBlOmN5PSI1MjguODAxNjEiCiAgICAgaW5rc2NhcGU6d2luZG93LXdpZHRoPSIxMzQ0IgogICAgIGlua3NjYXBlOndpbmRvdy1oZWlnaHQ9Ijc4NCIKICAgICBpbmtzY2FwZTp3aW5kb3cteD0iMCIKICAgICBpbmtzY2FwZTp3aW5kb3cteT0iMjUiCiAgICAgaW5rc2NhcGU6d2luZG93LW1heGltaXplZD0iMCIKICAgICBpbmtzY2FwZTpjdXJyZW50LWxheWVyPSJsYXllcjEiIC8+PGRlZnMKICAgICBpZD0iZGVmczIiIC8+PGcKICAgICBpbmtzY2FwZTpsYWJlbD0iRWJlbmUgMSIKICAgICBpbmtzY2FwZTpncm91cG1vZGU9ImxheWVyIgogICAgIGlkPSJsYXllcjEiCiAgICAgc3R5bGU9ImRpc3BsYXk6aW5saW5lIj48ZwogICAgICAgaWQ9ImcyOTEiCiAgICAgICBzdHlsZT0iZGlzcGxheTppbmxpbmU7ZmlsbDojMDAwMDAwO2ZpbGwtb3BhY2l0eToxIgogICAgICAgdHJhbnNmb3JtPSJtYXRyaXgoMC4zMzA3OTg4MiwwLDAsMC4zMzA3OTg4MiwxNDIuODI2MDEsMjQxLjgzOTkpIgogICAgICAgaW5rc2NhcGU6ZXhwb3J0LWZpbGVuYW1lPSJnMjkxLnBuZyIKICAgICAgIGlua3NjYXBlOmV4cG9ydC14ZHBpPSI5NiIKICAgICAgIGlua3NjYXBlOmV4cG9ydC15ZHBpPSI5NiI+PGcKICAgICAgICAgaWQ9Imc3NDczIgogICAgICAgICB0cmFuc2Zvcm09Im1hdHJpeCgwLjk5MzIwMDU5LDAsMCwwLjk5MzIwMDU5LDEzNjEuNTA1NiwyNzguMDQwNikiCiAgICAgICAgIHN0eWxlPSJkaXNwbGF5OmlubGluZTtmaWxsOiMwMDAwMDA7ZmlsbC1vcGFjaXR5OjEiPjxnCiAgICAgICAgICAgaWQ9Imc3NTUzIgogICAgICAgICAgIHN0eWxlPSJkaXNwbGF5OmlubGluZTtmaWxsOiMwMDAwMDA7ZmlsbC1vcGFjaXR5OjEiPjxwYXRoCiAgICAgICAgICAgICBzdHlsZT0iZGlzcGxheTppbmxpbmU7ZmlsbDojMDAwMDAwO2ZpbGwtb3BhY2l0eToxO3N0cm9rZS13aWR0aDowLjI2NDU4MyIKICAgICAgICAgICAgIGQ9Im0gLTE0NTEuNjUxMSwtNTEzLjI3NDQ0IGMgMC4xODE5LC0wLjA3MzQgMC40Nzk1LC0wLjA3MzQgMC42NjE0LDAgMC4xODE5LDAuMDczNCAwLjAzMywwLjEzMzQ2IC0wLjMzMDcsMC4xMzM0NiAtMC4zNjM4LDAgLTAuNTEyNiwtMC4wNjAxIC0wLjMzMDcsLTAuMTMzNDYgeiBtIC01OS4yNjY3LC0yMS43MTcwNSBjIDEuMDU1LC0wLjA1MDIgMi43ODE0LC0wLjA1MDIgMy44MzY1LDAgMS4wNTUsMC4wNTAyIDAuMTkxOCwwLjA5MTMgLTEuOTE4MywwLjA5MTMgLTIuMTEsMCAtMi45NzMyLC0wLjA0MTEgLTEuOTE4MiwtMC4wOTEzIHogbSAxMTAuNjYyLC0xLjc4NzkzIGMgMC40OTM2LC0wLjUwOTMyIDAuOTU3MSwtMC45MjYwNCAxLjAyOTgsLTAuOTI2MDQgMC4wNzMsMCAtMC4yNzE2LDAuNDE2NzIgLTAuNzY1MiwwLjkyNjA0IC0wLjQ5MzcsMC41MDkzMyAtMC45NTcxLDAuOTI2MDUgLTEuMDI5OSwwLjkyNjA1IC0wLjA3MywwIDAuMjcxNiwtMC40MTY3MiAwLjc2NTMsLTAuOTI2MDUgeiBtIC0xMzAuOTAyNiwtMC4zMTQ2NiBjIDAuMjU0NiwtMC4wNjY2IDAuNjcxNCwtMC4wNjY2IDAuOTI2LDAgMC4yNTQ3LDAuMDY2NSAwLjA0NiwwLjEyMDk5IC0wLjQ2MywwLjEyMDk5IC0wLjUwOTMsMCAtMC43MTc3LC0wLjA1NDUgLTAuNDYzLC0wLjEyMDk5IHogbSA4OC4wMjU5LC02MC4zNDEwNyAtMC45MTE5LC0wLjk5MjE4IDAuOTkyMiwwLjkxMTggYyAwLjkyMzUsMC44NDg2OCAxLjExMzksMS4wNzI1NyAwLjkxMTgsMS4wNzI1NyAtMC4wNDQsMCAtMC40OTA3LC0wLjQ0NjQ4IC0wLjk5MjEsLTAuOTkyMTkgeiBtIDcuNTM4MiwtMy44MzY0NSAtMC43NzcxLC0wLjg1OTkgMC44NTk5LDAuNzc3MTEgYyAwLjgwMTUsMC43MjQzNyAwLjk4MTUsMC45NDI2OCAwLjc3NzEsMC45NDI2OCAtMC4wNDYsMCAtMC40MzI1LC0wLjM4Njk1IC0wLjg1OTksLTAuODU5ODkgeiBtIC0xMi4xNzk0LC0xLjA1ODM0IC0wLjUwNCwtMC41OTUzMSAwLjU5NTMsMC41MDQwMyBjIDAuNTU5NSwwLjQ3MzY2IDAuNzE1OCwwLjY4NjYgMC41MDQxLDAuNjg2NiAtMC4wNSwwIC0wLjMxODIsLTAuMjY3ODkgLTAuNTk1NCwtMC41OTUzMiB6IG0gNi44NzkyLC00LjQ5NzkxIC0wLjUwNCwtMC41OTUzMiAwLjU5NTMsMC41MDQwMyBjIDAuNTU5NCwwLjQ3MzY2IDAuNzE1NywwLjY4NjYgMC41MDQsMC42ODY2IC0wLjA1LDAgLTAuMzE4MSwtMC4yNjc4OSAtMC41OTUzLC0wLjU5NTMxIHogbSAtMjMwLjgyMzgsLTk3LjE2ODIzIGMgMC45Mzc1LC0wLjk0NTg5IDEuNzY0LC0xLjcxOTggMS44MzY4LC0xLjcxOTggMC4wNzMsMCAtMC42MzQ4LDAuNzczOTEgLTEuNTcyMiwxLjcxOTggLTAuOTM3NSwwLjk0NTg4IC0xLjc2NDEsMS43MTk3OSAtMS44MzY4LDEuNzE5NzkgLTAuMDczLDAgMC42MzQ3LC0wLjc3MzkxIDEuNTcyMiwtMS43MTk3OSB6IG0gMTcwLjkwMDgsLTIyLjAyNjU3IC0wLjY0MTQsLTAuNzI3NiAwLjcyNzYsMC42NDE0MyBjIDAuNDAwMSwwLjM1Mjc5IDAuNzI3NiwwLjY4MDIxIDAuNzI3NiwwLjcyNzYxIDAsMC4yMDc1IC0wLjIxNDMsMC4wMzg2IC0wLjgxMzgsLTAuNjQxNDQgeiBtIC0xMjYuNDUwOCwtMjIuMTA5MzUgYyAwLC0wLjA0NTUgMC4zODY5LC0wLjQzMjQ5IDAuODU5OSwtMC44NTk5IGwgMC44NTk5LC0wLjc3NzEgLTAuNzc3MSwwLjg1OTkgYyAtMC43MjQ0LDAuODAxNTQgLTAuOTQyNywwLjk4MTUxIC0wLjk0MjcsMC43NzcxIHogbSAyNi40NTgzLC0xMTUuMzU4MzMgYyAwLC0wLjA0NTUgMC4zODcsLTAuNDMyNDkgMC44NTk5LC0wLjg1OTkgbCAwLjg1OTksLTAuNzc3MSAtMC43NzcxLDAuODU5ODkgYyAtMC43MjQ0LDAuODAxNTQgLTAuOTQyNywwLjk4MTUxIC0wLjk0MjcsMC43NzcxMSB6IgogICAgICAgICAgICAgaWQ9InBhdGg3NDg3IiAvPjxwYXRoCiAgICAgICAgICAgICBzdHlsZT0iZGlzcGxheTppbmxpbmU7ZmlsbDojMDAwMDAwO2ZpbGwtb3BhY2l0eToxO3N0cm9rZS13aWR0aDowLjI2NDU4MyIKICAgICAgICAgICAgIGQ9Im0gLTE3MzYuMjEwNSwtNDg2LjU3NDczIGMgMzAuOTU5NiwtMC4wMzcgODEuNjIwNiwtMC4wMzcgMTEyLjU4MDIsMCAzMC45NTk2LDAuMDM3MSA1LjYyOSwwLjA2NzQgLTU2LjI5MDEsMC4wNjc0IC02MS45MTkxLDAgLTg3LjI0OTcsLTAuMDMwMyAtNTYuMjkwMSwtMC4wNjc0IHogbSAyMjIuMjUsLTQ4LjQwMjY5IGMgMC4yNTQ3LC0wLjA2NjYgMC42NzE0LC0wLjA2NjYgMC45MjYsMCAwLjI1NDcsMC4wNjY1IDAuMDQ2LDAuMTIxIC0wLjQ2MywwLjEyMSAtMC41MDkzLDAgLTAuNzE3NywtMC4wNTQ1IC0wLjQ2MywtMC4xMjEgeiBtIC0xOC4zODg1LC0yLjEwOTUyIGMgMC4xODE5LC0wLjA3MzQgMC40Nzk1LC0wLjA3MzQgMC42NjE0LDAgMC4xODE5LDAuMDczNCAwLjAzMywwLjEzMzQ2IC0wLjMzMDcsMC4xMzM0NiAtMC4zNjM4LDAgLTAuNTEyNiwtMC4wNjAxIC0wLjMzMDcsLTAuMTMzNDYgeiBtIDEyNi40MDQ2LC01LjM4MTAyIGMgMC4yNjM0LC0wLjI5MTA0IDAuNTM4NSwtMC41MjkxNiAwLjYxMTIsLTAuNTI5MTYgMC4wNzMsMCAtMC4wODMsMC4yMzgxMiAtMC4zNDY2LDAuNTI5MTYgLTAuMjYzNCwwLjI5MTA0IC0wLjUzODQsMC41MjkxNyAtMC42MTEyLDAuNTI5MTcgLTAuMDczLDAgMC4wODMsLTAuMjM4MTMgMC4zNDY2LC0wLjUyOTE3IHogbSAtMzUuNzQzOCwtNTMuNTExOTggLTAuNTA0MSwtMC41OTUzMSAwLjU5NTMsMC41MDQwMyBjIDAuNTU5NSwwLjQ3MzY2IDAuNzE1OCwwLjY4NjYgMC41MDQxLDAuNjg2NiAtMC4wNSwwIC0wLjMxODEsLTAuMjY3ODkgLTAuNTk1MywtMC41OTUzMiB6IG0gNC42MzUzLC02Ljc0Njg3IC0wLjY0MTUsLTAuNzI3NjEgMC43Mjc2LDAuNjQxNDMgYyAwLjY4MDEsMC41OTk1MiAwLjg0OSwwLjgxMzc4IDAuNjQxNSwwLjgxMzc4IC0wLjA0NywwIC0wLjM3NDgsLTAuMzI3NDIgLTAuNzI3NiwtMC43Mjc2IHogbSAtMjI5LjEwOTIsLTk1LjQ0ODQ0IGMgMC40OTM3LC0wLjUwOTMyIDAuOTU3MSwtMC45MjYwNCAxLjAyOTksLTAuOTI2MDQgMC4wNzMsMCAtMC4yNzE2LDAuNDE2NzIgLTAuNzY1MywwLjkyNjA0IC0wLjQ5MzYsMC41MDkzMiAtMC45NTcxLDAuOTI2MDQgLTEuMDI5OCwwLjkyNjA0IC0wLjA3MywwIDAuMjcxNiwtMC40MTY3MiAwLjc2NTIsLTAuOTI2MDQgeiBtIDEwNi44NzE3LC01Mi45ODI4MSAtMC42NDE1LC0wLjcyNzYxIDAuNzI3NiwwLjY0MTQzIGMgMC42ODAxLDAuNTk5NTIgMC44NDksMC44MTM3OCAwLjY0MTUsMC44MTM3OCAtMC4wNDcsMCAtMC4zNzQ4LC0wLjMyNzQyIC0wLjcyNzYsLTAuNzI3NiB6IG0gLTczLjEzNzMsLTMuMjQxMTUgYyAwLjU2ODQsLTAuNTgyMDggMS4wOTMsLTEuMDU4MzMgMS4xNjU3LC0xLjA1ODMzIDAuMDczLDAgLTAuMzMyNywwLjQ3NjI1IC0wLjkwMTEsMS4wNTgzMyAtMC41Njg0LDAuNTgyMDggLTEuMDkzLDEuMDU4MzMgLTEuMTY1NywxLjA1ODMzIC0wLjA3MywwIDAuMzMyNywtMC40NzYyNSAwLjkwMTEsLTEuMDU4MzMgeiBtIDI3LjE3MTQsLTc1LjAwOTM3IGMgMC4wMSwtMC40MzY1NyAwLjA2NSwtMC41ODMxMyAwLjEzMTgsLTAuMzI1NyAwLjA2NywwLjI1NzQzIDAuMDYzLDAuNjE0NjIgLTAuMDEsMC43OTM3NSAtMC4wNzIsMC4xNzkxMyAtMC4xMjczLC0wLjAzMTUgLTAuMTIxOSwtMC40NjgwNSB6IG0gMTAuNjY0LC0yOC45NzE4OCBjIDAuMjYzNCwtMC4yOTEwNCAwLjUzODQsLTAuNTI5MTcgMC42MTEyLC0wLjUyOTE3IDAuMDczLDAgLTAuMDgzLDAuMjM4MTMgLTAuMzQ2NiwwLjUyOTE3IC0wLjI2MzQsMC4yOTEwNCAtMC41Mzg0LDAuNTI5MTcgLTAuNjExMiwwLjUyOTE3IC0wLjA3MywwIDAuMDgzLC0wLjIzODEzIDAuMzQ2NiwtMC41MjkxNyB6IgogICAgICAgICAgICAgaWQ9InBhdGg3NDg1IiAvPjxwYXRoCiAgICAgICAgICAgICBzdHlsZT0iZGlzcGxheTppbmxpbmU7ZmlsbDojMDAwMDAwO2ZpbGwtb3BhY2l0eToxO3N0cm9rZS13aWR0aDowLjI2NDU4MyIKICAgICAgICAgICAgIGQ9Im0gLTE0NDAuNjI5OSwtNTk0LjkyMTYgLTAuNTA0LC0wLjU5NTMyIDAuNTk1MywwLjUwNDA0IGMgMC41NTk0LDAuNDczNjUgMC43MTU3LDAuNjg2NTkgMC41MDQsMC42ODY1OSAtMC4wNSwwIC0wLjMxODEsLTAuMjY3ODkgLTAuNTk1MywtMC41OTUzMSB6IG0gLTY1Ljk4ODQsLTEyNS40Nzg2NSBjIC0wLjY0MjcsLTAuNjU0ODQgLTEuMTA5LC0xLjE5MDYzIC0xLjAzNjIsLTEuMTkwNjMgMC4wNzMsMCAwLjY1ODEsMC41MzU3OSAxLjMwMDgsMS4xOTA2MyAwLjY0MjYsMC42NTQ4NCAxLjEwODksMS4xOTA2MiAxLjAzNjIsMS4xOTA2MiAtMC4wNzMsMCAtMC42NTgxLC0wLjUzNTc4IC0xLjMwMDgsLTEuMTkwNjIgeiIKICAgICAgICAgICAgIGlkPSJwYXRoNzQ4MyIgLz48cGF0aAogICAgICAgICAgICAgc3R5bGU9ImRpc3BsYXk6aW5saW5lO2ZpbGw6IzAwMDAwMDtmaWxsLW9wYWNpdHk6MTtzdHJva2Utd2lkdGg6MC4yNjQ1ODMiCiAgICAgICAgICAgICBkPSJtIC0xNTE0Ljg4NjUsLTUyNy4wMzI3NyBjIDAuMTgxOSwtMC4wNzM0IDAuNDc5NSwtMC4wNzM0IDAuNjYxNCwwIDAuMTgxOSwwLjA3MzQgLTAuMDgsMC4wNTkzIC0wLjQ0MzMsMC4wMzI1IC0wLjM2NzYsLTAuMDI3MiAtMC40LDAuMDQwOCAtMC4yMTgxLC0wLjAzMjUgeiBtIC0xMjguNzg2LC0xODguMzQwNCBjIDAuMzQxOCwtMC4zNjM4IDAuNjgxLC0wLjY2MTQ2IDAuNzUzNywtMC42NjE0NiAwLjA3MywwIC0wLjE0NzMsMC4yOTc2NiAtMC40ODkxLDAuNjYxNDYgLTAuMzQxOCwwLjM2MzgxIC0wLjY4MDksMC42NjE0NiAtMC43NTM3LDAuNjYxNDYgLTAuMDczLDAgMC4xNDczLC0wLjI5NzY1IDAuNDg5MSwtMC42NjE0NiB6IG0gNTEuMjYzLC0xNTIuNDQyOTQgYyAwLjE4MTksLTAuMDczNCAwLjQ3OTYsLTAuMDczNCAwLjY2MTUsMCAwLjE4MTksMC4wNzM0IDAuMDMzLDAuMTMzNDYgLTAuMzMwNywwLjEzMzQ2IC0wLjM2MzgsMCAtMC41MTI3LC0wLjA2MDEgLTAuMzMwOCwtMC4xMzM0NiB6IgogICAgICAgICAgICAgaWQ9InBhdGg3NDgxIgogICAgICAgICAgICAgc29kaXBvZGk6bm9kZXR5cGVzPSJzc3Nzc3Nzc3Nzc3NzIiAvPjxwYXRoCiAgICAgICAgICAgICBzdHlsZT0iZGlzcGxheTppbmxpbmU7ZmlsbDojMDAwMDAwO2ZpbGwtb3BhY2l0eToxO3N0cm9rZS13aWR0aDowLjI2NDU4MyIKICAgICAgICAgICAgIGQ9Im0gLTE3MjguMjczLC00OTQuNTEyMjMgYyAyNy45MDM2LC0wLjAzNzEgNzMuNTY0MSwtMC4wMzcxIDEwMS40Njc3LDAgMjcuOTAzNiwwLjAzNzEgNS4wNzM0LDAuMDY3NSAtNTAuNzMzOCwwLjA2NzUgLTU1LjgwNzMsMCAtNzguNjM3NSwtMC4wMzA0IC01MC43MzM5LC0wLjA2NzUgeiBtIDIxNC43MTI1LC0zMi41MzI0NSBjIDAuMzI5MSwtMC4wNjMzIDAuODA1MywtMC4wNjA5IDEuMDU4MywwLjAwNSAwLjI1MjksMC4wNjYyIC0wLjAxNiwwLjExODAxIC0wLjU5ODQsMC4xMTUwNyAtMC41ODIxLC0wLjAwMyAtMC43ODkxLC0wLjA1NzEgLTAuNDU5OSwtMC4xMjA0MSB6IG0gNC4yMjQzLC0wLjAwNCBjIDAuNDY5NywtMC4wNTg0IDEuMzAzMSwtMC4wNTk0IDEuODUyMSwtMC4wMDMgMC41NDg5LDAuMDU3MyAwLjE2NDYsMC4xMDUwOSAtMC44NTQsMC4xMDYyOCAtMS4wMTg3LDAgLTEuNDY3OCwtMC4wNDU3IC0wLjk5ODEsLTAuMTA0MTQgeiBtIC0yMi43NDgzLC0yLjEwMDk1IGMgMC4xODE5LC0wLjA3MzQgMC40Nzk2LC0wLjA3MzQgMC42NjE1LDAgMC4xODE5LDAuMDczNCAwLjAzMywwLjEzMzQ1IC0wLjMzMDcsMC4xMzM0NSAtMC4zNjM4LDAgLTAuNTEyNywtMC4wNjAxIC0wLjMzMDgsLTAuMTMzNDUgeiBtIC0zNC4wNjUxLC03LjM2NTUgYyAwLjM0MTgsLTAuMzYzOCAwLjY4MSwtMC42NjE0NiAwLjc1MzcsLTAuNjYxNDYgMC4wNzMsMCAtMC4xNDczLDAuMjk3NjYgLTAuNDg5MSwwLjY2MTQ2IC0wLjM0MTgsMC4zNjM4IC0wLjY4MDksMC42NjE0NiAtMC43NTM3LDAuNjYxNDYgLTAuMDczLDAgMC4xNDc0LC0wLjI5NzY2IDAuNDg5MSwtMC42NjE0NiB6IG0gNC41NjkxLC0xMC44OTg5OCBjIDAuMjU3NSwtMC4wNjcxIDAuNjE0NywtMC4wNjI3IDAuNzkzOCwwLjAxIDAuMTc5MSwwLjA3MjUgLTAuMDMxLDAuMTI3MzQgLTAuNDY4MSwwLjEyMTk3IC0wLjQzNjUsLTAuMDA1IC0wLjU4MzEsLTAuMDY0NyAtMC4zMjU3LC0wLjEzMTc5IHogbSAxNTguNDY1OCwtMC40NzgxMSBjIDAuMDEsLTAuNDM2NTYgMC4wNjUsLTAuNTgzMTEgMC4xMzE4LC0wLjMyNTcgMC4wNjcsMC4yNTc0NCAwLjA2MywwLjYxNDYzIC0wLjAxLDAuNzkzNzUgLTAuMDcyLDAuMTc5MTUgLTAuMTI3MywtMC4wMzE1IC0wLjEyMTksLTAuNDY4MDUgeiBtIC00MS43NDg1LC01MS41Mjc2IC0wLjUwNDEsLTAuNTk1MzEgMC41OTUzLDAuNTA0MDMgYyAwLjU1OTUsMC40NzM2NiAwLjcxNTgsMC42ODY1OSAwLjUwNDEsMC42ODY1OSAtMC4wNSwwIC0wLjMxODEsLTAuMjY3ODkgLTAuNTk1MywtMC41OTUzMSB6IG0gMTAuODQ3OSwwIC0wLjUwNDEsLTAuNTk1MzEgMC41OTU0LDAuNTA0MDMgYyAwLjU1OTQsMC40NzM2NiAwLjcxNTcsMC42ODY1OSAwLjUwNCwwLjY4NjU5IC0wLjA1LDAgLTAuMzE4MSwtMC4yNjc4OSAtMC41OTUzLC0wLjU5NTMxIHogbSAtNS44MjA5LC02LjA4NTQyIC0wLjUwNCwtMC41OTUzMSAwLjU5NTMsMC41MDQwMyBjIDAuNTU5NSwwLjQ3MzY2IDAuNzE1OCwwLjY4NjYgMC41MDQxLDAuNjg2NiAtMC4wNSwwIC0wLjMxODIsLTAuMjY3ODkgLTAuNTk1NCwtMC41OTUzMiB6IE0gLTE2MTMuMTkzOCwtODI5LjE0NCBjIDAuMDEsLTAuNDM2NTYgMC4wNjUsLTAuNTgzMTMgMC4xMzE4LC0wLjMyNTcgMC4wNjcsMC4yNTc0NCAwLjA2MywwLjYxNDYyIC0wLjAxLDAuNzkzNzUgLTAuMDcyLDAuMTc5MTQgLTAuMTI3MywtMC4wMzE1IC0wLjEyMTksLTAuNDY4MDUgeiIKICAgICAgICAgICAgIGlkPSJwYXRoNzQ3OSIgLz48cGF0aAogICAgICAgICAgICAgc3R5bGU9ImRpc3BsYXk6aW5saW5lO2ZpbGw6IzAwMDAwMDtmaWxsLW9wYWNpdHk6MTtzdHJva2Utd2lkdGg6MC4yNjQ1ODMiCiAgICAgICAgICAgICBkPSJtIC0xNDUxLjc3ODQsLTUyMS4yMjAwNiBjIDAuMjU3NCwtMC4wNjcxIDAuNjE0NiwtMC4wNjI3IDAuNzkzOCwwLjAxIDAuMTc5MSwwLjA3MjUgLTAuMDMyLDAuMTI3MzQgLTAuNDY4MSwwLjEyMTk3IC0wLjQzNjYsLTAuMDA1IC0wLjU4MzEsLTAuMDY0NyAtMC4zMjU3LC0wLjEzMTc5IHogbSAtNTkuOTMzMSwtNS44MjQyIGMgMC4zMjc0LC0wLjA2MzEgMC44NjMyLC0wLjA2MzEgMS4xOTA2LDAgMC4zMjc0LDAuMDYzIDAuMDYsMC4xMTQ2NSAtMC41OTUzLDAuMTE0NjUgLTAuNjU0OSwwIC0wLjkyMjgsLTAuMDUxNiAtMC41OTUzLC0wLjExNDY1IHogbSA1LjQyMzksMC4wMDQgYyAwLjI1NDcsLTAuMDY2NiAwLjY3MTQsLTAuMDY2NiAwLjkyNjEsMCAwLjI1NDYsMC4wNjY1IDAuMDQ2LDAuMTIwOTkgLTAuNDYzMSwwLjEyMDk5IC0wLjUwOTMsMCAtMC43MTc2LC0wLjA1NDQgLTAuNDYzLC0wLjEyMDk5IHogbSAtMjQuNjAxMiwtMi4xMTc2NSBjIDAuMjU3NCwtMC4wNjcxIDAuNjE0NiwtMC4wNjI3IDAuNzkzNywwLjAxIDAuMTc5MiwwLjA3MjUgLTAuMDMxLDAuMTI3MzQgLTAuNDY4LDAuMTIxOTcgLTAuNDM2NiwtMC4wMDUgLTAuNTgzMSwtMC4wNjQ3IC0wLjMyNTcsLTAuMTMxNzkgeiBtIDEzMC41MDA3LC03Ljc1NDA0IGMgMC41Njg0LC0wLjU4MjA4IDEuMDkzLC0xLjA1ODMzIDEuMTY1NywtMS4wNTgzMyAwLjA3MywwIC0wLjMzMjcsMC40NzYyNSAtMC45MDExLDEuMDU4MzMgLTAuNTY4NCwwLjU4MjA5IC0xLjA5MywxLjA1ODM0IC0xLjE2NTcsMS4wNTgzNCAtMC4wNzMsMCAwLjMzMjcsLTAuNDc2MjUgMC45MDExLC0xLjA1ODM0IHogbSAtMzcuODYwNiwtNTUuNjI4NjQgLTAuNTA0LC0wLjU5NTMyIDAuNTk1MywwLjUwNDA0IGMgMC41NTk1LDAuNDczNjUgMC43MTU4LDAuNjg2NTkgMC41MDQxLDAuNjg2NTkgLTAuMDUsMCAtMC4zMTgyLC0wLjI2Nzg5IC0wLjU5NTQsLTAuNTk1MzEgeiBtIC01LjE0ODQsLTUuNDIzOTYgLTAuOTExOCwtMC45OTIxOSAwLjk5MjEsMC45MTE4MSBjIDAuOTIzNiwwLjg0ODY4IDEuMTEzOSwxLjA3MjU3IDAuOTExOSwxLjA3MjU3IC0wLjA0NCwwIC0wLjQ5MDcsLTAuNDQ2NDkgLTAuOTkyMiwtMC45OTIxOSB6IG0gOC4wNjc0LC0yLjc3ODEzIC0wLjc3NzIsLTAuODU5ODkgMC44NTk5LDAuNzc3MTEgYyAwLjgwMTYsMC43MjQzNyAwLjk4MTYsMC45NDI2OCAwLjc3NzEsMC45NDI2OCAtMC4wNDUsMCAtMC40MzI0LC0wLjM4Njk1IC0wLjg1OTgsLTAuODU5OSB6IG0gLTUuNTY0OCwtNS44MjA4MyAtMC41MDQsLTAuNTk1MzEgMC41OTUzLDAuNTA0MDMgYyAwLjU1OTQsMC40NzM2NiAwLjcxNTcsMC42ODY1OSAwLjUwNCwwLjY4NjU5IC0wLjA1LDAgLTAuMzE4MSwtMC4yNjc4OSAtMC41OTUzLC0wLjU5NTMxIHogbSAtMjMyLjY3NTksLTk1LjI1NjYyIGMgMCwtMC4wNCAwLjkyMjcsLTAuOTYyNzYgMi4wNTA1LC0yLjA1MDUyIGwgMi4wNTA1LC0xLjk3Nzc2IC0xLjk3NzcsMi4wNTA1MiBjIC0xLjgzNjksMS45MDQ0OCAtMi4xMjMzLDIuMTcxMjUgLTIuMTIzMywxLjk3Nzc2IHogbSAyMy40MTU2LC0xOC4xODM0OSBjIDAuMjYzNCwtMC4yOTEwNCAwLjUzODQsLTAuNTI5MTYgMC42MTEyLC0wLjUyOTE2IDAuMDczLDAgLTAuMDgzLDAuMjM4MTIgLTAuMzQ2NiwwLjUyOTE2IC0wLjI2MzQsMC4yOTEwNSAtMC41Mzg0LDAuNTI5MTcgLTAuNjExMiwwLjUyOTE3IC0wLjA3MywwIDAuMDgzLC0wLjIzODEyIDAuMzQ2NiwtMC41MjkxNyB6IG0gMS44NTIxLC0xLjg1MjA4IGMgMC4yNjM0LC0wLjI5MTA0IDAuNTM4NCwtMC41MjkxNyAwLjYxMTIsLTAuNTI5MTcgLTAuMTc1NCwwLjQ0NjU3IC0wLjU0MzEsMC43NTk3NiAtMC45NTc4LDEuMDU4MzQgLTAuMDczLDAgMC4wODMsLTAuMjM4MTMgMC4zNDY2LC0wLjUyOTE3IHogbSAxNDcuMjQwNiwtNC4xMDEwNCBjIC0wLjY0MjYsLTAuNjU0ODQgLTEuMTA4OSwtMS4xOTA2MyAtMS4wMzYyLC0xLjE5MDYzIDAuMDczLDAgMC42NTgxLDAuNTM1NzkgMS4zMDA4LDEuMTkwNjMgMC42NDI3LDAuNjU0ODQgMS4xMDksMS4xOTA2MiAxLjAzNjIsMS4xOTA2MiAtMC4wNzMsMCAtMC42NTgxLC0wLjUzNTc4IC0xLjMwMDgsLTEuMTkwNjIgeiBtIC0xMjIuODk4OSwtMjUuNTMyMjkgYyAwLjI2MzQsLTAuMjkxMDQgMC41Mzg0LC0wLjUyOTE3IDAuNjExMiwtMC41MjkxNyAwLjA3MywwIC0wLjA4MywwLjIzODEzIC0wLjM0NjYsMC41MjkxNyAtMC4yNjM0LDAuMjkxMDQgLTAuNTM4NSwwLjUyOTE2IC0wLjYxMTIsMC41MjkxNiAtMC4wNzMsMCAwLjA4MywtMC4yMzgxMiAwLjM0NjYsLTAuNTI5MTYgeiBtIC0xMC4wNTQyLC0xLjA1ODM0IGMgMC4yNjM0LC0wLjI5MTA0IDAuNTM4NCwtMC41MjkxNiAwLjYxMTIsLTAuNTI5MTYgMC4wNzMsMCAtMC4wODMsMC4yMzgxMiAtMC4zNDY2LDAuNTI5MTYgLTAuMjYzNCwwLjI5MTA1IC0wLjUzODQsMC41MjkxNyAtMC42MTEyLDAuNTI5MTcgLTAuMDczLDAgMC4wODMsLTAuMjM4MTIgMC4zNDY2LC0wLjUyOTE3IHogbSA0OS4xODc0LC0xMTEuNzIwMzEgLTAuNTA0MSwtMC41OTUzMSAwLjQ0MDEsMC40NDY5OCBjIDAuMzI3NCwwLjI3NzIxIDAuNzUwNiwwLjYwMjE1IDAuNzUwNiwwLjY1MjM2IDAsMC4yMTE3MyAtMC4yMTMsMC4wNTU0IC0wLjY4NjYsLTAuNTA0MDMgeiIKICAgICAgICAgICAgIGlkPSJwYXRoNzQ3NyIKICAgICAgICAgICAgIHNvZGlwb2RpOm5vZGV0eXBlcz0iY2NjY2NjY3Njc2Nzc2NjY2Njc3Nzc3NzY2Nzc3NjY3NzY2Njc2NzY3Nzc3NzY3NzY3Njc2NjY2NjY3Nzc2Njc2NzY2NzY3NjY2Njc2MiIC8+PHBhdGgKICAgICAgICAgICAgIGlkPSJwYXRoNzQ3NSIKICAgICAgICAgICAgIHN0eWxlPSJkaXNwbGF5OmlubGluZTtmaWxsOiMwMDAwMDA7ZmlsbC1vcGFjaXR5OjE7c3Ryb2tlLXdpZHRoOjAuMjY0NTgzIgogICAgICAgICAgICAgZD0ibSAtMTU5Mi45OTgsLTg2OC4wOTk2MSBjIC0zLjcyNDgsMC4yNzc1NSAtNi44MDI1LDIuODI2OTEgLTkuMDAwNyw1LjY3NDI5IC0zLjcxNjgsNC44Njk3NCAtNS45Nzc0LDEwLjY1Mzk2IC03LjkzNzYsMTYuNDA1OTEgLTEuNzU4NCw1LjI3NjM5IC0zLjI3MDUsMTAuNjkxODQgLTMuNjAyNiwxNi4yNjkzNSAtMC41NDQ2LDUuOTgxNCAtMi4wNTM0LDExLjc4MDk3IC0zLjY5MDgsMTcuNTYwNTkgLTEuODg1Myw2LjU5NzEzIC00LjIxNzUsMTMuMDUzNTcgLTYuNTY3MiwxOS40OTUxNiAtMy44ODM3LDExLjEzMjkxIC00Ljk1NzcsMjIuOTY0NDggLTUuODYwMywzNC42NDUxMiAwLjA5NiwwLjgxODI0IC0wLjgxNjIsMS4xNzQ4NCAtMS4yNDA1LDEuNzU0ODMgLTIuNTAyOCwyLjU4NTU1IC01LjI4NTIsNS4wNjQyNiAtNi44ODkyLDguMzQ0NjUgLTEuMzMyNCwzLjA4NDEgLTEuNTcyLDYuNDg4NDkgLTIuMzQxNCw5LjczMDI1IC0xLjU5NzMsNy4yNzkyMyAtNS41OTI4LDEzLjgxNDU1IC0xMS4yNTAyLDE4LjY2ODkgLTMuODI1OSwzLjM3MTUyIC04LjQyOTEsNS42NjEzIC0xMi41MjUxLDguNjY0ODQgLTQuOTUxNSwzLjQ1MzE3IC05LjEyMyw3Ljg3NTE5IC0xMy4xMjk5LDEyLjM1NTA1IC04LjY1ODksOS45NDc0NiAtMTUuOTE4MywyMS4wMjM5MSAtMjIuNjA0MywzMi4zNjYwNyAtNC44MTg4LDguMTg4OTkgLTkuMTU4OCwxNi42NTE0OSAtMTQuMDUyNSwyNC43ODc2OSAtMy41NTUzLDUuOTg2ODQgLTcuMjY0NCwxMS45MDY0NyAtMTEuNTQxLDE3LjQwNDU4IC0zLjgwODYsNS4xMDU3MyAtNy4zMDE1LDEwLjQ0MzIgLTEwLjQzNzYsMTUuOTg4MTcgLTcuMDU1OSwxMi4zODk2IC0xMy4yNTMyLDI1LjI2NjQ5IC0xOC42MTI4LDM4LjQ3NjU2IC0zLjA3MDcsNy40OTExMSAtNS40MDk1LDE1LjIwNDIyIC04LjUxMjUsMjIuNjY0MzMgLTQuODAyNiwxMS41MzAzNiAtMTAuNTM1NiwyMi42NjI5NyAtMTYuMTEzOSwzMy44NDk4IC0zLjY0NDUsNy4xNTc4NyAtNy4yMDcxLDE0LjM2MjQ5IC0xMS4wOTUxLDIxLjM5MjgzIC0wLjk5ODIsMS43OTUzMyAtMi4wMzQ4LDMuNTY4ODQgLTIuOTcxNCw1LjM5NzUyIDI0Ljk1NDIsMC4wOTg3IDQ5LjkwODksMC4wNTgyIDc0Ljg2MzMsMC4wNzk1IDQxLjkzMDMsMC4wMDggODMuODYwNywwLjAzMzkgMTI1Ljc5MSwtMC4wMzE4IDcuNzQ0OSwtMC4wNDI3IDE1LjQ5MjYsMC4wMTY2IDIzLjIzNTIsLTAuMTk3MDEgMC42ODA3LC0wLjA5OTkgMS41OTc4LDAuMTEzNjggMi4wNjM2LC0wLjQ3NTc0IDAuMTcxNywtMC43NjkyNCAtMC4xMTgsLTEuNjE5NTUgLTAuMTQ3MSwtMi40MTkyNSAtMS4wMzYsLTkuNDM1MzQgLTIuOTA0NCwtMTguNzczMDUgLTUuNDI1NywtMjcuOTE4OTkgLTAuNTIyNSwtMS44NTYxMSAtMS4xMTY2LC0zLjY4OTUxIC0xLjY5NDgsLTUuNTI4OTUgMi42MDU5LC00Ljk5Mjg0IDUuMTY1NiwtMTAuMTk2NTcgOS4zMDc2LC0xNC4xMjI2NSAxLjE1MzUsLTAuOTQ5NTUgMi4zOTQ3LC0yLjEyMjYzIDMuOTY4MiwtMi4xODMzOCAxLjc3OTgsMC4yMTIwNiAzLjIzNjIsMS4zNTk0MiA0LjcwMjMsMi4yNDk0OCA0LjAzOTEsMi43NDM4MyA4LjI1NjMsNS40MzI2MiAxMy4wNSw2LjYyMjYyIDYuMTE3NywxLjYwMzAzIDEyLjYwNTEsMS43NjE5IDE4LjgzMjcsMi40NDMyOCA0LjI3NzMsMC4yNDU2OSA5LjU5NjEsMC43MzYxNSAxMy4yMzkxLDAuOTQ2MzYgNC40MDMsMC4xNTkzNCA3Ljk4MDksMC4yOTgzMyAxMi4zNDUxLDAuODM2IDkuNDE3NiwxLjM1OCAxOC4xMzg5LDUuMjc0NSAyNi45MDYyLDguNzk0NDcgNi45NTE4LDIuNzIwMzkgMTQuNDA1Miw0LjMwNjUzIDIxLjg5MjUsNC4wNjQ1MiA0Ljc0NjcsLTAuMDU4IDkuNDc4NCwtMS4xMzYxNiAxMy43MzM5LC0zLjI1NDQ0IDUuMjkwMiwtMi40Njg5NSA5Ljg2OSwtNi4xNjg3OSAxNS4wMzY5LC04Ljg1OTgyIDMuNDg4OSwtMS45MDgxNSA3LjExMjgsLTMuNDY1MjIgMTAuODc4OSwtNC43NTQ5MiA0LjA5NTIsLTEuMzk4NjQgNy43MjY2LC0zLjk1MDYgMTAuNzQxLC03LjAyMjgyIDIuODYzNywtMi45NDkyIDQuOTg0MywtNi44Nzg0IDQuODkyLC0xMS4wNzc0MyAtMC4wNjgsLTQuOTE2MDIgLTIuNjA2NCwtOS4zODIyNSAtNS41MDE4LC0xMy4xOTkyIC02LjgwMzksLTguODI0NyAtMTQuMTUxMywtMTcuMjE5NzUgLTIxLjU0NDQsLTI1LjU0Njk0IC02LjQyMjUsLTcuMjM1OTEgLTEzLjA0ODksLTE0LjI5MTU0IC0xOS42NzI1LC0yMS4zNDQ1MiAtNi45MjkzLC03LjUzNDcyIC0xMy44NDMxLC0xNS4zMjgwNyAtMTkuMDg4OSwtMjQuMTM5NDQgLTMuMzI0MywtNS40MDM3NiAtNS4yMDA4LC0xMS41MTUxMiAtNi44NzI5LC0xNy41ODk2MSAtMy42ODc5LC0xMy40MjgwNyAtNi40ODE2LC0yNy4xMzA0NSAtMTEuMjYsLTQwLjIzNTk5IC0yLjgwNTcsLTcuNDY2MjIgLTYuMjA0NSwtMTQuNzMzNSAtMTAuNDEzMiwtMjEuNTE1NDggLTUuMDk4MywtOC4yMDczMSAtMTEuNTA2NywtMTUuNjYzNTEgLTE5LjI0OTMsLTIxLjQ4NTUxIC04LjYxNjEsLTYuNjM1MDEgLTE3Ljg4NCwtMTIuNDUwNTggLTI3LjcwNTMsLTE3LjEyOTQgLTQuNTE2MiwtMi4xMzcwOSAtOS4xOTg1LC0zLjk3MjQ1IC0xNC4wNzU5LC01LjA5NzM2IC0yLjAzMDUsLTAuNDE0OTIgLTMuNDk0MiwtMi4wNTg4MSAtNC42MTgyLC0zLjY5MDYzIC0yLjA0MDUsLTMuMjY4NTkgLTIuNzk4MiwtNy4xMjQyNiAtMy41NDk0LC0xMC44NDk5NyAtMi4xNDQ3LC0xMS42NjE4NSAtMi45NjgxLC0yMy41MDgzOCAtNC42Mjk1LC0zNS4yNTE2MyAtMS43NzksLTEzLjEwNjkyIC00LjE2ODQsLTI2LjI4OTI1IC05LjM5MjYsLTM4LjUxNjE3IC0yLjM3NiwtNS41MjE1OSAtNS4wMzA1LC0xMC45NDY0NiAtOC4yMjQsLTE2LjA0NjE1IC0yLjAyNjUsLTMuMDc5MTcgLTQuMzgzOSwtNi4yNzQxIC03Ljg5MzYsLTcuNzQwNTUgLTEuNDMxMywtMC41ODU4NSAtMy4wMDMxLC0wLjgxMjYyIC00LjU0MzgsLTAuNzA3MDIgeiBtIDAuOTkwMiw4LjcwNzAzIGMgMS4xODcyLDAuNTE1OSAyLjA1MjUsMS42ODYzOSAyLjgxMTYsMi42MzM5NSAyLjYyNTMsMy42MjUgNC41NzU5LDcuNjA1MDggNi41MzIsMTEuNTg3MjYgMy4zODI4LDYuOTYyIDUuOTM0MSwxNC4yNzU4OCA3LjY0ODIsMjEuODA5ODcgMy4xNzg4LDEzLjk0MjggNC40Mjc3LDI4LjI4NjE0IDYuMTU1Myw0Mi40OTA3OCAwLjgzMTksNi43ODA3NCAxLjc3MzcsMTMuNjAwNDggMy44NDQsMjAuMTMwNzMgMS40MTc0LDQuMzkxMDkgMy42MzI1LDguODA4OSA3LjUzMDQsMTEuNDkzOSAxLjkyNTMsMS40NDkyNCA0LjIwNzksMi4zMTE4NyA2LjU1MTcsMi44MDE0MiA1Ljg3NDksMS40NzUxMyAxMS4zMTE0LDQuMDY5NTUgMTYuNjM1Myw2LjkyMjI4IDYuNzgzNSwzLjcwMjAxIDEzLjI1ODIsNy44OTk5NSAxOS40NDU4LDEyLjUwNDgxIDcuNTM5Myw1Ljc0MDk0IDE0LjEyNjcsMTIuODExNTQgMTguOTA3OCwyMS4wMTgzOSA0LjQ1OCw3LjYxMDc2IDguMTQwOSwxNS43MTI0NCAxMC43ODg1LDI0LjEwMDAyIDQuMjMzOSwxMy4xODA2NSA2LjkwMDUsMjYuODExNjYgMTAuOTIyOCw0MC4wNjUxOSAxLjMyMTEsNC4zNSAyLjk4MzQsOC42MTEzNCA1LjI4LDEyLjU0NTk4IDUuMzAxOCw5LjQyMDI2IDEyLjQxOSwxNy42NDUyOSAxOS42NTA1LDI1LjYxOTEyIDUuNjg1NCw2LjE5MjMxIDExLjU1MzUsMTIuMjIxNTMgMTcuMTYyNywxOC40ODY2MyA3LjgyMTUsOC42OTE4NCAxNS41MDYyLDE3LjU1MTYxIDIyLjg4MSwyNi42Mzg3IDIuMTUzOSwyLjczMDkzIDQuMzk3Nyw1LjUzMjcgNS41MjE2LDguODY5MzcgMC40MzM3LDIuMDE0NjkgMC4wMjIsNC4yNTM3OCAtMS4zOTIzLDUuODA2OTkgLTIuMjgxNSwyLjcwMDI1IC01LjI5NjcsNC42MDMwNyAtOC42MTcxLDUuODMzOTkgLTcuMTAyMiwyLjQ2Njk5IC0xMy43OTE0LDYuMDI2NjIgLTIwLjAxNzcsMTAuMjIxMjYgLTQuMzM3MywyLjkwOTc2IC05LjE2ODEsNS40MjQ3MSAtMTQuNDU0OSw1Ljg3MzQzIC01LjUxMjcsMC41MDA0NCAtMTEuMTgzMSwtMC4yODU5MiAtMTYuNDc4MSwtMS45ODQ0OCAtNi4yMiwtMS45Mzc4OCAtMTIuMDkxNSwtNC44MTQxMyAtMTguMjU1NiwtNi45MDczIC01Ljk4MzUsLTIuMTAzNDIgLTEyLjE3OTYsLTMuNzY3MTggLTE4LjUzODEsLTQuMTIzNTIgLTExLjU0NzIsLTAuOTA2NzkgLTIyLjgzOTMsLTEuNjEyOTUgLTMzLjk2NiwtMi43NzI2OCAtMy43MTYzLC0wLjMzMzAxIC03LjQ5MzUsLTEuMDQyOTIgLTEwLjc0NCwtMi45Njg5IC0zLjcyNjYsLTIuMTM1ODMgLTcuMTEyLC00LjkwNDkxIC0xMS4xNTA0LC02LjQ3MDI5IC0yLjEyNzIsLTAuODAzNjMgLTQuNTAwOSwtMC42NzA2NCAtNi42OTczLC0wLjI0NzQzIC0zLjI4MTcsMC45NTkwMyAtNS45Nzk3LDMuMjQ4NyAtOC4zMzQ5LDUuNjQ0NzkgLTIuOTAxLDIuOTU1MzUgLTUuMDQ2LDYuNTI0NDcgLTcuMDM4MywxMC4xMjY3NSAtMS40MzEzLDIuNjM0ODkgLTIuOTgwMyw1LjIyNDU2IC00LjE0OSw3Ljk4OTIzIC0wLjA2NSwwLjg2OTYxIDAuNDAwMywxLjcxMTYzIDAuNTkwMywyLjU1ODUxIDEuNzI1Miw1LjQ2NTU0IDMuMzEyNiwxMC45NjEwNiA0LjQ0NzgsMTYuNTU1ODkgMC42NDg3LDMuMTY4NTYgMS4zODY2LDYuNDAzMzcgMS44MDE4LDkuNTU5NDIgLTAuMjk0NCwwLjMxNzI0IC0xLjE4MDIsMC4wNDMgLTEuNywwLjEzNDc3IC02MS4yNTgzLC0wLjAxNjcgLTEyMi41MTY4LDAuMDQ4IC0xODMuNzc1LC0wLjA3NzQgLTUuMjc5OCwtMC4wMTM0IC0xMC41NTk4LC0wLjAxNzQgLTE1LjgzOTUsLTAuMDYxMiA3LjE5OTksLTE0LjcxNjkzIDE0LjgzNjEsLTI5LjIyOTE2IDIxLjUwNzYsLTQ0LjE5NzA3IDIuNTk5MiwtNS44MDk0MyA0LjgyMzksLTExLjc3MzY5IDYuODc5MywtMTcuNzk0NCA0Ljg1NDUsLTEzLjc4OTI4IDExLjExOTgsLTI3LjA3ODkgMTcuOTMwNiwtNDAuMDE4NDUgNC4yNzI1LC04LjA5NTIgOC45OTg4LC0xNS45ODkwNSAxNC42MjY1LC0yMy4yMTcxMiA3LjU4NjgsLTEwLjIwODg5IDEzLjczNzgsLTIxLjM3NDk4IDE5Ljg5NzgsLTMyLjQ3NTM0IDYuNzQ3MiwtMTIuMjYyMjkgMTQuMDg2NSwtMjQuMzMxNjEgMjIuNzg3MywtMzUuMzA3MTcgNC4yNzYsLTUuMzEwNjkgOC44NTk3LC0xMC40MzgyOSAxNC4xODcsLTE0LjcyMDYgNC44NTk3LC0zLjg2NjMxIDEwLjY3NDksLTYuNDEzOCAxNS4xODAyLC0xMC43NDU3NyAzLjYyNzcsLTMuMzQxOTYgNi45NDI1LC03LjExMTIxIDkuMTg1NCwtMTEuNTM1ODYgMi4yNzUsLTQuMTIyODMgMy44MzgyLC04LjYxNTA0IDQuNzAwMywtMTMuMjQwOTkgMC40NzY0LC0yLjE2ODkyIDAuNjIxOSwtNC40NTc4MSAxLjU2MTQsLTYuNDk1MjggMi4yMjU2LC0yLjk3NjA1IDUuMjUyNCwtNS4yNTYyMSA3LjQ3MDQsLTguMjM3OTEgMS4wNjk4LC0yLjAwNDM5IDEuMDk5MywtNC4zNTc1MiAxLjM3NzYsLTYuNTY0MTkgMC42NzA3LC04LjAzMiAxLjM2NywtMTYuMDQwNzEgMy4zNjY4LC0yMy44NzM2OCAxLjMzMTEsLTUuNDY2MzggMy40NDY4LC0xMC42ODc5MyA1LjMyMjMsLTE1Ljk3ODUyIDIuOTgzMSwtOC42Nzk0NyA1LjU5NDUsLTE3LjUzOCA2LjkyNDQsLTI2LjYzNjM0IDAuMzg1NiwtMy4wNjE4OCAwLjUzMiwtNi4xNTk5OSAxLjI1MDcsLTkuMTcyODYgMS4zOTYyLC02LjMxNjg5IDMuNTQ3OSwtMTIuNTMzNzQgNi41ODI3LC0xOC4yODI1OSAxLjEzNzksLTEuOTY2MzIgMi4zMTE5LC00LjE0ODQgNC4yMzYzLC01LjUyMzQ0IDAuMzMwMiwtMC4xNzQwNiAwLjY3OTUsLTAuNDAwNDQgMS4wNjQ1LC0wLjM5MjU4IHoiCiAgICAgICAgICAgICBzb2RpcG9kaTpub2RldHlwZXM9InNjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2Njc3NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjYyIgLz48L2c+PC9nPjxnCiAgICAgICAgIGlkPSJnNzcyNiIKICAgICAgICAgaW5rc2NhcGU6bGFiZWw9Imc3NzI2IgogICAgICAgICB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtNzcuOTI5MDI4LC00NjAuMDI4OTkpIgogICAgICAgICBzdHlsZT0iZmlsbDojMDAwMDAwO2ZpbGwtb3BhY2l0eToxO3N0cm9rZTojZjNmM2YzO3N0cm9rZS1vcGFjaXR5OjEiPjxnCiAgICAgICAgICAgaWQ9Imc3NzUyIgogICAgICAgICAgIHN0eWxlPSJmaWxsOiMwMDAwMDA7ZmlsbC1vcGFjaXR5OjE7c3Ryb2tlOiNmM2YzZjM7c3Ryb2tlLW9wYWNpdHk6MSI+PHBhdGgKICAgICAgICAgICAgIHN0eWxlPSJmaWxsOiMwMDAwMDA7ZmlsbC1vcGFjaXR5OjE7c3Ryb2tlOiNmM2YzZjM7c3Ryb2tlLXdpZHRoOjAuMjY0NTgzO3N0cm9rZS1vcGFjaXR5OjEiCiAgICAgICAgICAgICBkPSJtIDIzOC4wMjUzMSwxMjYuMTUzMzMgYyAzZS01LC0xOS4yMDg3NSAwLjAzMTUsLTI3LjAyNzg0NyAwLjA3LC0xNy4zNzU3NCAwLjAzODUsOS42NTIwOCAwLjAzODUsMjUuMzY4MzMgLTNlLTUsMzQuOTI1IC0wLjAzODUsOS41NTY2NCAtMC4wNywxLjY1OTQ5IC0wLjA3LC0xNy41NDkyNiB6IG0gOTIuNDc1NzQsMzEuMjUzMjIgYyAwLC0wLjA1NDkgMC4yMDgzNiwtMC4yNjMyOSAwLjQ2MzAyLC0wLjQ2MzAyIDAuNDE5NjUsLTAuMzI5MDkgMC40Mjg5OSwtMC4zMTk3NSAwLjA5OTksMC4wOTk5IC0wLjM0NTY1LDAuNDQwNzIgLTAuNTYyOTIsMC41ODA5IC0wLjU2MjkyLDAuMzYzMTIgeiBtIDI4LjAxMjA3LC0xLjE1Njg3IGMgLTAuMzI5MDksLTAuNDE5NjUgLTAuMzE5NzUsLTAuNDI4OTkgMC4wOTk5LC0wLjA5OTkgMC4yNTQ2NiwwLjE5OTczIDAuNDYzMDIsMC40MDgwOSAwLjQ2MzAyLDAuNDYzMDIgMCwwLjIxNzc4IC0wLjIxNzI4LDAuMDc3NiAtMC41NjI5MywtMC4zNjMxMiB6IG0gMjcuMTQwMzgsLTEzLjk1Njc3IGMgN2UtNSwtNS4wOTMyMiAwLjAzNTYsLTcuMTM5MzggMC4wNzksLTQuNTQ2OTkgMC4wNDM0LDIuNTkyMzggMC4wNDMzLDYuNzU5NTcgLTEuNmUtNCw5LjI2MDQxIC0wLjA0MzQsMi41MDA4NSAtMC4wNzg5LDAuMzc5ODEgLTAuMDc4OCwtNC43MTM0MiB6IG0gLTExOC42NTI0NSw2LjM4MjM5IGMgMCwtMC4wNTQ5IDAuMjA4MzYsLTAuMjYzMjkgMC40NjMwMiwtMC40NjMwMiAwLjQxOTY1LC0wLjMyOTA5IDAuNDI4OTksLTAuMzE5NzUgMC4wOTk5LDAuMDk5OSAtMC4zNDU2NSwwLjQ0MDcyIC0wLjU2MjkyLDAuNTgwOSAtMC41NjI5MiwwLjM2MzEyIHogbSA3Mi41NjI1NiwtMTguODE3OCBjIDAuMDAzLC0wLjU4MjA5IDAuMDU3MSwtMC43ODkwNyAwLjEyMDQxLC0wLjQ1OTkzIDAuMDYzMywwLjMyOTEyIDAuMDYwOSwwLjgwNTM3IC0wLjAwNSwxLjA1ODM0IC0wLjA2NjIsMC4yNTI5NCAtMC4xMTgwMSwtMC4wMTY0IC0wLjExNTA3LC0wLjU5ODQxIHogbSAtMzYuNTE3ODUsLTAuMTMyMjkgYyAwLC0wLjUwOTMzIDAuMDU0NSwtMC43MTc2OSAwLjEyMSwtMC40NjMwMiAwLjA2NjYsMC4yNTQ2NiAwLjA2NjYsMC42NzEzOCAwLDAuOTI2MDQgLTAuMDY2NiwwLjI1NDY2IC0wLjEyMSwwLjA0NjMgLTAuMTIxLC0wLjQ2MzAyIHogbSA0NC45NzkxNywtMS41ODc1IGMgMCwtMC41MDkzMyAwLjA1NDUsLTAuNzE3NjkgMC4xMjA5OSwtMC40NjMwMiAwLjA2NjYsMC4yNTQ2NiAwLjA2NjYsMC42NzEzOCAwLDAuOTI2MDQgLTAuMDY2NSwwLjI1NDY2IC0wLjEyMDk5LDAuMDQ2MyAtMC4xMjA5OSwtMC40NjMwMiB6IG0gLTE4LjU2MTM0LC0xLjQ3NzI1IGMgMC4wMTI3LC0wLjMwODI0IDAuMDc1NCwtMC4zNzA5MiAwLjE1OTg2LC0wLjE1OTg2IDAuMDc2NCwwLjE5MSAwLjA2NywwLjQxOTIgLTAuMDIwOSwwLjUwNzEyIC0wLjA4NzksMC4wODc5IC0wLjE1MDQ3LC0wLjA2ODQgLTAuMTM4OTksLTAuMzQ3MjYgeiBtIDE4LjU2MTM0LC0yLjIyNjkyIGMgMCwtMC41MDkzMiAwLjA1NDUsLTAuNzE3NjggMC4xMjA5OSwtMC40NjMwMiAwLjA2NjYsMC4yNTQ2NiAwLjA2NjYsMC42NzEzOCAwLDAuOTI2MDQgLTAuMDY2NSwwLjI1NDY2IC0wLjEyMDk5LDAuMDQ2MyAtMC4xMjA5OSwtMC40NjMwMiB6IG0gMzIuNDE2MjIsMC41OTU2OCBjIDIuNjU1NzYsLTAuMDQzMSA3LjAwMTU0LC0wLjA0MzEgOS42NTcyOSwwIDIuNjU1NzYsMC4wNDMyIDAuNDgyODcsMC4wNzg1IC00LjgyODY0LDAuMDc4NSAtNS4zMTE1MSwwIC03LjQ4NDQsLTAuMDM1MyAtNC44Mjg2NSwtMC4wNzg1IHogbSAtNzcuMzk1MzksLTIuNDQ3NzYgYyAwLC0wLjUwOTMzIDAuMDU0NSwtMC43MTc2OSAwLjEyMSwtMC40NjMwMiAwLjA2NjYsMC4yNTQ2NiAwLjA2NjYsMC42NzEzOCAwLDAuOTI2MDQgLTAuMDY2NiwwLjI1NDY2IC0wLjEyMSwwLjA0NjMgLTAuMTIxLC0wLjQ2MzAyIHogbSAzNi41MTc4NSwtMC4xMzIzIGMgMC4wMDMsLTAuNTgyMDggMC4wNTcxLC0wLjc4OTA2IDAuMTIwNDEsLTAuNDU5OTIgMC4wNjMzLDAuMzI5MTEgMC4wNjA5LDAuODA1MzYgLTAuMDA1LDEuMDU4MzMgLTAuMDY2MiwwLjI1Mjk0IC0wLjExODAxLC0wLjAxNjQgLTAuMTE1MDcsLTAuNTk4NDEgeiBtIC00Ni42MTI1MiwtMS42MDk1NCBjIDAuMDEyNywtMC4zMDgyMyAwLjA3NTQsLTAuMzcwOTEgMC4xNTk4NiwtMC4xNTk4NiAwLjA3NjQsMC4xOTEwMSAwLjA2NywwLjQxOTIxIC0wLjAyMDksMC41MDcxMyAtMC4wODc5LDAuMDg3OSAtMC4xNTA0NywtMC4wNjg0IC0wLjEzODk5LC0wLjM0NzI3IHogbSA0Ni4zMDIwOCwtMi45MTA0MSBjIDAuMDEyNywtMC4zMDgyNCAwLjA3NTQsLTAuMzcwOTIgMC4xNTk4NiwtMC4xNTk4NiAwLjA3NjQsMC4xOTEgMC4wNjcsMC40MTkyIC0wLjAyMDksMC41MDcxMiAtMC4wODc5LDAuMDg3OSAtMC4xNTA0NywtMC4wNjg0IC0wLjEzODk4LC0wLjM0NzI2IHogbSAtNzEuNzQyOTksLTEzLjgwMjQ0IC0wLjY0MTQzLC0wLjcyNzYgMC43Mjc2MSwwLjY0MTQyIGMgMC42ODAwNiwwLjU5OTUyIDAuODQ4OTQsMC44MTM3OCAwLjY0MTQzLDAuODEzNzggLTAuMDQ3NCwwIC0wLjM3NDgxLC0wLjMyNzQyIC0wLjcyNzYxLC0wLjcyNzYgeiBtIDU2LjM1NjI1LC0zLjE3NSAtMC42NDE0MywtMC43Mjc2IDAuNzI3NjEsMC42NDE0MiBjIDAuNjgwMDYsMC41OTk1MiAwLjg0ODk0LDAuODEzNzggMC42NDE0MywwLjgxMzc4IC0wLjA0NzQsMCAtMC4zNzQ4MSwtMC4zMjc0MiAtMC43Mjc2MSwtMC43Mjc2IHogbSAzNC42ODA0NSwtNC42NjM5NyBjIDAsLTAuMDU0OTMgMC4yMDgzNiwtMC4yNjMyODcgMC40NjMwMiwtMC40NjMwMiAwLjQxOTY2LC0wLjMyOTA4OSAwLjQyOSwtMC4zMTk3NDkgMC4wOTk5LDAuMDk5OTEgLTAuMzQ1NjUsMC40NDA3MTcgLTAuNTYyOTMsMC41ODA4OTMgLTAuNTYyOTMsMC4zNjMxMTQgeiBtIC01Ny4xNSwtMC43OTM3NSBjIDAsLTAuMDU0OTMgMC4yMDgzNiwtMC4yNjMyODYgMC40NjMwMiwtMC40NjMwMiAwLjQxOTY2LC0wLjMyOTA4OSAwLjQyOSwtMC4zMTk3NDkgMC4wOTk5LDAuMDk5OTEgLTAuMzQ1NjUsMC40NDA3MTcgLTAuNTYyOTMsMC41ODA4OTMgLTAuNTYyOTMsMC4zNjMxMTQgeiBtIC0xLjg2NjMyLC0yNy44Nzk3OCAtMC45MTE4MSwtMC45OTIxODcgMC45OTIxOSwwLjkxMTc5OSBjIDAuNTQ1NzEsMC41MDE0ODggMC45OTIxOSwwLjk0Nzk3MyAwLjk5MjE5LDAuOTkyMTg3IDAsMC4yMDIwNDEgLTAuMjIzODksMC4wMTE2OSAtMS4wNzI1NywtMC45MTE3OTkgeiBtIDQuNTMzMDMsLTEyLjkyMDQ4NSBjIDAuMDEyNywtMC4zMDgyMjYgMC4wNzU0LC0wLjM3MDkxOSAwLjE1OTg2LC0wLjE1OTg1MyAwLjA3NjQsMC4xOTA5OTUgMC4wNjcsMC40MTkyIC0wLjAyMDksMC41MDcxMTkgLTAuMDg3OSwwLjA4NzkyIC0wLjE1MDQ3LC0wLjA2ODM1IC0wLjEzODk5LC0wLjM0NzI2NiB6IG0gMjQuNDAyNzgsLTIuODg4MzY5IGMgMC4wMDMsLTAuODczMTI1IDAuMDUwOSwtMS4xOTg0MTQgMC4xMDk3NSwtMC43MjI4NjUgMC4wNTg5LDAuNDc1NTQ5IDAuMDU3NywxLjE4OTkyNCAtMC4wMDMsMS41ODc1IC0wLjA2MDQsMC4zOTc1NzYgLTAuMTA4NTMsMC4wMDg1IC0wLjEwNzA1LC0wLjg2NDYzNSB6IG0gLTM0LjE1MTg2LC0xLjcxOTc5MSBjIDAsLTAuNTA5MzIzIDAuMDU0NSwtMC43MTc2ODMgMC4xMjEsLTAuNDYzMDIxIDAuMDY2NiwwLjI1NDY2MSAwLjA2NjYsMC42NzEzOCAwLDAuOTI2MDQyIC0wLjA2NjYsMC4yNTQ2NjEgLTAuMTIxLDAuMDQ2MyAtMC4xMjEsLTAuNDYzMDIxIHogbSAxOS42NDcyMiwtOTEuNDEzNTQgYyAwLC0yNi4xOTM3NDkgMC4wMzEsLTM2Ljk0ODU3NyAwLjA2OSwtMjMuODk5NjE5IDAuMDM3OSwxMy4wNDg5NTYgMC4wMzc5LDM0LjQ4MDIwNiAwLDQ3LjYyNDk5OSAtMC4wMzc5LDEzLjE0NDc5MSAtMC4wNjksMi40NjgzNyAtMC4wNjksLTIzLjcyNTM4IHogbSAzMy41NTQxOSw0NC4xMTk4OTQ0IGMgMS44NjM4NiwtMC4wNDU1NDUgNC44NDA0MiwtMC4wNDU0MTMgNi42MTQ1OSwyLjY0NmUtNCAxLjc3NDE2LDAuMDQ1NzA3IDAuMjQ5MTgsMC4wODI5NzEgLTMuMzg4ODQsMC4wODI4MDkgLTMuNjM4MDIsLTEuNjE0ZS00IC01LjA4OTYsLTAuMDM3NTU4IC0zLjIyNTc1LC0wLjA4MzEwMyB6IG0gMzkuNDIxMjUsNS4yOTJlLTQgYyAxLjQyNjQsLTAuMDQ3NjY1IDMuNjg4NTksLTAuMDQ3NDU2IDUuMDI3MDksNS4yOTJlLTQgMS4zMzg1MiwwLjA0NzkxOSAwLjE3MTQ3LDAuMDg2OTE4IC0yLjU5MzQyLDAuMDg2NjY0IC0yLjc2NDksLTIuNTRlLTQgLTMuODYwMDMsLTAuMDM5NDYzIC0yLjQzMzY3LC0wLjA4NzEyNyB6IgogICAgICAgICAgICAgaWQ9InBhdGg3NzQwIiAvPjxwYXRoCiAgICAgICAgICAgICBzdHlsZT0iZmlsbDojMDAwMDAwO2ZpbGwtb3BhY2l0eToxO3N0cm9rZTojZjNmM2YzO3N0cm9rZS13aWR0aDowLjI2NDU4MztzdHJva2Utb3BhY2l0eToxIgogICAgICAgICAgICAgZD0ibSAzOTQuOTE4NTcsMTQwLjE3NjI1IGMgNWUtNSwtOC4yOTQ2OSAwLjAzMzYsLTExLjY0OTc0IDAuMDc0NSwtNy40NTU2NCAwLjA0MSw0LjE5NDA5IDAuMDQwOSwxMC45ODA2NSAtOGUtNSwxNS4wODEyNSAtMC4wNDEsNC4xMDA1OSAtMC4wNzQ1LDAuNjY5MDcgLTAuMDc0NSwtNy42MjU2MSB6IG0gLTMwLjMyMDAzLDkuOTg4MDIgYyAtMC4zMjkwOSwtMC40MTk2NiAtMC4zMTk3NSwtMC40MjkgMC4wOTk5LC0wLjA5OTkgMC4yNTQ2NiwwLjE5OTc0IDAuNDYzMDIsMC40MDgwOSAwLjQ2MzAyLDAuNDYzMDIgMCwwLjIxNzc4IC0wLjIxNzI3LDAuMDc3NiAtMC41NjI5MiwtMC4zNjMxMSB6IG0gMTAuOTg3NDgsLTIxLjEwMDUyIGMgMCwtMi4xODI4MSAwLjA0MTMsLTMuMDQwNTcgMC4wOTExLC0xLjkwNjE0IDAuMDQ5NywxLjEzNDQzIDAuMDQ5NCwyLjkyMDM3IDAsMy45Njg3NSAtMC4wNTAxLDEuMDQ4MzkgLTAuMDkwOCwwLjEyMDIgLTAuMDkwNCwtMi4wNjI2MSB6IG0gLTcyLjU4MDc2LDEuODMwMDQgYyAwLjAxMjcsLTAuMzA4MjQgMC4wNzU0LC0wLjM3MDkyIDAuMTU5ODYsLTAuMTU5ODYgMC4wNzY0LDAuMTkxIDAuMDY3LDAuNDE5MjEgLTAuMDIwOSwwLjUwNzEzIC0wLjA4NzksMC4wODc5IC0wLjE1MDQ2LC0wLjA2ODQgLTAuMTM4OTgsLTAuMzQ3MjcgeiBtIC0xOS44MjI4NSwtMC45MDQgYyAwLC0wLjM2MzggMC4wNjAxLC0wLjUxMjYzIDAuMTMzNDUsLTAuMzMwNzMgMC4wNzM0LDAuMTgxOSAwLjA3MzQsMC40Nzk1NiAwLDAuNjYxNDYgLTAuMDczNCwwLjE4MTkgLTAuMTMzNDUsMC4wMzMxIC0wLjEzMzQ1LC0wLjMzMDczIHogTSAzMjkuNTE4MzgsMTI4LjI3IGMgMC4wMDMsLTAuNzI3NjEgMC4wNTM0LC0wLjk5Mzg2IDAuMTE0MiwtMC41OTE2OSAwLjA2MDgsMC40MDIxOSAwLjA1OTIsMC45OTc1MSAtMC4wMDQsMS4zMjI5MiAtMC4wNjI4LDAuMzI1NDMgLTAuMTEyNTUsLTAuMDA0IC0wLjExMDU3LC0wLjczMTIzIHogbSAxMC4wMzk4OCwtMC4xMzIyOSBjIDAsLTAuNTA5MzMgMC4wNTQ0LC0wLjcxNzY5IDAuMTIxLC0wLjQ2MzAyIDAuMDY2NiwwLjI1NDY2IDAuMDY2NiwwLjY3MTM4IDAsMC45MjYwNCAtMC4wNjY2LDAuMjU0NjYgLTAuMTIxLDAuMDQ2MyAtMC4xMjEsLTAuNDYzMDIgeiBtIDguNDc3MzYsLTEuODUyMDkgYyAwLC0wLjY1NDg0IDAuMDUxNiwtMC45MjI3MyAwLjExNDY0LC0wLjU5NTMxIDAuMDYzMSwwLjMyNzQyIDAuMDYzMSwwLjg2MzIgMCwxLjE5MDYzIC0wLjA2MywwLjMyNzQyIC0wLjExNDY0LDAuMDU5NSAtMC4xMTQ2NCwtMC41OTUzMiB6IG0gMTAuMDQzNDgsMCBjIDAsLTAuNTA5MzIgMC4wNTQ1LC0wLjcxNzY4IDAuMTIwOTksLTAuNDYzMDIgMC4wNjY2LDAuMjU0NjYgMC4wNjY2LDAuNjcxMzggMCwwLjkyNjA0IC0wLjA2NjUsMC4yNTQ2NyAtMC4xMjA5OSwwLjA0NjMgLTAuMTIwOTksLTAuNDYzMDIgeiBtIC04NC45NDEwNywtMC4xMzIyOSBjIDAuMDA1LC0wLjQzNjU2IDAuMDY0NywtMC41ODMxMSAwLjEzMTc5LC0wLjMyNTcgMC4wNjcxLDAuMjU3NDQgMC4wNjI3LDAuNjE0NjMgLTAuMDEsMC43OTM3NSAtMC4wNzI1LDAuMTc5MTUgLTAuMTI3MzQsLTAuMDMxNSAtMC4xMjE5NywtMC40NjgwNSB6IG0gNTYuMzgzOTgsLTEuOTg0MzcgYyAwLC0wLjgwMDM3IDAuMDQ5NiwtMS4xMjc3OSAwLjExMDIyLC0wLjcyNzYxIDAuMDYwNiwwLjQwMDE4IDAuMDYwNiwxLjA1NTAzIDAsMS40NTUyMSAtMC4wNjA2LDAuNDAwMTggLTAuMTEwMjIsMC4wNzI4IC0wLjExMDIyLC0wLjcyNzYgeiBtIDEwLjAzNjI1LDAgYyAwLC0wLjUwOTMzIDAuMDU0NCwtMC43MTc2OSAwLjEyMSwtMC40NjMwMiAwLjA2NjYsMC4yNTQ2NiAwLjA2NjYsMC42NzEzOCAwLDAuOTI2MDQgLTAuMDY2NiwwLjI1NDY2IC0wLjEyMSwwLjA0NjMgLTAuMTIxLC0wLjQ2MzAyIHogbSAtNTYuMzc1ODUsLTEuODUyMDkgYyAwLC0wLjM2MzggMC4wNjAxLC0wLjUxMjYzIDAuMTMzNDUsLTAuMzMwNzMgMC4wNzM0LDAuMTgxOSAwLjA3MzQsMC40Nzk1NiAwLDAuNjYxNDYgLTAuMDczNCwwLjE4MTkgLTAuMTMzNDUsMC4wMzMxIC0wLjEzMzQ1LC0wLjMzMDczIHogbSAxOS44MjI4NSwtMC45NDgwOCBjIDAuMDEyNywtMC4zMDgyNCAwLjA3NTQsLTAuMzcwOTIgMC4xNTk4NiwtMC4xNTk4NiAwLjA3NjQsMC4xOTEgMC4wNjcsMC40MTkyMSAtMC4wMjA5LDAuNTA3MTMgLTAuMDg3OSwwLjA4NzkgLTAuMTUwNDYsLTAuMDY4NCAtMC4xMzg5OCwtMC4zNDcyNyB6IE0gMzEzLjUxODEsOTAuMTIxNTU0IGMgMC4xOTEwMSwtMC4wNzY0NCAwLjQxOTIxLC0wLjA2NzA1IDAuNTA3MTMsMC4wMjA5IDAuMDg3OSwwLjA4NzkyIC0wLjA2ODQsMC4xNTA0NjggLTAuMzQ3MjYsMC4xMzg5ODUgLTAuMzA4MjQsLTAuMDEyNyAtMC4zNzA5MiwtMC4wNzU0MSAtMC4xNTk4NywtMC4xNTk4NjEgeiBNIDI0Mi41MjMyMywzNy41MTc5MTcgYyAyZS01LC0xOS4yMDg3NSAwLjAzMTUsLTI3LjAyNzg0MSAwLjA3LC0xNy4zNzU3NTYgMC4wMzg1LDkuNjUyMDg0IDAuMDM4NSwyNS4zNjgzMzQgLTNlLTUsMzQuOTI0OTk5IC0wLjAzODUsOS41NTY2NjUgLTAuMDY5OSwxLjY1OTUwNiAtMC4wNjk5LC0xNy41NDkyNDMgeiBtIDg1LjkwMjkzLDE2LjI3MTg3NCBjIDAsLTAuMzYzODAyIDAuMDYwMSwtMC41MTI2MyAwLjEzMzQ1LC0wLjMzMDcyOSAwLjA3MzQsMC4xODE5MDEgMC4wNzM0LDAuNDc5NTU3IDAsMC42NjE0NTkgLTAuMDczNCwwLjE4MTkwMSAtMC4xMzM0NSwwLjAzMzA3IC0wLjEzMzQ1LC0wLjMzMDczIHogTSAyOTQuMzA0Nyw0OC42MzA0MTYgYyAwLjAwNSwtMC40MzY1NjIgMC4wNjQ3LC0wLjU4MzEyNSAwLjEzMTc5LC0wLjMyNTY5NCAwLjA2NzEsMC4yNTc0MzIgMC4wNjI3LDAuNjE0NjE5IC0wLjAxLDAuNzkzNzUgLTAuMDcyNSwwLjE3OTEzMSAtMC4xMjczNSwtMC4wMzE0OSAtMC4xMjE5OCwtMC40NjgwNTYgeiBtIC01MS43ODE0NywtOTkuNDgzMzMxIGMgMmUtNSwtMTkuMjA4NzQ5IDAuMDMxNSwtMjcuMDI3ODQgMC4wNywtMTcuMzc1NzU2IDAuMDM4NSw5LjY1MjA4NSAwLjAzODUsMjUuMzY4MzM1IC0zZS01LDM0LjkyNSAtMC4wMzg1LDkuNTU2NjY1IC0wLjA2OTksMS42NTk1MDYgLTAuMDY5OSwtMTcuNTQ5MjQ0IHoiCiAgICAgICAgICAgICBpZD0icGF0aDc3MzgiIC8+PHBhdGgKICAgICAgICAgICAgIHN0eWxlPSJmaWxsOiMwMDAwMDA7ZmlsbC1vcGFjaXR5OjE7c3Ryb2tlOiNmM2YzZjM7c3Ryb2tlLXdpZHRoOjAuMjY0NTgzO3N0cm9rZS1vcGFjaXR5OjEiCiAgICAgICAgICAgICBkPSJtIDMwMS4wOTg1NCwxNTYuNTE0MjcgYyAtMC4zMjkwOSwtMC40MTk2NiAtMC4zMTk3NSwtMC40MjkgMC4wOTk5LC0wLjA5OTkgMC40NDA3MiwwLjM0NTY1IDAuNTgwOSwwLjU2MjkzIDAuMzYzMTIsMC41NjI5MyAtMC4wNTQ5LDAgLTAuMjYzMjksLTAuMjA4MzYgLTAuNDYzMDIsLTAuNDYzMDIgeiBtIDc0LjMzMjA2LC0yLjA5ODk3IGMgMC4xOTEwMSwtMC4wNzY0IDAuNDE5MjEsLTAuMDY3IDAuNTA3MTMsMC4wMjA5IDAuMDg3OSwwLjA4NzkgLTAuMDY4NCwwLjE1MDQ3IC0wLjM0NzI2LDAuMTM4OTkgLTAuMzA4MjQsLTAuMDEyNyAtMC4zNzA5MiwtMC4wNzU0IC0wLjE1OTg3LC0wLjE1OTg2IHogbSAtNjcuMTg4MzEsLTMuMTkyNyBjIC0wLjMyOTA5LC0wLjQxOTY1IC0wLjMxOTc1LC0wLjQyODk5IDAuMDk5OSwtMC4wOTk5IDAuNDQwNzIsMC4zNDU2NiAwLjU4MDksMC41NjI5MyAwLjM2MzEyLDAuNTYyOTMgLTAuMDU0OSwwIC0wLjI2MzI5LC0wLjIwODM2IC0wLjQ2MzAyLC0wLjQ2MzAyIHogbSAtNS4yMzcwMywtMTkuNTM1MDYgYyAwLjAxMjcsLTAuMzA4MjQgMC4wNzU0LC0wLjM3MDkyIDAuMTU5ODYsLTAuMTU5ODYgMC4wNzY0LDAuMTkxIDAuMDY3LDAuNDE5MjEgLTAuMDIwOSwwLjUwNzEzIC0wLjA4NzksMC4wODc5IC0wLjE1MDQ2LC0wLjA2ODQgLTAuMTM4OTgsLTAuMzQ3MjcgeiBtIC0xMC4wMTM2NiwtMS42OTc3NSBjIDAsLTAuNTA5MzIgMC4wNTQ0LC0wLjcxNzY4IDAuMTIwOTksLTAuNDYzMDIgMC4wNjY2LDAuMjU0NjYgMC4wNjY2LDAuNjcxMzggMCwwLjkyNjA0IC0wLjA2NjUsMC4yNTQ2NiAtMC4xMjA5OSwwLjA0NjMgLTAuMTIwOTksLTAuNDYzMDIgeiBtIDM2LjQ5Mjg5LDAgYyAwLC0wLjM2MzggMC4wNjAxLC0wLjUxMjYzIDAuMTMzNDYsLTAuMzMwNzMgMC4wNzM0LDAuMTgxOSAwLjA3MzQsMC40Nzk1NiAwLDAuNjYxNDYgLTAuMDczNCwwLjE4MTkgLTAuMTMzNDYsMC4wMzMxIC0wLjEzMzQ2LC0wLjMzMDczIHogbSAtNDYuMzAyMDgsLTEuMDU4MzMgYyAwLC0wLjM2MzgxIDAuMDYwMSwtMC41MTI2MyAwLjEzMzQ1LC0wLjMzMDczIDAuMDczNCwwLjE4MTkgMC4wNzM0LDAuNDc5NTUgMCwwLjY2MTQ2IC0wLjA3MzQsMC4xODE5IC0wLjEzMzQ1LDAuMDMzMSAtMC4xMzM0NSwtMC4zMzA3MyB6IG0gNzQuODk2NjksLTEuMDU4MzQgYyAwLC0wLjUwOTMyIDAuMDU0NSwtMC43MTc2OCAwLjEyMDk5LC0wLjQ2MzAyIDAuMDY2NiwwLjI1NDY2IDAuMDY2NiwwLjY3MTM4IDAsMC45MjYwNCAtMC4wNjY1LDAuMjU0NjcgLTAuMTIwOTksMC4wNDYzIC0wLjEyMDk5LC0wLjQ2MzAyIHogbSAtODQuOTMxMjUsLTAuMjY0NTggYyAwLC0wLjUwOTMyIDAuMDU0NCwtMC43MTc2OCAwLjEyMDk5LC0wLjQ2MzAyIDAuMDY2NiwwLjI1NDY2IDAuMDY2NiwwLjY3MTM4IDAsMC45MjYwNCAtMC4wNjY1LDAuMjU0NjYgLTAuMTIwOTksMC4wNDYzIC0wLjEyMDk5LC0wLjQ2MzAyIHogbSA2Ni4zOTA4MSwtMC43OTM3NSBjIDAsLTAuMzYzOCAwLjA2MDEsLTAuNTEyNjMgMC4xMzM0NSwtMC4zMzA3MyAwLjA3MzQsMC4xODE5IDAuMDczNCwwLjQ3OTU2IDAsMC42NjE0NiAtMC4wNzM0LDAuMTgxOSAtMC4xMzM0NSwwLjAzMzEgLTAuMTMzNDUsLTAuMzMwNzMgeiBtIDAsLTEuMzIyOTIgYyAwLC0wLjM2MzggMC4wNjAxLC0wLjUxMjYzIDAuMTMzNDUsLTAuMzMwNzMgMC4wNzM0LDAuMTgxOSAwLjA3MzQsMC40Nzk1NiAwLDAuNjYxNDYgLTAuMDczNCwwLjE4MTkgLTAuMTMzNDUsMC4wMzMxIC0wLjEzMzQ1LC0wLjMzMDczIHogbSAtNjYuMzkwODEsLTAuNzkzNzUgYyAwLC0wLjUwOTMyIDAuMDU0NCwtMC43MTc2OCAwLjEyMDk5LC0wLjQ2MzAyIDAuMDY2NiwwLjI1NDY2IDAuMDY2NiwwLjY3MTM4IDAsMC45MjYwNCAtMC4wNjY1LDAuMjU0NjcgLTAuMTIwOTksMC4wNDYzIC0wLjEyMDk5LC0wLjQ2MzAyIHogbSA4NC45MzEyNSwwIGMgMCwtMC41MDkzMiAwLjA1NDUsLTAuNzE3NjggMC4xMjA5OSwtMC40NjMwMiAwLjA2NjYsMC4yNTQ2NiAwLjA2NjYsMC42NzEzOCAwLDAuOTI2MDQgLTAuMDY2NSwwLjI1NDY3IC0wLjEyMDk5LDAuMDQ2MyAtMC4xMjA5OSwtMC40NjMwMiB6IG0gLTc0Ljg4NjksLTEuMTkwNjIgYyAwLjAwNSwtMC40MzY1NiAwLjA2NDcsLTAuNTgzMTIgMC4xMzE3OSwtMC4zMjU3IDAuMDY3MSwwLjI1NzQ0IDAuMDYyNywwLjYxNDYyIC0wLjAxLDAuNzkzNzUgLTAuMDcyNSwwLjE3OTE1IC0wLjEyNzM1LC0wLjAzMTUgLTAuMTIxOTgsLTAuNDY4MDUgeiBtIDkuNzg5NTgsLTEuMDU4MzQgYyAwLjAwNSwtMC40MzY1NiAwLjA2NDcsLTAuNTgzMTEgMC4xMzE3OSwtMC4zMjU3IDAuMDY3MSwwLjI1NzQ0IDAuMDYyNywwLjYxNDYzIC0wLjAxLDAuNzkzNzUgLTAuMDcyNSwwLjE3OTE1IC0wLjEyNzM0LC0wLjAzMTUgLTAuMTIxOTcsLTAuNDY4MDUgeiBtIDM2LjQ4MTgxLC0wLjAyMiBjIDAuMDEyNywtMC4zMDgyNCAwLjA3NTQsLTAuMzcwOTIgMC4xNTk4NiwtMC4xNTk4NiAwLjA3NjQsMC4xOTEwMSAwLjA2NywwLjQxOTIxIC0wLjAyMDksMC41MDcxMyAtMC4wODc5LDAuMDg3OSAtMC4xNTA0NywtMC4wNjg0IC0wLjEzODk5LC0wLjM0NzI3IHogbSA2My4wNTk3OSwtMjIuNTk5OTEgYyAwLC0yLjY5MjEzNSAwLjAzOTMsLTMuNzkzNDYzIDAuMDg3MywtMi40NDczOTYgMC4wNDgsMS4zNDYwNjggMC4wNDgsMy41NDg3MjYgMCw0Ljg5NDc5NiAtMC4wNDgsMS4zNDYwNiAtMC4wODczLDAuMjQ0NzQgLTAuMDg3MywtMi40NDc0IHogbSAtNzQuNTA3MzYsLTkuNzA1NzM2IGMgMC4xOTEsLTAuMDc2NDQgMC40MTkyMSwtMC4wNjcwNSAwLjUwNzEzLDAuMDIwOSAwLjA4NzksMC4wODc5MiAtMC4wNjg0LDAuMTUwNDY4IC0wLjM0NzI3LDAuMTM4OTg1IC0wLjMwODI0LC0wLjAxMjcgLTAuMzcwOTIsLTAuMDc1NDEgLTAuMTU5ODYsLTAuMTU5ODYxIHogbSA1Ni4wOTE2NywwIGMgMC4xOTEsLTAuMDc2NDQgMC40MTkyLC0wLjA2NzA1IDAuNTA3MTIsMC4wMjA5IDAuMDg3OSwwLjA4NzkyIC0wLjA2ODQsMC4xNTA0NjggLTAuMzQ3MjYsMC4xMzg5ODUgLTAuMzA4MjQsLTAuMDEyNyAtMC4zNzA5MiwtMC4wNzU0MSAtMC4xNTk4NiwtMC4xNTk4NjEgeiBNIDM1NC40NDExMyw0NC4xMzI1IGMgMCwtMTUuNTcwNzI5IDAuMDMxOSwtMjEuOTAxNjg0IDAuMDcwOCwtMTQuMDY4NzkgMC4wMzg5LDcuODMyODk3IDAuMDM4OSwyMC41NzI1ODQgLTNlLTUsMjguMzEwNDE2IC0wLjAzODksNy43Mzc4MzUgLTAuMDcwOCwxLjMyOTEwMyAtMC4wNzA4LC0xNC4yNDE2MjYgeiBNIDMxNi42OTMxLDY1Ljc3OTg4NSBjIDAuMTkxMDEsLTAuMDc2NDMgMC40MTkyMSwtMC4wNjcwMyAwLjUwNzEzLDAuMDIwODggMC4wODc5LDAuMDg3OTIgLTAuMDY4NCwwLjE1MDQ1MiAtMC4zNDcyNiwwLjEzODk2NCAtMC4zMDgyNCwtMC4wMTI3IC0wLjM3MDkyLC0wLjA3NTM5IC0wLjE1OTg3LC0wLjE1OTg1MSB6IG0gMjEuMjM3MTYsLTEzLjczMTkzMyBjIDAuMDEyNywtMC4zMDgyMjYgMC4wNzU0LC0wLjM3MDkxOSAwLjE1OTg2LC0wLjE1OTg1MyAwLjA3NjQsMC4xOTA5OTQgMC4wNjcsMC40MTkyIC0wLjAyMDksMC41MDcxMTkgLTAuMDg3OSwwLjA4NzkyIC0wLjE1MDQ2LC0wLjA2ODM1IC0wLjEzODk4LC0wLjM0NzI2NiB6IE0gMjk0LjM3OTYzLDI1LjM0NzA4NCBjIDAsLTEyLjUxNDc5MiAwLjAzMjQsLTE3LjU5NTc3NTggMC4wNzE5LC0xMS4yOTEwNzUgMC4wMzk1LDYuMzA0NyAwLjAzOTUsMTYuNTQ0MDc1IC0yZS01LDIyLjc1NDE2NiAtMC4wMzk2LDYuMjEwMDkxIC0wLjA3MTksMS4wNTE3IC0wLjA3MTksLTExLjQ2MzA5MSB6IE0gMjU5LjkyMzQ0LDEwLjcyOTAwOCBjIDQuMzI5MjUsLTAuMDQwOCAxMS40MTM0NywtMC4wNDA4IDE1Ljc0MjcxLDAgNC4zMjkyNSwwLjA0MDc5IDAuNzg3MTQsMC4wNzQxNyAtNy44NzEzNSwwLjA3NDE3IC04LjY1ODQ5LDAgLTEyLjIwMDYsLTAuMDMzMzggLTcuODcxMzYsLTAuMDc0MTcgeiBtIDAsLTg4LjM3MDgzMSBjIDQuMzI5MjUsLTAuMDQwOCAxMS40MTM0NywtMC4wNDA4IDE1Ljc0MjcxLDAgNC4zMjkyNSwwLjA0MDc5IDAuNzg3MTQsMC4wNzQxNyAtNy44NzEzNSwwLjA3NDE3IC04LjY1ODQ5LDAgLTEyLjIwMDYsLTAuMDMzMzggLTcuODcxMzYsLTAuMDc0MTcgeiBtIDkxLjAxNjY3LDEuNDhlLTQgYyAzLjAxOTU2LC0wLjA0MjQ1IDcuOTYwNjUsLTAuMDQyNDUgMTAuOTgwMjEsMCAzLjAxOTU1LDAuMDQyNDUgMC41NDkwMSwwLjA3NzE4IC01LjQ5MDExLDAuMDc3MTggLTYuMDM5MTEsMCAtOC41MDk2NiwtMC4wMzQ3MyAtNS40OTAxLC0wLjA3NzE4IHogbSAzMS41MDMxNCwtNS4zZS01IGMgMy4wMjkzLC0wLjA0MjQ4IDcuOTEwODYsLTAuMDQyNDMgMTAuODQ3OTIsMS4yNWUtNCAyLjkzNzAzLDAuMDQyNTUgMC40NTg1MiwwLjA3NzMxIC01LjUwNzgzLDAuMDc3MjQgLTUuOTY2MzYsLTYuOWUtNSAtOC4zNjk0MSwtMC4wMzQ4OCAtNS4zNDAwOSwtMC4wNzczNiB6IgogICAgICAgICAgICAgaWQ9InBhdGg3NzM2IiAvPjxwYXRoCiAgICAgICAgICAgICBzdHlsZT0iZmlsbDojMDAwMDAwO2ZpbGwtb3BhY2l0eToxO3N0cm9rZTojZjNmM2YzO3N0cm9rZS13aWR0aDowLjI2NDU4MztzdHJva2Utb3BhY2l0eToxIgogICAgICAgICAgICAgZD0ibSAyNTUuMjkzMjMsMTYwLjc3MDgxIGMgMC4xODE5MSwtMC4wNzM0IDAuNDc5NTYsLTAuMDczNCAwLjY2MTQ2LDAgMC4xODE5LDAuMDczNCAwLjAzMzEsMC4xMzM0NSAtMC4zMzA3MywwLjEzMzQ1IC0wLjM2MzgsMCAtMC41MTI2MywtMC4wNjAxIC0wLjMzMDczLC0wLjEzMzQ1IHogbSA1OS44MTIzNywtNi4zNTU1MSBjIDAuMTkxMDEsLTAuMDc2NCAwLjQxOTIxLC0wLjA2NyAwLjUwNzEzLDAuMDIwOSAwLjA4NzksMC4wODc5IC0wLjA2ODQsMC4xNTA0NyAtMC4zNDcyNiwwLjEzODk5IC0wLjMwODI0LC0wLjAxMjcgLTAuMzcwOTIsLTAuMDc1NCAtMC4xNTk4NywtMC4xNTk4NiB6IG0gNTkuNTMxMjUsMCBjIDAuMTkxMDEsLTAuMDc2NCAwLjQxOTIxLC0wLjA2NyAwLjUwNzEzLDAuMDIwOSAwLjA4NzksMC4wODc5IC0wLjA2ODQsMC4xNTA0NyAtMC4zNDcyNiwwLjEzODk5IC0wLjMwODI0LC0wLjAxMjcgLTAuMzcwOTIsLTAuMDc1NCAtMC4xNTk4NywtMC4xNTk4NiB6IG0gMy41NjkwNywtMjEuNDQ3OTIgYyAxLjQyNjQsLTAuMDQ3NyAzLjY4ODU5LC0wLjA0NzUgNS4wMjcwOSwwIDEuMzM4NTIsMC4wNDc5IDAuMTcxNDcsMC4wODY5IC0yLjU5MzQyLDAuMDg2NyAtMi43NjQ5LC0yLjZlLTQgLTMuODYwMDMsLTAuMDM5NSAtMi40MzM2NywtMC4wODcxIHogbSAtNzUuMjAwNjYsLTAuNDg2MDkgYyAwLjAxMjcsLTAuMzA4MjQgMC4wNzU0LC0wLjM3MDkyIDAuMTU5ODYsLTAuMTU5ODYgMC4wNzY0LDAuMTkxIDAuMDY3LDAuNDE5MjEgLTAuMDIwOSwwLjUwNzEzIC0wLjA4NzksMC4wODc5IC0wLjE1MDQ2LC0wLjA2ODQgLTAuMTM4OTgsLTAuMzQ3MjcgeiBtIDI2LjQ1ODMzLC0xLjU4NzUgYyAwLjAxMjcsLTAuMzA4MjQgMC4wNzU0LC0wLjM3MDkyIDAuMTU5ODYsLTAuMTU5ODYgMC4wNzY0LDAuMTkxIDAuMDY3LDAuNDE5MjEgLTAuMDIwOSwwLjUwNzEzIC0wLjA4NzksMC4wODc5IC0wLjE1MDQ3LC0wLjA2ODQgLTAuMTM4OTksLTAuMzQ3MjcgeiBtIC01Ni4zMTU3NCwtMS42OTc3NSBjIDAsLTAuNTA5MzIgMC4wNTQ0LC0wLjcxNzY4IDAuMTIwOTksLTAuNDYzMDIgMC4wNjY2LDAuMjU0NjYgMC4wNjY2LDAuNjcxMzggMCwwLjkyNjA0IC0wLjA2NjUsMC4yNTQ2NiAtMC4xMjA5OSwwLjA0NjMgLTAuMTIwOTksLTAuNDYzMDIgeiBtIDg0LjkyMTQzLDAuMTMyMjkgYyAwLjAwNSwtMC40MzY1NiAwLjA2NDcsLTAuNTgzMTEgMC4xMzE3OSwtMC4zMjU3IDAuMDY3MSwwLjI1NzQ0IDAuMDYyNywwLjYxNDYzIC0wLjAxLDAuNzkzNzUgLTAuMDcyNSwwLjE3OTE1IC0wLjEyNzM0LC0wLjAzMTUgLTAuMTIxOTcsLTAuNDY4MDUgeiBtIC02NS4wNzc2OCwtMC45MjYwNCBjIDAsLTAuNTA5MzIgMC4wNTQ0LC0wLjcxNzY4IDAuMTIwOTksLTAuNDYzMDIgMC4wNjY2LDAuMjU0NjYgMC4wNjY2LDAuNjcxMzggMCwwLjkyNjA0IC0wLjA2NjUsMC4yNTQ2NiAtMC4xMjA5OSwwLjA0NjMgLTAuMTIwOTksLTAuNDYzMDIgeiBtIC05Ljc5OTQsLTAuNjYxNDYgYyAwLjAwNSwtMC40MzY1NiAwLjA2NDcsLTAuNTgzMTEgMC4xMzE3OSwtMC4zMjU3IDAuMDY3MSwwLjI1NzQ0IDAuMDYyNywwLjYxNDYzIC0wLjAxLDAuNzkzNzUgLTAuMDcyNSwwLjE3OTE1IC0wLjEyNzM1LC0wLjAzMTUgLTAuMTIxOTgsLTAuNDY4MDUgeiBtIDAsLTIuOTEwNDIgYyAwLjAwNSwtMC40MzY1NiAwLjA2NDcsLTAuNTgzMTEgMC4xMzE3OSwtMC4zMjU3IDAuMDY3MSwwLjI1NzQ0IDAuMDYyNywwLjYxNDYzIC0wLjAxLDAuNzkzNzUgLTAuMDcyNSwwLjE3OTE1IC0wLjEyNzM1LC0wLjAzMTUgLTAuMTIxOTgsLTAuNDY4MDUgeiBtIDkuODA0NzQsLTAuNzkzNzUgYyAwLjAwMywtMC41ODIwOCAwLjA1NzEsLTAuNzg5MDYgMC4xMjA0MSwtMC40NTk5MiAwLjA2MzMsMC4zMjkxMSAwLjA2MDksMC44MDUzNiAtMC4wMDUsMS4wNTgzMyAtMC4wNjYyLDAuMjUyOTQgLTAuMTE4LC0wLjAxNjQgLTAuMTE1MDcsLTAuNTk4NDEgeiBtIC0xOS44NTg5MSwtMC43OTM3NSBjIDAuMDA1LC0wLjQzNjU2IDAuMDY0NywtMC41ODMxMSAwLjEzMTc5LC0wLjMyNTcgMC4wNjcxLDAuMjU3NDQgMC4wNjI3LDAuNjE0NjMgLTAuMDEsMC43OTM3NSAtMC4wNzI1LDAuMTc5MTUgLTAuMTI3MzQsLTAuMDMxNSAtMC4xMjE5NywtMC40NjgwNSB6IG0gODQuOTMxMjUsMCBjIDAuMDA1LC0wLjQzNjU2IDAuMDY0NywtMC41ODMxMSAwLjEzMTc5LC0wLjMyNTcgMC4wNjcxLDAuMjU3NDQgMC4wNjI3LDAuNjE0NjMgLTAuMDEsMC43OTM3NSAtMC4wNzI1LDAuMTc5MTUgLTAuMTI3MzQsLTAuMDMxNSAtMC4xMjE5NywtMC40NjgwNSB6IG0gLTI4LjYwNTY5LC0xLjYwOTU0IGMgMC4wMTI3LC0wLjMwODIzIDAuMDc1NCwtMC4zNzA5MSAwLjE1OTg2LC0wLjE1OTg2IDAuMDc2NCwwLjE5MTAxIDAuMDY3LDAuNDE5MjEgLTAuMDIwOSwwLjUwNzEzIC0wLjA4NzksMC4wODc5IC0wLjE1MDQ3LC0wLjA2ODQgLTAuMTM4OTksLTAuMzQ3MjcgeiBtIC0yNi40NTgzMywtMS41ODc0OSBjIDAuMDEyNywtMC4zMDgyNCAwLjA3NTQsLTAuMzcwOTIgMC4xNTk4NiwtMC4xNTk4NyAwLjA3NjQsMC4xOTEwMSAwLjA2NywwLjQxOTIxIC0wLjAyMDksMC41MDcxMyAtMC4wODc5LDAuMDg3OSAtMC4xNTA0NiwtMC4wNjg0IC0wLjEzODk4LC0wLjM0NzI2IHogbSAyOC41MjAzNiwtMjMuODU2NjEgYyAtMC4zMjkwOSwtMC40MTk2NTYgLTAuMzE5NzUsLTAuNDI4OTk2IDAuMDk5OSwtMC4wOTk5MSAwLjQ0MDcxLDAuMzQ1NjUyIDAuNTgwODksMC41NjI5MjcgMC4zNjMxMSwwLjU2MjkyNyAtMC4wNTQ5LDAgLTAuMjYzMjksLTAuMjA4MzU5IC0wLjQ2MzAyLC0wLjQ2MzAyIHogbSAtNzUuOTY3OCwtNC43MzkyOTYgYyAwLjE4MTksLTAuMDczNCAwLjQ3OTU1LC0wLjA3MzQgMC42NjE0NiwwIDAuMTgxOSwwLjA3MzQgMC4wMzMxLDAuMTMzNDU1IC0wLjMzMDczLDAuMTMzNDU1IC0wLjM2MzgxLDAgLTAuNTEyNjMsLTAuMDYwMDYgLTAuMzMwNzMsLTAuMTMzNDU1IHogbSA1OS4yODMyLC0xLjMyODQyIGMgMC4xOTEsLTAuMDc2NDQgMC40MTkyMSwtMC4wNjcwNSAwLjUwNzEzLDAuMDIwOSAwLjA4NzksMC4wODc5MiAtMC4wNjg0LDAuMTUwNDY4IC0wLjM0NzI3LDAuMTM4OTg1IC0wLjMwODI0LC0wLjAxMjcgLTAuMzcwOTIsLTAuMDc1NDEgLTAuMTU5ODYsLTAuMTU5ODYxIHogbSA2MC4wNjA0MiwwIGMgMC4xOTEsLTAuMDc2NDQgMC40MTkyLC0wLjA2NzA1IDAuNTA3MTIsMC4wMjA5IDAuMDg3OSwwLjA4NzkyIC0wLjA2ODQsMC4xNTA0NjggLTAuMzQ3MjYsMC4xMzg5ODUgLTAuMzA4MjQsLTAuMDEyNyAtMC4zNzA5MiwtMC4wNzU0MSAtMC4xNTk4NiwtMC4xNTk4NjEgeiBtIDIuOTEwNDEsMCBjIDAuMTkxMDEsLTAuMDc2NDQgMC40MTkyMSwtMC4wNjcwNSAwLjUwNzEzLDAuMDIwOSAwLjA4NzksMC4wODc5MiAtMC4wNjg0LDAuMTUwNDY4IC0wLjM0NzI2LDAuMTM4OTg1IC0wLjMwODI0LC0wLjAxMjcgLTAuMzcwOTIsLTAuMDc1NDEgLTAuMTU5ODcsLTAuMTU5ODYxIHogbSAxNi41ODIyMSwtNTIuNDcxMzQ2IGMgMCwtMTkuMTM1OTg5IDAuMDMxNSwtMjYuOTY0MzQ4IDAuMDcsLTE3LjM5NjM1MyAwLjAzODUsOS41Njc5OTQgMC4wMzg1LDI1LjIyNDcxMyAwLDM0Ljc5MjcwNyAtMC4wMzg1LDkuNTY3OTk1IC0wLjA3LDEuNzM5NjM2IC0wLjA3LC0xNy4zOTYzNTQgeiBtIC02MS41MTE3NiwyOS43OTgwMiBjIDAsLTAuMDU0OTQgMC4yMDgzNiwtMC4yNjMzIDAuNDYzMDIsLTAuNDYzMDIxIDAuNDE5NjUsLTAuMzI5MTA3IDAuNDI4OTksLTAuMzE5NzQ4IDAuMDk5OSwwLjA5OTkgLTAuMzQ1NjUsMC40NDA3MjkgLTAuNTYyOTIsMC41ODA4ODcgLTAuNTYyOTIsMC4zNjMxMjQgeiBtIC0xOC4wNDEyOCwtMS42NjgzNDMgYyAwLjE5MSwtMC4wNzY0MyAwLjQxOTIxLC0wLjA2NzAzIDAuNTA3MTMsMC4wMjA4OCAwLjA4NzksMC4wODc5MiAtMC4wNjg0LDAuMTUwNDUyIC0wLjM0NzI3LDAuMTM4OTY0IC0wLjMwODI0LC0wLjAxMjcgLTAuMzcwOTIsLTAuMDc1MzkgLTAuMTU5ODYsLTAuMTU5ODUxIHogbSAyLjY0NTgzLDAgYyAwLjE5MTAxLC0wLjA3NjQzIDAuNDE5MjEsLTAuMDY3MDMgMC41MDcxMywwLjAyMDg4IDAuMDg3OSwwLjA4NzkyIC0wLjA2ODQsMC4xNTA0NTIgLTAuMzQ3MjYsMC4xMzg5NjQgLTAuMzA4MjQsLTAuMDEyNyAtMC4zNzA5MiwtMC4wNzUzOSAtMC4xNTk4NywtMC4xNTk4NTEgeiBtIDcuNzIyNTMsLTIuODI5NTczIGMgMCwtMC4wNTQ5NCAwLjIwODM2LC0wLjI2MzMgMC40NjMwMiwtMC40NjMwMjEgMC40MTk2NiwtMC4zMjkxMDcgMC40MjksLTAuMzE5NzQ5IDAuMDk5OSwwLjA5OTkgLTAuMzQ1NjUsMC40NDA3MyAtMC41NjI5MywwLjU4MDg4NyAtMC41NjI5MywwLjM2MzEyNSB6IG0gMy4xOTU4OCwtNy43MjczNiBjIDAuMDEyNywtMC4zMDgyMjYgMC4wNzU0LC0wLjM3MDkxOSAwLjE1OTg2LC0wLjE1OTg1MyAwLjA3NjQsMC4xOTA5OTQgMC4wNjcsMC40MTkyIC0wLjAyMDksMC41MDcxMTkgLTAuMDg3OSwwLjA4NzkyIC0wLjE1MDQ2LC0wLjA2ODM1IC0wLjEzODk4LC0wLjM0NzI2NiB6IG0gOS41MjUsLTMuOTY4NzUgYyAwLjAxMjcsLTAuMzA4MjI2IDAuMDc1NCwtMC4zNzA5MTkgMC4xNTk4NiwtMC4xNTk4NTMgMC4wNzY0LDAuMTkwOTk0IDAuMDY3LDAuNDE5MiAtMC4wMjA5LDAuNTA3MTE5IC0wLjA4NzksMC4wODc5MiAtMC4xNTA0NiwtMC4wNjgzNSAtMC4xMzg5OCwtMC4zNDcyNjYgeiBNIDI1OS4xMTEwMSwzNy4xODc0MSBjIDMuODgyNDIsLTAuMDQxMjIgMTAuMzExNzksLTAuMDQxMjUgMTQuMjg3NSwtNy43ZS01IDMuOTc1NzEsMC4wNDExOCAwLjc5OTIsMC4wNzQ5IC03LjA1ODkyLDAuMDc0OTQgLTcuODU4MTMsNC4yZS01IC0xMS4xMTA5OSwtMC4wMzM2NSAtNy4yMjg1OCwtMC4wNzQ4NiB6IG0gMTA4LjI5NTA3LC04My45MzkyODMgYyAwLC0xNi45NTMxNzcgMC4wMzE3LC0yMy44ODg1NjcgMC4wNzA0LC0xNS40MTE5NzkgMC4wMzg4LDguNDc2NTg5IDAuMDM4OCwyMi4zNDczNjkgMCwzMC44MjM5NTggLTAuMDM4Nyw4LjQ3NjU4OCAtMC4wNzA0LDEuNTQxMTk4IC0wLjA3MDQsLTE1LjQxMTk3OSB6IG0gLTEwOC4yOTUwNywtNC40MzE1NDggYyAzLjg4MjQyLC0wLjA0MTIyIDEwLjMxMTc5LC0wLjA0MTI1IDE0LjI4NzUsLTcuN2UtNSAzLjk3NTcxLDAuMDQxMTggMC43OTkyLDAuMDc0OSAtNy4wNTg5MiwwLjA3NDk0IC03Ljg1ODEzLDQuM2UtNSAtMTEuMTEwOTksLTAuMDMzNjUgLTcuMjI4NTgsLTAuMDc0ODYgeiIKICAgICAgICAgICAgIGlkPSJwYXRoNzczNCIgLz48cGF0aAogICAgICAgICAgICAgc3R5bGU9ImZpbGw6IzAwMDAwMDtmaWxsLW9wYWNpdHk6MTtzdHJva2U6I2YzZjNmMztzdHJva2Utd2lkdGg6MC4yNjQ1ODM7c3Ryb2tlLW9wYWNpdHk6MSIKICAgICAgICAgICAgIGQ9Im0gMzczLjU3ODUyLDE2Mi4wODgyMiBjIDAuMTkxLC0wLjA3NjQgMC40MTkyMSwtMC4wNjcgMC41MDcxMywwLjAyMDkgMC4wODc5LDAuMDg3OSAtMC4wNjg0LDAuMTUwNDcgLTAuMzQ3MjcsMC4xMzg5OSAtMC4zMDgyNCwtMC4wMTI3IC0wLjM3MDkyLC0wLjA3NTQgLTAuMTU5ODYsLTAuMTU5ODYgeiBtIC0xMTkuMDYyNSwtMS4zMjI5MiBjIDAuMTkxLC0wLjA3NjQgMC40MTkyMSwtMC4wNjcgMC41MDcxMywwLjAyMDkgMC4wODc5LDAuMDg3OSAtMC4wNjg0LDAuMTUwNDcgLTAuMzQ3MjcsMC4xMzg5OSAtMC4zMDgyNCwtMC4wMTI3IC0wLjM3MDkyLC0wLjA3NTQgLTAuMTU5ODYsLTAuMTU5ODYgeiBtIDE5LjA5OTYxLC02LjI1MjA1IGMgMCwtMC4wNDU1IDAuMzg2OTUsLTAuNDMyNDkgMC44NTk5LC0wLjg1OTg5IGwgMC44NTk4OSwtMC43NzcxMSAtMC43NzcxMSwwLjg1OTg5IGMgLTAuNzI0MzcsMC44MDE1NiAtMC45NDI2OCwwLjk4MTUzIC0wLjk0MjY4LDAuNzc3MTEgeiBtIDUwLjUzNTQyLC0zLjE5MjEyIGMgMCwtMC4wNTQ5IDAuMjA4MzYsLTAuMjYzMjggMC40NjMwMiwtMC40NjMwMiAwLjQxOTY1LC0wLjMyOTA5IDAuNDI4OTksLTAuMzE5NzUgMC4wOTk5LDAuMDk5OSAtMC4zNDU2NSwwLjQ0MDcxIC0wLjU2MjkyLDAuNTgwODkgLTAuNTYyOTIsMC4zNjMxMSB6IG0gNS4zMTI1NCwtMTkuNjMzNTkgYyAwLjAxMjcsLTAuMzA4MjQgMC4wNzU0LC0wLjM3MDkyIDAuMTU5ODYsLTAuMTU5ODYgMC4wNzY0LDAuMTkxIDAuMDY3LDAuNDE5MjEgLTAuMDIwOSwwLjUwNzEzIC0wLjA4NzksMC4wODc5IC0wLjE1MDQ3LC0wLjA2ODQgLTAuMTM4OTksLTAuMzQ3MjcgeiBtIC0zNi40NTQwOCwtNS40MDE5MiBjIDAsLTAuODAwMzYgMC4wNDk2LC0xLjEyNzc4IDAuMTEwMjIsLTAuNzI3NiAwLjA2MDYsMC40MDAxOCAwLjA2MDYsMS4wNTUwMiAwLDEuNDU1MjEgLTAuMDYwNiwwLjQwMDE4IC0wLjExMDIyLDAuMDcyOCAtMC4xMTAyMiwtMC43Mjc2MSB6IG0gLTkuODA3NSwwIGMgMCwtMC41MDkzMiAwLjA1NDUsLTAuNzE3NjggMC4xMjEsLTAuNDYzMDIgMC4wNjY2LDAuMjU0NjYgMC4wNjY2LDAuNjcxMzggMCwwLjkyNjA0IC0wLjA2NjYsMC4yNTQ2NyAtMC4xMjEsMC4wNDYzIC0wLjEyMSwtMC40NjMwMiB6IG0gNDYuMjYxNTgsLTUuNDQ2IGMgMC4wMTI3LC0wLjMwODIzIDAuMDc1NCwtMC4zNzA5MSAwLjE1OTg2LC0wLjE1OTg2IDAuMDc2NCwwLjE5MTAxIDAuMDY3LDAuNDE5MjEgLTAuMDIwOSwwLjUwNzEzIC0wLjA4NzksMC4wODc5IC0wLjE1MDQ3LC0wLjA2ODQgLTAuMTM4OTksLTAuMzQ3MjcgeiBtIC0yNi40NTgzMywtMS41ODc0OSBjIDAuMDEyNywtMC4zMDgyNCAwLjA3NTQsLTAuMzcwOTIgMC4xNTk4NiwtMC4xNTk4NyAwLjA3NjQsMC4xOTEwMSAwLjA2NywwLjQxOTIxIC0wLjAyMDksMC41MDcxMyAtMC4wODc5LDAuMDg3OSAtMC4xNTA0NiwtMC4wNjg0IC0wLjEzODk4LC0wLjM0NzI2IHogbSA1LjQwMzA4LC0xOC4zNjY1MSBjIDAuMjYzMzksLTAuMjkxMDQgMC41Mzg0MywtMC41MjkxNiAwLjYxMTE5LC0wLjUyOTE2IDAuMDcyOCwwIC0wLjA4MzIsMC4yMzgxMiAtMC4zNDY2MSwwLjUyOTE2IC0wLjI2MzM5LDAuMjkxMDUgLTAuNTM4NDMsMC41MjkxNyAtMC42MTExOSwwLjUyOTE3IC0wLjA3MjgsMCAwLjA4MzIsLTAuMjM4MTIgMC4zNDY2MSwtMC41MjkxNyB6IG0gLTMzLjYxNDU1LC0xLjkxODIyNiAtMS4wNDU4NywtMS4xMjQ0NzkgMS4xMjQ0OCwxLjA0NTg3MiBjIDEuMDQ1NzcsMC45NzI2NjEgMS4yNDYwNiwxLjIwMzA4MyAxLjA0NTg3LDEuMjAzMDgzIC0wLjA0MzIsMCAtMC41NDkyMiwtMC41MDYwMTIgLTEuMTI0NDgsLTEuMTI0NDc2IHogbSAtMjUuODUwNTYsMC4xMzcwMDIgYyAwLjYxODQ3LC0wLjA1NTcgMS42MzA1LC0wLjA1NTcgMi4yNDg5NiwwIDAuNjE4NDcsMC4wNTU2OSAwLjExMjQ1LDAuMTAxMjgyIC0xLjEyNDQ4LDAuMTAxMjgyIC0xLjIzNjkyLDAgLTEuNzQyOTQsLTAuMDQ1NTkgLTEuMTI0NDgsLTAuMTAxMjgyIHogbSA2Ny4yMjA3MSwtMS4zMDk5MjYgYyAwLjE5MSwtMC4wNzY0NCAwLjQxOTIsLTAuMDY3MDUgMC41MDcxMiwwLjAyMDkgMC4wODc5LDAuMDg3OTIgLTAuMDY4NCwwLjE1MDQ2OSAtMC4zNDcyNiwwLjEzODk4NiAtMC4zMDgyNCwtMC4wMTI3IC0wLjM3MDkyLC0wLjA3NTQxIC0wLjE1OTg2LC0wLjE1OTg2MSB6IG0gNTkuNzc5MjksMC4wMDU2IGMgMC4xODE5MSwtMC4wNzM0IDAuNDc5NTYsLTAuMDczNCAwLjY2MTQ2LDAgMC4xODE5LDAuMDczNCAwLjAzMzEsMC4xMzM0NTYgLTAuMzMwNzMsMC4xMzM0NTYgLTAuMzYzOCwwIC0wLjUxMjYzLC0wLjA2MDA2IC0wLjMzMDczLC0wLjEzMzQ1NiB6IG0gLTQ1LjIxMTM2LC0yLjQwNDQ1NCBjIC0wLjMyOTA5LC0wLjQxOTY1NSAtMC4zMTk3NSwtMC40Mjg5OTUgMC4wOTk5LC0wLjA5OTkxIDAuNDQwNzEsMC4zNDU2NTEgMC41ODA4OSwwLjU2MjkyNyAwLjM2MzExLDAuNTYyOTI3IC0wLjA1NDksMCAtMC4yNjMyOSwtMC4yMDgzNTkgLTAuNDYzMDIsLTAuNDYzMDIxIHogTSAyNTQuNzgwNiw5MS40NDQ1MjMgYyAwLjE5MTAxLC0wLjA3NjQ0IDAuNDE5MjEsLTAuMDY3MDUgMC41MDcxMywwLjAyMDkgMC4wODc5LDAuMDg3OTIgLTAuMDY4NCwwLjE1MDQ2OSAtMC4zNDcyNiwwLjEzODk4NiAtMC4zMDgyNCwtMC4wMTI3IC0wLjM3MDkyLC0wLjA3NTQxIC0wLjE1OTg3LC0wLjE1OTg2MSB6IG0gNjEuOTEyNSwtMS4zMjI5MTYgYyAwLjE5MTAxLC0wLjA3NjQ0IDAuNDE5MjEsLTAuMDY3MDUgMC41MDcxMywwLjAyMDkgMC4wODc5LDAuMDg3OTIgLTAuMDY4NCwwLjE1MDQ2OCAtMC4zNDcyNiwwLjEzODk4NSAtMC4zMDgyNCwtMC4wMTI3IC0wLjM3MDkyLC0wLjA3NTQxIC0wLjE1OTg3LC0wLjE1OTg2MSB6IG0gNjAuMzI1LDAgYyAwLjE5MTAxLC0wLjA3NjQ0IDAuNDE5MjEsLTAuMDY3MDUgMC41MDcxMywwLjAyMDkgMC4wODc5LDAuMDg3OTIgLTAuMDY4NCwwLjE1MDQ2OCAtMC4zNDcyNiwwLjEzODk4NSAtMC4zMDgyNCwtMC4wMTI3IC0wLjM3MDkyLC0wLjA3NTQxIC0wLjE1OTg3LC0wLjE1OTg2MSB6IE0gMzMyLjA4ODU1LDY4LjI0MTk3OCBjIDAsLTAuMDU0OTQgMC4yMDgzNiwtMC4yNjMzIDAuNDYzMDIsLTAuNDYzMDIxIDAuNDE5NjUsLTAuMzI5MTA3IDAuNDI4OTksLTAuMzE5NzQ5IDAuMDk5OSwwLjA5OTkgLTAuMzQ1NjUsMC40NDA3MjkgLTAuNTYyOTIsMC41ODA4ODcgLTAuNTYyOTIsMC4zNjMxMjQgeiBtIDUuODQxNzEsLTE3Ljc4MTUyNiBjIDAuMDEyNywtMC4zMDgyMjYgMC4wNzU0LC0wLjM3MDkxOSAwLjE1OTg2LC0wLjE1OTg1MyAwLjA3NjQsMC4xOTA5OTQgMC4wNjcsMC40MTkyIC0wLjAyMDksMC41MDcxMTkgLTAuMDg3OSwwLjA4NzkyIC0wLjE1MDQ2LC0wLjA2ODM1IC0wLjEzODk4LC0wLjM0NzI2NiB6IE0gMjgwLjYwMDYsMzMuMjg0NTgzIGMgMCwtMi4xODI4MTIgMC4wNDE0LC0zLjA0MDU3MyAwLjA5MTEsLTEuOTA2MTM1IDAuMDQ5NywxLjEzNDQzNiAwLjA0OTQsMi45MjAzNzMgMCwzLjk2ODc1IC0wLjA1MDEsMS4wNDgzNzUgLTAuMDkwOCwwLjEyMDE5OCAtMC4wOTA0LC0yLjA2MjYxNSB6IG0gNDEuNDk5MTgsLTc0LjUzOTQ2IC0wLjA2NTQsLTQ3LjU1MTk2MyAtNC4wMzQ5LC0wLjA4MDQ2IC00LjAzNDg5LC0wLjA4MDQ2IDQuMDQzMiwtMC4wNTg3MiBjIDMuMDM1NDMsLTAuMDQ0MDkgNC4wNzQ1MywwLjAyMzcxIDQuMTY4OTQsMC4yNzIwMDggMC4wNjkyLDAuMTgxOTAxIDAuMDk0OCwyMS42NDI5MTYgMC4wNTcxLDQ3LjY5MTE0NSBsIC0wLjA2ODYsNDcuMzYwNDE1MSB6IG0gNTQuODMxMywtNS40OTY5OTYgYyAwLC0xNi45NTMxNzcgMC4wMzE3LC0yMy44ODg1NjcgMC4wNzA0LC0xNS40MTE5NzkgMC4wMzg4LDguNDc2NTg5IDAuMDM4OCwyMi4zNDczNjkgMCwzMC44MjM5NTggLTAuMDM4Nyw4LjQ3NjU4OCAtMC4wNzA0LDEuNTQxMTk4IC0wLjA3MDQsLTE1LjQxMTk3OSB6IG0gLTk2LjMzMDQ4LC04LjMzNDM3NSBjIDAsLTIuMTgyODEyIDAuMDQxNCwtMy4wNDA1NzMgMC4wOTExLC0xLjkwNjEzNSAwLjA0OTcsMS4xMzQ0MzYgMC4wNDk0LDIuOTIwMzczIDAsMy45Njg3NSAtMC4wNTAxLDEuMDQ4Mzc0IC0wLjA5MDgsMC4xMjAxOTggLTAuMDkwNCwtMi4wNjI2MTUgeiIKICAgICAgICAgICAgIGlkPSJwYXRoNzczMiIgLz48cGF0aAogICAgICAgICAgICAgc3R5bGU9ImZpbGw6IzAwMDAwMDtmaWxsLW9wYWNpdHk6MTtzdHJva2U6I2YzZjNmMztzdHJva2Utd2lkdGg6MC4yNjQ1ODM7c3Ryb2tlLW9wYWNpdHk6MSIKICAgICAgICAgICAgIGQ9Im0gMzE0LjU3NjQ0LDE2Mi4wODgyMiBjIDAuMTkxLC0wLjA3NjQgMC40MTkyLC0wLjA2NyAwLjUwNzEyLDAuMDIwOSAwLjA4NzksMC4wODc5IC0wLjA2ODQsMC4xNTA0NyAtMC4zNDcyNiwwLjEzODk5IC0wLjMwODI0LC0wLjAxMjcgLTAuMzcwOTIsLTAuMDc1NCAtMC4xNTk4NiwtMC4xNTk4NiB6IG0gMi44OTM4OCwwLjAwNiBjIDAuMTgxOSwtMC4wNzM0IDAuNDc5NTUsLTAuMDczNCAwLjY2MTQ2LDAgMC4xODE5LDAuMDczNCAwLjAzMzEsMC4xMzM0NiAtMC4zMzA3MywwLjEzMzQ2IC0wLjM2MzgxLDAgLTAuNTEyNjMsLTAuMDYwMSAtMC4zMzA3MywtMC4xMzM0NiB6IG0gNTYuOTAxOTUsLTAuMDA2IGMgMC4xOTEsLTAuMDc2NCAwLjQxOTIxLC0wLjA2NyAwLjUwNzEzLDAuMDIwOSAwLjA4NzksMC4wODc5IC0wLjA2ODQsMC4xNTA0NyAtMC4zNDcyNywwLjEzODk5IC0wLjMwODI0LC0wLjAxMjcgLTAuMzcwOTIsLTAuMDc1NCAtMC4xNTk4NiwtMC4xNTk4NiB6IG0gMy4xNTg0NiwwLjAwNiBjIDAuMTgxOTEsLTAuMDczNCAwLjQ3OTU2LC0wLjA3MzQgMC42NjE0NiwwIDAuMTgxOSwwLjA3MzQgMC4wMzMxLDAuMTMzNDYgLTAuMzMwNzMsMC4xMzM0NiAtMC4zNjM4LDAgLTAuNTEyNjMsLTAuMDYwMSAtMC4zMzA3MywtMC4xMzM0NiB6IG0gLTEyNC4yMTY4NCwtMS4zMzEwMyBjIDAuMjU3NDQsLTAuMDY3MSAwLjYxNDYyLC0wLjA2MjcgMC43OTM3NSwwLjAxIDAuMTc5MTUsMC4wNzI1IC0wLjAzMTUsMC4xMjczNCAtMC40NjgwNSwwLjEyMTk3IC0wLjQzNjU2LC0wLjAwNSAtMC41ODMxMiwtMC4wNjQ3IC0wLjMyNTcsLTAuMTMxNzkgeiBtIDc3Ljk4MDkxLC00LjQ0NjkxIGMgMC4zNDE3NiwtMC4zNjM4IDAuNjgwOTMsLTAuNjYxNDYgMC43NTM2OSwtMC42NjE0NiAwLjA3MjgsMCAtMC4xNDczNSwwLjI5NzY2IC0wLjQ4OTExLDAuNjYxNDYgLTAuMzQxNzYsMC4zNjM4IC0wLjY4MDkzLDAuNjYxNDYgLTAuNzUzNjksMC42NjE0NiAtMC4wNzI4LDAgMC4xNDczNCwtMC4yOTc2NiAwLjQ4OTExLC0wLjY2MTQ2IHogbSAyNy43NDc0OSwwLjE5ODQ0IGMgLTAuMzI5MDksLTAuNDE5NjYgLTAuMzE5NzUsLTAuNDI5IDAuMDk5OSwtMC4wOTk5IDAuMjU0NjYsMC4xOTk3NCAwLjQ2MzAyLDAuNDA4MDkgMC40NjMwMiwwLjQ2MzAyIDAsMC4yMTc3OCAtMC4yMTcyNywwLjA3NzYgLTAuNTYyOTIsLTAuMzYzMTEgeiBtIC0xMTAuMDk5MDYsLTMuNDM2MiBjIDAuNzYzOTksLTAuMDUzNCAyLjAxNDE0LC0wLjA1MzQgMi43NzgxMywwIDAuNzYzOTgsMC4wNTM0IDAuMTM4OTEsMC4wOTcyIC0xLjM4OTA2LDAuMDk3MiAtMS41Mjc5NywwIC0yLjE1MzA1LC0wLjA0MzcgLTEuMzg5MDcsLTAuMDk3MiB6IG0gNDQuMjcyNDQsLTIwLjA2NzYxIGMgMC4wMTI3LC0wLjMwODI0IDAuMDc1NCwtMC4zNzA5MiAwLjE1OTg2LC0wLjE1OTg2IDAuMDc2NCwwLjE5MSAwLjA2NywwLjQxOTIgLTAuMDIwOSwwLjUwNzEyIC0wLjA4NzksMC4wODc5IC0wLjE1MDQ3LC0wLjA2ODQgLTAuMTM4OTgsLTAuMzQ3MjYgeiBtIDM2LjI0NzkyLC0wLjUyOTE3IGMgMC4wMTI3LC0wLjMwODI0IDAuMDc1NCwtMC4zNzA5MiAwLjE1OTg2LC0wLjE1OTg2IDAuMDc2NCwwLjE5MSAwLjA2NywwLjQxOTIxIC0wLjAyMDksMC41MDcxMyAtMC4wODc5LDAuMDg3OSAtMC4xNTA0NywtMC4wNjg0IC0wLjEzODk5LC0wLjM0NzI3IHogbSAyOC41NzUsLTEuODUyMDggYyAwLjAxMjcsLTAuMzA4MjQgMC4wNzU0LC0wLjM3MDkyIDAuMTU5ODYsLTAuMTU5ODYgMC4wNzY0LDAuMTkxIDAuMDY3LDAuNDE5MiAtMC4wMjA5LDAuNTA3MTIgLTAuMDg3OSwwLjA4NzkgLTAuMTUwNDcsLTAuMDY4NCAtMC4xMzg5OSwtMC4zNDcyNiB6IG0gMCwtOC43MzEyNSBjIDAuMDEyNywtMC4zMDgyNCAwLjA3NTQsLTAuMzcwOTIgMC4xNTk4NiwtMC4xNTk4NiAwLjA3NjQsMC4xOTEgMC4wNjcsMC40MTkyIC0wLjAyMDksMC41MDcxMiAtMC4wODc5LDAuMDg3OSAtMC4xNTA0NywtMC4wNjg0IC0wLjEzODk5LC0wLjM0NzI2IHogbSAtODQuOTMxMjUsLTAuMjY0NTkgYyAwLjAxMjcsLTAuMzA4MjMgMC4wNzU0LC0wLjM3MDkxIDAuMTU5ODYsLTAuMTU5ODYgMC4wNzY0LDAuMTkxMDEgMC4wNjcsMC40MTkyMSAtMC4wMjA5LDAuNTA3MTMgLTAuMDg3OSwwLjA4NzkgLTAuMTUwNDcsLTAuMDY4NCAtMC4xMzg5OSwtMC4zNDcyNyB6IG0gNTYuMzc3MTUsLTEuNjk3NzUgYyAwLC0wLjM2MzggMC4wNjAxLC0wLjUxMjYzIDAuMTMzNDYsLTAuMzMwNzMgMC4wNzM0LDAuMTgxOTEgMC4wNzM0LDAuNDc5NTYgMCwwLjY2MTQ2IC0wLjA3MzQsMC4xODE5IC0wLjEzMzQ2LDAuMDMzMSAtMC4xMzM0NiwtMC4zMzA3MyB6IE0gMzYzLjU3Mzk2LDEwMy40MzIgYyAwLC0wLjA1NDkgMC4yMDgzNiwtMC4yNjMyOSAwLjQ2MzAyLC0wLjQ2MzAyIDAuNDE5NjYsLTAuMzI5MDkgMC40MjksLTAuMzE5NzUgMC4wOTk5LDAuMDk5OSAtMC4zNDU2NSwwLjQ0MDcxIC0wLjU2MjkzLDAuNTgwODkgLTAuNTYyOTMsMC4zNjMxMSB6IG0gLTM5LjU4MDM0LC0yLjYxMjA3IC0wLjUwNDAzLC0wLjU5NTMxIDAuNTk1MzEsMC41MDQwMyBjIDAuNTU5NDQsMC40NzM2NSAwLjcxNTc1LDAuNjg2NTkgMC41MDQwMywwLjY4NjU5IC0wLjA1MDIsMCAtMC4zMTgxMSwtMC4yNjc4OSAtMC41OTUzMSwtMC41OTUzMSB6IG0gLTcxLjQ3MzQ4LC0xLjcwNDcxMyBjIDAuMjU3NDQsLTAuMDY3MDcgMC42MTQ2MiwtMC4wNjI2OCAwLjc5Mzc1LDAuMDA5OCAwLjE3OTE1LDAuMDcyNDcgLTAuMDMxNSwwLjEyNzM0NCAtMC40NjgwNSwwLjEyMTk3MyAtMC40MzY1NiwtMC4wMDUzIC0wLjU4MzEyLC0wLjA2NDY5IC0wLjMyNTcsLTAuMTMxNzg5IHogbSA2Mi44NTAwNSwtMS4zMjAyOTcgYyAwLjE5MSwtMC4wNzY0NCAwLjQxOTIsLTAuMDY3MDUgMC41MDcxMiwwLjAyMDkgMC4wODc5LDAuMDg3OTIgLTAuMDY4NCwwLjE1MDQ2OSAtMC4zNDcyNiwwLjEzODk4NiAtMC4zMDgyNCwtMC4wMTI3IC0wLjM3MDkyLC0wLjA3NTQxIC0wLjE1OTg2LC0wLjE1OTg2MSB6IG0gNTkuNzk1ODMsMCBjIDAuMTkxLC0wLjA3NjQ0IDAuNDE5MjEsLTAuMDY3MDUgMC41MDcxMywwLjAyMDkgMC4wODc5LDAuMDg3OTIgLTAuMDY4NCwwLjE1MDQ2OSAtMC4zNDcyNywwLjEzODk4NiAtMC4zMDgyNCwtMC4wMTI3IC0wLjM3MDkyLC0wLjA3NTQxIC0wLjE1OTg2LC0wLjE1OTg2MSB6IG0gMS44NTIwOCwwIGMgMC4xOTEwMSwtMC4wNzY0NCAwLjQxOTIxLC0wLjA2NzA1IDAuNTA3MTMsMC4wMjA5IDAuMDg3OSwwLjA4NzkyIC0wLjA2ODQsMC4xNTA0NjkgLTAuMzQ3MjYsMC4xMzg5ODYgLTAuMzA4MjQsLTAuMDEyNyAtMC4zNzA5MiwtMC4wNzU0MSAtMC4xNTk4NywtMC4xNTk4NjEgeiBtIC03Ni4xNTAzOSwtMS40ODk1NTEgYyAwLC0wLjA0NTU0IDAuMzg2OTYsLTAuNDMyNDg4IDAuODU5OSwtMC44NTk4OTYgbCAwLjg1OTg5LC0wLjc3NzEwOCAtMC43NzcxLDAuODU5ODk2IGMgLTAuNzI0MzgsMC44MDE1NTUgLTAuOTQyNjksMC45ODE1MjUgLTAuOTQyNjksMC43NzcxMDggeiBtIDU4LjIwODM0LC0wLjI4MTcwMiBjIDAsLTAuMDU0OTMgMC4yMDgzNiwtMC4yNjMyODcgMC40NjMwMiwtMC40NjMwMjEgMC40MTk2NSwtMC4zMjkwODkgMC40Mjg5OSwtMC4zMTk3NDkgMC4wOTk5LDAuMDk5OTEgLTAuMzQ1NjUsMC40NDA3MTYgLTAuNTYyOTIsMC41ODA4OTMgLTAuNTYyOTIsMC4zNjMxMTQgeiBNIDI1My43MDU3Myw5MS40NDk5NzQgYyAwLjE4MTkxLC0wLjA3MzQgMC40Nzk1NiwtMC4wNzM0IDAuNjYxNDYsMCAwLjE4MTksMC4wNzM0IDAuMDMzMSwwLjEzMzQ1NSAtMC4zMzA3MywwLjEzMzQ1NSAtMC4zNjM4LDAgLTAuNTEyNjMsLTAuMDYwMDYgLTAuMzMwNzMsLTAuMTMzNDU1IHogbSAxMjIuNTE4NjIsLTEuMzI4NDIgYyAwLjE5MTAxLC0wLjA3NjQ0IDAuNDE5MjEsLTAuMDY3MDUgMC41MDcxMywwLjAyMDkgMC4wODc5LDAuMDg3OTIgLTAuMDY4NCwwLjE1MDQ2OCAtMC4zNDcyNiwwLjEzODk4NSAtMC4zMDgyNCwtMC4wMTI3IC0wLjM3MDkyLC0wLjA3NTQxIC0wLjE1OTg3LC0wLjE1OTg2MSB6IE0gMzE0LjAzMDczLDczLjQ1ODMxMyBjIDAuMTgxOTEsLTAuMDczNCAwLjQ3OTU2LC0wLjA3MzQgMC42NjE0NiwwIDAuMTgxOSwwLjA3MzQgMC4wMzMxLDAuMTMzNDUzIC0wLjMzMDczLDAuMTMzNDUzIC0wLjM2MzgsMCAtMC41MTI2MywtMC4wNjAwNiAtMC4zMzA3MywtMC4xMzM0NTMgeiBtIDMuOTY4NzUsMCBjIDAuMTgxOTEsLTAuMDczNCAwLjQ3OTU2LC0wLjA3MzQgMC42NjE0NiwwIDAuMTgxOSwwLjA3MzQgMC4wMzMxLDAuMTMzNDUzIC0wLjMzMDczLDAuMTMzNDUzIC0wLjM2MzgsMCAtMC41MTI2MywtMC4wNjAwNiAtMC4zMzA3MywtMC4xMzM0NTMgeiBtIC0xOC44NzY2OSwtNi41MDU1MDEgLTAuNTA0MDQsLTAuNTk1MzEzIDAuNTk1MzIsMC41MDQwMjkgYyAwLjU1OTQzLDAuNDczNjYyIDAuNzE1NzUsMC42ODY1OTYgMC41MDQwMywwLjY4NjU5NiAtMC4wNTAyLDAgLTAuMzE4MTEsLTAuMjY3ODkgLTAuNTk1MzEsLTAuNTk1MzEyIHogbSA4NS4yMTYyOCwtMzUuNjUyNjAzIGMgMCwtMTUuNjQzNDkgMC4wMzE5LC0yMi4wNDMwOTg5IDAuMDcwOCwtMTQuMjIxMzU0IDAuMDM4OSw3LjgyMTc0NCAwLjAzODksMjAuNjIwOTYzIDAsMjguNDQyNzA3IC0wLjAzODksNy44MjE3NDUgLTAuMDcwOCwxLjQyMjEzNiAtMC4wNzA4LC0xNC4yMjEzNTMgeiBtIC04OS44MDA0OCwyMS4wMTIzMjYgYyAwLjAxMjcsLTAuMzA4MjI2IDAuMDc1NCwtMC4zNzA5MTkgMC4xNTk4NiwtMC4xNTk4NTMgMC4wNzY0LDAuMTkwOTk1IDAuMDY3LDAuNDE5MjAxIC0wLjAyMDksMC41MDcxMTkgLTAuMDg3OSwwLjA4NzkyIC0wLjE1MDQ3LC0wLjA2ODM1IC0wLjEzODk5LC0wLjM0NzI2NiB6IG0gOS4zNjY0OSwtMjQuODQ4Nzg1IGMgMmUtNSwtMTMuNjc4OTU4IDAuMDMyMiwtMTkuMjM2MTEyNSAwLjA3MTQsLTEyLjM0OTIzMSAwLjAzOTMsNi44ODY4ODIgMC4wMzkzLDE4LjA3ODc1NyAtMmUtNSwyNC44NzA4MzMgLTAuMDM5Myw2Ljc5MjA3NiAtMC4wNzE0LDEuMTU3MzU2IC0wLjA3MTQsLTEyLjUyMTYwMiB6IG0gMzQuMDY1NjgsMjEuODI4MTI1IGMgMCwtMC41MDkzMjMgMC4wNTQ1LC0wLjcxNzY4MiAwLjEyMSwtMC40NjMwMjEgMC4wNjY2LDAuMjU0NjYxIDAuMDY2NiwwLjY3MTM4IDAsMC45MjYwNDIgLTAuMDY2NiwwLjI1NDY2MSAtMC4xMjEsMC4wNDYzIC0wLjEyMSwtMC40NjMwMjEgeiBNIDI1OS4xMTEwMSwyOS4yNDk5MSBjIDMuODgyNDIsLTAuMDQxMjIgMTAuMzExNzksLTAuMDQxMjUgMTQuMjg3NSwtNy43ZS01IDMuOTc1NzEsMC4wNDExOCAwLjc5OTIsMC4wNzQ5IC03LjA1ODkyLDAuMDc0OTQgLTcuODU4MTMsNC4yZS01IC0xMS4xMTA5OSwtMC4wMzM2NSAtNy4yMjg1OCwtMC4wNzQ4NiB6IE0gMjgzLjUxMTAyLDYuODI2MjUwOCBjIDAsLTIuMTgyODEyNSAwLjA0MTQsLTMuMDQwNTczMSAwLjA5MTEsLTEuOTA2MTM1MSAwLjA0OTcsMS4xMzQ0MzU1IDAuMDQ5NCwyLjkyMDM3MjkgMCwzLjk2ODc1IC0wLjA1MDEsMS4wNDgzNzQzIC0wLjA5MDgsMC4xMjAxOTc1IC0wLjA5MDQsLTIuMDYyNjE0OSB6IG0gMzIuNTA0MDksLTAuNTkzNTQyNSBjIDEuMTI3NzksLTAuMDQ5NTk2IDIuOTczMjUsLTAuMDQ5NTk2IDQuMTAxMDQsMCAxLjEyNzc5LDAuMDQ5NTk2IDAuMjA1MDUsMC4wOTAxNzUgLTIuMDUwNTIsMC4wOTAxNzUgLTIuMjU1NTcsMCAtMy4xNzgzMSwtMC4wNDA1NzkgLTIuMDUwNTIsLTAuMDkwMTc1IHogbSAtNTYuOTA0MSwtNjUuMzUzNjI5MyBjIDMuODgyNDIsLTAuMDQxMjIgMTAuMzExNzksLTAuMDQxMjUgMTQuMjg3NSwtNy43ZS01IDMuOTc1NzEsMC4wNDExOCAwLjc5OTIsMC4wNzQ5IC03LjA1ODkyLDAuMDc0OTQgLTcuODU4MTMsNC4yZS01IC0xMS4xMTA5OSwtMC4wMzM2NSAtNy4yMjg1OCwtMC4wNzQ4NiB6IG0gMjQuNDAwMDEsLTIyLjQyMzY2IGMgMCwtMi4xODI4MTIgMC4wNDE0LC0zLjA0MDU3MyAwLjA5MTEsLTEuOTA2MTM1IDAuMDQ5NywxLjEzNDQzNiAwLjA0OTQsMi45MjAzNzMgMCwzLjk2ODc1IC0wLjA1MDEsMS4wNDgzNzUgLTAuMDkwOCwwLjEyMDE5OCAtMC4wOTA0LC0yLjA2MjYxNSB6IG0gMTE1LjA5Mzc1LDAgYyAwLC0yLjE4MjgxMiAwLjA0MTQsLTMuMDQwNTczIDAuMDkxMSwtMS45MDYxMzUgMC4wNDk3LDEuMTM0NDM2IDAuMDQ5NCwyLjkyMDM3MyAwLDMuOTY4NzUgLTAuMDUwMSwxLjA0ODM3NSAtMC4wOTA4LDAuMTIwMTk4IC0wLjA5MDQsLTIuMDYyNjE1IHoiCiAgICAgICAgICAgICBpZD0icGF0aDc3MzAiIC8+PHBhdGgKICAgICAgICAgICAgIGlkPSJwYXRoNzcyOCIKICAgICAgICAgICAgIHN0eWxlPSJkaXNwbGF5OmlubGluZTtmaWxsOiMwMDAwMDA7ZmlsbC1vcGFjaXR5OjE7c3Ryb2tlOiNmM2YzZjM7c3Ryb2tlLXdpZHRoOjAuMjY0NTgzO3N0cm9rZS1vcGFjaXR5OjEiCiAgICAgICAgICAgICBpbmtzY2FwZTpsYWJlbD0icGF0aDc3MjgiCiAgICAgICAgICAgICBkPSJtIC0zNDEuNTQxMDIsLTE3NS42MDM1MiBjIDAsMTQzLjc1NzE2NiAwLDI4Ny41MTQzMyAwLDQzMS4yNzE0OSAxNDEuOTkzNDksMCAyODMuOTg2OTg0LDAgNDI1Ljk4MDQ3MywwIDAsLTE0My45MzM2IDAsLTI4Ny44NjcxODkgMCwtNDMxLjgwMDc4IC0xNDEuOTkzNDg5LDAgLTI4My45ODY5ODMsMCAtNDI1Ljk4MDQ3MywwIDAsMC4xNzY0MyAwLDAuMzUyODYgMCwwLjUyOTI5IHogbSA0NDEuMzI2MTc2LDAgYyAwLDE0My43NTcxNjYgMCwyODcuNTE0MzMgMCw0MzEuMjcxNDkgMTQzLjkzMjk0NCwwIDI4Ny44NjU4ODQsMCA0MzEuNzk4ODI0LDAgMCwtMTQzLjkzMzYgMCwtMjg3Ljg2NzE4OSAwLC00MzEuODAwNzggLTE0My45MzI5NCwwIC0yODcuODY1ODgsMCAtNDMxLjc5ODgyNCwwIDAsMC4xNzY0MyAwLDAuMzUyODYgMCwwLjUyOTI5IHogbSAtMjI4LjMzNTkzNiw4LjQ2NjggYyA2Ny45OTgwNDYsMCAxMzUuOTk2MDkyNSwwIDIwMy45OTQxMzksMCAwLDEzNy45MzYxOTkgMCwyNzUuODcyNCAwLDQxMy44MDg2IC0xMzUuOTk2MDkzLC0xMGUtNiAtMjcxLjk5MjE4OSwwIC00MDcuOTg4Mjc5LDAgMCwtMTM3LjkzNjIgMCwtMjc1Ljg3MjQwMSAwLC00MTMuODA4NiA2Ny45OTgwNSwwIDEzNS45OTYwOSwwIDIwMy45OTQxNCwwIHogbSA0NDQuMjM0MzcsMCBjIDY4Ljk2ODEsMCAxMzcuOTM2MiwwIDIwNi45MDQzLDAgMCwxMzcuOTM2MTk5IDAsMjc1Ljg3MjQgMCw0MTMuODA4NiAtMTM3LjkzNTU1LDAgLTI3NS44NzEwOSwtMTBlLTYgLTQxMy44MDY2NCwwIDAsLTEzNy45MzYyIDAsLTI3NS44NzI0MDEgMCwtNDEzLjgwODYgNjguOTY3NDUsMCAxMzcuOTM0OSwwIDIwNi45MDIzNCwwIHogbSAtMi4xMTUyMyw3OC4zMTY0MDggYyAwLDMxLjgzNzg5IDAsNjMuNjc1NzgxIDAsOTUuNTEzNjcxNCAyLjk5ODcsMCA1Ljk5NzQsMCA4Ljk5NjA5LDAgMCwtMzIuMDE0MzIzNCAwLC02NC4wMjg2NDU0IDAsLTk2LjA0Mjk2ODQgLTIuOTk4NjksMCAtNS45OTczOSwwIC04Ljk5NjA5LDAgMCwwLjE3NjQzMiAwLDAuMzUyODY0IDAsMC41MjkyOTcgeiBtIC03MS40Mzc1LDMuMTczODI4IGMgMCwyMy4zNzgyNTUgMCw0Ni43NTY1MSAwLDcwLjEzNDc2NSAzLjQ4MzA5LC0wLjA1MjQ1IDYuOTY2MTQsLTAuMTA3Mjg4IDEwLjQ0OTIyLC0wLjE2MDE1NiAwLjA0NTcsLTExLjY4Mjk0IDAuMDkwOSwtMjMuMzY1ODgxIDAuMTM0NzYsLTM1LjA0ODgyOCA5LjQzNjIsMCAxOC44NzI0LDAgMjguMzA4NiwwIDAsLTIuOTEwMTU2IDAsLTUuODIwMzEzIDAsLTguNzMwNDY5IC05LjQzNjg1LDAgLTE4Ljg3MzcsMCAtMjguMzEwNTUsMCAwLC01LjkwOTUwNSAwLC0xMS44MTkwMSAwLC0xNy43Mjg1MTYgMTAuNDA2OSwxMGUtNyAyMC44MTM4LDAgMzEuMjIwNywwIDAsLTIuOTk4Njk3IDAsLTUuOTk3Mzk1IDAsLTguOTk2MDkzIC0xMy45MzQyNCwwIC0yNy44Njg0OSwwIC00MS44MDI3MywwIDAsMC4xNzY0MzIgMCwwLjM1Mjg2NCAwLDAuNTI5Mjk3IHogbSAxMDIuOTIxODcsMCBjIDAsMi44MjIyNjUgMCw1LjY0NDUzMSAwLDguNDY2Nzk2IDcuMzIwMzIsMCAxNC42NDA2MywxMGUtNyAyMS45NjA5NCwwIDAsMjAuNTQ5NDggMCw0MS4wOTg5NTkgMCw2MS42NDg0MzggMy40Mzk0NSwwIDYuODc4OTEsMCAxMC4zMTgzNiwwIDAsLTIwLjU0OTQ3OSAwLC00MS4wOTg5NTggMCwtNjEuNjQ4NDM4IDcuMjMxNzcsMCAxNC40NjM1NCwxMGUtNyAyMS42OTUzMSwwIDAsLTIuOTk4Njk3IDAsLTUuOTk3Mzk1IDAsLTguOTk2MDkzIC0xNy45OTE1MywwIC0zNS45ODMwNywwIC01My45NzQ2MSwwIDAsMC4xNzY0MzIgMCwwLjM1Mjg2NCAwLDAuNTI5Mjk3IHogTSAyNDIuMTMwODYsMi43MjQ2MDk0IGMgMCwyMy4zNzgyNTU2IDAsNDYuNzU2NTEwNiAwLDcwLjEzNDc2NTYgMy40ODMwOSwtMC4wNTI0NSA2Ljk2NjE0LC0wLjEwNzI4OCAxMC40NDkyMiwtMC4xNjAxNTYgMC4wNDU3LC0xMS42ODI5NCAwLjA5MDksLTIzLjM2NTg4MiAwLjEzNDc2LC0zNS4wNDg4MjggOS40MzYyLDAgMTguODcyNCwwIDI4LjMwODYsMCAwLC0yLjkxMDgwOCAwLC01LjgyMTYxNSAwLC04LjczMjQyMiAtOS40MzY4NSwwIC0xOC44NzM3LDAgLTI4LjMxMDU1LDAgMCwtNS45MDg4NTQgMCwtMTEuODE3NzA5IDAsLTE3LjcyNjU2MyAxMC40MDY5LDAgMjAuODEzOCwwIDMxLjIyMDcsMCAwLC0yLjk5ODY5NzcgMCwtNS45OTczOTU2IDAsLTguOTk2MDkzNSAtMTMuOTM0MjQsMCAtMjcuODY4NDksMCAtNDEuODAyNzMsMCAwLDAuMTc2NDMyMyAwLDAuMzUyODY0NiAwLDAuNTI5Mjk2OSB6IG0gNTEuODU3NDIsMCBjIDAuMDI4MiwxNC40MzkxODg2IC0wLjA2NTQsMjguODc5MTkyNiAwLjA5Miw0My4zMTc3Njg2IDAuMTE2MDgsNC40MDE3IDAuMDYyOSw4Ljg0NjI2MiAwLjg3MDg4LDEzLjE5MDA0NCAwLjk1MjQ4LDQuNDQ4MDQ3IDMuNTg1MTgsOC41Njg5NDUgNy40MjU1LDExLjA2MDU4NCA0LjU2MTMxLDMuMDM5MDc3IDEwLjIxNDE2LDQuMDM0MjE3IDE1LjYxNTkzLDMuNjY3NDk2IDQuMDY1MzEsLTAuMTEzNjY0IDguMTUwNTIsLTEuMTE5MDUxIDExLjYyMDU0LC0zLjI4NTcxMiAzLjc2MjA1LC0yLjI2NjYxNyA2LjY3NTg5LC01Ljk2OTg2OCA3LjcyNjIsLTEwLjI2MTUzNyAxLjAzMjU0LC00LjE1OTg1NCAxLjAyNTM2LC04LjQ4MjU5MyAxLjE5MTAyLC0xMi43NDA4ODkgMC4yNjM0MSwtMTIuOTgyNTE1IDAuMTM3NTgsLTI1Ljk2ODkyMiAwLjE3MjIzLC0zOC45NTMyMjMzIDEuN2UtNCwtMi4xNzQ2MDk0IDQuNWUtNCwtNC4zNDkyMTg4IDUuM2UtNCwtNi41MjM4MjgyIC0zLjUyNzk5LDAgLTcuMDU1OTgsMCAtMTAuNTgzOTgsMCAtMC4wMzA3LDE3LjExNDE5OTUgMC4wOCwzNC4yMjk0OTg1IC0wLjEzMzI3LDUxLjM0Mjc4MzUgLTAuMDY3NywyLjAyOTkzNSAwLjEyMzkyLDQuMTYyNzMgLTAuODA3NjgsNi4wNDE4NTcgLTEuNDA5OSwzLjI3NTgwNyAtNC44NTc5Miw1LjIxNDk0NyAtOC4yODc3Myw1LjY0NzYzNiAtMy4xNTI3MSwwLjQxMzgyNyAtNi42NDU4MiwwLjEyMTU1OCAtOS41NTA2MiwtMS40MDMzNyAtMS42NzY2NywtMS4xMTA4MTIgLTMuMjM0MjYsLTIuNTgyNzIgLTQuMDUzOCwtNC40NDg2NzkgLTAuNjU2NzUsLTEuODIzMTEyIC0wLjU1MzE4LC0zLjY2MDI1NCAtMC42NzA5NywtNS41NTEwNzIgLTAuMjQ1NDIsLTEwLjQ1NzcxNyAtMC4xODYwNywtMjAuOTIwMDAyIC0wLjI2MTY0LC0zMS4zNzk4NjkgLTAuMDI5MiwtNi43NDk3NjIgLTAuMDU5MiwtMTMuNDk5NTIxNCAtMC4wODc4LC0yMC4yNDkyODY1IC0zLjQyNTc4LDAgLTYuODUxNTYsMCAtMTAuMjc3MzQsMCAwLDAuMTc2NDMyMyAwLDAuMzUyODY0NiAwLDAuNTI5Mjk2OSB6IG0gNDkuNzQyMTksMC4yNTU4NTk0IGMgMCwyMy4yODY0NTgyIDAsNDYuNTcyOTE2MiAwLDY5Ljg1OTM3NTIgMy43MDQ0MywwIDcuNDA4ODUsMCAxMS4xMTMyOCwwIDAuMDM0OSwtMTcuNzcxNTU2IC0wLjA1NTYsLTM1LjU0Mzk4OSAwLjEzMzEsLTUzLjMxNDgxOSAwLjA3NjcsLTAuMzMxMzU4IC0wLjExMDYyLC0xLjg2NzM1MiAwLjE2NjQzLC0xLjI4NDcwOSA4LjcxNjg4LDE4LjEzMzEyMiAxNy4zMzU1NiwzNi4zMDM5ODkgMjUuOTk5Myw1NC40NjI4MDkgNC41NTA3NiwwLjA1MjI1IDkuMTAxNTUsMC4xMDI2MTkgMTMuNjUyMzQsMC4xNTIzNDQgMCwtMjMuNDY0ODQ0IDAsLTQ2LjkyOTY4OCAwLC03MC4zOTQ1MzE1IC0zLjYxNTg4LDAgLTcuMjMxNzcsMCAtMTAuODQ3NjUsMCAtMC4wMjY1LDE3Ljc3NTcwODUgMC4wNzIyLDM1LjU1MjI0MjUgLTAuMTA5MTgsNTMuMzI3MjkwNSAtMC4wNjMzLDAuMzkxMjk5IDAuMDgyOSwxLjcyMTI1OSAtMC4xMTk4NSwxLjQ4NzQ0OCAtOC44MTM1MywtMTguMTgyNDQyIC0xNy40Mzg0OSwtMzYuNDQ2ODg5IC0yNi4xNTE4MywtNTQuNjc4MDE5OCAtNC42MTE5NywtMC4wNTIzNjEgLTkuMjIzOTUsLTAuMTAyNDE2NyAtMTMuODM1OTQsLTAuMTUyMzQzNyAwLDAuMTc4Mzg1NCAwLDAuMzU2NzcwOCAwLDAuNTM1MTU2MyB6IE0gMzE0LjU1MjczLDg5LjkyOTY4OCBjIC0yLjg2Nzk5LDAuMDE5MSAtNS43NjcyNCwwLjUyNDc3NyAtOC4zMjY2NywxLjg2Nzc0NyAtMi43MzY0LDEuMzI4NjQyIC00Ljk0MzgxLDMuNTI4NTA1IC02LjkwNjU2LDUuODA5NTEgLTIuMDM4MjUsMi41MDQyNTUgLTMuMjAzNTQsNS41ODQ1NTUgLTQuMTk4Myw4LjYyMTQyNSAtMS40MTQwMSw0LjU1MDczIC0yLjE0NTE2LDkuMjk2NDMgLTIuMjY1ODYsMTQuMDU3ODUgLTAuMjM2OSw2LjUxNzE0IC0wLjM1NTUxLDEzLjA5NTIzIDAuNzgxMTMsMTkuNTQyMzkgMC45OTYzOSw1Ljg0NzczIDIuNzk0MTYsMTEuODI1OTcgNi43NTU0MiwxNi4zODM2OSAzLjA1Mjc1LDMuNTYwOCA3LjUzOTE1LDUuNzA4MiAxMi4xNzAwOSw2LjIyMDk5IDIuMDIyNzgsMC4yODE2NyA0LjA3Mjk1LDAuNDIzOTIgNi4xMDM1MiwwLjEyNjgyIDQuNDM1MiwtMC4zNDAyIDguOTE0MjYsLTEuODYyMzUgMTIuMTY1NjIsLTQuOTkyMTcgNC4wMTQzNCwtMy43NjY1MSA2LjI0MTQ5LC05LjAxODU4IDcuNDUzMzcsLTE0LjMwMDczIDAuOTkzNjEsLTQuMjI0MTUgMS42MDkzLC04LjU0OTI5IDEuNTU4MTksLTEyLjg5NjkgLTAuMDI0LC00LjU1NDg3IDAuMTUyOTYsLTkuMTIzMTYgLTAuMjMxNjMsLTEzLjY2NjgzIC0wLjY4MDUsLTUuNTkzNDEgLTEuODM0NjEsLTExLjI0OTgxIC00LjQ3NjM5LC0xNi4yNzc0OCAtMi4wMTM4NywtMy44NzY0MjQgLTUuMjc4NzcsLTcuMTMzOTg5IC05LjMyMTM5LC04Ljg1NTUyNSAtMi4zMDc2LC0xLjE5NDU2NCAtNC45MTI2OCwtMS42MzQ1OSAtNy40OTEyNCwtMS42Mzc0OTIgLTEuMjU2MiwtMC4wMzAwMyAtMi41MTI5MiwtMC4wMjE5NSAtMy43NjkzLC0wLjAwMzMgeiBtIDU5LjcwODk5LDAuMDA3OCBjIC0zLjIwNjk3LDAuMDMwMzQgLTYuNDQzMzgsMC41NTU4MjQgLTkuMzUyNjEsMS45NTY4ODIgLTUuMTA2NjEsMi4xNTU3MDEgLTkuMzI1NDgsNi4xNjE3NDcgLTExLjk4MDk1LDExLjAwNDIyIC0yLjY1NzA4LDQuNzg1MjggLTQuMTE0NTIsMTAuMTY5MSAtNC43NzYwMiwxNS41NzkxOCAtMC4zODg0OSw0LjkxNzI0IC0wLjQyNTY5LDkuODY5ODcgLTAuMTAwNjIsMTQuNzkxODcgMC42NDczOSw1Ljk3Njc2IDIuMjI1MTcsMTEuOTU1MTYgNS4zMTE3NiwxNy4xNTYxMyAyLjg3MjA2LDQuODUxMzggNy4zODAxNiw4Ljc3MzE0IDEyLjczOTA3LDEwLjYxMzY4IDcuMDc3OTQsMi40NTc5NCAxNS4wOTEzMiwyLjE0MDg0IDIxLjk1NzQ4LC0wLjg1NjE0IDIuNjYwMDYsLTEuMTM0ODYgNS4wMzY0MSwtMi44MTYwMiA3LjIzOSwtNC42NzE2IDAuMDA5LC0xMC4yNzE0OCAwLjAxODgsLTIwLjU0Mjk3IDAuMDI1NCwtMzAuODE0NDUgLTYuNzAzMTMsMCAtMTMuNDA2MjUsMCAtMjAuMTA5MzgsMCAwLDIuOTEwOCAwLDUuODIxNjEgMCw4LjczMjQyIDMuMzUxNTcsMCA2LjcwMzEzLDAgMTAuMDU0NjksMCAwLDUuOTY2NzkgMCwxMS45MzM1OSAwLDE3LjkwMDM5IC0yLjg1Nzc5LDIuMTM3MjkgLTYuNTQ4MDQsMi44MzQ1NSAtMTAuMDEzOSwyLjY3NTkyIC0zLjk5MjYsLTAuMTcxOCAtOC4xNDcwOSwtMS41NjQ0MSAtMTAuNzc3OTYsLTQuNzA4NjEgLTMuMjEyNjYsLTMuNzU1OTQgLTQuNjA2OTMsLTguNjkxMDggLTUuMzI3OTksLTEzLjQ5MDQxIC0wLjUzNjQ1LC00LjQ2NTUxIC0wLjYxNywtOC45MjY4NSAtMC40OTM2MywtMTMuNDMxNjEgMC4xMzQ2MSwtMy4xMDg5NiAwLjU2OTA1LC02LjI1MDM5IDEuMjY5NzMsLTkuMzM0MzUgMC44NjIyNywtMy42NDIzMSAyLjM4NjAxLC03LjQxMzYgNS4wNzk0MSwtMTAuMTc2OTUgMi4zMjcxMywtMi41NjQxMSA1LjY2NDksLTQuMDg1NTI0IDkuMTA0MjQsLTQuMzMyMzI0IDQuMDIxOTYsLTAuMzU5MjgxIDguMjQxNDQsMC4xMzgyNzUgMTEuNzc1MjEsMi4yMDk3MDQgMi41MzYyNiwxLjM5MDYyIDQuNzk5MTIsMy4yMDcyMSA3LjA1ODcyLDQuOTgxMjEgMCwtMy42NDY0OSAwLC03LjI5Mjk3NSAwLC0xMC45Mzk0NTkgLTIuNzkxOTQsLTEuNzA0MTM3IC01LjcxMTcyLC0zLjI1NTMyOSAtOC44OTA2NCwtNC4wOTkyODUgLTMuMTU1ODQsLTEuMDQzODUgLTYuNTIzODQsLTAuNzE5NjkgLTkuNzkxLC0wLjc0NjQxOCB6IG0gLTEzNi42Mjg5MSwxLjQyMzgyOCBjIDAsMjMuMzcxMDk0IDAsNDYuNzQyMTk0IDAsNzAuMTEzMjg0IDcuMzI3MzQsLTAuMDYzNSAxNC42OTMwMiwwLjIyMjk1IDIxLjk4MDQ3LC0wLjY5NzI3IDYuMTEyNTIsLTAuNzk0NjMgMTIuMjM3MDQsLTMuMjg4MjcgMTYuMzc2MDEsLTcuOTkyNzIgNC4yMTU5OCwtNC43MzA1NSA2LjE2NTI4LC0xMC45OTY2NiA3LjE3MjI3LC0xNy4xMzkwOCAwLjUxNTIyLC0zLjcwNjYgMC4yOTU5MywtNy40NjQzNyAwLjM0MDU1LC0xMS4xOTUxMiAwLjAxMjIsLTMuNTMxMzMgLTAuMDI2MSwtNy4wOTUwOSAtMC44NTM5NywtMTAuNTQ4MDIgLTEuMjM4ODEsLTUuOTQ2MjkgLTMuNzEzNzQsLTExLjg5ODcyIC04LjMyMDk1LC0xNi4wMjQ5MDUgLTQuNjIwMzIsLTQuMTk5MTg3IC0xMC44NjU1OCwtNi4xMTY0NjYgLTE2Ljk4ODA3LC02LjYyNjQxOSAtNi41NTI2NSwtMC41NjAzODggLTEzLjEzNzE4LC0wLjM4Mjg5MiAtMTkuNzA2MzEsLTAuNDE5MDQ3IDAsMC4xNzY0MzMgMCwwLjM1Mjg2NSAwLDAuNTI5Mjk3IHogbSA3OC42MDE1Nyw2Ljk4MDQ2OSBjIDIuODU3OTcsMC4wMDI1IDUuOTkwMzEsMS4wMzQ2ODEgNy45MDc3OCwzLjMzOTkxNSAyLjU2NjU2LDMuMDUxNTQgMy40OTIzOCw3LjA3Mjk4IDQuMTkwMTgsMTAuOTA0MDkgMC42NzYwNCwzLjg3NzQ1IDAuNjE0MTIsNy43OTYwMSAwLjcwNzQzLDExLjcyNTMyIDAuMDE2OCw0LjM0Njc4IDAuMDg2NCw4LjczNDA5IC0wLjMzNDY5LDEzLjAzMDY4IC0wLjYwNjU4LDQuMDA5NTEgLTEuMjI0MzIsOC4xNzQzNSAtMy4zMTkwNCwxMS43MjEyNSAtMS40NzIyNywyLjQ1Njc5IC00LjAyODQyLDQuMjg0OTEgLTYuODUyNDksNC43ODg4OSAtMy4xNDE0OCwwLjM4NjQyIC02LjY1NTA2LDAuMDUzNCAtOS4xMDMwNiwtMi4xNTY5NiAtMi44NTc4MSwtMi41Njk5NyAtMy45OTU0LC02LjQzNTc4IC00Ljc2Nzc1LC0xMC4wNzUyNyAtMS4yMjk3NSwtNS45MDU1IC0xLjEzMDA4LC0xMS45MzY4NiAtMS4wNzgxNiwtMTcuOTY4NzUgMC4xMTU3NywtNC42NDMyMyAwLjExMTk2LC05LjMxMjA2IDEuMjgwNCwtMTMuODQ3NjcgMC44MjE4MSwtMy4yODEzNSAxLjg2NzU5LC02LjgwNjkyIDQuNTg4MDUsLTkuMDM4NDUgMS44Njg4OSwtMS42MDMwNjYgNC4zMjk1OSwtMi40MzQxMDIgNi43ODEzNSwtMi40MjMwNDUgeiBtIC02Ni4yNDIxOSwxLjIyMjY1NiBjIDIuOTg3OTQsMC4wNjA4MyA2LjA3OTksMC4yMTgyMTUgOC45ODA0NywwLjc4OTA2OSAxLjg2MDQyLDAuMzc1ODIgMy44MzEyMSwwLjk4NDc5IDUuNDY2MzcsMS45MTYwNSAzLjMxMTM5LDEuNzYyMyA1LjQ0MzI4LDUuMTEzMTggNi41MjMxNyw4LjYyMDQ4IDEuMDk2MzIsMy40MTU3NyAxLjU1ODE0LDYuOTQ1NDQgMS42NTQ4NCwxMC40ODczOSAwLjE0NDU4LDQuNzIxNjUgMC4xNzcyNiw5LjQ0NzAzIC0wLjM0NDAzLDE0LjEyNjQzIC0wLjY0MTcsNC4zMTM2NCAtMS43NTMwMSw4Ljg0NDMzIC00Ljc4ODYzLDEyLjEzODcxIC0yLjkzMDI3LDMuMTYyMTMgLTcuMzIwOTcsNC4zMTU3MiAtMTEuNDcwMjQsNC43Mzk4OCAtMi41OTIzOCwwLjI0NTUxIC01LjE4MTI2LDAuMzczNzggLTcuNzk5MywwLjM1OTczIDAsLTE3LjcyNjU3IDAsLTM1LjQ1MzEzIDAsLTUzLjE3OTY5MiAwLjU5MjQ1LDYuNTFlLTQgMS4xODQ5LDAuMDAxMyAxLjc3NzM1LDAuMDAyIHoiIC8+PC9nPjwvZz48L2c+PC9nPjwvc3ZnPgo=";

  const generateVideoQR = async (url) => {
    // inline tiny QR via google charts API - works in print
    return `https://api.qrserver.com/v1/create-qr-code/?size=80x80&color=1E4A4B&data=${encodeURIComponent(url)}`;
  };

  const printExercisePlan = async (patient) => {
    const patExercises = exercises.filter(e => e.patient_id === patient.id);
    const date = new Date().toLocaleDateString("de-DE", {day:"2-digit",month:"long",year:"numeric"});

    // Build video QR entries
    const videoQRs = {};
    for (const ex of patExercises) {
      if (ex.video_url) {
        videoQRs[ex.id] = `https://api.qrserver.com/v1/create-qr-code/?size=80x80&color=1E4A4B&bgcolor=ffffff&data=${encodeURIComponent(ex.video_url)}`;
      }
    }

    const html = `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8"/>
<title>Übungsplan ${patient.name}</title>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=DM+Sans:wght@300;400;600;700&display=swap" rel="stylesheet"/>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:"DM Sans",sans-serif;color:#102828;background:white;padding:40px 48px;font-size:13px}
  /* HEADER */
  .header{text-align:center;padding-bottom:20px;margin-bottom:28px;border-bottom:1px solid #e0e0e0}
  .logo{height:72px;object-fit:contain;margin-bottom:10px;mix-blend-mode:multiply}
  .brand-name{font-family:"DM Sans",sans-serif;font-size:26px;font-weight:700;letter-spacing:6px;color:#102828;margin-bottom:6px}
  .brand-sub{font-size:10px;letter-spacing:3px;color:#555;text-transform:uppercase}
  /* META ROW */
  .meta-row{display:grid;grid-template-columns:1fr 1fr;align-items:start;margin-bottom:32px;gap:24px}
  .contact-block{display:flex;flex-direction:column;gap:7px}
  .contact-item{display:flex;align-items:center;gap:0;font-size:11px;color:#555}.contact-item svg{width:16px;flex-shrink:0;margin-right:7px}
  .contact-icon{width:14px;text-align:center;color:#3D8E8F;font-size:12px}
  .patient-block{text-align:right}
  .patient-label{font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#aaa;margin-bottom:6px}
  .patient-name{font-family:"Playfair Display",serif;font-size:19px;font-weight:700;color:#1E4A4B;margin-bottom:4px}
  .patient-meta{font-size:11px;color:#666;line-height:1.7}
  .patient-condition{font-size:11px;color:#3D8E8F;margin-top:3px;font-style:italic}
  .plan-date{font-size:10px;color:#aaa;margin-top:6px;letter-spacing:1px}
  /* DIVIDER */
  .divider{border:none;border-top:1px solid #e8e8e8;margin:0 0 28px}
  /* SECTION */
  .section-label{font-size:9px;letter-spacing:2.5px;text-transform:uppercase;color:#aaa;margin-bottom:18px}
  /* EXERCISE */
  .exercise{display:flex;gap:18px;margin-bottom:24px;padding-bottom:24px;border-bottom:1px solid #f0f0f0;page-break-inside:avoid}
  .exercise:last-child{border-bottom:none;margin-bottom:0;padding-bottom:0}
  .ex-img{width:88px;height:88px;border-radius:8px;object-fit:contain;background:#f7fbfb;flex-shrink:0;border:1px solid #e8f5f5;padding:4px}
  .ex-img-placeholder{width:88px;height:88px;border-radius:8px;background:#f7fbfb;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:30px;border:1px solid #e8f5f5}
  .ex-body{flex:1;min-width:0}
  .ex-title{font-family:"Playfair Display",serif;font-size:14px;font-weight:700;color:#102828;margin-bottom:5px}
  .ex-tags{display:flex;gap:5px;flex-wrap:wrap;margin-bottom:8px}
  .tag{font-size:9px;font-weight:600;padding:2px 8px;border-radius:20px;background:#f0f9f9;color:#3D8E8F;letter-spacing:0.3px}
  .tag-freq{background:#1E4A4B;color:white}
  .tag-diff-leicht{background:#e8f8f0;color:#2E7D32}
  .tag-diff-mittel{background:#fff3e0;color:#e65100}
  .tag-diff-schwer{background:#fde8e8;color:#c0392b}
  .ex-desc{font-size:11.5px;color:#444;line-height:1.65;margin-bottom:10px}
  .steps-label{font-size:9px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#3D8E8F;margin-bottom:7px}
  .step{display:flex;gap:9px;margin-bottom:5px;align-items:flex-start}
  .step-num{width:18px;height:18px;border-radius:50%;background:#5fb8b9;color:white;font-size:9px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px}
  .step-text{font-size:11.5px;color:#333;line-height:1.55}
  .video-row{display:flex;align-items:center;gap:10px;margin-top:10px;padding:8px 10px;background:#f7fbfb;border-radius:7px;border:1px solid #e0f0f0}
  .video-qr{width:44px;height:44px;flex-shrink:0}
  .video-text{font-size:10px;color:#3D8E8F;line-height:1.5}
  .video-url{font-size:9px;color:#aaa;word-break:break-all;margin-top:1px}
  /* FOOTER SECTION */
  .footer-divider{border:none;border-top:1px solid #e0e0e0;margin:36px 0 24px}
  .footer-cols{display:flex;justify-content:space-between;gap:32px;margin-bottom:28px}
  .footer-col{flex:1}
  .footer-col-label{font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#aaa;margin-bottom:10px}
  .qr-box{display:flex;flex-direction:column;align-items:center;gap:6px}
  .qr-img{width:72px;height:72px}
  .qr-label{font-size:9px;color:#888;text-align:center;line-height:1.4}
  .footer-note{font-size:10px;color:#aaa;text-align:center;padding-top:18px;border-top:1px solid #f0f0f0;line-height:1.7}.print-footer{display:none;position:fixed;bottom:0;left:0;right:0;padding:6px 28px;background:white;border-top:1px solid #eee;font-size:8px;color:#aaa;font-family:sans-serif;display:flex;justify-content:space-between;align-items:center}
  @media print{body{padding:20px 28px}@page{margin:0.8cm}.no-print{display:none}.print-footer{display:block!important}}
</style>
</head>
<body>

<!-- HEADER -->
<div class="header">
  <img class="logo" src="${LOGO_BLACK}" alt="Fit Fun Dog"/>
  <div class="brand-name">F|T&nbsp;&nbsp;FUN&nbsp;&nbsp;DOG</div>
  <div class="brand-sub">P&nbsp;H&nbsp;Y&nbsp;S&nbsp;I&nbsp;O&nbsp;T&nbsp;H&nbsp;E&nbsp;R&nbsp;A&nbsp;P&nbsp;I&nbsp;E&nbsp;&nbsp;&amp;&nbsp;&nbsp;O&nbsp;S&nbsp;T&nbsp;E&nbsp;O&nbsp;P&nbsp;A&nbsp;T&nbsp;H&nbsp;I&nbsp;E&nbsp;&nbsp;F&Uuml;&nbsp;R&nbsp;&nbsp;T&nbsp;I&nbsp;E&nbsp;R&nbsp;E</div>
</div>

<!-- META ROW: contact left, patient right -->
<div class="meta-row">
  <div class="contact-block">
    <div class="contact-item"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#3D8E8F" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg><a href="https://www.fit-fun-dog.de" target="_blank" style="color:#555;text-decoration:none">www.fit-fun-dog.de</a></div>
    <div class="contact-item"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#3D8E8F" stroke-width="2.5" stroke-linecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg><a href="mailto:info@fit-fun-dog.de" style="color:#555;text-decoration:none">info@fit-fun-dog.de</a></div>
    <div class="contact-item"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#3D8E8F" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>0159 / 04976681</div>
  </div>
  <div class="patient-block">
    <div class="patient-label">P&nbsp;A&nbsp;T&nbsp;I&nbsp;E&nbsp;N&nbsp;T</div>
    <div class="patient-name">${patient.avatar||""} ${patient.name}</div>
    <div class="patient-meta">
      ${[patient.breed, patient.age ? patient.age+" Jahre":"", patient.owner].filter(Boolean).join(" · ")}
    </div>
    ${patient.condition ? `<div class="patient-condition">${patient.condition}</div>` : ""}
    <div class="plan-date">Ü B U N G S P L A N &nbsp;·&nbsp; ${date}</div>
  </div>
</div>

<hr class="divider"/>
<div class="section-label">H&nbsp;E&nbsp;I&nbsp;M&nbsp;Ü&nbsp;B&nbsp;U&nbsp;N&nbsp;G&nbsp;E&nbsp;N &nbsp;·&nbsp; ${patExercises.length} Übung${patExercises.length!==1?"en":""}</div>

<!-- EXERCISES -->
${patExercises.map((ex) => `
<div class="exercise">
  ${ex.image_url
    ? `<img class="ex-img" src="${ex.image_url}" alt="${ex.title}"/>`
    : `<div class="ex-img-placeholder">🐾</div>`}
  <div class="ex-body">
    <div class="ex-title">${ex.title}</div>
    <div class="ex-tags">
      ${(ex.categories||[]).map(c=>`<span class="tag">${c}</span>`).join("")}
      ${ex.difficulty ? `<span class="tag tag-diff-${ex.difficulty.toLowerCase()}">${ex.difficulty}</span>` : ""}
      ${ex.repeat_count ? `<span class="tag tag-freq">${ex.repeat_count}× pro Woche</span>` : ""}
      ${ex.duration ? `<span class="tag">${ex.duration}</span>` : ""}
    </div>
    ${ex.description ? `<div class="ex-desc">${ex.description}</div>` : ""}
    ${ex.instructions && ex.instructions.filter(Boolean).length > 0 ? `
      <div class="steps-label">S C H R I T T &nbsp; F Ü R &nbsp; S C H R I T T</div>
      ${ex.instructions.filter(Boolean).map((step,j) => `
      <div class="step">
        <div class="step-num">${j+1}</div>
        <div class="step-text">${step}</div>
      </div>`).join("")}` : ""}
    ${ex.video_url ? `
      <div class="video-row">
        <img class="video-qr" src="https://api.qrserver.com/v1/create-qr-code/?size=88x88&color=1E4A4B&bgcolor=f7fbfb&data=${encodeURIComponent(ex.video_url)}" alt="Video QR"/>
        <div>
          <div class="video-text">Video zur Übung ansehen</div>
          <a href="${ex.video_url}" target="_blank" style="font-size:9px;color:#3D8E8F;word-break:break-all;display:block;margin-top:2px">${ex.video_url}</a>
        </div>
      </div>` : ""}
  </div>
</div>`).join("")}

<!-- FOOTER -->
<div class="footer-divider"></div>
<div class="footer-cols">
  <div class="footer-col" style="text-align:center">
    <div class="footer-col-label">A P P</div>
    <div class="qr-box">
      <img class="qr-img" src="${APP_QR}" alt="App QR"/>
    </div>
  </div>
  <div class="footer-col" style="text-align:center">
    <div class="footer-col-label">T E R M I N &nbsp; B U C H E N</div>
    <div class="qr-box">
      <img class="qr-img" src="${BOOKING_QR}" alt="Termin QR"/>
    </div>
  </div>
</div>
<div class="footer-note">
  Made with Love by Claudia · <a href="https://fitfundog.vercel.app/" target="_blank" style="color:#3D8E8F;text-decoration:none">Fit Fun Dog</a>
</div>

<div class="print-footer"><span>Fit Fun Dog · Tierphysiotherapie &amp; Osteopathie · www.fit-fun-dog.de</span><span>info@fit-fun-dog.de · 0159 / 04976681</span></div>
</body></html>`;

    // PWA-safe: use blob URL instead of window.open with content
    const blob = new Blob([html], {type: "text/html"});
    const url = URL.createObjectURL(blob);

    // Try Web Share API first (mobile PWA) - share as URL to open in browser
    // For print: open blob in same tab briefly, then restore
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;

    if (isStandalone) {
      // PWA mode: open in same tab, user prints, back button returns to app
      const printWindow = window.open(url, "_blank");
      if (printWindow) {
        printWindow.onload = () => { printWindow.print(); };
      } else {
        // Fallback: navigate current tab
        const a = document.createElement("a");
        a.href = url;
        a.download = `Uebungsplan_${patient.name.replace(/\s+/g,"-")}.html`;
        a.click();
      }
    } else {
      const printWindow = window.open(url, "_blank");
      if (printWindow) {
        printWindow.onload = () => { printWindow.focus(); printWindow.print(); };
      }
    }

    setTimeout(() => URL.revokeObjectURL(url), 60000);
  };



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
  if(isRecoveryMode)return <PasswordResetScreen onDone={()=>{sessionStorage.removeItem("_recovery");setIsRecoveryMode(false);window.location.hash="";}} />;
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
                <button className="btn" onClick={()=>setLangOpen(o=>!o)} style={{display:"flex",alignItems:"center",background:"#2A6364",borderRadius:9,padding:"7px 9px"}}>
                  <Icon name="lang" size={15} color={ACCENT}/>
                </button>
                {langOpen&&<div style={{position:"absolute",right:0,top:"calc(100% + 6px)",background:"white",borderRadius:12,boxShadow:"0 8px 24px rgba(0,0,0,0.15)",overflow:"hidden",minWidth:140,zIndex:50}}>
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
            {[["owner","home",isAdmin?"Vorschau":t.navOwner],...(isAdmin?[["therapist","practice",t.navTherapist]]:[["profile","profile",t.navProfile]]),["info","info",t.navInfo]].map(([v,ic,lb])=>(
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
          {isAdmin&&(
            <div style={{background:BRAND+"18",border:`1.5px solid ${BRAND}`,borderRadius:12,padding:"10px 14px",marginBottom:14,display:"flex",alignItems:"center",gap:8}}>
              <Icon name="info" size={15} color={BRAND}/>
              <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:600,color:MID}}>Vorschau — so sehen Ihre Kunden die App</span>
            </div>
          )}
          {mustChangePassword&&(
            <div style={{background:"#FFF8E1",border:"1.5px solid #FFB300",borderRadius:12,padding:"14px 16px",marginBottom:14}}>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,fontWeight:700,color:"#E65100",marginBottom:6,display:"flex",alignItems:"center",gap:8}}><Icon name="lock" size={16} color="#E65100"/>Bitte Passwort ändern</div>
              <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"#5D4037",marginBottom:10}}>Aus Sicherheitsgründen bitte ein eigenes Passwort vergeben.</div>
              <div style={{display:"flex",gap:8}}>
                <input type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} placeholder="Neues Passwort..." style={{...inp,flex:1}}/>
                <button className="btn" onClick={changePassword} disabled={saving||!newPassword} style={{background:newPassword?BRAND:"#B8DFE0",color:"#102828",borderRadius:9,padding:"8px 14px",fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:700,flexShrink:0}}>{saving?"...":"Speichern"}</button>
              </div>
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
            {/* ── Dankestext wenn alles erledigt ── */}
            {allDone&&(
              <div style={{background:`linear-gradient(135deg,#0F3D2E 0%,${DARK} 100%)`,borderRadius:16,padding:"14px 16px",marginBottom:10,display:"flex",alignItems:"center",gap:12,boxShadow:"0 4px 16px rgba(30,74,75,0.3)"}}>
                <div style={{fontSize:36,lineHeight:1,flexShrink:0}}>{ownerPatient.avatar||"🐕"}</div>
                <div>
                  <div style={{fontFamily:"'Playfair Display',serif",fontSize:17,fontWeight:700,color:"#6EE7B7",marginBottom:2}}>Alle erledigt!</div>
                  <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"#B8E8E8"}}>{ownerPatient.name} sagt Danke!</div>
                </div>
                <div style={{marginLeft:"auto",flexShrink:0}}>
                  <Icon name="check" size={22} color="#6EE7B7"/>
                </div>
              </div>
            )}
            {/* ── Stat tiles ── */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
              {/* Tile 1: Wochenfortschritt */}
              <div style={{background:`linear-gradient(135deg,${DARK} 0%,${MID} 100%)`,borderRadius:16,padding:"16px 14px 14px",boxShadow:"0 4px 16px rgba(30,74,75,0.25)",display:"flex",flexDirection:"column",justifyContent:"space-between",minHeight:120}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:ACCENT,letterSpacing:"1px",textTransform:"uppercase"}}>Diese Woche</div>
                  <div style={{fontSize:22,lineHeight:1}}>{ownerPatient.avatar||"🐕"}</div>
                </div>
                <div>
                  <div style={{fontFamily:"'Playfair Display',serif",fontSize:42,fontWeight:700,color:"white",lineHeight:1}}>{doneCount}</div>
                  <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:allDone?"#6EE7B7":ACCENT,marginTop:3,fontWeight:allDone?700:400}}>
                    {allDone?"Alle erledigt!":`von ${totalCount} Übungen`}
                  </div>
                </div>
                <div style={{marginTop:10,height:4,borderRadius:99,background:"rgba(255,255,255,0.15)"}}>
                  <div style={{height:"100%",borderRadius:99,background:allDone?"#6EE7B7":ACCENT,width:`${progress}%`,transition:"width .5s ease"}}/>
                </div>
              </div>
              {/* Tile 2: Streak */}
              <div style={{background:`linear-gradient(135deg,${MID} 0%,${BRAND} 100%)`,borderRadius:16,padding:"16px 14px 14px",boxShadow:"0 4px 16px rgba(95,184,185,0.25)",display:"flex",flexDirection:"column",justifyContent:"space-between",minHeight:120}}>
                <div style={{display:"flex",alignItems:"center",gap:5}}>
                  <Icon name="star" size={12} color="#FBBF24"/>
                  <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:"#E6F6F6",letterSpacing:"1px",textTransform:"uppercase"}}>Streak</div>
                </div>
                <div>
                  <div style={{fontFamily:"'Playfair Display',serif",fontSize:42,fontWeight:700,color:"white",lineHeight:1}}>
                    {streak>0?streak:"—"}
                  </div>
                  <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"#E6F6F6",marginTop:3}}>
                    {streak===1?"Tag in Folge":streak>1?"Tage in Folge":"Noch kein Streak"}
                  </div>
                </div>
                <div style={{marginTop:10,display:"flex",gap:4}}>
                  {[0,1,2,3,4,5,6].map(i=>(
                    <div key={i} style={{flex:1,height:4,borderRadius:99,background:i<(streak%7||7)?"rgba(255,255,255,0.75)":"rgba(255,255,255,0.2)"}}/>
                  ))}
                </div>
              </div>
            </div>
            {/* ── 28-Tage Kalender ── */}
            <div style={{background:PALE,borderRadius:14,marginBottom:14,overflow:"hidden",border:`1px solid ${LIGHT}`}}>
              <button className="btn" onClick={()=>setCalendarOpen(o=>!o)} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",gap:4}}>
                <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"#3D7070",letterSpacing:"0.8px",textTransform:"uppercase",fontWeight:600}}>Letzte 28 Tage</span>
                <Icon name="chevdown" size={12} color={MID}/>
              </button>
              {calendarOpen&&(
                <div style={{padding:"0 14px 12px",display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4}}>
                  {calendarDays.map(({dateStr,isToday,done})=>(
                    <div key={dateStr} style={{height:22,borderRadius:6,background:done?BRAND:isToday?ACCENT+"40":LIGHT,outline:isToday?`2px solid ${ACCENT}`:"none",outlineOffset:1}}/>
                  ))}
                </div>
              )}
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

      {/* PROFILE VIEW */}
      {view==="profile"&&!isAdmin&&(
        <div style={{maxWidth:480,margin:"0 auto",padding:"16px 14px 80px"}}>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:700,color:DARK,marginBottom:4}}>{t.navProfile}</div>
          <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"#3D7070",marginBottom:20}}>
            {ownerPatient?.owner||""}
          </div>

          {/* Push notifications card */}
          <div className="card" style={{padding:"18px 20px",marginBottom:12}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
              <div style={{width:40,height:40,borderRadius:12,background:pushEnabled?BRAND+"18":LIGHT,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <Icon name={pushEnabled?"bell":"belloff"} size={20} color={pushEnabled?BRAND:"#3D7070"}/>
              </div>
              <div style={{flex:1}}>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:700,color:DARK}}>Erinnerungen</div>
                <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"#3D7070",marginTop:1}}>
                  {pushEnabled?"Täglich aktiv — nur bei offenen Übungen":"Erinnert dich täglich an deine Übungen"}
                </div>
              </div>
            </div>

            {pushEnabled&&(
              <div style={{background:LIGHT,borderRadius:12,padding:"14px 16px",marginBottom:14}}>
                <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:700,color:"#3D7070",letterSpacing:".7px",textTransform:"uppercase",marginBottom:10}}>Erinnerungszeit</div>
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,flex:1,background:"white",borderRadius:10,border:`1.5px solid ${BRAND}`,padding:"10px 14px"}}>
                    <Icon name="clock" size={16} color={BRAND}/>
                    <input type="time" value={pushTime} onChange={e=>updatePushTime(e.target.value)}
                      style={{fontFamily:"'DM Sans',sans-serif",fontSize:15,fontWeight:600,color:DARK,border:"none",outline:"none",background:"transparent",WebkitTextFillColor:DARK,flex:1}}/>
                  </div>
                  <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"#3D7070"}}>Uhr</div>
                </div>
                <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:ACCENT,marginTop:8}}>
                  Die Erinnerung wird nur gesendet wenn noch Übungen offen sind.
                </div>
              </div>
            )}

            <button className="btn" onClick={pushEnabled?disablePush:enablePush} disabled={pushLoading}
              style={{width:"100%",padding:"13px",borderRadius:12,background:pushEnabled?"#FFE8E8":BRAND,color:pushEnabled?"#C0392B":"#102828",fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
              <Icon name={pushEnabled?"belloff":"bell"} size={16} color={pushEnabled?"#C0392B":"#102828"}/>
              {pushLoading?"...":(pushEnabled?"Erinnerungen deaktivieren":"Erinnerungen aktivieren")}
            </button>
          </div>
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
                        <button className="iBtn" title="Übungsplan drucken" onClick={()=>printExercisePlan(p)} style={{background:"#E8F5E9"}}><Icon name="print" size={14} color="#2E7D32"/></button>
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
                <div style={{display:"flex",gap:8,marginBottom:14}}>
                  <button className="btn" onClick={()=>setSheet("addExercise")} style={{flex:1,background:DARK,color:"#E6F6F6",borderRadius:12,padding:"12px",fontSize:13,fontFamily:"'DM Sans',sans-serif",fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                    <Icon name="assign" size={16} color="#E6F6F6"/> Übung zuweisen
                  </button>
                  <button className="iBtn" title="Übungsplan drucken" onClick={()=>printExercisePlan(selectedPatient)} style={{background:"#E8F5E9",width:44,height:44,borderRadius:12,flexShrink:0}}><Icon name="print" size={16} color="#2E7D32"/></button>
                </div>
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
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <div style={{flex:1}}><SL text={t.step1}/>
                  <CustomSelect value={selectedPatient?.id||""} onChange={e=>setSelectedPatient(patients.find(p=>p.id===e.target.value)||null)}>
                    <option value="">{t.selectPatient}</option>
                    {patients.map(p=><option key={p.id} value={p.id}>{patLabel(p)}</option>)}
                  </CustomSelect>
                </div>
              </div>
              <div style={{display:"flex",gap:8}}>
                <div style={{flex:1}}><SL text={t.step3}/><input value={duration} onChange={e=>setDuration(e.target.value)} placeholder={t.freqPh} style={inp}/></div>
                <div style={{flex:"0 0 auto"}}>
                  <SL text={t.step4}/>
                  <div style={{display:"flex",alignItems:"center",gap:6,height:46}}>
                    <button className="btn" onClick={()=>setRepeatCount(Math.max(1,repeatCount-1))} style={{width:32,height:32,borderRadius:8,background:LIGHT,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:700,color:DARK}}>−</button>
                    <span style={{fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:700,color:DARK,minWidth:28,textAlign:"center"}}>{repeatCount}x</span>
                    <button className="btn" onClick={()=>setRepeatCount(Math.min(7,repeatCount+1))} style={{width:32,height:32,borderRadius:8,background:BRAND,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:700,color:"#102828"}}>+</button>
                  </div>
                </div>
              </div>
              <div>
                <SL text={t.step2}/>
                <div style={{display:"flex",gap:8,marginBottom:8}}>
                  <FilterDropdown label={t.filterCategory} icon="filter" options={CATEGORIES} selected={assignFilterCats} onChange={setAssignFilterCats} color={BRAND}/>
                  <FilterDropdown label={t.filterRegion} icon="target" options={TARGET_REGIONS} selected={assignFilterRegions} onChange={setAssignFilterRegions} color={MID}/>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:4,maxHeight:300,overflowY:"auto",border:`1px solid ${LIGHT}`,borderRadius:11,padding:5}}>
                  {filteredTemplates.map(tmpl=>(
                    <div key={tmpl.id} className={"tmpl-row"+(selectedTemplate?.id===tmpl.id?" sel":"")} onClick={()=>setSelectedTemplate(selectedTemplate?.id===tmpl.id?null:tmpl)}>
                      {tmpl.image_url?<img src={tmpl.image_url} alt={tmpl.title} style={{width:32,height:32,borderRadius:6,objectFit:"contain",flexShrink:0,background:LIGHT,padding:2}}/>
                        :<div style={{width:32,height:32,borderRadius:6,background:LIGHT,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Icon name="paw" size={14} color={ACCENT}/></div>}
                      <div style={{flex:1,fontFamily:"'Playfair Display',serif",fontSize:13,fontWeight:600,color:"#102828"}}>{tmpl.title}</div>
                      {selectedTemplate?.id===tmpl.id&&<Icon name="check" size={15} color={BRAND}/>}
                    </div>
                  ))}
                  {filteredTemplates.length===0&&<div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:ACCENT,textAlign:"center",padding:"12px 0"}}>{t.noCategoryEx}</div>}
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
