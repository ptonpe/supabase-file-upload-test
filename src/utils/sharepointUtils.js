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
  const url = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`;

  const params = new URLSearchParams();
  params.append("client_id", CLIENT_ID);
  params.append("client_secret", CLIENT_SECRET); 
  params.append("scope", SCOPE);
  params.append("grant_type", "client_credentials");

  try {
    const response = await axios.post(url, params);
    return response.data.access_token;
  } catch (error) {
    console.error("Error fetching access token:", error);
    return null;
  }
}

// Fetch SharePoint files
export async function getSPfiles() {
  const accessToken = await getAccessToken();
  if (!accessToken) return [];

  const url = `https://graph.microsoft.com/v1.0/sites/${SITE_ID}/drives/${DRIVE_ID}/root/children`;

  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`, // ✅ fixed template string
      },
    });
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
