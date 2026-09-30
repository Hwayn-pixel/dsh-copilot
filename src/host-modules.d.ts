/**
 * Host-provided modules that are *not* dependencies of this plugin.
 *
 * `@deepseek-ai/dsh-system-prompt` ships with DSH: the host resolves it at load time, so the
 * import in `index.ts` is guarded by try/catch and this plugin keeps working whether or not the
 * package is reachable. It is declared here only so `tsc --noEmit` is quiet in an environment that
 * has not installed it — the shape below is the small part we actually use.
 */
declare module "@deepseek-ai/dsh-system-prompt" {
  export function renderPrompt(assembly: unknown): string;
}
