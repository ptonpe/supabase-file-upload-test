import { useState } from "react";
import { getSPfiles, uploadFiletoSupa } from "./utils/sharepointUtils";

const SharePointUpload = ({userId}) => {
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    const SITE_ID = null;
    const DRIVE_ID = null;

    // fetch files from SP
    const handleFetchFiles = async () => {
        setLoading(true);
        const sharepointFiles = await getSharePointFiles(SITE_ID, DRIVE_ID);
        setFiles(sharepointFiles);
        setLoading(false);
      };
    
    // upload selected file to supa
    const handleUpload = async (file) => {
        setMessage(`Uploading ${file.name}...`);
    
        const fileUrl = file["@microsoft.graph.downloadUrl"]; // gets SharePoint file URL
        const uploadedFileUrl = await uploadFileToSupabase(fileUrl, file.name, userId);
    
        if (uploadedFileUrl) {
          setMessage(`✅ Uploaded: ${file.name}`);
        } else {
          setMessage(`❌ Failed to upload ${file.name}`);
        }
    };

    return (
        <div>
          <button onClick={handleFetchFiles} disabled={loading}>
            {loading ? "Fetching..." : "Fetch Files"}
          </button>
    
          {files.length > 0 && (
            <ul>
              {files.map((file) => (
                <li key={file.id}>
                  {file.name}{" "}
                  <button onClick={() => handleUpload(file)}>Upload to Supabase</button>
                </li>
              ))}
            </ul>
          )}
          <p>{message}</p>
        </div>
      );
};

export default SharePointUpload;