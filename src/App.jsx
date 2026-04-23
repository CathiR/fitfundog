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
  const LOGO_BLACK = "data:image/png;base64,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/wAGE/8A8XR/wvH41f8AQ4a3/wCDCf8A+Lo/tb4K/wDQv63/AODiD/5X1hfEfw9YeEfiHr3hTSmke10zUbq0haUhpDHDKyKWICgtgDJAAz2FAH7Of8E/viz8VNQ+DepzX/ibVZ3GtTKGkvZmOPIg4yWr7m/4WX8Rv+hg1L/wKl/+Kr82f+Cef/JFtT/7Dc//AKIt6+8KAP/Q/hP+N/8AyWnxf/2G9Q/9HvRq3/JFtA/7Der/APojT6Pjf/yWnxf/ANhvUP8A0e9Grf8AJFtA/wCw3q//AKI0+gDy+iiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAr1D4vf8jXaf9gTQ/8A03W1eX16h8Xv+RrtP+wJof8A6bragA0n/ki2v/8AYb0j/wBEahXl9eoaT/yRbX/+w3pH/ojUK8voA7P4cf8AJQ9B/wCwja/+jVrK8Vf8jPqX/X1N/wChmtX4cf8AJQ9B/wCwja/+jVrK8Vf8jPqX/X1N/wChmgDstW/5ItoH/Yb1f/0Rp9eX16hq3/JFtA/7Der/APojT68voAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACvUPjf/yWnxf/ANhvUP8A0e9eX16h8b/+S0+L/wDsN6h/6PegD9QP+Cef/JFtT/7Dc/8A6It6+8K+D/8Agnn/AMkW1P8A7Dc//oi3r7woA//R/hP+N/8AyWnxf/2G9Q/9HvRq3/JFtA/7Der/APojT6Pjf/yWnxf/ANhvUP8A0e9Grf8AJFtA/wCw3q//AKI0+gDy+iiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAr1D4vf8jXaf9gTQ/8A03W1eX16h8Xv+RrtP+wJof8A6bragA0n/ki2v/8AYb0j/wBEahXl9eoaT/yRbX/+w3pH/ojUK8voA7P4cf8AJQ9B/wCwja/+jVrK8Vf8jPqX/X1N/wChmtX4cf8AJQ9B/wCwja/+jVrK8Vf8jPqX/X1N/wChmgDstW/5ItoH/Yb1f/0Rp9eX16hq3/JFtA/7Der/APojT68voAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACvUPjf/yWnxf/ANhvUP8A0e9eX16h8b/+S0+L/wDsN6h/6PegD9QP+Cef/JFtT/7Dc/8A6It6+8K+D/8Agnn/AMkW1P8A7Dc//oi3r7woA//S/hP+N/8AyWnxf/2G9Q/9HvRq3/JFtA/7Der/APojT6Pjf/yWnxf/ANhvUP8A0e9Grf8AJFtA/wCw3q//AKI0+gDy+iiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAr1D4vf8jXaf9gTQ/8A03W1eX16h8Xv+RrtP+wJof8A6bragA0n/ki2v/8AYb0j/wBEahXl9eoaT/yRbX/+w3pH/ojUK8voA7P4cf8AJQ9B/wCwja/+jVrK8Vf8jPqX/X1N/wChmtX4cf8AJQ9B/wCwja/+jVrK8Vf8jPqX/X1N/wChmgDstW/5ItoH/Yb1f/0Rp9eX16hq3/JFtA/7Der/APojT68voAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACvUPjf/yWnxf/ANhvUP8A0e9eX16h8b/+S0+L/wDsN6h/6PegD9QP+Cef/JFtT/7Dc/8A6It6+8K+D/8Agnn/AMkW1P8A7Dc//oi3r7woA//T/hP+N/8AyWnxf/2G9Q/9HvRq3/JFtA/7Der/APojT6Pjf/yWnxf/ANhvUP8A0e9Grf8AJFtA/wCw3q//AKI0+gDy+iiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAr1D4vf8jXaf9gTQ/8A03W1eX16h8Xv+RrtP+wJof8A6bragA0n/ki2v/8AYb0j/wBEahXl9eoaT/yRbX/+w3pH/ojUK8voA7P4cf8AJQ9B/wCwja/+jVrK8Vf8jPqX/X1N/wChmtX4cf8AJQ9B/wCwja/+jVrK8Vf8jPqX/X1N/wChmgDstW/5ItoH/Yb1f/0Rp9eX16hq3/JFtA/7Der/APojT68voAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACvUPjf/yWnxf/ANhvUP8A0e9eX16h8b/+S0+L/wDsN6h/6PegD9QP+Cef/JFtT/7Dc/8A6It6+8K+D/8Agnn/AMkW1P8A7Dc//oi3r7woA//U/hP+N/8AyWnxf/2G9Q/9HvRq3/JFtA/7Der/APojT6Pjf/yWnxf/ANhvUP8A0e9Grf8AJFtA/wCw3q//AKI0+gDy+iiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAr1D4vf8jXaf9gTQ/8A03W1eX16h8Xv+RrtP+wJof8A6bragA0n/ki2v/8AYb0j/wBEahXl9eoaT/yRbX/+w3pH/ojUK8voA7P4cf8AJQ9B/wCwja/+jVrK8Vf8jPqX/X1N/wChmtX4cf8AJQ9B/wCwja/+jVrK8Vf8jPqX/X1N/wChmgDstW/5ItoH/Yb1f/0Rp9eX16hq3/JFtA/7Der/APojT68voAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACvUPjf/yWnxf/ANhvUP8A0e9eX16h8b/+S0+L/wDsN6h/6PegD9QP+Cef/JFtT/7Dc/8A6It6+8K+D/8Agnn/AMkW1P8A7Dc//oi3r7woA//V/hP+N/8AyWnxf/2G9Q/9HvRq3/JFtA/7Der/APojT6Pjf/yWnxf/ANhvUP8A0e9Grf8AJFtA/wCw3q//AKI0+gDy+iiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAr1D4vf8jXaf9gTQ/8A03W1eX16h8Xv+RrtP+wJof8A6bragA0n/ki2v/8AYb0j/wBEahXl9eoaT/yRbX/+w3pH/ojUK8voA7P4cf8AJQ9B/wCwja/+jVrK8Vf8jPqX/X1N/wChmtX4cf8AJQ9B/wCwja/+jVrK8Vf8jPqX/X1N/wChmgDstW/5ItoH/Yb1f/0Rp9eX16hq3/JFtA/7Der/APojT68voAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKK9X0Hwd4CPgm18YeNdZv7E3t9dWcUNjp8d3xaxwOzM0l1b4z54AAB+6TnmtrS/Afwp8UPdad4R8Q6tLfwWN7fIl3pMMELixt5LllMiX0rKWWMgEIeSO1AHh1FFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFeofG//ktPi/8A7Deof+j3ry+vUPjf/wAlp8X/APYb1D/0e9AH6gf8E8/+SLan/wBhuf8A9EW9feFf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q41G0+hjMMuP/I2fxoAzvhNdNZfFPwzeKcGHVbJwf92ZDXI6xB9l1e6tv+eczr+TEVqeC5/svjHSbrp5d7A35ODUnjqD7L421i16eXfXC/lIwoA5WiiigD1DwB/yKnjj/sCRf+nGyry+vVvh5EJPCPjt842aFC3TOf8AiZ2I/DrXlNAHqHj/AP5FTwP/ANgSX/043tHxp/5KlrP/AF3H/oIqT4h7P+ES8Cqv3hocu4ehOpXxH6YqP40/8lS1n/ruP/QRQBZ+Co/4reY+mj60fy065NeTV618FP8Akdbj/sC65/6bbmvJaAPRPhnrWmafrsuieIpRDpOuwNp17IwJESSMrRzYALHyJkjmKrguE2Zwxrj9b0bU/Dms3fh7WojBeWE0lvPGSCUliYqy5GRwQRway69Y8aY8WeENL+IcXzXMATSdTx2mgT/RpT2AmgXYO7PBIx5NADteJ8ZfDux8Vj57/QTHpd8erPbMCbSU9SdoV4GPCoiQqOWo1k/8WK8Nj/qPa0f/ACX02sX4a6/pmi+IjY+I3KaPq8LafqJALbYJiCJQoBLNBIqTqo+80YHQ11Xj3QtU8KfDvSvCutKEutP13WoZlVgyiREskbBHBHy8EHBHIoA8Vr139oH/AJLz43/7D+pf+lEleRV67+0D/wAl58b/APYf1L/0okoA8iooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAr1D43/APJafF//AGG9Q/8AR715fXqHxv8A+S0+L/8AsN6h/wCj3oA/UD/gnn/yRbU/+w3P/wCiLevvCvg//gnn/wAkW1P/ALDc/wD6It6+8KAP/9H+E/43/wDJafF//Yb1D/0e9Grf8kW0D/sN6v8A+iNPo+N//JafF/8A2G9Q/wDR70at/wAkW0D/ALDer/8AojT6APL6KKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACvUPi9/yNdp/2BND/wDTdbV5fXqHxe/5Gu0/7Amh/wDputqADSf+SLa//wBhvSP/AERqFeX16hpP/JFtf/7Dekf+iNQry+gDs/hx/wAlD0H/ALCNr/6NWsrxV/yM+pf9fU3/AKGa1fhx/wAlD0H/ALCNr/6NWsrxV/yM+pf9fU3/AKGaAOy1b/ki2gf9hvV//RGn15fXqGrf8kW0D/sN6v8A+iNPry+gAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAr1D4q/8hLR/+wJpv/ohK8vr1D4q/wDIS0f/ALAmm/8AohKAD4Lf8lW0E/3btD+XNeX16h8F+PijozekxP5Ka8voAKKKKACiiigAr1G9H2z4K6Ybb5/7O1u++0Y/5Z/bYLbyc/7/ANmmx/uGvLq9R+G9zZaomo/DrVpkgg15EFtLKwSOHUICTbuzHACtukgZmYIizF2+5QB5jHI8TrLGcMpBBHYivTvjbAIfi94kmiGILvUbi7tmH3ZLa6czQyL6rJE6up7qQa871HTtQ0fUJ9I1eCS1u7WRoZoZlKSRyIdrKynBVlIIIIyDXoul+K/DWv6Hb+FviMtwq2KlLHUrRFluLePJYxPE7xrNFknaDIjRliQxUbCAeW0V6i3w60GfjS/GGjXJ67W+1wMB7ma2Rc+wY/jUkfhD4eaSftfiLxVBfRJ1ttJgnkuHb+7uuIoIlU9DIGkK5BCOKADwsr6P8MvFGvz8LqYtdGhU8F2aZLuR1z18sWyK+OnmpnqM+VV2vjHxifEzW2nabarpukacrJZWSMXEYfBeSRyAZJpCAZJCBnAVQkaIiW/h14Ysdf1h9S8RB00PSUF3qciHa3kKQBGh5/ezMRFH23MCcKGIANH4uDyPEljpafKlno+lRhP7jvZxSSqfQ+a7lh2Ymk+NP/JUtZ/67j/0EVxfifxDqHi3xJqHirVtv2rU7mW6m2DavmTMXbA7DJOBXafGn/kqWs/9dx/6CKALXwU/5HW4/wCwLrn/AKbbmvJa9R+DzFfGE5U4/wCJRrP66fcV5dQAV6Z8MNQspdUufBOtzJBp3iKL7G8srBY4LjIa3nYnhVjlC+Y+CRC0gHLV5nRQBc1DT77Sb+fS9Uhe3ubaRopopFKukiHDKwPIIIwQehr0Txv8S5fG3hLw74durNYbjQ4ZIproPk3WRHHGSmAE8uCGKLgnds3HkmrPxC/4qnRtM+J8PzTXwNlqnqL+2UDzG6n/AEiIpIXY5km84jha8moAK9Z+Pkiy/HTxpKhyG17USD7G4evJq9Q+N/8AyWnxf/2G9Q/9HvQB5fRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABXqHxv/AOS0+L/+w3qH/o968vr1D43/APJafF//AGG9Q/8AR70AfqB/wTz/AOSLan/2G5//AERb194V8H/8E8/+SLan/wBhuf8A9EW9feFAH//S/hP+N/8AyWnxf/2G9Q/9HvRq3/JFtA/7Der/APojT6Pjf/yWnxf/ANhvUP8A0e9Grf8AJFtA/wCw3q//AKI0+gDy+iiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAr1D4vf8jXaf9gTQ/8A03W1eX16h8Xv+RrtP+wJof8A6bragA0n/ki2v/8AYb0j/wBEahXl9eoaT/yRbX/+w3pH/ojUK8voA7P4cf8AJQ9B/wCwja/+jVrK8Vf8jPqX/X1N/wChmtX4cf8AJQ9B/wCwja/+jVrK8Vf8jPqX/X1N/wChmgDstW/5ItoH/Yb1f/0Rp9eX16hq3/JFtA/7Der/APojT68voAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAK+hvG3w0+I/iwaLrXhbw/qWpWb6Np6rPa2ks0RZIVVgGRSMqwIPPBBFfPNFAH0b8MfhV8UPDvjiy13xB4b1SxsrRZppri4s5ooo0SNiWZ2UKoHck4r5yoooAKKKKACiiigAooooA9ml8WeHviXbQWfxHnaw1i2iSCHWlQyrNHGNqJeIoLtsGAJ4w0gVdrRyfKU57VvhT450ywl1u2sjqelwrve/wBOYXdqq9t8kW4RNgglJNjqCNyivOqv6XquqaJfxarotzLZ3UB3RzQOY5EPqrKQQfoaAKFX9M0vU9av4tK0a2lu7qdtscMKGSR29FVQST9BXof/AAvL41lNh8Ya3tznH9oT4z6/fqlqvxg+LWu2Uuma54p1e8tp12SxT300iOvoys5BHsaANNPhVeaF/pPxPvE8Nwr963lAl1Jv9lbMMsikjlTOYY2H8fIzk+K/G8Op6VF4P8K2x0zQbaXz1ty/mS3E+CvnXEgC+ZIFJVAF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8HzJBIjboSK8hoA09Z1rWPEWpza14gu5r68uDulnuJGllc9MszEknHqa2PDfgPxx4xjll8I6NfaqsBAkNnbyThCegbYpxn3rtrfT9E+GmkWuteILWLUdfv4UubSynG6CzgkG6KadDxI8ikPFE2Y9hVpA6sEPDeJvGvizxjJE/ifUJ7xbcFYI3b91Ap/gijGEjQdlQKoAwBigDpj8EvjMql28I60AoyT9gn4/8crzN0eNzHICrKcEHggihWZGDoSGByCOCDXqkHxa1vVUGn/ElP8AhKLIjbm9cm8iXp+4uiDLHtGSqEvDuOWiagDe+HWt6r42iuPh94o26nYWukapdWn2n5pbN7GznuU8iXIdE3R8xbvKbJJTdgjwuvqX4Z+DbKDWtR8beBrh9U0aPQdeW4VlC3di0umXUai4jBI2FmAWZSY3yB8shMa/LVABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABXqHxv/5LT4v/AOw3qH/o968vr1D43/8AJafF/wD2G9Q/9HvQB+oH/BPP/ki2p/8AYbn/APRFvX3hXwf/AME8/wDki2p/9huf/wBEW9feFAH/1f4T/jf/AMlp8X/9hvUP/R70at/yRbQP+w3q/wD6I0+j43/8lp8X/wDYb1D/ANHvRq3/ACRbQP8AsN6v/wCiNPoA8vooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAK9Q+L3/I12n/YE0P/ANN1tXl9eofF7/ka7T/sCaH/AOm62oANJ/5Itr//AGG9I/8ARGoV5fXqGk/8kW1//sN6R/6I1CvL6AOz+HH/ACUPQf8AsI2v/o1ayvFX/Iz6l/19Tf8AoZrV+HH/ACUPQf8AsI2v/o1ayvFX/Iz6l/19Tf8AoZoA7LVv+SLaB/2G9X/9EafXl9eoat/yRbQP+w3q/wD6I0+vL6ACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAPYdE/5IB4m/7GDQv/AEm1OvHq9i0T/k3/AMTf9jDoX/pNqdeO0AeofF7/AJGu0/7Amh/+m62r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7iS6urjR9EeWaZy8jsdOtslmYkkn1JoA8iooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAr1D43/APJafF//AGG9Q/8AR715fXqHxv8A+S0+L/8AsN6h/wCj3oA/UD/gnn/yRbU/+w3P/wCiLevvCvg//gnn/wAkW1P/ALDc/wD6It6+8KAP/9f+E/43/wDJafF//Yb1D/0e9Grf8kW0D/sN6v8A+iNPo+N//JafF/8A2G9Q/wDR70at/wAkW0D/ALDer/8AojT6APL6KKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACvUPi9/yNdp/2BND/wDTdbV5fXqHxe/5Gu0/7Amh/wDputqADSf+SLa//wBhvSP/AERqFeX16hpP/JFtf/7Dekf+iNQry+gDs/hx/wAlD0H/ALCNr/6NWsrxV/yM+pf9fU3/AKGa1fhx/wAlD0H/ALCNr/6NWsrxV/yM+pf9fU3/AKGaAOy1b/ki2gf9hvV//RGn15fXqGrf8kW0D/sN6v8A+iNPry+gAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigD2LRP+Tf/E//AGMOhf8ApNqdeO17Fon/ACb/AOJv+xh0L/0m1OvHaAPUPi9/yNdp/wBgTQ//AE3W1eX16h8Xv+RrtP8AsCaH/wCm62ry+gAr0f4O2VvqXxc8LaddruiuNXsY3HqrzICPyNecV6p8KlOm3mreNpOI9C024lVujC5uF+zW5Q9N6TSrKOc7Y2I6UAea317cajezahdtulndpHPqzHJP516P4FHkeC/Gt5N8sUml29srHoZnvrWRUH+0UikYD0QntXl1epzj+xPg1DbSf63xDqv2nY3BWHTY2jjdR3WV7mVc9N0JA5zgA8sr1P4wkN4ss2VQoOh6H06HGm2wJ59xz715ZXqXjr/T/Bng/W4fnVdPnsJpP+ni2upX2H3SCaD/AICQO1AC/BZ2f4k2Gkp97V0udJHsdSgktf8A2rXlldd8P/EUHg/x5oni26QyxaXf2126L1ZYJFcge5Aqp4x8OT+D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/wAkW0D/ALDer/8AojT6APL6KKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACvUPi9/yNdp/2BND/wDTdbV5fXqHxe/5Gu0/7Amh/wDputqADSf+SLa//wBhvSP/AERqFeX16hpP/JFtf/7Dekf+iNQry+gDs/hx/wAlD0H/ALCNr/6NWsrxV/yM+pf9fU3/AKGa1fhx/wAlD0H/ALCNr/6NWsrxV/yM+pf9fU3/AKGaAOy1b/ki2gf9hvV//RGn15fXqGrf8kW0D/sN6v8A+iNPry+gAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAK9Q+N//JafF/8A2G9Q/wDR715fXqHxv/5LT4v/AOw3qH/o96AP1A/4J5/8kW1P/sNz/wDoi3r7wr4P/wCCef8AyRbU/wDsNz/+iLevvCgD/9P+E/43/wDJafF//Yb1D/0e9Grf8kW0D/sN6v8A+iNPo+N//JafF/8A2G9Q/wDR70at/wAkW0D/ALDer/8AojT6APL6KKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACvUPi9/yNdp/2BND/wDTdbV5fXqHxe/5Gu0/7Amh/wDputqADSf+SLa//wBhvSP/AERqFeX16hpP/JFtf/7Dekf+iNQry+gDs/hx/wAlD0H/ALCNr/6NWsrxV/yM+pf9fU3/AKGa1fhx/wAlD0H/ALCNr/6NWsrxV/yM+pf9fU3/AKGaAOy1b/ki2gf9hvV//RGn15fXqGrf8kW0D/sN6v8A+iNPry+gAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAK9Q+N//JafF/8A2G9Q/wDR715fXqHxv/5LT4v/AOw3qH/o96AP1A/4J5/8kW1P/sNz/wDoi3r7wr4P/wCCef8AyRbU/wDsNz/+iLevvCgD/9T+E/43/wDJafF//Yb1D/0e9Grf8kW0D/sN6v8A+iNPo+N//JafF/8A2G9Q/wDR70at/wAkW0D/ALDer/8AojT6APL6KKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACvUPi9/yNdp/2BND/wDTdbV5fXqHxe/5Gu0/7Amh/wDputqADSf+SLa//wBhvSP/AERqFeX16hpP/JFtf/7Dekf+iNQry+gDs/hx/wAlD0H/ALCNr/6NWsrxV/yM+pf9fU3/AKGa1fhx/wAlD0H/ALCNr/6NWsrxV/yM+pf9fU3/AKGaAOy1b/ki2gf9hvV//RGn15fXqGrf8kW0D/sN6v8A+iNPry+gAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAK9Q+N//JafF/8A2G9Q/wDR715fXqHxv/5LT4v/AOw3qH/o96AP1A/4J5/8kW1P/sNz/wDoi3r7wr4P/wCCef8AyRbU/wDsNz/+iLevvCgD/9X+E/43/wDJafF//Yb1D/0e9Grf8kW0D/sN6v8A+iNPo+N//JafF/8A2G9Q/wDR70at/wAkW0D/ALDer/8AojT6APL6KKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACvUPi9/yNdp/2BND/wDTdbV5fXqHxe/5Gu0/7Amh/wDputqADSf+SLa//wBhvSP/AERqFeX16hpP/JFtf/7Dekf+iNQry+gDs/hx/wAlD0H/ALCNr/6NWsrxV/yM+pf9fU3/AKGa1fhx/wAlD0H/ALCNr/6NWsrxV/yM+pf9fU3/AKGaAOy1b/ki2gf9hvV//RGn15fXqGrf8kW0D/sN6v8A+iNPry+gAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAK9Q+N//JafF/8A2G9Q/wDR715fXqHxv/5LT4v/AOw3qH/o96AP1A/4J5/8kW1P/sNz/wDoi3r7wr4P/wCCef8AyRbU/wDsNz/+iLevvCgD/9b+E/43/wDJafF//Yb1D/0e9Grf8kW0D/sN6v8A+iNPo+N//JafF/8A2G9Q/wDR70at/wAkW0D/ALDer/8AojT6APL6KKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACvUPi9/yNdp/2BND/wDTdbV5fXqHxe/5Gu0/7Amh/wDputqADSf+SLa//wBhvSP/AERqFeX16hpP/JFtf/7Dekf+iNQry+gDs/hx/wAlD0H/ALCNr/6NWsrxV/yM+pf9fU3/AKGa1fhx/wAlD0H/ALCNr/6NWsrxV/yM+pf9fU3/AKGaAOy1b/ki2gf9hvV//RGn15fXqGrf8kW0D/sN6v8A+iNPry+gAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAK9Q+N//JafF/8A2G9Q/wDR715fXqHxv/5LT4v/AOw3qH/o96AP1A/4J5/8kW1P/sNz/wDoi3r7wr4P/wCCef8AyRbU/wDsNz/+iLevvCgD/9f+E/43/wDJafF//Yb1D/0e9Grf8kW0D/sN6v8A+iNPo+N//JafF/8A2G9Q/wDR70at/wAkW0D/ALDer/8AojT6APL6KKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACvUPi9/yNdp/2BND/wDTdbV5fXqHxe/5Gu0/7Amh/wDputqADSf+SLa//wBhvSP/AERqFeX16hpP/JFtf/7Dekf+iNQry+gDs/hx/wAlD0H/ALCNr/6NWsrxV/yM+pf9fU3/AKGa1fhx/wAlD0H/ALCNr/6NWsrxV/yM+pf9fU3/AKGaAOy1b/ki2gf9hvV//RGn15fXqGrf8kW0D/sN6v8A+iNPry+gAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAK9Q+N//JafF/8A2G9Q/wDR715fXqHxv/5LT4v/AOw3qH/o96AP1A/4J5/8kW1P/sNz/wDoi3r7wr4P/wCCef8AyRbU/wDsNz/+iLevvCgD/9D+E/43/wDJafF//Yb1D/0e9Yfh34kfETwhYNpXhPX9R0u1eQytDaXUsEZkYAFiqMBuIUAnGcAelftB8WP+Cffwa1D4peJb+bU9aDz6reSMFmgwC0zE4/cVwH/Du/4K/wDQU1v/AL/wf/I9AH5d/wDC8fjV/wBDhrf/AIMJ/wD4uj/hePxq/wChw1v/AMGE/wD8XX6if8O7/gr/ANBTW/8Av/B/8j0f8O7/AIK/9BTW/wDv/B/8j0Afl3/wvH41f9Dhrf8A4MJ//i6P+F4/Gr/ocNb/APBhP/8AF1+on/Du/wCCv/QU1v8A7/wf/I9H/Du/4K/9BTW/+/8AB/8AI9AH5d/8Lx+NX/Q4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";

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
  .meta-row{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px;gap:24px}
  .contact-block{display:flex;flex-direction:column;gap:7px}
  .contact-item{display:flex;align-items:center;gap:8px;font-size:11px;color:#555}
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
  .footer-note{font-size:10px;color:#aaa;text-align:center;padding-top:18px;border-top:1px solid #f0f0f0;line-height:1.7}
  @media print{body{padding:20px 28px} @page{margin:0.8cm} .no-print{display:none}}
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
    <div class="contact-item"><span class="contact-icon">⊕</span>www.fit-fun-dog.de</div>
    <div class="contact-item"><span class="contact-icon">✉</span>info@fit-fun-dog.de</div>
    <div class="contact-item"><span class="contact-icon">☏</span>0159 / 04976681</div>
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
          <div class="video-url">${ex.video_url}</div>
        </div>
      </div>` : ""}
  </div>
</div>`).join("")}

