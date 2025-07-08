# Frontend Design System Refactor Plan

---

## Status Table

| Plan Item                                 | Status         | Notes/Audit Needed?                |
|--------------------------------------------|---------------|------------------------------------|
| Remove all Bootstrap and legacy CSS/JS     | ✅ Complete   | All HTML uses only design system   |
| Refactor all markup to design system only  | ✅ Complete   | No legacy classes remain           |
| Unify all UI under design system           | ✅ Complete   |                                    |
| Audit for custom/legacy CSS/JS             | ✅ Complete   |                                    |

---

## Next Steps

- Maintain design system as the single source of truth for all UI.
- Ensure all new features/pages use only design system classes and markup.
- Periodically audit for regressions or legacy code.