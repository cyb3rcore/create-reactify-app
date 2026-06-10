# create-cyber-stack CLI — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `create-cyber-stack` CLI monorepo — a tool that scaffolds SSR web apps from the `cybercore-ma/template-amal` template, with optional feature selection.

**Architecture:** Bun monorepo with three packages: `types` (Zod schemas), `template-generator` (VirtualFileSystem + Handlebars handlers + post-processors), and `cli` (citty arg parsing + template fetch + disk write + install). Templates are fetched from a remote GitHub repo at scaffold time; a local `templates/` directory is provided at the monorepo root for development.

**Tech Stack:** Bun, TypeScript 5.9, citty, @clack/prompts, consola, Handlebars, Zod, tsdown

---

## File Structure

```
create-cyber-stack/
├── package.json                     # bun workspace root
├── tsconfig.json                    # shared TS config
├── bunfig.toml
├── .gitignore
├── templates/                       # LOCAL dev templates (mirrors template-amal repo)
│   └── core/
│       └── package.json.hbs
│
├── packages/
│   ├── types/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── build.config.ts
│   │   └── src/
│   │       ├── index.ts
│   │       ├── schemas.ts
│   │       └── constants.ts
│   │
│   ├── template-generator/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── build.config.ts
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── generator.ts
│   │   │   ├── core/
│   │   │   │   └── virtual-fs.ts
│   │   │   ├── handlers/
│   │   │   │   ├── core.ts
│   │   │   │   ├── api.ts
│   │   │   │   ├── auth.ts
│   │   │   │   └── database.ts
│   │   │   ├── addons/
│   │   │   │   ├── mcp.ts
│   │   │   │   ├── skills.ts
│   │   │   │   └── vite-plus.ts
│   │   │   └── post-process/
│   │   │       ├── index.ts
│   │   │       └── processors/
│   │   │           ├── package-json.ts
│   │   │           └── env-vars.ts
│   │   └── test/
│   │       └── generator.test.ts
│   │
│   └── cli/
│       ├── package.json
│       ├── tsconfig.json
│       ├── build.config.ts
│       └── src/
│           ├── index.ts
│           ├── cli.ts
│           ├── commands/
│           │   └── create.ts
│           ├── prompts/
│           │   └── index.ts
│           └── utils/
│               ├── template-fetcher.ts
│               ├── project-writer.ts
│               └── package-manager.ts
```

---

### Task 1: Root Monorepo Scaffold

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `bunfig.toml`
- Create: `.gitignore`

- [ ] **Step 1: Create root package.json**

```json
{
  "name": "create-cyber-stack-monorepo",
  "private": true,
  "workspaces": ["packages/*"],
  "scripts": {
    "build": "cd packages/cli && bun run build",
    "dev": "cd packages/cli && bun run dev",
    "typecheck": "tsc --noEmit",
    "test": "bun run --filter '*' test"
  },
  "packageManager": "bun@1.3.13"
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ESNext"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "dist",
    "isolatedModules": true
  }
}
```

- [ ] **Step 3: Create bunfig.toml**

```toml
[install]
registry = "https://registry.npmjs.org"
```

- [ ] **Step 4: Create .gitignore**

```
node_modules/
dist/
*.tsbuildinfo
.tmp/
```

- [ ] **Step 5: Commit**

```bash
git add package.json tsconfig.json bunfig.toml .gitignore
git commit -m "chore: scaffold monorepo root"
```

---

### Task 2: Types Package

