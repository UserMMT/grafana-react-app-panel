import React, { useState, useMemo } from 'react';
import { Alert, Spinner } from '@grafana/ui';
import { css } from '@emotion/css';
import { isValidElementType } from 'react-is';
import { transform } from 'sucrase';

/**
 * Modules the sandboxed code is allowed to `import ... from '<name>'`.
 * Keyed by the module specifier, not a local variable name.
 */
const DEFAULT_MODULES: Record<string, any> = {
  react: React,
  '@emotion/css': { css },
};

interface DynamicComponentRendererProps {
  /**
   * Raw TSX/JSX source as a string. Transpiled to plain JS in-browser
   * (via sucrase) before execution. Must export a default React component.
   */
  code: string;

  /**
   * Props to pass to the rendered component
   */
  componentProps?: Record<string, any>;

  /**
   * Extra modules the code is allowed to `import` from, keyed by module
   * specifier, e.g. `{ '@grafana/ui': GrafanaUI }`. Merged over the
   * built-in `react` / `@emotion/css` modules.
   */
  externalImports?: Record<string, any>;

  /**
   * Show error details
   */
  showErrors?: boolean;
}

/**
 * Dynamically render TSX/JSX source as a React component, entirely in the
 * browser: transpile with sucrase, then execute in a sandboxed CommonJS-style
 * module (`require`/`module`/`exports` shims resolve only against the
 * provided module map — nothing else is reachable from the sandbox).
 */
export const DynamicComponentRenderer: React.FC<DynamicComponentRendererProps> = ({
  code,
  componentProps = {},
  externalImports = {},
  showErrors = true,
}) => {
  const [error, setError] = useState<string | null>(null);

  const CompiledComponent = useMemo(() => {
    if (!code.trim()) {
      setError('No code provided');
      return null;
    }

    try {
      const modules: Record<string, any> = { ...DEFAULT_MODULES, ...externalImports };

      const { code: transpiled } = transform(code, {
        transforms: ['jsx', 'typescript', 'imports'],
        production: true,
      });

      const requireShim = (name: string) => {
        if (name in modules) {
          return modules[name];
        }
        throw new Error(`Module "${name}" is not available here. Available: ${Object.keys(modules).join(', ')}`);
      };

      const moduleObj: { exports: any } = { exports: {} };
      const runModule = new Function('require', 'module', 'exports', transpiled);
      runModule(requireShim, moduleObj, moduleObj.exports);

      const ComponentModule = moduleObj.exports.default || moduleObj.exports;

      if (!isValidElementType(ComponentModule)) {
        setError('Code must export a valid React component (export default ...)');
        return null;
      }

      setError(null);
      return ComponentModule;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, externalImports]);

  if (error && showErrors) {
    return (
      <Alert severity="error" title="Component Render Error">
        <code
          className={css`
            font-family: monospace;
            font-size: 12px;
            white-space: pre-wrap;
            word-break: break-word;
          `}
        >
          {error}
        </code>
      </Alert>
    );
  }

  if (!CompiledComponent) {
    return null;
  }

  return (
    <React.Suspense fallback={<Spinner />}>
      <CompiledComponent {...componentProps} />
    </React.Suspense>
  );
};
