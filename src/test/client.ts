import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

async function main() {
  const url = new URL(process.env.MCP_URL || 'http://localhost:3000/mcp');

  const client = new Client({ name: 'sagemath-test-client', version: '0.0.1' });
  const transport = new StreamableHTTPClientTransport(url);

  await client.connect(transport);

  // List available tools
  const tools = await client.listTools();
  console.log('Available tools:', tools.tools.map(t => t.name));

  // Call version tool
  const versionResult = await client.callTool({ name: 'sagemath.version', arguments: {} });
  console.log('sagemath.version result:', JSON.stringify(versionResult));

  // Call evaluate tool
  const evalResult = await client.callTool({ name: 'sagemath.evaluate', arguments: { code: 'print(2+2)' } });
  console.log('sagemath.evaluate result:', JSON.stringify(evalResult));

  await client.close();
}

main().catch((error) => {
  console.error('MCP test client error:', error);
  process.exit(1);
});