**Files:**
- Create: `packages/types/package.json`
- Create: `packages/types/tsconfig.json`
- Create: `packages/types/build.config.ts`
- Create: `packages/types/src/schemas.ts`
- Create: `packages/types/src/constants.ts`
- Create: `packages/types/src/index.ts`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "@cyber-stack/types",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsdown",
    "dev": "tsdown --watch"
  },
  "dependencies": {
    "zod": "^4.4.0"
  },
  "devDependencies": {
    "tsdown": "^0.22.0",
    "typescript": "^5.9.0"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create build.config.ts**

```typescript
import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["./src/index.ts"],
  format: ["esm"],
  clean: true,
  dts: true,
});
```

- [ ] **Step 4: Create schemas.ts**

```typescript
import { z } from "zod";

export const ProjectNameSchema = z.string().min(1).max(255);

export const RuntimeSchema = z.enum(["bun", "node"]);

export const APISchema = z.enum(["trpc", "orpc", "none"]);

export const AuthSchema = z.enum(["better-auth", "none"]);

export const DatabaseSchema = z.enum(["sqlite", "postgres", "none"]);

export const ORMSchema = z.enum(["drizzle", "none"]);

export const PackageManagerSchema = z.enum(["npm", "pnpm", "bun"]);

export const AddonSchema = z.enum(["mcp", "skills", "vite-plus"]);

export const AddonsSchema = z.array(AddonSchema);

export const ProjectConfigSchema = z.object({
  projectName: ProjectNameSchema,
  projectDir: z.string(),
  template: z.literal("amal"),
  runtime: RuntimeSchema,
  api: APISchema,
  auth: AuthSchema,
  database: DatabaseSchema,
  orm: ORMSchema,
  packageManager: PackageManagerSchema,
  git: z.boolean(),
  install: z.boolean(),
  addons: AddonsSchema,
});

export type ProjectConfig = z.infer<typeof ProjectConfigSchema>;
export type Runtime = z.infer<typeof RuntimeSchema>;
export type API = z.infer<typeof APISchema>;
export type Auth = z.infer<typeof AuthSchema>;
export type Database = z.infer<typeof DatabaseSchema>;
export type ORM = z.infer<typeof ORMSchema>;
export type PackageManager = z.infer<typeof PackageManagerSchema>;
export type Addon = z.infer<typeof AddonSchema>;
```

- [ ] **Step 5: Create constants.ts**

```typescript
import type { ProjectConfig } from "./schemas";

export const DEFAULT_CONFIG: ProjectConfig = {
  projectName: "my-app",
  projectDir: "",
  template: "amal",
  runtime: "bun",
  api: "none",
  auth: "none",
  database: "none",
  orm: "none",
  packageManager: "bun",
  git: true,
  install: false,
  addons: [],
};

export const RUNTIME_VALUES = ["bun", "node"] as const;
export const API_VALUES = ["trpc", "orpc", "none"] as const;
export const AUTH_VALUES = ["better-auth", "none"] as const;
export const DATABASE_VALUES = ["sqlite", "postgres", "none"] as const;
export const ORM_VALUES = ["drizzle", "none"] as const;
export const PACKAGE_MANAGER_VALUES = ["npm", "pnpm", "bun"] as const;
export const ADDON_VALUES = ["mcp", "skills", "vite-plus"] as const;
```

- [ ] **Step 6: Create index.ts**

```typescript
export * from "./schemas";
export * from "./constants";
```

- [ ] **Step 7: Install and build**

Run: `cd packages/types && bun install && bun run build`
Expected: `dist/index.js` and `dist/index.d.ts` created successfully.

- [ ] **Step 8: Commit**

```bash
git add packages/types/
git commit -m "feat: add types package with zod schemas"
```

---

### Task 3: Template Generator — VirtualFileSystem + Core

**Files:**
- Create: `packages/template-generator/package.json`
- Create: `packages/template-generator/tsconfig.json`
- Create: `packages/template-generator/build.config.ts`
- Create: `packages/template-generator/src/core/virtual-fs.ts`
- Create: `packages/template-generator/src/generator.ts`
- Create: `packages/template-generator/src/index.ts`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "@cyber-stack/template-generator",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsdown",
    "dev": "tsdown --watch",
    "test": "bun test"
  },
  "dependencies": {
    "@cyber-stack/types": "workspace:*",
    "handlebars": "^4.7.9"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "tsdown": "^0.22.0",
    "typescript": "^5.9.0"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create build.config.ts**

```typescript
import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["./src/index.ts"],
  format: ["esm"],
  clean: true,
  dts: true,
});
```

- [ ] **Step 4: Create VirtualFileSystem (virtual-fs.ts)**

```typescript
export interface VFSFile {
  path: string;
  content: string;
}

export interface VFSNode {
  name: string;
  type: "file" | "directory";
  path: string;
  children?: VFSNode[];
  content?: string;
}

export class VirtualFileSystem {
  private files: Map<string, string> = new Map();

  writeFile(path: string, content: string): void {
    this.files.set(path, content);
  }

  readFile(path: string): string | undefined {
    return this.files.get(path);
  }

  exists(path: string): boolean {
    return this.files.has(path);
  }

  deleteFile(path: string): void {
    this.files.delete(path);
  }

  getAllFiles(): string[] {
    return Array.from(this.files.keys()).sort();
  }

  getFileCount(): number {
    return this.files.size;
  }

  toTree(rootName: string = "project"): VFSNode {
    const root: VFSNode = {
      name: rootName,
      type: "directory",
      path: "/",
      children: [],
    };

    for (const [filePath, content] of this.files) {
      const parts = filePath.split("/").filter(Boolean);
      let current = root;

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const isLast = i === parts.length - 1;
        const parentPath = parts.slice(0, i).join("/");
        const fullPath = parentPath ? `${parentPath}/${part}` : part;

        if (isLast) {
          current.children!.push({
            name: part,
            type: "file",
            path: fullPath,
            content,
          });
        } else {
          let dir = current.children!.find(
            (c) => c.name === part && c.type === "directory"
          ) as VFSNode | undefined;
          if (!dir) {
            dir = {
              name: part,
              type: "directory",
              path: fullPath,
              children: [],
            };
            current.children!.push(dir);
          }
          current = dir;
        }
      }
    }

    return root;
  }
}
```

- [ ] **Step 5: Create generator.ts**

```typescript
import Handlebars from "handlebars";
import type { ProjectConfig } from "@cyber-stack/types";
import { VirtualFileSystem } from "./core/virtual-fs";

Handlebars.registerHelper("eq", (a: unknown, b: unknown) => a === b);
Handlebars.registerHelper("ne", (a: unknown, b: unknown) => a !== b);
Handlebars.registerHelper("and", (...args: unknown[]) =>
  args.slice(0, -1).every(Boolean)
);
Handlebars.registerHelper("or", (...args: unknown[]) =>
  args.slice(0, -1).some(Boolean)
);
Handlebars.registerHelper(
  "includes",
  (arr: unknown[], val: unknown) => Array.isArray(arr) && arr.includes(val)
);

export interface TemplateMap {
  [path: string]: string;
}

export function processTemplatesFromPrefix(
  vfs: VirtualFileSystem,
  templates: TemplateMap,
  prefix: string,
  outputPrefix: string,
  config: ProjectConfig
): void {
  const prefixPath = prefix.replace(/\/$/, "") + "/";

  for (const [templatePath, rawContent] of Object.entries(templates)) {
    if (!templatePath.startsWith(prefixPath)) continue;

    const relativePath = templatePath.slice(prefixPath.length);
    const outputPath = outputPrefix
      ? `${outputPrefix.replace(/\/$/, "")}/${relativePath}`
      : relativePath;

    // Render Handlebars template
    const template = Handlebars.compile(rawContent);
    const rendered = template(config);
    const finalPath = outputPath.replace(/\.hbs$/, "").replace(/^_/, ".");

    vfs.writeFile(finalPath, rendered);
  }
}

export function generateProject(
  vfs: VirtualFileSystem,
  templates: TemplateMap,
  config: ProjectConfig
): void {
  // Handlers will be called in order by the CLI
  // This function orchestrates the full pipeline
}
```

- [ ] **Step 6: Create index.ts**

```typescript
export { VirtualFileSystem } from "./core/virtual-fs";
export type { VFSNode, VFSFile } from "./core/virtual-fs";
export { processTemplatesFromPrefix, generateProject } from "./generator";
```

- [ ] **Step 7: Install and build**

Run: `cd packages/template-generator && bun install && bun run build`
Expected: Build succeeds.

- [ ] **Step 8: Commit**

```bash
git add packages/template-generator/
git commit -m "feat: add template-generator package with VFS and Handlebars"
```

---

### Task 4: Template Generator — Feature Handlers

**Files:**
- Create: `packages/template-generator/src/handlers/core.ts`
- Create: `packages/template-generator/src/handlers/api.ts`
- Create: `packages/template-generator/src/handlers/auth.ts`
- Create: `packages/template-generator/src/handlers/database.ts`
- Modify: `packages/template-generator/src/generator.ts`

- [ ] **Step 1: Create core handler (handlers/core.ts)**

```typescript
import type { ProjectConfig } from "@cyber-stack/types";
import type { TemplateMap } from "../generator";
import { processTemplatesFromPrefix } from "../generator";
import type { VirtualFileSystem } from "../core/virtual-fs";

export function processCore(
  vfs: VirtualFileSystem,
  templates: TemplateMap,
  config: ProjectConfig
): void {
  processTemplatesFromPrefix(vfs, templates, "templates/core", "", config);
}
```

- [ ] **Step 2: Create api handler (handlers/api.ts)**

```typescript
import type { ProjectConfig } from "@cyber-stack/types";
import type { TemplateMap } from "../generator";
import { processTemplatesFromPrefix } from "../generator";
import type { VirtualFileSystem } from "../core/virtual-fs";

export function processApi(
  vfs: VirtualFileSystem,
  templates: TemplateMap,
  config: ProjectConfig
): void {
  if (config.api === "none") return;

  processTemplatesFromPrefix(
    vfs,
    templates,
    `templates/api/${config.api}`,
    "",
    config
  );
}
```

- [ ] **Step 3: Create auth handler (handlers/auth.ts)**

```typescript
import type { ProjectConfig } from "@cyber-stack/types";
import type { TemplateMap } from "../generator";
import { processTemplatesFromPrefix } from "../generator";
import type { VirtualFileSystem } from "../core/virtual-fs";

export function processAuth(
  vfs: VirtualFileSystem,
  templates: TemplateMap,
  config: ProjectConfig
): void {
  if (config.auth === "none") {
    // Still process the stub provider so imports don't break
    processTemplatesFromPrefix(
      vfs,
      templates,
      "templates/auth/none",
      "",
      config
    );
    return;
  }

  processTemplatesFromPrefix(
    vfs,
    templates,
    `templates/auth/${config.auth}`,
    "",
    config
  );
}
```

- [ ] **Step 4: Create database handler (handlers/database.ts)**

```typescript
import type { ProjectConfig } from "@cyber-stack/types";
import type { TemplateMap } from "../generator";
import { processTemplatesFromPrefix } from "../generator";
import type { VirtualFileSystem } from "../core/virtual-fs";

export function processDatabase(
  vfs: VirtualFileSystem,
  templates: TemplateMap,
  config: ProjectConfig
): void {
  if (config.database === "none") return;

  processTemplatesFromPrefix(
    vfs,
    templates,
    `templates/database/${config.database}`,
    "",
    config
  );
}
```

- [ ] **Step 5: Update generator.ts to wire handlers**

Edit `packages/template-generator/src/generator.ts` — replace the `generateProject` function:

```typescript
import Handlebars from "handlebars";
import type { ProjectConfig } from "@cyber-stack/types";
import { VirtualFileSystem } from "./core/virtual-fs";
import { processCore } from "./handlers/core";
import { processApi } from "./handlers/api";
import { processAuth } from "./handlers/auth";
import { processDatabase } from "./handlers/database";

Handlebars.registerHelper("eq", (a: unknown, b: unknown) => a === b);
Handlebars.registerHelper("ne", (a: unknown, b: unknown) => a !== b);
Handlebars.registerHelper("and", (...args: unknown[]) =>
  args.slice(0, -1).every(Boolean)
);
Handlebars.registerHelper("or", (...args: unknown[]) =>
  args.slice(0, -1).some(Boolean)
);
Handlebars.registerHelper(
  "includes",
  (arr: unknown[], val: unknown) => Array.isArray(arr) && arr.includes(val)
);

export interface TemplateMap {
  [path: string]: string;
}

export function processTemplatesFromPrefix(
  vfs: VirtualFileSystem,
  templates: TemplateMap,
  prefix: string,
  outputPrefix: string,
  config: ProjectConfig
): void {
  const prefixPath = prefix.replace(/\/$/, "") + "/";

  for (const [templatePath, rawContent] of Object.entries(templates)) {
    if (!templatePath.startsWith(prefixPath)) continue;

    const relativePath = templatePath.slice(prefixPath.length);
    const outputPath = outputPrefix
      ? `${outputPrefix.replace(/\/$/, "")}/${relativePath}`
      : relativePath;

    const template = Handlebars.compile(rawContent);
    const rendered = template(config);
    const finalPath = outputPath.replace(/\.hbs$/, "").replace(/^_/, ".");

    vfs.writeFile(finalPath, rendered);
  }
}

export function generateProject(
  vfs: VirtualFileSystem,
  templates: TemplateMap,
  config: ProjectConfig
): void {
  processCore(vfs, templates, config);
  processApi(vfs, templates, config);
  processAuth(vfs, templates, config);
  processDatabase(vfs, templates, config);
}
```

- [ ] **Step 6: Build to verify**

Run: `cd packages/template-generator && bun run build`
Expected: Build succeeds.

- [ ] **Step 7: Commit**

```bash
git add packages/template-generator/
git commit -m "feat: add feature handlers for api, auth, database"
```

---

### Task 5: Template Generator — Addons + Post-Processors

**Files:**
- Create: `packages/template-generator/src/addons/mcp.ts`
- Create: `packages/template-generator/src/addons/skills.ts`
- Create: `packages/template-generator/src/addons/vite-plus.ts`
- Create: `packages/template-generator/src/post-process/index.ts`
- Create: `packages/template-generator/src/post-process/processors/package-json.ts`
- Create: `packages/template-generator/src/post-process/processors/env-vars.ts`
- Modify: `packages/template-generator/src/generator.ts` (wire addons + post-process)

- [ ] **Step 1: Create addon directories**

Run: `mkdir -p packages/template-generator/src/addons packages/template-generator/src/post-process/processors`

- [ ] **Step 2: Create mcp addon (addons/mcp.ts)**

```typescript
import type { ProjectConfig } from "@cyber-stack/types";
import type { TemplateMap } from "../generator";
import { processTemplatesFromPrefix } from "../generator";
import type { VirtualFileSystem } from "../core/virtual-fs";

export function processMcp(
  vfs: VirtualFileSystem,
  templates: TemplateMap,
  config: ProjectConfig
): void {
  if (!config.addons.includes("mcp")) return;
  processTemplatesFromPrefix(vfs, templates, "templates/addons/mcp", "", config);
}
```

- [ ] **Step 3: Create skills addon (addons/skills.ts)**

```typescript
import type { ProjectConfig } from "@cyber-stack/types";
import type { TemplateMap } from "../generator";
import { processTemplatesFromPrefix } from "../generator";
import type { VirtualFileSystem } from "../core/virtual-fs";

export function processSkills(
  vfs: VirtualFileSystem,
  templates: TemplateMap,
  config: ProjectConfig
): void {
  if (!config.addons.includes("skills")) return;
  processTemplatesFromPrefix(vfs, templates, "templates/addons/skills", "", config);
}
```

- [ ] **Step 4: Create vite-plus addon (addons/vite-plus.ts)**

```typescript
import type { ProjectConfig } from "@cyber-stack/types";
import type { VirtualFileSystem } from "../core/virtual-fs";

export function processVitePlus(
  vfs: VirtualFileSystem,
  _config: ProjectConfig
): void {
  if (!_config.addons.includes("vite-plus")) return;

  // Modify the existing vite.config.ts in the VFS to add HTTPS and tunnel
  const viteConfig = vfs.readFile("vite.config.ts");
  if (!viteConfig) return;

  const enhancedConfig = viteConfig.replace(
    "export default defineConfig({",
    `export default defineConfig({
  server: {
    https: {},
    host: true,
  },`
  );

  vfs.writeFile("vite.config.ts", enhancedConfig);
}
```

- [ ] **Step 5: Create package-json post-processor (post-process/processors/package-json.ts)**

```typescript
import type { ProjectConfig } from "@cyber-stack/types";
import type { VirtualFileSystem } from "../../core/virtual-fs";

export function processPackageJson(
  vfs: VirtualFileSystem,
  config: ProjectConfig
): void {
  const content = vfs.readFile("package.json");
  if (!content) return;

  const pkg = JSON.parse(content);

  // Set project name
  pkg.name = config.projectName;

  // Remove unused dependency blocks based on features
  if (config.api === "none" && pkg.dependencies) {
    delete pkg.dependencies["@trpc/server"];
    delete pkg.dependencies["@orpc/server"];
    delete pkg.dependencies["@trpc/client"];
    delete pkg.dependencies["@orpc/client"];
  }

  if (config.auth === "none" && pkg.dependencies) {
    delete pkg.dependencies["better-auth"];
    delete pkg.dependencies["@better-auth/fastify"];
  }

  if (config.database === "none" && pkg.dependencies) {
    delete pkg.dependencies["drizzle-orm"];
    delete pkg.dependencies["better-sqlite3"];
    delete pkg.dependencies["pg"];
  }

  if (config.database === "sqlite" && pkg.dependencies) {
    delete pkg.dependencies["pg"];
  }

  if (config.database === "postgres" && pkg.dependencies) {
    delete pkg.dependencies["better-sqlite3"];
  }

  vfs.writeFile("package.json", JSON.stringify(pkg, null, 2) + "\n");
}
```

- [ ] **Step 6: Create env-vars post-processor (post-process/processors/env-vars.ts)**

```typescript
import type { ProjectConfig } from "@cyber-stack/types";
import type { VirtualFileSystem } from "../../core/virtual-fs";

export function processEnvVars(
  vfs: VirtualFileSystem,
  config: ProjectConfig
): void {
  const vars: string[] = [
    `# ${config.projectName}`,
    `NODE_ENV=development`,
  ];

  if (config.database === "sqlite") {
    vars.push(`DATABASE_URL=file:./data/${config.projectName}.db`);
  } else if (config.database === "postgres") {
    vars.push(`DATABASE_URL=postgres://localhost:5432/${config.projectName}`);
  }

  if (config.auth !== "none") {
    vars.push(`AUTH_SECRET=change-me-to-a-random-secret`);
    vars.push(`AUTH_URL=http://localhost:3000`);
  }

  vfs.writeFile(".env", vars.join("\n") + "\n");
}
```

- [ ] **Step 7: Create post-process index (post-process/index.ts)**

```typescript
import type { ProjectConfig } from "@cyber-stack/types";
import type { VirtualFileSystem } from "../core/virtual-fs";
import { processPackageJson } from "./processors/package-json";
import { processEnvVars } from "./processors/env-vars";

export function runPostProcessors(
  vfs: VirtualFileSystem,
  config: ProjectConfig
): void {
  processPackageJson(vfs, config);
  processEnvVars(vfs, config);
}
```

- [ ] **Step 8: Update generator.ts to wire addons + post-process**

Replace the `generateProject` function in `packages/template-generator/src/generator.ts`:

```typescript
import Handlebars from "handlebars";
import type { ProjectConfig } from "@cyber-stack/types";
import { VirtualFileSystem } from "./core/virtual-fs";
import { processCore } from "./handlers/core";
import { processApi } from "./handlers/api";
import { processAuth } from "./handlers/auth";
import { processDatabase } from "./handlers/database";
import { processMcp } from "./addons/mcp";
import { processSkills } from "./addons/skills";
import { processVitePlus } from "./addons/vite-plus";
import { runPostProcessors } from "./post-process";

// ... (Handlebars helper registrations remain the same) ...

export function generateProject(
  vfs: VirtualFileSystem,
  templates: TemplateMap,
  config: ProjectConfig
): void {
  processCore(vfs, templates, config);
  processApi(vfs, templates, config);
  processAuth(vfs, templates, config);
  processDatabase(vfs, templates, config);
  processMcp(vfs, templates, config);
  processSkills(vfs, templates, config);
  processVitePlus(vfs, config);
  runPostProcessors(vfs, config);
}
```

- [ ] **Step 9: Build to verify**

Run: `cd packages/template-generator && bun run build`
Expected: Build succeeds.

- [ ] **Step 10: Commit**

```bash
git add packages/template-generator/
git commit -m "feat: add addons and post-processors to template-generator"
```

---

### Task 6: Development Templates

**Files:**
- Create: `templates/core/package.json.hbs`
- Create: `templates/core/tsconfig.json.hbs`
- Create: `templates/core/src/server.ts.hbs`
- Create: `templates/api/trpc/src/server/plugins/trpc.ts.hbs`
- Create: `templates/api/orpc/src/server/plugins/orpc.ts.hbs`
- Create: `templates/auth/better-auth/src/server/plugins/auth.ts.hbs`
- Create: `templates/auth/none/src/client/providers/auth.tsx.hbs`
- Create: `templates/database/sqlite/src/db/client.ts.hbs`
- Create: `templates/database/postgres/src/db/client.ts.hbs`

These are representative templates for development and testing. The full template set will live in the `cybercore-ma/template-amal` repo.

- [ ] **Step 1: Create core templates**

Create `templates/core/package.json.hbs`:

```handlebars
{
  "name": "{{projectName}}",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx src/server.ts --dev",
    "start": "NODE_ENV=production tsx dist/server.ts",
    "build": "vite build --ssrManifest && vite build --ssr",
    "clean": "rm -rf dist tsconfig.tsbuildinfo"
  },
  "dependencies": {
    "@fastify/formbody": "^8.0.2",
    "@fastify/one-line-logger": "^2.0.2",
    "@fastify/react": "^1.1.5",
    "@fastify/vite": "^8.4.1",
    "fastify": "^5.7.4",
    "react": "^19.2.3",
    "react-dom": "^19.2.3",
    "react-router": "^7.12.0",
    "valtio": "^2.1.4"
    {{#if (eq runtime "bun")}}
    ,"bun": "^1.3.0"
    {{/if}}
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^5.1.0",
    "tsx": "^4.19.0",
    "typescript": "^5.9.0",
    "vite": "^7.3.0",
    "vite-tsconfig-paths": "^6.1.0"
  }
}
```

Create `templates/core/tsconfig.json.hbs`:

```handlebars
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "lib": ["DOM", "DOM.Iterable", "ESNext"],
    "outDir": "dist",
    "rootDir": "src",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"]
}
```

Create `templates/core/src/server.ts.hbs`:

```handlebars
import { resolve } from 'node:path'
import Fastify from 'fastify'
import FastifyVite from '@fastify/vite'
import FastifyFormBody from '@fastify/formbody'

const server = Fastify({
  logger: {
    transport: {
      target: '@fastify/one-line-logger',
    },
  },
})

await server.register(FastifyFormBody)

await server.register(FastifyVite, {
  root: resolve(import.meta.dirname, '..'),
  renderer: '@fastify/react',
})

await server.vite.ready()

await server.listen({ port: 3000 })
```

- [ ] **Step 2: Create API templates**

Create `templates/api/trpc/src/server/plugins/trpc.ts.hbs`:

```handlebars
import { initTRPC } from '@trpc/server'
import type { FastifyInstance } from 'fastify'

export async function registerTRPC(server: FastifyInstance) {
  const t = initTRPC.create()

  const router = t.router({
    hello: t.procedure.query(() => 'Hello from tRPC!'),
  })

  server.get('/api/trpc/*', async (request, reply) => {
    // tRPC Fastify adapter handling
    reply.send({ ok: true })
  })
}
```

Create `templates/api/orpc/src/server/plugins/orpc.ts.hbs`:

```handlebars
// OpenRPC integration placeholder
import type { FastifyInstance } from 'fastify'

export async function registerORPC(server: FastifyInstance) {
  server.get('/api/health', async () => ({ status: 'ok' }))
}
```

- [ ] **Step 3: Create auth templates**

Create `templates/auth/better-auth/src/server/plugins/auth.ts.hbs`:

```handlebars
import { betterAuth } from 'better-auth'
import type { FastifyInstance } from 'fastify'

export async function registerAuth(server: FastifyInstance) {
  const auth = betterAuth({
    database: {
      provider: '{{#if (eq database "sqlite")}}sqlite{{/if}}{{#if (eq database "postgres")}}postgres{{/if}}',
      url: process.env.DATABASE_URL!,
    },
    emailAndPassword: { enabled: true },
  })

  // Auth routes handled by better-auth's Fastify plugin
  server.register(auth.handler)
}
```

Create `templates/auth/none/src/client/providers/auth.tsx.hbs`:

```handlebars
import { createContext, useContext, type ReactNode } from 'react'

interface AuthContextValue {
  user: null
  login: () => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  login: () => {},
  logout: () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <AuthContext.Provider value={{ user: null, login: () => {}, logout: () => {} }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
```

- [ ] **Step 4: Create database templates**

Create `templates/database/sqlite/src/db/client.ts.hbs`:

```handlebars
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'

const sqlite = new Database(process.env.DATABASE_URL || './data/{{projectName}}.db')
export const db = drizzle(sqlite)
```

Create `templates/database/postgres/src/db/client.ts.hbs`:

```handlebars
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

export const db = drizzle(pool)
```

- [ ] **Step 5: Commit**

```bash
git add templates/
git commit -m "feat: add development templates for all features"
```

---

### Task 7: CLI Package — Core Setup

**Files:**
- Create: `packages/cli/package.json`
- Create: `packages/cli/tsconfig.json`
- Create: `packages/cli/build.config.ts`
- Create: `packages/cli/src/index.ts`
- Create: `packages/cli/src/cli.ts`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "create-cyber-stack",
  "version": "0.1.0",
  "description": "Scaffold SSR web applications with the Amal stack",
  "type": "module",
  "bin": {
    "create-cyber-stack": "./dist/cli.mjs"
  },
  "exports": {
    ".": {
      "types": "./dist/index.d.mts",
      "import": "./dist/index.mjs"
    },
    "./cli": {
      "import": "./dist/cli.mjs"
    }
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsdown",
    "dev": "tsdown --watch",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@cyber-stack/template-generator": "workspace:*",
    "@cyber-stack/types": "workspace:*",
    "@clack/prompts": "^1.4.0",
    "citty": "^1.0.0",
    "consola": "^3.4.2",
    "handlebars": "^4.7.9",
    "picocolors": "^1.1.1",
    "zod": "^4.4.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "tsdown": "^0.22.0",
    "typescript": "^5.9.0"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create build.config.ts**

```typescript
import { defineConfig } from "tsdown";

export default defineConfig({
  entry: [
    "./src/index.ts",
    { name: "cli", input: "./src/cli.ts" },
  ],
  format: ["esm"],
  clean: true,
  dts: true,
});
```

- [ ] **Step 4: Create index.ts**

```typescript
export { createProject } from "./commands/create";
export type { CreateOptions } from "./commands/create";
```

- [ ] **Step 5: Create cli.ts (executable entry)**

```typescript
#!/usr/bin/env node
import { runCli } from "./commands/create";

await runCli();
```

- [ ] **Step 6: Install and build**

Run: `cd packages/cli && bun install && bun run build`
Expected: Build succeeds, `dist/cli.mjs` exists.

- [ ] **Step 7: Commit**

```bash
git add packages/cli/
git commit -m "feat: scaffold CLI package with entry points"
```

---

### Task 8: CLI Package — Create Command

**Files:**
- Create: `packages/cli/src/commands/create.ts`
- Create: `packages/cli/src/utils/template-fetcher.ts`
- Create: `packages/cli/src/utils/project-writer.ts`
- Create: `packages/cli/src/utils/package-manager.ts`
- Create: `packages/cli/src/prompts/index.ts`

- [ ] **Step 1: Create template-fetcher (utils/template-fetcher.ts)**

```typescript
import type { TemplateMap } from "@cyber-stack/template-generator";

interface TemplateFetcherOptions {
  templateDir?: string; // Local directory for dev
  remoteUrl?: string;   // Remote tarball URL for production
}

export async function fetchTemplates(
  options: TemplateFetcherOptions = {}
): Promise<TemplateMap> {
  // Development mode: load from local templates/ directory
  if (options.templateDir) {
    return loadLocalTemplates(options.templateDir);
  }

  // Production mode: fetch from GitHub (stub for now)
  if (options.remoteUrl) {
    return fetchRemoteTemplates(options.remoteUrl);
  }

  throw new Error(
    "No template source provided. Use templateDir for local development."
  );
}

async function loadLocalTemplates(dir: string): Promise<TemplateMap> {
  const fs = await import("node:fs");
  const path = await import("node:path");
  const templates: TemplateMap = {};

  function walkDir(currentDir: string, baseDir: string) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walkDir(fullPath, baseDir);
      } else if (entry.isFile()) {
        const relativePath = path.relative(baseDir, fullPath);
        const content = fs.readFileSync(fullPath, "utf-8");
        templates[relativePath] = content;
      }
    }
  }

  walkDir(dir, dir);
  return templates;
}

