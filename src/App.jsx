import { useState, useEffect } from "react";
import { supabase } from "./supabase";

// ── Update browser tab ──
document.title = "Fit Fun Dog";
// Remove any existing favicons first
document.querySelectorAll("link[rel*='icon']").forEach(el => el.remove());
const favicon = document.createElement("link");
favicon.rel = "icon";
favicon.type = "image/png";
favicon.href = "https://tkgwdmntglzfeulpgfpw.supabase.co/storage/v1/object/public/exercise-images/Logo%20Kopf%20Fiete.png?" + Date.now();
document.head.appendChild(favicon);

const BRAND = "#5fb8b9";
const DARK = "#1E4A4B";
const MID = "#3D8E8F";
const LIGHT = "#E6F6F6";
const PALE = "#F3FBFB";
const ACCENT = "#8FD4D5";
const LOGO_URL = "https://tkgwdmntglzfeulpgfpw.supabase.co/storage/v1/object/public/exercise-images/Logo%20Fit%20Fun%20Dog-Vektor%20ws.png";

const CATEGORIES = ["Regeneration", "Balance", "Kräftigung", "Koordination", "Mobilisation"];
const TARGET_REGIONS = ["Ganzer Körper", "Hinterhand", "Vorderhand", "Rumpf", "Vorderpfoten", "Rücken"];

// ── SVG Icons ──
const Icon = ({ name, size = 20, color = BRAND }) => {
  const icons = {
    owner: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
    practice: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>,
    info: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
    trash: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
    edit: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
    plus: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    assign: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
    check: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
    close: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    play: <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
    clock: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    lang: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
    chevdown: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>,
    patient: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    paw: <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><circle cx="5.5" cy="6.5" r="2"/><circle cx="12" cy="4.5" r="2"/><circle cx="18.5" cy="6.5" r="2"/><circle cx="3.5" cy="12.5" r="1.5"/><path d="M12 8c-3.5 0-7 3-7 6.5 0 2.5 2 4.5 4.5 4.5h5c2.5 0 4.5-2 4.5-4.5C19 11 15.5 8 12 8z"/></svg>,
    tip: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 1 7 7c0 2.4-1.2 4.5-3 5.7V17a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-2.3A7 7 0 0 1 12 2z"/></svg>,
    rest: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22C6.5 22 2 17.5 2 12S6.5 2 12 2s10 4.5 10 10-4.5 10-10 10z"/><path d="M12 6v6l4 2"/></svg>,
    filter: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>,
    target: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
  };
  return icons[name] || null;
};

// ── Translations ──
const T = {
  de: {
    appSub: "Tierphysiotherapie", navOwner: "Besitzer", navTherapist: "Praxis", navInfo: "Info",
    progress: "Heutiger Fortschritt", exercisesDone: "Übungen abgeschlossen",
    allDone: (n) => `Alle Übungen erledigt! ${n} sagt Danke!`,
    noPatient: "Noch kein Patient angelegt", noExercises: "Noch keine Übungen zugewiesen.",
    all: "Alle", myPatients: "Meine Patienten", activeCases: (n) => `${n} aktive Fälle`,
    selectPatient: "Patient auswählen...", noPatientSelected: "Bitte einen Patienten auswählen.",
    homeExercises: (n) => `Heimübungen (${n})`, noExercisesYet: "Noch keine Übungen.",
    newPatient: "Neuer Patient", newExercise: "Neue Übung", assignExercise: "Übung zuweisen",
    editPatient: "Patient bearbeiten", saveChanges: "Änderungen speichern",
    deletePatient: "Patient löschen?", deletePatientMsg: (n) => `${n} und alle Übungen werden dauerhaft gelöscht.`,
    deleteExercise: "Übung entfernen?", deleteExerciseMsg: (t) => `${t} wird dauerhaft entfernt.`,
    cancel: "Abbrechen", delete: "Löschen", remove: "Entfernen",
    tipsTitle: "Tipps & Wissen", tipsSub: "Wichtige Hinweise für das Training",
    tabTips: "Trainings-Tipps", tabPause: "Pause & Regeneration",
    pauseHero: "Pause ist Training!", pauseHeroText: "Pause ist der Zeitraum, in dem die eigentliche Leistungssteigerung stattfindet. Ohne ausreichende Pausen droht Überlastung statt Fortschritt.",
    step: "Schritt für Schritt", description: "Beschreibung", watchVideo: "Video ansehen",
    markDone: "Heute erledigt!", markUndone: "Als unerledigt markieren",
    saving: "Wird gespeichert...", assignBtn: "Übung zuweisen",
    freq: "Häufigkeit", freqPh: "z.B. 2x täglich, 5 Min.",
    step1: "1. Patient", step2: "2. Übung auswählen", step3: "3. Häufigkeit",
    noCategoryEx: "Keine Übungen in dieser Kategorie.",
    dogName: "Name des Hundes *", breed: "Rasse", age: "Alter", owner: "Besitzer",
    condition: "Diagnose", emoji: "Emoji", createPatient: "Patient anlegen",
    titleLabel: "Titel *", category: "Kategorie", difficulty: "Schwierigkeit",
    descLabel: "Beschreibung", stepsLabel: "Schritte", imageUrl: "Bild-URL",
    videoUrl: "Video-URL (optional)", saveExercise: "Übung speichern",
    targetRegion: "Zielregion", filterCategory: "Kategorie filtern", filterRegion: "Zielregion filtern",
    langLabel: "Sprache",
  },
  en: {
    appSub: "Animal Physiotherapy", navOwner: "Owner", navTherapist: "Practice", navInfo: "Info",
    progress: "Today's Progress", exercisesDone: "exercises completed",
    allDone: (n) => `All exercises done! ${n} says Thank you!`,
    noPatient: "No patient added yet", noExercises: "No exercises assigned yet.",
    all: "All", myPatients: "My Patients", activeCases: (n) => `${n} active cases`,
    selectPatient: "Select patient...", noPatientSelected: "Please select a patient.",
    homeExercises: (n) => `Home exercises (${n})`, noExercisesYet: "No exercises yet.",
    newPatient: "New Patient", newExercise: "New Exercise", assignExercise: "Assign Exercise",
    editPatient: "Edit Patient", saveChanges: "Save Changes",
    deletePatient: "Delete patient?", deletePatientMsg: (n) => `${n} and all exercises will be permanently deleted.`,
    deleteExercise: "Remove exercise?", deleteExerciseMsg: (t) => `${t} will be permanently removed.`,
    cancel: "Cancel", delete: "Delete", remove: "Remove",
    tipsTitle: "Tips & Knowledge", tipsSub: "Important notes for training",
    tabTips: "Training Tips", tabPause: "Rest & Recovery",
    pauseHero: "Rest is Training!", pauseHeroText: "Rest is the period where actual performance improvement happens. Without sufficient rest, overtraining replaces progress.",
    step: "Step by Step", description: "Description", watchVideo: "Watch video",
    markDone: "Done today!", markUndone: "Mark as not done",
    saving: "Saving...", assignBtn: "Assign Exercise",
    freq: "Frequency", freqPh: "e.g. 2x daily, 5 min.",
    step1: "1. Patient", step2: "2. Select exercise", step3: "3. Frequency",
    noCategoryEx: "No exercises in this category.",
    dogName: "Dog's name *", breed: "Breed", age: "Age", owner: "Owner",
    condition: "Diagnosis", emoji: "Emoji", createPatient: "Add patient",
    titleLabel: "Title *", category: "Category", difficulty: "Difficulty",
    descLabel: "Description", stepsLabel: "Steps", imageUrl: "Image URL",
    videoUrl: "Video URL (optional)", saveExercise: "Save exercise",
    targetRegion: "Target Region", filterCategory: "Filter by category", filterRegion: "Filter by region",
    langLabel: "Language",
  },
  es: {
    appSub: "Fisioterapia Animal", navOwner: "Dueño", navTherapist: "Clínica", navInfo: "Info",
    progress: "Progreso de hoy", exercisesDone: "ejercicios completados",
    allDone: (n) => `Todos los ejercicios listos! ${n} dice Gracias!`,
    noPatient: "Aún no hay paciente registrado", noExercises: "Aún no hay ejercicios asignados.",
    all: "Todos", myPatients: "Mis Pacientes", activeCases: (n) => `${n} casos activos`,
    selectPatient: "Seleccionar paciente...", noPatientSelected: "Por favor selecciona un paciente.",
    homeExercises: (n) => `Ejercicios en casa (${n})`, noExercisesYet: "Aún no hay ejercicios.",
    newPatient: "Nuevo Paciente", newExercise: "Nuevo Ejercicio", assignExercise: "Asignar Ejercicio",
    editPatient: "Editar Paciente", saveChanges: "Guardar Cambios",
    deletePatient: "Eliminar paciente?", deletePatientMsg: (n) => `${n} y todos los ejercicios serán eliminados permanentemente.`,
    deleteExercise: "Eliminar ejercicio?", deleteExerciseMsg: (t) => `${t} será eliminado permanentemente.`,
    cancel: "Cancelar", delete: "Eliminar", remove: "Quitar",
    tipsTitle: "Consejos y Conocimiento", tipsSub: "Notas importantes para el entrenamiento",
    tabTips: "Consejos", tabPause: "Descanso",
    pauseHero: "El descanso es entrenamiento!", pauseHeroText: "El descanso es el periodo donde ocurre la mejora real del rendimiento. Sin suficiente descanso, el sobreentrenamiento reemplaza el progreso.",
    step: "Paso a Paso", description: "Descripción", watchVideo: "Ver video",
    markDone: "Hecho hoy!", markUndone: "Marcar como no hecho",
    saving: "Guardando...", assignBtn: "Asignar ejercicio",
    freq: "Frecuencia", freqPh: "ej. 2x al día, 5 min.",
    step1: "1. Paciente", step2: "2. Seleccionar ejercicio", step3: "3. Frecuencia",
    noCategoryEx: "No hay ejercicios en esta categoría.",
    dogName: "Nombre del perro *", breed: "Raza", age: "Edad", owner: "Dueño",
    condition: "Diagnóstico", emoji: "Emoji", createPatient: "Agregar paciente",
    titleLabel: "Título *", category: "Categoría", difficulty: "Dificultad",
    descLabel: "Descripción", stepsLabel: "Pasos", imageUrl: "URL de imagen",
    videoUrl: "URL de video (opcional)", saveExercise: "Guardar ejercicio",
    targetRegion: "Región Objetivo", filterCategory: "Filtrar categoría", filterRegion: "Filtrar región",
    langLabel: "Idioma",
  }
};

