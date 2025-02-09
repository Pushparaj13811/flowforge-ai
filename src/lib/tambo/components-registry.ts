import type { TamboComponent } from "@tambo-ai/react";
import { Graph, graphSchema } from "@/components/tambo/graph";
import { DataCard, dataCardSchema } from "@/components/ui/card-data";
import { WorkflowCanvasWithExpand } from "@/components/workflow/workflow-canvas-with-expand";
import { ExecutionTimeline } from "@/components/workflow/execution-timeline";
import { NodeConfigurator, nodeConfiguratorSchema } from "@/components/interactables/node-configurator";
import { ConditionBuilder, conditionBuilderSchema } from "@/components/interactables/condition-builder";
import { WorkflowStats, workflowStatsSchema } from "@/components/interactables/workflow-stats";
import { IntegrationPrompt, integrationPromptSchema } from "@/components/interactables/integration-prompt";
import { TriggerSchemaBuilder, triggerSchemaBuilderSchema } from "@/components/interactables/trigger-schema-builder";
import { TestResults, testResultsSchema } from "@/components/interactables/test-results";
import { workflowCanvasSchema, executionTimelineSchema } from "./schemas";

/**
 * All Tambo components registered for use within the application.
 * Each component is defined with its name, description, and expected props.
 * Components can be controlled by AI to dynamically render UI elements based on user interactions.
 */
export const components: TamboComponent[] = [
  {
    name: "Graph",
    description:
      "A component that renders various types of charts (bar, line, pie) using Recharts. Supports customizable data visualization with labels, datasets, and styling options.",
    component: Graph,
    propsSchema: graphSchema,
  },
  {
    name: "DataCard",
    description:
      "A component that displays options as clickable cards with links and summaries with the ability to select multiple items.",
    component: DataCard,
    propsSchema: dataCardSchema,
  },
  // Workflow Components
  {
    name: "WorkflowCanvas",
    description: `A visual workflow display component that shows automation workflows as connected nodes.

WHEN TO USE:
✅ AFTER calling createWorkflow tool - show this to display the result
✅ When user asks to see/view an existing workflow
✅ When displaying workflow structure

WHEN NOT TO USE:
❌ Do not use this INSTEAD of calling createWorkflow - this is for DISPLAY only
❌ Do not use this before calling createWorkflow tool

The canvas shows nodes (triggers, actions, conditions, delays) connected by edges.
Each node type has a distinct color and icon.

Pass the workflow data returned from createWorkflow to this component.`,
    component: WorkflowCanvasWithExpand,
    propsSchema: workflowCanvasSchema,
  },
  {
    name: "ExecutionTimeline",
    description: `A timeline component showing workflow execution progress step by step.
Use this when:
- Running or testing a workflow
- Showing execution results
- Debugging workflow runs

Displays each step with status (pending, running, completed, failed), duration, and details.`,
    component: ExecutionTimeline,
    propsSchema: executionTimelineSchema,
  },
  // Interactable Components
  {
    name: "NodeConfigurator",
    description: `DEPRECATED FOR WORKFLOW CREATION - DO NOT USE THIS COMPONENT TO CREATE WORKFLOWS.

Instead, use the createWorkflow tool directly with fully configured nodes.

This component is ONLY for:
- Editing an EXISTING workflow node after it's been created
- Manual fine-tuning of node configuration after workflow creation

NEVER show this component when a user asks to create a workflow.
ALWAYS use the createWorkflow tool directly with handlerType and configJson populated.`,
    component: NodeConfigurator,
    propsSchema: nodeConfiguratorSchema,
  },
  {
    name: "ConditionBuilder",
    description: `DEPRECATED FOR WORKFLOW CREATION - DO NOT USE THIS COMPONENT TO CREATE CONDITIONS.

Instead, create condition nodes directly via createWorkflow tool with:
configJson: '{"field": "$trigger.data.amount", "operator": "greater_than", "value": "100"}'

This component is ONLY for:
- Editing an EXISTING condition node after workflow creation
- Complex multi-condition visualization AFTER a workflow exists

NEVER show this component when a user asks to create a workflow with conditions.
ALWAYS use the createWorkflow tool directly.`,
    component: ConditionBuilder,
    propsSchema: conditionBuilderSchema,
  },
  {
    name: "WorkflowStats",
    description: `Visual statistics dashboard for workflow performance metrics.
Use this when the user wants to:
- View workflow execution statistics
- See success/failure rates
- Check average execution duration
- View workflow complexity (node count, connections)
- Monitor workflow activity and performance

Displays metrics with animated progress bars and color-coded stats.
Shows total executions, success rate, average duration, and last run time.
Numbers animate with green pulse when updated by AI.`,
    component: WorkflowStats,
    propsSchema: workflowStatsSchema,
  },
  // Conversational Workflow Building Components
  {
    name: "IntegrationPrompt",
    description: `Show required integrations for a workflow and guide users to connect them.
Use this ONLY when:
- User is MISSING a required integration (detected via checkRequiredIntegrations tool)
- Guiding user through OAuth integration setup

DO NOT show this preemptively. First use checkRequiredIntegrationsTool to verify what's missing.`,
    component: IntegrationPrompt,
    propsSchema: integrationPromptSchema,
  },
  {
    name: "TriggerSchemaBuilder",
    description: `DEPRECATED FOR WORKFLOW CREATION - DO NOT USE THIS TO CREATE WORKFLOWS.

Instead, define trigger schema directly in createWorkflow tool using:
triggerSchemaJson: '[{"name": "email", "type": "email"}, {"name": "name", "type": "string"}]'

This component is ONLY for:
- Viewing/editing trigger schema of an EXISTING workflow
- Manual fine-tuning AFTER workflow creation

NEVER show this when a user asks to create a workflow.
ALWAYS use the createWorkflow tool directly with triggerSchemaJson populated.`,
    component: TriggerSchemaBuilder,
    propsSchema: triggerSchemaBuilderSchema,
  },
  {
    name: "TestResults",
    description: `Display workflow test execution results with step-by-step details.
Use this when:
- Showing results after testing a workflow
- Debugging workflow execution issues
- Displaying which steps passed/failed
- Showing the data flow between steps

Shows overall status, step-by-step execution timeline with expandable details.
Displays input/output data for each step and error messages for failures.
Supports retest functionality.`,
    component: TestResults,
    propsSchema: testResultsSchema,
  },
];
