# White Theme Text Visibility Fix

## Plan
Replace hardcoded dark-mode-only Tailwind classes (`bg-white/5`, `border-white/10`, `bg-[#050508]`, etc.) with CSS-variable-based utilities for proper light/dark theming.

## Phases

### Phase 1: Add CSS variables to index.css
- [ ] Define theme-aware variables for subtle, light, medium, hover surfaces, borders, overlays
- [ ] Register in @theme inline

### Phase 2: Fix Shared Components
- [ ] SettingsModal.tsx
- [ ] UploadModal.tsx
- [ ] AnalysisPreviewModal.tsx

### Phase 3: Fix Main App Pages
- [x] ChatPage.tsx
- [x] UploadPage.tsx
- [x] DashboardPage.tsx
- [ ] ComparePage.tsx
- [ ] AnalyticsPage.tsx

### Phase 4: Fix Shared Pages
- [ ] Documents.tsx
- [ ] Search.tsx
- [ ] Collections.tsx
- [ ] Settings.tsx
- [ ] Citations.tsx
- [ ] Library.tsx

### Phase 5: Verification
- [ ] Start dev server and visually inspect pages in light mode

