# SolPlay DemoGen Technical Requirements Document (TRD)

## 1. Document Control

| Item | Value |
| --- | --- |
| Version | 0.1.0 (Draft) |
| Date | 2025-10-06 |
| Authors | GitHub Copilot (ARIA v4 automation) |
| Reviewers | TBD |
| Status | Draft |

## 2. Purpose and Scope

This Technical Requirements Document (TRD) consolidates the behavioral, architectural, and operational expectations for the SolPlay DemoGen platform. The goals are to:

- Translate the ARIA v4 multi-role agent mandate into actionable system requirements.
- Capture end-to-end demo generation and deployment obligations defined for SolPlay DemoGen.
- Provide an authoritative reference for engineering, QA, DevOps, security, and documentation teams.

### 2.1 In Scope

- AI agent workflow orchestration (roles, finite state machine, quality gates) ([S1]).
- Demo generation pipeline from structured input or documents to running Next.js demo ([S2]).
- Local deployment, dependency management, and live URL surfacing requirements ([S2]).
- Nonfunctional standards (security, UX, testing, documentation) applicable to the SolPlay DemoGen ecosystem ([S1], [S2], [S3]).

### 2.2 Out of Scope

- Commercial hosting or CI/CD pipelines beyond local demo deployment (future work).
- Detailed PRD content (covered separately by product documentation).
- Vendor-specific SLAs outside the project’s immediate tooling.

## 3. Referenced Documents and Sources

| ID | Reference | Notes |
| --- | --- | --- |
| S1 | `.github/prompts/aria.prompt.md` | ARIA v4 multi-role agent system prompt and governance. |
| S2 | `.github/copilot-instructions.md` | SolPlay DemoGen implementation guidance and workflow. |
| S3 | Microsoft Learn: “Create a functional and technical design document” (Jan 18, 2024) | Best-practice TRD structure and coverage areas. |

## 4. System Overview

### 4.1 Solution Summary

SolPlay DemoGen ingests structured use case data or derived insights from PDFs to generate high-fidelity React demos via the v0.dev SDK. The system programmatically deploys demos locally and returns an accessible URL to stakeholders for review and iteration.

### 4.2 Actors and Roles

- **AI Agent Roles:** Scrum Master, Architect, Developer, DevOps Engineer, UX/UI Designer, Tester, Security Engineer, Product Manager (per ARIA v4) responsible for different lifecycle stages ([S1]).
- **Human Stakeholders:** Solution engineers, demo specialists, and reviewers who consume the generated demos and documentation ([S2]).

### 4.3 Environments

- **Authoring Workspace:** Git-based repository housing prompts, services, demo app, and documentation.
- **Execution Environment:** Local Node.js runtime running `api-demogen`, `phase1/backend`, and `demo-app` Next.js server.
- **Optional Future Environments:** Cloud deployments and shared demo hosting (not yet implemented).

## 5. Architecture Overview

### 5.1 Component Architecture

| Component | Description | Key Technologies |
| --- | --- | --- |
| `docs/` | Source PDFs and metadata for use case extraction. | MuPDF, Azure OpenAI (per implementation notes). |
| `phase1/backend` | Service orchestration for prompt generation, demo building, deployment, dependency installation, and dev server management. | Node.js/TypeScript, v0.dev SDK, npm tooling. |
| `api-demogen` | API surface that validates direct input payloads, enriches use cases, triggers demo generation pipeline, and returns demo metadata with live URL. | Node.js/TypeScript, Express, Joi validation. |
| `demo-app` | Next.js shell hosting generated components and serving live demos. | Next.js, Tailwind CSS, React. |
| Shared Utilities | Logging, temp directories, dependency detection, synthetic data generators. | Node.js FS, child_process. |

### 5.2 End-to-End Data Flow ([S2])

