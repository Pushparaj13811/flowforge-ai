import {
  Webhook,
  Cog,
  GitBranch,
  Clock,
  Repeat,
} from "lucide-react";
import type { WorkflowNodeType } from "../types";

export const typeIcons: Record<WorkflowNodeType, React.ElementType> = {
  trigger: Webhook,
  action: Cog,
  condition: GitBranch,
  delay: Clock,
  loop: Repeat,
};

export const typeColors: Record<WorkflowNodeType, string> = {
  trigger: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  action: "bg-green-500/10 text-green-600 dark:text-green-400",
  condition: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  delay: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  loop: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
};
