import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Sparkles, AlertCircle } from 'lucide-react';

export function ModelStatus() {
  const [modelInfo, setModelInfo] = useState({
    current: '',
    status: 'loading',
    message: '',
  });

  useEffect(() => {
    const config = localStorage.getItem('system_config');
    if (config) {
      const parsed = JSON.parse(config);
      const model = parsed.model || 'gpt-3.5-turbo';

      let status = 'active';
      let message = '';

      if (model === 'gpt-4-turbo-preview') {
        message = 'Most Advanced Model (O3 coming soon)';
      } else if (model === 'gpt-4') {
        message = 'Premium Model';
      } else if (model === 'gpt-3.5-turbo') {
        message = 'Fast Model';
      } else if (model.includes('o3')) {
        status = 'future';
        message = 'O3 - Not Yet Available';
      }

      setModelInfo({
        current: model,
        status,
        message,
      });
    }
  }, []);

  return (
    <div className="fixed bottom-4 left-4 flex items-center gap-2 px-3 py-2 bg-card border rounded-lg shadow-lg z-40">
      <Sparkles className="h-4 w-4 text-purple-500" />
      <div className="flex flex-col">
        <span className="text-xs font-medium">AI Model</span>
        <div className="flex items-center gap-2">
          <Badge
            variant={modelInfo.status === 'active' ? 'default' : 'secondary'}
            className="text-xs"
          >
            {modelInfo.current}
          </Badge>
          {modelInfo.message && (
            <span className="text-xs text-muted-foreground">
              {modelInfo.message}
            </span>
          )}
        </div>
      </div>
      {modelInfo.status === 'future' && (
        <div title="O3 model not yet available">
          <AlertCircle className="h-4 w-4 text-yellow-500" />
        </div>
      )}
    </div>
  );
}
