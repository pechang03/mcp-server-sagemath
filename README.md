# MCP SageMath Server

一个基于 Model Context Protocol (MCP) 的本地 SageMath 工具服务。提供 `sagemath.version` 与 `sagemath.evaluate` 两个工具，通过 HTTP JSON-RPC 与 SSE (`GET /mcp`) 与客户端交互。

## 特色
- 暴露本地 SageMath 能力为 MCP 工具：版本查询与代码执行。
- 无状态会话配置（避免“Server already initialized”重复初始化错误）。
- 健壮的子进程错误处理：当 Sage 未安装或路径错误时返回结构化错误，不会导致服务崩溃。
- JavaScript 配置优先：在 `src/config.ts` 中直接设置 `SAGE_PATH`，无需额外环境变量。

## 先决条件
- `Node.js >= 18`（推荐 20+）。
- 已安装 `SageMath`，并可获得其可执行文件绝对路径（比如 Conda 环境中的 `.../envs/<env>/bin/sage`）。

## 快速开始
1. 安装依赖：
   - `npm install`
2. 配置 Sage 路径（三选一，优先级从高到低）：
   - 在 `src/config.ts` 设置 `config.sagePath` 为 Sage 可执行文件绝对路径；
   - 或设置环境变量 `SAGE_PATH`；
   - 或确保系统 `PATH` 中存在 `sage` 命令。
3. 启动开发服务：
   - `npm run dev`
4. 运行内置测试脚本（示例客户端）：
   - `npx tsx src/test/client.ts`

## 配置说明
- 文件：`src/config.ts`
  - `config.sagePath`：当设置为非空字符串时，优先使用该路径；留空则回退到环境变量 `SAGE_PATH`；若仍为空则使用系统 PATH 中的 `sage`。
- 端口：通过环境变量 `PORT` 配置，默认 `3000`。

## HTTP 端点
- `GET /mcp`：SSE / 流式 JSON-RPC（适配要求 GET 的客户端）。
- `POST /mcp`：JSON-RPC over HTTP（在请求体中携带 JSON-RPC 数据）。

## MCP 工具
- `sagemath.version`
  - 描述：返回本地 SageMath 版本信息。
  - 输出字段：`stdout`, `stderr`, `exitCode`, `durationMs`, `timedOut`。
- `sagemath.evaluate`
  - 输入：`code`（字符串），`timeoutMs`（可选，整数毫秒）。
  - 描述：在本地执行 Sage 代码（暂存到临时文件后运行）。
  - 输出字段：同上。
  - 说明：执行耗时视代码复杂度而定，简单算术通常为数秒内完成。

## 客户端示例
- 直接运行内置测试：`npx tsx src/test/client.ts`。
- 该脚本会：初始化会话、列出工具、调用 `sagemath.version` 与 `sagemath.evaluate` 并打印结构化结果。

## MCP 客户端接入模版
- 以下为通用的 JavaScript 客户端示例，可直接复制到你的项目中（ESM）：

```js
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

async function main() {
  // 将 MCP_URL 设置为你的服务器地址（默认本地）：
  // export MCP_URL="http://localhost:3000/mcp"
  const url = new URL(process.env.MCP_URL || 'http://localhost:3000/mcp');

  // 客户端信息可按需修改
  const client = new Client({ name: 'your-mcp-client', version: '0.0.1' });
  // 采用流式 HTTP 传输，支持 GET /mcp 的 SSE/流式 JSON-RPC
  const transport = new StreamableHTTPClientTransport(url);

  await client.connect(transport);

  // 列出工具
  const tools = await client.listTools();
  console.log('Available tools:', tools.tools.map(t => t.name));

  // 调用 Sage 版本工具
  const versionResult = await client.callTool({ name: 'sagemath.version', arguments: {} });
  console.log('sagemath.version result:', JSON.stringify(versionResult));

  // 调用 Sage 代码执行（可自定义 code 与 timeoutMs）
  const evalResult = await client.callTool({
    name: 'sagemath.evaluate',
    arguments: { code: 'print(2+2)', timeoutMs: 10000 },
  });
  console.log('sagemath.evaluate result:', JSON.stringify(evalResult));

  await client.close();
}

main().catch((error) => {
  console.error('MCP client error:', error);
  process.exit(1);
});
```

