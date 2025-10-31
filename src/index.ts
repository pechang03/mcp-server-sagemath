import express from 'express';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { evaluateSage, getSageVersion } from './tools/sagemath.js';
import { 
  factorNumber, 
  solveEquation, 
  graphProperties,
  simplifyExpression,
  integrateExpression,
  differentiateExpression
} from './tools/specialized.js';

const server = new McpServer({
  name: 'mcp-server-sagemath',
  version: '0.1.0',
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

// Factor numbers or polynomials
server.registerTool(
  'sagemath.factor',
  {
    title: 'Factor Number',
    description: 'Factor an integer or polynomial using SageMath',
    inputSchema: {
      input: z.union([z.string(), z.number()]).describe('Number or expression to factor'),
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
  async ({ input, timeoutMs }) => {
    const result = await factorNumber(input, timeoutMs ?? 10000);
    const structured = result as unknown as Record<string, unknown>;
    return {
      content: [{ type: 'text', text: JSON.stringify(structured) }],
      structuredContent: structured,
    };
  }
);

// Solve equations
server.registerTool(
  'sagemath.solve',
  {
    title: 'Solve Equation',
    description: 'Solve an equation symbolically',
    inputSchema: {
      equation: z.string().describe('Equation to solve (e.g., "x^2 + 2*x + 1 = 0")'),
      variable: z.string().optional().default('x').describe('Variable to solve for'),
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
  async ({ equation, variable, timeoutMs }) => {
    const result = await solveEquation(equation, variable ?? 'x', timeoutMs ?? 15000);
    const structured = result as unknown as Record<string, unknown>;
    return {
      content: [{ type: 'text', text: JSON.stringify(structured) }],
      structuredContent: structured,
    };
  }
);

// Graph properties
server.registerTool(
  'sagemath.graph_properties',
  {
    title: 'Graph Properties',
    description: 'Compute graph theory properties (chromatic number, clique number, etc.)',
    inputSchema: {
      vertices: z.array(z.any()).optional().describe('List of vertices'),
      edges: z.array(z.tuple([z.any(), z.any()])).describe('List of edges as [u, v] pairs'),
      properties: z.array(z.string()).describe('Properties to compute (e.g., chromatic_number, clique_number, diameter)'),
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
  async ({ vertices, edges, properties, timeoutMs }) => {
    const result = await graphProperties({ vertices, edges }, properties, timeoutMs ?? 20000);
    const structured = result as unknown as Record<string, unknown>;
    return {
      content: [{ type: 'text', text: JSON.stringify(structured) }],
      structuredContent: structured,
    };
  }
);

// Simplify expressions
server.registerTool(
  'sagemath.simplify',
  {
    title: 'Simplify Expression',
    description: 'Simplify a mathematical expression',
    inputSchema: {
      expression: z.string().describe('Expression to simplify'),
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
  async ({ expression, timeoutMs }) => {
    const result = await simplifyExpression(expression, timeoutMs ?? 10000);
    const structured = result as unknown as Record<string, unknown>;
    return {
      content: [{ type: 'text', text: JSON.stringify(structured) }],
      structuredContent: structured,
    };
  }
);

// Integration
server.registerTool(
  'sagemath.integrate',
  {
    title: 'Integrate Expression',
    description: 'Compute symbolic integration (definite or indefinite)',
    inputSchema: {
      expression: z.string().describe('Expression to integrate'),
      variable: z.string().describe('Variable to integrate with respect to'),
      lower: z.string().optional().describe('Lower limit (for definite integral)'),
      upper: z.string().optional().describe('Upper limit (for definite integral)'),
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
  async ({ expression, variable, lower, upper, timeoutMs }) => {
    const limits = (lower && upper) ? { lower, upper } : undefined;
    const result = await integrateExpression(expression, variable, limits, timeoutMs ?? 15000);
    const structured = result as unknown as Record<string, unknown>;
    return {
      content: [{ type: 'text', text: JSON.stringify(structured) }],
      structuredContent: structured,
    };
  }
);

// Differentiation
server.registerTool(
  'sagemath.differentiate',
  {
    title: 'Differentiate Expression',
    description: 'Compute symbolic differentiation',
    inputSchema: {
      expression: z.string().describe('Expression to differentiate'),
      variable: z.string().describe('Variable to differentiate with respect to'),
      order: z.number().int().positive().optional().default(1).describe('Order of differentiation'),
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
  async ({ expression, variable, order, timeoutMs }) => {
    const result = await differentiateExpression(expression, variable, order ?? 1, timeoutMs ?? 10000);
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