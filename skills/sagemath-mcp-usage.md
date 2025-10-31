# SageMath MCP Server - AI Assistant Skills

This document provides guidance for AI assistants on how to effectively use the SageMath MCP server tools.

## Available Tools

### 1. sagemath.version
**Purpose**: Check SageMath version  
**When to use**: Verify SageMath is available, troubleshooting

**Example:**
```
Check the SageMath version
```

---

### 2. sagemath.evaluate
**Purpose**: Execute arbitrary SageMath code  
**When to use**: Complex computations not covered by specialized tools

**Example:**
```
Use sagemath.evaluate to compute the first 10 Fibonacci numbers
```

**Best Practices:**
- Use for one-off computations
- Keep code simple and focused
- Prefer specialized tools when available

---

### 3. sagemath.factor
**Purpose**: Factor integers and polynomials  
**When to use**: Factorization problems

**Examples:**
```
Factor 123456789
Factor 2^67 - 1
Factor x^2 + 5*x + 6
```

**Input Types:**
- Numbers: `123456789`
- Expressions: `"2^67 - 1"` or `"x^2 + 5*x + 6"`

**Output Format:**
```json
{
  "success": true,
  "result": "3^2 * 3607 * 3803"
}
```

---

### 4. sagemath.solve
**Purpose**: Solve equations symbolically  
**When to use**: Equation solving, finding roots

**Examples:**
```
Solve x^2 + 2*x + 1 = 0
Solve sin(x) = 0.5 for x
Solve y^3 - 8 = 0 for y
```

**Best Practices:**
- Use `=` (will be converted to `==`)
- Specify variable if not x: `variable: "y"`
- Works with transcendental equations

**Output Format:**
```json
{
  "success": true,
  "solutions": ["x == -1"],
  "count": 1
}
```

---

### 5. sagemath.graph_properties
**Purpose**: Compute graph theory properties  
**When to use**: Graph analysis, network problems

**Examples:**
```
Calculate chromatic number of Petersen graph
Find clique number and independence number of K5
Analyze graph connectivity
```

**Input Format:**
```json
{
  "edges": [[0,1], [1,2], [2,0]],
  "vertices": [0, 1, 2],
  "properties": ["chromatic_number", "is_planar"]
}
```

**Available Properties:**
- `chromatic_number` - Minimum colors needed
- `clique_number` - Maximum clique size
- `independence_number` - Maximum independent set
- `diameter` - Maximum shortest path
- `girth` - Shortest cycle length
- `vertex_connectivity` - Vertex connectivity
- `edge_connectivity` - Edge connectivity
- `num_vertices` - Vertex count
- `num_edges` - Edge count
- `is_connected` - Connected?
- `is_planar` - Planar?
- `is_bipartite` - Bipartite?

**Common Graphs:**
```
Petersen graph: 10 vertices, 15 edges
Complete graph Kn: all pairs connected
Cycle graph Cn: vertices in a cycle
Path graph Pn: vertices in a line
```

---

### 6. sagemath.simplify
**Purpose**: Simplify mathematical expressions  
**When to use**: Expression manipulation, cleanup

**Examples:**
```
Simplify (x + 1)^2 - (x^2 + 2*x + 1)
Simplify sin(x)^2 + cos(x)^2
```

**Output Format:**
```json
{
  "success": true,
  "original": "(x + 1)^2 - (x^2 + 2*x + 1)",
  "simplified": "0"
}
```

---

### 7. sagemath.integrate
**Purpose**: Symbolic integration  
**When to use**: Calculus, finding antiderivatives, areas

**Examples:**

**Indefinite integral:**
```
Integrate x^2 with respect to x
```
```json
{
  "expression": "x^2",
  "variable": "x"
}
```

**Definite integral:**
```
Integrate x^2 from 0 to 1
```
```json
{
  "expression": "x^2",
  "variable": "x",
  "lower": "0",
  "upper": "1"
}
```

**Complex examples:**
```
Integrate sin(x)*cos(x)
Integrate x*e^x from 0 to infinity
```

---

### 8. sagemath.differentiate
**Purpose**: Symbolic differentiation  
**When to use**: Calculus, finding derivatives, rates of change

**Examples:**

**First derivative:**
```
Differentiate x^3 + 2*x^2 with respect to x
```
```json
{
  "expression": "x^3 + 2*x^2",
  "variable": "x"
}
```

