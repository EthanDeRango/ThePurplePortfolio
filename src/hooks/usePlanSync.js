import { useEffect, useRef } from "react";
import { supabase } from "../lib/supabase.js";

// Keeps the plan in sync with Supabase when a user is signed in.
// On login  → loads cloud plan (overrides localStorage if a cloud plan exists).
// On change → debounced upsert to Supabase (800 ms).
// On logout → stops syncing; localStorage plan remains intact.
export function usePlanSync(user, plan, setPlan, PLAN_DEFAULTS) {
  const initialized = useRef(false);

  // Load from cloud on login
  useEffect(() => {
    if (!user || !supabase) {
      initialized.current = false;
      return;
    }
    supabase
      .from("plans")
      .select("plan_data")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.plan_data) {
          setPlan((cur) => ({ ...PLAN_DEFAULTS, ...data.plan_data }));
        }
        initialized.current = true;
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Push changes to cloud
  useEffect(() => {
    if (!user || !supabase || !initialized.current) return;
    const t = setTimeout(() => {
      supabase.from("plans").upsert(
        { user_id: user.id, plan_data: plan, updated_at: new Date().toISOString() },
        { onConflict: "user_id" }
      );
    }, 800);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, plan]);
}
