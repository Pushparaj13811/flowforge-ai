import { NextRequest, NextResponse } from "next/server";
import { db, conversations, messages } from "@/db";
import { eq, desc, and, count, sql } from "drizzle-orm";
import { getCurrentUser, getOrCreateAnonymousId } from "@/lib/auth/utils";
import { z } from "zod";

const createConversationSchema = z.object({
  title: z.string().optional(),
  workflowId: z.string().uuid().optional(),
  tamboThreadId: z.string().optional(),
});

// GET /api/conversations - List conversations
// Supports ?workflowId=xxx to filter by workflow
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const anonymousId = await getOrCreateAnonymousId();
    const { searchParams } = new URL(request.url);
    const workflowId = searchParams.get("workflowId");

    let whereCondition;
    if (user) {
      whereCondition = eq(conversations.userId, user.id);
    } else {
      whereCondition = eq(conversations.anonymousId, anonymousId);
    }

    let result;

    if (workflowId) {
      // Filter conversations by workflow
      const { workflows: workflowsTable } = await import("@/db/schema");

      result = await db
        .select({
          id: conversations.id,
          userId: conversations.userId,
          anonymousId: conversations.anonymousId,
          title: conversations.title,
          createdAt: conversations.createdAt,
          updatedAt: conversations.updatedAt,
        })
        .from(conversations)
        .innerJoin(workflowsTable, eq(workflowsTable.conversationId, conversations.id))
        .where(
          and(
            whereCondition,
            eq(workflowsTable.id, workflowId)
          )
        )
        .orderBy(desc(conversations.updatedAt));
    } else {
      result = await db
        .select()
        .from(conversations)
        .where(whereCondition)
        .orderBy(desc(conversations.updatedAt));
    }

    // Get message counts for each conversation
    const conversationIds = result.map((c: { id: string }) => c.id);
    const messageCounts: Record<string, number> = {};

    if (conversationIds.length > 0) {
      const counts = await db
        .select({
          conversationId: messages.conversationId,
          count: count(),
        })
        .from(messages)
        .where(sql`${messages.conversationId} IN (${sql.join(conversationIds.map(id => sql`${id}`), sql`, `)})`)
        .groupBy(messages.conversationId);

      for (const row of counts) {
        messageCounts[row.conversationId] = row.count;
      }
    }

    // Add message count to each conversation
    const conversationsWithCounts = result.map((conv: { id: string }) => ({
      ...conv,
      messageCount: messageCounts[conv.id] || 0,
    }));

    return NextResponse.json({ conversations: conversationsWithCounts });
  } catch (error) {
    console.error("Get conversations error:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversations" },
      { status: 500 }
    );
  }
}

// POST /api/conversations - Create a new conversation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createConversationSchema.parse(body);

    const user = await getCurrentUser();
    const anonymousId = user ? null : await getOrCreateAnonymousId();

    const [newConversation] = await db
      .insert(conversations)
      .values({
        userId: user?.id ?? null,
        anonymousId,
        title: validatedData.title || "New Conversation",
        tamboThreadId: validatedData.tamboThreadId ?? null,
      })
      .returning();

    // If workflowId provided, link the conversation to the workflow
    if (validatedData.workflowId) {
      const { workflows: workflowsTable } = await import("@/db/schema");
      await db
        .update(workflowsTable)
        .set({ conversationId: newConversation.id })
        .where(eq(workflowsTable.id, validatedData.workflowId));
    }

    return NextResponse.json({
      conversation: newConversation,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error("Create conversation error:", error);
    return NextResponse.json(
      { error: "Failed to create conversation" },
      { status: 500 }
    );
  }
}
