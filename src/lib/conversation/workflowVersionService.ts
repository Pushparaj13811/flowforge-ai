/**
 * @file workflowVersionService.ts
 * @description API service for workflow versions
 */

export interface WorkflowVersion {
  id: string;
  workflowId: string;
  conversationId?: string | null;
  messageId?: string | null;
  nodes: unknown[];
  edges: unknown[];
  changeDescription?: string | null;
  changeType?: string | null;
  changedBy: string;
  nodeCount: number;
  createdAt: string;
  message?: {
    role: string;
    content: string;
  };
}

export const workflowVersionAPIService = {
  /**
   * Fetch versions for a workflow
   */
  async getVersions(workflowId: string): Promise<WorkflowVersion[]> {
    try {
      const response = await fetch(`/api/workflows/${workflowId}/versions`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch versions");
      }

      const data = await response.json();
      return data.versions || [];
    } catch (error) {
      console.error("[workflowVersionService] Failed to fetch versions:", error);
      return [];
    }
  },

  /**
   * Get a specific version
   */
  async getVersion(workflowId: string, versionId: string): Promise<WorkflowVersion | null> {
    try {
      const response = await fetch(
        `/api/workflows/${workflowId}/versions/${versionId}`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch version");
      }

      const data = await response.json();
      return data.version || null;
    } catch (error) {
      console.error("[workflowVersionService] Failed to fetch version:", error);
      return null;
    }
  },

  /**
   * Rollback to a specific version
   */
  async rollbackToVersion(
    workflowId: string,
    versionId: string
  ): Promise<{ success: boolean; nodes?: unknown[]; edges?: unknown[] }> {
    try {
      const response = await fetch(
        `/api/workflows/${workflowId}/versions/${versionId}/rollback`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to rollback");
      }

      const data = await response.json();
      return {
        success: true,
        nodes: data.nodes,
        edges: data.edges,
      };
    } catch (error) {
      console.error("[workflowVersionService] Failed to rollback:", error);
      return { success: false };
    }
  },
};
