/**
 * create-reactify-app — React SSR + RSC for Fastify
 *
 * @example
 * ```typescript
 * import { createProject } from "create-reactify-app";
 *
 * await createProject({
 *   projectName: "my-app",
 * });
 * ```
 */
export { createProject } from "./commands/create";
export type { CreateOptions } from "./commands/create";
