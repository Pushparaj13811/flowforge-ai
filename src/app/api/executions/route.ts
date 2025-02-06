import { NextRequest, NextResponse } from "next/server";
import { db, executions, executionSteps, workflows } from "@/db";
import { eq, desc, and } from "drizzle-orm";
import { getCurrentUser, getAnonymousId } from "@/lib/auth/utils";
import { z } from "zod";
import { WorkflowRuntime } from "@/lib/execution/workflow-runtime";

// Schema for creating an execution
const createExecutionSchema = z.object({
  workflowId: z.string().uuid("Invalid workflow ID"),
  testDataJson: z.string().optional(),
});

// GET /api/executions - List executions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workflowId = searchParams.get("workflowId");

    const user = await getCurrentUser();
    const anonymousId = await getAnonymousId();

    // First get the user's workflows
    let userWorkflows;
    if (user) {
      userWorkflows = await db
        .select({ id: workflows.id })
        .from(workflows)
        .where(eq(workflows.userId, user.id));
    } else if (anonymousId) {
      userWorkflows = await db
        .select({ id: workflows.id })
        .from(workflows)
        .where(eq(workflows.anonymousId, anonymousId));
    } else {
      return NextResponse.json({ executions: [] });
    }

    const workflowIds = userWorkflows.map((w) => w.id);

    if (workflowIds.length === 0) {
      return NextResponse.json({ executions: [] });
    }

    // Build query
    let query = db
      .select({
        execution: executions,
        workflowName: workflows.name,
      })
      .from(executions)
      .innerJoin(workflows, eq(executions.workflowId, workflows.id))
      .orderBy(desc(executions.createdAt));

    // Filter by specific workflow if provided
    if (workflowId) {
      if (!workflowIds.includes(workflowId)) {
        return NextResponse.json(
          { error: "Access denied" },
          { status: 403 }
        );
      }
      query = query.where(eq(executions.workflowId, workflowId)) as typeof query;
    }

    const result = await query;

    // Format response
    const formattedExecutions = result.map(({ execution, workflowName }) => ({
      ...execution,
      workflowName,
    }));

    return NextResponse.json({ executions: formattedExecutions });
  } catch (error) {
    console.error("Get executions error:", error);
    return NextResponse.json(
      { error: "Failed to fetch executions" },
      { status: 500 }
    );
  }
}

// POST /api/executions - Start a new execution
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createExecutionSchema.parse(body);

    const user = await getCurrentUser();
    const anonymousId = await getAnonymousId();

    // Verify access to workflow
    const [workflow] = await db
      .select()
      .from(workflows)
      .where(eq(workflows.id, validatedData.workflowId))
      .limit(1);

    if (!workflow) {
      return NextResponse.json(
        { error: "Workflow not found" },
        { status: 404 }
      );
    }

    // Check ownership
    const isOwner =
      (user && workflow.userId === user.id) ||
      (!user && anonymousId && workflow.anonymousId === anonymousId);

    if (!isOwner) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // Create execution record
    const [newExecution] = await db
      .insert(executions)
      .values({
        workflowId: validatedData.workflowId,
        status: "pending",
      })
      .returning();

    // Parse trigger data
    let triggerData = {};
    if (validatedData.testDataJson) {
      try {
        triggerData = JSON.parse(validatedData.testDataJson);
      } catch {
        console.warn("Failed to parse test data JSON, using empty object");
      }
    }

    // Execute workflow using WorkflowRuntime
    const runtime = new WorkflowRuntime();

    try {
      await runtime.executeWorkflow(
        validatedData.workflowId,
        newExecution.id,
        triggerData,
        user?.id || anonymousId || 'anonymous'
      );

      // Fetch updated execution with steps
      const [completedExecution] = await db
        .select()
        .from(executions)
        .where(eq(executions.id, newExecution.id))
        .limit(1);

      const steps = await db
        .select()
        .from(executionSteps)
        .where(eq(executionSteps.executionId, newExecution.id))
        .orderBy(executionSteps.stepOrder);

      return NextResponse.json({
        execution: {
          ...completedExecution,
          workflowName: workflow.name,
          steps,
        },
        message: "Workflow executed successfully",
      });
    } catch (executionError) {
      // Execution failed - get partial results
      const [failedExecution] = await db
        .select()
        .from(executions)
        .where(eq(executions.id, newExecution.id))
        .limit(1);

      const steps = await db
        .select()
        .from(executionSteps)
        .where(eq(executionSteps.executionId, newExecution.id))
        .orderBy(executionSteps.stepOrder);

      return NextResponse.json({
        execution: {
          ...failedExecution,
          workflowName: workflow.name,
          steps,
        },
        error: executionError instanceof Error ? executionError.message : "Execution failed",
        message: "Workflow execution failed",
      }, { status: 500 });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error("Create execution error:", error);
    return NextResponse.json(
      { error: "Failed to start execution" },
      { status: 500 }
    );
  }
}
