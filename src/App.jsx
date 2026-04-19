import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase";

document.title = "Fit Fun Dog";
document.querySelectorAll("link[rel*='icon']").forEach(el => el.remove());
const fav = document.createElement("link");
fav.rel = "icon"; fav.type = "image/png";
fav.href = "https://tkgwdmntglzfeulpgfpw.supabase.co/storage/v1/object/public/exercise-images/Logo%20Kopf%20Fiete.png?" + Date.now();
document.head.appendChild(fav);

const ADMIN_ID = "1bed901d-005a-496e-bf8e-5d55804e6f72";
const THERAPIST_EMAIL = "fitfundog@freenet.de";
const BRAND = "#5fb8b9", DARK = "#1E4A4B", MID = "#3D8E8F";
const LIGHT = "#E6F6F6", PALE = "#F3FBFB", ACCENT = "#8FD4D5";
const LOGO_URL = "https://tkgwdmntglzfeulpgfpw.supabase.co/storage/v1/object/public/exercise-images/Logo%20Fit%20Fun%20Dog-Vektor%20ws.png";
const CATEGORIES = ["Regeneration", "Balance", "Kräftigung", "Koordination", "Mobilisation"];
const TARGET_REGIONS = ["Ganzer Körper", "Hinterhand", "Vorderhand", "Rumpf", "Vorderpfoten", "Rücken"];
const EMPTY_PATIENT = { name: "", breed: "", age: "", owner: "", condition: "", avatar: "🐕" };
const EMPTY_TEMPLATE = { title: "", categories: [], target_regions: [], difficulty: "Leicht", description: "", instructions: ["", "", ""], image_url: "", video_url: "" };
const difficultyColor = { "Leicht": BRAND, "Mittel": MID, "Schwer": "#C0392B" };

// ── Auto-logout on tab close ──
window.addEventListener("beforeunload", () => { supabase.auth.signOut(); });

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
    link: <svg {...s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
  };
  return icons[name] || null;
};

const T = {
  de: { appSub: "Tierphysiotherapie & Osteopathie", navOwner: "Besitzer", navTherapist: "Praxis", navInfo: "Info", progress: "Heutiger Fortschritt", exercisesDone: "Übungen abgeschlossen", allDone: (n) => `Alle Übungen erledigt! ${n} sagt Danke!`, noPatient: "Noch kein Patient angelegt", noExercises: "Noch keine Übungen zugewiesen.", all: "Alle", selectPatient: "Patient auswählen...", noPatientSelected: "Bitte einen Patienten auswählen.", homeExercises: (n) => `Heimübungen (${n})`, noExercisesYet: "Noch keine Übungen.", step: "Schritt für Schritt", description: "Beschreibung", watchVideo: "Video ansehen", markDone: "Heute erledigt!", markUndone: "Als unerledigt markieren", saving: "Wird gespeichert...", assignBtn: "Übung zuweisen", freq: "Häufigkeit", freqPh: "z.B. 2x täglich, 5 Min.", step1: "1. Patient", step2: "2. Übung auswählen", step3: "3. Häufigkeit", noCategoryEx: "Keine Übungen in dieser Kategorie.", cancel: "Abbrechen", delete: "Löschen", remove: "Entfernen", filterCategory: "Kategorie", filterRegion: "Zielregion", langLabel: "Sprache", tipsTitle: "Tipps & Wissen", tipsSub: "Wichtige Hinweise für das Training", tabTips: "Trainings-Tipps", tabPause: "Pause & Regeneration", pauseHero: "Pause ist Training!", pauseHeroText: "Pause ist der Zeitraum, in dem die eigentliche Leistungssteigerung stattfindet. Ohne ausreichende Pausen droht Überlastung statt Fortschritt." },
  en: { appSub: "Animal Physiotherapy & Osteopathy", navOwner: "Owner", navTherapist: "Practice", navInfo: "Info", progress: "Today's Progress", exercisesDone: "exercises completed", allDone: (n) => `All done! ${n} says Thank you!`, noPatient: "No patient added yet", noExercises: "No exercises assigned yet.", all: "All", selectPatient: "Select patient...", noPatientSelected: "Please select a patient.", homeExercises: (n) => `Home exercises (${n})`, noExercisesYet: "No exercises yet.", step: "Step by Step", description: "Description", watchVideo: "Watch video", markDone: "Done today!", markUndone: "Mark as not done", saving: "Saving...", assignBtn: "Assign Exercise", freq: "Frequency", freqPh: "e.g. 2x daily, 5 min.", step1: "1. Patient", step2: "2. Select exercise", step3: "3. Frequency", noCategoryEx: "No exercises in this category.", cancel: "Cancel", delete: "Delete", remove: "Remove", filterCategory: "Category", filterRegion: "Target Region", langLabel: "Language", tipsTitle: "Tips & Knowledge", tipsSub: "Important notes for training", tabTips: "Training Tips", tabPause: "Rest & Recovery", pauseHero: "Rest is Training!", pauseHeroText: "Rest is the period where actual performance improvement happens. Without sufficient rest, overtraining replaces progress." },
  es: { appSub: "Fisioterapia & Osteopatía Animal", navOwner: "Dueño", navTherapist: "Clínica", navInfo: "Info", progress: "Progreso de hoy", exercisesDone: "ejercicios completados", allDone: (n) => `¡Todo listo! ${n} dice ¡Gracias!`, noPatient: "Aún no hay paciente", noExercises: "Aún no hay ejercicios.", all: "Todos", selectPatient: "Seleccionar paciente...", noPatientSelected: "Por favor selecciona un paciente.", homeExercises: (n) => `Ejercicios en casa (${n})`, noExercisesYet: "Aún no hay ejercicios.", step: "Paso a Paso", description: "Descripción", watchVideo: "Ver video", markDone: "¡Hecho hoy!", markUndone: "Marcar como no hecho", saving: "Guardando...", assignBtn: "Asignar ejercicio", freq: "Frecuencia", freqPh: "ej. 2x al día, 5 min.", step1: "1. Paciente", step2: "2. Seleccionar ejercicio", step3: "3. Frecuencia", noCategoryEx: "No hay ejercicios en esta categoría.", cancel: "Cancelar", delete: "Eliminar", remove: "Quitar", filterCategory: "Categoría", filterRegion: "Región", langLabel: "Idioma", tipsTitle: "Consejos", tipsSub: "Notas importantes", tabTips: "Consejos", tabPause: "Descanso", pauseHero: "¡El descanso es entrenamiento!", pauseHeroText: "El descanso es el periodo donde ocurre la mejora real del rendimiento." }
};

const TIPS = {
  de: [
    { icon: "tip", title: "Qualität vor Tempo", text: "Langsame Bewegungen sind viel anstrengender und effektiver für den Muskelaufbau als schnelles Hin- und Herspringen." },
    { icon: "close", title: "Abbruch-Signal", text: "Sofort aufhören, wenn der Hund anfängt zu zittern, stark zu hecheln oder die Übung schlampig ausführt. Das sind Zeichen für Muskelermüdung." },
    { icon: "target", title: "Belohnung", text: "Das Futter sollte punktgenau gegeben werden, wenn der Hund die gewünschte Position erreicht hat – nicht nur als Lockmittel." }
  ],
  en: [
    { icon: "tip", title: "Quality over Speed", text: "Slow movements are much more demanding and effective for muscle building than fast repetitions." },
    { icon: "close", title: "Stop Signal", text: "Stop immediately if the dog starts trembling, panting heavily, or performing the exercise sloppily." },
    { icon: "target", title: "Reward", text: "Treats should be given precisely when the dog reaches the desired position – not just as a lure." }
  ],
  es: [
    { icon: "tip", title: "Calidad sobre Velocidad", text: "Los movimientos lentos son más exigentes y efectivos para el desarrollo muscular." },
    { icon: "close", title: "Señal de Parada", text: "Detener inmediatamente si el perro tiembla, jadea mucho o realiza el ejercicio descuidadamente." },
    { icon: "target", title: "Recompensa", text: "El alimento debe darse con precisión cuando el perro alcanza la posición deseada." }
  ]
};

