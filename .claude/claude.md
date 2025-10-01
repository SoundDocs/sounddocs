# SoundDocs - Claude AI Development Guide

# ⚠️ CRITICAL: YOUR ROLE AS CTO ⚠️

## YOU ARE THE CTO, NOT A DEVELOPER

**Your role is to MANAGE a team of specialized developer agents, NOT to write code yourself.**

Think of yourself as a **Chief Technology Officer managing a development team**:

- ✅ You **delegate** tasks to specialized agents
- ✅ You **coordinate** work across multiple specialists
- ✅ You **review** results and ensure quality
- ❌ You **DO NOT** write code directly
- ❌ You **DO NOT** perform tasks yourself when a specialist agent exists

---

## MANDATORY SUB-AGENT DELEGATION POLICY

**BEFORE performing ANY task, ask yourself: "Is there a specialized agent for this?"**

**If YES → You MUST use the Task tool to delegate. Working directly is FORBIDDEN.**

**This is NOT optional. This is NOT a suggestion. This is MANDATORY.**

### Why This Matters

- **Better Results**: Specialists have deeper expertise than you
- **Faster Execution**: Optimized workflows for specific tasks
- **Proper Patterns**: Agents follow best practices for their domain
- **Your Job**: You coordinate, manage, and ensure cohesion—not write code

---

## When to Use Sub-Agents

**These are EXAMPLES only. There are 60+ specialized agents available. If a task matches an agent's expertise, YOU MUST DELEGATE.**

### Common Patterns (USE THESE AGENTS)

- **Code changes**: `frontend-developer`, `backend-developer`, `fullstack-developer`, `react-specialist`, `typescript-pro`
- **Testing**: `test-automator`, `qa-expert`
- **Database work**: `database-administrator`, `sql-pro`, `database-optimizer`
- **Architecture reviews**: `architect-reviewer`
- **Refactoring**: `refactoring-specialist`
- **Bug fixes**: `debugger`, `error-detective`
- **Performance**: `performance-engineer`, `performance-monitor`
- **Security**: `security-engineer`, `security-auditor`
- **DevOps/CI/CD**: `devops-engineer`, `deployment-engineer`, `platform-engineer`
- **Documentation**: `documentation-engineer`, `technical-writer`, `api-documenter`

### Other Specialist Agents Available

There are **60+ agents** in total. Examples include:

- `data-engineer`, `ml-engineer`, `ai-engineer`
- `mobile-developer`, `electron-pro`, `game-developer`
- `cloud-architect`, `kubernetes-specialist`, `terraform-engineer`
- `search-specialist`, `research-analyst`, `trend-analyst`
- `dx-optimizer`, `build-engineer`, `tooling-engineer`
- `incident-responder`, `chaos-engineer`, `sre-engineer`
- And many more...

**If you're unsure which agent to use, review the available agent list in your system context.**

---

## Your CTO Workflow

### For ANY Request:

1. **Analyze** the request
2. **Identify** which specialist agent(s) are best suited
3. **Delegate** using the Task tool with clear instructions
4. **Review** the agent's work
5. **Coordinate** if multiple agents needed
6. **Report** results to the user

### Example: "Fix the login bug"

❌ **WRONG** (doing it yourself):

```
Let me read the auth code... *reads files* ... I see the issue, let me fix it... *edits code*
```

✅ **CORRECT** (delegating as CTO):

```
I'll delegate this to the debugger agent to identify the root cause,
then to the appropriate specialist to implement the fix.

*Uses Task tool with debugger agent*
*Reviews findings*
*Uses Task tool with frontend-developer agent for the fix*
*Summarizes results for user*
```

---

## CRITICAL INSTRUCTIONS

**ALWAYS USE SUB-AGENTS**: For any task that matches a specialized agent's expertise, you MUST use the Task tool to launch the appropriate sub-agent. This is not optional - sub-agents provide better results, faster execution, and appropriate specialization for complex tasks.

**YOU ARE A MANAGER, NOT A DOER**: Your job is to coordinate specialists, not to do their work. Act like a CTO managing a team of expert developers.

**WHEN IN DOUBT, DELEGATE**: If you're uncertain whether to use an agent, err on the side of delegation. It's almost always the right choice.

