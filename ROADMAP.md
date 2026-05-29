# 🗺️ MySaaS Architectural Scaling Roadmap

This document serves as a **living, persistent backlog** of technical debt, architectural tasks, and structural optimizations required to scale MySaaS from a high-fidelity prototype to a top-tier, enterprise-grade global SaaS application. 

Feel free to keep this file in the workspace; as we pair-program in future sessions, we will continue updating and adding new structural discoveries to this document so you can address them systematically when you are ready to scale.

---

## 🚀 Priority 1: Frontend Route Modularization (Next.js App Router Standards)
Currently, `ui/src/app/page.tsx` is a monolithic **384KB** file (~8,400 lines) that acts as a single-page app (SPA) controller. While great for rapid prototyping, it loads all tools, pages, dialogs, and heavy libraries in memory at once.

### 📋 Action Items:
- [ ] **Split Core Pages**:
  * Extract `AboutPage` layout and move it to a dedicated file `ui/src/app/about/page.tsx` to enable true Server-Side Rendering (SSR).
  * Extract `DocsPage` and move it to `ui/src/app/docs/page.tsx`.
  * Extract `ChangelogPage` and move it to `ui/src/app/changelog/page.tsx`.
  * Extract `DeveloperPage` and move it to `ui/src/app/developer/page.tsx`.
  * Extract `PrivacyPage` and move it to `ui/src/app/privacy/page.tsx`.
- [ ] **Isolate Shared Components**:
  * Create a standard `ui/src/components/` directory.
  * Move core global components (`TopBar`, `Footer`, `AuthModal`, `PaywallModal`, `CommandPalette`, `Launcher`) into separate, focused reusable files (e.g., `ui/src/components/PaywallModal.tsx`).
- [ ] **Implement Dynamic Lazy-Loading (`next/dynamic`)**:
  * Configure lazy-loading for heavy browser tools (like the Tesseract OCR scanner or the PDF visual difference viewer) so that visitors don't download heavy dependencies until they actively click to open that tool.

---

## ⚡ Priority 2: Global State & Context Management
State variables (such as `sessionUser`, `userPlan`, `theme`, and dialog controls like `onShowPaywall`) are currently prop-drilled down through parent controller methods.

### 📋 Action Items:
- [ ] **Create global `AppContext`**:
  * Define an `AppContext` Provider in `ui/src/providers/AppContext.tsx` to maintain unified user sessions, billing tiers, and theme selections.
- [ ] **Strip Callback Prop-Drilling**:
  * Wrap the provider inside `ui/src/app/layout.tsx`.
  * Remove redundant callback props from all subpages.
  * Let subcomponents call state values natively via the `useApp()` custom React hook.

---

## 🎨 Priority 3: CSS Cleanup & Utility Consolidation
Styles are heavily defined as inline attributes (`style={{ ... }}`) directly on React tags, which leads to visual duplication and makes theme customizations difficult to maintain.

### 📋 Action Items:
- [ ] **Leverage TailwindCSS Utilities**:
  * Your `package.json` already contains `tailwindcss`. Replace absolute inline styling blocks with responsive, standardized Tailwind classes (e.g., `className="bg-elev-1 border border-border rounded-xl"`).
- [ ] **Consolidate HSL Theme Tokens**:
  * Move dynamic color calculations into centralized Tailwind utility class definitions or clean theme state hooks.

---

## 🐍 Priority 4: Production Backend Migration (FastAPI Transition)
The current backend engine prototype uses **Streamlit** (`app.py`). While Streamlit is fantastic for immediate testing and displaying Python models, it is not designed to serve as a high-concurrency API server.

### 📋 Action Items:
- [ ] **Wrap Python Engines in FastAPI**:
  * Port `app.py` to a **FastAPI** (`uvicorn`) REST API framework.
  * You already have modular processing files in `engines/tool_ai_formatter.py` and `engines/tool_json.py`—these can be exposed immediately as clean, secure API routes (`POST /v1/format` and `POST /v1/json`).
- [ ] **Configure Serverless Container Deployment**:
  * Deploy the FastAPI backend to a serverless container environment (like Render or Railway) with automatic scaling limits.
- [ ] **Async Worker Queue**:
  * Integrate an asynchronous worker thread pool to handle intensive document compilations and visual diff routines safely without blocking single-process execution threads.

---

## 🔒 Priority 5: Security & Database Best Practices
- [ ] **API Authorization Middleware**:
  * Enforce strict, cryptographically secure validation of API Bearer Tokens on the backend using standard verification scripts.
- [ ] **RLS Policies in Supabase**:
  * Review and tighten Row Level Security (RLS) rules on the Supabase `profiles` and `usage_logs` tables to ensure users can only inspect or modify their own metered items.
