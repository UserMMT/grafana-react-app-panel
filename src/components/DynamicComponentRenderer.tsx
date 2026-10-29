import React, { useMemo } from 'react';
import { Alert, Spinner } from '@grafana/ui';
import { css } from '@emotion/css';
import { isValidElementType } from 'react-is';
import { transform } from 'sucrase';

/**
 * Modules the code is allowed to `import ... from '<name>'`.
 * Keyed by the module specifier, not a local variable name.
 */
const DEFAULT_MODULES: Record<string, any> = {
  react: React,
  '@emotion/css': { css },
};

// Stable identity so the default doesn't invalidate the memo on every render.
const NO_EXTERNAL_IMPORTS: Record<string, any> = {};

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

interface CompileResult {
  component: React.ComponentType<any> | null;
  error: string | null;
}

function compile(code: string, modules: Record<string, any>): CompileResult {
  if (!code.trim()) {
    return { component: null, error: 'No code provided' };
  }

  try {
    const { code: transpiled } = transform(code, {
      transforms: ['jsx', 'typescript', 'imports'],
      production: true,
    });

    // `require`/`module`/`exports` shims only control what `import` can resolve.
    // They do NOT isolate the code: see the note on DynamicComponentRenderer.
    const requireShim = (name: string) => {
      if (Object.prototype.hasOwnProperty.call(modules, name)) {
        return modules[name];
      }
      throw new Error(`Module "${name}" is not available here. Available: ${Object.keys(modules).join(', ')}`);
    };

    // `React` is passed in so JSX works without an explicit `import React`.
    const moduleObj: { exports: any } = { exports: {} };
    const runModule = new Function('require', 'module', 'exports', 'React', transpiled);
    runModule(requireShim, moduleObj, moduleObj.exports, React);

    const component = moduleObj.exports.default || moduleObj.exports;
    if (!isValidElementType(component)) {
      return { component: null, error: 'Code must export a valid React component (export default ...)' };
    }

    return { component: component as React.ComponentType<any>, error: null };
  } catch (err) {
    return { component: null, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

const ErrorAlert: React.FC<{ title: string; message: string }> = ({ title, message }) => (
  <Alert severity="error" title={title}>
    <code
      className={css`
        font-family: monospace;
        font-size: 12px;
        white-space: pre-wrap;
        word-break: break-word;
      `}
    >
      {message}
    </code>
  </Alert>
);

interface BoundaryProps {
  /** Changes whenever the code is recompiled, which clears a previous crash. */
  resetKey: unknown;
  showErrors: boolean;
  children: React.ReactNode;
}

/**
 * Catches errors thrown while the compiled component renders, so one broken
 * pasted component shows an error instead of taking down the whole panel.
 */
class RenderErrorBoundary extends React.Component<BoundaryProps, { error: Error | null }> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidUpdate(prev: BoundaryProps) {
    if (prev.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null });
    }
  }

  render() {
    if (this.state.error) {
      return this.props.showErrors ? (
        <ErrorAlert title="Component Runtime Error" message={this.state.error.message} />
      ) : null;
    }
    return this.props.children;
  }
}

/**
 * Dynamically render TSX/JSX source as a React component, entirely in the
 * browser: transpile with sucrase, then execute as a CommonJS-style module.
 *
 * IMPORTANT: this is NOT a sandbox. The code runs in the page's own realm
 * (`new Function`), so it has full access to `window`, `document`,
 * `localStorage`, `fetch` and the viewer's Grafana session. Only pass code the
 * viewer has chosen to trust - AppPanel gates this behind an approval prompt.
 */
export const DynamicComponentRenderer: React.FC<DynamicComponentRendererProps> = ({
  code,
  componentProps = {},
  externalImports = NO_EXTERNAL_IMPORTS,
  showErrors = true,
}) => {
  const { component: CompiledComponent, error } = useMemo(
    () => compile(code, { ...DEFAULT_MODULES, ...externalImports }),
    [code, externalImports]
  );

  if (error) {
    return showErrors ? <ErrorAlert title="Component Render Error" message={error} /> : null;
  }

  if (!CompiledComponent) {
    return null;
  }

  return (
    <RenderErrorBoundary resetKey={CompiledComponent} showErrors={showErrors}>
      <React.Suspense fallback={<Spinner />}>
        <CompiledComponent {...componentProps} />
      </React.Suspense>
    </RenderErrorBoundary>
  );
};
