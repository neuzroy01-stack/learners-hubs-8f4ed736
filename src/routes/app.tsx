import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import App from "../edupro/App";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/app")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Learner Hub · Dashboard" },
      { name: "description", content: "Your Learner Hub dashboard: courses, live classes, assignments, fees and certificates." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AppShellRoute,
});

function AppShellRoute() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"pending" | "ready">("pending");

  useEffect(() => {
    let alive = true;
    void (async () => {
      const { data, error } = await supabase.auth.getUser();
      if (!alive) return;
      if (error || !data.user) navigate({ to: "/login", replace: true });
      else setStatus("ready");
    })();
    return () => {
      alive = false;
    };
  }, [navigate]);

  if (status !== "ready") return null;
  return <App />;
}

