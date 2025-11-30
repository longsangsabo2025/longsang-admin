import { NextRequest, NextResponse } from 'next/server';
import { googleDriveService } from '@/lib/google-drive/drive-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get('folderId') || 'root';
    const pageSize = parseInt(searchParams.get('pageSize') || '50');

    const result = await googleDriveService.listFiles(folderId, pageSize);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Error in /api/drive/files:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to fetch files' 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const parentFolderId = formData.get('parentFolderId') as string || 'root';

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    const uploadedFile = await googleDriveService.uploadFile(
      file.name,
      buffer,
      file.type,
      parentFolderId
    );

    return NextResponse.json({
      success: true,
      data: uploadedFile,
    });
  } catch (error: any) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to upload file' 
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('fileId');

    if (!fileId) {
      return NextResponse.json(
        { success: false, error: 'File ID is required' },
        { status: 400 }
      );
    }

    await googleDriveService.deleteFile(fileId);

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting file:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to delete file' 
      },
      { status: 500 }
    );
  }
}