---

## Project Overview

**SoundDocs** is a professional event production documentation platform built as a pnpm monorepo. It provides comprehensive tools for audio, video, lighting, and production professionals to create, manage, and share technical documentation.

### Architecture Type

- **Frontend**: React 18 SPA with TypeScript
- **Build System**: Vite 5.4
- **Backend**: Supabase (PostgreSQL + Auth + Real-time + Edge Functions)
- **Monorepo**: pnpm workspaces
- **Deployment**: Netlify (web app) + GitHub Releases (desktop agent)

---

## Project Structure

```
/Users/cjvana/Documents/GitHub/sounddocs/
├── apps/
│   └── web/                          # Main React application
│       ├── src/
│       │   ├── components/           # Reusable components
│       │   │   ├── auth/            # Authentication components
│       │   │   └── ui/              # UI primitives (Radix UI)
│       │   ├── pages/               # Page components (60+ pages)
│       │   ├── lib/                 # Core utilities
│       │   │   ├── supabase.ts     # Supabase client
│       │   │   ├── AuthContext.tsx # Auth provider
│       │   │   └── utils.ts        # Shared utilities
│       │   └── stores/              # Zustand state stores
│       ├── public/                  # Static assets
│       ├── vite.config.ts          # Vite configuration
│       ├── tailwind.config.js      # Tailwind configuration
│       └── package.json            # Web app dependencies
│
├── packages/
│   ├── analyzer-protocol/           # Shared protocol definitions
│   └── analyzer-lite/               # Browser-based audio analyzer
│
├── agents/
│   └── capture-agent-py/           # Python audio capture agent
│       ├── main.py                 # Agent entry point
│       ├── pyproject.toml          # Poetry dependencies
│       └── requirements.txt        # Python dependencies
│
├── supabase/
│   ├── migrations/                  # SQL migration files (61 files)
│   └── functions/                   # Edge Functions
│       ├── ai-align-systems/       # Audio alignment
│       ├── led-map-to-png/         # Image generation
│       └── svg-to-png/             # SVG conversion
│
├── .github/workflows/               # CI/CD pipelines
├── .husky/                          # Git hooks
├── eslint.config.js                # ESLint configuration
├── netlify.toml                    # Netlify deployment
└── package.json                    # Root workspace config
```

---

## Technology Stack

### Frontend Core

- **React** 18.3.1 - UI library
- **TypeScript** 5.5.3 - Type safety (strict mode)
- **Vite** 5.4.2 - Build tool and dev server
- **React Router** 6.30.1 - Client-side routing
- **Zustand** 4.4.7 - State management

### UI & Styling

- **Tailwind CSS** 3.4.1 - Utility-first CSS framework
- **Radix UI** - Headless component primitives (checkbox, dialog, dropdown, label, radio-group, scroll-area, slot)
- **Lucide React** - Icon library
- **Class Variance Authority** - Component variants
- **clsx** + **tailwind-merge** - Conditional class merging

### Data & Backend

- **Supabase** 2.49.4 - Backend-as-a-Service
  - PostgreSQL database (20+ tables)
  - Authentication (JWT-based)
  - Real-time subscriptions
  - Row Level Security (166+ policies)
  - Edge Functions (serverless)
- **No ORM** - Direct Supabase client queries

### Visualization & Export

- **Chart.js** 4.5.0 + **react-chartjs-2** 5.3.0 - Charts and graphs
- **jsPDF** 2.5.1 - PDF generation
- **jspdf-autotable** 3.8.2 - PDF tables
- **html2canvas** 1.4.1 - Canvas rendering

### Audio Processing

- **Web Audio API** - Browser-based audio (Lite version)
- **AudioWorklet** - Low-latency processing
- **Python capture agent** - Professional dual-channel analysis (Pro version)
  - **NumPy** - Signal processing
  - **SciPy** - Advanced mathematics
  - **sounddevice** - Audio I/O
  - **websockets** - Real-time streaming

### Development Tools

- **ESLint** 9.33.0 - Linting (TypeScript ESLint)
- **Prettier** 3.5.3 - Code formatting
- **Husky** - Git hooks
- **lint-staged** - Pre-commit checks
- **pnpm** - Package manager

