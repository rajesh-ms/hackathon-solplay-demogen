## API DemoGen Debug Guide

This guide shows how to run the service locally in debug mode *without using real production secrets*.

### 1. Protect Secrets
If you accidentally added real keys in `.env`, immediately:
1. Remove or redact them locally.
2. Add `.env` to `.gitignore` (already done in repo update).
3. Rotate the exposed keys (Azure OpenAI keys & v0 API key) in their respective portals.

### 2. Create a Local `.env.local` (NOT committed)
```
V0_API_KEY=dummy-local-key
V0_BASE_URL=https://v0.dev/api
PORT=3001
ENABLE_AI_CONTENT_ENHANCEMENT=false
LOG_LEVEL=debug
```
When `ENABLE_AI_CONTENT_ENHANCEMENT=false`, Azure OpenAI initialization is skipped, so you don't need its keys for basic route testing.

### 3. Install & Build
```
cd api-demogen
npm install
npm run build
```

### 4. Start in Debug Mode (TypeScript live reload)
```
npm run dev:debug
```
Node Inspector available at: `chrome://inspect` (default `ws://127.0.0.1:9229`)

### 5. Test Endpoints
```
curl http://localhost:3001/api/v1/health
curl -X POST http://localhost:3001/api/v1/generate-demo \
  -H "Content-Type: application/json" \
  -d '{"useCaseTitle":"AI Support","keyCapabilities":["Routing","NLP"]}'
```

### 6. Breakpoints
Place breakpoints in `src/services/hybrid-demo.service.ts` or `src/routes/demo.routes.ts` and re-trigger a request.

### 7. Optional: Test AI Path
Set in `.env.local` (only if you have sandbox keys):
```
ENABLE_AI_CONTENT_ENHANCEMENT=true
AZURE_OPENAI_ENDPOINT=...your endpoint...
AZURE_OPENAI_API_KEY=...rotated key...
AZURE_OPENAI_API_VERSION=2024-02-15-preview
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o-mini
```

### 8. Security Checklist
- Never commit real keys.
- Always rotate any accidentally exposed secret.
- Prefer Managed Identity in cloud (`USE_MANAGED_IDENTITY=true`).

### 9. Jest Tests (Mocked)
```
npm test
```
These do not call real external services.

### 10. Common Issues
| Symptom | Cause | Fix |
|---------|-------|-----|
| v0 API key error | Missing `V0_API_KEY` | Add dummy value for local non-network tests |
| 400 on enhanced endpoint | Bad schema input | Ensure `keyCapabilities` is non-empty array |
| Hanging request | Breakpoint before response | Continue in debugger |

---
Safe debugging is now configured. Adjust and extend as needed.