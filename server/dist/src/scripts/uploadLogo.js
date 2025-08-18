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
const path_1 = __importDefault(require("path"));
const cloudinaryService_1 = require("../utils/cloudinaryService");
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
            const publicId = yield (0, cloudinaryService_1.uploadLogoForWatermark)(logoPath);
            console.log('✅ Logo uploaded successfully!');
            console.log('Public ID:', publicId);
            console.log('You can now use this logo for watermarking images and videos.');
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
