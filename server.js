// const express = require('express')
// const path = require('path')
// const app = express()

// app.set('view engine', 'ejs')
// app.set('views', path.join(__dirname, 'views'))

// // Static files
// app.use(express.static(path.join(__dirname, "public")));

// // Route
// app.get("/", (req, res) => {
//   res.render("index"); // will look for views/index.ejs
// });

// // Start server 
// const port = 3000;
// app.listen(port, () => {
//   console.log(`Server running on http://localhost:${port}`);
// });


const express = require("express");
const path = require("path");

const app = express();

// Set view engine to EJS
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Static files
app.use(express.static(path.join(__dirname, "public")));

// Route
app.get("/", (req, res) => {
  res.render("index"); // will look for views/index.ejs
});

// Start server
app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});

