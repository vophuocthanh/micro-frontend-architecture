/**
 * Account numbers leave the API masked. A browser only ever needs the last four
 * digits to let a user recognise an account, and a full number is a credential
 * for social engineering — so the API simply never sends one.
 */
export function maskAccountNumber(accountNumber: string): string {
  const visible = accountNumber.slice(-4);
  return `•••• ${visible}`;
}
