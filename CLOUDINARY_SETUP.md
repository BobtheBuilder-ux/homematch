# Cloudinary Integration Setup Guide

This guide explains how to complete the Cloudinary integration for the HomeMatch real estate platform.

## Overview

The system has been configured to use a hybrid approach:
- **Cloudinary**: For image/video optimization and watermarking
- **AWS S3**: For final storage of processed files

## Setup Steps

### 1. Create Cloudinary Account

1. Go to [Cloudinary](https://cloudinary.com/) and create a free account
2. After registration, go to your Dashboard
3. Copy the following credentials:
   - Cloud Name
   - API Key
   - API Secret

### 2. Configure Environment Variables

Update the `.env` file in the server directory with your Cloudinary credentials:

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_actual_cloud_name
CLOUDINARY_API_KEY=your_actual_api_key
CLOUDINARY_API_SECRET=your_actual_api_secret
```

### 3. Upload Logo for Watermarking

Once the credentials are configured, run the logo upload script:

```bash
cd server
npx ts-node src/scripts/uploadLogo.ts
```

This will upload the `client/public/logo.svg` file to Cloudinary for use as a watermark.

### 4. API Endpoints

The following endpoints are now available:

#### File Upload Endpoints
- `POST /cloudinary/upload/single` - Upload single file
- `POST /cloudinary/upload/multiple` - Upload multiple files
- `POST /cloudinary/upload/property-photos` - Upload property photos with watermark
- `POST /cloudinary/upload/property-video` - Upload property video with watermark
- `POST /cloudinary/upload/application-documents` - Upload application documents
- `POST /cloudinary/upload/logo-watermark` - Upload logo for watermarking

#### File Management Endpoints
- `DELETE /cloudinary/delete` - Delete file from S3
- `GET /cloudinary/optimize-url` - Generate optimized URL

### 5. How It Works

#### For Images and Videos:
1. File is uploaded to the server
2. File is processed through Cloudinary for optimization and watermarking
3. Processed file is downloaded from Cloudinary
4. Final file is uploaded to S3
5. Temporary Cloudinary file is deleted
6. S3 URL is returned to the client

#### For Documents:
1. File is uploaded directly to S3 (no processing needed)
2. S3 URL is returned to the client

### 6. Watermarking Configuration

- **Property Photos**: Automatically watermarked with logo
- **Property Videos**: Automatically watermarked with logo
- **Other Images**: Watermarking optional (controlled by `watermark` parameter)
- **Documents**: No watermarking applied

### 7. File Structure

Files are organized in S3 with the following structure:
```
bucket-name/
├── properties/
│   ├── {propertyId}/
│   │   ├── photos/
│   │   └── videos/
├── applications/
│   ├── {applicationId}/
│   │   ├── id/
│   │   └── income/
└── uploads/
    └── (general uploads)
```

### 8. Client-Side Integration

The client-side service (`client/src/services/cloudinaryService.ts`) provides functions to:
- Upload files to the hybrid service
- Generate optimized URLs
- Delete files
- Handle different file types appropriately

### 9. Testing the Integration

After setting up the credentials:

1. Start the server: `npm run dev`
2. Test file upload using a tool like Postman or the client application
3. Verify files are processed and stored in S3
4. Check that watermarks are applied to property images/videos

### 10. Environment Variables Summary

Ensure all these environment variables are configured:

```env
# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# AWS S3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
S3_BUCKET_NAME=your_bucket_name
```

## Troubleshooting

### Common Issues:

1. **"Must supply api_key" error**: Check that Cloudinary credentials are correctly set in `.env`
2. **S3 upload failures**: Verify AWS credentials and bucket permissions
3. **Watermark not appearing**: Ensure logo was uploaded successfully to Cloudinary
4. **File size limits**: Default limit is 100MB, adjust in multer configuration if needed

### Support

For additional help:
1. Check Cloudinary documentation: https://cloudinary.com/documentation
2. Check AWS S3 documentation: https://docs.aws.amazon.com/s3/
3. Review the implementation in `server/src/utils/cloudinaryService.ts`

## Security Notes

- Never commit actual API keys to version control
- Use environment variables for all sensitive credentials
- Consider using IAM roles for AWS access in production
- Implement proper file type validation and size limits
- Use signed URLs for sensitive content access