async function fetchRemoteTemplates(url: string): Promise<TemplateMap> {
  // TODO: Implement GitHub tarball download and extraction
  // For now, return empty map (production fetch will be implemented later)
  console.warn("Remote template fetching not yet implemented");
  return {};
}
```

- [ ] **Step 2: Create project-writer (utils/project-writer.ts)**

```typescript
import { VirtualFileSystem } from "@cyber-stack/template-generator";
import consola from "consola";

export async function writeProject(
  vfs: VirtualFileSystem,
  targetDir: string
): Promise<void> {
  const fs = await import("node:fs");
  const path = await import("node:path");

  try {
    fs.mkdirSync(targetDir, { recursive: true });
  } catch {
    throw new Error(`Cannot create directory: ${targetDir}`);
  }

  const files = vfs.getAllFiles();
  for (const filePath of files) {
    const content = vfs.readFile(filePath)!;
    const fullPath = path.join(targetDir, filePath);
    const dir = path.dirname(fullPath);

    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(fullPath, content, "utf-8");
  }

  consola.success(`Wrote ${files.length} files to ${targetDir}`);
}

export async function getProjectDir(
  projectName: string,
  parentDir?: string
): Promise<string> {
  const path = await import("node:path");
  const base = parentDir || process.cwd();
  return path.join(base, projectName);
}
```

- [ ] **Step 3: Create package-manager (utils/package-manager.ts)**

```typescript
import { execSync } from "node:child_process";
import consola from "consola";
import type { PackageManager } from "@cyber-stack/types";

