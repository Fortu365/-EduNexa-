// ===============================
// ✅ IMPORTS
// ===============================
const express = require("express");
const cors = require("cors");
const Database = require("better-sqlite3");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

// ===============================
// ✅ INITIAL SETUP
// ===============================
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// SQLite database
const db = new Database("./edu-nexa.db");

// ===============================
// ✅ VIEW ENGINE
// ===============================
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// ===============================
// ✅ STATIC FILES
// ===============================
app.use(express.static(path.join(__dirname, "public")));

// ===============================
// ✅ CREATE TABLES
// ===============================
function createTables() {
  const createAccountTableSQL = `
    CREATE TABLE IF NOT EXISTS CreateAccount (
      account_id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_names TEXT NOT NULL,
      email TEXT UNIQUE,
      id_number TEXT UNIQUE,
      phoneNumber TEXT UNIQUE NOT NULL,
      username TEXT NOT NULL,
      password TEXT NOT NULL,
      identity_document TEXT,
      matric_results TEXT,
      tertiary_qualification TEXT,
      academic_transcripts TEXT,
      motivational_letter TEXT,
      supporting_documents TEXT,
      address TEXT
    );
  `;

  const notesTableSQL = `
    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  db.prepare(createAccountTableSQL).run();
  db.prepare(notesTableSQL).run();

  console.log("✅ Tables created or verified successfully!");
}

// Run table creation
createTables();

// ===============================
// ✅ ROUTES (HTML / EJS FILES)
// ===============================
app.get("/", (req, res) => {
  res.render("index");
});

app.get("/user-welcome", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "user-welcome.html"));
});

app.get("/create-profile", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "create-profile.html"));
});

app.get("/attach-image", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "attach-image.html"));
});

// ===============================
// ✅ PROFILE IMAGE UPLOAD
// ===============================
const uploadPath = path.join(__dirname, "uploads", "profile-images");
fs.mkdirSync(uploadPath, { recursive: true });

const imageStorage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadPath),
  filename: (_, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});

const uploadImage = multer({ storage: imageStorage });

app.post("/upload-profile-image", uploadImage.single("profileImage"), (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded." });

  console.log("✅ File saved:", req.file.path);
  res.json({ message: "✅ File uploaded successfully!" });
});

// ===============================
// ✅ REGISTER USER
// ===============================
app.post("/register", (req, res) => {
  const { name, email, id_number, phoneNumber, username, password } = req.body;

  const insert = `
    INSERT INTO CreateAccount (full_names, email, id_number, phoneNumber, username, password)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  const result = db.prepare(insert).run(
    name,
    email,
    id_number,
    phoneNumber,
    username,
    password
  );

  res.send(result);
});

// ===============================
// ✅ GET PERSONAL INFO
// ===============================
app.post("/get-personal-info", (req, res) => {
  const username = req.body.username;

  const stmt = db.prepare(`
    SELECT full_names, email, id_number, phoneNumber, username
    FROM CreateAccount
    WHERE username = ?
  `);

  const users = stmt.all(username);

  if (users.length === 1) res.send(users);
  else res.send({ error: "User Not Found" });
});

// ===============================
// ✅ LOGIN
// ===============================
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  const stmt = db.prepare(`
    SELECT * FROM CreateAccount
    WHERE username = ? AND password = ?
  `);

  const users = stmt.all(username, password);

  if (users.length === 1) {
    console.log(users[0].full_names);
    console.log(users[0].address);

    res.send({
      username: username,
      full_names: users[0].full_names,
    });
  } else {
    res.send({ error: "User Not Found" });
  }
});

// ===============================
// ✅ PDF DOCUMENT UPLOADS
// ===============================
const uploadPDFPath = path.join(__dirname, "uploads", "profile-documents");
fs.mkdirSync(uploadPDFPath, { recursive: true });

const pdfStorage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadPDFPath),
  filename: (_, file, cb) =>
    cb(null, Date.now() + "-" + file.fieldname + path.extname(file.originalname)),
});