const PAUSE = {
  de: [
    { icon: "rest", title: "Warum Pausen so wichtig sind", text: "Pausen sind aktiver Teil des Muskelaufbaus. Das Prinzip der Superkompensation besagt: der Körper hebt nach einer Belastung das Leistungsniveau über das ursprüngliche Maß hinaus – aber nur bei ausreichender Pause." },
    { icon: "clock", title: "Pausendauer", items: ["Kleine Muskelgruppen: ca. 24 Stunden Regeneration", "Große Muskelgruppen / intensive Kraftübungen: 48–96 Stunden", "Niemals dieselbe Muskelgruppe an zwei aufeinanderfolgenden Tagen trainieren"] },
    { icon: "info", title: "Anzeichen für Übermüdung", items: ["Zittern der Muskulatur", "Hecheln oder Schmatzen (Stressanzeichen)", "Unkonzentriertheit oder langsamer werdende Reaktionen", "Unsaubere Ausführung – z.B. Pfoten schleifen, Ausweichbewegungen"] },
    { icon: "rest", title: "Pausen zwischen den Sätzen", text: "Kurze Zwischenpausen helfen die Konzentrationsfähigkeit hochzuhalten – Übungen sind oft auch mental sehr anstrengend." },
    { icon: "assign", title: "Trainingsrhythmus", items: ["Tag 1: Training", "Tag 2: Pause (lockere Bewegung / Gassi)", "Tag 3: Training", "Bei intensivem Aufbau: 2 Pausentage zwischen den Einheiten"] }
  ],
  en: [
    { icon: "rest", title: "Why Rest Matters", text: "Rest is an active part of muscle building. The principle of supercompensation states: after exertion, the body raises performance above its original level – but only with sufficient rest." },
    { icon: "clock", title: "Rest Duration", items: ["Small muscle groups: approx. 24 hours recovery", "Large muscle groups / intense exercises: 48–96 hours", "Never train the same muscle group on two consecutive days"] },
    { icon: "info", title: "Signs of Fatigue", items: ["Muscle trembling", "Panting or lip smacking (stress signals)", "Loss of focus or slowing reactions", "Sloppy execution – e.g. dragging paws, compensatory movements"] },
    { icon: "rest", title: "Rest Between Sets", text: "Short breaks between sets help maintain concentration – exercises are often mentally demanding too." },
    { icon: "assign", title: "Training Rhythm", items: ["Day 1: Training", "Day 2: Rest (light walk only)", "Day 3: Training", "For intensive training: 2 rest days between sessions"] }
  ],
  es: [
    { icon: "rest", title: "Por qué el Descanso es Importante", text: "El descanso es parte activa del desarrollo muscular." },
    { icon: "clock", title: "Duración del Descanso", items: ["Grupos musculares pequeños: aprox. 24 horas", "Grupos musculares grandes: 48–96 horas", "Nunca entrenar el mismo grupo dos días consecutivos"] },
    { icon: "info", title: "Señales de Fatiga", items: ["Temblor muscular", "Jadeo o chasquido de labios", "Pérdida de concentración", "Ejecución descuidada"] },
    { icon: "rest", title: "Descanso Entre Series", text: "Pausas cortas entre series ayudan a mantener la concentración." },
    { icon: "assign", title: "Ritmo de Entrenamiento", items: ["Día 1: Entrenamiento", "Día 2: Descanso", "Día 3: Entrenamiento"] }
  ]
};

// ── Shared UI components ──
const FilterDropdown = ({ label, icon, options, selected, onChange, color = BRAND }) => {
  const [open, setOpen] = useState(false);
  const count = selected.length;
  return (
    <div style={{ position: "relative", flex: 1 }} onClick={e => e.stopPropagation()}>
      <button onClick={() => setOpen(o => !o)} style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: `1.5px solid ${count > 0 ? color : "#B8DFE0"}`, background: count > 0 ? color + "15" : "white", display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 600, color: count > 0 ? color : "#3D7070" }}>
        <Icon name={icon} size={13} color={count > 0 ? color : "#3D7070"} />
        <span style={{ flex: 1, textAlign: "left" }}>{count > 0 ? `${label} (${count})` : label}</span>
        <Icon name="chevdown" size={13} color={count > 0 ? color : "#3D7070"} />
      </button>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "white", borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", zIndex: 30, overflow: "hidden", border: `1px solid ${LIGHT}` }}>
          {selected.length > 0 && <button onClick={() => { onChange([]); setOpen(false); }} style={{ width: "100%", padding: "9px 14px", textAlign: "left", fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 600, color: "#C0392B", background: "#FFF5F5", cursor: "pointer", border: "none", borderBottom: `1px solid ${LIGHT}` }}>Auswahl aufheben</button>}
          {options.map(opt => {
            const active = selected.includes(opt);
            return (
              <button key={opt} onClick={() => onChange(active ? selected.filter(s => s !== opt) : [...selected, opt])} style={{ width: "100%", padding: "10px 14px", textAlign: "left", fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: active ? 600 : 400, color: active ? color : "#102828", background: active ? color + "10" : "white", cursor: "pointer", border: "none", borderBottom: `1px solid ${LIGHT}`, display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 16, height: 16, borderRadius: 4, border: `2px solid ${active ? color : "#B8DFE0"}`, background: active ? color : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {active && <Icon name="check" size={10} color="white" />}
                </div>
                {opt}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

const MultiSelect = ({ options, selected, onChange, color = BRAND }) => (
  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
    {options.map(opt => {
      const active = selected.includes(opt);
      return <button key={opt} onClick={() => onChange(active ? selected.filter(s => s !== opt) : [...selected, opt])} style={{ padding: "6px 12px", borderRadius: 99, fontSize: 12, fontWeight: 600, fontFamily: "'DM Sans',sans-serif", cursor: "pointer", border: `2px solid ${active ? color : "#B8DFE0"}`, background: active ? color : "white", color: active ? "#102828" : "#3D7070" }}>{opt}</button>;
    })}
  </div>
);

const InfoCard = ({ icon, title, text, items }) => (
  <div style={{ background: "white", borderRadius: 16, boxShadow: "0 2px 16px rgba(95,184,185,0.12)", padding: "18px 20px", textAlign: "left" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
      <div style={{ width: 34, height: 34, borderRadius: 9, background: BRAND + "18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name={icon} size={18} color={BRAND} /></div>
      <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 15, fontWeight: 700, color: "#102828" }}>{title}</div>
    </div>
    {text && <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: "#3D6060", lineHeight: 1.65 }}>{text}</div>}
    {items && <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>{items.map((item, j) => (
      <div key={j} style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: BRAND, flexShrink: 0, marginTop: 4 }} />
        <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: "#3D6060", lineHeight: 1.55, flex: 1 }}>{item}</span>
      </div>
    ))}</div>}
  </div>
);

// ── Login Screen ──
const LoginScreen = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inp = { width: "100%", padding: "13px 14px", borderRadius: 10, border: "1.5px solid #B8DFE0", fontSize: 16, fontFamily: "'DM Sans',sans-serif", outline: "none", color: "#102828", background: "white", WebkitTextFillColor: "#102828", boxSizing: "border-box" };

  const handleLogin = async () => {
    if (!email || !password) { setError("Bitte Email und Passwort eingeben."); return; }
    setLoading(true); setError("");
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) setError("Login fehlgeschlagen. Bitte Email und Passwort prüfen.");
    else if (email === THERAPIST_EMAIL) sessionStorage.setItem("_tfpw", password);
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(160deg, ${DARK} 0%, #2A7A7B 60%, ${BRAND} 100%)`, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 360 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <img src={LOGO_URL} alt="Fit Fun Dog" style={{ height: 65, objectFit: "contain", marginBottom: 10 }} />
          <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: ACCENT, letterSpacing: "1.5px", textTransform: "uppercase" }}>Tierphysiotherapie & Osteopathie</div>
        </div>
        <div style={{ background: "white", borderRadius: 22, padding: "28px 24px", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, color: DARK, marginBottom: 4 }}>Willkommen zurück</div>
          <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: "#3D7070", marginBottom: 22 }}>Bitte melde dich an um fortzufahren.</div>
          <div style={{ marginBottom: 14 }}><div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 700, color: "#3D7070", letterSpacing: ".7px", textTransform: "uppercase", marginBottom: 7 }}>Email</div><input type="email" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && handleLogin()} placeholder="deine@email.de" style={inp} /></div>
          <div style={{ marginBottom: 20 }}><div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 700, color: "#3D7070", letterSpacing: ".7px", textTransform: "uppercase", marginBottom: 7 }}>Passwort</div><input type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && handleLogin()} placeholder="••••••••" style={inp} /></div>
          {error && <div style={{ background: "#FFE8E8", borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: "#C0392B" }}>{error}</div>}
          <button onClick={handleLogin} disabled={loading} style={{ width: "100%", padding: "14px", borderRadius: 12, background: loading ? "#B8DFE0" : BRAND, color: "#102828", fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: 15, border: "none", cursor: "pointer" }}>
            {loading ? "Wird angemeldet..." : "Anmelden"}
          </button>
        </div>
        <div style={{ textAlign: "center", marginTop: 16, fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: "rgba(255,255,255,0.5)" }}>Kein Konto? Bitte wende dich an deine Therapeutin.</div>
      </div>
    </div>
  );
};

