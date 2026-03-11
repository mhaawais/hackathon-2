---
name: frontend-skill
description: Build frontend user interfaces including pages, components, layouts, styling, and responsive behavior. Use for modern, responsive, component-driven web applications.
---

# Frontend Skill – Pages, Components, Layout, Styling & Responsiveness

## Scope
This skill is responsible for implementing the frontend layer of an application:
- Page-level composition and routing
- Reusable UI components
- Layout systems and responsive behavior
- Styling and theming
- Client-side state and data fetching integration
- Accessibility, UX consistency, and responsiveness testing

## Instructions

### 1. Page Architecture
- Design pages around user flows, not just routes.
- Keep pages focused on composition, not business logic.
- Use clear file-based routing conventions where applicable.
- Separate public vs protected pages when required.

### 2. Component Design
- Build small, reusable, composable components.
- Follow single-responsibility principles.
- Prefer controlled components for forms.
- Avoid prop-drilling by using context or state managers when needed.
- Keep components framework-idiomatic.

### 3. Layout & Structure
- Use consistent layout primitives (header, sidebar, main, footer).
- Implement mobile-first layouts.
- Use flexible layout systems (Flexbox/Grid).
- Ensure layouts gracefully adapt across breakpoints.
- Avoid fixed widths unless absolutely necessary.

### 4. Styling & Theming
- Use a consistent styling system (Tailwind, CSS Modules, styled-components, etc.).
- Centralize colors, typography, spacing, and tokens.
- Use responsive utilities or media queries consistently.
- Ensure dark/light mode compatibility if required.
- Maintain visual consistency across the app.

### 5. Responsiveness (Mandatory)
- Design and implement for key breakpoints:
  - Mobile
  - Tablet
  - Desktop
- Use mobile-first CSS strategies.
- Ensure:
  - Text scales correctly
  - Buttons remain tappable
  - Layouts do not overflow horizontally
  - Navigation adapts (menus, drawers, collapses)
- Avoid hiding critical content on smaller screens without alternatives.

### 6. Forms & Interaction
- Build accessible forms with labels and validation feedback.
- Handle loading, success, and error states explicitly.
- Disable actions appropriately during async operations.
- Provide clear user feedback for all interactions.

### 7. Data Integration
- Connect UI components to backend APIs.
- Handle loading and error states gracefully.
- Keep data-fetching logic separate from presentation.
- Avoid tightly coupling UI to API response shapes.

### 8. Accessibility & UX
- Use semantic HTML.
- Ensure keyboard navigation works.
- Provide aria attributes where necessary.
- Maintain sufficient color contrast.
- Ensure responsive layouts remain accessible at all sizes.

### 9. Responsiveness Testing
- Manually verify UI at common breakpoints:
  - Mobile (small screens)
  - Tablet
  - Desktop / large screens
- Test:
  - Layout integrity
  - Text wrapping and overflow
  - Click/tap targets
  - Navigation behavior
- Use browser dev tools device emulation.
- Add automated checks where feasible:
  - Component render tests at different viewport sizes
  - Visual regression snapshots (if tooling allows)

### 10. Performance & Quality
- Avoid unnecessary re-renders.
- Optimize images for responsive sizes.
- Lazy-load non-critical components.
- Keep bundle size under control.

### 11. Documentation & Verification
- Document responsive behavior expectations.
- Provide screenshots or notes for breakpoints.
- Document component props and usage.
- Ensure UI matches design and spec requirements.

## Best Practices
- Mobile-first development.
- Component-driven architecture.
- Design systems over ad-hoc styling.
- Responsive layouts as first-class requirements.
- Test responsiveness continuously, not at the end.

## Outputs
When this skill is used, it should produce:
- Responsive page components
- Reusable UI components
- Layout and navigation components
- Styling and theme configuration
- Responsive behavior documentation
- Responsiveness test notes or checks

## Example Folder Layout
- /src/app or /src/pages
- /src/components
- /src/layouts
- /src/styles
- /src/hooks
- /src/tests (UI and responsiveness tests)
