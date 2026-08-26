import type { ReactNode } from 'react';

import styles from './Panel.module.css';

interface PanelProps {
  title: string;
  hint?: string;
  children: ReactNode;
}

/**
 * The card shell every dashboard section sits in.
 *
 * `section` + a heading rather than a styled `div`: it gives the panel a place
 * in the document outline, so a screen reader user can jump between sections
 * instead of reading the page top to bottom.
 */
export function Panel({ title, hint, children }: PanelProps) {
  return (
    <section className={styles.panel} aria-label={title}>
      <header className={styles.header}>
        <h3 className={styles.title}>{title}</h3>
        {hint ? <span className={styles.hint}>{hint}</span> : null}
      </header>
      <div className={styles.body}>{children}</div>
    </section>
  );
}
