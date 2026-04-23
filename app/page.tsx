"use client";

import { useApp } from "./context";
import LoginPage from "./components/LoginPage";
import Dashboard from "./components/Dashboard";

export default function Home() {
  const { credentials, authData } = useApp();

  if (!credentials || !authData) {
    return <LoginPage />;
  }

  return <Dashboard />;
}
