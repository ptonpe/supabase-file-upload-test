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
export async function getSPfiles(folderPath = "Offer walk through") {
  const accessToken = await getAccessToken();
  if (!accessToken) return [];

  const baseUrl = `https://graph.microsoft.com/v1.0/sites/${SITE_ID}`;
  const encodedPath = folderPath
    ? `/drive/root:/${buildEncodedPath(folderPath)}:/children`
    : `/drive/root/children`;

  console.log("🔍 Full SharePoint URL: ", `https://graph.microsoft.com/v1.0/sites/${SITE_ID}/drive/root:/${buildEncodedPath("Offer walk through")}:/children`);
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
export async function uploadFiletoSupa(fileUrl, fileName, userId, folderPath = "") {
  const accessToken = await getAccessToken();
  if (!accessToken) return null;

  try {
    // Optional: log the encoded SharePoint folder path for debugging
    if (folderPath) {
      const encodedPath = `/drive/root:/${buildEncodedPath(folderPath)}:/children`;
      console.log("📁 Encoded SharePoint Path (debug only):", encodedPath);
    }

    // Get file blob from SharePoint URL
    const fileResponse = await axios.get(fileUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      responseType: "blob",
    });

    const {
      data: sessionData,
      error: sessionError
    } = await supabase.auth.getSession();
    console.log("🧪 Supabase session during insert:", sessionData);

    const fileBlob = fileResponse.data;
    console.log("📦 Blob type:", fileBlob.type);

    const fileKey = `${userId}/${fileName}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("user_documents")
      .upload(fileKey, fileBlob, {
        contentType: fileBlob.type,
        upsert: true,
      });

    if (uploadError) {
      console.error("❌ Supabase upload error:", uploadError);
      return null;
    }

    // Create signed URL
    const { data: signedUrlData, error: signedUrlError } = await supabase
      .storage
      .from("user_documents")
      .createSignedUrl(fileKey, 60 * 60); // 1 hour

    if (signedUrlError) {
      console.error("❌ Signed URL creation error:", signedUrlError);
      return null;
    }

    const fileUrlSigned = signedUrlData.signedUrl;

    // Insert into Supabase DB
    const { error: dbError } = await supabase
      .from("Document-Storage")
      .insert([{ user_id: userId, file_name: fileName, file_url: fileUrlSigned }]);

    if (dbError) {
      console.error("❌ Supabase DB insert error:", dbError);
      return null;
    }

    console.log("✅ Upload + DB insert successful:", fileName);
    return fileUrlSigned;

  } catch (error) {
    console.error("🚨 Unexpected error in uploadFiletoSupa:", error);
    return null;
  }
}
