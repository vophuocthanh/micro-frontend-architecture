import { AlertTriangle, Inbox, RotateCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ApiError } from '../services/api-client';

interface LoadingBlockProps {
  /** How many shimmer rows to draw, matched to the content being replaced. */
  rows?: number;
  label: string;
}

export function LoadingBlock({ rows = 3, label }: LoadingBlockProps) {
  return (
    <div
      className="dash:space-y-3 dash:py-2"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      {/* The visible skeleton is decorative; this is what a screen reader hears. */}
      <span className="dash:sr-only">{label}</span>
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton key={index} className="dash:h-4 dash:w-full" />
      ))}
    </div>
  );
}

interface EmptyBlockProps {
  title: string;
  description: string;
}

export function EmptyBlock({ title, description }: EmptyBlockProps) {
  return (
    <div className="dash:flex dash:flex-col dash:items-center dash:gap-2 dash:py-8 dash:text-center">
      <Inbox className="dash:text-muted-foreground dash:size-5" aria-hidden="true" />
      <p className="dash:text-sm dash:font-medium">{title}</p>
      <p className="dash:text-muted-foreground dash:max-w-[34ch] dash:text-sm">{description}</p>
    </div>
  );
}

interface ErrorBlockProps {
  error: Error;
  onRetry: () => void;
}

export function ErrorBlock({ error, onRetry }: ErrorBlockProps) {
  const isApiError = error instanceof ApiError;

  return (
    <div
      className="dash:flex dash:flex-col dash:items-center dash:gap-2 dash:py-8 dash:text-center"
      role="alert"
    >
      <AlertTriangle className="dash:text-destructive dash:size-5" aria-hidden="true" />
      <p className="dash:text-destructive dash:text-sm dash:font-medium">
        Could not load this section
      </p>
      <p className="dash:text-muted-foreground dash:max-w-[34ch] dash:text-sm">{describe(error)}</p>

      {/* The correlation id turns "it broke" into a log line an engineer can find. */}
      {isApiError && (
        <span className="dash:text-muted-foreground dash:font-mono dash:text-xs">
          Request {error.requestId}
        </span>
      )}

      <Button variant="outline" size="sm" className="dash:mt-2" onClick={onRetry}>
        <RotateCw className="dash:size-3.5" aria-hidden="true" />
        Try again
      </Button>
    </div>
  );
}

function describe(error: Error): string {
  if (!(error instanceof ApiError)) {
    return 'The dashboard service could not be reached. Check your connection and try again.';
  }

  switch (error.code) {
    case 'FORBIDDEN':
      return 'Your account does not have access to this information.';
    case 'RATE_LIMITED':
      return 'Too many requests. Please wait a moment and try again.';
    case 'INTERNAL_ERROR':
      return 'Something went wrong on our side. The team has been notified.';
    default:
      return error.message;
  }
}
