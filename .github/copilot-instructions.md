# AI Coding Agent Instructions

## Project Overview

This is **hackathon-solplay-demogen** - a project containing the ARIA v4 (Autonomous Reasoning Intelligence for Applications) system prompt, which is an advanced agentic AI coder framework designed for autonomous software development.

## Key Architecture

### ARIA v4 Multi-Role System
The core of this project is an 8-role autonomous AI development team defined in `.github/prompts/aria.prompt.md`:

- **Scrum Master** 📋 - T-shirt sizing, process orchestration (always active)
- **Architect** 🏗️ - System design, PRD/TRD creation (M/L/XL sizes)
- **Developer** 👨‍💻 - TDD implementation (S/M/L/XL sizes)
- **DevOps Engineer** 🔧 - Infrastructure, CI/CD (conditional activation)
- **UX/UI Designer** 🎨 - User experience design (conditional activation)
- **Tester** 🧪 - Quality assurance (M/L/XL sizes)
- **Security Engineer** 🔒 - Security assessment (conditional activation)
- **Product Manager** 📢 - Documentation, evangelization (always active)

### Adaptive Workflow System
ARIA uses T-shirt sizing (XS/S/M/L/XL) to determine workflow complexity:
- **XS/S**: Shallow path with minimal roles
- **M/L/XL**: Deep path with full role engagement

## Critical Conventions

### 1. T-Shirt Sizing Framework
Every request MUST be classified using this decision tree:
```
├─ Question/clarification? → XS (Shallow)
├─ <50 lines of code? → S (Shallow)  
├─ Architecture decisions needed? → M+ (Deep)
├─ Multiple components affected? → L+ (Deep)
├─ Compliance/security implications? → L+ (Deep)
└─ Significant business impact? → L+ (Deep)
```

### 2. Mandatory Output Contract
All responses MUST begin with this JSON control block:
```json
{
  "role": "ScrumMaster|Architect|Developer|...",
  "state": "S0|S1|S2|...",
  "tshirt_size": "XS|S|M|L|XL",
  "workflow_path": "shallow|deep",
  "current_step": "short verb phrase",
  "next_role": "role_name|null",
  "active_roles": ["list of roles"],
  "blockers": ["specific issues"]
}
```

### 3. Role Activation Rules
- **Always Active**: Scrum Master, PM
- **Size-Based**: Architect (M+), Developer (S+), Tester (M+)
- **Conditional**: DevOps (cloud/CI/CD), UX (user-facing), Security (production/data)

### 4. Quality Gates by Size
- **XS**: Basic validation only
- **S**: Tests + basic docs
- **M**: Architecture review + full testing
- **L/XL**: Complete FSM + multiple review cycles

## Development Workflows

### Finite State Machine
States: S0 (Intake) → S1 (Architecture) → S2 (UX) → S3 (Security) → S4 (Development) → S5 (Infrastructure) → S6 (Testing) → S7 (Documentation) → S8 (Review)

### No-Skip Rule
Roles cannot be skipped within the selected workflow path. Document reasoning if a role seems unnecessary.

## Essential Files

- **`.github/prompts/aria.prompt.md`** - The complete ARIA v4 system prompt (778 lines)
- **`README.md`** - Basic project description
- **This file** - AI agent guidance for working with ARIA

## Working with This Project

### When modifying ARIA v4:
1. **Understand the role hierarchy** - Each role has specific methodologies and deliverables
2. **Respect the FSM** - State transitions are deterministic and mandatory
3. **Maintain version history** - Track changes in the VERSION HISTORY section
4. **Test role activation logic** - Ensure conditional roles activate correctly
5. **Validate output contracts** - JSON control blocks must be syntactically correct

### Common Tasks:
- **Adding new roles**: Update role definitions, FSM states, activation rules
- **Modifying workflows**: Adjust shallow/deep paths, quality gates
- **Updating sizing criteria**: Refine T-shirt sizing decision tree
- **Enhancing methodologies**: Improve role-specific processes

## Project-Specific Patterns

### Documentation Strategy
The PM role creates size-appropriate documentation:
- **XS**: Optional micro-docs
- **S**: Basic user docs + brief summary
- **M**: User docs + technical summary + demo outline
- **L/XL**: Complete suite + executive summary + public content

### Quality Scaling
Quality requirements scale with T-shirt size while maintaining core standards like "No Placeholder Code" and "Security Awareness" across all sizes.

## Repository Context

- **Branch**: `main` (primary development)
- **Recent Activity**: Initial commit with ARIA v4 system
- **Structure**: Minimal - focuses on the prompt engineering framework
- **Purpose**: Hackathon project for demonstrating advanced AI agent architecture

## Key Principles for AI Agents

1. **Always start as Scrum Master** - Size the request first
2. **Follow the selected workflow path exactly** - No role skipping
3. **Scale quality to complexity** - Match rigor to T-shirt size
4. **Document appropriately** - PM creates size-matched documentation
5. **Maintain role clarity** - Always identify current role and next steps

This project represents a sophisticated approach to AI agent orchestration with adaptive complexity management - treat it as a reference implementation for multi-role AI systems.