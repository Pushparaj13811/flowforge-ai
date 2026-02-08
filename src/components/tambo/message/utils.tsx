"use client";

import * as React from "react";
import { cva } from "class-variance-authority";
import type { TamboThreadMessage } from "@tambo-ai/react";
import type TamboAI from "@tambo-ai/typescript-sdk";
import stringify from "json-stringify-pretty-compact";
import { Streamdown } from "streamdown";
import { cn } from "@/lib/utils";
import { getSafeContent } from "@/lib/thread-hooks";
import { markdownComponents } from "../markdown-components";

/**
 * CSS variants for the message container
 */
export const messageVariants = cva("flex", {
  variants: {
    variant: {
      default: "",
      solid: [
        "[&>div>div:first-child]:shadow-md",
        "[&>div>div:first-child]:bg-container/50",
        "[&>div>div:first-child]:hover:bg-container",
        "[&>div>div:first-child]:transition-all",
        "[&>div>div:first-child]:duration-200",
      ].join(" "),
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

/**
 * Converts message content to markdown format for rendering with streamdown.
 * Handles text and resource content parts, converting resources to markdown links
 * with a custom URL scheme that will be rendered as Mention components.
 */
export function convertContentToMarkdown(
  content: TamboThreadMessage["content"] | React.ReactNode | undefined | null,
): string {
  if (!content) return "";
  if (typeof content === "string") return content;
  if (React.isValidElement(content)) {
    return "";
  }
  if (Array.isArray(content)) {
    const parts: string[] = [];
    for (const item of content) {
      if (item?.type === "text") {
        parts.push(item.text ?? "");
      } else if (item?.type === "resource") {
        const resource = item.resource;
        const uri = resource?.uri;
        if (uri) {
          const displayName = resource?.name ?? uri;
          const encodedUri = encodeURIComponent(uri);
          parts.push(`[${displayName}](tambo-resource://${encodedUri})`);
        }
      }
    }
    return parts.join(" ");
  }
  return "";
}

/**
 * Get the tool call request from the message, or the component tool call request
 */
export function getToolCallRequest(
  message: TamboThreadMessage,
): TamboAI.ToolCallRequest | undefined {
  return message.toolCallRequest ?? message.component?.toolCallRequest;
}

export function getToolStatusMessage(
  message: TamboThreadMessage,
  isLoading: boolean | undefined,
) {
  if (message.role !== "assistant" || !getToolCallRequest(message)) {
    return null;
  }

  const toolCallMessage = isLoading
    ? `Calling ${getToolCallRequest(message)?.toolName ?? "tool"}`
    : `Called ${getToolCallRequest(message)?.toolName ?? "tool"}`;
  const toolStatusMessage = isLoading
    ? message.component?.statusMessage
    : message.component?.completionStatusMessage;
  return toolStatusMessage ?? toolCallMessage;
}

export function keyifyParameters(parameters: TamboAI.ToolCallParameter[] | undefined) {
  if (!parameters) return;
  return Object.fromEntries(
    parameters.map((p) => [p.parameterName, p.parameterValue]),
  );
}

/**
 * Formats the reasoning duration in a human-readable format
 */
export function formatReasoningDuration(durationMS: number) {
  const seconds = Math.floor(Math.max(0, durationMS) / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (seconds < 1) return "Thought for less than 1 second";
  if (seconds < 60)
    return `Thought for ${seconds} ${seconds === 1 ? "second" : "seconds"}`;
  if (minutes < 60)
    return `Thought for ${minutes} ${minutes === 1 ? "minute" : "minutes"}`;
  return `Thought for ${hours} ${hours === 1 ? "hour" : "hours"}`;
}

/**
 * Renders an image content part from a tool result.
 */
export function renderImageContent(url: string, index: number): React.ReactNode {
  return (
    <div
      key={`image-${index}`}
      className="rounded-md overflow-hidden shadow-sm max-w-xs"
    >
      <img
        src={url}
        alt={`Tool result image ${index + 1}`}
        loading="lazy"
        decoding="async"
        className="max-w-full h-auto object-contain"
      />
    </div>
  );
}

/**
 * Renders a resource content part from a tool result.
 */
export function renderResourceContent(
  resource: {
    uri?: string;
    text?: string;
    blob?: string;
    name?: string;
    mimeType?: string;
  },
  index: number,
): React.ReactNode {
  if (resource.blob && resource.mimeType?.startsWith("image/")) {
    const dataUrl = `data:${resource.mimeType};base64,${resource.blob}`;
    return (
      <div
        key={`resource-blob-${index}`}
        className="rounded-md overflow-hidden shadow-sm max-w-xs"
      >
        <img
          src={dataUrl}
          alt={resource.name ?? `Resource image ${index + 1}`}
          loading="lazy"
          decoding="async"
          className="max-w-full h-auto object-contain"
        />
      </div>
    );
  }

  if (resource.text) {
    return (
      <div key={`resource-text-${index}`} className="whitespace-pre-wrap">
        {resource.name && (
          <span className="font-medium text-muted-foreground">
            {resource.name}:{" "}
          </span>
        )}
        {resource.text}
      </div>
    );
  }

  if (resource.uri) {
    return (
      <div key={`resource-uri-${index}`} className="flex items-center gap-1">
        <span className="font-medium text-muted-foreground">
          {resource.name ?? "Resource"}:
        </span>
        <span className="font-mono text-xs truncate">{resource.uri}</span>
      </div>
    );
  }

  return null;
}

/**
 * Formats text content, attempting JSON parsing for pretty-printing.
 */
export function formatTextContent(
  text: string,
  enableMarkdown: boolean,
): React.ReactNode {
  if (!text) return null;

  try {
    const parsed = JSON.parse(text);
    return (
      <pre
        className={cn(
          "bg-muted/50 rounded-md p-3 text-xs overflow-x-auto overflow-y-auto max-w-full max-h-64",
        )}
      >
        <code className="font-mono break-words whitespace-pre-wrap">
          {JSON.stringify(parsed, null, 2)}
        </code>
      </pre>
    );
  } catch {
    if (!enableMarkdown) return text;
    return <Streamdown components={markdownComponents}>{text}</Streamdown>;
  }
}

/**
 * Helper function to detect if content is JSON and format it nicely.
 */
export function formatToolResult(
  content: TamboThreadMessage["content"],
  enableMarkdown = true,
): React.ReactNode {
  if (!content) return content;

  if (typeof content === "string") {
    return formatTextContent(content, enableMarkdown);
  }

  if (Array.isArray(content)) {
    const textParts: string[] = [];
    const nonTextParts: React.ReactNode[] = [];

    content.forEach((item, index) => {
      if (!item?.type) return;

      if (item.type === "text" && item.text) {
        textParts.push(item.text);
      } else if (item.type === "image_url" && item.image_url?.url) {
        nonTextParts.push(renderImageContent(item.image_url.url, index));
      } else if (item.type === "resource" && item.resource) {
        const resourceNode = renderResourceContent(item.resource, index);
        if (resourceNode) {
          nonTextParts.push(resourceNode);
        }
      }
    });

    const combinedText = textParts.join("");
    const textNode = combinedText
      ? formatTextContent(combinedText, enableMarkdown)
      : null;

    if (nonTextParts.length === 0) {
      return textNode;
    }

    return (
      <div className="flex flex-col gap-2">
        {textNode}
        {nonTextParts.length > 0 && (
          <div className="flex flex-wrap gap-2">{nonTextParts}</div>
        )}
      </div>
    );
  }

  return getSafeContent(content);
}
