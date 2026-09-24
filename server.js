require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json({ limit: "5mb" }));

// ========== ПОДКЛЮЧЕНИЕ К MONGODB ==========
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB подключена"))
  .catch(err => console.error("❌ MongoDB error:", err));

// ========== СХЕМЫ ==========
const UserSchema = new mongoose.Schema({
  login: { type: String, unique: true, required: true },
  passwordHash: { type: String, required: true },
  displayName: { type: String, default: "" },
  bio: { type: String, default: "" },
  avatar: { type: String, default: "😎" },
  points: { type: Number, default: 0 },
  isAdmin: { type: Boolean, default: false },
  activeBadge: { type: String, default: null },
  ownedBadges: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now }
});

const PostSchema = new mongoose.Schema({
  author: { type: String, required: true },
  text: { type: String, required: true },
  tags: { type: [String], default: [] },
  image: { type: String, default: null },
  likes: { type: [String], default: [] },
  date: { type: Date, default: Date.now }
});

const CommentSchema = new mongoose.Schema({
  postId: { type: String, required: true },
  author: { type: String, required: true },
  text: { type: String, required: true },
  date: { type: Date, default: Date.now }
});

const ReviewSchema = new mongoose.Schema({
  author: { type: String, required: true },
  rating: { type: Number, required: true },
  text: { type: String, required: true },
  date: { type: Date, default: Date.now }
});

const ProjectSchema = new mongoose.Schema({
  author: { type: String, default: "Akimi" },
  title: String,
  subtitle: String,
  icon: { type: String, default: "🚀" },
  fullDesc: String,
  tags: { type: [String], default: [] },
  link: { type: String, default: null },
  status: { type: String, default: "wip" },
  difficulty: { type: String, default: "" },
  isBase: { type: Boolean, default: false },
  date: { type: Date, default: Date.now }
});

const User = mongoose.model("User", UserSchema);
const Post = mongoose.model("Post", PostSchema);
const Comment = mongoose.model("Comment", CommentSchema);
const Review = mongoose.model("Review", ReviewSchema);
const Project = mongoose.model("Project", ProjectSchema);

// ========== ЧАТЫ ==========
const ChatSchema = new mongoose.Schema({
  users: { type: [String], required: true },
  createdAt: { type: Date, default: Date.now },
  lastMessage: { type: Date, default: Date.now }
});

const MessageSchema = new mongoose.Schema({
  chatId: { type: String, required: true },
  from: { type: String, required: true },
  type: { type: String, default: "text" },
  text: { type: String, default: "" },
  image: { type: String, default: null },
  emoji: { type: String, default: null },
  amount: { type: Number, default: 0 },
  commission: { type: Number, default: 0 },
  date: { type: Date, default: Date.now }
});

const EmojiSchema = new mongoose.Schema({
  author: { type: String, required: true },
  name: { type: String, required: true },
  image: { type: String, required: true },
  price: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

const Chat = mongoose.model("Chat", ChatSchema);
const Message = mongoose.model("Message", MessageSchema);
const Emoji = mongoose.model("Emoji", EmojiSchema);

// ===== КОМИССИЯ ЗА ПЕРЕВОДЫ =====
const TRANSFER_COMMISSION = 0.05; // 5% — идёт админу

// ========== MIDDLEWARE ==========
function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: "Нет токена" });
  const token = header.split(" ")[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch (e) {
    return res.status(401).json({ error: "Неверный токен" });
  }
}

function adminOnly(req, res, next) {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ error: "Только для админа" });
  }
  next();
}

function publicUser(u) {
  return {
    login: u.login,
    displayName: u.displayName,
    bio: u.bio,
    avatar: u.avatar,
    points: u.points,
    isAdmin: u.isAdmin,
    activeBadge: u.activeBadge,
    ownedBadges: u.ownedBadges,
    createdAt: u.createdAt
  };
}

