/**
 * create-cyber-stack — scaffold SSR web apps with the Amal stack
 *
 * @example
 * ```typescript
 * import { createProject } from "create-cyber-stack";
 *
 * await createProject({
 *   projectName: "my-app",
 *   api: "trpc",
 *   auth: "better-auth",
 *   database: "sqlite",
 * });
 * ```
 */
export { createProject } from "./commands/create";
export type { CreateOptions } from "./commands/create";
