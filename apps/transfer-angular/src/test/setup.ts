/**
 * Angular's packages are published in "partial" AOT form and finish compiling
 * at build time. Vitest imports them directly, so the JIT compiler has to be
 * present or the first `@angular/common/http` import throws about a missing
 * compiler — even for a test that never renders a component.
 */
import '@angular/compiler';
