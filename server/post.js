const NodeRSA = require('node-rsa');
const express = require("express");
const bodyParser = require("body-parser");
// const { initializeDatabase, queryDB, insertDB } = require("my-database.db"); // Stellen Sie sicher, dass Sie den richtigen Pfad zur Datenbankdatei angeben.
const { initializeDatabase, queryDB } = require("./database");

app.get("/api/generate-keys", authenticate, (req, res) => {
  const key = new NodeRSA({b: 1024});
  const publicKey = key.exportKey('public');
  const privateKey = key.exportKey('private');
  res.json({ publicKey, privateKey });
});

// Nach erfolgreichem Login
fetch("/api/generate-keys", {
  headers: {
      "Authorization": "Bearer YOUR_SECRET_TOKEN"  // Ihr Authentifizierungs-Token
  }
}).then(response => response.json())
.then(data => {
    localStorage.setItem("publicKey", data.publicKey);
    localStorage.setItem("privateKey", data.privateKey);
});


const app = express();
app.use(bodyParser.json());

// Middleware zur Authentifizierung (fügen Sie dies hinzu, wenn Sie es noch nicht haben)
const authenticate = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token || token !== `Bearer ${YOUR_SECRET_TOKEN}`) {
    return res.status(401).json({ message: "Unauthorisiert" });
  }
  next();
};

// Endpunkt zum Erstellen eines neuen Beitrags
app.post("/api/posts", authenticate, async (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) {
    return res.status(400).json({ message: "Ungültige Daten" });
  }

  const db = initializeDatabase();
  try {
    await insertDB(db, "INSERT INTO posts (title, content, author) VALUES (?, ?, ?)", [title, content, "Benutzername"]); // Stellen Sie sicher, dass Sie den Benutzernamen entsprechend setzen.
    res.status(201).json({ message: "Beitrag erfolgreich erstellt" });
  } catch (error) {
    console.error("Fehler beim Erstellen des Beitrags", error);
    res.status(500).json({ message: "Serverfehler" });
  } finally {
    db.close();
  }
});

// Starten Sie den Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
});