1. **Docs Processing:** `npm run generate-demo-from-docs` scans PDFs, extracts text.
2. **Use Case Extraction:** Azure OpenAI identifies use case details.
3. **Prompt Construction:** V0 prompt generator crafts category-specific instructions.
4. **Code Generation:** v0.dev produces React component(s) enriched with synthetic data.
5. **Deployment:** Component saved into `demo-app/src/components`, main page updated.
6. **Dependency Installation:** Missing npm packages detected and installed automatically.
7. **Dev Server Startup:** Next.js server launched; URL shared with caller.
8. **API Feedback:** `api-demogen` responds with metadata including live `http://localhost:<port>` link.

### 5.3 Interface Inventory

| Interface | Direction | Protocol | Payload |
| --- | --- | --- | --- |
| Demo generation API (`/api/v1/generate-demo`) | External → `api-demogen` | HTTP POST (JSON) | Use case title, capabilities, optional metadata. |
| v0.dev SDK | `phase1/backend` → v0.dev | HTTPS API | Prompt, framework targets. |
| Local dev server | Browser → `demo-app` | HTTP | Generated React UI, assets. |

## 6. Functional Requirements

| ID | Requirement | Acceptance Criteria | Source | Priority |
| --- | --- | --- | --- | --- |
| FR-01 | Enforce eight-role ARIA v4 architecture with deterministic state machine sequencing. | Workflow must follow t-shirt sizing, path selection, and mandatory FSM transition gates. | S1 | Must |
| FR-02 | Implement t-shirt sizing (XS–XL) with shallow/deep workflow selection. | Requests classified; ledger records size and path; deviations documented. | S1 | Must |
| FR-03 | Maintain global TODO ledger with role ownership and documentation needs. | Ledger entries include required columns (ID, title, size, role, docs). | S1 | Should |
| FR-04 | Validate API inputs using Joi schema before enrichment. | Invalid payloads return structured validation errors. | S2 | Must |
| FR-05 | Enrich basic input with derived fields (category, description, journeys, metrics, demo features, sample data). | Enriched object aligns with `UseCaseData` contract. | S2 | Must |
| FR-06 | Generate category-specific v0 prompts (Content Generation, Process Automation, Personalized Experience). | Prompt includes business context, UI sections, synthetic data directives. | S2 | Must |
| FR-07 | Inject synthetic data and metadata into generated demo artifacts. | Demo metadata captures timestamps, categories; synthetic data per category available for rendering. | S2 | Should |
| FR-08 | Persist generated components into `demo-app/src/components` with sanitized component name and `use client` directive. | Saved file compiles; main page imports and renders new component. | S2 | Must |
| FR-09 | Detect and install missing npm dependencies referenced by generated code. | Tool checks existing packages, installs missing ones via npm. | S2 | Must |
| FR-10 | Start or reuse Next.js dev server and confirm readiness before returning URL. | Server logs indicate ready state; API response includes accessible URL. | S2 | Must |
| FR-11 | Return live demo URL in API responses for both docs-driven and direct input flows. | Response schema includes `serverUrl` (e.g., `http://localhost:3000`). | S2 | Must |
| FR-12 | Provide optional cleanup mechanism (TTL/manual) for temporary demo directories and processes. | Strategy documented; manual command(s) available until automation implemented. | S2 | Could |

## 7. Workflow and Governance Requirements

### 7.1 Role Activation and Quality Gates ([S1])

- **Always Active Roles:** Scrum Master, Architect (M+), Developer (S+), Tester (M+), Product Manager.
- **Conditional Roles:** DevOps (deployments/scaling), UX/UI (user-facing output), Security (data handling/compliance).
- **Exit Criteria:** Each role must satisfy stated checklists (e.g., Developer ensures TDD, Tester signs off). Non-compliance requires Scrum Master approval.

### 7.2 Finite State Machine

- XS: S0 → Direct Answer → Optional S7 → S8.
- S: S0 → S4 → S7 → S8.
- M: S0 → S1 → [S2*] → [S3*] → S4 → [S5*] → S6 → S7 → S8.
- L/XL: Full sequence with mandatory S2, S3, S5.

### 7.3 Documentation Duties ([S1])

