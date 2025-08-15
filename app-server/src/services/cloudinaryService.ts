import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export const uploadFileToCloudinary = async (filePath: string, folder: string): Promise<{ url: string; publicId: string }> => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      resource_type: "auto", // support images, videos, audio
    });

    fs.unlinkSync(filePath);

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (err) {
    fs.unlinkSync(filePath);
    throw err;
  }
};

export const deleteFileFromCloudinary = async (publicId: string) => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error(`Failed to delete Cloudinary file: ${publicId}`, err);
  }
};
