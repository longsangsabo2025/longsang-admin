import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { googleDriveAPI } from '@/lib/api/google-drive-http';
import type { DriveFile, DriveFolder } from '@/lib/api/google-drive-http';

const GoogleDriveIntegrationTest = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [folders, setFolders] = useState<DriveFolder[]>([]);
  const [connectionStatus, setConnectionStatus] = useState('Not tested');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Test 1: List files from Google Drive
  const testListFiles = async () => {
    setIsLoading(true);
    try {
      console.log('Testing Google Drive API - List Files...');
      const result = await googleDriveAPI.listFiles('root');

      setFiles(result.files);
      setFolders(result.folders);
      setConnectionStatus('✅ Connected - Google Drive API Working');

      toast.success(`✅ Found ${result.files.length} files and ${result.folders.length} folders`);
      console.log('API Response:', result);
    } catch (error: any) {
      console.error('List files error:', error);
      setConnectionStatus(`❌ Error: ${error.message}`);
      toast.error(`❌ Failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Test 2: Upload file to Google Drive
  const testUploadFile = async () => {
    if (!selectedFile) {
      toast.error('Please select a file first');
      return;
    }

    setIsLoading(true);
    try {
      console.log('Testing file upload:', selectedFile.name);
      const result = await googleDriveAPI.uploadFile(selectedFile, 'root');

      toast.success(`✅ Uploaded: ${result.name}`);
      console.log('Upload result:', result);

      // Refresh file list
      await testListFiles();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(`❌ Upload failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Test 3: Create folder
  const testCreateFolder = async () => {
    const folderName = `Test-Folder-${Date.now()}`;
    setIsLoading(true);
    try {
      console.log('Testing folder creation:', folderName);
      const result = await googleDriveAPI.createFolder(folderName, 'root');

      toast.success(`✅ Created folder: ${result.name}`);
      console.log('Folder created:', result);

      // Refresh file list
      await testListFiles();
    } catch (error: any) {
      console.error('Create folder error:', error);
      toast.error(`❌ Folder creation failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🧪 Google Drive Integration - Live Test
            <Badge variant={connectionStatus.includes('✅') ? 'default' : 'destructive'}>
              {connectionStatus.includes('✅') ? 'Working' : 'Issues'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="font-medium">Status: {connectionStatus}</p>
          </div>

          {/* Test Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={testListFiles}
              disabled={isLoading}
              variant="outline"
              className="w-full"
            >
              📋 Test List Files
            </Button>

            <Button
              onClick={testCreateFolder}
              disabled={isLoading}
              variant="outline"
              className="w-full"
            >
              📁 Test Create Folder
            </Button>

            <Button
              onClick={testUploadFile}
              disabled={isLoading || !selectedFile}
              variant="outline"
              className="w-full"
            >
              📤 Test Upload
            </Button>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="file-upload">Select file to test upload:</Label>
            <Input
              id="file-upload"
              type="file"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              accept="*/*"
            />
            {selectedFile && (
              <p className="text-sm text-gray-600">
                Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {(files.length > 0 || folders.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>📂 Google Drive Contents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Folders */}
              {folders.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">📁 Folders ({folders.length})</h3>
                  <div className="space-y-1">
                    {folders.map((folder) => (
                      <div key={folder.id} className="p-2 bg-blue-50 rounded text-sm">
                        📁 {folder.name} - Modified:{' '}
                        {new Date(folder.modifiedTime).toLocaleString()}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Files */}
              {files.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">📄 Files ({files.length})</h3>
                  <div className="space-y-1 max-h-60 overflow-y-auto">
                    {files.map((file) => (
                      <div key={file.id} className="p-2 bg-gray-50 rounded text-sm">
                        📄 {file.name} - {file.mimeType}
                        {file.size && ` - ${(parseInt(file.size) / 1024).toFixed(1)} KB`}
                        <br />
                        <span className="text-xs text-gray-500">
                          Modified: {new Date(file.modifiedTime).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Debug Info */}
      <Card>
        <CardHeader>
          <CardTitle>🔧 Debug Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm space-y-1 font-mono bg-gray-50 p-3 rounded">
            <p>• Frontend: http://localhost:8082</p>
            <p>• Backend API: http://localhost:3001</p>
            <p>• Google Drive API: /api/drive/list</p>
            <p>
              • Service Account: automation-bot-102@long-sang-automation.iam.gserviceaccount.com
            </p>
            <p>• CORS: Enabled</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GoogleDriveIntegrationTest;
