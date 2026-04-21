import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!;
const VAPID_SUBJECT = "mailto:fitfundog@freenet.de";

// ── VAPID JWT helper ──
async function makeVapidJwt(endpoint: string): Promise<string> {
  const url = new URL(endpoint);
  const audience = `${url.protocol}//${url.host}`;
  const now = Math.floor(Date.now() / 1000);
  const header = btoa(JSON.stringify({ typ: "JWT", alg: "ES256" }))
    .replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const payload = btoa(JSON.stringify({ aud: audience, exp: now + 43200, sub: VAPID_SUBJECT }))
    .replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const data = new TextEncoder().encode(`${header}.${payload}`);
  const keyBytes = base64UrlDecode(VAPID_PRIVATE_KEY);
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8", keyBytes,
    { name: "ECDSA", namedCurve: "P-256" },
    false, ["sign"]
  );
  const sig = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, cryptoKey, data);
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  return `${header}.${payload}.${sigB64}`;
}

function base64UrlDecode(str: string): ArrayBuffer {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  const bin = atob(str);
  return Uint8Array.from(bin, c => c.charCodeAt(0)).buffer;
}

// ── Send one push notification ──
async function sendPush(sub: { endpoint: string; p256dh: string; auth: string }, payload: string) {
  const jwt = await makeVapidJwt(sub.endpoint);
  const authHeader = `vapid t=${jwt},k=${VAPID_PUBLIC_KEY}`;

  // Encrypt payload using Web Push encryption (RFC 8291)
  const saltBytes = crypto.getRandomValues(new Uint8Array(16));
  const serverKeyPair = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]
  );
  const serverPublicKeyRaw = await crypto.subtle.exportKey("raw", serverKeyPair.publicKey);
  const clientPublicKey = await crypto.subtle.importKey(
    "raw", base64UrlDecode(sub.p256dh),
    { name: "ECDH", namedCurve: "P-256" }, false, []
  );
  const sharedSecret = await crypto.subtle.deriveBits(
    { name: "ECDH", public: clientPublicKey }, serverKeyPair.privateKey, 256
  );
  const authSecret = base64UrlDecode(sub.auth);
  const hkdfSalt = new Uint8Array(32);
  const prk = await crypto.subtle.importKey("raw", sharedSecret, { name: "HKDF" }, false, ["deriveBits"]);
  const ikm = await crypto.subtle.deriveBits(
    { name: "HKDF", hash: "SHA-256", salt: authSecret, info: new TextEncoder().encode("Content-Encoding: auth\0") },
    prk, 256
  );
  const ikmKey = await crypto.subtle.importKey("raw", ikm, { name: "HKDF" }, false, ["deriveBits"]);
  const serverPubBytes = new Uint8Array(serverPublicKeyRaw);
  const clientPubBytes = new Uint8Array(base64UrlDecode(sub.p256dh));
  const keyInfo = new Uint8Array([...new TextEncoder().encode("Content-Encoding: aesgcm\0"), 0, 65, ...clientPubBytes, 0, 65, ...serverPubBytes]);
  const nonceInfo = new Uint8Array([...new TextEncoder().encode("Content-Encoding: nonce\0"), 0, 65, ...clientPubBytes, 0, 65, ...serverPubBytes]);
  const contentKey = await crypto.subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt: saltBytes, info: keyInfo }, ikmKey, 128);
  const nonceBits = await crypto.subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt: saltBytes, info: nonceInfo }, ikmKey, 96);
  const aesKey = await crypto.subtle.importKey("raw", contentKey, { name: "AES-GCM" }, false, ["encrypt"]);
  const plaintext = new TextEncoder().encode(payload);
  const padded = new Uint8Array(plaintext.length + 2);
  padded.set(plaintext, 2);
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonceBits }, aesKey, padded);
  const body = new Uint8Array(encrypted);

  const saltB64 = btoa(String.fromCharCode(...saltBytes)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const serverPubB64 = btoa(String.fromCharCode(...serverPubBytes)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

  const res = await fetch(sub.endpoint, {
    method: "POST",
    headers: {
      "Authorization": authHeader,
      "Content-Type": "application/octet-stream",
      "Content-Encoding": "aesgcm",
      "Encryption": `salt=${saltB64}`,
      "Crypto-Key": `dh=${serverPubB64}`,
      "TTL": "86400",
    },
    body,
  });
  return res.status;
}

// ── Main handler ──
Deno.serve(async (req) => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const nowUtc = new Date();
  const errors: string[] = [];
  let sent = 0;

  // Get all subscriptions where reminder_time matches current hour (in user's timezone)
  const { data: subs } = await supabase.from("push_subscriptions").select("*");
  if (!subs?.length) return new Response(JSON.stringify({ sent: 0 }), { status: 200 });

  for (const sub of subs) {
    try {
      // Check current time in user's timezone
      const userNow = new Date(nowUtc.toLocaleString("en-US", { timeZone: sub.timezone || "Europe/Berlin" }));
      const userHour = userNow.getHours();
      const userMin = userNow.getMinutes();
      const [remHour, remMin] = (sub.reminder_time || "09:00").split(":").map(Number);
      if (userHour !== remHour || userMin > 5) continue; // only fire within 5-min window

      // Get patient for this user
      const { data: patients } = await supabase.from("patients").select("id,name").eq("user_id", sub.user_id);
      if (!patients?.length) continue;

      // Check if they have open exercises this week
      const today = new Date().toISOString().split("T")[0];
      const weekStart = (() => { const d = new Date(); const day = d.getDay(); const diff = day === 0 ? -6 : 1 - day; d.setDate(d.getDate() + diff); return d.toISOString().split("T")[0]; })();

      for (const patient of patients) {
        const { data: exercises } = await supabase.from("exercises").select("id,repeat_count").eq("patient_id", patient.id);
        if (!exercises?.length) continue;

        const { data: logs } = await supabase.from("exercise_logs")
          .select("exercise_id").eq("done", true).gte("done_date", weekStart).lte("done_date", today);

        const doneCounts: Record<string, number> = {};
        for (const l of logs || []) doneCounts[l.exercise_id] = (doneCounts[l.exercise_id] || 0) + 1;

        const openCount = exercises.filter(ex => (doneCounts[ex.id] || 0) < (ex.repeat_count || 1)).length;
        if (openCount === 0) continue;

        const payload = JSON.stringify({
          title: "Fit Fun Dog 🐾",
          body: `${patient.name} wartet auf ${openCount} Übung${openCount > 1 ? "en" : ""}!`,
          url: "/"
        });

        const status = await sendPush(sub, payload);
        if (status < 300) sent++;
        else if (status === 410) {
          // Subscription expired – remove it
          await supabase.from("push_subscriptions").delete().eq("id", sub.id);
        }
      }
    } catch (e) {
      errors.push(String(e));
    }
  }

  return new Response(JSON.stringify({ sent, errors }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
});