export function installDependencies(
  projectDir: string,
  packageManager: PackageManager
): void {
  consola.info(`Installing dependencies with ${packageManager}...`);

  const commands: Record<PackageManager, string> = {
    npm: "npm install",
    pnpm: "pnpm install",
    bun: "bun install",
  };

  try {
    execSync(commands[packageManager], {
      cwd: projectDir,
      stdio: "inherit",
    });
  } catch (error) {
    consola.warn("Dependency installation failed. You can run it manually.");
  }
}

export function initGitRepo(projectDir: string): void {
  consola.info("Initializing git repository...");

  try {
    execSync("git init", { cwd: projectDir, stdio: "ignore" });
    execSync("git add .", { cwd: projectDir, stdio: "ignore" });
    execSync('git commit -m "initial: scaffold from create-cyber-stack"', {
      cwd: projectDir,
      stdio: "ignore",
    });
    consola.success("Git repository initialized");
  } catch {
    consola.warn("Git initialization failed. You can init it manually.");
  }
}
```

- [ ] **Step 4: Create prompts (prompts/index.ts)**

```typescript
import * as p from "@clack/prompts";
import consola from "consola";
import type { ProjectConfig, API, Auth, Database, ORM, Runtime, PackageManager, Addon } from "@cyber-stack/types";

