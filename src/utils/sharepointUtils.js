import axios from "axios";
import { supabase } from "../supabaseClient";

// Microsoft API Credentials
const CLIENT_ID = import.meta.env.VITE_CLIENT_ID;
const CLIENT_SECRET = import.meta.env.VITE_CLIENT_SECRET;
const TENANT_ID = import.meta.env.VITE_TENANT_ID;
const SCOPE = import.meta.env.VITE_SCOPE;

// Replace with your actual values
const SITE_ID = import.meta.env.VITE_SITE_ID;
const DRIVE_ID = import.meta.env.VITE_DRIVE_ID;

export async function getAccessToken() {
    try {
        const response = await axios.post("http://localhost:5174/get-token");
        return response.data.access_token;
      } catch (error) {
        console.error("Error fetching token from backend:", error);
        return null;
      }
}

function buildEncodedPath(path) {
    return path
      .split("/")
      .map(encodeURIComponent)
      .join("/");
  }

// Fetch SharePoint files
export async function getSPfiles(folderPath = "Innovations/Offer walk through") {
  const accessToken = await getAccessToken();
  if (!accessToken) return [];

  const baseUrl = `https://graph.microsoft.com/v1.0/sites/${SITE_ID}`;

  const encodedPath = folderPath
    ? `/drive/root:/${buildEncodedPath(folderPath)}:/children`
    : `/drive/root/children`;

  const url = `${baseUrl}${encodedPath}`;
 

  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`, 
      },
    });
    console.log("📂 SharePoint Files:", response.data.value);
    return response.data.value;
  } catch (error) {
    console.error("❌ Error fetching SharePoint files:", error);
    return [];
  }
}

// Download file from SharePoint and upload to Supabase
export async function uploadFiletoSupa(fileUrl, fileName, userId) {
  const accessToken = await getAccessToken();
  if (!accessToken) return null;

  try {
    const fileResponse = await axios.get(fileUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`, // ✅ fixed
      },
      responseType: "blob",
    });

    const fileBlob = fileResponse.data;

    const { data, error } = await supabase.storage
      .from("user_documents")
      .upload(`${userId}/${fileName}`, fileBlob, {
        contentType: fileBlob.type,
        upsert: true,
      });

    if (error) {
      console.error("Supabase upload error!!", error);
      return null;
    }

    // Create signed URL
    const { data: signedUrlData, error: signedUrlError } = await supabase
      .storage
      .from("user_documents")
      .createSignedUrl(`${userId}/${fileName}`, 60 * 60);

    if (signedUrlError) {
      console.error("Error creating signed URL:", signedUrlError);
      return null;
    }

    const fileUrlSigned = signedUrlData.signedUrl;

    const { error: dbError } = await supabase
      .from("Document-Storage")
      .insert([{ user_id: userId, file_name: fileName, file_url: fileUrlSigned }]);

    if (dbError) {
      console.error("Database insert error!!", dbError);
      return null;
    }

    return fileUrlSigned;
  } catch (error) {
    console.error("Error uploading SharePoint file:", error);
    return null;
  }
}
