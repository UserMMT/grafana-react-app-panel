import React from 'react';
import { render, screen } from '@testing-library/react';
import { DynamicComponentRenderer } from './DynamicComponentRenderer';

jest.mock('@grafana/ui', () => {
  const ReactLib = jest.requireActual('react');
  return {
    Alert: ({ title, children }: { title: string; children: React.ReactNode }) =>
      ReactLib.createElement('div', { role: 'alert' }, ReactLib.createElement('strong', null, title), children),
    Spinner: () => ReactLib.createElement('span', null, 'loading'),
  };
});

let consoleError: jest.SpyInstance;

beforeEach(() => {
  // React logs caught render errors; keep the output readable and inspectable.
  consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  consoleError.mockRestore();
});

const reactWarnings = () =>
  consoleError.mock.calls.filter(([first]) => typeof first === 'string' && first.includes('Cannot update a component'));

describe('DynamicComponentRenderer', () => {
  it('renders the default export of TSX code', () => {
    const code = `
      import React from 'react';
      const Hello: React.FC<{ name: string }> = ({ name }) => <p>Hello {name}</p>;
      export default function App() { return <Hello name="grafana" />; }
    `;
    render(<DynamicComponentRenderer code={code} />);
    expect(screen.getByText('Hello grafana')).toBeTruthy();
    expect(reactWarnings()).toHaveLength(0);
  });

  it('passes componentProps to the component', () => {
    render(
      <DynamicComponentRenderer
        code={`export default ({ label }) => <b>{label}</b>;`}
        componentProps={{ label: 'from props' }}
      />
    );
    expect(screen.getByText('from props')).toBeTruthy();
  });

  it('resolves imports from the provided external modules', () => {
    const code = `
      import { greeting } from 'app-panel/test';
      export default () => <i>{greeting}</i>;
    `;
    render(<DynamicComponentRenderer code={code} externalImports={{ 'app-panel/test': { greeting: 'hi there' } }} />);
    expect(screen.getByText('hi there')).toBeTruthy();
  });

  it('reports modules that are not available', () => {
    render(<DynamicComponentRenderer code={`import x from 'lodash'; export default () => <i>{x}</i>;`} />);
    expect(screen.getByRole('alert').textContent).toContain('Module "lodash" is not available');
  });

  it('does not resolve inherited Object.prototype names as modules', () => {
    render(<DynamicComponentRenderer code={`import x from 'toString'; export default () => <i>{String(x)}</i>;`} />);
    expect(screen.getByRole('alert').textContent).toContain('Module "toString" is not available');
  });

  it('shows a compile error without setting state during render', () => {
    render(<DynamicComponentRenderer code={`export default () => <div`} />);
    expect(screen.getByRole('alert')).toBeTruthy();
    expect(reactWarnings()).toHaveLength(0);
  });

  it('asks for something to render when there is no code', () => {
    render(<DynamicComponentRenderer code="   " />);
    expect(screen.getByRole('alert').textContent).toContain('No code provided');
  });

  it('rejects code without a component export', () => {
    render(<DynamicComponentRenderer code={`export const x = 1;`} />);
    expect(screen.getByRole('alert').textContent).toContain('Code must export a valid React component');
  });

  it('contains an error thrown while the component renders', () => {
    render(
      <div>
        <p>sibling stays</p>
        <DynamicComponentRenderer code={`export default () => { throw new Error('boom at render'); };`} />
      </div>
    );
    expect(screen.getByText('sibling stays')).toBeTruthy();
    const alert = screen.getByRole('alert');
    expect(alert.textContent).toContain('Component Runtime Error');
    expect(alert.textContent).toContain('boom at render');
  });

  it('renders nothing for a runtime error when showErrors is off', () => {
    const { container } = render(
      <DynamicComponentRenderer code={`export default () => { throw new Error('quiet'); };`} showErrors={false} />
    );
    expect(container.textContent).toBe('');
  });

  it('recovers when the code is fixed after a runtime error', () => {
    const { rerender } = render(<DynamicComponentRenderer code={`export default () => { throw new Error('bad'); };`} />);
    expect(screen.getByRole('alert')).toBeTruthy();

    rerender(<DynamicComponentRenderer code={`export default () => <p>fixed</p>;`} />);
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByText('fixed')).toBeTruthy();
  });

  it('does not recompile on re-render when the code and imports are unchanged', () => {
    const code = `
      let compiledTimes = (globalThis.__compiledTimes ?? 0) + 1;
      globalThis.__compiledTimes = compiledTimes;
      export default () => <p>stable</p>;
    `;
    (globalThis as any).__compiledTimes = 0;
    const { rerender } = render(<DynamicComponentRenderer code={code} />);
    rerender(<DynamicComponentRenderer code={code} />);
    rerender(<DynamicComponentRenderer code={code} />);
    expect((globalThis as any).__compiledTimes).toBe(1);
    delete (globalThis as any).__compiledTimes;
  });
});