function isCancel(value: unknown): value is symbol {
  return p.isCancel(value);
}

export async function fillMissingFlags(
  config: Partial<ProjectConfig>
): Promise<ProjectConfig> {
  p.intro("create-cyber-stack");

  const result = await p.group(
    {
      projectName: () =>
        p.text({
          message: "What is your project named?",
          initialValue: "my-app",
          validate: (value: string) => {
            if (!value) return "Project name is required";
          },
        }),
      runtime: () =>
        p.select({
          message: "Select runtime",
          options: [
            { value: "bun", label: "Bun", hint: "fast, modern" },
            { value: "node", label: "Node.js", hint: "stable, universal" },
          ],
          initialValue: config.runtime || "bun",
        }),
      api: () =>
        p.select({
          message: "Select API layer",
          options: [
            { value: "trpc", label: "tRPC", hint: "end-to-end typesafe APIs" },
            { value: "orpc", label: "OpenRPC", hint: "open-rpc standard" },
            { value: "none", label: "None" },
          ],
          initialValue: config.api || "none",
        }),
      auth: () =>
        p.select({
          message: "Select auth provider",
          options: [
            {
              value: "better-auth",
              label: "Better Auth",
              hint: "modern auth library",
            },
            { value: "none", label: "None" },
          ],
          initialValue: config.auth || "none",
        }),
      database: () =>
        p.select({
          message: "Select database",
          options: [
            { value: "sqlite", label: "SQLite", hint: "local, file-based" },
            {
              value: "postgres",
              label: "PostgreSQL",
              hint: "production-grade",
            },
            { value: "none", label: "None" },
          ],
          initialValue: config.database || "none",
        }),
      packageManager: () =>
        p.select({
          message: "Select package manager",
          options: [
            { value: "bun", label: "Bun" },
            { value: "pnpm", label: "pnpm" },
            { value: "npm", label: "npm" },
          ],
          initialValue: config.packageManager || "bun",
        }),
    },
    {
      onCancel: () => {
        p.cancel("Operation cancelled.");
        process.exit(0);
      },
    }
  );

  p.outro("Scaffolding your project...");

  return {
    projectName: (result.projectName as string) || config.projectName || "my-app",
    projectDir: "",
    template: "amal",
    runtime: (result.runtime as Runtime) || config.runtime || "bun",
    api: (result.api as API) || config.api || "none",
    auth: (result.auth as Auth) || config.auth || "none",
    database: (result.database as Database) || config.database || "none",
    orm: config.orm || (result.database !== "none" ? "drizzle" : "none") as ORM,
    packageManager: (result.packageManager as PackageManager) || config.packageManager || "bun",
    git: config.git ?? true,
    install: config.install ?? false,
    addons: config.addons || [],
  };
}
```

- [ ] **Step 5: Create the create command (commands/create.ts)**

```typescript
import { defineCommand, main } from "citty";
import { consola } from "consola";
import { existsSync } from "node:fs";
import path from "node:path";
import type { ProjectConfig, API, Auth, Database, ORM, Runtime, PackageManager, Addon } from "@cyber-stack/types";
import { ProjectConfigSchema } from "@cyber-stack/types";
import { generateProject, VirtualFileSystem } from "@cyber-stack/template-generator";
import { fetchTemplates } from "../utils/template-fetcher";
import { writeProject, getProjectDir } from "../utils/project-writer";
import { installDependencies, initGitRepo } from "../utils/package-manager";
import { fillMissingFlags } from "../prompts";

