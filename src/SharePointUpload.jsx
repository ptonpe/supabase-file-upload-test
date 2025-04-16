import { useState } from "react";
import { getSPfiles, uploadFiletoSupa } from "./utils/sharepointUtils";
import "./SharePointUpload.css"; // ✅ import custom styles

const SharePointUpload = ({ userId }) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [expandedFolders, setExpandedFolders] = useState({});

  const handleFetchFiles = async () => {
    setLoading(true);
    const sharepointFiles = await getSPfiles();
    setFiles(sharepointFiles);
    setLoading(false);
  };

  const toggleFolder = async (folderId, folderName) => {
    const isExpanded = expandedFolders[folderId];

    if (isExpanded) {
      setExpandedFolders((prev) => {
        const copy = { ...prev };
        delete copy[folderId];
        return copy;
      });
    } else {
      const subFiles = await getSPfiles(`Offer walk through/${folderName}`);
      setExpandedFolders((prev) => ({ ...prev, [folderId]: subFiles }));
    }
  };

  const handleUpload = async (file) => {
    setMessage(`Uploading ${file.name}...`);
    const fileUrl = file["@microsoft.graph.downloadUrl"];
    const uploadedFileUrl = await uploadFiletoSupa(fileUrl, file.name, userId);
    setMessage(
      uploadedFileUrl
        ? `✅ Uploaded: ${file.name}`
        : `❌ Failed to upload ${file.name}`
    );
  };

  return (
    <div className="upload-container">
      <button
        onClick={handleFetchFiles}
        disabled={loading}
        className="fetch-btn"
      >
        {loading ? "Fetching..." : "Fetch Files"}
      </button>

      {message && <p className="message">{message}</p>}

      {files.length > 0 && (
        <div className="file-panel">
          <h2 className="file-panel-title">SharePoint Files</h2>
          <ul className="file-list">
            {files.map((file) => (
              <li key={file.id} className="file-item">
                {file.folder ? (
                  <>
                    <button
                      className="folder-toggle"
                      onClick={() => toggleFolder(file.id, file.name)}
                    >
                      {expandedFolders[file.id] ? "📂" : "📁"} {file.name}
                    </button>
                    {expandedFolders[file.id] && (
                      <ul className="sub-file-list">
                        {expandedFolders[file.id].map((sub) => (
                          <li key={sub.id} className="file-sub-item">
                            <span>📄 {sub.name}</span>
                            {!sub.folder && (
                              <button
                                onClick={() => handleUpload(sub)}
                                className="upload-btn"
                              >
                                Upload to Supabase
                              </button>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                ) : (
                  <div className="file-row">
                    <span>📄 {file.name}</span>
                    <button
                      onClick={() => handleUpload(file)}
                      className="upload-btn"
                    >
                      Upload to Supabase
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SharePointUpload;
