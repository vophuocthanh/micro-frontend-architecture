import { onScopeDispose, readonly, type Ref, ref } from 'vue';

import { useShell } from '../shell/shell-context';

export type AccountView = { name: 'list' } | { name: 'detail'; accountId: string };

/**
 * This remote's internal routing, derived from the slice of the URL the shell
 * owns.
 *
 * Deliberately not `vue-router`: a second router writing to `history` would
 * fight the shell's for control of the back button. Reading the path and asking
 * the shell to change it keeps one owner of the URL while still giving the
 * Account domain real routes — `/banking/accounts/acc_123` is a working deep
 * link that survives a refresh.
 */
export function useShellRoute(): {
  view: Readonly<Ref<AccountView>>;
  goToList: () => void;
  goToDetail: (accountId: string) => void;
} {
  const shell = useShell();
  const view = ref<AccountView>(parse(shell.route.current()));

  const unsubscribe = shell.route.subscribe((subPath) => {
    view.value = parse(subPath);
  });

  // Tied to the component's effect scope, so an unmounted remote stops
  // listening — the shell keeps navigating long after this view is gone.
  onScopeDispose(unsubscribe);

  return {
    view: readonly(view) as Readonly<Ref<AccountView>>,
    goToList: () => shell.navigate(shell.basePath),
    goToDetail: (accountId: string) => shell.navigate(`${shell.basePath}/${accountId}`),
  };
}

function parse(subPath: string): AccountView {
  const accountId = subPath.replace(/^\/+|\/+$/g, '');
  return accountId ? { name: 'detail', accountId } : { name: 'list' };
}
