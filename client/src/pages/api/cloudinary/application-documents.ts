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
    const idDocument = Array.isArray(files.idDocument) ? files.idDocument[0] : files.idDocument;
    const incomeProof = Array.isArray(files.incomeProof) ? files.incomeProof[0] : files.incomeProof;
    const applicationId = Array.isArray(fields.applicationId) ? fields.applicationId[0] : fields.applicationId;

    if (!idDocument && !incomeProof) {
      return res.status(400).json({ message: 'At least one document is required' });
    }

    if (!applicationId) {
      return res.status(400).json({ message: 'Application ID is required' });
    }

    // Create form data to send to server
    const formData = new FormData();
    
    if (idDocument) {
      formData.append('idDocument', fs.createReadStream(idDocument.filepath), {
        filename: idDocument.originalFilename || 'id-document',
        contentType: idDocument.mimetype || 'application/pdf',
      });
    }
    
    if (incomeProof) {
      formData.append('incomeProof', fs.createReadStream(incomeProof.filepath), {
        filename: incomeProof.originalFilename || 'income-proof',
        contentType: incomeProof.mimetype || 'application/pdf',
      });
    }
    
    formData.append('applicationId', applicationId);

    // Forward to server API
    const serverResponse = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/cloudinary/application-documents`, {
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
    if (idDocument) {
      fs.unlinkSync(idDocument.filepath);
    }
    if (incomeProof) {
      fs.unlinkSync(incomeProof.filepath);
    }
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export default handler;