import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/utils";
import { getAllPlatformUsage } from "@/lib/platform-usage";

/**
 * GET /api/platform-usage
 * Get current user's platform usage for all resource types
 */
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const usage = await getAllPlatformUsage(user.id);

    // Format usage by resource type
    const usageByType = usage.reduce((acc, record) => {
      acc[record.resourceType] = {
        count: record.usageCount,
        periodStart: record.periodStart,
        periodEnd: record.periodEnd,
      };
      return acc;
    }, {} as Record<string, { count: number; periodStart: Date; periodEnd: Date }>);

    return NextResponse.json({
      usage: usageByType,
      limits: {
        email: parseInt(process.env.PLATFORM_EMAIL_MONTHLY_LIMIT || "100", 10),
      },
    });
  } catch (error) {
    console.error("Platform usage fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch platform usage" },
      { status: 500 }
    );
  }
}
