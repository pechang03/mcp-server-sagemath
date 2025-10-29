import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

async function main() {
  const url = new URL(process.env.MCP_URL || 'http://localhost:3001/mcp');

  const client = new Client({ name: 'sagemath-lattice-client', version: '0.0.1' });
  const transport = new StreamableHTTPClientTransport(url);

  await client.connect(transport);

  const sageCode = `
from sage.all import *
n = 8
A = random_matrix(ZZ, n, n, x=-20, y=20)
print("A (random integer matrix):")
print(A)
print("")
print("Det(A):", A.det())

# LLL lattice reduction on row lattice
try:
    B = A.LLL()
    print("")
    print("LLL-reduced basis (rows):")
    print(B)
    print("")
    print("Rank(A), Rank(B):", A.rank(), B.rank())
except Exception as e:
    print("")
    print("LLL error:", e)

# Hermite Normal Form (HNF)
try:
    H = A.hermite_form()
    print("")
    print("Hermite Normal Form (HNF):")
    print(H)
except Exception as e:
    print("")
    print("HNF error:", e)
`;

  const result: any = await client.callTool({ name: 'sagemath.evaluate', arguments: { code: sageCode, timeoutMs: 20000 } });

  const structured = result?.structuredContent;
  let payload = structured;
  if (!payload && Array.isArray(result?.content) && result.content[0]?.type === 'text') {
    try { payload = JSON.parse(result.content[0].text); } catch {}
  }

  if (payload) {
    console.log('--- SageMath MCP Evaluate Result ---');
    console.log('Exit code:', payload.exitCode);
    console.log('Duration (ms):', payload.durationMs, 'Timed out:', payload.timedOut);
    console.log('\nstdout:\n');
    console.log(payload.stdout || '');
    if (payload.stderr) {
      console.log('\nstderr:\n');
      console.log(payload.stderr);
    }
  } else {
    console.log('Raw result:', JSON.stringify(result));
  }

  await client.close();
}

main().catch((error) => {
  console.error('SageMath lattice test client error:', error);
  process.exit(1);
});