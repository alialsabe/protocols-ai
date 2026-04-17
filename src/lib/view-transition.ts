/**
 * Run `navigate()` wrapped in a view transition if the browser supports it.
 * Otherwise run it immediately. `navigate` is typically `() => router.push(href)`.
 *
 * View Transitions API is widely supported in Chrome/Edge/Safari; Firefox falls through.
 */
export function withViewTransition(navigate: () => void) {
  if (typeof document.startViewTransition !== 'function') {
    navigate();
    return;
  }
  document.startViewTransition(() => {
    navigate();
  });
}
