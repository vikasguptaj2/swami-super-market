import { v2 as cloudinary } from "cloudinary";

export function isCloudinaryConfigured(): boolean {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

// Configure Cloudinary from environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export async function uploadImageBuffer(
  buffer: Buffer,
  folder = "swami-super-market"
): Promise<string> {
  if (!isCloudinaryConfigured()) {
    throw new Error(
      "Cloudinary credentials are not configured on the server. Please check CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your environment variables."
    );
  }

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
      },
      (error: any, result: any) => {
        if (error || !result) {
          return reject(
            new Error(
              error?.message || "Failed to upload image buffer to Cloudinary"
            )
          );
        }
        resolve(result.secure_url);
      }
    );

    uploadStream.end(buffer);
  });
}
