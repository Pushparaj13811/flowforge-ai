import { NextRequest, NextResponse } from "next/server";
import { db, workflows } from "@/db";
import { eq, and, or } from "drizzle-orm";
import { getCurrentUser, getAnonymousId } from "@/lib/auth/utils";
import { z } from "zod";

// Node position schema
const positionSchema = z.object({
  x: z.number(),
  y: z.number(),
}).default({ x: 100, y: 50 });

// Node schema with proper validation
const nodeSchema = z.object({
  id: z.string(),
  type: z.enum(["trigger", "action", "condition", "delay", "loop"]),
  label: z.string(),
  description: z.string().optional(),
  icon: z.string().optional(),
  status: z.enum(["idle", "running", "success", "error", "pending"]).optional(),
  position: positionSchema.optional().default({ x: 100, y: 50 }),
  // Action-specific configuration
  config: z.record(z.any()).optional(),
}).transform((node) => ({
  ...node,
  position: node.position ?? { x: 100, y: 50 },
}));

// Edge schema
const edgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  sourceHandle: z.string().optional(),
  targetHandle: z.string().optional(),
  label: z.string().optional(),
});

// Schema for updating a workflow
const updateWorkflowSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(["draft", "active", "paused"]).optional(),
  nodes: z.array(nodeSchema).optional(),
  edges: z.array(edgeSchema).optional(),
});

// Helper to check if user owns the workflow
async function canAccessWorkflow(workflowId: string) {
  const user = await getCurrentUser();
  const anonymousId = await getAnonymousId();

  const [workflow] = await db
    .select()
    .from(workflows)
    .where(eq(workflows.id, workflowId))
    .limit(1);

  if (!workflow) {
    return { workflow: null, hasAccess: false };
  }

  // Check ownership
  const isOwner =
    (user && workflow.userId === user.id) ||
    (!user && anonymousId && workflow.anonymousId === anonymousId);

  return { workflow, hasAccess: isOwner };
}

// GET /api/workflows/[id] - Get a single workflow
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { workflow, hasAccess } = await canAccessWorkflow(id);

    if (!workflow) {
      return NextResponse.json(
        { error: "Workflow not found" },
        { status: 404 }
      );
    }

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    return NextResponse.json({ workflow });
  } catch (error) {
    console.error("Get workflow error:", error);
    return NextResponse.json(
      { error: "Failed to fetch workflow" },
      { status: 500 }
    );
  }
}

// PATCH /api/workflows/[id] - Update a workflow
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { workflow, hasAccess } = await canAccessWorkflow(id);

    if (!workflow) {
      return NextResponse.json(
        { error: "Workflow not found" },
        { status: 404 }
      );
    }

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    const body = await request.json();
    console.log("[PATCH Workflow] Request body:", JSON.stringify(body, null, 2));
    const validatedData = updateWorkflowSchema.parse(body);

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (validatedData.name !== undefined) {
      updateData.name = validatedData.name;
    }
    if (validatedData.description !== undefined) {
      updateData.description = validatedData.description;
    }
    if (validatedData.status !== undefined) {
      updateData.status = validatedData.status;
    }
    if (validatedData.nodes !== undefined) {
      updateData.nodes = validatedData.nodes;
      updateData.nodeCount = validatedData.nodes.length;
    }
    if (validatedData.edges !== undefined) {
      updateData.edges = validatedData.edges;
    }

    const [updatedWorkflow] = await db
      .update(workflows)
      .set(updateData)
      .where(eq(workflows.id, id))
      .returning();

    return NextResponse.json({
      workflow: updatedWorkflow,
      message: "Workflow updated successfully",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("[PATCH Workflow] Validation error:", JSON.stringify(error.errors, null, 2));
      return NextResponse.json(
        {
          error: "Validation failed",
          details: error.errors.map(e => ({
            path: e.path.join('.'),
            message: e.message,
            ...(('received' in e) ? { received: e.received } : {})
          }))
        },
        { status: 400 }
      );
    }

    console.error("Update workflow error:", error);
    return NextResponse.json(
      { error: "Failed to update workflow" },
      { status: 500 }
    );
  }
}

// DELETE /api/workflows/[id] - Delete a workflow
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { workflow, hasAccess } = await canAccessWorkflow(id);

    if (!workflow) {
      return NextResponse.json(
        { error: "Workflow not found" },
        { status: 404 }
      );
    }

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    await db.delete(workflows).where(eq(workflows.id, id));

    return NextResponse.json({ message: "Workflow deleted successfully" });
  } catch (error) {
    console.error("Delete workflow error:", error);
    return NextResponse.json(
      { error: "Failed to delete workflow" },
      { status: 500 }
    );
  }
}
