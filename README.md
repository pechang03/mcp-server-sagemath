# MCP SageMath Server

A Model Context Protocol (MCP) server that provides comprehensive SageMath mathematical computation capabilities to AI assistants.

**Version**: 0.1.0  
**License**: MIT

## Features

### 🧮 Mathematical Tools
- **sagemath.version** - Query SageMath version
- **sagemath.evaluate** - Execute arbitrary SageMath code
- **sagemath.factor** - Factor integers and polynomials
- **sagemath.solve** - Solve equations symbolically
- **sagemath.graph_properties** - Compute graph theory properties
- **sagemath.simplify** - Simplify mathematical expressions
- **sagemath.integrate** - Symbolic integration (definite/indefinite)
- **sagemath.differentiate** - Symbolic differentiation

### 🚀 Server Features
- **Dual Transport Modes**: STDIO (default) and HTTP
- **Stateless HTTP Sessions**: No initialization errors from repeated connects
- **Robust Error Handling**: Structured errors, never crashes
- **Configurable Paths**: Source config, environment variable, or system PATH
- **Timeout Protection**: All operations have configurable timeouts
- **Clean Temporary Files**: Automatic cleanup after execution

## Requirements

- **Node.js** 18+ (20+ recommended)
- **SageMath** installed and accessible via command line

## Installation

```bash
cd mcp-servers/mcp-server-sagemath
npm install
npm run build
```

## Configuration

The server locates SageMath in this priority order:

1. `src/config.ts` → `config.sagePath` (if set)
2. Environment variable `SAGE_PATH`
3. System PATH (`sage` command)

### Setting Custom Path

**Via Environment Variable:**
```bash
export SAGE_PATH="/Applications/SageMath-10-7.app/Contents/Frameworks/Sage.framework/Versions/10.7/local/bin/sage"
```

**Via config.ts:**
```typescript
export const config = {
  sagePath: "/path/to/sage",
};
```

## Usage

### STDIO Mode (Default)

**Run the server:**
```bash
node dist/index.js
```

**MCP Client Configuration (Warp, Claude Desktop, etc.):**
```json
{
  "mcpServers": {
    "sagemath": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-server-sagemath/dist/index.js"],
      "env": {
        "SAGE_PATH": "/path/to/sage"
      }
    }
  }
}
```

### HTTP Mode

**Start server:**
```bash
MCP_TRANSPORT=http npm run dev
```

**Access at:** `http://localhost:3000/mcp`

**Change port:**
```bash
PORT=8080 MCP_TRANSPORT=http npm run dev
```

**Endpoints:**
- `GET /mcp` - Server-Sent Events / Streaming JSON-RPC
- `POST /mcp` - Standard JSON-RPC over HTTP

## Available Tools

### 1. sagemath.version
Get SageMath version information.

**Parameters:** None

### 2. sagemath.evaluate
Execute arbitrary SageMath code.

**Parameters:**
- `code` (string, required) - SageMath code to execute
- `timeoutMs` (number, optional) - Timeout in milliseconds (default: 10000)

### 3. sagemath.factor
Factor an integer or polynomial.

**Parameters:**
- `input` (string | number, required) - Number or expression to factor
- `timeoutMs` (number, optional) - Timeout (default: 10000ms)

**Output:**
```json
{
  "success": true,
  "result": "3^2 * 3607 * 3803"
}
```

### 4. sagemath.solve
Solve equations symbolically.

**Parameters:**
- `equation` (string, required) - Equation to solve (e.g., "x^2 + 2*x + 1 = 0")
- `variable` (string, optional) - Variable to solve for (default: "x")
- `timeoutMs` (number, optional) - Timeout (default: 15000ms)

### 5. sagemath.graph_properties
Compute graph theory properties.

**Parameters:**
- `edges` (array, required) - List of edges as `[u, v]` pairs
- `vertices` (array, optional) - List of vertices
- `properties` (string[], required) - Properties to compute
- `timeoutMs` (number, optional) - Timeout (default: 20000ms)

**Available Properties:**
- `chromatic_number`, `clique_number`, `independence_number`
- `diameter`, `girth`, `vertex_connectivity`, `edge_connectivity`
- `num_vertices`, `num_edges`
- `is_connected`, `is_planar`, `is_bipartite`

### 6. sagemath.simplify
Simplify a mathematical expression.

### 7. sagemath.integrate
Compute symbolic integration (definite or indefinite).

### 8. sagemath.differentiate
Compute symbolic differentiation (with configurable order).

## AI Assistant Usage Examples

**Factor a large number:**
> "Use SageMath to factor 2^67 - 1"

**Solve a quadratic:**
> "Solve x^2 + 5x + 6 = 0 using SageMath"

**Graph properties:**
> "Calculate the chromatic number of the Petersen graph"

**Integration:**
> "Integrate x^2 * sin(x) with respect to x"

## Security Considerations

⚠️ **Important**: `sagemath.evaluate` can execute arbitrary SageMath code. Use only in trusted environments.

**Recommendations:**
- Deploy behind authentication
- Use containerization (Docker, etc.)
- Set resource limits
- Implement rate limiting

## Troubleshooting

### SageMath not found
```bash
# Check if sage is in PATH
which sage

# Set SAGE_PATH explicitly
export SAGE_PATH="/path/to/sage"

# Verify it works
sage --version
```

### Server not connecting in Warp
1. Restart Warp completely
2. Verify config: `cat ~/.config/warp/warp_mcp_config.json`
3. Check server builds: `npm run build`

## Acknowledgments

- [Model Context Protocol](https://modelcontextprotocol.io/)
- [SageMath](https://www.sagemath.org/)
- Original by [GaloisHLee](https://github.com/GaloisHLee/mcp-server-sagemath)

## License

MIT License
