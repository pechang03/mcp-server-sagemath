# Changelog

## [0.1.0] - 2025-10-31

### Added
- **New specialized mathematical tools:**
  - `sagemath.factor` - Factor integers and polynomials with structured JSON output
  - `sagemath.solve` - Solve equations symbolically
  - `sagemath.graph_properties` - Compute 13+ graph theory properties in one call
  - `sagemath.simplify` - Simplify mathematical expressions
  - `sagemath.integrate` - Symbolic integration (definite/indefinite)
  - `sagemath.differentiate` - Symbolic differentiation with configurable order

- **New source files:**
  - `src/tools/specialized.ts` - All new specialized tools implementation
  
- **Documentation:**
  - Complete English README rewrite
  - Added IMPROVEMENTS.md with development roadmap
  - Added CHANGELOG.md
  - Comprehensive tool usage examples

### Changed
- Version bumped from 0.0.1 to 0.1.0
- Enhanced package.json description
- Fixed typo: `config.SagePath` → `config.sagePath`

### Benefits
- **Easier AI usage**: Specific tools vs generic evaluate()
- **Structured outputs**: JSON responses for programmatic parsing
- **Better validation**: Type-safe inputs with Zod schemas
- **Comprehensive**: Covers most common mathematical operations
- **Graph theory**: Rich graph analysis capabilities

### Migration from 0.0.1
No breaking changes! All existing tools (`sagemath.version`, `sagemath.evaluate`) remain unchanged and compatible.

New tools are opt-in additions.

## [0.0.1] - Original Release
- Basic `sagemath.version` tool
- Basic `sagemath.evaluate` tool
- STDIO and HTTP transport modes
- Chinese documentation