export interface CreateOptions {
  projectName?: string;
  template?: string;
  runtime?: Runtime;
  api?: API;
  auth?: Auth;
  database?: Database;
  orm?: ORM;
  packageManager?: PackageManager;
  git?: boolean;
  noGit?: boolean;
  install?: boolean;
  addons?: Addon[];
  yes?: boolean;
  dryRun?: boolean;
}

export const createCommand = defineCommand({
  meta: {
    name: "create",
    description: "Create a new project",
  },
  args: {
    projectName: {
      type: "positional",
      description: "Project name or directory",
      required: false,
    },
    template: {
      type: "string",
      description: "Template to use",
      default: "amal",
    },
    runtime: {
      type: "string",
      description: "Runtime (bun | node)",
    },
    api: {
      type: "string",
      description: "API layer (trpc | orpc | none)",
    },
    auth: {
      type: "string",
      description: "Auth provider (better-auth | none)",
    },
    database: {
      type: "string",
      description: "Database (sqlite | postgres | none)",
    },
    orm: {
      type: "string",
      description: "ORM (drizzle | none)",
    },
    "package-manager": {
      type: "string",
      description: "Package manager (npm | pnpm | bun)",
    },
    git: {
      type: "boolean",
      description: "Initialize git repository",
      default: true,
    },
    "no-git": {
      type: "boolean",
      description: "Skip git initialization",
      default: false,
    },
    install: {
      type: "boolean",
      description: "Install dependencies",
      default: false,
    },
    addons: {
      type: "string",
      description: "Addons (comma-separated: mcp,skills,vite-plus)",
    },
    yes: {
      type: "boolean",
      description: "Skip prompts, use defaults",
      alias: "y",
      default: false,
    },
    "dry-run": {
      type: "boolean",
      description: "Validate without writing",
      default: false,
    },
  },
  async run({ args }) {
    const options: CreateOptions = {
      projectName: args.projectName,
      template: args.template,
      runtime: args.runtime as Runtime | undefined,
      api: args.api as API | undefined,
      auth: args.auth as Auth | undefined,
      database: args.database as Database | undefined,
      orm: args.orm as ORM | undefined,
      packageManager: args["package-manager"] as PackageManager | undefined,
      git: args["no-git"] ? false : args.git,
      install: args.install,
      addons: args.addons
        ? (args.addons.split(",").map((s: string) => s.trim()) as Addon[])
        : undefined,
      yes: args.yes,
      dryRun: args["dry-run"],
    };

    await createProject(options);
  },
});

