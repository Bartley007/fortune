import type { Metadata } from "next";

import AgentWorkspace from "./agent-workspace";
import "./module4.css";

export const metadata: Metadata = { title: "知命智库" };

export default function Page() {
  return <AgentWorkspace />;
}
