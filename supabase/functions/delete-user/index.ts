import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  try {
    const { user_id } = await req.json();
    if (!user_id) {
      return new Response(JSON.stringify({ error: "user_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    // FK-Constraint loesen: patients.user_id auf NULL setzen
    const { error: patErr, count } = await supabase
      .from("patients")
      .update({ user_id: null })
      .eq("user_id", user_id);
    console.log("patients update:", patErr ? patErr.message : "ok", "count:", count);
    if (patErr) {
      return new Response(JSON.stringify({ error: patErr.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    // Auth-User loeschen
    const { error } = await supabase.auth.admin.deleteUser(user_id);
    console.log("deleteUser:", error ? error.message : "ok");
    return new Response(JSON.stringify({ error: error || null }), {
      status: error ? 400 : 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.log("Exception:", e.message);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
