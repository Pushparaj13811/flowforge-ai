import { NextRequest, NextResponse } from "next/server";
import { db, workflows } from "@/db";
import { eq, or, desc, and, isNull } from "drizzle-orm";
import { getCurrentUser, getOrCreateAnonymousId } from "@/lib/auth/utils";
import {
  CreateWorkflowRequestSchema,
  GetWorkflowsResponseSchema,
  parseRequestBody,
  createErrorResponse,
} from "@/types/api";

// GET /api/workflows - List workflows for current user (or anonymous)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const user = await getCurrentUser();
    const anonymousId = await getOrCreateAnonymousId();

    // Build where condition - get user's workflows OR anonymous workflows
    let whereCondition;
    if (user) {
      // Logged in: get user's workflows
      whereCondition = eq(workflows.userId, user.id);
    } else {
      // Anonymous: get workflows with matching anonymousId
      whereCondition = eq(workflows.anonymousId, anonymousId);
    }

    // Add status filter if provided
    if (status && ["draft", "active", "paused"].includes(status)) {
      whereCondition = and(whereCondition, eq(workflows.status, status));
    }

    const result = await db
      .select()
      .from(workflows)
      .where(whereCondition)
      .orderBy(desc(workflows.updatedAt));

    const response = GetWorkflowsResponseSchema.parse({
      workflows: result.map((w) => ({
        id: w.id,
        name: w.name,
        description: w.description,
        status: w.status,
        nodeCount: w.nodeCount,
        executionCount: w.executionCount,
        successRate: w.successRate,
        lastRunAt: w.lastRunAt?.toISOString() ?? null,
        createdAt: w.createdAt.toISOString(),
        updatedAt: w.updatedAt.toISOString(),
      })),
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error("[API] Get workflows error:", error);
    return createErrorResponse(
      "Failed to fetch workflows",
      500,
      error instanceof Error ? error.message : undefined
    );
  }
}

// POST /api/workflows - Create a new workflow
export async function POST(request: NextRequest) {
  try {
    const result = await parseRequestBody(request, CreateWorkflowRequestSchema);
    if (!result.success) {
      return createErrorResponse("Invalid request body", 400, result.error);
    }

    const { name, description, nodes, edges } = result.data;

    const user = await getCurrentUser();
    const anonymousId = user ? null : await getOrCreateAnonymousId();

    const [newWorkflow] = await db
      .insert(workflows)
      .values({
        userId: user?.id ?? null,
        anonymousId,
        name,
        description,
        status: 'draft',
        nodes,
        edges,
        nodeCount: Array.isArray(nodes) ? nodes.length : 0,
      })
      .returning();

    return NextResponse.json({
      workflow: {
        id: newWorkflow.id,
        name: newWorkflow.name,
        description: newWorkflow.description,
        status: newWorkflow.status,
        createdAt: newWorkflow.createdAt.toISOString(),
        updatedAt: newWorkflow.updatedAt.toISOString(),
      },
      message: "Workflow created successfully",
    });
  } catch (error) {
    console.error("[API] Create workflow error:", error);
    return createErrorResponse(
      "Failed to create workflow",
      500,
      error instanceof Error ? error.message : undefined
    );
  }
}
