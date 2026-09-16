require("dotenv").config();
const mongoose = require("mongoose");

const PostSchema = new mongoose.Schema({
  author: { type: String, required: true },
  text: { type: String, required: true },
  text_en: { type: String, default: "" },
  tags: { type: [String], default: [] },
  tags_en: { type: [String], default: [] },
  image: { type: String, default: null },
  likes: { type: [String], default: [] },
  date: { type: Date, default: Date.now }
});

const ProjectSchema = new mongoose.Schema({
  author: { type: String, default: "Akimi" },
  id: { type: String, unique: true },
  title: String,
  title_en: String,
  subtitle: String,
  subtitle_en: String,
  icon: String,
  fullDesc: String,
  fullDesc_en: String,
  tags: { type: [String], default: [] },
  link: { type: String, default: null },
  status: { type: String, default: "wip" },
  difficulty: { type: String, default: "" },
  isBase: { type: Boolean, default: false },
  date: { type: Date, default: Date.now }
});

const Post = mongoose.model("Post", PostSchema);
const Project = mongoose.model("Project", ProjectSchema);

const POSTS = [
  {
    author: "Akimi",
    text: "И вот, я закончил свой первый проект и перехожу на собственный сайт. Здесь буду писать актуальные новости и прочее интересное.",
    text_en: "And so, I finished my first project and I'm moving to my own site. Here I'll post current news and other interesting stuff.",
    tags: ["Старт", "Сайт", "Проект"],
    tags_en: ["Start", "Site", "Project"],
    date: new Date("2026-09-06T12:00:00")
  },
  {
    author: "Akimi",
    text: "Сегодня доделал мониторинг.\n\nТеперь умеет:\n• Скриншоты\n• Камеру\n• Wi-Fi пароли\n• Управление ПК\n\nРаботает через Telegram-бота.",
    text_en: "Finished the monitoring today.\n\nNow it can:\n• Screenshots\n• Camera\n• Wi-Fi passwords\n• PC control\n\nWorks via Telegram bot.",
    tags: ["Python", "ХАБ", "Telegram"],
    tags_en: ["Python", "HUB", "Telegram"],
    date: new Date("2026-09-13T10:30:00")
  },
  {
    author: "Akimi",
    text: "Запустил свой сайт в интернете!\n\nТеперь можно скачать ХАБ прямо с сайта.",
    text_en: "Launched my site on the internet!\n\nNow you can download HUB right from the site.",
    tags: ["Сайт", "Netlify", "ХАБ"],
    tags_en: ["Site", "Netlify", "HUB"],
    date: new Date("2026-09-12T18:00:00")
  },
  {
    author: "Akimi",
    text: "Начал изучать веб-разработку.\n\nСделал сайт-блог, где буду писать о своих проектах.",
    text_en: "Started learning web development.\n\nMade a blog site where I'll write about my projects.",
    tags: ["HTML", "CSS", "JS"],
    tags_en: ["HTML", "CSS", "JS"],
    date: new Date("2026-09-11T14:20:00")
  },
  {
    author: "Akimi",
    text: "ХАБ v10.0 готов.\n\n11 игр:\n🐍 Змейка\n🎯 Понг\n🧱 Тетрис\n💣 Сапёр\n🔢 2048\n🚀 Арканоид\n🃏 Память\n🎵 Саймон\n⚡ Реакция\n🂡 Блэкджек\n🎰 Слоты",
    text_en: "HUB v10.0 is ready.\n\n11 games:\n🐍 Snake\n🎯 Pong\n🧱 Tetris\n💣 Minesweeper\n🔢 2048\n🚀 Arkanoid\n🃏 Memory\n🎵 Simon\n⚡ Reaction\n🂡 Blackjack\n🎰 Slots",
    tags: ["ХАБ", "Игры", "Python"],
    tags_en: ["HUB", "Games", "Python"],
    date: new Date("2026-09-10T09:00:00")
  }
];

const PROJECTS = [
  {
    id: "hub",
    author: "Akimi",
    title: "ХАБ v10.0",
    title_en: "HUB v10.0",
    subtitle: "Портативная система управления",
    subtitle_en: "Portable control system",
    icon: "🦾",
    fullDesc: "Первый полноценный проект, вдохновлённый программой из Железного человека. Вдохновившись тем, как мой друг зарабатывает значительные деньги в этой сфере — решил попробовать себя. Проект занял около недели неактивного кодинга. В итоге создал интересное приложение с функциями связи ПК с другими гаджетами через Telegram. Проект был создан и закончен по большей части для обучения и внёс в это большой вклад.",
    fullDesc_en: "The first full-fledged project, inspired by the program from Iron Man. Inspired by how my friend earns significant money in this field — I decided to try myself. The project took about a week of inactive coding. As a result, I created an interesting application with features for connecting a PC to other gadgets via Telegram. The project was created and finished mostly for learning and made a big contribution to it.",
    tags: ["Python", "Telegram", "ХАБ", "v10.0"],
    link: "https://hub-project12.netlify.app",
    status: "done",
    difficulty: "hard",
    isBase: true,
    date: new Date("2026-09-10")
  },
  {
    id: "site",
    author: "Akimi",
    title: "Этот сайт",
    title_en: "This site",
    subtitle: "Личный блог-портфолио",
    subtitle_en: "Personal blog portfolio",
    icon: "🌐",
    fullDesc: "Когда я закончил первый проект, я понял что мне нужна площадка для публикации новостей и проектов. Так появился этот сайт. Здесь я пишу о том, что делаю, показываю проекты, собираю отзывы. Сайт полностью написан руками — HTML, CSS, JavaScript, без единого фреймворка. Внутри: система аккаунтов с рангами, комментарии, отзывы, магазин, темы оформления, перевод на английский.",
    fullDesc_en: "When I finished my first project, I realized I needed a platform for publishing news and projects. That's how this site appeared. Here I write about what I do, show projects, and collect reviews. The site is fully hand-written — HTML, CSS, JavaScript, without a single framework. Inside: an account system with ranks, comments, reviews, a shop, themes, and English translation.",
    tags: ["HTML", "CSS", "JavaScript", "Netlify"],
    link: null,
    status: "wip",
    difficulty: "easy",
    isBase: true,
    date: new Date("2026-09-13")
  }
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ MongoDB подключена");

  await Post.deleteMany({});
  await Project.deleteMany({});
  console.log("🗑️ Старые данные удалены");

  await Post.insertMany(POSTS);
  console.log(`✅ Загружено постов: ${POSTS.length}`);

  await Project.insertMany(PROJECTS);
  console.log(`✅ Загружено проектов: ${PROJECTS.length}`);

  await mongoose.disconnect();
  console.log("🔌 Отключено от базы");
}

seed().catch(err => {
  console.error("❌ Ошибка:", err);
  process.exit(1);
});