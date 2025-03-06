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
    const { data, error } = await supabase.storage
  .from("user_documents")
  .upload(fileName, file, {
    contentType: file.type,
    metadata: { owner: userId }, // ensure file ownership
  });

    if (error) {
      setMessage("Upload failed: " + error.message);
      console.error("❌ Storage Error:", error);
      setUploading(false);
      return;
    }

    console.log("✅ Storage Upload Success:", data);
  
    const fileUrl = `https://khbocjmbjheenikbnvob.supabase.co/storage/v1/object/sign/user_documents/${fileName}`;

    console.log("User ID before inserting into DB:", userId);

  
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
