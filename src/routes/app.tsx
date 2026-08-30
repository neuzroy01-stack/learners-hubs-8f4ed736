import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import App from "../edupro/App";

export const Route = createFileRoute("/app")({
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
  const [status, setStatus] = useState<"pending" | "ready" | "redirect">("pending");

  useEffect(() => {
    try {
      const uid = window.localStorage.getItem("lh_uid");
      if (!uid) {
        setStatus("redirect");
        navigate({ to: "/login", replace: true });
      } else {
        setStatus("ready");
      }
    } catch {
      setStatus("redirect");
      navigate({ to: "/login", replace: true });
    }
  }, [navigate]);

  if (status !== "ready") return null;
  return <App />;
}
