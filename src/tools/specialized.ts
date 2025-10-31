import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { config } from '../config.js';
import { spawn } from 'node:child_process';

export interface SageRunResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  durationMs: number;
  timedOut: boolean;
}

function getSageExecutable(): string {
  return (config.sagePath?.trim()) || (process.env.SAGE_PATH?.trim()) || 'sage';
}

async function runProcess(cmd: string, args: string[], timeoutMs: number): Promise<SageRunResult> {
  const start = Date.now();
  let stdout = '';
  let stderr = '';
  let timedOut = false;

  return new Promise<SageRunResult>((resolve) => {
    let child: ReturnType<typeof spawn> | undefined;
    try {
      child = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (err: any) {
      resolve({
        stdout: '',
        stderr: `Failed to spawn process: ${err?.message || String(err)}`,
        exitCode: null,
        durationMs: Date.now() - start,
        timedOut: false,
      });
      return;
    }

    const t = setTimeout(() => {
      timedOut = true;
      try { child?.kill('SIGKILL'); } catch {}
    }, Math.max(1, timeoutMs));

    child.on('error', (err) => {
      clearTimeout(t);
      resolve({
        stdout: '',
        stderr: `Process error: ${err?.message || String(err)}`,
        exitCode: null,
        durationMs: Date.now() - start,
        timedOut,
      });
    });

    child.stdout?.on('data', (d) => { stdout += d.toString(); });
    child.stderr?.on('data', (d) => { stderr += d.toString(); });

    child.on('close', (code) => {
      clearTimeout(t);
      resolve({
        stdout,
        stderr,
        exitCode: code,
        durationMs: Date.now() - start,
        timedOut,
      });
    });
  });
}

async function evaluateSageCode(code: string, timeoutMs: number): Promise<SageRunResult> {
  const sage = getSageExecutable();
  const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'mcp-sage-'));
  const scriptPath = path.join(tmpRoot, 'script.sage');
  await fs.writeFile(scriptPath, code, 'utf8');

  const result = await runProcess(sage, [scriptPath], timeoutMs);

  try { await fs.rm(tmpRoot, { recursive: true, force: true }); } catch {}

  return result;
}

/**
 * Factor an integer or polynomial using SageMath
 */
export async function factorNumber(input: string | number, timeoutMs = 10000): Promise<SageRunResult> {
  const code = `
from sage.all import *
import json

try:
    n = ${typeof input === 'string' ? `SR("${input}")` : input}
    result = factor(n)
    print(json.dumps({"success": True, "result": str(result)}))
except Exception as e:
    print(json.dumps({"success": False, "error": str(e)}))
`;
  return evaluateSageCode(code, timeoutMs);
}

/**
 * Solve an equation symbolically
 */
export async function solveEquation(equation: string, variable = 'x', timeoutMs = 15000): Promise<SageRunResult> {
  const code = `
from sage.all import *
import json

try:
    var('${variable}')
    eq_str = "${equation}"
    
    # Convert = to == if needed
    if '=' in eq_str and '==' not in eq_str:
        eq_str = eq_str.replace('=', '==')
    
    eq = SR(eq_str)
    solutions = solve(eq, ${variable})
    
    print(json.dumps({
        "success": True,
        "solutions": [str(s) for s in solutions],
        "count": len(solutions)
    }))
except Exception as e:
    print(json.dumps({"success": False, "error": str(e)}))
`;
  return evaluateSageCode(code, timeoutMs);
}

/**
 * Compute graph theory properties
 */
export async function graphProperties(
  graphData: { vertices?: any[], edges: any[] },
  properties: string[],
  timeoutMs = 20000
): Promise<SageRunResult> {
  const vertices = graphData.vertices || [];
  const edges = graphData.edges || [];
  
  const code = `
from sage.all import *
import json

try:
    G = Graph()
    vertices = ${JSON.stringify(vertices)}
    edges = ${JSON.stringify(edges)}
    
    if vertices:
        G.add_vertices(vertices)
    if edges:
        G.add_edges(edges)
    
    properties = ${JSON.stringify(properties)}
    results = {}
    
    for prop in properties:
        try:
            if prop == 'chromatic_number':
                results[prop] = G.chromatic_number()
            elif prop == 'clique_number':
                results[prop] = G.clique_number()
            elif prop == 'independence_number':
                results[prop] = G.independent_set(value_only=True)
            elif prop == 'diameter':
                results[prop] = G.diameter()
            elif prop == 'girth':
                results[prop] = G.girth()
            elif prop == 'vertex_connectivity':
                results[prop] = G.vertex_connectivity()
            elif prop == 'edge_connectivity':
                results[prop] = G.edge_connectivity()
            elif prop == 'num_vertices':
                results[prop] = G.num_verts()
            elif prop == 'num_edges':
                results[prop] = G.num_edges()
            elif prop == 'is_connected':
                results[prop] = G.is_connected()
            elif prop == 'is_planar':
                results[prop] = G.is_planar()
            elif prop == 'is_bipartite':
                results[prop] = G.is_bipartite()
            else:
                results[prop] = f"Unknown property: {prop}"
        except Exception as e:
            results[prop] = f"Error: {str(e)}"
    
    print(json.dumps({"success": True, "properties": results}))
except Exception as e:
    print(json.dumps({"success": False, "error": str(e)}))
`;
  return evaluateSageCode(code, timeoutMs);
}

/**
 * Simplify a mathematical expression
 */
export async function simplifyExpression(expression: string, timeoutMs = 10000): Promise<SageRunResult> {
  const code = `
from sage.all import *
import json

try:
    expr = SR("${expression}")
    simplified = expr.simplify_full()
    
    print(json.dumps({
        "success": True,
        "original": str(expr),
        "simplified": str(simplified)
    }))
except Exception as e:
    print(json.dumps({"success": False, "error": str(e)}))
`;
  return evaluateSageCode(code, timeoutMs);
}

/**
 * Compute symbolic integration
 */
export async function integrateExpression(
  expression: string,
  variable: string,
  limits?: { lower: string, upper: string },
  timeoutMs = 15000
): Promise<SageRunResult> {
  const hasLimits = limits && limits.lower && limits.upper;
  
  const code = `
from sage.all import *
import json

try:
    var('${variable}')
    expr = SR("${expression}")
    
    ${hasLimits 
      ? `result = integrate(expr, (${variable}, ${limits.lower}, ${limits.upper}))`
      : `result = integrate(expr, ${variable})`
    }
    
    print(json.dumps({
        "success": True,
        "expression": str(expr),
        "variable": "${variable}",
        ${hasLimits ? `"limits": {"lower": "${limits.lower}", "upper": "${limits.upper}"},` : ''}
        "result": str(result)
    }))
except Exception as e:
    print(json.dumps({"success": False, "error": str(e)}))
`;
  return evaluateSageCode(code, timeoutMs);
}

/**
 * Compute symbolic differentiation
 */
export async function differentiateExpression(
  expression: string,
  variable: string,
  order = 1,
  timeoutMs = 10000
): Promise<SageRunResult> {
  const code = `
from sage.all import *
import json

try:
    var('${variable}')
    expr = SR("${expression}")
    result = diff(expr, ${variable}, ${order})
    
    print(json.dumps({
        "success": True,
        "expression": str(expr),
        "variable": "${variable}",
        "order": ${order},
        "result": str(result)
    }))
except Exception as e:
    print(json.dumps({"success": False, "error": str(e)}))
`;
  return evaluateSageCode(code, timeoutMs);
}
