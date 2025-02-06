/**
 * @file route.ts
 * @description User notification preferences endpoint
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/utils";
import { createErrorResponse } from "@/types/api";
import { z } from "zod";

// In-memory storage for now (should be in database in production)
const userNotificationPrefs = new Map<string, NotificationSetting[]>();

const NotificationSettingSchema = z.object({
  id: z.string(),
  label: z.string(),
  description: z.string(),
  enabled: z.boolean(),
  category: z.enum(["workflow", "account", "marketing"]),
});

const UpdateNotificationsSchema = z.object({
  notifications: z.array(NotificationSettingSchema),
});

type NotificationSetting = z.infer<typeof NotificationSettingSchema>;

// Default notification settings
const defaultNotifications: NotificationSetting[] = [
  { id: "workflow-success", label: "Workflow Success", description: "Notify when workflows complete", enabled: true, category: "workflow" },
  { id: "workflow-fail", label: "Workflow Failures", description: "Notify when workflows fail", enabled: true, category: "workflow" },
  { id: "workflow-summary", label: "Daily Summary", description: "Daily workflow execution summary", enabled: false, category: "workflow" },
  { id: "account-login", label: "New Login", description: "Alert for new device logins", enabled: true, category: "account" },
  { id: "account-password", label: "Password Changes", description: "Confirm password changes", enabled: true, category: "account" },
  { id: "marketing-updates", label: "Product Updates", description: "New features and updates", enabled: false, category: "marketing" },
  { id: "marketing-tips", label: "Tips & Tutorials", description: "Workflow tips and tutorials", enabled: false, category: "marketing" },
];

/**
 * GET /api/user/notifications - Get notification preferences
 */
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return createErrorResponse("Authentication required", 401);
    }

    const notifications = userNotificationPrefs.get(user.id) || defaultNotifications;

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error("[API] Get notifications error:", error);
    return createErrorResponse(
      "Failed to get notifications",
      500,
      error instanceof Error ? error.message : undefined
    );
  }
}

/**
 * PATCH /api/user/notifications - Update notification preferences
 */
export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return createErrorResponse("Authentication required", 401);
    }

    const body = await request.json();
    const result = UpdateNotificationsSchema.safeParse(body);

    if (!result.success) {
      return createErrorResponse("Invalid request body", 400, result.error.message);
    }

    const { notifications } = result.data;

    // Store in memory (replace with database in production)
    userNotificationPrefs.set(user.id, notifications);

    return NextResponse.json({
      notifications,
      message: "Notification preferences updated",
    });
  } catch (error) {
    console.error("[API] Update notifications error:", error);
    return createErrorResponse(
      "Failed to update notifications",
      500,
      error instanceof Error ? error.message : undefined
    );
  }
}
