import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [showNewsletterPrompt, setShowNewsletterPrompt] = useState(false);

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);

      // First-time Google sign-ups: prompt for newsletter after OAuth redirect
      if (event === "SIGNED_IN" && session?.user) {
        const u = session.user;
        const isGoogle = u.app_metadata?.provider === "google";
        const isNew = Date.now() - new Date(u.created_at).getTime() < 90_000;
        if (isGoogle && isNew) {
          const { data } = await supabase
            .from("newsletter_subscribers")
            .select("user_id")
            .eq("user_id", u.id)
            .maybeSingle();
          if (!data) setShowNewsletterPrompt(true);
        }
      }
      if (event === "SIGNED_OUT") setShowNewsletterPrompt(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = (email, password) =>
    supabase.auth.signInWithPassword({ email, password });

  const signUp = async (email, password, newsletter) => {
    const result = await supabase.auth.signUp({ email, password });
    if (!result.error && result.data?.user && newsletter) {
      await supabase.from("newsletter_subscribers").upsert({
        user_id: result.data.user.id,
        email,
        opted_in: true,
      });
    }
    return result;
  };

  const signOut = () => supabase?.auth.signOut();

  // Permanently removes the user's saved plan (and newsletter row) from the server.
  // The plan in the current browser session is untouched — only cloud data is deleted.
  const deleteCloudData = async () => {
    if (!user || !supabase) return { error: new Error("Not signed in") };
    const { error: planErr } = await supabase.from("plans").delete().eq("user_id", user.id);
    await supabase.from("newsletter_subscribers").delete().eq("user_id", user.id);
    return { error: planErr ?? null };
  };

  const signInWithGoogle = () =>
    supabase?.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.href },
    });

  const resolveNewsletterPrompt = async (optIn) => {
    if (!user || !supabase) return;
    await supabase.from("newsletter_subscribers").upsert({
      user_id: user.id,
      email: user.email,
      opted_in: optIn,
    });
    setShowNewsletterPrompt(false);
  };

  return (
    <AuthContext.Provider value={{
      user, loading,
      signIn, signUp, signOut, signInWithGoogle, deleteCloudData,
      showNewsletterPrompt,
      resolveNewsletterPrompt,
      dismissNewsletterPrompt: () => setShowNewsletterPrompt(false),
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