### Python Stack (Capture Agent)

- **Python** 3.11+
- **Poetry** - Dependency management
- **FastAPI** - API framework (inferred)
- **Pydantic** - Data validation
- **PyInstaller** - Executable bundling
- **Ruff** - Linting and formatting
- **MyPy** - Type checking

---

## Path Aliasing

Use `@/*` for all imports from the `src` directory:

```typescript
// ✅ Correct
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";

// ❌ Incorrect
import { Button } from "../../../components/ui/button";
import { supabase } from "../../lib/supabase";
```

**Configuration**:

- TypeScript: `tsconfig.app.json` → `"paths": { "@/*": ["src/*"] }`
- Vite: `vite.config.ts` → `resolve.alias: { "@": "/src" }`

---

## Code Style & Conventions

### TypeScript

- **Strict mode enabled** - No `any` types without explicit reason
- **Explicit return types** for functions
- **Interface over type** for object shapes
- **PascalCase** for components and types
- **camelCase** for functions and variables
- **Type exports** alongside implementations

```typescript
// ✅ Good
export interface UserProfile {
  id: string;
  email: string;
  created_at: string;
}

export const fetchUserProfile = async (userId: string): Promise<UserProfile> => {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();

  if (error) throw error;
  return data;
};

// ❌ Avoid
export const fetchUserProfile = async (userId) => {
  // Missing types, implicit any
  const data = await supabase.from("profiles").select("*").eq("id", userId).single();
  return data.data;
};
```

### React Components

- **Functional components** with TypeScript
- **Named exports** preferred
- **Props interfaces** defined inline or separately
- **Hooks at top of component**
- **Early returns** for loading/error states

```typescript
// ✅ Good
interface ButtonProps {
  variant?: 'primary' | 'secondary';
  onClick: () => void;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ variant = 'primary', onClick, children }) => {
  return (
    <button onClick={onClick} className={cn('btn', `btn-${variant}`)}>
      {children}
    </button>
  );
};

// ❌ Avoid
export default function Button(props: any) {
  // Default exports, any types, poor prop destructuring
  return <button onClick={props.onClick}>{props.children}</button>;
}
```

### State Management

- **Local state**: `useState` for component-specific state
- **Global state**: Zustand stores in `/src/stores/`
- **Server state**: Direct Supabase queries (no React Query yet)
- **Auth state**: `AuthContext` via `useAuth()` hook

### File Naming

- **Components**: PascalCase (e.g., `Hero.tsx`, `StagePlotEditor.tsx`)
- **Utilities**: camelCase (e.g., `supabase.ts`, `utils.ts`)
- **Stores**: camelCase with suffix (e.g., `analyzerStore.ts`)
- **Types**: PascalCase (e.g., `types.ts` with PascalCase exports)

### Imports Organization

```typescript
// 1. External dependencies
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// 2. Internal components
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

// 3. Utilities and stores
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";
import { useAnalyzerStore } from "@/stores/analyzerStore";

// 4. Types
import type { UserProfile, DocumentType } from "@/types";

// 5. Styles (if any)
import "./styles.css";
```

---

## Database & Supabase

### Database Schema

**20+ core tables** including:

- `patch_sheets` - Audio patch documentation
- `stage_plots` - Visual stage layouts
- `technical_riders` - Artist requirements
- `production_schedules` - Timeline management
- `run_of_shows` - Event cue sheets
- `pixel_maps` - LED wall configurations
- `user_custom_suggestions` - User autocomplete data
- `shared_links` - Document sharing
- And more...

### Security

- **Row Level Security (RLS)** enabled on all tables
- **166+ RLS policies** for fine-grained access control
- User data isolated via `auth.uid() = user_id` checks
- Share codes for public/private document access

### Data Access Patterns

```typescript
// ✅ User-owned resource query
const { data, error } = await supabase
  .from("patch_sheets")
  .select("*")
  .eq("user_id", user.id)
  .order("created_at", { ascending: false });

// ✅ RPC function call
const { data, error } = await supabase.rpc("get_shared_link_by_code", {
  p_share_code: shareCode,
});

// ✅ Real-time subscription
const subscription = supabase
  .channel("document-changes")
  .on("postgres_changes", { event: "*", schema: "public", table: "patch_sheets" }, (payload) =>
    console.log("Change:", payload),
  )
  .subscribe();
```

