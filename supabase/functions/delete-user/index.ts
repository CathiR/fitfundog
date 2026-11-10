import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  try {
    const { user_id } = await req.json();
    if (!user_id) return json({ error: "user_id required" }, 400);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // ── Aufrufer pruefen (seit 082) ──
    // Erlaubt ist nur: (a) ein Besitzer loescht sein eigenes Konto,
    // (b) ein Praxis-Admin loescht einen User, der ausschliesslich zu seiner Praxis gehoert.
    // Der Anon-Key allein reicht nicht – getUser() verlangt ein echtes User-JWT.
    const token = (req.headers.get("Authorization") || "").replace("Bearer ", "");
    const { data: { user: caller }, error: callerErr } = await supabase.auth.getUser(token);
    if (callerErr || !caller) return json({ error: "unauthorized" }, 401);

    // Praxis-Admins koennen ueber diese Funktion nie geloescht werden
    const { data: targetAdminOf, error: taErr } = await supabase
      .from("practice_settings").select("id").eq("admin_user_id", user_id);
    if (taErr) return json({ error: taErr.message }, 500);
    if (targetAdminOf && targetAdminOf.length > 0) {
      return json({ error: "forbidden: practice admins cannot be deleted" }, 403);
    }

    if (caller.id !== user_id) {
      const { data: callerPractice, error: cpErr } = await supabase
        .from("practice_settings").select("id").eq("admin_user_id", caller.id).maybeSingle();
      if (cpErr) return json({ error: cpErr.message }, 500);
      if (!callerPractice) return json({ error: "forbidden" }, 403);

      // Ziel-User darf keine Verbindung zu einer anderen Praxis haben
      const [{ data: pats, error: pErr }, { data: invs, error: iErr }] = await Promise.all([
        supabase.from("patients").select("practice_id").eq("user_id", user_id),
        supabase.from("user_invitations").select("practice_id").eq("user_id", user_id),
      ]);
      if (pErr || iErr) return json({ error: (pErr || iErr)!.message }, 500);
      const foreign = [...(pats || []), ...(invs || [])].some(
        (r) => r.practice_id !== callerPractice.id
      );
      if (foreign) return json({ error: "forbidden: user belongs to another practice" }, 403);
    }

    // FK-Constraint loesen: patients.user_id auf NULL setzen
    const { error: patErr } = await supabase
      .from("patients")
      .update({ user_id: null })
      .eq("user_id", user_id);
    if (patErr) return json({ error: patErr.message }, 400);

    // Auth-User loeschen
    const { error } = await supabase.auth.admin.deleteUser(user_id);
    return json({ error: error || null }, error ? 400 : 200);
  } catch (e) {
    return json({ error: e.message }, 500);
  }
});
