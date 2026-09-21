import type { Metadata } from "next";

import AgentWorkspace from "./agent-workspace";
import "./module4.css";

export const metadata: Metadata = { title: "我的藏书" };

export default function Page() {
  return <AgentWorkspace />;
}