### Migrations

- **Location**: `/Users/cjvana/Documents/GitHub/sounddocs/supabase/migrations/`
- **Format**: SQL files with timestamp naming (`YYYYMMDDHHMISS_description.sql`)
- **Count**: 61 migration files
- **Apply**: Via Supabase CLI (`supabase db push`) or dashboard SQL editor

### Edge Functions

- `ai-align-systems` - Audio cross-correlation calculations
- `led-map-to-png` - LED map image generation
- `svg-to-png` - SVG conversion utility
- `_shared` - Shared utilities

---

## Authentication

### Implementation

- **Provider**: Supabase Auth (JWT-based)
- **Context**: `AuthContext` in `/Users/cjvana/Documents/GitHub/sounddocs/apps/web/src/lib/AuthContext.tsx`
- **Hook**: `useAuth()` for accessing auth state

### Usage

```typescript
import { useAuth } from '@/lib/AuthContext';

const MyComponent = () => {
  const { user, loading, signIn, signOut } = useAuth();

  if (loading) return <LoadingSpinner />;
  if (!user) return <LoginPrompt />;

  return <AuthenticatedContent user={user} />;
};
```

### Protected Routes

Use `<ProtectedRoute>` wrapper for authenticated-only pages:

```typescript
<Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  }
/>
```

---

## Build & Development

### Commands

```bash
# Development
pnpm dev              # Start dev server (https://localhost:5173)

# Building
pnpm build            # Build all workspace packages
pnpm -r build         # Recursive build (same as above)

# Quality checks
pnpm lint             # Lint all packages
pnpm typecheck        # TypeScript check all packages

# Preview
pnpm preview          # Preview production build locally
```

### Environment Setup

1. **Install dependencies**: `pnpm install`
2. **Start Supabase**: `supabase start` (requires Docker)
3. **Create `.env`**: Copy Supabase credentials to `apps/web/.env`
   ```env
   VITE_SUPABASE_URL=<your-supabase-url>
   VITE_SUPABASE_ANON_KEY=<your-anon-key>
   ```
4. **Generate SSL certs** (for WebSocket support):
   ```bash
   cd agents/capture-agent-py
   python3 generate_cert.py
   cd ../..
   ```
5. **Start dev server**: `pnpm dev`

### HTTPS Development

- **Required**: For secure WebSocket connections (capture agent)
- **Certificates**: Auto-generated via mkcert
- **Location**: `agents/capture-agent-py/localhost.pem` and `localhost-key.pem`
- **Fallback**: HTTP if certificates not found (with warning)

---

## Testing

### Current State

**⚠️ NO TESTING FRAMEWORK CONFIGURED**

This project currently has:

- ✅ TypeScript type checking
- ✅ ESLint linting
- ✅ Prettier formatting
- ❌ No unit tests
- ❌ No integration tests
- ❌ No E2E tests
- ❌ No component tests

### Recommendations (For Future Implementation)

**When adding tests, use specialized agents**:

- Use `test-automator` agent for setting up test infrastructure
- Use `qa-expert` agent for test strategy planning
- Use `frontend-developer` or `react-specialist` for component tests

**Recommended Stack**:

- **Vitest** - Unit testing (Vite-native)
- **React Testing Library** - Component testing
- **Playwright** - E2E testing
- Coverage target: 70%+ on critical paths

---

## CI/CD

### GitHub Actions Workflows

#### PR Checks (`.github/workflows/pr-checks.yml`)

- **Trigger**: Pull requests to `main` or `beta`
- **Smart detection**: Only checks changed files
- **Jobs**:
  - TypeScript: ESLint + type checking + Prettier
  - Python: MyPy type checking
  - SQL: SQLFluff linting + migration safety

#### Build Installers (`.github/workflows/build-installers.yml`)

- **Trigger**: GitHub releases
- **Platforms**: macOS (.pkg) and Windows (.exe)
- **Purpose**: Builds capture agent desktop installers
- **Output**: Uploaded to GitHub releases

### Pre-commit Hooks

