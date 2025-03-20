
import {v2 as cloudinary} from 'cloudinary';
const deleteFromCloudinary = async (publicId) => {
    try {
        console.log("Deleting publicId:", publicId);
      const result = await cloudinary.uploader.destroy(publicId);
      console.log("Cloudinary delete result:", result);
      return result;
    } catch (error) {
      console.error("Cloudinary Delete Error:", error);
      return null;
    }
  };

  export {deleteFromCloudinary};