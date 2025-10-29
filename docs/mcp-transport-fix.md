# MCP 传输修复记录（Trae 集成）

日期：2025-10-29  
版本：`mcp-server-sagemath@0.0.1`

## 背景与症状
- 在 Trae 中通过 `mcpServers.command` 启动本服务时出现连接/握手失败（控制台报错），而本地 `npm run dev`（HTTP 服务）可正常启动。
- Trae 的 `mcpServers.command` 默认期望 MCP 以 `stdio` 传输进行 JSON-RPC 交互；原实现默认使用 HTTP 传输，导致协议不匹配。

## 根因分析
- 服务器默认采用 `StreamableHTTPServerTransport`（HTTP），而 Trae 的 `command` 启动方式使用标准输入/输出（`stdio`）通道进行 JSON-RPC 交互。
- 由于传输层不一致，初始化握手无法完成，表现为连接失败或报错。

## 修复方案
- 默认传输改为 `stdio`，以兼容 Trae 的 `mcpServers.command` 启动方式。
- 保留 HTTP 模式用于本地开发调试，通过环境变量控制：
  - `MCP_TRANSPORT=http` 时启用 HTTP 服务（Express + `StreamableHTTPServerTransport`）。
  - 未设置或设置为其他值时，启用 `StdioServerTransport`。
- 开发脚本调整：`npm run dev` 显式启用 HTTP 模式，避免默认切到 `stdio` 后本地开发行为改变。

## 代码改动
- 文件：`src/index.ts`
  - 引入 `StdioServerTransport`：`import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'`
  - 按环境变量 `MCP_TRANSPORT` 切换传输：
    - `http`：保持原有 Express 路由并连接 `StreamableHTTPServerTransport`。
    - 默认（非 `http`）：连接 `StdioServerTransport`，不在 `stdout` 打印日志（避免污染 JSON-RPC 流）。
- 文件：`package.json`
  - `dev` 脚本从 `tsx src/index.ts` 改为 `MCP_TRANSPORT=http tsx src/index.ts`。

## 使用与验证
- Trae 集成（stdio，推荐）
  - 在 Trae 的 `mcpServers` 中配置：
    ```json
    {
      "mcpServers": {
        "sagemath-server-dev": {
          "command": "npx",
          "args": ["-y", "tsx", "/Users/halois/workdir/Toolkit/mcps/mcp-server-sagemath/src/index.ts"]
        }
      }
    }
    ```
  - 启动后应可正常握手，列出工具：`sagemath.version`、`sagemath.evaluate`。
- 本地开发（HTTP 调试）
  - 启动：`PORT=3001 npm run dev`
  - 访问：`http://localhost:3001/mcp`
  - 测试客户端（HTTP）：
    ```bash
    MCP_URL=http://localhost:3001/mcp npx -y tsx src/test/client.ts
    ```
  - 期待输出：工具列表、`sagemath.version` 与 `sagemath.evaluate` 的结果。

## 注意事项
- Node 版本建议 `>= 18`，以支持 ESM 与顶层 `await`。
- `stdio` 模式下避免向 `stdout` 打印任何日志，使用 `stderr` 记录调试信息，否则会破坏 JSON-RPC 帧。
- Sage 可执行路径：
  - `src/config.ts` 中的 `sagePath` 当前为：`/Users/halois/miniconda3/envs/sage106/bin/sage`
  - 也可通过环境变量 `SAGE_PATH` 覆盖。

## 参考文件
- `src/index.ts`（传输切换与启动逻辑）
- `src/tools/sagemath.ts`（调用 Sage 可执行完成版本查询与代码执行）
- `src/test/client.ts`（HTTP 客户端示例）
- `package.json`（脚本与依赖）
- `tsconfig.json`（ESM/NodeNext 配置）

## 后续改进方向
- 为 `stdio` 模式增加可选的结构化日志（写入文件或使用 `DEBUG` 环境变量控制）。
- 提供统一的 CLI 参数（如 `--transport=http|stdio`、`--port`），避免仅通过环境变量配置。
- 增加简单的健康检查端点与自检工具调用，以便 CI/开发环境快速验真。