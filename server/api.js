const { body, validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const { initializeDatabase, queryDB } = require("./database");
const jwt = require("jsonwebtoken");
const aesEncryption = require('aes-encryption');
const NodeRSA = require('node-rsa');

const secret = process.env.AES_SECRET;
const jwtSecret = process.env.JWT_SECRET || "supersecret";

let db;

const initializeAPI = async (app) => {
  db = initializeDatabase();

  app.post(
    "/api/login",
    body("username")
      .notEmpty()
      .withMessage("Username is required.")
      .isEmail()
      .withMessage("Invalid email format."),
    body("password")
      .isLength({ min: 10, max: 64 })
      .withMessage("Password must be between 10 to 64 characters.")
      .escape(),
    login
  );

  app.get("/api/posts", getPosts);

  app.post(
    "/api/create-post",
    body("title")
      .notEmpty()
      .withMessage("Title is required.")
      .isString()
      .withMessage("Title must be a string."),
    body("content")
      .notEmpty()
      .withMessage("Content is required.")
      .isString()
      .withMessage("Content must be a string."),
    createPost
  );

  app.get("/api/generate-keys", (req, res) => {
    const key = new NodeRSA({b: 1024});
    const publicKey = key.exportKey('public');
    const privateKey = key.exportKey('private');
    
    res.json({
        publicKey,
        privateKey
    });
  });
};

const login = async (req, res) => {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    return res.status(400).json({ errors: result.array() });
  }

  const { username, password } = req.body;
  const getUserQuery = `SELECT * FROM users WHERE username = ?;`;
  const user = await queryDB(db, getUserQuery, [username]);
  
  if (user.length === 0) {
    return res.status(401).json({ error: "Username does not exist. Or Password is incorrect." });
  }

  const hash = user[0].password;
  const match = await bcrypt.compare(password, hash);
  if (!match) {
    return res.status(401).json({ error: "Username does not exist. Or Password is incorrect." });
  }

  const token = jwt.sign(
    {
      exp: Math.floor(Date.now() / 1000) + 60 * 60,
      data: { id: user[0].id, username, roles: [user[0].role] },
    },
    jwtSecret
  );

  return res.send(token);
};

const getPosts = async (req, res) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).json({ error: "No authorization header." });
  }

  const [prefix, token] = authorization.split(" ");
  if (prefix !== "Bearer") {
    return res.status(401).json({ error: "Invalid authorization prefix." });
  }

  // Add token verification here...
  
  const getPostsQuery = "SELECT * FROM posts";
  const posts = await queryDB(db, getPostsQuery);

  const decryptedPosts = posts.map(post => ({
    ...post,
    content: aesEncryption.decrypt(post.content, secret)
  }));

  res.send(decryptedPosts);
};

const createPost = async (req, res) => {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    return res.status(400).json({ errors: result.array() });
  }

  const authorization = req.headers.authorization;
  const [prefix, token] = authorization.split(" ");
  if (prefix !== "Bearer") {
    return res.status(401).json({ error: "Invalid authorization prefix." });
  }
  
  let tokenData;
  try {
    tokenData = jwt.verify(token, jwtSecret);
  } catch (err) {
    return res.status(401).json({ error: "Invalid token." });
  }
  
  const userId = tokenData.data.id;

  const { title, content } = req.body;
  const encryptedContent = aesEncryption.encrypt(content, secret);
  const insertPostQuery = `INSERT INTO posts (userId, title, content) VALUES (?, ?, ?);`;
  await queryDB(db, insertPostQuery, [userId, title, encryptedContent]);

  res.status(201).json({ message: "Post created successfully!" });
};

module.exports = { initializeAPI };
