/**
 * @file google-sheets-handler.ts
 * @description Google Sheets integration handler
 */

import { BaseNodeHandler } from './base-handler';
import type { NodeExecutionResult, ExecutionContext } from '../types';
import type { WorkflowNodeData } from '@/components/flow-editor/types';
import { getTokenManager } from '@/lib/oauth/token-manager';
import { logIntegrationUsage } from '@/lib/monitoring/logger';
import { withRetry, WorkflowExecutionError, ErrorType } from '../error-handler';
import { google } from 'googleapis';

/**
 * Google Sheets - Read Rows Handler
 */
export class GoogleSheetsReadHandler extends BaseNodeHandler {
  protected nodeType = 'google-sheets:read';

  async execute(
    node: WorkflowNodeData,
    context: ExecutionContext,
    config?: any
  ): Promise<NodeExecutionResult> {
    const startTime = Date.now();

    try {
      const resolvedConfig = this.resolveConfig(config || ((node as any).data).config, context);

      const {
        integrationId,
        spreadsheetId,
        range, // e.g., "Sheet1!A1:D10"
        majorDimension = 'ROWS', // ROWS or COLUMNS
      } = resolvedConfig;

      if (!integrationId) {
        throw new Error('Integration ID is required');
      }

      if (!spreadsheetId) {
        throw new Error('Spreadsheet ID is required');
      }

      if (!range) {
        throw new Error('Range is required (e.g., "Sheet1!A1:D10")');
      }

      // Get OAuth token
      const tokenManager = getTokenManager();
      const accessToken = await tokenManager.getValidToken(integrationId);

      // Initialize Google Sheets API
      const sheets = google.sheets({
        version: 'v4',
        auth: accessToken,
      });

      // Read data with retry
      const result = await withRetry(
        async () => {
          const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range,
            majorDimension,
          });

          return response.data;
        },
        { maxAttempts: 3, initialDelay: 1000 },
        { nodeId: ((node as any).id as string), nodeType: this.nodeType }
      );

      logIntegrationUsage({
        integrationId,
        integrationType: 'google-sheets',
        action: 'read-rows',
        success: true,
        duration: Date.now() - startTime,
      });

      return this.success(
        {
          range: result.range,
          majorDimension: result.majorDimension,
          values: result.values || [],
          rowCount: result.values?.length || 0,
        },
        startTime
      );
    } catch (error) {
      this.log('error', 'Google Sheets read failed', { error });

      logIntegrationUsage({
        integrationId: config?.integrationId,
        integrationType: 'google-sheets',
        action: 'read-rows',
        success: false,
        duration: Date.now() - startTime,
      });

      return this.failure(error as Error, startTime);
    }
  }
}

/**
 * Google Sheets - Append Rows Handler
 */
export class GoogleSheetsAppendHandler extends BaseNodeHandler {
  protected nodeType = 'google-sheets:append';

  async execute(
    node: WorkflowNodeData,
    context: ExecutionContext,
    config?: any
  ): Promise<NodeExecutionResult> {
    const startTime = Date.now();

    try {
      const resolvedConfig = this.resolveConfig(config || ((node as any).data).config, context);

      const {
        integrationId,
        spreadsheetId,
        range, // e.g., "Sheet1!A1:D1" (starting row)
        values, // 2D array: [["col1", "col2"], ["val1", "val2"]]
        valueInputOption = 'USER_ENTERED', // USER_ENTERED or RAW
      } = resolvedConfig;

      if (!integrationId) {
        throw new Error('Integration ID is required');
      }

      if (!spreadsheetId) {
        throw new Error('Spreadsheet ID is required');
      }

      if (!range) {
        throw new Error('Range is required');
      }

      if (!values || !Array.isArray(values)) {
        throw new Error('Values must be a 2D array');
      }

      // Get OAuth token
      const tokenManager = getTokenManager();
      const accessToken = await tokenManager.getValidToken(integrationId);

      // Initialize Google Sheets API
      const sheets = google.sheets({
        version: 'v4',
        auth: accessToken,
      });

      // Append data with retry
      const result = await withRetry(
        async () => {
          const response = await sheets.spreadsheets.values.append({
            spreadsheetId,
            range,
            valueInputOption,
            requestBody: {
              values,
            },
          });

          return response.data;
        },
        { maxAttempts: 3, initialDelay: 1000 },
        { nodeId: ((node as any).id as string), nodeType: this.nodeType }
      );

      logIntegrationUsage({
        integrationId,
        integrationType: 'google-sheets',
        action: 'append-rows',
        success: true,
        duration: Date.now() - startTime,
      });

      return this.success(
        {
          spreadsheetId: result.spreadsheetId,
          tableRange: result.tableRange,
          updates: result.updates,
        },
        startTime
      );
    } catch (error) {
      this.log('error', 'Google Sheets append failed', { error });

      logIntegrationUsage({
        integrationId: config?.integrationId,
        integrationType: 'google-sheets',
        action: 'append-rows',
        success: false,
        duration: Date.now() - startTime,
      });

      return this.failure(error as Error, startTime);
    }
  }
}