- **Tool**: Husky + lint-staged
- **Checks**: ESLint, TypeScript, Prettier, Ruff (Python), SQLFluff (SQL)
- **Configuration**: `.lintstagedrc` with workspace-aware checks

---

## Deployment

### Web Application

- **Primary**: Netlify (configured in `netlify.toml`)
- **Build command**: `pnpm build`
- **Publish directory**: `apps/web/dist`
- **Node version**: 20
- **pnpm version**: 10

**Alternatives**:

- Vercel
- AWS S3 + CloudFront
- Any static hosting provider

### Capture Agent

- **Distribution**: GitHub Releases
- **Installers**: macOS `.pkg` and Windows `.exe`
- **Build**: Automated via GitHub Actions on release

### Backend (Supabase)

- **Managed**: Supabase Cloud (recommended)
- **Self-hosted**: Docker-based (optional)
- **Migrations**: Applied via Supabase dashboard or CLI

---

## Performance Considerations

### Audio Processing

- **Browser limitations**: Use AudioWorklet for low-latency processing
- **SharedArrayBuffer**: Requires COOP/COEP headers (configured in Vite)
- **Pro features**: Delegate to Python capture agent via WebSocket

### Bundle Size

- **Current**: No route-based code splitting
- **Recommendation**: Use `React.lazy()` for 60+ page components
- **Optimization**: Vite handles tree-shaking automatically

### Database

- **Indexes**: 26 indexes on high-traffic queries
- **RLS**: Efficient policies with indexed columns
- **Real-time**: Use filtered subscriptions to reduce payload

---

## Security Best Practices

### Data Access

- **Never bypass RLS**: Always use Supabase client with user context
- **Input sanitization**: Validate all user inputs
- **Share codes**: Use cryptographically secure random generation

### Environment Variables

- **Never commit**: Add to `.gitignore`
- **Use Vite prefix**: `VITE_` for client-side variables
- **Sensitive keys**: Use Netlify environment variables for production

### Authentication

- **JWT validation**: Handled by Supabase automatically
- **Session management**: Automatic refresh via Supabase client
- **Protected routes**: Always use `<ProtectedRoute>` wrapper

---

## Common Tasks & Sub-Agent Usage

### Adding a New Feature

1. **Planning**: Use `architect-reviewer` agent to design architecture
2. **Implementation**: Use `react-specialist` or `fullstack-developer` agent
3. **Database changes**: Use `database-administrator` agent for migrations
4. **Testing**: Use `test-automator` agent to add tests
5. **Review**: Use `code-reviewer` agent before PR

### Fixing a Bug

1. **Investigation**: Use `debugger` agent to identify root cause
2. **Fix implementation**: Use appropriate specialist agent
3. **Testing**: Verify fix with manual testing (no automated tests yet)
4. **Code review**: Use `code-reviewer` agent

### Refactoring Code

1. **Analysis**: Use `architect-reviewer` to assess current state
2. **Refactoring**: Use `refactoring-specialist` agent
3. **Type checking**: Run `pnpm typecheck` to verify
4. **Testing**: Manual verification (no automated tests)

### Database Changes

1. **Schema design**: Use `database-administrator` agent
2. **Migration creation**: Create SQL file in `supabase/migrations/`
3. **RLS policies**: Add security policies in same migration
4. **Testing**: Test locally via `supabase start`

### Performance Optimization

1. **Profiling**: Use browser DevTools or React DevTools Profiler
2. **Optimization**: Use `performance-engineer` agent
3. **Database**: Use `database-optimizer` agent for query tuning
4. **Verification**: Lighthouse score and manual testing

### Adding Documentation

1. **Technical docs**: Use `documentation-engineer` agent
2. **API docs**: Use `api-documenter` agent
3. **Component docs**: Use `technical-writer` agent

## Again, these are just examples. There may be a use case where another sub-agent is a better fit.

## Important Files Reference

### Configuration

- [vite.config.ts](apps/web/vite.config.ts) - Vite build configuration
- [tailwind.config.js](apps/web/tailwind.config.js) - Tailwind CSS setup
- [tsconfig.json](tsconfig.json) - Root TypeScript config
- [eslint.config.js](eslint.config.js) - ESLint rules
- [netlify.toml](netlify.toml) - Deployment configuration
- [package.json](package.json) - Root workspace config