export async function createProject(options: CreateOptions) {
  consola.info("create-cyber-stack v0.1.0");

  // Build partial config from CLI args
  let config: Partial<ProjectConfig> = {
    template: "amal",
    projectName: options.projectName || "my-app",
    runtime: options.runtime,
    api: options.api,
    auth: options.auth,
    database: options.database,
    orm: options.orm,
    packageManager: options.packageManager,
    git: options.git,
    install: options.install,
    addons: options.addons || [],
  };

  // Fill missing flags with interactive prompts (unless --yes)
  if (!options.yes) {
    try {
      config = await fillMissingFlags(config as ProjectConfig);
    } catch {
      process.exit(1);
    }
  }

  // Set orm based on database if not specified
  if (!config.orm) {
    config.orm = config.database !== "none" ? "drizzle" : "none";
  }

  // Fill git default
  if (config.git === undefined) config.git = true;

  // Validate
  const parsed = ProjectConfigSchema.safeParse(config);
  if (!parsed.success) {
    consola.error("Invalid configuration:");
    for (const issue of parsed.error.issues) {
      consola.error(`  ${issue.path.join(".")}: ${issue.message}`);
    }
    process.exit(1);
  }

  const finalConfig = parsed.data;
  finalConfig.projectDir = await getProjectDir(finalConfig.projectName);

  // Check if target directory exists
  if (existsSync(finalConfig.projectDir)) {
    consola.error(
      `Directory "${finalConfig.projectDir}" already exists.`
    );
    process.exit(1);
  }

  if (options.dryRun) {
    consola.info("Dry run — validation passed");
    consola.info(JSON.stringify(finalConfig, null, 2));
    return;
  }

  // Fetch templates (dev mode: from local templates/)
  const templateDir = path.resolve(
    import.meta.dirname,
    "..",
    "..",
    "..",
    "..",
    "templates"
  );
  const templates = await fetchTemplates({ templateDir });

  // Generate project in VFS
  const vfs = new VirtualFileSystem();
  generateProject(vfs, templates, finalConfig);

  // Write to disk
  await writeProject(vfs, finalConfig.projectDir);

  // Git init
  if (finalConfig.git) {
    initGitRepo(finalConfig.projectDir);
  }

  // Install deps
  if (finalConfig.install) {
    installDependencies(finalConfig.projectDir, finalConfig.packageManager);
  }

  consola.success(`Project "${finalConfig.projectName}" created!`);
  consola.info(`  cd ${finalConfig.projectName}`);
  consola.info(`  bun run dev`);
}