const TIPS_DATA = {
  de: [
    { icon: "tip", title: "Qualität vor Tempo", text: "Langsame Bewegungen sind viel anstrengender und effektiver für den Muskelaufbau als schnelles Hin- und Herspringen." },
    { icon: "close", title: "Abbruch-Signal", text: "Sofort aufhören, wenn der Hund anfängt zu zittern, stark zu hecheln oder die Übung schlampig ausführt. Das sind Zeichen für Muskelermüdung." },
    { icon: "target", title: "Belohnung", text: "Das Futter sollte punktgenau gegeben werden, wenn der Hund die gewünschte Position erreicht hat – nicht nur als Lockmittel." }
  ],
  en: [
    { icon: "tip", title: "Quality over Speed", text: "Slow movements are much more demanding and effective for muscle building than fast repetitions." },
    { icon: "close", title: "Stop Signal", text: "Stop immediately if the dog starts trembling, panting heavily, or performing the exercise sloppily. These are signs of muscle fatigue." },
    { icon: "target", title: "Reward", text: "Treats should be given precisely when the dog reaches the desired position – not just as a lure." }
  ],
  es: [
    { icon: "tip", title: "Calidad sobre Velocidad", text: "Los movimientos lentos son mucho más exigentes y efectivos para el desarrollo muscular que los movimientos rápidos." },
    { icon: "close", title: "Señal de Parada", text: "Detener inmediatamente si el perro empieza a temblar, jadear mucho o realizar el ejercicio descuidadamente." },
    { icon: "target", title: "Recompensa", text: "El alimento debe darse con precisión cuando el perro alcanza la posición deseada – no solo como señuelo." }
  ]
};

const PAUSE_DATA = {
  de: [
    { icon: "rest", title: "Warum Pausen so wichtig sind", text: "Pausen sind aktiver Teil des Muskelaufbaus. Das Prinzip der Superkompensation besagt: der Körper hebt nach einer Belastung das Leistungsniveau über das ursprüngliche Maß hinaus – aber nur bei ausreichender Pause." },
    { icon: "clock", title: "Pausendauer", items: ["Kleine Muskelgruppen: ca. 24 Stunden Regeneration", "Große Muskelgruppen / intensive Kraftübungen: 48–96 Stunden", "Niemals dieselbe Muskelgruppe an zwei aufeinanderfolgenden Tagen trainieren"] },
    { icon: "info", title: "Anzeichen für Übermüdung", items: ["Zittern der Muskulatur", "Hecheln oder Schmatzen (Stressanzeichen)", "Unkonzentriertheit oder langsamer werdende Reaktionen", "Unsaubere Ausführung – z.B. Pfoten schleifen, Ausweichbewegungen"] },
    { icon: "rest", title: "Pausen zwischen den Sätzen", text: "Kurze Zwischenpausen, in denen der Hund sich frei bewegen kann, helfen die Konzentrationsfähigkeit hochzuhalten – Übungen sind oft auch mental sehr anstrengend." },
    { icon: "assign", title: "Trainingsrhythmus", items: ["Tag 1: Training", "Tag 2: Pause (lockere Bewegung / Gassi)", "Tag 3: Training", "Bei intensivem Aufbau: 2 Pausentage zwischen den Einheiten"] }
  ],
  en: [
    { icon: "rest", title: "Why Rest Matters", text: "Rest is an active part of muscle building. The principle of supercompensation states: after exertion, the body raises performance above its original level – but only with sufficient rest." },
    { icon: "clock", title: "Rest Duration", items: ["Small muscle groups: approx. 24 hours recovery", "Large muscle groups / intense exercises: 48–96 hours", "Never train the same muscle group on two consecutive days"] },
    { icon: "info", title: "Signs of Fatigue", items: ["Muscle trembling", "Panting or lip smacking (stress signals)", "Loss of focus or slowing reactions", "Sloppy execution – e.g. dragging paws, compensatory movements"] },
    { icon: "rest", title: "Rest Between Sets", text: "Short breaks between sets, where the dog can move freely, help maintain concentration – exercises are often mentally demanding too." },
    { icon: "assign", title: "Training Rhythm", items: ["Day 1: Training", "Day 2: Rest (light walk only)", "Day 3: Training", "For intensive training: 2 rest days between sessions"] }
  ],
  es: [
    { icon: "rest", title: "Por qué el Descanso es Importante", text: "El descanso es parte activa del desarrollo muscular. El principio de supercompensación dice: tras el esfuerzo, el cuerpo eleva el rendimiento por encima del nivel original – pero solo con descanso suficiente." },
    { icon: "clock", title: "Duración del Descanso", items: ["Grupos musculares pequeños: aprox. 24 horas de recuperación", "Grupos musculares grandes / ejercicios intensos: 48–96 horas", "Nunca entrenar el mismo grupo muscular dos días consecutivos"] },
    { icon: "info", title: "Señales de Fatiga", items: ["Temblor muscular", "Jadeo o chasquido de labios (señales de estrés)", "Pérdida de concentración o reacciones más lentas", "Ejecución descuidada – p.ej. arrastrar patas, movimientos compensatorios"] },
    { icon: "rest", title: "Descanso Entre Series", text: "Pausas cortas entre series, donde el perro puede moverse libremente, ayudan a mantener la concentración." },
    { icon: "assign", title: "Ritmo de Entrenamiento", items: ["Día 1: Entrenamiento", "Día 2: Descanso (solo paseo ligero)", "Día 3: Entrenamiento", "Para entrenamiento intensivo: 2 días de descanso entre sesiones"] }
  ]
};

