import { useState, useEffect } from "react";
import { signUp, signIn, signOut, getUser } from "./auth";
import FileList from "./FileList.jsx";
import FileUpload from "./FileUpload.jsx";
import SharePointUpload from "./SharePointUpload.jsx"; // ✅ Import SharePoint Upload Component

function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState(null);

  useEffect(() => {
    (async () => {
      const currentUser = await getUser();
      setUser(currentUser);
    })();
  }, []);

  const handleSignUp = async () => {
    try {
      await signUp(email, password);
      alert("Sign up successful! Please check your email for verification.");
    } catch (error) {
      alert(error.message);
    }
  };

  const handleSignIn = async () => {
    try {
      await signIn(email, password);
      const currentUser = await getUser();
      setUser(currentUser);
    } catch (error) {
      alert(error.message);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setUser(null);
  };

  return (
    <div style={{ textAlign: "center", padding: "2rem" }}>
      <h1 style={{ fontSize: "30px" }}>Supabase Authentication & File Storage</h1>
      {user ? (
        <>
          <p>Welcome, {user.email}</p>
          <button onClick={handleSignOut}>Sign Out</button>

          <h2>Upload a File</h2>
          <FileUpload userId={user.id} />  

          <h2>Import from SharePoint</h2>
          <SharePointUpload userId={user.id} />  

          <h2>Your Uploaded Files</h2>
          <FileList userId={user.id} />    
        </>
      ) : (
        <div>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button onClick={handleSignUp}>Sign Up</button>
          <button onClick={handleSignIn}>Sign In</button>
        </div>
      )}
    </div>
  );
}

export default App;
