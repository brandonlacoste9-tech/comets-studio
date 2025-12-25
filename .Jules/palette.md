## 2024-05-22 - Initial Audit
**Learning:** The application has a beautiful glassmorphism UI but lacks basic ARIA labels on critical interactive elements like the message input and icon-only buttons. Destructive actions like clearing chat history happen instantly without confirmation.
**Action:** Always verify icon-only buttons have `aria-label` and ensure destructive actions have at least a simple confirmation step.
