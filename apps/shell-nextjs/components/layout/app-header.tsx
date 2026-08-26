'use client';

import { Landmark, LogOut } from 'lucide-react';

import { MainNav } from '@/components/navigation/main-nav';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/providers/auth-provider';

/**
 * The one piece of chrome every micro frontend renders beneath. Owning it in
 * the shell is what makes three independently deployed applications look like
 * one product — and why remotes ship no global UI of their own.
 */
export function AppHeader() {
  const { user, logout } = useAuth();

  return (
    <header className="bg-background/80 sticky top-0 z-40 border-b backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
        <div className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="bg-primary text-primary-foreground grid size-8 place-items-center rounded-lg">
            <Landmark className="size-4" aria-hidden="true" />
          </span>
          Northwind
        </div>

        <Separator orientation="vertical" className="hidden h-6 sm:block" />

        <MainNav />

        {user && (
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden text-right leading-tight sm:block">
              <p className="text-sm font-medium">{user.fullName}</p>
              <Badge variant="secondary" className="mt-0.5 h-4 px-1.5 text-[10px] font-medium">
                {user.role}
              </Badge>
            </div>

            <Avatar className="size-9">
              <AvatarFallback className="text-xs font-medium">{initials(user.fullName)}</AvatarFallback>
            </Avatar>

            <Button variant="ghost" size="icon" onClick={() => void logout()} aria-label="Sign out">
              <LogOut className="size-4" aria-hidden="true" />
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}

function initials(fullName: string): string {
  return fullName
    .split(' ')
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}
