const express = require("express");
const multer = require("multer");
const path = require("path");
const jwt = require("jsonwebtoken");
const jwksClient = require("jwks-rsa");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 8080;

// Azure AD Configuration
const AZURE_TENANT_ID = process.env.AZURE_TENANT_ID;
const AZURE_CLIENT_ID = process.env.AZURE_CLIENT_ID;

// JWKS client for token verification
const client = jwksClient({
  jwksUri: `https://login.microsoftonline.com/${AZURE_TENANT_ID}/discovery/v2.0/keys`
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, function (err, key) {
    if (err) {
      callback(err);
    } else {
      const signingKey = key.publicKey || key.rsaPublicKey;
      callback(null, signingKey);
    }
  });
}

// Middleware to validate Azure AD token
function validateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.substring(7);

  jwt.verify(token, getKey, {
    audience: AZURE_CLIENT_ID,
    issuer: `https://login.microsoftonline.com/${AZURE_TENANT_ID}/v2.0`,
    algorithms: ["RS256"]
  }, (err, decoded) => {
    if (err) {
      console.error("Token validation error:", err.message);
      return res.status(401).json({ error: "Invalid token", details: err.message });
    }
    
    req.user = decoded;
    next();
  });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Only image files are allowed!"));
  },
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname)); // Serve static files including upload.html
app.use("/uploads", express.static("uploads")); // Serve uploaded files

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "upload.html"));
});

// POST endpoint to handle file and data uploads (protected by authentication)
app.post("/upload", validateToken, upload.array("photos", 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    const { name, email, description } = req.body;

    // Validate required fields
    if (!name || !email) {
      return res.status(400).json({ error: "Name and email are required" });
    }

    // Get uploaded file information
    const uploadedFiles = req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      path: file.path,
      size: file.size,
      url: `${req.protocol}://${req.get("host")}/uploads/${file.filename}`
    }));

    // Return success response with uploaded data
    res.status(200).json({
      message: "Upload successful!",
      data: {
        name,
        email,
        description: description || "",
        files: uploadedFiles,
        uploadedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: error.message || "Upload failed" });
  }
});

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
