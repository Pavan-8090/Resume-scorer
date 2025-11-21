import { useState, useEffect } from 'react';
import axios from 'axios';

export default function BackendStatus() {
  const [status, setStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  useEffect(() => {
    checkBackendStatus();
    const interval = setInterval(checkBackendStatus, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const checkBackendStatus = async () => {
    try {
      await axios.get(`${apiUrl}/health`, { timeout: 10000 });
      setStatus('online');
    } catch (error: any) {
      console.error('Backend health check failed:', error.message, 'URL:', `${apiUrl}/health`);
      setStatus('offline');
    }
  };

  if (status === 'offline') {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
        <strong>⚠️ Backend Server Offline</strong>
        <p className="mt-1">
          Backend server is not running. Please start it with:
        </p>
        <code className="block mt-2 bg-red-100 p-2 rounded text-xs">
          cd backend_python && python main.py
        </code>
        <p className="mt-2 text-xs">
          Or from project root: <code className="bg-red-100 px-1 rounded">npm run dev</code>
        </p>
      </div>
    );
  }

  if (status === 'checking') {
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg text-sm mb-4">
        Checking backend connection...
      </div>
    );
  }

  return null;
}

