import { useState } from "react";
import { supabase } from "./supabaseClient";

const FileUpload = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage("Please select a file.");
      return;
    }
  
    setUploading(true);
    const user = await supabase.auth.getUser();
    
    if (!user?.data?.user) {
      setMessage("You must be logged in to upload files.");
      setUploading(false);
      return;
    }
  
    const userId = user.data.user.id;
    console.log("User ID before inserting into DB:", userId); 
    console.log("✅ File Info:", file); 

  
    const fileName = `${userId}/${Date.now()}_${file.name}`;

  //ERROR HAPPENING HERE

  // Upload to Supabase Storage
  const { data: uploadData, error: uploadError } = await supabase.storage
  .from("user_documents")
  .upload(fileName, file, {
    contentType: file.type,
    metadata: { owner: userId },
    upsert: true
  });

  if (uploadError) {
  setMessage("Upload failed: " + uploadError.message);
  console.error("❌ Storage Error:", uploadError);
  setUploading(false);
  return;
}

const { data: list, error: listError } = await supabase
  .storage
  .from("user_documents")
  .list(userId); // List that folder

console.log("📁 Files in user's folder:", list);

console.log("✅ Upload success, now generating signed URL...");

  // Create signed URL after successful upload
  const { data: signedUrlData, error: signedUrlError } = await supabase
  .storage
  .from("user_documents")
  .createSignedUrl(fileName, 60 * 60); // 1 hour expiry

  if (signedUrlError) {
  setMessage("Failed to generate signed URL: " + signedUrlError.message);
  console.error("❌ Signed URL Error:", signedUrlError);
  setUploading(false);
  return;
  }

  const fileUrl = signedUrlData.signedUrl;
  console.log("User ID before inserting into DB:", userId);
  console.log("File URL: ", fileUrl);

  
    // insert metadata into Supabase Database
    const { data: dbData, error: dbError } = await supabase
    .from("Document-Storage") 
    .insert([
      { user_id: userId, file_name: file.name, file_url: fileUrl, file_category: "general"},
    ])
    .select(); // fetch inserted row for verification
  
  if (dbError) {
    console.error("❌ Database Error:", dbError);
    setMessage("Database update failed: " + dbError.message);
  } else {
    console.log("✅ Database Insert Success:", dbData);
    setMessage("File uploaded successfully!");
  }
  
    setUploading(false);
  };
  

  return (
    <div style={{ padding: "1rem", textAlign: "center" }}>
      <h2>Upload a Document</h2>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload} disabled={uploading}>
        {uploading ? "Uploading..." : "Upload"}
      </button>
      <p>{message}</p>
    </div>
  );
};

export default FileUpload;
