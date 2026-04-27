// Supabase Edge Function: squarespace-webhook
// Empfängt Ersttermin-Webhooks von Squarespace Scheduling,
// legt den Besitzer als Auth-User an und erstellt den Patienten-Eintrag.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ── Feldnamen aus dem Squarespace Scheduling Webhook ──────────────────────────
// Squarespace sendet diese Felder bei einem neuen Termin.
// Die benutzerdefinierten Felder (Tiername, Rasse etc.) kommen als Array
// in "formResponses" oder "fields" – passe die Schlüssel unten an,
// sobald du den ersten echten Webhook-Payload gesehen hast.

const FIELD_MAP = {
  ownerFirstName: "firstName",      // Standard-Feld Squarespace
  ownerLastName:  "lastName",       // Standard-Feld Squarespace
  email:          "email",          // Standard-Feld Squarespace
  phone:          "phone",          // Standard-Feld Squarespace (optional)
  // Benutzerdefinierte Felder – exakte Labels aus dem Squarespace Fragebogen:
  petName:        "Tiername",
  breed:          "Rasse des Tieres",
  age:            "Alter des Tieres",
  condition:      "Beschwerden",    // optional-Feld
};

Deno.serve(async (req) => {
  // ── CORS für lokale Tests ──
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, content-type, x-webhook-secret",
      },
    });
  }

  // ── Optionaler Webhook-Secret-Check ───────────────────────────────────────
  // In Supabase unter Project Settings → Edge Functions → Secrets
  // den Key SQUARESPACE_WEBHOOK_SECRET setzen und in Squarespace denselben
  // Wert als "Signing secret" eintragen.
  const secret = Deno.env.get("SQUARESPACE_WEBHOOK_SECRET");
  if (secret) {
    const incomingSecret = req.headers.get("x-webhook-secret");
    if (incomingSecret !== secret) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }
  }

  // ── Payload parsen (JSON oder form-urlencoded) ───────────────────────────
  let data: Record<string, unknown> = {};
  const contentType = req.headers.get("content-type") ?? "";
  try {
    if (contentType.includes("application/json")) {
      const payload = await req.json();
      data = (payload.data ?? payload) as Record<string, unknown>;
    } else {
      // Acuity schickt application/x-www-form-urlencoded
      const text = await req.text();
      console.log("Raw webhook payload:", text);
      const params = new URLSearchParams(text);
      params.forEach((value, key) => { data[key] = value; });
    }
  } catch (e) {
    console.error("Payload parse error:", e);
    return new Response(JSON.stringify({ error: "Invalid payload" }), { status: 400 });
  }
  console.log("Parsed data:", JSON.stringify(data));

  // ── Nur Erstttermine verarbeiten ──────────────────────────────────────────
  const ERSTTERMIN_NAMES = [
    "Befunderhebung + Erstbehandlung",
    "Diagnostic survey + initial treatment",
  ];
  const appointmentTypeName = String(data.appointmentTypeName ?? data.type ?? "").trim();
  const isErsttermin = ERSTTERMIN_NAMES.some(n =>
    appointmentTypeName.toLowerCase().includes(n.toLowerCase())
  );
  if (!isErsttermin) {
    console.log(`Folgetermin erkannt (${appointmentTypeName}) – kein Eintrag angelegt.`);
    return new Response(JSON.stringify({ ok: true, message: "Folgetermin – ignoriert" }), { status: 200 });
  }
  console.log(`Ersttermin erkannt: ${appointmentTypeName}`);

  // ── Standardfelder auslesen ───────────────────────────────────────────────
  const firstName = String(data[FIELD_MAP.ownerFirstName] ?? "").trim();
  const lastName  = String(data[FIELD_MAP.ownerLastName]  ?? "").trim();
  const email     = String(data[FIELD_MAP.email]          ?? "").trim().toLowerCase();

  if (!email) {
    return new Response(JSON.stringify({ error: "Keine Email im Payload" }), { status: 400 });
  }

  const ownerName = [firstName, lastName].filter(Boolean).join(" ");

  // ── Benutzerdefinierte Felder auslesen ────────────────────────────────────
  // Squarespace Scheduling speichert Custom Fields in:
  //   data.formResponses (Array von { label, value })
  // oder in manchen Versionen direkt als flache Keys.
  const customFields = extractCustomFields(data);

  const petName   = customFields[FIELD_MAP.petName]   ?? "";
  const breed     = customFields[FIELD_MAP.breed]     ?? "";
  const age       = customFields[FIELD_MAP.age]       ?? "";
  const condition = customFields[FIELD_MAP.condition] ?? "";

  // ── Supabase Admin-Client ─────────────────────────────────────────────────
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // ── 1. Prüfen ob User bereits existiert ──────────────────────────────────
  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  const existingUser = existingUsers?.users?.find((u) => u.email === email);

  let userId: string;

  if (existingUser) {
    // User existiert bereits → nur userId merken
    userId = existingUser.id;
    console.log(`User existiert bereits: ${email}`);
  } else {
    // ── 2. Neuen Auth-User anlegen (Passwort = Email-Adresse) ────────────
    // Beim ersten Login wird der User in der App aufgefordert,
    // sein Passwort zu ändern (must_change_password: true).
    const { data: createData, error: createError } = await supabase.auth.admin.createUser({
      email,
      password: email,
      email_confirm: true,
      user_metadata: {
        display_name: ownerName,
        must_change_password: true,
      },
    });

    if (createError || !createData?.user) {
      console.error("User-Fehler:", createError);
      return new Response(
        JSON.stringify({ error: "User konnte nicht angelegt werden", detail: createError?.message }),
        { status: 500 }
      );
    }

    userId = createData.user.id;
    console.log(`Neuer User angelegt: ${email} — Passwort = Email-Adresse`);
  }

  // ── 3. Prüfen ob Patient bereits existiert (Doppelbuchung vermeiden) ─────
  if (petName) {
    const { data: existingPatient } = await supabase
      .from("patients")
      .select("id")
      .eq("user_id", userId)
      .eq("name", petName)
      .maybeSingle();

    if (existingPatient) {
      console.log(`Patient ${petName} für ${email} existiert bereits – kein Duplikat angelegt.`);
      return new Response(
        JSON.stringify({ ok: true, message: "User existiert, Patient bereits vorhanden" }),
        { status: 200 }
      );
    }
  }

  // ── 4. Patient anlegen ────────────────────────────────────────────────────
  const { error: patientError } = await supabase.from("patients").insert({
    name:      petName   || "Unbekannt",
    owner:     ownerName || email,
    user_id:   userId,
    breed:     breed     || null,
    age:       age       || null,
    condition: condition || null,
  });

  if (patientError) {
    console.error("Patient-Insert-Fehler:", patientError);
    return new Response(
      JSON.stringify({ error: "Patient konnte nicht angelegt werden", detail: patientError.message }),
      { status: 500 }
    );
  }

  console.log(`Patient "${petName}" für ${ownerName} (${email}) erfolgreich angelegt.`);
  return new Response(
    JSON.stringify({ ok: true, message: `Patient ${petName} für ${ownerName} angelegt` }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
});

// ── Helper: Custom Fields aus verschiedenen Payload-Strukturen extrahieren ──
function extractCustomFields(data: Record<string, unknown>): Record<string, string> {
  const result: Record<string, string> = {};

  // Variante A: formResponses ist ein Array von { label, value }
  if (Array.isArray(data.formResponses)) {
    for (const field of data.formResponses as { label?: string; value?: unknown }[]) {
      if (field.label) result[field.label] = String(field.value ?? "").trim();
    }
    return result;
  }

  // Variante B: fields ist ein Array
  if (Array.isArray(data.fields)) {
    for (const field of data.fields as { label?: string; value?: unknown }[]) {
      if (field.label) result[field.label] = String(field.value ?? "").trim();
    }
    return result;
  }

  // Variante C: flache Keys direkt auf data (manche Squarespace-Versionen)
  return data as Record<string, string>;
}
