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
    });

    const [fields, files] = await form.parse(req);
    const video = Array.isArray(files.video) ? files.video[0] : files.video;
    const propertyId = Array.isArray(fields.propertyId) ? fields.propertyId[0] : fields.propertyId;

    if (!video) {
      return res.status(400).json({ message: 'No video provided' });
    }

    if (!propertyId) {
      return res.status(400).json({ message: 'Property ID is required' });
    }

    // Create form data to send to server
    const formData = new FormData();
    formData.append('video', fs.createReadStream(video.filepath), {
      filename: video.originalFilename || 'video',
      contentType: video.mimetype || 'video/mp4',
    });
    formData.append('propertyId', propertyId);

    // Forward to server API
    const serverResponse = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/cloudinary/property-video`, {
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
    
    // Clean up temporary file
    fs.unlinkSync(video.filepath);
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export default handler;