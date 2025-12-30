# Documentation Index

## API Documentation

### [API.md](./API.md)
Human-readable API documentation for all server actions. Lists all cart, order, and product operations with:
- Action function names and file locations
- Required authentication levels
- Input parameters with types and constraints
- Links to validation schemas

**When to use**: Finding what an endpoint does, what params it needs, or its location in code.

### [api-schema.json](./api-schema.json)
Auto-generated OpenAPI 3.0.0 specification from Zod validators. Contains complete request/response schemas with all validation rules.

**How to regenerate**: Run `npm run generate:schema` after modifying any Zod schemas in `src/lib/validations/`

**When to use**: Importing into Swagger UI, Redoc, Postman, or other API documentation tools for visual exploration.

---

## Development Guides

- **[LANGUAGE_GUIDE.md](./LANGUAGE_GUIDE.md)** - TypeScript/JavaScript conventions
- **[style_guide.md](./style_guide.md)** - Code style and formatting rules
- **[typography.md](./typography.md)** - UI typography specifications
- **[TODO.md](./TODO.md)** - Project TODOs and future work
- **[TEST_TODO.md](./TEST_TODO.md)** - Test coverage TODOs