**Higher order derivatives:**
```
Find the second derivative of sin(x)
```
```json
{
  "expression": "sin(x)",
  "variable": "x",
  "order": 2
}
```

**Output Format:**
```json
{
  "success": true,
  "expression": "x^3 + 2*x^2",
  "variable": "x",
  "order": 1,
  "result": "3*x^2 + 4*x"
}
```

---

## Usage Patterns

### Pattern 1: Factor → Solve
```
1. Factor the polynomial x^2 + 5*x + 6
2. Solve x^2 + 5*x + 6 = 0
```
Use factor first to understand the structure, then solve for exact solutions.

### Pattern 2: Differentiate → Solve
```
1. Find f'(x) where f(x) = x^3 - 3*x
2. Solve f'(x) = 0 to find critical points
```
Find critical points by differentiating and solving.

### Pattern 3: Graph Analysis Pipeline
```
1. Compute chromatic_number, clique_number
2. Check is_planar, is_bipartite
3. Calculate diameter, girth
```
Analyze graphs systematically.

### Pattern 4: Simplify → Integrate
```
1. Simplify the expression first
2. Then integrate the simplified form
```
Simplification often makes integration easier.

---

## Error Handling

### Common Issues:

**1. Timeout:**
- Increase `timeoutMs` parameter
- Simplify the problem
- Break into smaller computations

**2. Syntax Error:**
- Check expression syntax (SageMath notation)
- Use `*` for multiplication: `2*x` not `2x`
- Use `^` for powers: `x^2` not `x**2`

**3. Unsolvable:**
- Some equations have no closed-form solution
- Try numerical methods instead
- Simplify the equation first

**4. Graph Properties:**
- Ensure edges are valid
- Check graph is connected for diameter/girth
- Some properties only work on specific graph types

---

## Performance Tips

1. **Use specialized tools** over generic evaluate
2. **Cache results** if reusing computations
3. **Batch graph properties** instead of multiple calls
4. **Simplify first** before complex operations
5. **Set appropriate timeouts** (complex ops need more time)

---

## Mathematical Notation Guide

**Variables:** `x, y, z, n, k`  
**Operations:** `+, -, *, /, ^`  
**Functions:** `sin, cos, tan, exp, log, sqrt`  
**Constants:** `pi, e, I` (imaginary unit)

**Examples:**
- `x^2 + 2*x + 1` ✅
- `sin(pi/2)` ✅
- `e^(I*pi) + 1` ✅

---

## Integration with Other Tools

### With Wolfram Alpha:
- Use SageMath for symbolic manipulation
- Use Wolfram for step-by-step solutions

### With Python:
- SageMath returns JSON - easy to parse
- Use evaluate for Python-like scripting

### With Plotting:
- Compute properties with SageMath
- Plot with external tools

---

## Example Workflows

### Workflow 1: Polynomial Analysis
```
1. Factor: factor x^3 - 8
2. Solve: solve x^3 - 8 = 0
3. Differentiate: diff x^3 - 8
4. Find critical points: solve derivative = 0
```

### Workflow 2: Graph Analysis
```
1. Define edges for graph
2. Get basic properties: num_vertices, num_edges, is_connected
3. Get structural: chromatic_number, clique_number
4. Get distance: diameter, girth
```

### Workflow 3: Calculus Problem
```
1. Simplify function
2. Find derivative
3. Solve derivative = 0 for critical points
4. Find second derivative (concavity)
5. Integrate over interval (area)
```

---

## Quick Reference

| Task | Tool | Example Input |
|------|------|---------------|
| Factor number | `sagemath.factor` | `input: 12345` |
| Solve equation | `sagemath.solve` | `equation: "x^2 - 4 = 0"` |
| Graph chromatic # | `sagemath.graph_properties` | `properties: ["chromatic_number"]` |
| Simplify expr | `sagemath.simplify` | `expression: "sin(x)^2 + cos(x)^2"` |
| Integrate | `sagemath.integrate` | `expression: "x^2", variable: "x"` |
| Differentiate | `sagemath.differentiate` | `expression: "x^3", variable: "x"` |
| Custom code | `sagemath.evaluate` | `code: "print(fibonacci(10))"` |

---

## Version: 0.1.0
Last updated: 2025-10-31
