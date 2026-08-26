import { ApiError } from '../services/api-client';
import a11y from '../styles/a11y.module.css';
import styles from './StatusBlock.module.css';

interface LoadingBlockProps {
  /** How many shimmer rows to draw, matched to the content being replaced. */
  rows?: number;
  label: string;
}

export function LoadingBlock({ rows = 3, label }: LoadingBlockProps) {
  return (
    <div className={styles.root} role="status" aria-live="polite" aria-busy="true">
      {/* The visible skeleton is decorative; this is what a screen reader hears. */}
      <span className={a11y.srOnly}>{label}</span>
      {Array.from({ length: rows }, (_, index) => (
        <span key={index} className={styles.skeleton} aria-hidden="true" />
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
    <div className={styles.root}>
      <p className={styles.title}>{title}</p>
      <p className={styles.description}>{description}</p>
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
    <div className={`${styles.root} ${styles.error}`} role="alert">
      <p className={styles.title}>Could not load this section</p>
      <p className={styles.description}>{describe(error)}</p>
      {/* The correlation id turns "it broke" into a log line an engineer can find. */}
      {isApiError && <span className={styles.requestId}>Request {error.requestId}</span>}
      <button type="button" className={styles.retry} onClick={onRetry}>
        Try again
      </button>
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
