/**
 * Generated Page Utility - Wraps AI output in design-system compliant shells.
 */

export function wrapInPremiumShell(html: string): string {
    return `
<section class="premium-content role="region" aria-label="Generated Content">
  <div class="content-wrapper animate-slide-up">
    ${html}
  </div>
</section>

<style>
.premium-content {
  padding: var(--space-xl) 0;
  background: var(--color-bg);
  min-height: 400px;
}

.content-wrapper {
  max-width: 1000px;
  margin: 0 auto;
  padding: var(--space-lg);
  background: var(--color-surface);
  border-radius: 12px;
  box-shadow: var(--elevation-md);
  border: 1px solid rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(5px);
}

/* Ensure child elements from AI match our tokens */
.content-wrapper h2 { color: var(--color-accent); margin-bottom: var(--space-md); }
.content-wrapper p { margin-bottom: var(--space-md); color: var(--color-text); }
.content-wrapper ul { margin-left: var(--space-lg); margin-bottom: var(--space-md); }
</style>
    `;
}