const EMPTY_PATIENT = { name: "", breed: "", age: "", owner: "", condition: "", avatar: "🐕" };
const EMPTY_TEMPLATE = { title: "", categories: [], target_regions: [], difficulty: "Leicht", description: "", instructions: ["", "", ""], image_url: "", video_url: "" };

const difficultyColor = { "Leicht": BRAND, "Mittel": MID, "Schwer": "#C0392B", "Easy": BRAND, "Medium": MID, "Hard": "#C0392B", "Fácil": BRAND, "Moderado": MID, "Difícil": "#C0392B" };

// ── Filter Dropdown component ──
const FilterDropdown = ({ label, icon, options, selected, onChange, color = BRAND }) => {
  const [open, setOpen] = useState(false);
  const count = selected.length;
  return (
    <div style={{ position: "relative", flex: 1 }} onClick={e => e.stopPropagation()}>
      <button onClick={() => setOpen(o => !o)}
        style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: `1.5px solid ${count > 0 ? color : "#B8DFE0"}`, background: count > 0 ? color + "15" : "white", display: "flex", alignItems: "center", gap: 7, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 600, color: count > 0 ? color : "#3D7070" }}>
        <Icon name={icon} size={13} color={count > 0 ? color : "#3D7070"} />
        <span style={{ flex: 1, textAlign: "left" }}>{count > 0 ? `${label} (${count})` : label}</span>
        <Icon name="chevdown" size={13} color={count > 0 ? color : "#3D7070"} />
      </button>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "white", borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", zIndex: 30, overflow: "hidden", border: `1px solid ${LIGHT}` }}>
          {selected.length > 0 && (
            <button onClick={() => { onChange([]); setOpen(false); }}
              style={{ width: "100%", padding: "9px 14px", textAlign: "left", fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 600, color: "#C0392B", background: "#FFF5F5", cursor: "pointer", border: "none", borderBottom: `1px solid ${LIGHT}` }}>
              Auswahl aufheben
            </button>
          )}
          {options.map(opt => {
            const active = selected.includes(opt);
            return (
              <button key={opt} onClick={() => onChange(active ? selected.filter(s => s !== opt) : [...selected, opt])}
                style={{ width: "100%", padding: "10px 14px", textAlign: "left", fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: active ? 600 : 400, color: active ? color : "#102828", background: active ? color + "10" : "white", cursor: "pointer", border: "none", borderBottom: `1px solid ${LIGHT}`, display: "flex", alignItems: "center", gap: 8 }}>
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

// ── Multi-select chip component (used in forms only) ──
const MultiSelect = ({ options, selected, onChange, color = BRAND }) => (
  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
    {options.map(opt => {
      const active = selected.includes(opt);
      return (
        <button key={opt} onClick={() => onChange(active ? selected.filter(s => s !== opt) : [...selected, opt])}
          style={{ padding: "6px 12px", borderRadius: 99, fontSize: 12, fontWeight: 600, fontFamily: "'DM Sans',sans-serif", cursor: "pointer", border: `2px solid ${active ? color : "#B8DFE0"}`, background: active ? color : "white", color: active ? "#102828" : "#3D7070", transition: "all .15s" }}>
          {opt}
        </button>
      );
    })}
  </div>
);

export default function App() {
  const [lang, setLang] = useState("de");
  const t = T[lang];
  const [view, setView] = useState("owner");
  const [infoTab, setInfoTab] = useState("tips");
  const [patients, setPatients] = useState([]);
  const [ownerPatient, setOwnerPatient] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [doneLogs, setDoneLogs] = useState([]);
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
  const [langOpen, setLangOpen] = useState(false);
  const [filterCategories, setFilterCategories] = useState([]);
  const [filterRegions, setFilterRegions] = useState([]);
  const [assignFilterCats, setAssignFilterCats] = useState([]);
  const [assignFilterRegions, setAssignFilterRegions] = useState([]);

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    const [{ data: pd }, { data: ed }, { data: ld }, { data: td }] = await Promise.all([
      supabase.from("patients").select("*").order("name"),
      supabase.from("exercises").select("*").order("created_at"),
      supabase.from("exercise_logs").select("*").eq("done_date", today),
      supabase.from("exercise_templates").select("*").order("title")
    ]);
    setPatients(pd || []);
    setExercises(ed || []);
    setDoneLogs(ld || []);
    setTemplates(td || []);
    if (pd && pd.length > 0) setOwnerPatient(pd[0]);
    setLoading(false);
  }

  const exForPatient = (pid) => exercises.filter(e => e.patient_id === pid);
  const isDone = (eid) => doneLogs.some(l => l.exercise_id === eid);

  const toggleDone = async (eid) => {
    if (isDone(eid)) {
      await supabase.from("exercise_logs").delete().eq("exercise_id", eid).eq("done_date", today);
      setDoneLogs(prev => prev.filter(l => l.exercise_id !== eid));
    } else {
      const { data } = await supabase.from("exercise_logs").insert({ exercise_id: eid, done_date: today, done: true }).select().single();
      if (data) setDoneLogs(prev => [...prev, data]);
    }
  };

  const addExercise = async () => {
    if (!selectedTemplate || !selectedPatient || !duration) return;
    setSaving(true);
    const { data, error } = await supabase.from("exercises").insert({
      patient_id: selectedPatient.id,
      title: selectedTemplate.title,
      categories: selectedTemplate.categories || [],
      target_regions: selectedTemplate.target_regions || [],
      difficulty: selectedTemplate.difficulty,
      description: selectedTemplate.description,
      instructions: selectedTemplate.instructions,
      image_url: selectedTemplate.image_url || null,
      video_url: selectedTemplate.video_url || null,
      duration,
    }).select().single();
    if (!error && data) setExercises(prev => [...prev, data]);
    setSaving(false);
    closeSheet();
  };

  const deleteExercise = async (eid) => {
    setDeleting(eid);
    await supabase.from("exercise_logs").delete().eq("exercise_id", eid);
    await supabase.from("exercises").delete().eq("id", eid);
    setExercises(prev => prev.filter(e => e.id !== eid));
    setDoneLogs(prev => prev.filter(l => l.exercise_id !== eid));
    setDeleting(null);
    closeSheet();
    setSelectedExercise(null);
  };

  const addPatient = async () => {
    if (!newPatient.name) return;
    setSaving(true);
    const { data, error } = await supabase.from("patients").insert(newPatient).select().single();
    if (!error && data) {
      setPatients(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      if (!ownerPatient) setOwnerPatient(data);
    }
    setSaving(false);
    setNewPatient(EMPTY_PATIENT);
    closeSheet();
  };

  const updatePatient = async () => {
    if (!editPatientData?.name) return;
    setSaving(true);
    const { data, error } = await supabase.from("patients").update(editPatientData).eq("id", editPatientData.id).select().single();
    if (!error && data) {
      setPatients(prev => prev.map(p => p.id === data.id ? data : p).sort((a, b) => a.name.localeCompare(b.name)));
      if (ownerPatient?.id === data.id) setOwnerPatient(data);
      if (selectedPatient?.id === data.id) setSelectedPatient(data);
    }
    setSaving(false);
    closeSheet();
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
    setDeleting(null);
    closeSheet();
  };

  const addTemplate = async () => {
    if (!newTemplate.title) return;
    setSaving(true);
    const { data, error } = await supabase.from("exercise_templates").insert({
      ...newTemplate,
      instructions: newTemplate.instructions.filter(Boolean)
    }).select().single();
    if (!error && data) setTemplates(prev => [...prev, data]);
    setSaving(false);
    setNewTemplate(EMPTY_TEMPLATE);
    closeSheet();
  };

  const closeSheet = () => { setSheet(null); setSheetData(null); setSelectedTemplate(null); setAssignFilterCats([]); setAssignFilterRegions([]); setDuration(""); };

  const ownerExercises = ownerPatient ? exForPatient(ownerPatient.id) : [];
  const doneCount = ownerExercises.filter(e => isDone(e.id)).length;
  const totalCount = ownerExercises.length;
  const progress = totalCount > 0 ? (doneCount / totalCount) * 100 : 0;
  const allDone = totalCount > 0 && doneCount === totalCount;

  const filteredOwnerExercises = ownerExercises.filter(ex => {
    const catOk = filterCategories.length === 0 || (ex.categories || []).some(c => filterCategories.includes(c));
    const regOk = filterRegions.length === 0 || (ex.target_regions || []).some(r => filterRegions.includes(r));
    return catOk && regOk;
  });

  const filteredTemplates = templates.filter(t2 => {
    const catOk = assignFilterCats.length === 0 || (t2.categories || []).some(c => assignFilterCats.includes(c));
    const regOk = assignFilterRegions.length === 0 || (t2.target_regions || []).some(r => assignFilterRegions.includes(r));
    return catOk && regOk;
  });

  const patientLabel = (p) => `${p.avatar || ""} ${p.name} - ${p.breed} - ${p.owner}`.trim();

  const inputStyle = { width: "100%", padding: "11px 14px", borderRadius: 10, border: "1.5px solid #B8DFE0", fontSize: 14, fontFamily: "'DM Sans',sans-serif", outline: "none", background: "white", color: "#102828" };
  const secLabel = (text) => <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 700, color: "#3D7070", letterSpacing: ".7px", textTransform: "uppercase", marginBottom: 7 }}>{text}</div>;

  const InfoCard = ({ icon, title, text, items }) => (
    <div className="card" style={{ padding: "18px 20px", textAlign: "left" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <div style={{ width: 34, height: 34, borderRadius: 9, background: BRAND + "18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon name={icon} size={18} color={BRAND} />
        </div>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 15, fontWeight: 700, color: "#102828", textAlign: "left" }}>{title}</div>
      </div>
      {text && <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: "#3D6060", lineHeight: 1.65, textAlign: "left" }}>{text}</div>}
      {items && (
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          {items.map((item, j) => (
            <div key={j} style={{ display: "flex", gap: 9, alignItems: "flex-start", textAlign: "left" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: BRAND, flexShrink: 0, marginTop: 4 }} />
              <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: "#3D6060", lineHeight: 1.55, textAlign: "left", flex: 1 }}>{item}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (loading) return (
    <div style={{ minHeight: "100vh", background: LIGHT, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12 }}>
      <Icon name="paw" size={48} color={BRAND} />
      <div style={{ fontFamily: "'DM Sans',sans-serif", color: "#3D7070", fontSize: 15 }}>Wird geladen...</div>
    </div>
  );

  return (
    <div style={{ fontFamily: "Georgia,serif", minHeight: "100vh", background: LIGHT, color: "#102828" }} onClick={() => setLangOpen(false)}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@300;400;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .btn { cursor: pointer; border: none; transition: all 0.18s; background: none; }
        .btn:hover { opacity: .85; transform: translateY(-1px); }
        .card { background: white; border-radius: 18px; box-shadow: 0 2px 16px rgba(95,184,185,0.12); text-align: left; }
        .ex-card { transition: all 0.18s; cursor: pointer; }
        .ex-card:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(95,184,185,0.20); }
        .tag { display: inline-block; padding: 3px 9px; border-radius: 20px; font-size: 11px; font-weight: 600; font-family: 'DM Sans',sans-serif; }
        input,textarea,select { font-family: 'DM Sans',sans-serif; outline: none; }
        input:focus,textarea:focus,select:focus { border-color: ${BRAND} !important; box-shadow: 0 0 0 3px rgba(95,184,185,0.15); }
        .scroll-x { overflow-x: auto; scrollbar-width: none; }
        .scroll-x::-webkit-scrollbar { display: none; }
        .overlay { position: fixed; inset: 0; background: rgba(16,40,40,0.55); z-index: 100; display: flex; align-items: flex-end; justify-content: center; }
        .sheet { background: white; border-radius: 24px 24px 0 0; width: 100%; max-width: 480px; max-height: 93vh; overflow-y: auto; padding: 26px 22px 44px; }
        .pbar { height: 8px; background: rgba(255,255,255,0.2); border-radius: 99px; overflow: hidden; }
        .pfill { height: 100%; border-radius: 99px; background: linear-gradient(90deg,#8FD4D5,#ffffff88); transition: width .6s ease; }
        .nav-tab { padding: 9px 0; border-radius: 0; font-size: 12px; font-weight: 600; cursor: pointer; font-family: 'DM Sans',sans-serif; border: none; transition: all .18s; flex: 1; display: flex; align-items: center; justify-content: center; gap: 5px; }
        select { appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%233D7070' d='M6 8L1 3h10z'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 14px center; padding-right: 36px !important; }
        .tmpl-row { padding: 10px 12px; border-radius: 11px; cursor: pointer; border: 2px solid transparent; display: flex; align-items: center; gap: 10px; transition: all .15s; }
        .tmpl-row:hover { background: ${LIGHT}; }
        .tmpl-row.sel { border-color: ${BRAND}; background: ${LIGHT}; }
        .icon-btn { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; cursor: pointer; border: none; transition: all .18s; flex-shrink: 0; }
        .icon-btn:hover { opacity: .85; transform: translateY(-1px); }
      `}</style>

      {/* ── HEADER ── */}
      <div style={{ background: DARK, position: "sticky", top: 0, zIndex: 20 }}>
        <div style={{ maxWidth: 480, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px 10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <img src={LOGO_URL} alt="FitFunDog" style={{ height: 40, objectFit: "contain" }} />
              <div>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 16, fontWeight: 700, color: "#E6F6F6", lineHeight: 1.1 }}>Fit Fun Dog</div>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, color: ACCENT, letterSpacing: "0.5px", marginTop: 1 }}>Tierphysiotherapie & Osteopathie</div>
              </div>
            </div>
            {/* Language dropdown */}
            <div style={{ position: "relative" }} onClick={e => e.stopPropagation()}>
              <button className="btn" onClick={() => setLangOpen(o => !o)}
                style={{ display: "flex", alignItems: "center", gap: 6, background: "#2A6364", borderRadius: 10, padding: "8px 12px", color: "#E6F6F6", fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 600 }}>
                <Icon name="lang" size={16} color={ACCENT} />
                <span>{t.langLabel}</span>
                <Icon name="chevdown" size={14} color={ACCENT} />
              </button>
              {langOpen && (
                <div style={{ position: "absolute", right: 0, top: "calc(100% + 6px)", background: "white", borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.15)", overflow: "hidden", minWidth: 130, zIndex: 50 }}>
                  {[["de","🇩🇪 Deutsch"],["en","🇬🇧 English"],["es","🇪🇸 Español"]].map(([l, label]) => (
                    <button key={l} className="btn" onClick={() => { setLang(l); setLangOpen(false); setFilterCategories([]); setFilterRegions([]); }}
                      style={{ width: "100%", padding: "11px 16px", textAlign: "left", fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: l === lang ? 700 : 400, color: l === lang ? BRAND : "#102828", background: l === lang ? LIGHT : "white", display: "block" }}>
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          {/* Nav tabs */}
          <div style={{ display: "flex", background: "#2A6364" }}>
            {[["owner","owner",t.navOwner],["therapist","practice",t.navTherapist],["info","info",t.navInfo]].map(([v, ic, lb]) => (
              <button key={v} className="nav-tab" onClick={() => setView(v)}
                style={{ background: view === v ? "white" : "transparent", color: view === v ? DARK : ACCENT, borderRadius: view === v ? "10px 10px 0 0" : 0, marginTop: view === v ? 3 : 0 }}>
                <Icon name={ic} size={15} color={view === v ? DARK : ACCENT} />
                {lb}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ══ OWNER VIEW ══ */}
      {view === "owner" && (
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "18px 16px 80px" }}>
          {patients.length > 1 && (
            <div style={{ marginBottom: 14 }}>
              <select value={ownerPatient?.id || ""} onChange={e => { setOwnerPatient(patients.find(p => p.id === e.target.value) || null); setFilterCategories([]); setFilterRegions([]); }} style={{ ...inputStyle, borderRadius: 12 }}>
                {patients.map(p => <option key={p.id} value={p.id}>{patientLabel(p)}</option>)}
              </select>
            </div>
          )}

          {!ownerPatient ? (
            <div className="card" style={{ padding: 28, textAlign: "center", color: "#3D7070" }}>
              <div style={{ marginBottom: 10, display: "flex", justifyContent: "center" }}><Icon name="patient" size={44} color={ACCENT} /></div>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 15, fontWeight: 600 }}>{t.noPatient}</div>
            </div>
          ) : (<>
            <div style={{ padding: "20px 22px", marginBottom: 16, background: `linear-gradient(135deg, ${DARK} 0%, ${BRAND} 100%)`, color: "#E6F6F6", borderRadius: 18, boxShadow: "0 4px 24px rgba(95,184,185,0.32)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: "#B8E8E8", letterSpacing: "1px", textTransform: "uppercase", marginBottom: 3 }}>{t.progress}</div>
                  <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 38, fontWeight: 700, lineHeight: 1 }}>{doneCount}/{totalCount}</div>
                  <div style={{ fontSize: 13, color: allDone ? "white" : "#B8E8E8", fontFamily: "'DM Sans',sans-serif", marginTop: 5, fontWeight: allDone ? 700 : 400 }}>
                    {allDone ? `🎉 ${t.allDone(ownerPatient.name)}` : t.exercisesDone}
                  </div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: ownerPatient.avatar?.length <= 2 ? 50 : 30, lineHeight: 1 }}>{ownerPatient.avatar || "🐕"}</div>
                  <div style={{ fontSize: 11, color: "#B8E8E8", marginTop: 4, fontFamily: "'DM Sans',sans-serif" }}>{ownerPatient.name}</div>
                </div>
              </div>
              <div className="pbar" style={{ marginTop: 16 }}><div className="pfill" style={{ width: `${progress}%` }} /></div>
            </div>

            {/* Filters - compact dropdowns */}
            <div style={{ display: "flex", gap: 8, marginBottom: 14 }} onClick={() => {}}>
              <FilterDropdown label={t.filterCategory} icon="filter" options={CATEGORIES} selected={filterCategories} onChange={setFilterCategories} color={BRAND} />
              <FilterDropdown label={t.filterRegion} icon="target" options={TARGET_REGIONS} selected={filterRegions} onChange={setFilterRegions} color={MID} />
            </div>

            {filteredOwnerExercises.length === 0 && (
              <div className="card" style={{ padding: 22, textAlign: "center", color: "#3D7070", fontFamily: "'DM Sans',sans-serif", fontSize: 14 }}>{t.noExercises}</div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
              {filteredOwnerExercises.map(ex => {
                const done = isDone(ex.id);
                return (
                  <div key={ex.id} className="card ex-card" onClick={() => setSelectedExercise(ex)}
                    style={{ padding: "15px", display: "flex", gap: 13, alignItems: "center", opacity: done ? 0.62 : 1 }}>
                    {ex.image_url
                      ? <img src={ex.image_url} alt={ex.title} style={{ width: 54, height: 54, borderRadius: 13, objectFit: "contain", flexShrink: 0, background: LIGHT, padding: 2 }} />
                      : <div style={{ width: 54, height: 54, borderRadius: 13, background: BRAND + "18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name="paw" size={26} color={BRAND} /></div>}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 14, fontWeight: 600, lineHeight: 1.3, textDecoration: done ? "line-through" : "none", color: done ? ACCENT : "#102828" }}>{ex.title}</div>
                        <button className="btn" onClick={e => { e.stopPropagation(); toggleDone(ex.id); }}
                          style={{ width: 28, height: 28, borderRadius: "50%", border: `2px solid ${done ? BRAND : "#B8DFE0"}`, background: done ? BRAND : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          {done && <Icon name="check" size={14} color="white" />}
                        </button>
                      </div>
                      <div style={{ display: "flex", gap: 5, marginTop: 6, flexWrap: "wrap" }}>
                        {(ex.categories || []).slice(0,2).map(c => <span key={c} className="tag" style={{ background: BRAND + "20", color: BRAND }}>{c}</span>)}
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

      {/* ══ THERAPIST VIEW ══ */}
      {view === "therapist" && (
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "18px 16px 80px" }}>
          <div style={{ display: "flex", gap: 7, marginBottom: 14, flexWrap: "wrap" }}>
            <button className="btn" onClick={() => { setNewPatient(EMPTY_PATIENT); setSheet("addPatient"); }}
              style={{ background: BRAND, color: "#102828", borderRadius: 11, padding: "10px 14px", fontSize: 13, fontFamily: "'DM Sans',sans-serif", fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
              <Icon name="plus" size={15} color="#102828" /> {t.newPatient}
            </button>
            <button className="btn" onClick={() => { setNewTemplate(EMPTY_TEMPLATE); setSheet("addTemplate"); }}
              style={{ background: "white", color: DARK, borderRadius: 11, padding: "10px 14px", fontSize: 13, fontFamily: "'DM Sans',sans-serif", fontWeight: 700, border: `1.5px solid ${BRAND}`, display: "flex", alignItems: "center", gap: 6 }}>
              <Icon name="plus" size={15} color={DARK} /> {t.newExercise}
            </button>
            <button className="btn" onClick={() => setSheet("addExercise")}
              style={{ background: DARK, color: "#E6F6F6", borderRadius: 11, padding: "10px 14px", fontSize: 13, fontFamily: "'DM Sans',sans-serif", fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
              <Icon name="assign" size={15} color="#E6F6F6" /> {t.assignExercise}
            </button>
          </div>

          <div style={{ marginBottom: 14 }}>
            <select value={selectedPatient?.id || ""} onChange={e => setSelectedPatient(patients.find(p => p.id === e.target.value) || null)} style={{ ...inputStyle, borderRadius: 12 }}>
              <option value="">{t.selectPatient}</option>
              {patients.map(p => <option key={p.id} value={p.id}>{patientLabel(p)}</option>)}
            </select>
          </div>

          {!selectedPatient ? (
            <div className="card" style={{ padding: 24, textAlign: "center", color: "#3D7070" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}><Icon name="patient" size={40} color={ACCENT} /></div>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14 }}>{t.noPatientSelected}</div>
            </div>
          ) : (
            <div className="card" style={{ padding: 18 }}>
              <div style={{ display: "flex", gap: 13, alignItems: "center", marginBottom: 14, paddingBottom: 14, borderBottom: `1px solid ${LIGHT}` }}>
                <div style={{ width: 54, height: 54, borderRadius: 15, background: LIGHT, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, flexShrink: 0, border: "1.5px solid #B8DFE0" }}>{selectedPatient.avatar || "🐕"}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 17, fontWeight: 700 }}>{selectedPatient.name}</div>
                  <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: "#3D7070", marginTop: 1 }}>{selectedPatient.breed} · {selectedPatient.age}</div>
                  <div style={{ display: "flex", gap: 5, marginTop: 5, flexWrap: "wrap" }}>
                    <span className="tag" style={{ background: BRAND + "20", color: MID }}>{selectedPatient.condition}</span>
                    <span className="tag" style={{ background: LIGHT, color: "#3D7070" }}>👤 {selectedPatient.owner}</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button className="icon-btn" title={t.editPatient} onClick={() => { setEditPatientData({ ...selectedPatient }); setSheet("editPatient"); }}
                    style={{ background: BRAND + "20", color: MID }}>
                    <Icon name="edit" size={16} color={MID} />
                  </button>
                  <button className="icon-btn" title={t.deletePatient} onClick={() => { setSheetData(selectedPatient); setSheet("confirmDeletePt"); }}
                    style={{ background: "#FFE8E8", color: "#C0392B" }}>
                    <Icon name="trash" size={16} color="#C0392B" />
                  </button>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 700, color: "#3D7070", letterSpacing: ".7px", textTransform: "uppercase" }}>
                  {t.homeExercises(exForPatient(selectedPatient.id).length)}
                </div>
                <button className="icon-btn" onClick={() => setSheet("addExercise")} style={{ background: BRAND + "20", color: MID, fontSize: 20, fontWeight: 700 }}>
                  <Icon name="plus" size={18} color={MID} />
                </button>
              </div>

              {exForPatient(selectedPatient.id).length === 0 && (
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: ACCENT, textAlign: "center", padding: "14px 0" }}>{t.noExercisesYet}</div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {exForPatient(selectedPatient.id).map(ex => (
                  <div key={ex.id} style={{ background: PALE, borderRadius: 11, padding: "11px 13px", display: "flex", gap: 10, alignItems: "center" }}>
                    {ex.image_url
                      ? <img src={ex.image_url} alt={ex.title} style={{ width: 42, height: 42, borderRadius: 9, objectFit: "contain", flexShrink: 0, background: LIGHT, cursor: "pointer", padding: 2 }} onClick={() => setSelectedExercise(ex)} />
                      : <div style={{ width: 42, height: 42, borderRadius: 9, background: LIGHT, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: "pointer" }} onClick={() => setSelectedExercise(ex)}><Icon name="paw" size={20} color={ACCENT} /></div>}
                    <div style={{ flex: 1, cursor: "pointer", minWidth: 0 }} onClick={() => setSelectedExercise(ex)}>
                      <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ex.title}</div>
                      <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: "#3D7070", marginTop: 2 }}>⏱ {ex.duration}</div>
                    </div>
                    <button className="icon-btn" onClick={() => { setSheetData(ex); setSheet("confirmDeleteEx"); }} style={{ background: "#FFE8E8" }}>
                      <Icon name="trash" size={16} color="#C0392B" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ INFO VIEW ══ */}
      {view === "info" && (
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "18px 16px 80px" }}>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, marginBottom: 4 }}>{t.tipsTitle}</div>
          <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: "#3D7070", marginBottom: 16 }}>{t.tipsSub}</div>
          <div style={{ display: "flex", gap: 7, marginBottom: 18, background: "white", borderRadius: 14, padding: 5, boxShadow: "0 2px 12px rgba(95,184,185,0.10)" }}>
            {[["tips","tip",t.tabTips],["pause","rest",t.tabPause]].map(([tab, ic, label]) => (
              <button key={tab} className="btn" onClick={() => setInfoTab(tab)}
                style={{ flex: 1, padding: "10px 8px", borderRadius: 10, background: infoTab === tab ? BRAND : "transparent", color: infoTab === tab ? "#102828" : "#3D7070", fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <Icon name={ic} size={15} color={infoTab === tab ? "#102828" : "#3D7070"} /> {label}
              </button>
            ))}
          </div>

          {infoTab === "tips" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {TIPS_DATA[lang].map((tip, i) => <InfoCard key={i} {...tip} />)}
            </div>
          )}

          {infoTab === "pause" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <InfoCard icon="rest" title={t.pauseHero} text={t.pauseHeroText} />
              {PAUSE_DATA[lang].map((sec, i) => <InfoCard key={i} {...sec} />)}
            </div>
          )}
        </div>
      )}

      {/* ══ EXERCISE DETAIL SHEET ══ */}
      {selectedExercise && (
        <div className="overlay" onClick={() => setSelectedExercise(null)}>
          <div className="sheet" onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
                  {(selectedExercise.categories || []).map(c => <span key={c} className="tag" style={{ background: BRAND + "20", color: BRAND }}>{c}</span>)}
                  <span className="tag" style={{ background: (difficultyColor[selectedExercise.difficulty] || BRAND) + "20", color: difficultyColor[selectedExercise.difficulty] || BRAND }}>{selectedExercise.difficulty}</span>
                </div>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 21, fontWeight: 700, lineHeight: 1.2 }}>{selectedExercise.title}</div>
                {(selectedExercise.target_regions || []).length > 0 && (
                  <div style={{ display: "flex", gap: 5, marginTop: 6, flexWrap: "wrap" }}>
                    {selectedExercise.target_regions.map(r => <span key={r} className="tag" style={{ background: MID + "20", color: MID }}>{r}</span>)}
                  </div>
                )}
              </div>
              <button className="btn" onClick={() => setSelectedExercise(null)}
                style={{ background: LIGHT, borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginLeft: 10 }}>
                <Icon name="close" size={14} color="#3D7070" />
              </button>
            </div>

            {selectedExercise.image_url ? (
              <div style={{ width: "100%", borderRadius: 15, overflow: "hidden", marginBottom: 18, background: LIGHT, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <img src={selectedExercise.image_url} alt={selectedExercise.title} style={{ width: "100%", height: "auto", maxHeight: 280, objectFit: "contain", display: "block" }} />
              </div>
            ) : (
              <div style={{ background: LIGHT, borderRadius: 15, height: 120, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
                <Icon name="paw" size={52} color={ACCENT} />
              </div>
            )}

            <div style={{ display: "flex", gap: 9, marginBottom: 18 }}>
              <div style={{ flex: 1, background: PALE, borderRadius: 11, padding: "13px", textAlign: "center" }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 4 }}><Icon name="clock" size={20} color={BRAND} /></div>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 600 }}>{selectedExercise.duration}</div>
              </div>
              {selectedExercise.video_url && (
                <a href={selectedExercise.video_url} target="_blank" rel="noreferrer"
                  style={{ flex: 1, background: BRAND + "12", borderRadius: 11, padding: "13px", textAlign: "center", textDecoration: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, border: `1.5px solid ${BRAND}30` }}>
                  <Icon name="play" size={20} color={MID} />
                  <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 600, color: MID }}>{t.watchVideo}</div>
                </a>
              )}
            </div>

            {selectedExercise.description && (
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 14, fontWeight: 700, marginBottom: 7 }}>{t.description}</div>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: DARK, lineHeight: 1.7 }}>{selectedExercise.description}</div>
              </div>
            )}

            {selectedExercise.instructions?.length > 0 && (
              <div style={{ marginBottom: 22 }}>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 14, fontWeight: 700, marginBottom: 10 }}>{t.step}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                  {selectedExercise.instructions.map((step, i) => (
                    <div key={i} style={{ display: "flex", gap: 11, alignItems: "flex-start" }}>
                      <div style={{ width: 24, height: 24, borderRadius: "50%", background: BRAND, color: "#102828", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontFamily: "'DM Sans',sans-serif", fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
                      <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: DARK, lineHeight: 1.6, paddingTop: 3 }}>{step}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {view === "owner" && (
              <button className="btn" onClick={() => { toggleDone(selectedExercise.id); setSelectedExercise(null); }}
                style={{ width: "100%", padding: "15px", borderRadius: 13, background: isDone(selectedExercise.id) ? LIGHT : BRAND, color: isDone(selectedExercise.id) ? "#3D7070" : "#102828", fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: 15 }}>
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
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 19, fontWeight: 700 }}>{t.assignExercise}</div>
              <button className="btn" onClick={closeSheet} style={{ background: LIGHT, borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="close" size={14} color="#3D7070" /></button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
              <div>
                {secLabel(t.step1)}
                <select value={selectedPatient?.id || ""} onChange={e => setSelectedPatient(patients.find(p => p.id === e.target.value) || null)} style={inputStyle}>
                  <option value="">{t.selectPatient}</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{patientLabel(p)}</option>)}
                </select>
              </div>
              <div>
                {secLabel(t.step2)}
                <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                  <FilterDropdown label={t.filterCategory} icon="filter" options={CATEGORIES} selected={assignFilterCats} onChange={setAssignFilterCats} color={BRAND} />
                  <FilterDropdown label={t.filterRegion} icon="target" options={TARGET_REGIONS} selected={assignFilterRegions} onChange={setAssignFilterRegions} color={MID} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 5, maxHeight: 220, overflowY: "auto", border: `1px solid ${LIGHT}`, borderRadius: 12, padding: 6 }}>
                  {filteredTemplates.map(tmpl => (
                    <div key={tmpl.id} className={"tmpl-row" + (selectedTemplate?.id === tmpl.id ? " sel" : "")} onClick={() => setSelectedTemplate(selectedTemplate?.id === tmpl.id ? null : tmpl)}>
                      {tmpl.image_url
                        ? <img src={tmpl.image_url} alt={tmpl.title} style={{ width: 38, height: 38, borderRadius: 8, objectFit: "contain", flexShrink: 0, background: LIGHT, padding: 2 }} />
                        : <div style={{ width: 38, height: 38, borderRadius: 8, background: LIGHT, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name="paw" size={18} color={ACCENT} /></div>}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 13, fontWeight: 600 }}>{tmpl.title}</div>
                        <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: "#3D7070", marginTop: 1 }}>{(tmpl.categories || []).join(", ")} · {tmpl.difficulty}</div>
                      </div>
                      {selectedTemplate?.id === tmpl.id && <Icon name="check" size={16} color={BRAND} />}
                    </div>
                  ))}
                  {filteredTemplates.length === 0 && <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: ACCENT, textAlign: "center", padding: "12px 0" }}>{t.noCategoryEx}</div>}
                </div>
              </div>
              <div>
                {secLabel(t.step3)}
                <input value={duration} onChange={e => setDuration(e.target.value)} placeholder={t.freqPh} style={inputStyle} />
              </div>
              <button className="btn" onClick={addExercise} disabled={saving}
                style={{ width: "100%", padding: "15px", borderRadius: 13, background: selectedTemplate && selectedPatient && duration ? BRAND : "#B8DFE0", color: selectedTemplate && selectedPatient && duration ? "#102828" : "#7ECBCC", fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: 15 }}>
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
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 19, fontWeight: 700 }}>{t.newPatient}</div>
              <button className="btn" onClick={closeSheet} style={{ background: LIGHT, borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="close" size={14} color="#3D7070" /></button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[[t.dogName,"name","Bello"],[t.breed,"breed","Labrador Retriever"],[t.age,"age","7 Jahre"],[t.owner,"owner","Familie Müller"],[t.condition,"condition","Hüftdysplasie"]].map(([label, key, ph]) => (
                <div key={key}>{secLabel(label)}<input value={newPatient[key]} onChange={e => setNewPatient(p => ({ ...p, [key]: e.target.value }))} placeholder={ph} style={inputStyle} /></div>
              ))}
              <div>{secLabel(t.emoji)}<input value={newPatient.avatar} onChange={e => setNewPatient(p => ({ ...p, avatar: e.target.value }))} placeholder="🐕" style={{ ...inputStyle, width: 60, textAlign: "center", fontSize: 20 }} /></div>
              <button className="btn" onClick={addPatient} disabled={saving || !newPatient.name}
                style={{ width: "100%", padding: "15px", borderRadius: 13, background: newPatient.name ? BRAND : "#B8DFE0", color: newPatient.name ? "#102828" : "#7ECBCC", fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: 15, marginTop: 4 }}>
                {saving ? t.saving : t.createPatient}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ SHEET: EDIT PATIENT ══ */}
      {sheet === "editPatient" && editPatientData && (
        <div className="overlay" onClick={closeSheet}>
          <div className="sheet" onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 19, fontWeight: 700 }}>{t.editPatient}</div>
              <button className="btn" onClick={closeSheet} style={{ background: LIGHT, borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="close" size={14} color="#3D7070" /></button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[[t.dogName,"name"],[t.breed,"breed"],[t.age,"age"],[t.owner,"owner"],[t.condition,"condition"]].map(([label, key]) => (
                <div key={key}>{secLabel(label)}<input value={editPatientData[key] || ""} onChange={e => setEditPatientData(p => ({ ...p, [key]: e.target.value }))} style={inputStyle} /></div>
              ))}
              <div>{secLabel(t.emoji)}<input value={editPatientData.avatar || ""} onChange={e => setEditPatientData(p => ({ ...p, avatar: e.target.value }))} style={{ ...inputStyle, width: 60, textAlign: "center", fontSize: 20 }} /></div>
              <button className="btn" onClick={updatePatient} disabled={saving || !editPatientData.name}
                style={{ width: "100%", padding: "15px", borderRadius: 13, background: editPatientData.name ? BRAND : "#B8DFE0", color: editPatientData.name ? "#102828" : "#7ECBCC", fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: 15, marginTop: 4 }}>
                {saving ? t.saving : t.saveChanges}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ SHEET: ADD TEMPLATE ══ */}
      {sheet === "addTemplate" && (
        <div className="overlay" onClick={closeSheet}>
          <div className="sheet" onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 19, fontWeight: 700 }}>{t.newExercise}</div>
              <button className="btn" onClick={closeSheet} style={{ background: LIGHT, borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="close" size={14} color="#3D7070" /></button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>{secLabel(t.titleLabel)}<input value={newTemplate.title} onChange={e => setNewTemplate(p => ({ ...p, title: e.target.value }))} placeholder="z.B. Cavaletti-Stangen" style={inputStyle} /></div>
              <div>
                {secLabel(t.category)}
                <MultiSelect options={CATEGORIES} selected={newTemplate.categories} onChange={v => setNewTemplate(p => ({ ...p, categories: v }))} color={BRAND} />
              </div>
              <div>
                {secLabel(t.targetRegion)}
                <MultiSelect options={TARGET_REGIONS} selected={newTemplate.target_regions} onChange={v => setNewTemplate(p => ({ ...p, target_regions: v }))} color={MID} />
              </div>
              <div>
                {secLabel(t.difficulty)}
                <select value={newTemplate.difficulty} onChange={e => setNewTemplate(p => ({ ...p, difficulty: e.target.value }))} style={inputStyle}>
                  {["Leicht","Mittel","Schwer"].map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div>{secLabel(t.descLabel)}<textarea value={newTemplate.description} onChange={e => setNewTemplate(p => ({ ...p, description: e.target.value }))} placeholder="Kurze Erklärung..." rows={3} style={{ ...inputStyle, resize: "vertical" }} /></div>
              <div>
                {secLabel(t.stepsLabel)}
                {newTemplate.instructions.map((s, i) => (
                  <input key={i} value={s} onChange={e => setNewTemplate(p => ({ ...p, instructions: p.instructions.map((x, j) => j === i ? e.target.value : x) }))}
                    placeholder={`Schritt ${i + 1}...`} style={{ ...inputStyle, marginBottom: 6 }} />
                ))}
              </div>
              <div>{secLabel(t.imageUrl)}<input value={newTemplate.image_url} onChange={e => setNewTemplate(p => ({ ...p, image_url: e.target.value }))} placeholder="https://..." style={inputStyle} /></div>
              <div>{secLabel(t.videoUrl)}<input value={newTemplate.video_url} onChange={e => setNewTemplate(p => ({ ...p, video_url: e.target.value }))} placeholder="https://youtube.com/..." style={inputStyle} /></div>
              <button className="btn" onClick={addTemplate} disabled={saving || !newTemplate.title}
                style={{ width: "100%", padding: "15px", borderRadius: 13, background: newTemplate.title ? BRAND : "#B8DFE0", color: newTemplate.title ? "#102828" : "#7ECBCC", fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: 15, marginTop: 4 }}>
                {saving ? t.saving : t.saveExercise}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ CONFIRM DELETE EXERCISE ══ */}
      {sheet === "confirmDeleteEx" && sheetData && (
        <div className="overlay" onClick={closeSheet}>
          <div className="sheet" onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}><Icon name="trash" size={40} color="#C0392B" /></div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 19, fontWeight: 700, marginBottom: 8, textAlign: "center" }}>{t.deleteExercise}</div>
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: "#3D7070", marginBottom: 22, lineHeight: 1.6, textAlign: "center" }}>{t.deleteExerciseMsg(sheetData.title)}</div>
            <div style={{ display: "flex", gap: 9 }}>
              <button className="btn" onClick={closeSheet} style={{ flex: 1, padding: "14px", borderRadius: 12, background: LIGHT, color: "#3D7070", fontFamily: "'DM Sans',sans-serif", fontWeight: 700 }}>{t.cancel}</button>
              <button className="btn" onClick={() => deleteExercise(sheetData.id)} style={{ flex: 1, padding: "14px", borderRadius: 12, background: "#C0392B", color: "white", fontFamily: "'DM Sans',sans-serif", fontWeight: 700 }}>
                {deleting ? "..." : t.remove}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ CONFIRM DELETE PATIENT ══ */}
      {sheet === "confirmDeletePt" && sheetData && (
        <div className="overlay" onClick={closeSheet}>
          <div className="sheet" onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}><Icon name="trash" size={40} color="#C0392B" /></div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 19, fontWeight: 700, marginBottom: 8, textAlign: "center" }}>{t.deletePatient}</div>
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: "#3D7070", marginBottom: 22, lineHeight: 1.6, textAlign: "center" }}>{t.deletePatientMsg(sheetData.name)}</div>
            <div style={{ display: "flex", gap: 9 }}>
              <button className="btn" onClick={closeSheet} style={{ flex: 1, padding: "14px", borderRadius: 12, background: LIGHT, color: "#3D7070", fontFamily: "'DM Sans',sans-serif", fontWeight: 700 }}>{t.cancel}</button>
              <button className="btn" onClick={() => deletePatient(sheetData.id)} style={{ flex: 1, padding: "14px", borderRadius: 12, background: "#C0392B", color: "white", fontFamily: "'DM Sans',sans-serif", fontWeight: 700 }}>
                {deleting ? "..." : t.delete}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