export async function runCli() {
  const mainCommand = defineCommand({
    meta: {
      name: "create-cyber-stack",
      description: "Scaffold a new cyber-stack project",
    },
    subCommands: {
      create: createCommand,
    },
    async run() {
      // Default: run create with no args
      await createProject({});
    },
  });

  await main(mainCommand);
}
```

- [ ] **Step 6: Build to verify**

Run: `cd packages/cli && bun run build`
Expected: Build succeeds.

- [ ] **Step 7: Commit**

```bash
git add packages/cli/src/
git commit -m "feat: implement create command with prompts, fetch, write, and install"
```

---

### Task 9: Smoke Test

- [ ] **Step 1: Install all workspace dependencies**

Run: `cd /home/teneburu/dev/web/create-cyber-stack && bun install`
Expected: All workspace packages linked.

- [ ] **Step 2: Build all packages**

Run: `cd packages/types && bun run build && cd ../template-generator && bun run build && cd ../cli && bun run build`
Expected: All three packages build successfully.

- [ ] **Step 3: Run a quick smoke test**

Run: `cd /home/teneburu/dev/web/create-cyber-stack && bun run packages/cli/dist/cli.mjs --yes --dry-run`
Expected: CLI runs, shows config, exits without writing.

- [ ] **Step 4: (Optional) Create a real test project**

```bash
cd /tmp && rm -rf test-app && \
  node /home/teneburu/dev/web/create-cyber-stack/packages/cli/dist/cli.mjs \
  --yes --api trpc --auth better-auth --database sqlite test-app
```

Expected: Project created at `/tmp/test-app/` with files from templates.

- [ ] **Step 5: Commit any final fixes**

```bash
git add -A && git commit -m "chore: finalize initial CLI implementation"
```
