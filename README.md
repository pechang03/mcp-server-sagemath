# MCP SageMath Server

基于 Model Context Protocol (MCP) 的本地 SageMath 工具服务器，提供 `sagemath.version` 与 `sagemath.evaluate` 两个工具；支持 STDIO 传输（默认）与 HTTP 传输（可选，含 `GET /mcp` 与 `POST /mcp`）。

项目状态：早期预览（v0.0.1）。欢迎试用与反馈。

## 特性
- 暴露本地 SageMath 能力为两项 MCP 工具：版本查询与代码执行。
- 传输双模：默认 STDIO；设置环境变量切换到 HTTP（`MCP_TRANSPORT=http`）。
- 无状态会话（避免“Server already initialized”重复初始化错误）。
- 健壮的子进程错误处理：当 Sage 未安装或路径错误时返回结构化错误，不会导致服务崩溃。
- 简明配置：在 `src/config.ts` 直接指定 `sagePath`，或使用环境变量 `SAGE_PATH`，或系统 `PATH`。

## 先决条件
- `Node.js >= 18`（推荐 20+，ESM 与顶层 `await` 支持更佳）。
- 已安装 `SageMath`，并可获得其可执行文件绝对路径（例如 Conda 环境中的 `.../envs/<env>/bin/sage`）。

## 安装
- 在项目根目录执行：`npm install`

## 配置
- 文件：`src/config.ts`
  - `config.sagePath`：若设置为非空字符串则优先使用；空值则回退到环境变量 `SAGE_PATH`；若仍为空则使用系统 `PATH` 中的 `sage`。
- 环境变量：
  - `SAGE_PATH`：可覆盖 `config.sagePath`。
  - `MCP_TRANSPORT`：设置为 `http` 时启用 HTTP 模式；未设置或其他值为 STDIO（默认）。
  - `PORT`：HTTP 模式端口，默认 `3000`。

## 快速开始
- HTTP（开发调试，含 SSE 与 JSON-RPC）：
  - 启动：`npm run dev`（等价于 `MCP_TRANSPORT=http tsx src/index.ts`）
  - 访问：`http://localhost:3000/mcp`
  - 测试：`npx -y tsx src/test/client.ts`（可通过 `MCP_URL` 指定地址）
- STDIO（默认模式，适配多数 MCP 客户端的 `command` 启动）：
  - 直接运行示例：`npx -y tsx src/test/stdio-client.ts`

## HTTP 端点（HTTP 模式）
- `GET /mcp`：SSE/流式 JSON-RPC（适配要求 GET 的客户端）。
- `POST /mcp`：JSON-RPC over HTTP（在请求体中携带 JSON-RPC 数据）。

## MCP 工具
- `sagemath.version`
  - 描述：返回本地 SageMath 版本信息。
  - 输出字段：`stdout`, `stderr`, `exitCode`, `durationMs`, `timedOut`。
- `sagemath.evaluate`
  - 输入：`code`（字符串），`timeoutMs`（可选，正整数毫秒，默认 10000）。
  - 描述：在本地执行 Sage 代码（写入临时文件后运行）。
  - 输出字段：同上。
  - 说明：执行耗时取决于代码复杂度；简单算术通常在数秒内完成。

## 使用示例（HTTP 客户端）
```js
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

async function main() {
  const url = new URL(process.env.MCP_URL || 'http://localhost:3000/mcp');
  const client = new Client({ name: 'your-mcp-client', version: '0.0.1' });
  const transport = new StreamableHTTPClientTransport(url);

  await client.connect(transport);

  const tools = await client.listTools();
  console.log('Available tools:', tools.tools.map(t => t.name));

  const versionResult = await client.callTool({ name: 'sagemath.version', arguments: {} });
  console.log('sagemath.version result:', JSON.stringify(versionResult));

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

## 在支持 MCP 的客户端中配置（mcpServers）
- 推荐：STDIO（默认）
  - 构建：`npm run build`
  - 配置（请替换绝对路径）：
    ```jsonc
    {
      "mcpServers": {
        "sagemath-server": {
          "command": "node",
          "args": ["/absolute/path/to/mcp-server-sagemath/dist/index.js"],
          "disabled": false,
          "autoApprove": ["sagemath.version", "sagemath.evaluate"],
          "env": {
            // "SAGE_PATH": "/absolute/path/to/sage" // 可选，若未在 src/config.ts 设置
          }
        }
      }
    }
    ```
- 可选：HTTP（需要显式启用）
  - 开发：`npm run dev`（HTTP 模式）
  - 构建后运行：`MCP_TRANSPORT=http PORT=3000 node dist/index.js`
  - 客户端配置示例：
    ```jsonc
    {
      "mcpServers": {
        "sagemath-server-http": {
          "command": "node",
          "args": ["/absolute/path/to/mcp-server-sagemath/dist/index.js"],
          "env": { "MCP_TRANSPORT": "http", "PORT": "3000" },
          "disabled": false
        }
      }
    }
    ```

## 故障排查
- `Process error: spawn sage ENOENT`
  - 说明：找不到 `sage` 可执行文件。请检查 `src/config.ts` 的 `config.sagePath` 是否正确；或设置 `SAGE_PATH`；或确认系统 `PATH` 中存在 `sage`。
- `Invalid Request: Server already initialized`
  - 说明：会话重复初始化。服务端已启用无状态模式（`sessionIdGenerator: undefined`）；如自定义传输请保持该设置以避免冲突。
- 连接失败 / Connection refused
  - 说明：服务未启动或端口占用。请确认在 HTTP 模式下 `npm run dev` 正在运行，并检查 `PORT` 设置。
- STDIO 模式日志
  - 提醒：请勿向 `stdout` 打印日志，否则会破坏 JSON-RPC 帧；如需调试请输出到 `stderr` 或使用文件日志。

## 安全提示
- `sagemath.evaluate` 可执行任意本地 Sage 代码。请仅在可信环境使用，谨慎对待来自不可信来源的代码。
- 如需更严格的隔离与资源限制，建议结合容器/沙箱并扩展超时、内存与 CPU 限定。

## 开发与构建
- 开发（HTTP）：`npm run dev`
- 构建：`npm run build`
- 运行（STDIO，默认）：`node dist/index.js`
- 运行（HTTP，需显式设置）：`MCP_TRANSPORT=http PORT=3000 node dist/index.js`

## 相关文档
- 传输模式背景与改动记录：`docs/mcp-transport-fix.md`
- MCP SDK 与协议参考：https://github.com/modelcontextprotocol

## 许可证
- MIT，详见 `LICENSE`。

## 致谢
- [Model Context Protocol](https://github.com/modelcontextprotocol) 社区与 SDK。
- [SageMath](https://www.sagemath.org/) 开源数学系统。