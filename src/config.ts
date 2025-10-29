/**
 * 项目配置。默认从环境变量 `SAGE_PATH` 读取 Sage 可执行文件路径；
 * 未设置时会退回到系统 PATH 中的 `sage`。
 */
const envSagePath = process.env.SAGE_PATH?.trim();

export const config = {
  // 如果需要固定路径，可在此手动填写，例如："/opt/sage/bin/sage"
  sagePath: envSagePath && envSagePath.length > 0 ? envSagePath : undefined,
};