- PM produces documentation scaled by size (micro doc, summaries, full suite).
- All responses start with JSON control block per ARIA v4 contract.

## 8. Nonfunctional Requirements

### 8.1 Quality Assurance

- TDD required for S+ scope; XS relies on validation only ([S1]).
- Tests must cover unit, integration, and E2E levels according to size.
- No placeholder code; production-ready output mandated.

### 8.2 Performance and Scalability

- Local demo servers should respond within demo-friendly latency (target <2s first render) where feasible.
- Synthetic data and charts should not degrade Next.js development performance; optimize by memoization or static data injection.

### 8.3 Security

- Adhere to OWASP best practices; Security Engineer role performs threat modeling for M+ efforts ([S1]).
- Custom roles, authentication, or data handling controls documented in Security Requirements section of deliverables ([S3]).

### 8.4 UX and Accessibility

- Generated demos must use Tailwind CSS with responsive layouts; must consider desktop and tablet breakpoints ([S2]).
- Include interactive affordances (hover states, progress indicators) and align with WCAG 2.1 AA where possible ([S1], [S2]).

### 8.5 Documentation & Communication

- Maintain clear communication tailored to stakeholders; include demo scripts, summaries, and evangelization assets per size ([S1]).
- Update TRD alongside implementation changes to avoid drift, per Microsoft best-practice guidance ([S3]).

## 9. Operational and DevOps Requirements

- Automate dependency installation with timeout controls (≤120s) and idempotent runs ([S2]).
- Track dev server process ID; expose stop/start utilities (`npm run stop-demo`, `npm run start-demo`).
- Logs stored under `logs/` (combined/error) must capture generation steps for auditing and debugging.
- DevOps engineer ensures CI-friendly scripts are documented for future pipeline integration.

## 10. Data and AI Requirements

- Support sample data generations for each category (documents, workflows, customers) to enrich demos ([S2]).
- Provide confidence scores, processing durations, and other synthetic metrics reflecting realistic ranges (e.g., 85–98% confidence, 2–5s processing) ([S2]).
- Maintain metadata (generatedAt, provider) for traceability within demo output.

## 11. Assumptions and Constraints

- v0.dev API availability and authentication keys configured via environment variables (`V0_API_KEY`, `V0_BASE_URL`).
- Local environment runs macOS with zsh shell; Node.js and npm available.
- Current scope assumes single concurrent demo server (localhost:3000) with potential extension to dynamic ports.
- Cleanup automation for temp directories is deferred; manual intervention documented.

## 12. Risks and Mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Demo server port conflicts | Demo inaccessible | Implement dynamic port allocation and conflict detection in future iteration. |
| Dependency installation failures | Demo build breaks | Retry logic with logging; pre-flight check installed packages. |
| Documentation drift | Teams misaligned | Maintain TRD updates as part of PM deliverables; schedule periodic reviews ([S3]). |
| Security gaps in generated code | Potential vulnerabilities | Security Engineer review for M+ tasks; automate scans where possible. |

## 13. Traceability Matrix

| Requirement | Source Clause(s) |
| --- | --- |
| FR-01, FR-02, FR-03, Workflow governance, QA standards | ARIA v4 prompt (§Core Identity, T-shirt sizing, Workflow definitions). |
| FR-04–FR-11, Data flow, Operational requirements | SolPlay DemoGen instructions (§Critical Workflow, Phase details, Local Deployment). |
| Documentation upkeep, section coverage expectations | Microsoft Learn TRD guidance (§Complete the combined design document). |

## 14. Next Steps

1. Review TRD with engineering leads for approval and identify gaps.
2. Align TODO ledger tooling and automation with documented requirements.
3. Extend TRD with diagrams (context, sequence) for stakeholder presentations.
4. Plan enhancements for cleanup automation and dynamic port allocation.

---
*Prepared leveraging sources [S1], [S2], and [S3]. Update this TRD whenever upstream instructions evolve to preserve alignment with ARIA v4 governance and SolPlay DemoGen delivery obligations.*
