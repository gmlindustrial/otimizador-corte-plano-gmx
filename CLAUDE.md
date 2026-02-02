# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Cutting optimization web application (Otimizador de Corte Plano GMX) for manufacturing. Supports two optimization modes:
- **Linear (1D)**: Bar cutting optimization using Best Fit Decreasing, with support for emendas (piece joining) and waste stock reuse
- **Sheet (2D)**: Sheet/plate cutting optimization using genetic algorithms, bottom-left fill, and no-fit polygon techniques

Built with React 18 + TypeScript + Vite. Backend is Supabase (PostgreSQL + Auth). UI uses shadcn/ui + TailwindCSS. The project was originally generated via [Lovable](https://lovable.dev).

## Commands

```bash
npm run dev        # Dev server on port 8080
npm run build      # Production build
npm run lint       # ESLint
npm run test       # Vitest (watch mode)
npx vitest run     # Run tests once
npx vitest run tests/algorithms/linearOptimization.test.ts  # Single test file
```

## Architecture

```
Pages → Components → Hooks → Services → Supabase
                       ↓
                   Algorithms
```

### Key layers

- **`src/algorithms/`**: Core optimization engines, split into `linear/` (1D bar cutting) and `sheet/` (2D plate cutting with geometry utils). These are pure computation — no React or Supabase dependencies.
- **`src/services/base/`**: Generic `BaseService<T>` providing CRUD operations against Supabase tables. All entity services extend this. Uses `ServiceResponse<T>` / `ListResponse<T>` response wrappers.
- **`src/services/entities/`**: ~16 domain-specific services (ProjetoService, ProjetoPecaService, MaterialService, etc.) that extend BaseService and add domain logic.
- **`src/hooks/`**: Custom React hooks that bridge services/algorithms to components. Optimization hooks (`useLinearOptimization`, `useSheetOptimization`) orchestrate the full optimization workflow. Service hooks wrap TanStack Query for data fetching.
- **`src/components/`**: Feature-grouped React components. `ui/` contains shadcn/ui primitives; other folders are domain-specific (optimization, projects, dashboard, reports, sheet, wizard).
- **`src/types/`**: Core domain interfaces — `project.ts` (linear types: ProjetoPeca, EmendaInfo, OptimizationPiece) and `sheet.ts` (2D types: SheetCutPiece, SheetPlacedPiece, SheetOptimizationResult).
- **`src/integrations/supabase/`**: Auto-generated Supabase client and TypeScript types. `types.ts` is auto-generated — do not edit manually.

### Routing

Four routes in `App.tsx`: `/` (main optimization interface), `/login`, `/admin` (user management), `/laminas` (laminate management).

### State management

TanStack React Query for server state. No global store (Redux etc.) — component-level state via hooks.

## Conventions

- Domain language is Portuguese (pt-BR): variable names, UI text, error messages, and comments are in Portuguese.
- Path alias: `@/` maps to `src/` (configured in vite.config.ts and tsconfig.json).
- Tests live in `tests/` (not colocated). Supabase client and toast (sonner) are globally mocked in `tests/setup.ts`.
- Services return `{ data, error, success }` objects — never throw. Errors are handled via `ErrorHandler` which shows toast notifications.
