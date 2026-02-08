"use client";

import type { VariantProps } from "class-variance-authority";
import type { TamboEditor, PromptItem, ResourceItem } from "../text-editor";
import type { TamboElicitationRequest, TamboElicitationResponse } from "@tambo-ai/react/mcp";
import type { StagedImage } from "@tambo-ai/react";
import type { messageInputVariants } from "./constants";

/**
 * Provider interface for searching resources (for "@" mentions).
 * Empty query string "" should return all available resources.
 */
export interface ResourceProvider {
  /** Search for resources matching the query */
  search(query: string): Promise<ResourceItem[]>;
}

/**
 * Provider interface for searching and fetching prompts (for "/" commands).
 * Empty query string "" should return all available prompts.
 */
export interface PromptProvider {
  /** Search for prompts matching the query */
  search(query: string): Promise<PromptItem[]>;
  /** Get the full prompt details including text by ID */
  get(id: string): Promise<PromptItem>;
}

/**
 * @typedef MessageInputContextValue
 * @property {string} value - The current input value
 * @property {function} setValue - Function to update the input value
 * @property {function} submit - Function to submit the message
 * @property {function} handleSubmit - Function to handle form submission
 * @property {boolean} isPending - Whether a submission is in progress
 * @property {Error|null} error - Any error from the submission
 * @property {TamboEditor|null} editorRef - Reference to the TamboEditor instance
 * @property {string | null} submitError - Error from the submission
 * @property {function} setSubmitError - Function to set the submission error
 * @property {string | null} imageError - Error related to image uploads
 * @property {function} setImageError - Function to set the image upload error
 * @property {TamboElicitationRequest | null} elicitation - Current elicitation request (read-only)
 * @property {function} resolveElicitation - Function to resolve the elicitation promise (automatically clears state)
 */
export interface MessageInputContextValue {
  value: string;
  setValue: (value: string) => void;
  submit: (options: {
    streamResponse?: boolean;
    resourceNames: Record<string, string>;
  }) => Promise<void>;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  isPending: boolean;
  error: Error | null;
  editorRef: React.RefObject<TamboEditor>;
  submitError: string | null;
  setSubmitError: React.Dispatch<React.SetStateAction<string | null>>;
  imageError: string | null;
  setImageError: React.Dispatch<React.SetStateAction<string | null>>;
  elicitation: TamboElicitationRequest | null;
  resolveElicitation: ((response: TamboElicitationResponse) => void) | null;
}

/**
 * Props for the MessageInput component.
 * Extends standard HTMLFormElement attributes.
 */
export interface MessageInputProps extends React.HTMLAttributes<HTMLFormElement> {
  /** Optional styling variant for the input container. */
  variant?: VariantProps<typeof messageInputVariants>["variant"];
  /** Optional ref to forward to the TamboEditor instance. */
  inputRef?: React.RefObject<TamboEditor>;
  /** The child elements to render within the form container. */
  children?: React.ReactNode;
}

/**
 * Props for the MessageInputTextarea component.
 * Extends standard TextareaHTMLAttributes.
 */
export interface MessageInputTextareaProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Custom placeholder text. */
  placeholder?: string;
  /** Resource provider for @ mentions (optional - includes interactables by default) */
  resourceProvider?: ResourceProvider;
  /** Prompt provider for / commands (optional) */
  promptProvider?: PromptProvider;
  /** Callback when a resource is selected from @ mentions (optional) */
  onResourceSelect?: (item: ResourceItem) => void;
}

/**
 * Props for the legacy plain textarea message input component.
 * This preserves the original MessageInput.Textarea API for backward compatibility.
 */
export interface MessageInputPlainTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Custom placeholder text. */
  placeholder?: string;
}

/**
 * Props for the MessageInputSubmitButton component.
 * Extends standard ButtonHTMLAttributes.
 */
export interface MessageInputSubmitButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Optional content to display inside the button. */
  children?: React.ReactNode;
}

/**
 * Props for the MessageInputError component.
 * Extends standard HTMLParagraphElement attributes.
 */
export type MessageInputErrorProps = React.HTMLAttributes<HTMLParagraphElement>;

/**
 * Props for the MessageInputFileButton component.
 */
export interface MessageInputFileButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Accept attribute for file input - defaults to image types */
  accept?: string;
  /** Allow multiple file selection */
  multiple?: boolean;
}

/**
 * Props for the MessageInputMcpPromptButton component.
 */
export type MessageInputMcpPromptButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

/**
 * Props for the MessageInputMcpResourceButton component.
 */
export type MessageInputMcpResourceButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

/**
 * Props for the MessageInputStagedImages component.
 */
export type MessageInputStagedImagesProps = React.HTMLAttributes<HTMLDivElement>;

/**
 * Props for the ImageContextBadge component.
 */
export interface ImageContextBadgeProps {
  image: StagedImage;
  displayName: string;
  isExpanded: boolean;
  onToggle: () => void;
  onRemove: () => void;
}