/**
 * Google Sheets - Update Rows Handler
 */
export class GoogleSheetsUpdateHandler extends BaseNodeHandler {
  protected nodeType = 'google-sheets:update';

  async execute(
    node: WorkflowNodeData,
    context: ExecutionContext,
    config?: any
  ): Promise<NodeExecutionResult> {
    const startTime = Date.now();

    try {
      const resolvedConfig = this.resolveConfig(config || ((node as any).data).config, context);

      const {
        integrationId,
        spreadsheetId,
        range, // e.g., "Sheet1!A2:D2" (specific row)
        values,
        valueInputOption = 'USER_ENTERED',
      } = resolvedConfig;

      if (!integrationId) {
        throw new Error('Integration ID is required');
      }

      if (!spreadsheetId) {
        throw new Error('Spreadsheet ID is required');
      }

      if (!range) {
        throw new Error('Range is required');
      }

      if (!values || !Array.isArray(values)) {
        throw new Error('Values must be a 2D array');
      }

      // Get OAuth token
      const tokenManager = getTokenManager();
      const accessToken = await tokenManager.getValidToken(integrationId);

      // Initialize Google Sheets API
      const sheets = google.sheets({
        version: 'v4',
        auth: accessToken,
      });

      // Update data with retry
      const result = await withRetry(
        async () => {
          const response = await sheets.spreadsheets.values.update({
            spreadsheetId,
            range,
            valueInputOption,
            requestBody: {
              values,
            },
          });

          return response.data;
        },
        { maxAttempts: 3, initialDelay: 1000 },
        { nodeId: ((node as any).id as string), nodeType: this.nodeType }
      );

      logIntegrationUsage({
        integrationId,
        integrationType: 'google-sheets',
        action: 'update-rows',
        success: true,
        duration: Date.now() - startTime,
      });

      return this.success(
        {
          spreadsheetId: result.spreadsheetId,
          updatedRange: result.updatedRange,
          updatedRows: result.updatedRows,
          updatedColumns: result.updatedColumns,
          updatedCells: result.updatedCells,
        },
        startTime
      );
    } catch (error) {
      this.log('error', 'Google Sheets update failed', { error });

      logIntegrationUsage({
        integrationId: config?.integrationId,
        integrationType: 'google-sheets',
        action: 'update-rows',
        success: false,
        duration: Date.now() - startTime,
      });

      return this.failure(error as Error, startTime);
    }
  }
}

/**
 * Google Sheets - Create Spreadsheet Handler
 */
export class GoogleSheetsCreateHandler extends BaseNodeHandler {
  protected nodeType = 'google-sheets:create';

  async execute(
    node: WorkflowNodeData,
    context: ExecutionContext,
    config?: any
  ): Promise<NodeExecutionResult> {
    const startTime = Date.now();

    try {
      const resolvedConfig = this.resolveConfig(config || ((node as any).data).config, context);

      const {
        integrationId,
        title,
        sheets: sheetConfigs = [{ properties: { title: 'Sheet1' } }],
      } = resolvedConfig;

      if (!integrationId) {
        throw new Error('Integration ID is required');
      }

      if (!title) {
        throw new Error('Spreadsheet title is required');
      }

      // Get OAuth token
      const tokenManager = getTokenManager();
      const accessToken = await tokenManager.getValidToken(integrationId);

      // Initialize Google Sheets API
      const sheets = google.sheets({
        version: 'v4',
        auth: accessToken,
      });

      // Create spreadsheet with retry
      const result = await withRetry(
        async () => {
          const response = await sheets.spreadsheets.create({
            requestBody: {
              properties: {
                title,
              },
              sheets: sheetConfigs,
            },
          });

          return response.data;
        },
        { maxAttempts: 3, initialDelay: 1000 },
        { nodeId: ((node as any).id as string), nodeType: this.nodeType }
      );

      logIntegrationUsage({
        integrationId,
        integrationType: 'google-sheets',
        action: 'create-spreadsheet',
        success: true,
        duration: Date.now() - startTime,
      });

      return this.success(
        {
          spreadsheetId: result.spreadsheetId,
          spreadsheetUrl: result.spreadsheetUrl,
          title: result.properties?.title,
        },
        startTime
      );
    } catch (error) {
      this.log('error', 'Google Sheets create failed', { error });

      logIntegrationUsage({
        integrationId: config?.integrationId,
        integrationType: 'google-sheets',
        action: 'create-spreadsheet',
        success: false,
        duration: Date.now() - startTime,
      });

      return this.failure(error as Error, startTime);
    }
  }
}
