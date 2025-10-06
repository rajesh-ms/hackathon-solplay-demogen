
interface DemoData {
  demoId: string;
  status: string;
  demo?: {
    v0Component?: { code?: string; componentId?: string; preview?: string };
    aiEnhancedContent?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
  };
}

async function fetchDemo(demoId: string): Promise<DemoData | null> {
  const base = process.env.NEXT_PUBLIC_DEMOGEN_API_BASE || 'http://localhost:3001/api/v1';
  try {
    const res = await fetch(`${base}/demos/${demoId}`, { cache: 'no-store' });
    if(!res.ok) return null;
    const json = await res.json();
    return json.data;
  } catch {
    return null;
  }
}

function createRuntimeComponent(code: string): React.JSX.Element {
  // Create a secure iframe with the React component
  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Demo Component</title>
  <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    ${code}

    // Extract the component name from the code
    const componentMatch = code.match(/export default function (\w+)/);
    const ComponentName = componentMatch ? componentMatch[1] : 'DemoComponent';

    // Get the component function from the global scope
    const Component = eval(ComponentName);

    // Render the component
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(React.createElement(Component));
  </script>
</body>
</html>
  `;

  return (
    <div className="space-y-4">
      <div className="border border-slate-300 rounded-lg overflow-hidden">
        <div className="bg-slate-100 px-4 py-2 border-b border-slate-300">
          <h3 className="text-sm font-medium text-slate-700">Live Demo Preview</h3>
        </div>
        <iframe
          srcDoc={htmlContent}
          className="w-full h-96 border-0"
          sandbox="allow-scripts"
          title="Demo Component Preview"
        />
      </div>
      <details className="space-y-2">
        <summary className="cursor-pointer text-sm font-medium text-slate-700 hover:text-slate-900">
          View Source Code
        </summary>
        <pre className="p-4 bg-slate-900 text-slate-100 text-xs overflow-auto rounded border border-slate-700">
          <code>{code}</code>
        </pre>
      </details>
    </div>
  );
}

export default async function DemoPage({ params }: { params: { demoId: string } }) {
  const { demoId } = await params;
  const demo = await fetchDemo(demoId);

  if(!demo) {
    return <div className="max-w-4xl mx-auto py-16"><h1 className="text-2xl font-semibold text-red-600">Demo not found</h1></div>;
  }

  const code = demo.demo?.v0Component?.code || '// No component code available';
  const v0PreviewUrl = demo.demo?.v0Component?.preview;
  const hasCode = code && code !== '// No component code available' && code.trim().length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-10">
      <div className="max-w-6xl mx-auto space-y-8 px-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold text-slate-800">Demo: {demoId}</h1>
          <p className="text-slate-600">Status: <span className="font-medium">{demo.status}</span></p>
        </header>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-700">Generated Demo Component</h2>

          {v0PreviewUrl ? (
            <div className="space-y-4">
              <div className="border border-slate-300 rounded-lg overflow-hidden">
                <div className="bg-slate-100 px-4 py-2 border-b border-slate-300 flex items-center justify-between">
                  <h3 className="text-sm font-medium text-slate-700">Live Demo Preview (v0.dev)</h3>
                  <a
                    href={v0PreviewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 underline"
                  >
                    Open in v0.dev ↗
                  </a>
                </div>
                <iframe
                  src={v0PreviewUrl}
                  className="w-full h-96 border-0"
                  title="v0.dev Demo Component Preview"
                />
              </div>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Demo URL:</strong> <a href={v0PreviewUrl} target="_blank" rel="noopener noreferrer" className="underline">{v0PreviewUrl}</a>
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  This demo was generated using synthetic data and is ready for presentation without any file uploads.
                </p>
              </div>
            </div>
          ) : hasCode ? (
            createRuntimeComponent(code)
          ) : (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">No demo component available for this demo ID.</p>
            </div>
          )}
        </section>

        {demo.demo?.aiEnhancedContent && (
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-slate-700">AI Enhanced Content</h2>
            <div className="p-4 bg-white/60 rounded border border-slate-200 shadow-sm">
              <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(demo.demo.aiEnhancedContent, null, 2)}</pre>
            </div>
          </section>
        )}

        {demo.demo?.metadata && (
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-slate-700">Metadata</h2>
            <div className="p-4 bg-white/60 rounded border border-slate-200 shadow-sm">
              <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(demo.demo.metadata, null, 2)}</pre>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
