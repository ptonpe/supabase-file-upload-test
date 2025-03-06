import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

const FileList = ({userId}) => {
    const[files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFiles = async () => {
            const user = await supabase.auth.getUser();
            if (!user?.data?.user) return;

            const { data, error } = await supabase
            .from("Document-Storage")
            .select("*")
            .eq("user_id", userId);

            if (error) {
                console.error("Error fetching files:", error);
            } else {
                setFiles(data);
            }
            setLoading(false);
        }
        fetchFiles();
    }, []);

    return (
        <div>
          <h2>Your Uploaded Documents</h2>
          {loading ? <p>Loading...</p> : null}
          <ul>
            {files.map((file) => (
              <li key={file.id}>
                <a href={file.file_url} target="_blank" rel="noopener noreferrer">
                  {file.file_name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      );
};

export default FileList;