- 说明：
  - 服务器已同时支持 `GET /mcp`（SSE/流式）与 `POST /mcp`（JSON-RPC），以上示例使用 GET 流式传输。
  - 服务端采用无状态会话（`sessionIdGenerator: undefined`），可安全重复初始化。
  - `sagemath.evaluate` 执行耗时与代码复杂度相关，简单算术通常为数秒内完成。

## 在支持 MCP 的客户端中配置（mcpServers）
- 许多 MCP 客户端（如部分编辑器/代理）支持通过 `mcpServers` 配置直接启动服务器进程。
- 本项目默认使用 HTTP 传输（`StreamableHTTPServerTransport`），可通过以下方式集成：

### 构建后运行（推荐稳定）
1. 先构建：`npm run build`
2. 在客户端配置中添加（请替换绝对路径）：

```jsonc
{
  "mcpServers": {
    "sagemath-server": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-server-sagemath/dist/index.js"],
      "disabled": false,
      "autoApprove": ["sagemath.version", "sagemath.evaluate"], // 可选
      "env": {
        "PORT": "3000", // 可选，默认 3000
        // "SAGE_PATH": "/absolute/path/to/sage" // 可选，若未在 src/config.ts 设置
      }
    }
  }
}
```

### 开发模式（不构建，使用 tsx）
- 在客户端配置中添加（请替换绝对路径）：

```jsonc
{
  "mcpServers": {
    "sagemath-server-dev": {
      "command": "npx",
      "args": ["-y", "tsx", "/absolute/path/to/mcp-server-sagemath/src/index.ts"],
      "disabled": false
    }
  }
}
```

### 仅支持 STDIO 的客户端（可选改造）
- 若你的 MCP 客户端仅支持通过 `stdio` 连接（不支持 HTTP），请将服务端切换为 STDIO 模式：
  - 在 `src/index.ts` 中将传输替换为：

```ts
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const transport = new StdioServerTransport();
await server.connect(transport);
```

- 并移除/禁用 Express 的 `GET/POST /mcp` 路由（STDIO 模式不需要 HTTP 端口）。
- 完成后即可使用上面的 `mcpServers` 配置直接以 `stdio` 方式集成。

## 故障排查
- 错误：`Process error: spawn sage ENOENT`
  - 说明：找不到 `sage` 可执行文件。请检查 `src/config.ts` 的 `config.sagePath` 是否正确；或设置 `SAGE_PATH`，或确认系统 PATH 中存在 `sage`。
- 错误：`Invalid Request: Server already initialized`
  - 说明：会话重复初始化。当前服务已启用无状态模式（`sessionIdGenerator: undefined`），若自定义传输请保持该设置以避免冲突。
- 连接失败 / Connection refused
  - 说明：服务未启动或端口占用。请确认 `npm run dev` 正在运行，并检查 `PORT` 设置。

## 发布到 GitHub
- 在 GitHub 新建仓库，例如：`https://github.com/<your-org>/mcp-server-sagemath`
- 关联远程并推送：
  - `git init && git add . && git commit -m "init"`
  - `git remote add origin https://github.com/<your-org>/mcp-server-sagemath.git`
  - `git push -u origin main`
- 可在 `package.json` 中补充 `repository` 字段指向你的 GitHub 仓库。

## 许可证
- 本项目采用 MIT 许可证，详见 `LICENSE` 文件。

## 致谢
- [Model Context Protocol](https://github.com/modelcontextprotocol) 社区与 SDK。
- [SageMath](https://www.sagemath.org/) 开源数学系统。