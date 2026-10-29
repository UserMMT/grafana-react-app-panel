import React, { useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Alert, Button, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

interface CodeTrustPromptProps {
  code: string;
  onTrust: () => void;
}

/**
 * Shown instead of running panel code this browser hasn't approved yet. The
 * code is stored in the dashboard JSON and would run with the viewer's own
 * Grafana access, so the viewer gets to read it first.
 */
export const CodeTrustPrompt: React.FC<CodeTrustPromptProps> = ({ code, onTrust }) => {
  const styles = useStyles2(getStyles);
  const [showCode, setShowCode] = useState(false);

  return (
    <Alert severity="warning" title="Custom code - not run yet">
      <p>
        This panel runs JavaScript stored in the dashboard. It runs with the same access you have in Grafana (your
        session, this page and this browser&apos;s storage) and is not sandboxed. Only run it if you trust whoever last
        edited the panel.
      </p>
      <p>Your approval covers this exact code only: any later edit asks again.</p>
      <div className={styles.actions}>
        <Button size="sm" variant="primary" onClick={onTrust}>
          Trust and run
        </Button>
        <Button size="sm" variant="secondary" fill="outline" onClick={() => setShowCode((shown) => !shown)}>
          {showCode ? 'Hide code' : 'Show code'}
        </Button>
      </div>
      {showCode && <pre className={styles.code}>{code}</pre>}
    </Alert>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  actions: css`
    display: flex;
    gap: ${theme.spacing(1)};
  `,
  code: css`
    margin-top: ${theme.spacing(1)};
    max-height: 300px;
    overflow: auto;
    font-size: ${theme.typography.bodySmall.fontSize};
  `,
});
