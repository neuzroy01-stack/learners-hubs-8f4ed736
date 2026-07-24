import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import App from "../edupro/App";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Learner Hub — Enterprise LMS" },
      {
        name: "description",
        content:
          "Learner Hub LMS: role-based dashboards, courses, live classes, recorded lectures, assignments, fees and analytics.",
      },
      { property: "og:title", content: "Learner Hub — Enterprise LMS" },
      {
        property: "og:description",
        content:
          "Role-based Learning Management System with courses, live classes, payments and analytics.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  if (!hydrated) return null;
  return <App />;
}
