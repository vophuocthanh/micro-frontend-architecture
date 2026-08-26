import type { ReactNode } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface PanelProps {
  title: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}

/**
 * The card every dashboard section sits in.
 *
 * `aria-label` on the section is what lets a screen-reader user jump between
 * areas of the dashboard instead of reading it top to bottom — and it is what
 * the end-to-end tests target, so the structure is pinned by a test rather than
 * by convention.
 */
export function Panel({ title, hint, className, children }: PanelProps) {
  return (
    // The landmark wraps the Card rather than replacing it: shadcn's Card is a
    // plain div with no `asChild`, and a div with an aria-label is not a
    // landmark a screen reader can navigate to.
    <section aria-label={title} className={cn('dash:contents', className)}>
      <Card className="dash:gap-4">
        <CardHeader className="dash:gap-0">
          <CardTitle className="dash:text-sm dash:font-medium">{title}</CardTitle>
          {hint ? <span className="dash:text-muted-foreground dash:text-xs">{hint}</span> : null}
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </section>
  );
}
