/** Injected by Vite's `define`, see vite.config.ts. */
declare const __DASHBOARD_VERSION__: string;
declare const __DASHBOARD_NAME__: string;

declare module '*.module.css' {
  const classes: Readonly<Record<string, string>>;
  export default classes;
}
