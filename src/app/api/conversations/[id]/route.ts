import { NextRequest, NextResponse } from "next/server";
import { db, conversations, messages } from "@/db";
import { eq } from "drizzle-orm";
import { getCurrentUser, getAnonymousId } from "@/lib/auth/utils";
import { z } from "zod";

const updateConversationSchema = z.object({
  title: z.string().optional(),
});

// Helper to check access
async function canAccessConversation(conversationId: string) {
  const user = await getCurrentUser();
  const anonymousId = await getAnonymousId();

  const [conversation] = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, conversationId))
    .limit(1);

  if (!conversation) {
    return { conversation: null, hasAccess: false };
  }

  const isOwner =
    (user && conversation.userId === user.id) ||
    (!user && anonymousId && conversation.anonymousId === anonymousId);

  return { conversation, hasAccess: isOwner };
}

// GET /api/conversations/[id] - Get conversation with messages
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { conversation, hasAccess } = await canAccessConversation(id);

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // Get messages for this conversation
    const conversationMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, id))
      .orderBy(messages.createdAt);

    return NextResponse.json({
      conversation,
      messages: conversationMessages,
    });
  } catch (error) {
    console.error("Get conversation error:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversation" },
      { status: 500 }
    );
  }
}

// PATCH /api/conversations/[id] - Update conversation
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { conversation, hasAccess } = await canAccessConversation(id);

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
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
    const validatedData = updateConversationSchema.parse(body);

    const [updatedConversation] = await db
      .update(conversations)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(conversations.id, id))
      .returning();

    return NextResponse.json({ conversation: updatedConversation });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error("Update conversation error:", error);
    return NextResponse.json(
      { error: "Failed to update conversation" },
      { status: 500 }
    );
  }
}

// DELETE /api/conversations/[id] - Delete conversation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { conversation, hasAccess } = await canAccessConversation(id);

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    await db.delete(conversations).where(eq(conversations.id, id));

    return NextResponse.json({ message: "Conversation deleted" });
  } catch (error) {
    console.error("Delete conversation error:", error);
    return NextResponse.json(
      { error: "Failed to delete conversation" },
      { status: 500 }
    );
  }
}
