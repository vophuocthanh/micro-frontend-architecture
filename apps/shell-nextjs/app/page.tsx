import { redirect } from 'next/navigation';

/**
 * The platform has no landing page of its own — the dashboard is the front
 * door, and the shell's job is orchestration, not content.
 */
export default function HomePage() {
  redirect('/banking/dashboard');
}
