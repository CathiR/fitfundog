import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as webpush from "jsr:@negrel/webpush";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!;
const VAPID_SUBJECT = "mailto:fitfundog@freenet.de";

function base64UrlDecode(str: string): Uint8Array {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  const bin = atob(str);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

function toB64url(b: Uint8Array): string {
  return btoa(String.fromCharCode(...b)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

// VAPID-CryptoKeyPair aus den vorhandenen Secrets ableiten
// (Public: 65-Byte uncompressed Point base64url, Private: d-Wert base64url)
async function buildVapidKeys(): Promise<CryptoKeyPair> {
  const raw = base64UrlDecode(VAPID_PUBLIC_KEY); // 0x04 + x(32) + y(32)
  const x = toB64url(raw.slice(1, 33));
  const y = toB64url(raw.slice(33, 65));
  const publicKey = await crypto.subtle.importKey(
    "raw", raw, { name: "ECDSA", namedCurve: "P-256" }, true, ["verify"],
  );
  const privateKey = await crypto.subtle.importKey(
    "jwk",
    { kty: "EC", crv: "P-256", d: VAPID_PRIVATE_KEY, x, y, ext: true },
    { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"],
  );
  return { publicKey, privateKey };
}

Deno.serve(async (_req) => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const nowUtc = new Date();
  const errors: string[] = [];
  let sent = 0;

  const { data: subs } = await supabase.from("push_subscriptions").select("*");
  console.log(`send-reminders: ${subs?.length ?? 0} subscriptions, utc=${nowUtc.toISOString()}`);
  if (!subs?.length) return new Response(JSON.stringify({ sent: 0 }), { status: 200 });

  // ApplicationServer pro Aufruf neu erstellen -> frisches ECDH-Keypaar (RFC 8291)
  const vapidKeys = await buildVapidKeys();
  const appServer = await webpush.ApplicationServer.new({
    contactInformation: VAPID_SUBJECT,
    vapidKeys,
  });

  for (const sub of subs) {
    try {
      // Aktuelle Zeit in der Zeitzone des Users
      const userNow = new Date(nowUtc.toLocaleString("en-US", { timeZone: sub.timezone || "Europe/Berlin" }));
      const [remHour, remMin] = (sub.reminder_time || "09:00").split(":").map(Number);
      // Fenster: +/-2 Minuten, korrekt ueber Stunden- und Tagesgrenzen
      const nowMins = userNow.getHours() * 60 + userNow.getMinutes();
      const remMins = remHour * 60 + remMin;
      let diff = Math.abs(nowMins - remMins);
      diff = Math.min(diff, 1440 - diff);
      if (diff > 2) continue;

      // Sendesperre: max. 1 Erinnerung pro 10 Minuten (Cron laeuft minuetlich)
      if (sub.last_sent_at && (nowUtc.getTime() - new Date(sub.last_sent_at).getTime()) < 10 * 60 * 1000) continue;

      const { data: patients } = await supabase.from("patients").select("id,name").eq("user_id", sub.user_id);
      if (!patients?.length) continue;

      // Wochenstart/heute in der Zeitzone des Users berechnen
      const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const today = fmt(userNow);
      const ws = new Date(userNow);
      const day = ws.getDay();
      ws.setDate(ws.getDate() + (day === 0 ? -6 : 1 - day));
      const weekStart = fmt(ws);

      let sentForSub = 0;
      for (const patient of patients) {
        const { data: exercises } = await supabase.from("exercises").select("id,repeat_count,active_from,active_until").eq("patient_id", patient.id);
        if (!exercises?.length) continue;

        // Nur Uebungen in aktiver Phase zaehlen (seit v8 / App 064)
        const activeExercises = exercises.filter((ex) =>
          (!ex.active_from || ex.active_from <= today) &&
          (!ex.active_until || ex.active_until >= today)
        );
        if (!activeExercises.length) continue;

        const { data: logs } = await supabase.from("exercise_logs")
          .select("exercise_id").eq("done", true).gte("done_date", weekStart).lte("done_date", today)
          .in("exercise_id", activeExercises.map((e) => e.id));

        const doneCounts: Record<string, number> = {};
        for (const l of logs || []) doneCounts[l.exercise_id] = (doneCounts[l.exercise_id] || 0) + 1;

        const openCount = activeExercises.filter((ex) => (doneCounts[ex.id] || 0) < (ex.repeat_count || 1)).length;
        if (openCount === 0) continue;

        const payload = JSON.stringify({
          title: "Fit Fun Dog \u{1F43E}",
          body: `${patient.name} wartet auf ${openCount} Übung${openCount > 1 ? "en" : ""}!`,
          url: "/",
        });

        try {
          const subscriber = appServer.subscribe({
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          });
          await subscriber.pushTextMessage(payload, { ttl: 86400, urgency: webpush.Urgency.High });
          sent++;
          sentForSub++;
          console.log(`Push sent to user ${sub.user_id} (${patient.name})`);
        } catch (pushErr) {
          const status = pushErr?.response?.status;
          console.error(`Push failed for user ${sub.user_id}: status=${status}`);
          if (status === 404 || status === 410) {
            // Subscription existiert nicht mehr -> aufraeumen
            await supabase.from("push_subscriptions").delete().eq("id", sub.id);
          } else {
            errors.push(`user ${sub.user_id}: status=${status ?? String(pushErr)}`);
          }
        }
      }
      if (sentForSub > 0) {
        await supabase.from("push_subscriptions").update({ last_sent_at: nowUtc.toISOString() }).eq("id", sub.id);
      }
    } catch (e) {
      console.error(`Error for user ${sub.user_id}:`, String(e));
      errors.push(String(e));
    }
  }

  console.log(`send-reminders done: sent=${sent}, errors=${errors.length}`);
  return new Response(JSON.stringify({ sent, errors }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