export default function App() {
  const [lang, setLang] = useState("de");
  const t = T[lang];
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const isAdmin = session?.user?.id === ADMIN_ID;

  const [view, setView] = useState("owner");
  const [practiceTab, setPracticeTab] = useState("patients"); // "patients" | "exercises" | "assign"
  const [infoTab, setInfoTab] = useState("tips");
  const [patients, setPatients] = useState([]);
  const [ownerPatient, setOwnerPatient] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [doneLogs, setDoneLogs] = useState([]);
  const [userEmails, setUserEmails] = useState([]); // [{id, email}]
  const [loading, setLoading] = useState(true);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [sheet, setSheet] = useState(null);
  const [sheetData, setSheetData] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [duration, setDuration] = useState("");
  const [newPatient, setNewPatient] = useState(EMPTY_PATIENT);
  const [editPatientData, setEditPatientData] = useState(null);
  const [newTemplate, setNewTemplate] = useState(EMPTY_TEMPLATE);
  const [editTemplateData, setEditTemplateData] = useState(null);
  const [langOpen, setLangOpen] = useState(false);
  const [filterCats, setFilterCats] = useState([]);
  const [filterRegions, setFilterRegions] = useState([]);
  const [assignFilterCats, setAssignFilterCats] = useState([]);
  const [assignFilterRegions, setAssignFilterRegions] = useState([]);
  const [newAccountMode, setNewAccountMode] = useState("new"); // "new" | "existing" | "none"
  const [selectedExistingUserId, setSelectedExistingUserId] = useState("");
  const [resetEmailSent, setResetEmailSent] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
    });
    return () => subscription.unsubscribe();
  }, []);

  const hasLoadedRef = useRef(false);
  useEffect(() => {
    if (session?.user?.id && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      loadAll();
    }
    if (!session) hasLoadedRef.current = false;
  }, [session?.user?.id]);

  async function loadAll() {
    setLoading(true);
    const [{ data: pd }, { data: ed }, { data: ld }, { data: td }, { data: ue }] = await Promise.all([
      supabase.from("patients").select("*").order("name"),
      supabase.from("exercises").select("*").order("created_at"),
      supabase.from("exercise_logs").select("*").eq("done_date", today),
      supabase.from("exercise_templates").select("*").order("title"),
      supabase.from("user_emails").select("id, email")
    ]);
    setPatients(pd || []);
    setExercises(ed || []);
    setDoneLogs(ld || []);
    setTemplates(td || []);
    setUserEmails(ue || []);
    // Only set ownerPatient on first load or if current one no longer exists
    setOwnerPatient(prev => {
      if (prev && pd?.find(p => p.id === prev.id)) return pd.find(p => p.id === prev.id);
      return pd && pd.length > 0 ? pd[0] : null;
    });
    // Keep selectedPatient in sync
    setSelectedPatient(prev => {
      if (!prev) return null;
      return pd?.find(p => p.id === prev.id) || null;
    });
    setLoading(false);
  }

  const handleLogout = async () => { sessionStorage.removeItem("_tfpw"); await supabase.auth.signOut(); };
  const closeSheet = () => { setSheet(null); setSheetData(null); setSelectedTemplate(null); setAssignFilterCats([]); setAssignFilterRegions([]); setDuration(""); setEditTemplateData(null); setEditPatientData(null); setNewAccountMode("new"); setSelectedExistingUserId(""); setResetEmailSent(false); };

  const exForPatient = (pid) => exercises.filter(e => e.patient_id === pid);
  const isDone = (eid) => doneLogs.some(l => l.exercise_id === eid);

  const getUserEmail = (uid) => userEmails.find(u => u.id === uid)?.email || null;

  const toggleDone = async (eid) => {
    if (isDone(eid)) {
      await supabase.from("exercise_logs").delete().eq("exercise_id", eid).eq("done_date", today);
      setDoneLogs(prev => prev.filter(l => l.exercise_id !== eid));
    } else {
      const { data } = await supabase.from("exercise_logs").insert({ exercise_id: eid, done_date: today, done: true }).select().single();
      if (data) setDoneLogs(prev => [...prev, data]);
    }
  };

  // ── Add patient ──
  const addPatient = async () => {
    if (!newPatient.name) return;
    setSaving(true);
    let userId = null;

    if (newAccountMode === "existing") {
      userId = selectedExistingUserId || null;
    } else if (newAccountMode === "new" && newPatient.ownerEmail && newPatient.ownerPassword) {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: newPatient.ownerEmail,
        password: newPatient.ownerPassword,
      });
      if (signUpError) { alert("Account-Fehler: " + signUpError.message); setSaving(false); return; }
      userId = signUpData?.user?.id || null;

      // Restore admin session immediately
      const storedPw = sessionStorage.getItem("_tfpw");
      if (storedPw) {
        await supabase.auth.signInWithPassword({ email: THERAPIST_EMAIL, password: storedPw });
      }
    }

    // Insert patient using admin client (session should be restored)
    const { data, error } = await supabase.from("patients").insert({
      name: newPatient.name, breed: newPatient.breed, age: newPatient.age,
      owner: newPatient.owner, condition: newPatient.condition, avatar: newPatient.avatar,
      user_id: userId,
    }).select().single();

    if (error) { alert("Fehler: " + error.message); setSaving(false); return; }

    // Reload everything fresh to get consistent state
    await loadAll();

    setSaving(false);
    setNewPatient(EMPTY_PATIENT);
    closeSheet();
  };

  const updatePatient = async () => {
    if (!editPatientData?.name) return;
    setSaving(true);
    const { id, _newUserId, ownerEmail, ownerPassword, ...fields } = editPatientData;
    // If _newUserId was set, use it; otherwise keep existing user_id
    if (_newUserId !== undefined) fields.user_id = _newUserId || null;
    const { data, error } = await supabase.from("patients").update(fields).eq("id", id).select().single();
    if (error) { alert("Fehler: " + error.message); setSaving(false); return; }
    if (data) {
      setPatients(prev => prev.map(p => p.id === data.id ? data : p).sort((a, b) => a.name.localeCompare(b.name)));
      if (ownerPatient?.id === data.id) setOwnerPatient(data);
      if (selectedPatient?.id === data.id) setSelectedPatient(data);
    }
    setSaving(false);
    closeSheet();
  };

  const sendPasswordReset = async (email) => {
    if (!email) return;
    await supabase.auth.resetPasswordForEmail(email);
    setResetEmailSent(true);
  };

  const deletePatient = async (pid) => {
    setDeleting(pid);
    for (const ex of exForPatient(pid)) await supabase.from("exercise_logs").delete().eq("exercise_id", ex.id);
    await supabase.from("exercises").delete().eq("patient_id", pid);
    await supabase.from("patients").delete().eq("id", pid);
    setExercises(prev => prev.filter(e => e.patient_id !== pid));
    setPatients(prev => prev.filter(p => p.id !== pid));
    if (selectedPatient?.id === pid) setSelectedPatient(null);
    if (ownerPatient?.id === pid) setOwnerPatient(null);
    setDeleting(null); closeSheet();
  };

  const addExercise = async () => {
    if (!selectedTemplate || !selectedPatient || !duration) return;
    setSaving(true);
    const { data, error } = await supabase.from("exercises").insert({
      patient_id: selectedPatient.id, title: selectedTemplate.title,
      categories: selectedTemplate.categories || [], target_regions: selectedTemplate.target_regions || [],
      difficulty: selectedTemplate.difficulty, description: selectedTemplate.description,
      instructions: selectedTemplate.instructions, image_url: selectedTemplate.image_url || null,
      video_url: selectedTemplate.video_url || null, duration,
    }).select().single();
    if (!error && data) setExercises(prev => [...prev, data]);
    setSaving(false); closeSheet();
  };

  const deleteExercise = async (eid) => {
    setDeleting(eid);
    await supabase.from("exercise_logs").delete().eq("exercise_id", eid);
    await supabase.from("exercises").delete().eq("id", eid);
    setExercises(prev => prev.filter(e => e.id !== eid));
    setDoneLogs(prev => prev.filter(l => l.exercise_id !== eid));
    setDeleting(null); closeSheet(); setSelectedExercise(null);
  };

  const addTemplate = async () => {
    if (!newTemplate.title) return;
    setSaving(true);
    const { data, error } = await supabase.from("exercise_templates").insert({ ...newTemplate, instructions: newTemplate.instructions.filter(Boolean) }).select().single();
    if (!error && data) setTemplates(prev => [...prev, data]);
    setSaving(false); setNewTemplate(EMPTY_TEMPLATE); closeSheet();
  };

  const updateTemplate = async () => {
    if (!editTemplateData?.title) return;
    setSaving(true);
    const { data, error } = await supabase.from("exercise_templates").update({
      title: editTemplateData.title, categories: editTemplateData.categories || [],
      target_regions: editTemplateData.target_regions || [], difficulty: editTemplateData.difficulty,
      description: editTemplateData.description, instructions: (editTemplateData.instructions || []).filter(Boolean),
      image_url: editTemplateData.image_url || null, video_url: editTemplateData.video_url || null,
    }).eq("id", editTemplateData.id).select().single();
    if (!error && data) setTemplates(prev => prev.map(t => t.id === data.id ? data : t));
    setSaving(false); closeSheet();
  };

  const deleteTemplate = async (tid) => {
    setDeleting(tid);
    await supabase.from("exercise_templates").delete().eq("id", tid);
    setTemplates(prev => prev.filter(t => t.id !== tid));
    setDeleting(null); closeSheet();
  };

  const ownerExs = ownerPatient ? exForPatient(ownerPatient.id) : [];
  const doneCount = ownerExs.filter(e => isDone(e.id)).length;
  const totalCount = ownerExs.length;
  const progress = totalCount > 0 ? (doneCount / totalCount) * 100 : 0;
  const allDone = totalCount > 0 && doneCount === totalCount;
  const filteredOwnerExs = ownerExs.filter(ex => {
    const cOk = filterCats.length === 0 || (ex.categories || []).some(c => filterCats.includes(c));
    const rOk = filterRegions.length === 0 || (ex.target_regions || []).some(r => filterRegions.includes(r));
    return cOk && rOk;
  });
  const filteredTemplates = templates.filter(t2 => {
    const cOk = assignFilterCats.length === 0 || (t2.categories || []).some(c => assignFilterCats.includes(c));
    const rOk = assignFilterRegions.length === 0 || (t2.target_regions || []).some(r => assignFilterRegions.includes(r));
    return cOk && rOk;
  });
  const patLabel = (p) => `${p.avatar || ""} ${p.name} - ${p.breed} - ${p.owner}`.trim();

  const inp = { width: "100%", padding: "11px 14px", borderRadius: 10, border: "1.5px solid #B8DFE0", fontSize: 16, fontFamily: "'DM Sans',sans-serif", outline: "none", background: "white", color: "#102828", WebkitTextFillColor: "#102828", boxSizing: "border-box" };
  const SL = ({ text }) => <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 700, color: "#3D7070", letterSpacing: ".7px", textTransform: "uppercase", marginBottom: 7 }}>{text}</div>;
  const SheetHeader = ({ title, onClose }) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
      <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 19, fontWeight: 700, color: "#102828" }}>{title}</div>
      <button onClick={onClose} style={{ background: LIGHT, borderRadius: "50%", width: 32, height: 32, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="close" size={14} color="#3D7070" /></button>
    </div>
  );

  if (authLoading) return <div style={{ minHeight: "100vh", background: `linear-gradient(160deg, ${DARK}, ${BRAND})`, display: "flex", alignItems: "center", justifyContent: "center" }}><img src={LOGO_URL} alt="" style={{ height: 60, objectFit: "contain" }} /></div>;
  if (!session) return <LoginScreen />;
  if (loading) return <div style={{ minHeight: "100vh", background: LIGHT, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12 }}><Icon name="paw" size={48} color={BRAND} /><div style={{ fontFamily: "'DM Sans',sans-serif", color: "#3D7070" }}>Wird geladen...</div></div>;

  return (
    <div style={{ fontFamily: "Georgia,serif", minHeight: "100vh", background: LIGHT, color: "#102828" }} onClick={() => setLangOpen(false)}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@300;400;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { -webkit-text-size-adjust: 100%; }
        .btn { cursor: pointer; border: none; transition: all 0.18s; background: none; }
        .btn:hover { opacity: .85; }
        .card { background: white; border-radius: 16px; box-shadow: 0 2px 16px rgba(95,184,185,0.10); text-align: left; }
        .ex-card { transition: all 0.18s; cursor: pointer; }
        .ex-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(95,184,185,0.18); }
        .tag { display: inline-block; padding: 3px 9px; border-radius: 20px; font-size: 11px; font-weight: 600; font-family: 'DM Sans',sans-serif; }
        input,textarea,select { font-family: 'DM Sans',sans-serif; outline: none; -webkit-text-fill-color: #102828; color: #102828; font-size: 16px; }
        input:focus,textarea:focus,select:focus { border-color: ${BRAND} !important; box-shadow: 0 0 0 3px rgba(95,184,185,0.15); }
        .overlay { position: fixed; inset: 0; background: rgba(16,40,40,0.55); z-index: 100; display: flex; align-items: flex-end; justify-content: center; }
        .sheet { background: white; border-radius: 24px 24px 0 0; width: 100%; max-width: 480px; max-height: 90vh; overflow-y: auto; padding: 24px 20px 40px; }
        .pbar { height: 8px; background: rgba(255,255,255,0.2); border-radius: 99px; overflow: hidden; }
        .pfill { height: 100%; border-radius: 99px; background: linear-gradient(90deg,#8FD4D5,#ffffff88); transition: width .6s ease; }
        .nav-tab { padding: 9px 0; font-size: 12px; font-weight: 600; cursor: pointer; font-family: 'DM Sans',sans-serif; border: none; transition: all .18s; flex: 1; display: flex; align-items: center; justify-content: center; gap: 5px; }
        .ptab { padding: 8px 14px; border-radius: 9px; font-size: 12px; font-weight: 600; cursor: pointer; font-family: 'DM Sans',sans-serif; border: none; transition: all .15s; display: flex; align-items: center; gap: 6px; }
        select { appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%233D7070' d='M6 8L1 3h10z'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 14px center; padding-right: 36px !important; }
        .tmpl-row { padding: 10px 12px; border-radius: 10px; cursor: pointer; border: 2px solid transparent; display: flex; align-items: center; gap: 10px; transition: all .15s; }
        .tmpl-row:hover { background: ${LIGHT}; }
        .tmpl-row.sel { border-color: ${BRAND}; background: ${LIGHT}; }
        .iBtn { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer; border: none; flex-shrink: 0; transition: all .15s; }
        .iBtn:hover { opacity: .8; }
        .mode-btn { flex: 1; padding: 10px 8px; border-radius: 10px; font-size: 12px; font-weight: 700; cursor: pointer; font-family: 'DM Sans',sans-serif; border: 2px solid; transition: all .15s; display: flex; align-items: center; justify-content: center; gap: 5px; }
      `}</style>

      {/* ── HEADER ── */}
      <div style={{ background: DARK, position: "sticky", top: 0, zIndex: 20 }}>
        <div style={{ maxWidth: 480, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px 10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <img src={LOGO_URL} alt="Fit Fun Dog" style={{ height: 36, objectFit: "contain" }} />
              <div>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 15, fontWeight: 700, color: "#E6F6F6", lineHeight: 1.1 }}>Fit Fun Dog</div>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 9, color: ACCENT, letterSpacing: "0.3px" }}>Tierphysiotherapie & Osteopathie</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <div style={{ position: "relative" }} onClick={e => e.stopPropagation()}>
                <button className="btn" onClick={() => setLangOpen(o => !o)} style={{ display: "flex", alignItems: "center", gap: 5, background: "#2A6364", borderRadius: 9, padding: "7px 10px", color: ACCENT, fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 600 }}>
                  <Icon name="lang" size={14} color={ACCENT} />{t.langLabel}<Icon name="chevdown" size={12} color={ACCENT} />
                </button>
                {langOpen && (
                  <div style={{ position: "absolute", right: 0, top: "calc(100% + 6px)", background: "white", borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.15)", overflow: "hidden", minWidth: 130, zIndex: 50 }}>
                    {[["de","🇩🇪 Deutsch"],["en","🇬🇧 English"],["es","🇪🇸 Español"]].map(([l, label]) => (
                      <button key={l} className="btn" onClick={() => { setLang(l); setLangOpen(false); }} style={{ width: "100%", padding: "11px 16px", textAlign: "left", fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: l === lang ? 700 : 400, color: l === lang ? BRAND : "#102828", background: l === lang ? LIGHT : "white", display: "block" }}>{label}</button>
                    ))}
                  </div>
                )}
              </div>
              <button className="btn" onClick={handleLogout} style={{ background: "#2A6364", borderRadius: 9, padding: "7px 9px", display: "flex" }}>
                <Icon name="logout" size={15} color={ACCENT} />
              </button>
            </div>
          </div>
          <div style={{ display: "flex", background: "#2A6364" }}>
            {[["owner","home",t.navOwner], ...(isAdmin ? [["therapist","practice",t.navTherapist]] : []), ["info","info",t.navInfo]].map(([v, ic, lb]) => (
              <button key={v} className="nav-tab" onClick={() => setView(v)} style={{ background: view === v ? "white" : "transparent", color: view === v ? DARK : ACCENT, borderRadius: view === v ? "10px 10px 0 0" : 0, marginTop: view === v ? 3 : 0 }}>
                <Icon name={ic} size={14} color={view === v ? DARK : ACCENT} />{lb}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ══ OWNER VIEW ══ */}
      {view === "owner" && (
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "16px 14px 80px" }}>
          {patients.length > 1 && (
            <div style={{ marginBottom: 12 }}>
              <select value={ownerPatient?.id || ""} onChange={e => { setOwnerPatient(patients.find(p => p.id === e.target.value) || null); setFilterCats([]); setFilterRegions([]); }} style={{ ...inp, borderRadius: 12 }}>
                {patients.map(p => <option key={p.id} value={p.id}>{patLabel(p)}</option>)}
              </select>
            </div>
          )}
          {!ownerPatient ? (
            <div className="card" style={{ padding: 28, textAlign: "center", color: "#3D7070" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}><Icon name="paw" size={44} color={ACCENT} /></div>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 15, fontWeight: 600 }}>{t.noPatient}</div>
            </div>
          ) : (<>
            <div style={{ padding: "18px 20px", marginBottom: 14, background: `linear-gradient(135deg, ${DARK} 0%, ${BRAND} 100%)`, color: "#E6F6F6", borderRadius: 18, boxShadow: "0 4px 24px rgba(95,184,185,0.32)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: "#B8E8E8", letterSpacing: "1px", textTransform: "uppercase", marginBottom: 3 }}>{t.progress}</div>
                  <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 36, fontWeight: 700, lineHeight: 1 }}>{doneCount}/{totalCount}</div>
                  <div style={{ fontSize: 13, color: allDone ? "white" : "#B8E8E8", fontFamily: "'DM Sans',sans-serif", marginTop: 5, fontWeight: allDone ? 700 : 400 }}>
                    {allDone ? `🎉 ${t.allDone(ownerPatient.name)}` : t.exercisesDone}
                  </div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 48, lineHeight: 1 }}>{ownerPatient.avatar || "🐕"}</div>
                  <div style={{ fontSize: 11, color: "#B8E8E8", marginTop: 4, fontFamily: "'DM Sans',sans-serif" }}>{ownerPatient.name}</div>
                </div>
              </div>
              <div className="pbar" style={{ marginTop: 14 }}><div className="pfill" style={{ width: `${progress}%` }} /></div>
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <FilterDropdown label={t.filterCategory} icon="filter" options={CATEGORIES} selected={filterCats} onChange={setFilterCats} color={BRAND} />
              <FilterDropdown label={t.filterRegion} icon="target" options={TARGET_REGIONS} selected={filterRegions} onChange={setFilterRegions} color={MID} />
            </div>
            {filteredOwnerExs.length === 0 && <div className="card" style={{ padding: 20, textAlign: "center", color: "#3D7070", fontFamily: "'DM Sans',sans-serif", fontSize: 14 }}>{t.noExercises}</div>}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {filteredOwnerExs.map(ex => {
                const done = isDone(ex.id);
                return (
                  <div key={ex.id} className="card ex-card" onClick={() => setSelectedExercise(ex)} style={{ padding: "14px", display: "flex", gap: 12, alignItems: "center", opacity: done ? 0.62 : 1 }}>
                    {ex.image_url ? <img src={ex.image_url} alt={ex.title} style={{ width: 50, height: 50, borderRadius: 12, objectFit: "contain", flexShrink: 0, background: LIGHT, padding: 2 }} />
                      : <div style={{ width: 50, height: 50, borderRadius: 12, background: BRAND + "18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name="paw" size={22} color={BRAND} /></div>}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 14, fontWeight: 600, lineHeight: 1.3, textDecoration: done ? "line-through" : "none", color: done ? ACCENT : "#102828" }}>{ex.title}</div>
                        <button className="btn" onClick={e => { e.stopPropagation(); toggleDone(ex.id); }} style={{ width: 28, height: 28, borderRadius: "50%", border: `2px solid ${done ? BRAND : "#B8DFE0"}`, background: done ? BRAND : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          {done && <Icon name="check" size={14} color="white" />}
                        </button>
                      </div>
                      <div style={{ display: "flex", gap: 5, marginTop: 5, flexWrap: "wrap" }}>
                        {(ex.categories || []).slice(0, 2).map(c => <span key={c} className="tag" style={{ background: BRAND + "20", color: BRAND }}>{c}</span>)}
                        <span className="tag" style={{ background: (difficultyColor[ex.difficulty] || BRAND) + "20", color: difficultyColor[ex.difficulty] || BRAND }}>{ex.difficulty}</span>
                        <span className="tag" style={{ background: LIGHT, color: "#3D7070" }}>⏱ {ex.duration}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>)}
        </div>
      )}

      {/* ══ THERAPIST / PRACTICE VIEW ══ */}
      {view === "therapist" && isAdmin && (
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 0 80px" }}>
          {/* Sub-tabs */}
          <div style={{ display: "flex", gap: 0, background: "white", borderBottom: `2px solid ${LIGHT}`, padding: "0 14px" }}>
            {[["patients","user","Patienten"],["exercises","assign","Übungen"],["assign","assign","Zuweisen"]].map(([tab, ic, lb]) => (
              <button key={tab} className="btn" onClick={() => setPracticeTab(tab)} style={{ flex: 1, padding: "13px 8px", fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 700, color: practiceTab === tab ? BRAND : "#3D7070", borderBottom: practiceTab === tab ? `2px solid ${BRAND}` : "2px solid transparent", marginBottom: -2, display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                <Icon name={tab === "patients" ? "user" : tab === "exercises" ? "tip" : "assign"} size={14} color={practiceTab === tab ? BRAND : "#3D7070"} />{lb}
              </button>
            ))}
          </div>

          {/* PATIENTEN TAB */}
          {practiceTab === "patients" && (
            <div style={{ padding: "16px 14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700, color: DARK }}>Patienten</div>
                <button className="btn" onClick={() => { setNewPatient(EMPTY_PATIENT); setNewAccountMode("new"); setSheet("addPatient"); }} style={{ background: BRAND, color: "#102828", borderRadius: 10, padding: "9px 14px", fontSize: 12, fontFamily: "'DM Sans',sans-serif", fontWeight: 700, display: "flex", alignItems: "center", gap: 5 }}>
                  <Icon name="plus" size={14} color="#102828" /> Neuer Patient
                </button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {patients.map(p => {
                  const userEmail = getUserEmail(p.user_id);
                  return (
                    <div key={p.id} className="card" style={{ padding: "14px 16px", display: "flex", gap: 12, alignItems: "center" }}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: LIGHT, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0, border: `1.5px solid ${ACCENT}40` }}>{p.avatar || "🐕"}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 15, fontWeight: 700, color: "#102828" }}>{p.name}</div>
                        <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: "#3D7070", marginTop: 1 }}>{p.breed} · {p.owner}</div>
                        <div style={{ display: "flex", gap: 5, marginTop: 5, flexWrap: "wrap" }}>
                          <span className="tag" style={{ background: BRAND + "20", color: MID }}>{p.condition}</span>
                          {userEmail
                            ? <span className="tag" style={{ background: "#E8F5E9", color: "#2E7D32", display: "flex", alignItems: "center", gap: 3 }}><Icon name="mail" size={10} color="#2E7D32" />{userEmail}</span>
                            : <span className="tag" style={{ background: "#FFF3E0", color: "#E65100" }}>Kein Login</span>}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 5 }}>
                        <button className="iBtn" onClick={() => { setEditPatientData({ ...p }); setSheet("editPatient"); }} style={{ background: BRAND + "20" }}><Icon name="edit" size={14} color={MID} /></button>
                        <button className="iBtn" onClick={() => { setSheetData(p); setSheet("confirmDeletePt"); }} style={{ background: "#FFE8E8" }}><Icon name="trash" size={14} color="#C0392B" /></button>
                      </div>
                    </div>
                  );
                })}
                {patients.length === 0 && <div className="card" style={{ padding: 24, textAlign: "center", color: "#3D7070", fontFamily: "'DM Sans',sans-serif", fontSize: 14 }}>Noch keine Patienten angelegt.</div>}
              </div>
            </div>
          )}

          {/* ÜBUNGEN TAB */}
          {practiceTab === "exercises" && (
            <div style={{ padding: "16px 14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700, color: DARK }}>Übungsvorlagen</div>
                <button className="btn" onClick={() => { setNewTemplate(EMPTY_TEMPLATE); setSheet("addTemplate"); }} style={{ background: BRAND, color: "#102828", borderRadius: 10, padding: "9px 14px", fontSize: 12, fontFamily: "'DM Sans',sans-serif", fontWeight: 700, display: "flex", alignItems: "center", gap: 5 }}>
                  <Icon name="plus" size={14} color="#102828" /> Neue Übung
                </button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {templates.map(tmpl => (
                  <div key={tmpl.id} className="card" style={{ padding: "12px 14px", display: "flex", gap: 10, alignItems: "center" }}>
                    {tmpl.image_url ? <img src={tmpl.image_url} alt={tmpl.title} style={{ width: 42, height: 42, borderRadius: 9, objectFit: "contain", flexShrink: 0, background: LIGHT, padding: 2 }} />
                      : <div style={{ width: 42, height: 42, borderRadius: 9, background: LIGHT, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name="paw" size={18} color={ACCENT} /></div>}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 14, fontWeight: 600, color: "#102828", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{tmpl.title}</div>
                      <div style={{ display: "flex", gap: 5, marginTop: 4, flexWrap: "wrap" }}>
                        {(tmpl.categories || []).map(c => <span key={c} className="tag" style={{ background: BRAND + "18", color: BRAND }}>{c}</span>)}
                        <span className="tag" style={{ background: (difficultyColor[tmpl.difficulty] || BRAND) + "18", color: difficultyColor[tmpl.difficulty] || BRAND }}>{tmpl.difficulty}</span>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 5 }}>
                      <button className="iBtn" onClick={() => { setEditTemplateData({ ...tmpl, instructions: tmpl.instructions?.length ? tmpl.instructions : ["","",""] }); setSheet("editTemplate"); }} style={{ background: BRAND + "20" }}><Icon name="edit" size={14} color={MID} /></button>
                      <button className="iBtn" onClick={() => { setSheetData(tmpl); setSheet("confirmDeleteTmpl"); }} style={{ background: "#FFE8E8" }}><Icon name="trash" size={14} color="#C0392B" /></button>
                    </div>
                  </div>
                ))}
                {templates.length === 0 && <div className="card" style={{ padding: 24, textAlign: "center", color: "#3D7070", fontFamily: "'DM Sans',sans-serif", fontSize: 14 }}>Noch keine Übungsvorlagen erstellt.</div>}
              </div>
            </div>
          )}

          {/* ZUWEISEN TAB */}
          {practiceTab === "assign" && (
            <div style={{ padding: "16px 14px" }}>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700, color: DARK, marginBottom: 14 }}>Übung zuweisen</div>
              <div style={{ marginBottom: 14 }}>
                <SL text="Patient auswählen" />
                <select value={selectedPatient?.id || ""} onChange={e => setSelectedPatient(patients.find(p => p.id === e.target.value) || null)} style={{ ...inp, borderRadius: 12 }}>
                  <option value="">{t.selectPatient}</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{patLabel(p)}</option>)}
                </select>
              </div>

              {selectedPatient && (<>
                <button className="btn" onClick={() => setSheet("addExercise")} style={{ width: "100%", background: DARK, color: "#E6F6F6", borderRadius: 12, padding: "12px", fontSize: 13, fontFamily: "'DM Sans',sans-serif", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 16 }}>
                  <Icon name="assign" size={16} color="#E6F6F6" /> Übung zuweisen
                </button>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 700, color: "#3D7070", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 10 }}>{t.homeExercises(exForPatient(selectedPatient.id).length)}</div>
                {exForPatient(selectedPatient.id).length === 0 && <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: ACCENT, textAlign: "center", padding: "12px 0" }}>{t.noExercisesYet}</div>}
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {exForPatient(selectedPatient.id).map(ex => (
                    <div key={ex.id} className="card" style={{ padding: "11px 13px", display: "flex", gap: 10, alignItems: "center" }}>
                      {ex.image_url ? <img src={ex.image_url} alt={ex.title} style={{ width: 38, height: 38, borderRadius: 8, objectFit: "contain", flexShrink: 0, background: LIGHT, padding: 2, cursor: "pointer" }} onClick={() => setSelectedExercise(ex)} />
                        : <div style={{ width: 38, height: 38, borderRadius: 8, background: LIGHT, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: "pointer" }} onClick={() => setSelectedExercise(ex)}><Icon name="paw" size={17} color={ACCENT} /></div>}
                      <div style={{ flex: 1, minWidth: 0, cursor: "pointer" }} onClick={() => setSelectedExercise(ex)}>
                        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 13, fontWeight: 600, color: "#102828", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ex.title}</div>
                        <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: "#3D7070", marginTop: 1 }}>⏱ {ex.duration}</div>
                      </div>
                      <button className="iBtn" onClick={() => { setSheetData(ex); setSheet("confirmDeleteEx"); }} style={{ background: "#FFE8E8" }}><Icon name="trash" size={14} color="#C0392B" /></button>
                    </div>
                  ))}
                </div>
              </>)}
              {!selectedPatient && <div className="card" style={{ padding: 24, textAlign: "center", color: "#3D7070", fontFamily: "'DM Sans',sans-serif", fontSize: 14 }}>Bitte zuerst einen Patienten auswählen.</div>}
            </div>
          )}
        </div>
      )}

      {/* ══ INFO VIEW ══ */}
      {view === "info" && (
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "16px 14px 80px" }}>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, marginBottom: 4 }}>{t.tipsTitle}</div>
          <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: "#3D7070", marginBottom: 14 }}>{t.tipsSub}</div>
          <div style={{ display: "flex", gap: 7, marginBottom: 16, background: "white", borderRadius: 14, padding: 5, boxShadow: "0 2px 12px rgba(95,184,185,0.10)" }}>
            {[["tips","tip",t.tabTips],["pause","rest",t.tabPause]].map(([tab, ic, label]) => (
              <button key={tab} className="btn" onClick={() => setInfoTab(tab)} style={{ flex: 1, padding: "10px 8px", borderRadius: 10, background: infoTab === tab ? BRAND : "transparent", color: infoTab === tab ? "#102828" : "#3D7070", fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <Icon name={ic} size={14} color={infoTab === tab ? "#102828" : "#3D7070"} />{label}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
            {infoTab === "tips" && TIPS[lang].map((tip, i) => <InfoCard key={i} {...tip} />)}
            {infoTab === "pause" && [{ icon: "rest", title: t.pauseHero, text: t.pauseHeroText }, ...PAUSE[lang]].map((sec, i) => <InfoCard key={i} {...sec} />)}
          </div>
        </div>
      )}

      {/* ══ EXERCISE DETAIL ══ */}
      {selectedExercise && (
        <div className="overlay" onClick={() => setSelectedExercise(null)}>
          <div className="sheet" onClick={e => e.stopPropagation()}>
            <SheetHeader title={selectedExercise.title} onClose={() => setSelectedExercise(null)} />
            <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
              {(selectedExercise.categories || []).map(c => <span key={c} className="tag" style={{ background: BRAND + "20", color: BRAND }}>{c}</span>)}
              {(selectedExercise.target_regions || []).map(r => <span key={r} className="tag" style={{ background: MID + "20", color: MID }}>{r}</span>)}
              <span className="tag" style={{ background: (difficultyColor[selectedExercise.difficulty] || BRAND) + "20", color: difficultyColor[selectedExercise.difficulty] || BRAND }}>{selectedExercise.difficulty}</span>
            </div>
            {selectedExercise.image_url
              ? <div style={{ width: "100%", borderRadius: 14, overflow: "hidden", marginBottom: 16, background: LIGHT }}><img src={selectedExercise.image_url} alt={selectedExercise.title} style={{ width: "100%", height: "auto", maxHeight: 260, objectFit: "contain", display: "block" }} /></div>
              : <div style={{ background: LIGHT, borderRadius: 14, height: 110, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}><Icon name="paw" size={48} color={ACCENT} /></div>}
            <div style={{ display: "flex", gap: 9, marginBottom: 16 }}>
              <div style={{ flex: 1, background: PALE, borderRadius: 10, padding: "12px", textAlign: "center" }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 3 }}><Icon name="clock" size={18} color={BRAND} /></div>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 600, color: "#102828" }}>{selectedExercise.duration}</div>
              </div>
              {selectedExercise.video_url && (
                <a href={selectedExercise.video_url} target="_blank" rel="noreferrer" style={{ flex: 1, background: BRAND + "12", borderRadius: 10, padding: "12px", textAlign: "center", textDecoration: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, border: `1.5px solid ${BRAND}30` }}>
                  <Icon name="play" size={18} color={MID} />
                  <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 600, color: MID }}>{t.watchVideo}</div>
                </a>
              )}
            </div>
            {selectedExercise.description && <div style={{ marginBottom: 16 }}><div style={{ fontFamily: "'Playfair Display',serif", fontSize: 14, fontWeight: 700, marginBottom: 6, color: "#102828" }}>{t.description}</div><div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: DARK, lineHeight: 1.7 }}>{selectedExercise.description}</div></div>}
            {selectedExercise.instructions?.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 14, fontWeight: 700, marginBottom: 10, color: "#102828" }}>{t.step}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {selectedExercise.instructions.map((step, i) => (
                    <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                      <div style={{ width: 22, height: 22, borderRadius: "50%", background: BRAND, color: "#102828", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontFamily: "'DM Sans',sans-serif", fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
                      <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: DARK, lineHeight: 1.6, paddingTop: 2 }}>{step}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {view === "owner" && (
              <button className="btn" onClick={() => { toggleDone(selectedExercise.id); setSelectedExercise(null); }} style={{ width: "100%", padding: "14px", borderRadius: 12, background: isDone(selectedExercise.id) ? LIGHT : BRAND, color: isDone(selectedExercise.id) ? "#3D7070" : "#102828", fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: 15 }}>
                {isDone(selectedExercise.id) ? t.markUndone : t.markDone}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ══ SHEET: ASSIGN EXERCISE ══ */}
      {sheet === "addExercise" && (
        <div className="overlay" onClick={closeSheet}>
          <div className="sheet" onClick={e => e.stopPropagation()}>
            <SheetHeader title={t.assignBtn} onClose={closeSheet} />
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div><SL text={t.step1} /><select value={selectedPatient?.id || ""} onChange={e => setSelectedPatient(patients.find(p => p.id === e.target.value) || null)} style={inp}><option value="">{t.selectPatient}</option>{patients.map(p => <option key={p.id} value={p.id}>{patLabel(p)}</option>)}</select></div>
              <div>
                <SL text={t.step2} />
                <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                  <FilterDropdown label={t.filterCategory} icon="filter" options={CATEGORIES} selected={assignFilterCats} onChange={setAssignFilterCats} color={BRAND} />
                  <FilterDropdown label={t.filterRegion} icon="target" options={TARGET_REGIONS} selected={assignFilterRegions} onChange={setAssignFilterRegions} color={MID} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 5, maxHeight: 200, overflowY: "auto", border: `1px solid ${LIGHT}`, borderRadius: 11, padding: 6 }}>
                  {filteredTemplates.map(tmpl => (
                    <div key={tmpl.id} className={"tmpl-row" + (selectedTemplate?.id === tmpl.id ? " sel" : "")} onClick={() => setSelectedTemplate(selectedTemplate?.id === tmpl.id ? null : tmpl)}>
                      {tmpl.image_url ? <img src={tmpl.image_url} alt={tmpl.title} style={{ width: 36, height: 36, borderRadius: 7, objectFit: "contain", flexShrink: 0, background: LIGHT, padding: 2 }} />
                        : <div style={{ width: 36, height: 36, borderRadius: 7, background: LIGHT, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name="paw" size={16} color={ACCENT} /></div>}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 13, fontWeight: 600, color: "#102828" }}>{tmpl.title}</div>
                        <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: "#3D7070" }}>{(tmpl.categories || []).join(", ")} · {tmpl.difficulty}</div>
                      </div>
                      {selectedTemplate?.id === tmpl.id && <Icon name="check" size={15} color={BRAND} />}
                    </div>
                  ))}
                  {filteredTemplates.length === 0 && <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: ACCENT, textAlign: "center", padding: "12px 0" }}>{t.noCategoryEx}</div>}
                </div>
              </div>
              <div><SL text={t.step3} /><input value={duration} onChange={e => setDuration(e.target.value)} placeholder={t.freqPh} style={inp} /></div>
              <button className="btn" onClick={addExercise} disabled={saving} style={{ width: "100%", padding: "14px", borderRadius: 12, background: selectedTemplate && selectedPatient && duration ? BRAND : "#B8DFE0", color: selectedTemplate && selectedPatient && duration ? "#102828" : "#7ECBCC", fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: 15 }}>
                {saving ? t.saving : t.assignBtn}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ SHEET: ADD PATIENT ══ */}
      {sheet === "addPatient" && (
        <div className="overlay" onClick={closeSheet}>
          <div className="sheet" onClick={e => e.stopPropagation()}>
            <SheetHeader title="Neuer Patient" onClose={closeSheet} />
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[["Name des Hundes *","name","Bello"],["Rasse","breed","Labrador Retriever"],["Alter","age","7 Jahre"],["Besitzer","owner","Familie Müller"],["Diagnose","condition","Hüftdysplasie"]].map(([label, key, ph]) => (
                <div key={key}><SL text={label} /><input value={newPatient[key] || ""} onChange={e => setNewPatient(p => ({ ...p, [key]: e.target.value }))} placeholder={ph} style={inp} /></div>
              ))}
              <div><SL text="Emoji" /><input value={newPatient.avatar || ""} onChange={e => setNewPatient(p => ({ ...p, avatar: e.target.value }))} placeholder="🐕" style={{ ...inp, width: 60, textAlign: "center" }} /></div>

              {/* Account section */}
              <div style={{ background: LIGHT, borderRadius: 12, padding: "14px" }}>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 14, fontWeight: 700, color: DARK, marginBottom: 12 }}>Login-Konto</div>
                <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                  {[["new","Neues Konto"],["existing","Bestehendes Konto"],["none","Kein Login"]].map(([mode, label]) => (
                    <button key={mode} className="mode-btn" onClick={() => setNewAccountMode(mode)} style={{ borderColor: newAccountMode === mode ? BRAND : "#B8DFE0", background: newAccountMode === mode ? BRAND : "white", color: newAccountMode === mode ? "#102828" : "#3D7070", fontSize: 11 }}>{label}</button>
                  ))}
                </div>
                {newAccountMode === "new" && (<>
                  <div style={{ marginBottom: 10 }}><SL text="Email" /><input value={newPatient.ownerEmail || ""} onChange={e => setNewPatient(p => ({ ...p, ownerEmail: e.target.value }))} placeholder="besitzer@email.de" type="email" style={inp} /></div>
                  <div><SL text="Passwort (mind. 6 Zeichen)" /><input value={newPatient.ownerPassword || ""} onChange={e => setNewPatient(p => ({ ...p, ownerPassword: e.target.value }))} placeholder="••••••••" type="password" style={inp} /></div>
                </>)}
                {newAccountMode === "existing" && (
                  <div>
                    <SL text="Bestehenden User auswählen" />
                    <select value={selectedExistingUserId} onChange={e => setSelectedExistingUserId(e.target.value)} style={inp}>
                      <option value="">User auswählen...</option>
                      {userEmails.filter(u => u.id !== ADMIN_ID).map(u => <option key={u.id} value={u.id}>{u.email}</option>)}
                    </select>
                  </div>
                )}
                {newAccountMode === "none" && <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: "#3D7070" }}>Dieser Patient bekommt keinen App-Zugang.</div>}
              </div>

              <button className="btn" onClick={addPatient} disabled={saving || !newPatient.name} style={{ width: "100%", padding: "14px", borderRadius: 12, background: newPatient.name ? BRAND : "#B8DFE0", color: newPatient.name ? "#102828" : "#7ECBCC", fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: 15 }}>
                {saving ? t.saving : "Patient anlegen"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ SHEET: EDIT PATIENT ══ */}
      {sheet === "editPatient" && editPatientData && (
        <div className="overlay" onClick={closeSheet}>
          <div className="sheet" onClick={e => e.stopPropagation()}>
            <SheetHeader title="Patient bearbeiten" onClose={closeSheet} />
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[["Name *","name"],["Rasse","breed"],["Alter","age"],["Besitzer","owner"],["Diagnose","condition"]].map(([label, key]) => (
                <div key={key}><SL text={label} /><input value={editPatientData[key] || ""} onChange={e => setEditPatientData(p => ({ ...p, [key]: e.target.value }))} style={inp} /></div>
              ))}
              <div><SL text="Emoji" /><input value={editPatientData.avatar || ""} onChange={e => setEditPatientData(p => ({ ...p, avatar: e.target.value }))} style={{ ...inp, width: 60, textAlign: "center" }} /></div>

              {/* Login info */}
              <div style={{ background: LIGHT, borderRadius: 12, padding: "14px" }}>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 14, fontWeight: 700, color: DARK, marginBottom: 10 }}>Login-Konto</div>
                {editPatientData.user_id && getUserEmail(editPatientData.user_id) ? (<>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, background: "white", borderRadius: 10, padding: "10px 12px" }}>
                    <Icon name="mail" size={16} color={BRAND} />
                    <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: "#102828", flex: 1 }}>{getUserEmail(editPatientData.user_id)}</span>
                  </div>
                  {resetEmailSent
                    ? <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: "#2E7D32", background: "#E8F5E9", borderRadius: 8, padding: "8px 12px" }}>✓ Passwort-Reset Email wurde gesendet!</div>
                    : <button className="btn" onClick={() => sendPasswordReset(getUserEmail(editPatientData.user_id))} style={{ background: "white", border: `1.5px solid ${BRAND}`, borderRadius: 9, padding: "8px 12px", fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 600, color: BRAND, display: "flex", alignItems: "center", gap: 6 }}>
                        <Icon name="mail" size={13} color={BRAND} /> Passwort-Reset Email senden
                      </button>}
                  <div style={{ marginTop: 10 }}>
                    <SL text="Anderen User verknüpfen (optional)" />
                    <select
                      value={editPatientData._newUserId !== undefined ? (editPatientData._newUserId || "") : (editPatientData.user_id || "")}
                      onChange={e => setEditPatientData(p => ({ ...p, _newUserId: e.target.value || null }))}
                      style={inp}>
                      <option value="">Kein Login</option>
                      {userEmails.filter(u => u.id !== ADMIN_ID).map(u => <option key={u.id} value={u.id}>{u.email}</option>)}
                    </select>
                  </div>
                </>) : (<>
                  <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: "#3D7070", marginBottom: 10 }}>Kein Login-Konto verknüpft.</div>
                  <SL text="User verknüpfen" />
                  <select value={editPatientData._newUserId ?? ""} onChange={e => setEditPatientData(p => ({ ...p, _newUserId: e.target.value || null }))} style={inp}>
                    <option value="">User auswählen...</option>
                    {userEmails.filter(u => u.id !== ADMIN_ID).map(u => <option key={u.id} value={u.id}>{u.email}</option>)}
                  </select>
                </>)}
              </div>

              <button className="btn" onClick={updatePatient} disabled={saving || !editPatientData.name} style={{ width: "100%", padding: "14px", borderRadius: 12, background: editPatientData.name ? BRAND : "#B8DFE0", color: editPatientData.name ? "#102828" : "#7ECBCC", fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: 15 }}>
                {saving ? t.saving : "Änderungen speichern"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ SHEET: ADD TEMPLATE ══ */}
      {sheet === "addTemplate" && (
        <div className="overlay" onClick={closeSheet}>
          <div className="sheet" onClick={e => e.stopPropagation()}>
            <SheetHeader title="Neue Übung erstellen" onClose={closeSheet} />
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div><SL text="Titel *" /><input value={newTemplate.title} onChange={e => setNewTemplate(p => ({ ...p, title: e.target.value }))} placeholder="z.B. Cavaletti-Stangen" style={inp} /></div>
              <div><SL text="Kategorie" /><MultiSelect options={CATEGORIES} selected={newTemplate.categories} onChange={v => setNewTemplate(p => ({ ...p, categories: v }))} color={BRAND} /></div>
              <div><SL text="Zielregion" /><MultiSelect options={TARGET_REGIONS} selected={newTemplate.target_regions} onChange={v => setNewTemplate(p => ({ ...p, target_regions: v }))} color={MID} /></div>
              <div><SL text="Schwierigkeit" /><select value={newTemplate.difficulty} onChange={e => setNewTemplate(p => ({ ...p, difficulty: e.target.value }))} style={inp}>{["Leicht","Mittel","Schwer"].map(d => <option key={d}>{d}</option>)}</select></div>
              <div><SL text="Beschreibung" /><textarea value={newTemplate.description} onChange={e => setNewTemplate(p => ({ ...p, description: e.target.value }))} rows={3} placeholder="Kurze Erklärung..." style={{ ...inp, resize: "vertical" }} /></div>
              <div><SL text="Schritte" />{newTemplate.instructions.map((s, i) => <input key={i} value={s} onChange={e => setNewTemplate(p => ({ ...p, instructions: p.instructions.map((x, j) => j === i ? e.target.value : x) }))} placeholder={`Schritt ${i + 1}...`} style={{ ...inp, marginBottom: 6 }} />)}</div>
              <div><SL text="Bild-URL" /><input value={newTemplate.image_url} onChange={e => setNewTemplate(p => ({ ...p, image_url: e.target.value }))} placeholder="https://..." style={inp} /></div>
              <div><SL text="Video-URL (optional)" /><input value={newTemplate.video_url} onChange={e => setNewTemplate(p => ({ ...p, video_url: e.target.value }))} placeholder="https://youtube.com/..." style={inp} /></div>
              <button className="btn" onClick={addTemplate} disabled={saving || !newTemplate.title} style={{ width: "100%", padding: "14px", borderRadius: 12, background: newTemplate.title ? BRAND : "#B8DFE0", color: newTemplate.title ? "#102828" : "#7ECBCC", fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: 15 }}>
                {saving ? t.saving : "Übung speichern"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ SHEET: EDIT TEMPLATE ══ */}
      {sheet === "editTemplate" && editTemplateData && (
        <div className="overlay" onClick={closeSheet}>
          <div className="sheet" onClick={e => e.stopPropagation()}>
            <SheetHeader title="Übung bearbeiten" onClose={closeSheet} />
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div><SL text="Titel *" /><input value={editTemplateData.title} onChange={e => setEditTemplateData(p => ({ ...p, title: e.target.value }))} style={inp} /></div>
              <div><SL text="Kategorie" /><MultiSelect options={CATEGORIES} selected={editTemplateData.categories || []} onChange={v => setEditTemplateData(p => ({ ...p, categories: v }))} color={BRAND} /></div>
              <div><SL text="Zielregion" /><MultiSelect options={TARGET_REGIONS} selected={editTemplateData.target_regions || []} onChange={v => setEditTemplateData(p => ({ ...p, target_regions: v }))} color={MID} /></div>
              <div><SL text="Schwierigkeit" /><select value={editTemplateData.difficulty} onChange={e => setEditTemplateData(p => ({ ...p, difficulty: e.target.value }))} style={inp}>{["Leicht","Mittel","Schwer"].map(d => <option key={d}>{d}</option>)}</select></div>
              <div><SL text="Beschreibung" /><textarea value={editTemplateData.description || ""} onChange={e => setEditTemplateData(p => ({ ...p, description: e.target.value }))} rows={3} style={{ ...inp, resize: "vertical" }} /></div>
              <div><SL text="Schritte" />{(editTemplateData.instructions || ["","",""]).map((s, i) => <input key={i} value={s} onChange={e => setEditTemplateData(p => ({ ...p, instructions: (p.instructions || []).map((x, j) => j === i ? e.target.value : x) }))} placeholder={`Schritt ${i + 1}...`} style={{ ...inp, marginBottom: 6 }} />)}</div>
              <div><SL text="Bild-URL" /><input value={editTemplateData.image_url || ""} onChange={e => setEditTemplateData(p => ({ ...p, image_url: e.target.value }))} placeholder="https://..." style={inp} /></div>
              <div><SL text="Video-URL" /><input value={editTemplateData.video_url || ""} onChange={e => setEditTemplateData(p => ({ ...p, video_url: e.target.value }))} placeholder="https://youtube.com/..." style={inp} /></div>
              <button className="btn" onClick={updateTemplate} disabled={saving || !editTemplateData.title} style={{ width: "100%", padding: "14px", borderRadius: 12, background: editTemplateData.title ? BRAND : "#B8DFE0", color: editTemplateData.title ? "#102828" : "#7ECBCC", fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: 15 }}>
                {saving ? t.saving : "Änderungen speichern"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ CONFIRM SHEETS ══ */}
      {sheet === "confirmDeleteEx" && sheetData && (
        <div className="overlay" onClick={closeSheet}>
          <div className="sheet" onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}><Icon name="trash" size={40} color="#C0392B" /></div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 19, fontWeight: 700, marginBottom: 8, textAlign: "center", color: "#102828" }}>Übung entfernen?</div>
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: "#3D7070", marginBottom: 22, textAlign: "center" }}><strong>{sheetData.title}</strong> wird dauerhaft entfernt.</div>
            <div style={{ display: "flex", gap: 9 }}>
              <button className="btn" onClick={closeSheet} style={{ flex: 1, padding: "14px", borderRadius: 12, background: LIGHT, color: "#3D7070", fontFamily: "'DM Sans',sans-serif", fontWeight: 700 }}>{t.cancel}</button>
              <button className="btn" onClick={() => deleteExercise(sheetData.id)} style={{ flex: 1, padding: "14px", borderRadius: 12, background: "#C0392B", color: "white", fontFamily: "'DM Sans',sans-serif", fontWeight: 700 }}>{deleting ? "..." : t.remove}</button>
            </div>
          </div>
        </div>
      )}
      {sheet === "confirmDeletePt" && sheetData && (
        <div className="overlay" onClick={closeSheet}>
          <div className="sheet" onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}><Icon name="trash" size={40} color="#C0392B" /></div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 19, fontWeight: 700, marginBottom: 8, textAlign: "center", color: "#102828" }}>Patient löschen?</div>
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: "#3D7070", marginBottom: 22, textAlign: "center" }}><strong>{sheetData.name}</strong> und alle Übungen werden dauerhaft gelöscht.</div>
            <div style={{ display: "flex", gap: 9 }}>
              <button className="btn" onClick={closeSheet} style={{ flex: 1, padding: "14px", borderRadius: 12, background: LIGHT, color: "#3D7070", fontFamily: "'DM Sans',sans-serif", fontWeight: 700 }}>{t.cancel}</button>
              <button className="btn" onClick={() => deletePatient(sheetData.id)} style={{ flex: 1, padding: "14px", borderRadius: 12, background: "#C0392B", color: "white", fontFamily: "'DM Sans',sans-serif", fontWeight: 700 }}>{deleting ? "..." : t.delete}</button>
            </div>
          </div>
        </div>
      )}
      {sheet === "confirmDeleteTmpl" && sheetData && (
        <div className="overlay" onClick={closeSheet}>
          <div className="sheet" onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}><Icon name="trash" size={40} color="#C0392B" /></div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 19, fontWeight: 700, marginBottom: 8, textAlign: "center", color: "#102828" }}>Übungsvorlage löschen?</div>
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: "#3D7070", marginBottom: 22, textAlign: "center" }}><strong>{sheetData.title}</strong> wird aus der Bibliothek gelöscht. Bereits zugewiesene Übungen bleiben erhalten.</div>
            <div style={{ display: "flex", gap: 9 }}>
              <button className="btn" onClick={closeSheet} style={{ flex: 1, padding: "14px", borderRadius: 12, background: LIGHT, color: "#3D7070", fontFamily: "'DM Sans',sans-serif", fontWeight: 700 }}>{t.cancel}</button>
              <button className="btn" onClick={() => deleteTemplate(sheetData.id)} style={{ flex: 1, padding: "14px", borderRadius: 12, background: "#C0392B", color: "white", fontFamily: "'DM Sans',sans-serif", fontWeight: 700 }}>{deleting ? "..." : t.delete}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
