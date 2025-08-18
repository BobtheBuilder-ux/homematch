import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import FormData from 'form-data';
import fetch from 'node-fetch';

export const config = {
  api: {
    bodyParser: false,
  },
};

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const form = formidable({
      maxFileSize: 100 * 1024 * 1024, // 100MB
      keepExtensions: true,
      multiples: true,
    });

    const [fields, files] = await form.parse(req);
    const fileList = files.files;
    const folder = Array.isArray(fields.folder) ? fields.folder[0] : fields.folder;
    const watermark = Array.isArray(fields.watermark) ? fields.watermark[0] : fields.watermark;

    if (!fileList || (Array.isArray(fileList) && fileList.length === 0)) {
      return res.status(400).json({ message: 'No files provided' });
    }

    // Create form data to send to server
    const formData = new FormData();
    
    const filesToProcess = Array.isArray(fileList) ? fileList : [fileList];
    filesToProcess.forEach((file) => {
      formData.append('files', fs.createReadStream(file.filepath), {
        filename: file.originalFilename || 'file',
        contentType: file.mimetype || 'application/octet-stream',
      });
    });
    
    formData.append('folder', folder || 'uploads');
    formData.append('watermark', watermark || 'false');

    // Forward to server API
    const serverResponse = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/cloudinary/multiple`, {
      method: 'POST',
      body: formData,
      headers: {
        ...formData.getHeaders(),
      },
    });

    if (!serverResponse.ok) {
      const error = await serverResponse.json();
      return res.status(serverResponse.status).json(error);
    }

    const result = await serverResponse.json();
    
    // Clean up temporary files
    filesToProcess.forEach((file) => {
      fs.unlinkSync(file.filepath);
    });
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export default handler;