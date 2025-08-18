import path from 'path';
import { uploadLogoForWatermark } from '../utils/cloudinaryService';

/**
 * Script to upload the logo.svg file to Cloudinary for watermarking
 */
async function uploadLogo() {
  try {
    // Path to the logo.svg file in the client's public directory
    const logoPath = path.join(__dirname, '../../../client/public/logo.svg');
    
    console.log('Uploading logo for watermarking...');
    console.log('Logo path:', logoPath);
    
    const publicId = await uploadLogoForWatermark(logoPath);
    
    console.log('✅ Logo uploaded successfully!');
    console.log('Public ID:', publicId);
    console.log('You can now use this logo for watermarking images and videos.');
    
  } catch (error) {
    console.error('❌ Error uploading logo:', error);
    process.exit(1);
  }
}

// Run the script if called directly
if (require.main === module) {
  uploadLogo();
}

export default uploadLogo;