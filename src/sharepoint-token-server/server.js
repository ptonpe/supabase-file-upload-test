import express from "express";
import cors from "cors";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

app.post("/get-token", async (req, res) => {
  try {
    const params = new URLSearchParams();
    params.append("client_id", process.env.CLIENT_ID);
    params.append("client_secret", process.env.CLIENT_SECRET);
    params.append("scope", "https://graph.microsoft.com/.default");
    params.append("grant_type", "client_credentials");

    const response = await axios.post(
      `https://login.microsoftonline.com/${process.env.TENANT_ID}/oauth2/v2.0/token`,
      params
    );

    return res.json({ access_token: response.data.access_token });
  } catch (error) {
    console.error("🔴 Token error:", error.response?.data || error.message);
    return res.status(500).json({ error: "Failed to fetch token" });
  }
});

app.listen(5174, () => {
  console.log("✅ Token server running at http://localhost:5174");
});