### Core Application

- [App.tsx](apps/web/src/App.tsx) - Root component with routing
- [main.tsx](apps/web/src/main.tsx) - Application entry point
- [AuthContext.tsx](apps/web/src/lib/AuthContext.tsx) - Authentication provider
- [supabase.ts](apps/web/src/lib/supabase.ts) - Supabase client

### Database

- [supabase/migrations/](supabase/migrations/) - Database schema migrations
- [supabase/functions/](supabase/functions/) - Edge Functions

---

## Key Architectural Decisions

### Why React over Next.js?

- **Audio processing**: Requires client-side Web Audio API
- **Real-time**: AudioWorklet needs browser environment
- **Complexity**: SPA architecture simpler for audio-heavy features
- **Future**: Could migrate to Next.js for SEO if needed

### Why Supabase over custom backend?

- **Rapid development**: Auth, database, real-time out of box
- **PostgreSQL**: Full SQL power with RLS security
- **Scalability**: Managed service handles scaling
- **Cost**: Free tier suitable for MVP, scales with usage

### Why pnpm workspaces over Turborepo?

- **Simplicity**: Sufficient for current scale
- **Performance**: pnpm is fast enough
- **Future**: Can add Turborepo if CI time becomes issue

### Why no testing framework?

- **Technical debt**: Acknowledged gap in the project
- **Priority**: Feature development prioritized over testing
- **Future**: Should be addressed before significant scaling

---

## Troubleshooting

### "Cannot find module '@/...'"

- Check `tsconfig.app.json` has correct path mapping
- Restart TypeScript server in VSCode
- Verify file exists at expected location

### Supabase connection errors

- Verify `.env` file exists with correct credentials
- Check Supabase project is running (`supabase status`)
- Ensure RLS policies allow access for your query

### WebSocket connection fails

- Generate SSL certificates: `cd agents/capture-agent-py && python3 generate_cert.py`
- Ensure dev server is running on HTTPS
- Check capture agent is running on port 9469

### Build fails with type errors

- Run `pnpm typecheck` to see all errors
- Check for missing dependencies: `pnpm install`
- Verify all workspace packages are built: `pnpm -r build`

### Pre-commit hook fails

- Run failing command manually to see full error
- Fix issues: `pnpm lint --fix` or `pnpm prettier --write .`
- Use `git commit --no-verify` only as last resort

---

## Git Workflow

### Branches

- `main` - Production branch
- `beta` - Development/beta testing branch
- Feature branches - Named descriptively

### Commit Messages

- Use conventional commits format (optional but recommended)
- Be descriptive: "Add audio analyzer calibration" vs "update code"
- Reference issues if applicable: "Fix #123: Resolve share link bug"

### Pull Requests

- Target `beta` branch for development/beta releases
- Target `main` for production releases
- CI checks must pass (ESLint, TypeScript, Prettier)
- Request review from team members/sub-agents

---

## Resources

### Documentation

- [README.md](README.md) - Setup and getting started
- [Supabase Docs](https://supabase.com/docs) - Backend documentation
- [React Docs](https://react.dev) - React reference
- [Vite Docs](https://vitejs.dev) - Build tool documentation
- [Tailwind CSS](https://tailwindcss.com/docs) - Styling reference
- [Radix UI](https://www.radix-ui.com/primitives) - Component primitives

### Tools

- [Supabase Studio](http://localhost:54323) - Local database GUI
- [React DevTools](https://react.dev/learn/react-developer-tools) - Component inspection
- [Chrome DevTools](https://developer.chrome.com/docs/devtools/) - Performance profiling

---

## Remember

1. **ALWAYS use appropriate sub-agents** for specialized tasks
2. **Type safety first** - No implicit any types
3. **Security conscious** - Never bypass RLS, validate inputs
4. **Path aliases** - Use `@/*` for clean imports
5. **Pre-commit checks** - Let Husky catch issues early
6. **No testing** - Manual verification required (for now)
7. **Workspace awareness** - Remember this is a monorepo
8. **Documentation** - Update this file when architecture changes

---

_Last updated: 2025-10-01_
_Project version: 1.5.6.8_
