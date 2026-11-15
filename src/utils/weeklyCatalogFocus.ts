export const FOCUS_WEEKLY_CATALOG_KEY = 'brainmaster_focus_weekly_catalog';

export function requestWeeklyCatalogFocus(): void {
  sessionStorage.setItem(FOCUS_WEEKLY_CATALOG_KEY, '1');
}

export function consumeWeeklyCatalogFocus(): boolean {
  const v = sessionStorage.getItem(FOCUS_WEEKLY_CATALOG_KEY);
  if (v) {
    sessionStorage.removeItem(FOCUS_WEEKLY_CATALOG_KEY);
    return true;
  }
  return false;
}