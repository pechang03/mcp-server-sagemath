# MCP SageMath Server

基于 Model Context Protocol (MCP) 的本地 SageMath 服务端，当前提供两项工具：

- `sagemath.version`：查询本地 SageMath 版本。
- `sagemath.evaluate`：执行 SageMath 脚本并返回标准输出/错误。

项目处于早期预览阶段（v0.0.1）。

## 功能概览
- **双传输模式**：默认 STDIO，可通过环境变量切换到 HTTP（同时支持 `GET /mcp` 与 `POST /mcp`）。
- **无状态 HTTP 会话**：避免重复初始化导致的错误。
- **可靠的子进程封装**：当 SageMath 不可用时返回结构化错误，不会崩溃。
- **可配置的 SageMath 路径**：支持源代码配置与环境变量覆盖，默认回退到系统 PATH。

## 环境要求
- Node.js 18 及以上版本（推荐 20+）。
- 本地已安装 SageMath，并能够通过命令行访问其可执行文件。


## 配置 SageMath 路径
项目在运行时按照以下优先级查找 SageMath 可执行文件：

1. `src/config.ts` 中的 `config.sagePath`（若设置为非空字符串）。
2. 环境变量 `SAGE_PATH`。
3. 系统 PATH 中的 `sage` 命令。

默认情况下，`config.sagePath` 会读取 `SAGE_PATH` 环境变量的值；如需固定路径，可在该文件内显式填写，例如：

```ts
export const config = {
  sagePath: "/opt/sage/bin/sage",
};
```
## 安装

- 本项目根目录下执行
```bash
npm install
```


## 运行方式

### STDIO（默认模式）
- 构建：`npm run build`
- 运行：`node dist/index.js`
- 测试示例客户端：
  ```bash
  npx -y tsx src/test/stdio-client.ts
  ```

### HTTP 模式（需手动启用）
- 启动开发服务器：
  ```bash
  MCP_TRANSPORT=http npm run dev
  ```
- 默认监听 `http://localhost:3000/mcp`，可通过 `PORT` 环境变量调整端口。
- 开箱测试：
  ```bash
  MCP_TRANSPORT=http npx -y tsx src/test/client.ts
  ```
- 端点说明：
  - `GET /mcp`：用于 SSE/流式 JSON-RPC。
  - `POST /mcp`：标准 JSON-RPC over HTTP。

## MCP 客户端配置示例

### STDIO
```jsonc
{
  "mcpServers": {
    "sagemath-server": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-server-sagemath/dist/index.js"],
      "autoApprove": ["sagemath.version", "sagemath.evaluate"],
      "env": {
        // "SAGE_PATH": "/absolute/path/to/sage" // 可选
      }
    }
  }
}
```

### HTTP
```jsonc
{
  "mcpServers": {
    "sagemath-server-http": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-server-sagemath/dist/index.js"],
      "env": {
        "MCP_TRANSPORT": "http",
        "PORT": "3000"
      }
    }
  }
}
```

## 提供的工具

### `sagemath.version`
- 输出字段：`stdout`, `stderr`, `exitCode`, `durationMs`, `timedOut`。
- 适用于检测 SageMath 是否安装及版本信息。

### `sagemath.evaluate`
- 输入：
  - `code` (string) — 必填，SageMath 脚本。
  - `timeoutMs` (number) — 可选，超时时间，默认 10000 ms。
- 输出同上。
- 执行流程：将代码写入临时文件后调用 SageMath 执行。

## 测试
- STDIO 回归测试：`npx -y tsx src/test/stdio-client.ts`
- HTTP 回归测试：`MCP_TRANSPORT=http npx -y tsx src/test/client.ts`

## 安全提示
- `sagemath.evaluate` 可运行任意 SageMath 代码，请仅在可信环境使用。
- 建议在需要时结合容器或沙箱进一步隔离，并设置资源配额。

## Roadmap
- 扩展更多 SageMath 功能（绘图、符号计算等）。
- 优化长时间任务的会话复用与资源管理。
- 增强错误分类与限流策略。

## 许可证
MIT License，详见 `LICENSE`。

## 鸣谢
- [Model Context Protocol](https://github.com/modelcontextprotocol) 社区及 SDK。
- [SageMath](https://www.sagemath.org/) 开源数学系统。

