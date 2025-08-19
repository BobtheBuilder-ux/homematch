"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const cloudinary_1 = require("cloudinary");
const fs_1 = __importDefault(require("fs"));
// Load environment variables
dotenv_1.default.config();
// Configure Cloudinary directly in the script
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
/**
 * Script to upload the logo.svg file to Cloudinary for watermarking
 */
function uploadLogo() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Path to the logo.svg file in the client's public directory
            const logoPath = path_1.default.join(__dirname, '../../../client/public/logo.svg');
            console.log('Uploading logo for watermarking...');
            console.log('Logo path:', logoPath);
            // Check if logo file exists
            if (!fs_1.default.existsSync(logoPath)) {
                throw new Error(`Logo file not found at: ${logoPath}`);
            }
            // Upload logo to Cloudinary
            const result = yield cloudinary_1.v2.uploader.upload(logoPath, {
                public_id: 'watermark/logo',
                resource_type: 'image',
                overwrite: true,
                folder: 'watermarks'
            });
            console.log('✅ Logo uploaded successfully!');
            console.log('Public ID:', result.public_id);
            console.log('Secure URL:', result.secure_url);
            console.log('You can now use this logo for watermarking images and videos.');
            return result.public_id;
        }
        catch (error) {
            console.error('❌ Error uploading logo:', error);
            process.exit(1);
        }
    });
}
// Run the script if called directly
if (require.main === module) {
    uploadLogo();
}
exports.default = uploadLogo;
