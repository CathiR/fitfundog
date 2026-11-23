// Neuigkeiten der Praxis per Push an alle Besitzer senden (seit App 096).
// Aufruf aus der App durch den Praxis-Admin: { news_id }. Nur der Admin der Praxis darf senden.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as webpush from "jsr:@negrel/webpush";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!;
const VAPID_SUBJECT = "mailto:fitfundog@freenet.de";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

function base64UrlDecode(str: string): Uint8Array {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  const bin = atob(str);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}
function toB64url(b: Uint8Array): string {
  return btoa(String.fromCharCode(...b)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}
async function buildVapidKeys(): Promise<CryptoKeyPair> {
  const raw = base64UrlDecode(VAPID_PUBLIC_KEY);
  const x = toB64url(raw.slice(1, 33));
  const y = toB64url(raw.slice(33, 65));
  const publicKey = await crypto.subtle.importKey("raw", raw, { name: "ECDSA", namedCurve: "P-256" }, true, ["verify"]);
  const privateKey = await crypto.subtle.importKey(
    "jwk", { kty: "EC", crv: "P-256", d: VAPID_PRIVATE_KEY, x, y, ext: true },
    { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"],
  );
  return { publicKey, privateKey };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData?.user) return json({ error: "Nicht angemeldet" }, 401);

    const { news_id } = await req.json().catch(() => ({}));
    if (!news_id) return json({ error: "news_id fehlt" }, 400);

    const { data: news } = await supabase.from("practice_news").select("id,practice_id,title,body,push").eq("id", news_id).maybeSingle();
    if (!news) return json({ error: "Beitrag nicht gefunden" }, 404);

    const { data: practice } = await supabase.from("practice_settings").select("admin_user_id,practice_name").eq("id", news.practice_id).maybeSingle();
    if (!practice || practice.admin_user_id !== userData.user.id) return json({ error: "Keine Berechtigung" }, 403);
    if (!news.push) return json({ sent: 0 });

    const { data: owners } = await supabase.from("patients").select("user_id").eq("practice_id", news.practice_id).not("user_id", "is", null);
    const ownerIds = [...new Set((owners || []).map((o) => o.user_id))];
    if (!ownerIds.length) return json({ sent: 0 });

    const { data: subs } = await supabase.from("push_subscriptions").select("id,user_id,endpoint,p256dh,auth")
      .in("user_id", ownerIds).eq("news_enabled", true);
    if (!subs?.length) {
      await supabase.from("practice_news").update({ push_sent_count: 0 }).eq("id", news.id);
      return json({ sent: 0 });
    }

    // Ungelesene Beitraege je Besitzer fuer die Zahl am App-Symbol (seit App 098)
    const [{ data: allNews }, { data: seenRows }] = await Promise.all([
      supabase.from("practice_news").select("created_at").eq("practice_id", news.practice_id),
      supabase.from("news_seen").select("user_id,seen_at").in("user_id", ownerIds),
    ]);
    const seenBy: Record<string, string> = {};
    for (const r of seenRows || []) seenBy[r.user_id] = r.seen_at;
    const unreadFor = (uid: string) =>
      (allNews || []).filter((n) => !seenBy[uid] || new Date(n.created_at) > new Date(seenBy[uid])).length;

    const appServer = await webpush.ApplicationServer.new({ contactInformation: VAPID_SUBJECT, vapidKeys: await buildVapidKeys() });
    const body = news.body.length > 140 ? news.body.slice(0, 137) + "..." : news.body;
    const payloadFor = (uid: string) => JSON.stringify({
      title: `${practice.practice_name || "Fit Fun Dog"}: ${news.title}`,
      body,
      url: "/?news=1",
      tag: `news-${news.id}`,
      badge_count: Math.max(1, unreadFor(uid)),
    });

    let sent = 0;
    const errors: string[] = [];
    for (const sub of subs) {
      try {
        await appServer.subscribe({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } })
          .pushTextMessage(payloadFor(sub.user_id), { ttl: 3 * 86400, urgency: webpush.Urgency.Normal });
        sent++;
      } catch (pushErr) {
        const status = pushErr?.response?.status;
        if (status === 404 || status === 410) await supabase.from("push_subscriptions").delete().eq("id", sub.id);
        else errors.push(`status=${status ?? String(pushErr)}`);
      }
    }
    await supabase.from("practice_news").update({ push_sent_count: sent }).eq("id", news.id);
    console.log(`send-news ${news.id}: sent=${sent}, errors=${errors.length}`);
    return json({ sent, errors });
  } catch (e) {
    console.error("send-news error", String(e));
    return json({ error: String(e) }, 500);
  }
});
