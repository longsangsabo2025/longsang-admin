import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from 'sonner';
import { googleDriveAPI } from '@/lib/api/google-drive-http';

export const GoogleDriveTest = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [files, setFiles] = useState([]);
  const [apiStatus, setApiStatus] = useState('Checking...');

  // Test API connection
  const testConnection = async () => {
    setIsLoading(true);
    setApiStatus('Testing connection...');
    
    try {
      // Test basic API health - silently fail in dev mode
      const healthResponse = await fetch('http://localhost:3001/api/health').catch(() => null);
      if (!healthResponse?.ok) {
        // In dev mode, just show disconnected without error spam
        if (import.meta.env.DEV) {
          setApiStatus('API Server: Not running (dev mode)');
          setIsConnected(false);
          setIsLoading(false);
          return;
        }
        throw new Error('API server not responding');
      }
      
      setApiStatus('API Server: ✅ Connected');
      
      // Test Google Drive API
      const driveResponse = await googleDriveAPI.listFiles('root');
      setFiles(driveResponse.files || []);
      setIsConnected(true);
      setApiStatus('Google Drive API: ✅ Working');
      
      toast.success('✅ Google Drive integration working!');
    } catch (error: any) {
      console.error('Connection test failed:', error);
      setIsConnected(false);
      setApiStatus(`❌ Error: ${error.message}`);
      toast.error(`❌ Connection failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-test on component mount (skip in dev mode to avoid console spam)
  useEffect(() => {
    if (import.meta.env.DEV) {
      setApiStatus('API Server: Not running (dev mode)');
      setIsConnected(false);
    } else {
      testConnection();
    }
  }, []);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🔗 Google Drive Integration Test
          <Badge variant={isConnected ? "default" : "destructive"}>
            {isConnected ? "Connected" : "Disconnected"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="font-medium">Status: {apiStatus}</p>
        </div>

        <Button 
          onClick={testConnection} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? 'Testing...' : '🔄 Test Connection'}
        </Button>

        {isConnected && (
          <div className="space-y-2">
            <h3 className="font-medium">📁 Files in Google Drive Root:</h3>
            <div className="max-h-40 overflow-y-auto bg-gray-50 p-3 rounded">
              {files.length === 0 ? (
                <p className="text-gray-500">No files found (empty or new Google Drive)</p>
              ) : (
                files.map((file: any, index) => (
                  <div key={index} className="text-sm py-1 border-b border-gray-200 last:border-b-0">
                    📄 {file.name} ({file.mimeType})
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        <div className="text-xs text-gray-500 space-y-1">
          <p>• Backend API: http://localhost:3001</p>
          <p>• Frontend: http://localhost:8082</p>
          <p>• Google Drive API: Service Account Authentication</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default GoogleDriveTest;