<!-- FOOTER -->
<div class="footer-divider"></div>
<div class="footer-cols">
  <div class="footer-col">
    <div class="footer-col-label">A P P</div>
    <div class="qr-box">
      <img class="qr-img" src="${APP_QR}" alt="App QR"/>
      <div class="qr-label">Übungen in der App<br/>fitfundog.vercel.app</div>
    </div>
  </div>
  <div class="footer-col">
    <div class="footer-col-label">T E R M I N &nbsp; B U C H E N</div>
    <div class="qr-box">
      <img class="qr-img" src="${BOOKING_QR}" alt="Termin QR"/>
      <div class="qr-label">Nächsten Termin<br/>online buchen</div>
    </div>
  </div>

</div>
<div class="footer-note">
  Erstellt von Claudia · Fit Fun Dog &nbsp;·&nbsp; Bitte führe die Übungen nur nach Anweisung der Therapeutin durch.
</div>

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

  const shareExercisePlan = async (patient) => {
    const patExercises = exercises.filter(e => e.patient_id === patient.id);
    const text = `Übungsplan für ${patient.name}\n\n${patExercises.map((ex,i) => `${i+1}. ${ex.title}${ex.repeat_count?" ("+ex.repeat_count+"×/Woche)":""}${ex.video_url?"\nVideo: "+ex.video_url:""}`).join("\n\n")}\n\nÜbungen in der App: https://fitfundog.vercel.app/\nTermin buchen: https://fit-fun-dog-Termin-online-vereinbaren.as.me/`;
    if (navigator.share) {
      try {
        await navigator.share({ title: `Übungsplan ${patient.name} · Fit Fun Dog`, text });
      } catch(e) { if (e.name !== "AbortError") console.error(e); }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(text).catch(()=>{});
      alert("Text in die Zwischenablage kopiert!");
    }
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
                        <button className="iBtn" title="Übungsplan teilen" onClick={()=>shareExercisePlan(p)} style={{background:"#E8F0FF"}}><Icon name="mail" size={14} color="#5B4FCF"/></button>
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
                  <button className="iBtn" title="Übungsplan teilen" onClick={()=>shareExercisePlan(selectedPatient)} style={{background:"#E8F0FF",width:44,height:44,borderRadius:12,flexShrink:0}}><Icon name="mail" size={16} color="#5B4FCF"/></button>
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
