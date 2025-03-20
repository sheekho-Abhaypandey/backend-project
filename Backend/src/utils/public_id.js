const extractPublicIdFromUrl = (url) => {
  try {
    const cleanUrl = url.split("?")[0];
    const parts = cleanUrl.split("/upload/")[1]; // get path after /upload/
    const publicIdWithExt = parts.split("/").slice(1).join("/"); // remove 'vXXXXXXX'
    const publicId = publicIdWithExt.substring(0, publicIdWithExt.lastIndexOf("."));
    return publicId;
  } catch (error) {
    console.error("Failed to extract public_id:", error);
    return null;
  }
};


  export  {extractPublicIdFromUrl};