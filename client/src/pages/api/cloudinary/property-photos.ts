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
    const photos = files.photos;
    const propertyId = Array.isArray(fields.propertyId) ? fields.propertyId[0] : fields.propertyId;

    if (!photos || (Array.isArray(photos) && photos.length === 0)) {
      return res.status(400).json({ message: 'No photos provided' });
    }

    if (!propertyId) {
      return res.status(400).json({ message: 'Property ID is required' });
    }

    // Create form data to send to server
    const formData = new FormData();
    
    const photosToProcess = Array.isArray(photos) ? photos : [photos];
    photosToProcess.forEach((photo) => {
      formData.append('photos', fs.createReadStream(photo.filepath), {
        filename: photo.originalFilename || 'photo',
        contentType: photo.mimetype || 'image/jpeg',
      });
    });
    
    formData.append('propertyId', propertyId);

    // Forward to server API
    const serverResponse = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/cloudinary/property-photos`, {
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
    photosToProcess.forEach((photo) => {
      fs.unlinkSync(photo.filepath);
    });
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export default handler;