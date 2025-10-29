import express from 'express';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { evaluateSage, getSageVersion } from './tools/sagemath.js';

const server = new McpServer({
  name: 'mcp-server-sagemath',
  version: '0.0.1',
});

server.registerTool(
  'sagemath.version',
  {
    title: 'SageMath Version',
    description: 'Get local SageMath version information',
    inputSchema: {},
    outputSchema: {
      stdout: z.string(),
      stderr: z.string(),
      exitCode: z.number().nullable(),
      durationMs: z.number(),
      timedOut: z.boolean(),
    },
  },
  async () => {
    const result = await getSageVersion();
    const structured = result as unknown as Record<string, unknown>;
    return {
      content: [{ type: 'text', text: JSON.stringify(structured) }],
      structuredContent: structured,
    };
  }
);

server.registerTool(
  'sagemath.evaluate',
  {
    title: 'SageMath Evaluate',
    description: 'Evaluate SageMath code locally',
    inputSchema: {
      code: z.string(),
      timeoutMs: z.number().int().positive().optional(),
    },
    outputSchema: {
      stdout: z.string(),
      stderr: z.string(),
      exitCode: z.number().nullable(),
      durationMs: z.number(),
      timedOut: z.boolean(),
    },
  },
  async ({ code, timeoutMs }) => {
    const result = await evaluateSage(code, timeoutMs ?? 10000);
    const structured = result as unknown as Record<string, unknown>;
    return {
      content: [{ type: 'text', text: JSON.stringify(structured) }],
      structuredContent: structured,
    };
  }
);

const mode = (process.env.MCP_TRANSPORT || '').toLowerCase();

if (mode === 'http') {
  const app = express();
  app.use(express.json());

  // Create a single transport instance shared across routes so sessions persist
  const transport = new StreamableHTTPServerTransport({
    // Use stateless mode to allow repeated initialize from fresh clients
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });

  await server.connect(transport);

  // JSON-RPC over HTTP for requests
  app.post('/mcp', async (req: Request, res: Response) => {
    await transport.handleRequest(req, res, req.body);
  });

  // Server-Sent Events or GET handler on base endpoint (client expects GET /mcp)
  app.get('/mcp', async (req: Request, res: Response) => {
    await transport.handleRequest(req, res);
  });

  const port = parseInt(process.env.PORT || '3000', 10);
  app
    .listen(port, () => {
      console.log(`MCP SageMath Server running on http://localhost:${port}/mcp`);
    })
    .on('error', (error: unknown) => {
      console.error('Server error:', error);
      process.exit(1);
    });
} else {
  // Default to stdio transport to be compatible with Trae MCP `command` integration.
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // IMPORTANT: Do not log to stdout in stdio mode as it will corrupt JSON-RPC frames.
}