const pdfUpload = multer({ storage: pdfStorage }).fields([
  { name: "identity_document", maxCount: 1 },
  { name: "matric_results", maxCount: 1 },
  { name: "tertiary_qualification", maxCount: 1 },
  { name: "academic_transcripts", maxCount: 1 },
  { name: "motivational_letter", maxCount: 1 },
  { name: "supporting_documents", maxCount: 1 },
]);

// ✅ Update profile with PDFs
app.post("/api/profile/update", pdfUpload, (req, res) => {
  try {
    const body = req.body;
    const files = req.files;

    const {
      full_names,
      email,
      id_number,
      phoneNumber,
      username,
      password,
      address,
    } = body;

    if (!username) return res.status(400).json({ error: "Username is required." });

    const user = db
      .prepare("SELECT * FROM CreateAccount WHERE username = ?")
      .get(username);

    if (!user) return res.status(404).json({ error: "User not found." });

    const filePaths = {
      identity_document: files.identity_document?.[0].path || user.identity_document,
      matric_results: files.matric_results?.[0].path || user.matric_results,
      tertiary_qualification: files.tertiary_qualification?.[0].path || user.tertiary_qualification,
      academic_transcripts: files.academic_transcripts?.[0].path || user.academic_transcripts,
      motivational_letter: files.motivational_letter?.[0].path || user.motivational_letter,
      supporting_documents: files.supporting_documents?.[0].path || user.supporting_documents,
    };

    const updateSQL = `
      UPDATE CreateAccount
      SET full_names = ?, email = ?, id_number = ?, phoneNumber = ?, password = ?,
          identity_document = ?, matric_results = ?, tertiary_qualification = ?,
          academic_transcripts = ?, motivational_letter = ?, supporting_documents = ?, address = ?
      WHERE username = ?
    `;

    db.prepare(updateSQL).run(
      full_names || user.full_names,
      email || user.email,
      id_number || user.id_number,
      phoneNumber || user.phoneNumber,
      password || user.password,
      filePaths.identity_document,
      filePaths.matric_results,
      filePaths.tertiary_qualification,
      filePaths.academic_transcripts,
      filePaths.motivational_letter,
      filePaths.supporting_documents,
      address,
      username
    );

    res.json({ message: "✅ Profile updated successfully!" });
  } catch (err) {
    console.error("❌ Error saving profile:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

// ===============================
// ✅ DOCUMENT DOWNLOAD
// ===============================
app.get("/download/:username/:documentType", (req, res) => {
  const { username, documentType } = req.params;

  const validDocs = [
    "identity_document",
    "matric_results",
    "tertiary_qualification",
    "academic_transcripts",
    "motivational_letter",
    "supporting_documents",
  ];

  if (!validDocs.includes(documentType))
    return res.status(400).send("Invalid document type.");

  const stmt = db.prepare(`
    SELECT ${documentType}
    FROM CreateAccount
    WHERE username = ?
  `);

  const user = stmt.get(username);
  if (!user || !user[documentType]) return res.status(404).send("Document not found.");

  const filePath = path.isAbsolute(user[documentType])
    ? user[documentType]
    : path.join(__dirname, user[documentType]);

  res.download(filePath, path.basename(filePath));
});

// ===============================
// ✅ NOTES ROUTES
// ===============================
app.get("/notes/:username", (req, res) => {
  const stmt = db.prepare(`
    SELECT * FROM notes WHERE username = ?
    ORDER BY created_at DESC
  `);

  res.json(stmt.all(req.params.username));
});

app.post("/notes", (req, res) => {
  const { username, title, content } = req.body;

  if (!username || !title || !content)
    return res.status(400).send("Missing fields");

  const stmt = db.prepare(`
    INSERT INTO notes (username, title, content)
    VALUES (?, ?, ?)
  `);

  const info = stmt.run(username, title, content);

  res.json({ id: info.lastInsertRowid, username, title, content });
});

app.delete("/notes/:id", (req, res) => {
  db.prepare("DELETE FROM notes WHERE id = ?").run(req.params.id);
  res.sendStatus(204);
});

// ===============================
// ✅ START SERVER
// ===============================
app.listen(port, () => {
  console.log(`✅ Server running on http://localhost:${port}`);
});
