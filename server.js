// const express = require("express");
const cors = require("cors"); //cross origins
const Database = require("better-sqlite3");
// const app = express();
const port = 3000;

const express = require("express");

const app = express();
app.use(cors());

app.use(express.json());

const db = new Database("./edu-nexa.db");


const path = require("path");
const { name } = require("ejs");

// Set view engine to EJS
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Static files
app.use(express.static(path.join(__dirname, "public")));

// Java script function that creates tables 
function createTables() {
  const createTables =
  `create table IF NOT EXISTS CreateAccount (account_id INT AUTO_INCREMENT PRIMARY KEY, 
  full_names  VARCHAR(100) NOT NULL, 
  email VARCHAR(100) UNIQUE, 
  id_number VARCHAR(13) UNIQUE, 
  phoneNumber VARCHAR(10) UNIQUE NOT NULL, 
  username VARCHAR(100) NOT NULL, 
  password VARCHAR(255) NOT NULL,
  identity_document BLOB NULL,
  matric_results BLOB NULL,
  tertiary_qualification BLOB NULL,
  academic_transcripts BLOB NULL,
  motivational_letter BLOB NULL,
  supporting_documents BLOB NULL)`;

  const db_statement = db.prepare(createTables);
  db_statement.run();

  console.log("tables created");
  console.log(db_statement.run());
}
console.log(createTables());

// const info = db.prepare("PRAGMA table_info(CreateAccount);").all();

// Display it
// console.log(info);

// Route 
app.get("/", (req, res) => {
  res.render("index"); // will look for views/index.ejs
});

// Route to the user-welocome 
app.get("/user-welcome", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "user-welcome.html"));
});

// Route to the Create Profile 
app.get("/create-profile", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "create-profile.html"));
});

app.post("/update-profile", (req, res) => {
  console.log(req.body['matric_results']);
});

// Route to the Attach profile image
app.get("/attach-image", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "attach-image.html"));
});

// Code Edits Starts 

const multer = require('multer');
const fs = require('fs');

// ✅ Use absolute path
const uploadPath = path.join(__dirname, 'uploads', 'profile-images');

// ✅ Create folder automatically if missing
fs.mkdirSync(uploadPath, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadPath),
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

app.post('/upload-profile-image', upload.single('profileImage'), (req, res) => {
  if (!req.file) {
    console.error('❌ No file uploaded.');
    return res.status(400).json({ message: 'No file uploaded.' });
  }

  console.log('✅ File saved successfully at:', req.file.path);
  res.json({ message: '✅ File uploaded successfully!' });
});



// Code Edits Ends

app.post("/register", (req, res) => {
  const names = req.body['name'];
  const email = req.body['email'];
  const id_number = req.body['id_number'];
  const phoneNumber = req.body['phoneNumber'];
  const username = req.body['username'];
  const password = req.body['password'];

  const insert = "insert into CreateAccount(full_names , email, id_number, phoneNumber , username , password)values(?, ?, ?, ?, ?, ?)";
  const db_statement = db.prepare(insert);
  const runner = db_statement.run(names, email, id_number, phoneNumber, username, password);
  res.send(runner);
});

// New Code 
app.post("/get-personal-info", (req, res) => { // End points are always written in lower cases
  const username = req.body["username"];

  const select = "select full_names , email, id_number, phoneNumber , username from CreateAccount where username= ?";

  const db_statement = db.prepare(select);

  users = db_statement.all(username);

  if(users.length == 1){
    res.send(users);
  }
  else{
    res.send({"error": "User Not Found"});
  }

});

app.post("/login", (req, res) => {
  const username = req.body["username"];
  const password = req.body["password"];

  const select = "select full_names,username, password from CreateAccount where username= ? and password = ?";

  const db_statement = db.prepare(select);

  users = db_statement.all(username, password);

  // res.send(users.username);

  if(users.length == 1){
    res.send({"username": username});
  }
  else{
    res.send({"error": "User Not Found"});
  }

});

// Database Creation and Continuation 

app.get("/create-tables", (req, res) => {
 
});

// Start server, is always at the bottom 
app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});