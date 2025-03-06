import axios from "axios";
import { supabase } from "../supabaseClient"; 

// Microsoft API Credentials
const CLIENT_ID = "3d459e73-f4c0-4545-8bf8-f7140ebe8314";
const CLIENT_SECRET = "85e8c5a8-d3aa-4b4d-9a39-a05566b9c12f";
const TENANT_ID = "f909022f-1f9a-473e-898e-6be5a673e877";
const REDIRECT_URI = "http://localhost:3001"; 
const SCOPE = "https://graph.microsoft.com/.default";

export async function getAccessToken() {
    const url = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`;

    const params = new URLSearchParams();
    params.append("client_id", CLIENT_ID);
    params.append("client_secret", "CLIENT_SECRET");
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


// fetch Sharepoint files from a site
export async function getSPfiles(siteID, driveID) {
    const accessToken = await getAccessToken();
    if (!accessToken) return [];

    const url = `https://graph.microsoft.com/v1.0/sites/${siteId}/drives/${driveId}/root/children`;

    try {
        const response = await axios.get(url, {
            headers: {Authorization: 'Bearer ${accessToken}'},
        });
        return response.data.value;
    } catch(error) {
        console.log("❌ Error fetching SharePoint files:", error);
        return [];
    }
}

// download file from SP and upload to Supa
export async function uploadFiletoSupa(fileUrl, fileName, userID) {
    const accessToken = await getAccessToken();
    if (!accessToken) return null;

    try {
        const fileResponse = await axios.get(fileUrl, {
            headers: {Authorization: 'Bearer ${accessToken'},
            responseType: "blob",
        });

        const fileBlob = fileResponse.data;

        const {data, error} = await supabase.storage
            .from("user_documents")
            .upload('${userId}/${fileName}', fileBlob, {
                contentType: fileBlob.type,
            });

        if (error) {
            console.error("Supabase upload error!!", error);
            return null;
        }

        const supabaseFileUrl = `https://xyz.supabase.co/storage/v1/object/user_documents/${userId}/${fileName}`;

        // store metadata in supa db
        const {error: dbError} = await supabase
        .from("Document-Storage")
        .insert([{user_id: userID, file_name: fileName, file_url: supabaseFileUrl }]);

        if (dbError) {
            console.error("Database insert error!!", dbError);
            return null;
        }

        return supabaseFileUrl;

    } catch (error) {
        console.error("Error uploading SharePoint file:", error);
        return null;
    }

    
}
