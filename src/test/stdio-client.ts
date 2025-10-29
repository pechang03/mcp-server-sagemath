import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

async function main() {
  const client = new Client({ name: 'sagemath-stdio-client', version: '0.0.1' });

  // Spawn the server in stdio mode via tsx (no MCP_TRANSPORT=http env)
  const transport = new StdioClientTransport({
    command: 'npx',
    args: ['-y', 'tsx', '/Users/halois/workdir/Toolkit/mcps/mcp-server-sagemath/src/index.ts'],
  });

  await client.connect(transport);

  // List available tools
  const tools = await client.listTools();
  console.log('Available tools:', tools.tools.map(t => t.name));

  // Call version tool
  const versionResult = await client.callTool({ name: 'sagemath.version', arguments: {} });
  console.log('sagemath.version result:', JSON.stringify(versionResult));

  // Call evaluate tool (simple expression)
  const evalResult = await client.callTool({
    name: 'sagemath.evaluate',
    arguments: { code: 'print(2+3)', timeoutMs: 10000 },
  });
  console.log('sagemath.evaluate result:', JSON.stringify(evalResult));

  await client.close();
}

main().catch((error) => {
  console.error('MCP stdio client error:', error);
  process.exit(1);
});