// ========== РЕГИСТРАЦИЯ ==========
app.post("/api/register", async (req, res) => {
  try {
    const { login, password } = req.body;

    if (!login || login.length < 3) return res.status(400).json({ error: "Логин минимум 3 символа" });
    if (!password || password.length < 4) return res.status(400).json({ error: "Пароль минимум 4 символа" });
    if (!/^[a-zA-Z0-9_]+$/.test(login)) return res.status(400).json({ error: "Только латиница, цифры, _" });
    if (login === process.env.ADMIN_LOGIN) return res.status(400).json({ error: "Логин зарезервирован" });

    const existing = await User.findOne({ login });
    if (existing) return res.status(400).json({ error: "Логин занят" });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      login,
      passwordHash,
      displayName: login,
      avatar: "😎"
    });

    const token = jwt.sign({ login: user.login, isAdmin: false }, process.env.JWT_SECRET, { expiresIn: "30d" });
    res.json({ ok: true, token, user: publicUser(user) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// ========== ВХОД ==========
app.post("/api/login", async (req, res) => {
  try {
    const { login, password } = req.body;

    if (login === process.env.ADMIN_LOGIN && password === process.env.ADMIN_PASSWORD) {
      let admin = await User.findOne({ login: process.env.ADMIN_LOGIN });
      if (!admin) {
        const passwordHash = await bcrypt.hash(password, 10);
        admin = await User.create({
          login: process.env.ADMIN_LOGIN,
          passwordHash,
          displayName: process.env.ADMIN_LOGIN,
          bio: "Создатель сайта",
          avatar: "👑",
          points: 9999,
          isAdmin: true
        });
      }
      const token = jwt.sign({ login: admin.login, isAdmin: true }, process.env.JWT_SECRET, { expiresIn: "30d" });
      return res.json({ ok: true, token, user: publicUser(admin) });
    }

    const user = await User.findOne({ login });
    if (!user) return res.status(400).json({ error: "Пользователь не найден" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(400).json({ error: "Неверный пароль" });

    const token = jwt.sign({ login: user.login, isAdmin: user.isAdmin }, process.env.JWT_SECRET, { expiresIn: "30d" });
    res.json({ ok: true, token, user: publicUser(user) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// ========== ТЕКУЩИЙ ЮЗЕР ==========
app.get("/api/me", auth, async (req, res) => {
  const user = await User.findOne({ login: req.user.login });
  if (!user) return res.status(404).json({ error: "Не найден" });
  res.json(publicUser(user));
});

app.put("/api/me", auth, async (req, res) => {
  const { displayName, bio, avatar } = req.body;
  const user = await User.findOne({ login: req.user.login });
  if (!user) return res.status(404).json({ error: "Не найден" });

  if (displayName !== undefined) {
    if (displayName.length < 2 || displayName.length > 20) return res.status(400).json({ error: "Имя 2-20 символов" });
    user.displayName = displayName;
  }
  if (bio !== undefined) {
    if (bio.length > 100) return res.status(400).json({ error: "Bio до 100 символов" });
    user.bio = bio;
  }
  if (avatar !== undefined) user.avatar = avatar;

  await user.save();
  res.json(publicUser(user));
});

app.put("/api/me/password", auth, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = await User.findOne({ login: req.user.login });
  if (!user) return res.status(404).json({ error: "Не найден" });

  const ok = await bcrypt.compare(oldPassword, user.passwordHash);
  if (!ok) return res.status(400).json({ error: "Неверный старый пароль" });
  if (newPassword.length < 4) return res.status(400).json({ error: "Пароль минимум 4 символа" });

  user.passwordHash = await bcrypt.hash(newPassword, 10);
  await user.save();
  res.json({ ok: true });
});

// ========== ЮЗЕРЫ ==========
app.get("/api/users/:login", async (req, res) => {
  const user = await User.findOne({ login: req.params.login });
  if (!user) return res.status(404).json({ error: "Не найден" });
  res.json(publicUser(user));
});

app.post("/api/users/batch", async (req, res) => {
  const { logins } = req.body;
  if (!Array.isArray(logins)) return res.json({});
  const users = await User.find({ login: { $in: logins } });
  const map = {};
  users.forEach(u => map[u.login] = publicUser(u));
  res.json(map);
});

// ========== ПОСТЫ ==========
app.get("/api/posts", async (req, res) => {
  const posts = await Post.find().sort({ date: -1 });
  res.json(posts);
});

app.post("/api/posts", auth, adminOnly, async (req, res) => {
  const { text, tags, date } = req.body;
  if (!text || text.length < 5) return res.status(400).json({ error: "Текст минимум 5 символов" });

  const postDate = date ? new Date(date) : new Date();

  const post = await Post.create({
    author: req.user.login,
    text,
    tags: tags || [],
    date: postDate
  });
  res.json(post);
});
app.put("/api/posts/:id", auth, adminOnly, async (req, res) => {
  const { text, tags, date } = req.body;
  const update = { text, tags: tags || [] };
  if (date) update.date = new Date(date);

  const post = await Post.findByIdAndUpdate(
    req.params.id,
    update,
    { new: true }
  );
  if (!post) return res.status(404).json({ error: "Не найден" });
  res.json(post);
});
app.delete("/api/posts/:id", auth, adminOnly, async (req, res) => {
  await Post.findByIdAndDelete(req.params.id);
  await Comment.deleteMany({ postId: req.params.id });
  res.json({ ok: true });
});

// ========== ЛАЙКИ ==========
app.post("/api/posts/:id/like", auth, async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ error: "Не найден" });

  const login = req.user.login;
  const idx = post.likes.indexOf(login);

  if (idx === -1) {
    post.likes.push(login);
    await User.updateOne({ login }, { $inc: { points: 1 } });
  } else {
    post.likes.splice(idx, 1);
  }

  await post.save();
  res.json({ likes: post.likes });
});

// ========== КОММЕНТЫ ==========
app.get("/api/posts/:id/comments", async (req, res) => {
  const comments = await Comment.find({ postId: req.params.id }).sort({ date: 1 });
  res.json(comments);
});

app.post("/api/posts/:id/comments", auth, async (req, res) => {
  const { text } = req.body;
  if (!text || text.length < 1) return res.status(400).json({ error: "Пустой коммент" });

  const comment = await Comment.create({
    postId: req.params.id,
    author: req.user.login,
    text
  });

  await User.updateOne({ login: req.user.login }, { $inc: { points: 3 } });
  res.json(comment);
});

// ========== ОТЗЫВЫ ==========
app.get("/api/reviews", async (req, res) => {
  const reviews = await Review.find().sort({ date: -1 });
  res.json(reviews);
});

app.post("/api/reviews", auth, async (req, res) => {
  const { rating, text } = req.body;
  if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error: "Оценка 1-5" });
  if (!text || text.length < 5) return res.status(400).json({ error: "Текст минимум 5 символов" });

  const review = await Review.create({
    author: req.user.login,
    rating,
    text
  });

  await User.updateOne({ login: req.user.login }, { $inc: { points: 5 } });
  res.json(review);
});

// ========== ПРОЕКТЫ ==========
app.get("/api/projects", async (req, res) => {
  const projects = await Project.find().sort({ date: -1 });
  res.json(projects);
});

app.post("/api/projects", auth, adminOnly, async (req, res) => {
  const project = await Project.create({ ...req.body, author: req.user.login });
  res.json(project);
});

app.put("/api/projects/:id", auth, adminOnly, async (req, res) => {
  const project = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!project) return res.status(404).json({ error: "Не найден" });
  res.json(project);
});

app.delete("/api/projects/:id", auth, adminOnly, async (req, res) => {
  await Project.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

// ========== ЧАТЫ API ==========

// Создать или найти чат
app.post("/api/chats", auth, async (req, res) => {
  const { withUser } = req.body;
  if (!withUser) return res.status(400).json({ error: "Нужен withUser" });
  if (withUser === req.user.login) return res.status(400).json({ error: "Сам с собой нельзя" });

  const target = await User.findOne({ login: withUser });
  if (!target) return res.status(404).json({ error: "Юзер не найден" });

  const users = [req.user.login, withUser].sort();
  let chat = await Chat.findOne({ users: { $all: users, $size: 2 } });
  if (!chat) chat = await Chat.create({ users });
  res.json(chat);
});

// Мои чаты
app.get("/api/chats", auth, async (req, res) => {
  const chats = await Chat.find({ users: req.user.login }).sort({ lastMessage: -1 });
  res.json(chats);
});

// Сообщения чата
app.get("/api/chats/:id/messages", auth, async (req, res) => {
  const chat = await Chat.findById(req.params.id);
  if (!chat || !chat.users.includes(req.user.login)) {
    return res.status(403).json({ error: "Нет доступа" });
  }
  const messages = await Message.find({ chatId: req.params.id }).sort({ date: 1 }).limit(200);
  res.json(messages);
});

// Отправить сообщение
app.post("/api/chats/:id/messages", auth, async (req, res) => {
  const chat = await Chat.findById(req.params.id);
  if (!chat || !chat.users.includes(req.user.login)) {
    return res.status(403).json({ error: "Нет доступа" });
  }

  const { type, text, image, emoji } = req.body;

  if (type === "image" && !image) return res.status(400).json({ error: "Нет картинки" });
  if (type === "emoji" && !emoji) return res.status(400).json({ error: "Нет эмодзи" });
  if ((!type || type === "text") && (!text || !text.trim())) {
    return res.status(400).json({ error: "Пусто" });
  }

  const msg = await Message.create({
    chatId: req.params.id,
    from: req.user.login,
    type: type || "text",
    text: text || "",
    image: image || null,
    emoji: emoji || null
  });

  chat.lastMessage = new Date();
  await chat.save();

  res.json(msg);
});

// Перевод очков
app.post("/api/chats/:id/transfer", auth, async (req, res) => {
  const chat = await Chat.findById(req.params.id);
  if (!chat || !chat.users.includes(req.user.login)) {
    return res.status(403).json({ error: "Нет доступа" });
  }

  const toUser = chat.users.find(u => u !== req.user.login);
  const amt = Number(req.body.amount);

  if (!amt || amt < 1) return res.status(400).json({ error: "Минимум 1 очко" });

  const from = await User.findOne({ login: req.user.login });
  if (from.points < amt) return res.status(400).json({ error: "Мало очков" });

  const commission = Math.floor(amt * TRANSFER_COMMISSION);
  const toReceive = amt - commission;

  from.points -= amt;
  await from.save();

  const to = await User.findOne({ login: toUser });
  to.points += toReceive;
  await to.save();

  // Комиссия админу
  const admin = await User.findOne({ login: process.env.ADMIN_LOGIN });
  if (admin) {
    admin.points += commission;
    await admin.save();
  }

  const msg = await Message.create({
    chatId: req.params.id,
    from: req.user.login,
    type: "transfer",
    text: `Перевёл ${amt} очков. Комиссия: ${commission}`,
    amount: amt,
    commission
  });

  chat.lastMessage = new Date();
  await chat.save();

  res.json({ ok: true, message: msg, commission, toReceive });
});

// ===== КАСТОМНЫЕ ЭМОДЗИ =====
app.get("/api/emojis", async (req, res) => {
  const emojis = await Emoji.find().sort({ createdAt: -1 }).limit(100);
  res.json(emojis);
});

app.post("/api/emojis", auth, async (req, res) => {
  const { name, image, price } = req.body;
  if (!name || name.length < 1 || name.length > 20) return res.status(400).json({ error: "Имя 1-20 символов" });
  if (!image) return res.status(400).json({ error: "Нет картинки" });

  const count = await Emoji.countDocuments({ author: req.user.login });
  if (count >= 10) return res.status(400).json({ error: "Максимум 10 эмодзи" });

  const emoji = await Emoji.create({
    author: req.user.login,
    name,
    image,
    price: Number(price) || 0
  });
  res.json(emoji);
});

// ========== МАГАЗИН ==========
const SHOP_PRICES = {
  badge_star: 30, badge_fire: 60, badge_heart: 80, badge_rocket: 120,
  badge_crown: 300, badge_skull: 500, badge_diamond: 800, badge_alien: 1000
};
const SHOP_VALUES = {
  badge_star: "⭐", badge_fire: "🔥", badge_heart: "💖", badge_rocket: "🚀",
  badge_crown: "👑", badge_skull: "💀", badge_diamond: "💎", badge_alien: "👽"
};

app.post("/api/shop/buy", auth, async (req, res) => {
  const { itemId } = req.body;
  const price = SHOP_PRICES[itemId];
  if (!price) return res.status(400).json({ error: "Товар не найден" });

  const user = await User.findOne({ login: req.user.login });
  if (user.ownedBadges.includes(itemId)) return res.status(400).json({ error: "Уже куплено" });
  if (user.points < price) return res.status(400).json({ error: "Мало очков" });

  user.points -= price;
  user.ownedBadges.push(itemId);
  await user.save();
  res.json(publicUser(user));
});

app.post("/api/shop/apply", auth, async (req, res) => {
  const { itemId } = req.body;
  const user = await User.findOne({ login: req.user.login });

  if (itemId === null) {
    user.activeBadge = null;
  } else {
    if (!user.ownedBadges.includes(itemId)) return res.status(400).json({ error: "Не куплено" });
    const value = SHOP_VALUES[itemId];
    user.activeBadge = user.activeBadge === value ? null : value;
  }

  await user.save();
  res.json(publicUser(user));
});

// ========== ЗАПУСК ==========
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен: http://localhost:${PORT}`);
});