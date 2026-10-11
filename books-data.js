// Список книг для домашней библиотеки.
// Чтобы добавить книгу — скопируйте один объект и измените поля.
// Поле "cover" — ссылка на обложку в интернете (например с covers.openlibrary.org).
// Если ссылки нет или поле пустое, будет показана цветная заглушка с буквой.
// Поле "genre" — список жанров, можно указать несколько: genre: ["Классика", "Поэзия"].
// Использовать только жанры из списка GENRES ниже. Если жанр неизвестен — genre: [].
// Новый жанр добавляется в GENRES осознанно, а не «на лету» в карточке книги.

const GENRES = [
  // Художественная литература
  "Классика",
  "Современная проза",
  "Фантастика",
  "Фэнтези",
  "Любовный роман",
  "Исторический роман",
  "Детектив и триллер",
  "Приключения",
  "Юмор",
  "Поэзия",
  "Сказки и притчи",

  // Нон-фикшн
  "Биография и мемуары",
  "История",
  "Публицистика",
  "Финансы и бизнес",
  "Саморазвитие и психология",
  "Научпоп",
  "Техническая, учебная и справочная литература",
  "Кулинария",
  "Здоровье и спорт",
  "Путешествия",
  "Искусство и мода",

  // Для детей (аудитория, сочетается с любым жанром выше)
  "Детская литература"
];

const BOOKS = [
  // ==== Добавлено с фото полки (взрослая литература) ====
  {
    id: 7,
    title: "»Sag mir, daß Du mich liebst«",
    author: "Werner Fuld, Thomas F. Schneider (Hrsg.)",
    genre: ["Биография и мемуары"],
    cover: "https://covers.openlibrary.org/b/id/3204205-L.jpg",
    color: "#2d3436",
    description: "Немецкоязычное издание, сборник/составление под редакцией Вернера Фульда и Томаса Ф. Шнайдера."
  },
  {
    id: 8,
    title: "Moon Road",
    author: "Sarah Leipciger",
    genre: ["Современная проза"],
    cover: "https://is1-ssl.mzstatic.com/image/thumb/Publication221/v4/ac/0d/03/ac0d031a-62b2-e7ad-f1da-1f579e7cdac5/1048031957.jpg/600x600bb.jpg",
    color: "#636e72",
    description: "Английское издание. Роман-путешествие: давно расставшиеся супруги едут вместе на пикапе через всю страну, и по дороге раскрывается история их семьи и пропавшей дочери."
  },
  {
    id: 9,
    title: "Вкус",
    author: "Стэнли Туччи",
    genre: ["Биография и мемуары", "Кулинария"],
    cover: "https://covers.openlibrary.org/b/id/11320064-L.jpg",
    color: "#e84393",
    description: "Мемуары актёра Стэнли Туччи о еде, семье и кино."
  },
  {
    id: 10,
    title: "Маленькие женщины",
    author: "Луиза Мэй Олкотт",
    genre: ["Классика"],
    cover: "https://covers.openlibrary.org/b/id/8775559-L.jpg",
    color: "#fab1a0",
    description: "Классический роман о взрослении четырёх сестёр Марч в Америке XIX века."
  },
  {
    id: 11,
    title: "A Woman Is No Man",
    author: "Etaf Rum",
    genre: ["Современная проза"],
    cover: "https://covers.openlibrary.org/b/id/8797803-L.jpg",
    color: "#d63031",
    description: "Английское издание. Роман о трёх поколениях палестино-американских женщин и борьбе за собственный голос."
  },
  {
    id: 12,
    title: "Самый богатый человек в Вавилоне",
    author: "Джордж Сэмюэл Клейсон",
    genre: ["Финансы и бизнес", "Сказки и притчи"],
    cover: "https://covers.openlibrary.org/b/id/10491331-L.jpg",
    color: "#e17055",
    description: "Классическая книга о финансовой грамотности в форме притч о древнем Вавилоне."
  },
  {
    id: 13,
    title: "American Wife",
    author: "Curtis Sittenfeld",
    genre: ["Современная проза"],
    cover: "https://covers.openlibrary.org/b/id/5934583-L.jpg",
    color: "#dfe6e9",
    description: "Английское издание. Роман, вдохновлённый жизнью первой леди США."
  },
  {
    id: 14,
    title: "Ада, или Радости страсти",
    author: "Владимир Набоков",
    genre: ["Классика"],
    cover: "https://covers.openlibrary.org/b/id/1047242-L.jpg",
    color: "#2d3436",
    description: "Поздний роман Набокова о запретной любви в вымышленном мире."
  },
  {
    id: 15,
    title: "Медленной шлюпкой в Китай",
    author: "Харуки Мураками",
    genre: ["Современная проза"],
    cover: "https://img1.labirint.ru/books/698306/cover.jpg",
    color: "#00cec9",
    description: "Сборник ранних рассказов Харуки Мураками."
  },
  {
    id: 16,
    title: "The Bridges of Madison County",
    author: "Robert James Waller",
    genre: ["Любовный роман"],
    cover: "https://covers.openlibrary.org/b/id/490280-L.jpg",
    color: "#fdcb6e",
    description: "Английское издание. Короткий роман о четырёхдневном романе фотографа и замужней женщины в Айове."
  },
  {
    id: 17,
    title: "Валсарб",
    author: "Хелена Побяржина",
    genre: ["Современная проза"],
    cover: "https://is1-ssl.mzstatic.com/image/thumb/Publication211/v4/15/d2/88/15d28894-d5f4-1902-2615-767c4f3ed1c7/9785001399889.jpg/600x600bb.jpg",
    color: "#a29bfe",
    description: "Роман белорусской писательницы о детстве, памяти и месте, где выросла героиня."
  },
  {
    id: 18,
    title: "Евгений Онегин (Поэмы)",
    author: "Александр Пушкин",
    genre: ["Классика", "Поэзия"],
    cover: "https://covers.openlibrary.org/b/id/8231991-L.jpg",
    color: "#636e72",
    description: "Классика русской литературы — роман в стихах."
  },
  {
    id: 19,
    title: "История России с иллюстрациями",
    author: "В. В. Зверев",
    genre: ["История"],
    cover: "https://is1-ssl.mzstatic.com/image/thumb/Publication118/v4/50/0a/28/500a2892-7d49-cb2f-7c22-0a202e1fb6d2/9785392272365.jpg/600x600bb.jpg",
    color: "#2d3436",
    description: "Иллюстрированное издание по истории России."
  },
  {
    id: 20,
    title: "The Fair Botanists",
    author: "Sara Sheridan",
    genre: ["Исторический роман"],
    cover: "https://covers.openlibrary.org/b/id/12407157-L.jpg",
    color: "#00b894",
    description: "Английское издание. Исторический роман о ботаническом саде Эдинбурга начала XIX века."
  },
  {
    id: 21,
    title: "Lolita",
    author: "Vladimir Nabokov",
    genre: ["Классика"],
    cover: "https://covers.openlibrary.org/b/id/12984540-L.jpg",
    color: "#fd79a8",
    description: "Английское издание романа Владимира Набокова."
  },
  {
    id: 22,
    title: "Shocking Life",
    author: "Elsa Schiaparelli",
    genre: ["Биография и мемуары", "Искусство и мода"],
    cover: "https://covers.openlibrary.org/b/id/2044070-L.jpg",
    color: "#e17055",
    description: "Английское издание мемуаров модельера Эльзы Скиапарелли."
  },
  {
    id: 23,
    title: "Метель",
    author: "Владимир Сорокин",
    genre: ["Современная проза", "Фантастика"],
    cover: "https://covers.openlibrary.org/b/id/10305046-L.jpg",
    color: "#dfe6e9",
    description: "Повесть Владимира Сорокина о докторе, пытающемся добраться до заражённой деревни сквозь метель."
  },
  {
    id: 24,
    title: "[китайское издание, уточнить название]",
    author: "Лю Цысинь",
    genre: ["Фантастика"],
    cover: "",
    color: "#0984e3",
    description: "Издание на китайском языке, автор Лю Цысинь. Точное название на корешке не разобрано — стоит уточнить."
  },
  {
    id: 25,
    title: "Тёмный лес",
    author: "Лю Цысинь",
    genre: ["Фантастика"],
    cover: "https://covers.openlibrary.org/b/id/10526598-L.jpg",
    color: "#0984e3",
    description: "Вторая книга трилогии «Задача трёх тел»."
  },
  {
    id: 26,
    title: "А",
    author: "Виктор Пелевин",
    genre: ["Современная проза"],
    cover: "",
    color: "#00cec9",
    description: "Роман Виктора Пелевина."
  },
  {
    id: 27,
    title: "Chanel: The Legend and the Life",
    author: "Justine Picardie",
    genre: ["Биография и мемуары", "Искусство и мода"],
    cover: "https://covers.openlibrary.org/b/id/6299761-L.jpg",
    color: "#2d3436",
    description: "Английское издание. Биография Коко Шанель."
  },

  // ==== Добавлено с фото полки (детская литература) ====
  {
    id: 28,
    title: "Гэгс Тагебух [уточнить номер] — Держи хвост пистолетом",
    author: "Джефф Кинни",
    genre: ["Детская литература", "Юмор"],
    cover: "",
    color: "#fdcb6e",
    description: "Часть серии «Дневник слабака» на немецком языке."
  },
  {
    id: 29,
    title: "Гэгс Тагебух №13 — Eiskalt erwischt",
    author: "Джефф Кинни",
    genre: ["Детская литература", "Юмор"],
    cover: "https://m.media-amazon.com/images/P/3833936592.01._SCLZZZZZZZ_.jpg",
    color: "#e17055",
    description: "Часть серии «Дневник слабака» на немецком языке."
  },
  {
    id: 30,
    title: "Гэгс Тагебух №20 — Bock auf Party?",
    author: "Джефф Кинни",
    genre: ["Детская литература", "Юмор"],
    cover: "https://m.media-amazon.com/images/P/3833910615.01._SCLZZZZZZZ_.jpg",
    color: "#fab1a0",
    description: "Часть серии «Дневник слабака» на немецком языке."
  },
  {
    id: 31,
    title: "Гэгс Тагебух №17 — Voll aufgedreht!",
    author: "Джефф Кинни",
    genre: ["Детская литература", "Юмор"],
    cover: "https://m.media-amazon.com/images/P/3833907509.01._SCLZZZZZZZ_.jpg",
    color: "#00b894",
    description: "Часть серии «Дневник слабака» на немецком языке."
  },
  {
    id: 32,
    title: "Гэгс Тагебух №18 — Kein Plan von nix",
    author: "Джефф Кинни",
    genre: ["Детская литература", "Юмор"],
    cover: "https://m.media-amazon.com/images/P/3833907908.01._SCLZZZZZZZ_.jpg",
    color: "#636e72",
    description: "Часть серии «Дневник слабака» на немецком языке."
  },
  {
    id: 33,
    title: "Гэгс Тагебух №16 — Volltreffer!",
    author: "Джефф Кинни",
    genre: ["Детская литература", "Юмор"],
    cover: "https://m.media-amazon.com/images/P/3833906804.01._SCLZZZZZZZ_.jpg",
    color: "#0984e3",
    description: "Часть серии «Дневник слабака» на немецком языке."
  },
  {
    id: 34,
    title: "Percy Jackson: Der Fluch des Titanen",
    author: "Rick Riordan",
    genre: ["Детская литература", "Фэнтези"],
    cover: "https://covers.openlibrary.org/b/id/14601475-L.jpg",
    color: "#00cec9",
    description: "Немецкое издание. Часть серии «Перси Джексон и олимпийцы»."
  },
  {
    id: 35,
    title: "The 78-Storey Treehouse",
    author: "Andy Griffiths, Terry Denton",
    genre: ["Детская литература", "Юмор", "Приключения"],
    cover: "https://covers.openlibrary.org/b/id/9367879-L.jpg",
    color: "#74b9ff",
    description: "Английское издание. Часть серии «Дом на дереве»."
  },
  {
    id: 36,
    title: "Заколдованный лес",
    author: "автор не указан на корешке",
    genre: ["Детская литература"],
    cover: "https://s1.livelib.ru/boocover/1003353972/200x305/b4a0/boocover.jpg",
    color: "#00b894",
    description: "Детская книга на русском языке. Автора стоит уточнить."
  },
  {
    id: 37,
    title: "Гарри Поттер и узник Азкабана",
    author: "Дж. К. Роулинг",
    genre: ["Детская литература", "Фэнтези"],
    cover: "https://covers.openlibrary.org/b/id/10580435-L.jpg",
    color: "#fdcb6e",
    description: "Третья книга серии о Гарри Поттере, издание на русском языке."
  },
  {
    id: 38,
    title: "Der Schatz der Piraten",
    author: "серия «Minuten-Geschichten zum Lesenlernen»",
    genre: ["Детская литература", "Приключения"],
    cover: "",
    color: "#0984e3",
    description: "Немецкая книга для начинающих читателей о пиратском сокровище."
  },
  {
    id: 39,
    title: "Das magische Baumhaus",
    author: "серия LESEKÖNIG",
    genre: ["Детская литература", "Фэнтези", "Приключения"],
    cover: "",
    color: "#74b9ff",
    description: "Немецкое издание книги для чтения из серии «Волшебный дом на дереве»."
  },
  {
    id: 40,
    title: "Das Beste für Jungs",
    author: "Loewe Verlag",
    genre: ["Детская литература"],
    cover: "https://m.media-amazon.com/images/P/3743205424.01._SCLZZZZZZZ_.jpg",
    color: "#0984e3",
    description: "Немецкое издание: сборник коротких историй для начинающих читателей (серия «7-Minuten-Geschichten zum Lesenlernen», Loewe)."
  },
  {
    id: 41,
    title: "Das Geheimnis vom Dachboden",
    author: "Katharina Kühl",
    genre: ["Детская литература"],
    cover: "https://m.media-amazon.com/images/P/3785576153.01._SCLZZZZZZZ_.jpg",
    color: "#2d3436",
    description: "Немецкая детская книга для самостоятельного чтения (издательство Loewe)."
  },
  {
    id: 42,
    title: "Die Mitternachts-Bande",
    author: "David Walliams",
    genre: ["Детская литература", "Юмор"],
    cover: "https://m.media-amazon.com/images/P/3499218216.01._SCLZZZZZZZ_.jpg",
    color: "#2d3436",
    description: "Немецкое издание книги Дэвида Уолльямса о полуночной банде в детской больнице."
  },
  {
    id: 43,
    title: "Die Allerschlimmsten Kinder der Welt",
    author: "David Walliams",
    genre: ["Детская литература", "Юмор"],
    cover: "https://m.media-amazon.com/images/P/349900061X.01._SCLZZZZZZZ_.jpg",
    color: "#fdcb6e",
    description: "Немецкое издание сборника рассказов Дэвида Уолльямса."
  },
  {
    id: 44,
    title: "Die Schlimmsten Kinder der Welt",
    author: "David Walliams",
    genre: ["Детская литература", "Юмор"],
    cover: "https://m.media-amazon.com/images/P/3757100352.01._SCLZZZZZZZ_.jpg",
    color: "#d63031",
    description: "Немецкое издание сборника рассказов Дэвида Уолльямса."
  },
  {
    id: 45,
    title: "Das verrückte Baumhaus mit 13 Stockwerken",
    author: "Andy Griffiths",
    genre: ["Детская литература", "Юмор", "Приключения"],
    cover: "https://m.media-amazon.com/images/P/3843211051.01._SCLZZZZZZZ_.jpg",
    color: "#e17055",
    description: "Немецкое издание из серии «Сумасшедший дом на дереве»."
  },
  {
    id: 46,
    title: "Das verrückte Baumhaus mit 52 Stockwerken",
    author: "Andy Griffiths",
    genre: ["Детская литература", "Юмор", "Приключения"],
    cover: "https://m.media-amazon.com/images/P/3833907118.01._SCLZZZZZZZ_.jpg",
    color: "#6c5ce7",
    description: "Немецкое издание из серии «Сумасшедший дом на дереве»."
  },
  {
    id: 47,
    title: "Das verrückte Baumhaus mit 39 Stockwerken",
    author: "Andy Griffiths",
    genre: ["Детская литература", "Юмор", "Приключения"],
    cover: "https://m.media-amazon.com/images/P/3833904658.01._SCLZZZZZZZ_.jpg",
    color: "#fdcb6e",
    description: "Немецкое издание из серии «Сумасшедший дом на дереве»."
  },
  {
    id: 48,
    title: "Die Mubbles",
    author: "Liz Pichon",
    genre: ["Детская литература", "Юмор"],
    cover: "https://m.media-amazon.com/images/P/374592911X.01._SCLZZZZZZZ_.jpg",
    color: "#d63031",
    description: "Немецкое издание книги Лиз Пичон."
  },
  {
    id: 49,
    title: "Время всегда хорошее",
    author: "Андрей Жвалевский, Евгения Пастернак",
    genre: ["Детская литература", "Фантастика"],
    cover: "https://is1-ssl.mzstatic.com/image/thumb/Publication128/v4/a3/8b/e9/a38be99c-4a74-7549-cb6a-f2420c55e037/9700000267120.jpg/600x600bb.jpg",
    color: "#00b894",
    description: "Повесть о двух школьниках из разных эпох, которые меняются местами во времени."
  },

  // ==== Добавлено с фото полок (2-я партия): русская и мировая проза ====
  {
    id: 50,
    title: "Мастер и Маргарита. Театральный роман. Рассказы",
    author: "Михаил Булгаков",
    genre: ["Классика"],
    cover: "https://img1.labirint.ru/books/1009706/cover.jpg",
    color: "#6c5ce7",
    description: "Сборник Булгакова: «Мастер и Маргарита», «Театральный роман» и рассказы. Издание «Жалын», Алма-Ата, 1988."
  },
  {
    id: 51,
    title: "Бегство вперёд",
    author: "Аркадий и Борис Стругацкие",
    genre: ["Фантастика"],
    cover: "",
    color: "#0984e3",
    description: "Издание Аркадия и Бориса Стругацких в тёмно-бордовом переплёте."
  },
  {
    id: 52,
    title: "Шекспир [уточнить название/том]",
    author: "Уильям Шекспир",
    genre: ["Классика"],
    cover: "",
    color: "#00b894",
    description: "Книга Шекспира в красном тканевом переплёте. На корешке указан только автор — стоит уточнить, какая это книга."
  },
  {
    id: 53,
    title: "Цветы зла",
    author: "Шарль Бодлер",
    genre: ["Классика", "Поэзия"],
    cover: "https://img1.labirint.ru/books/859253/cover.jpg",
    color: "#e17055",
    description: "Знаменитый поэтический сборник Шарля Бодлера."
  },
  {
    id: 54,
    title: "Макбет",
    author: "Уильям Шекспир",
    genre: ["Классика"],
    cover: "https://img1.labirint.ru/books/623275/cover.jpg",
    color: "#fdcb6e",
    description: "Трагедия Шекспира, издание МИФ."
  },
  {
    id: 55,
    title: "Сон в летнюю ночь",
    author: "Уильям Шекспир",
    genre: ["Классика"],
    cover: "https://img1.labirint.ru/books/596509/cover.jpg",
    color: "#d63031",
    description: "Комедия Шекспира, издание МИФ."
  },
  {
    id: 56,
    title: "Герой нашего времени",
    author: "Михаил Лермонтов",
    genre: ["Классика"],
    cover: "https://img1.labirint.ru/books/868245/cover.jpg",
    color: "#2d3436",
    description: "Роман Лермонтова о Печорине, издание МИФ."
  },
  {
    id: 57,
    title: "Клуб самоубийц",
    author: "Роберт Льюис Стивенсон",
    genre: ["Классика", "Приключения"],
    cover: "https://img1.labirint.ru/books/697728/cover.jpg",
    color: "#636e72",
    description: "Цикл приключенческих историй Стивенсона, издание МИФ."
  },
  {
    id: 58,
    title: "Триумфальная арка",
    author: "Эрих Мария Ремарк",
    genre: ["Классика"],
    cover: "https://is1-ssl.mzstatic.com/image/thumb/Publication/v4/74/3e/9e/743e9e1e-0231-fa73-69fb-6352e07bb6f6/Screen_Shot_2013-04-26_at_5.39.32_PM.png/600x600bb.jpg",
    color: "#e84393",
    description: "Роман о враче-эмигранте в предвоенном Париже."
  },
  {
    id: 59,
    title: "На солнечной стороне улицы",
    author: "Дина Рубина",
    genre: ["Современная проза"],
    cover: "https://img1.labirint.ru/books/628797/cover.jpg",
    color: "#00cec9",
    description: "Роман Дины Рубиной о детстве и судьбе героини в послевоенном Ташкенте."
  },
  {
    id: 60,
    title: "Блуда и МУДО",
    author: "Алексей Иванов",
    genre: ["Современная проза"],
    cover: "https://img1.labirint.ru/books/686927/cover.jpg",
    color: "#a29bfe",
    description: "Роман Алексея Иванова о жизни в российской провинции."
  },
  {
    id: 61,
    title: "Географ глобус пропил",
    author: "Алексей Иванов",
    genre: ["Современная проза"],
    cover: "https://img1.labirint.ru/books/531770/cover.jpg",
    color: "#74b9ff",
    description: "Роман о школьном учителе географии и его классе, сплав по реке."
  },
  {
    id: 62,
    title: "Похороните меня за плинтусом",
    author: "Павел Санаев",
    genre: ["Современная проза"],
    cover: "https://img1.labirint.ru/books/794460/cover.jpg",
    color: "#fab1a0",
    description: "Автобиографическая повесть о мальчике Саше, который растёт с бабушкой и дедом."
  },
  {
    id: 63,
    title: "Сквозная линия",
    author: "Людмила Улицкая",
    genre: ["Современная проза"],
    cover: "https://is1-ssl.mzstatic.com/image/thumb/Publication221/v4/10/49/3a/10493a2a-0d23-d930-094f-579f11cbb82b/9785457207141.jpg/600x600bb.jpg",
    color: "#fd79a8",
    description: "Книга Людмилы Улицкой."
  },
  {
    id: 64,
    title: "Бедные, злые, любимые",
    author: "Людмила Улицкая",
    genre: ["Современная проза"],
    cover: "https://s1.livelib.ru/boocover/1000011710/200x305/551a/boocover.jpg",
    color: "#6c5ce7",
    description: "Сборник рассказов и повестей Людмилы Улицкой."
  },
  {
    id: 65,
    title: "mASIAfucker",
    author: "Илья Стогофф",
    genre: ["Современная проза"],
    cover: "",
    color: "#0984e3",
    description: "Роман Ильи Стогоффа о путешествии по Азии."
  },
  {
    id: 66,
    title: "Б. Вавилонская",
    author: "Михаил Веллер",
    genre: ["Современная проза"],
    cover: "https://is1-ssl.mzstatic.com/image/thumb/Publication211/v4/b3/b6/87/b3b68775-8738-8791-c21b-f8ddb932b5a7/9785425052957.jpg/600x600bb.jpg",
    color: "#00b894",
    description: "Роман Михаила Веллера."
  },
  {
    id: 67,
    title: "Гонец из Пизы",
    author: "Михаил Веллер",
    genre: ["Современная проза"],
    cover: "https://s1.livelib.ru/boocover/1001119327/200x305/3162/boocover.jpg",
    color: "#e17055",
    description: "Книга Михаила Веллера."
  },
  {
    id: 68,
    title: "Романы",
    author: "Михаил Веллер",
    genre: ["Современная проза"],
    cover: "",
    color: "#fdcb6e",
    description: "Сборник романов Михаила Веллера в одном томе."
  },
  {
    id: 69,
    title: "Мифогенная любовь каст",
    author: "Павел Пепперштейн, Сергей Ануфриев",
    genre: ["Современная проза"],
    cover: "https://is1-ssl.mzstatic.com/image/thumb/Publication211/v4/55/3c/4d/553c4d40-1ad1-9950-24b2-2f12a4a0dbf9/9785001396833.jpg/600x600bb.jpg",
    color: "#d63031",
    description: "Роман в двух томах (на полке оба тома)."
  },
  {
    id: 70,
    title: "[уточнить название, красно-белый корешок «ПЕППЕРШТЕЙН»]",
    author: "Павел Пепперштейн",
    genre: ["Современная проза"],
    cover: "",
    color: "#2d3436",
    description: "Название на корешке не разобрано — стоит уточнить и поправить."
  },
  {
    id: 71,
    title: "Голубое сало",
    author: "Владимир Сорокин",
    genre: ["Современная проза", "Фантастика"],
    cover: "https://i.livelib.ru/workpic/1000877593/200x305/1695/workpic.jpg",
    color: "#636e72",
    description: "Роман Владимира Сорокина."
  },
  {
    id: 72,
    title: "Media Sapiens: Повесть о третьем сроке",
    author: "Сергей Минаев",
    genre: ["Современная проза"],
    cover: "https://img1.labirint.ru/books/131258/cover.jpg",
    color: "#e84393",
    description: "Повесть Сергея Минаева."
  },
  {
    id: 73,
    title: "Мышь",
    author: "Иван Филиппов",
    genre: ["Современная проза", "Фантастика"],
    cover: "https://is1-ssl.mzstatic.com/image/thumb/Publication126/v4/df/fb/34/dffb3479-6e38-c4b6-b638-86eddb4e4c24/1042613248.jpg/600x600bb.jpg",
    color: "#00cec9",
    description: "Роман Ивана Филиппова (Freedom Letters, 2023) о зомби-апокалипсисе в Москве: из научного института сбегает инфицированная мышь."
  },
  {
    id: 74,
    title: "Шкафы и скелеты: 40 лучших рассказов 2008 года",
    author: "Сборник",
    genre: ["Современная проза"],
    cover: "",
    color: "#a29bfe",
    description: "Антология современных рассказов, издательство «ФРАМ»."
  },
  {
    id: 75,
    title: "Русские инородные сказки — 4",
    author: "Макс Фрай",
    genre: ["Фэнтези", "Сказки и притчи"],
    cover: "https://s1.livelib.ru/boocover/1000158306/200x305/b65c/boocover.jpg",
    color: "#74b9ff",
    description: "Четвёртый сборник «Русских инородных сказок» Макса Фрая."
  },
  {
    id: 76,
    title: "Ключ из жёлтого металла",
    author: "Макс Фрай",
    genre: ["Фэнтези"],
    cover: "https://img1.labirint.ru/books/467574/cover.jpg",
    color: "#fab1a0",
    description: "Роман Макса Фрая, издательство «Амфора»."
  },
  {
    id: 77,
    title: "Сумеречный Дозор",
    author: "Сергей Лукьяненко",
    genre: ["Фэнтези", "Фантастика"],
    cover: "https://img1.labirint.ru/books/714154/cover.jpg",
    color: "#fd79a8",
    description: "Книга цикла «Дозоры» о противостоянии Светлых и Тёмных Иных."
  },

  // ==== Пелевин ====
  {
    id: 78,
    title: "Чапаев и Пустота",
    author: "Виктор Пелевин",
    genre: ["Современная проза"],
    cover: "https://img1.labirint.ru/books/488542/cover.jpg",
    color: "#6c5ce7",
    description: "Роман Виктора Пелевина о поэте Петре Пустоте и Василии Чапаеве."
  },
  {
    id: 79,
    title: "Шлем ужаса",
    author: "Виктор Пелевин",
    genre: ["Современная проза", "Фантастика"],
    cover: "https://img1.labirint.ru/books/511348/cover.jpg",
    color: "#0984e3",
    description: "Роман Виктора Пелевина — миф о Минотавре в формате интернет-чата."
  },
  {
    id: 80,
    title: "Лампа Мафусаила, или Крайняя битва чекистов с масонами",
    author: "Виктор Пелевин",
    genre: ["Современная проза"],
    cover: "https://img1.labirint.ru/books/545496/cover.jpg",
    color: "#00b894",
    description: "Роман Виктора Пелевина."
  },
  {
    id: 81,
    title: "ДПП (NN)",
    author: "Виктор Пелевин",
    genre: ["Современная проза"],
    cover: "https://img1.labirint.ru/books/894237/cover.jpg",
    color: "#e17055",
    description: "Роман Виктора Пелевина «Диалектика Переходного Периода из Ниоткуда в Никуда»."
  },
  {
    id: 82,
    title: "Бэтман Аполло",
    author: "Виктор Пелевин",
    genre: ["Современная проза"],
    cover: "https://img1.labirint.ru/books/850840/cover.jpg",
    color: "#fdcb6e",
    description: "Роман Виктора Пелевина, продолжение «Ампира V»."
  },
  {
    id: 83,
    title: "S.N.U.F.F.",
    author: "Виктор Пелевин",
    genre: ["Современная проза", "Фантастика"],
    cover: "https://img1.labirint.ru/books/871057/cover.jpg",
    color: "#d63031",
    description: "Роман Виктора Пелевина."
  },
  {
    id: 84,
    title: "Смотритель. Книга 2: Железная бездна",
    author: "Виктор Пелевин",
    genre: ["Современная проза", "Фантастика"],
    cover: "https://img1.labirint.ru/books/495748/cover.jpg",
    color: "#2d3436",
    description: "Вторая книга романа «Смотритель»."
  },
  {
    id: 85,
    title: "Ананасная вода для прекрасной дамы",
    author: "Виктор Пелевин",
    genre: ["Современная проза"],
    cover: "https://img1.labirint.ru/books/515014/cover.jpg",
    color: "#636e72",
    description: "Роман Виктора Пелевина."
  },
  {
    id: 86,
    title: "Любовь к трём цукербринам",
    author: "Виктор Пелевин",
    genre: ["Современная проза", "Фантастика"],
    cover: "https://img1.labirint.ru/books/860762/cover.jpg",
    color: "#e84393",
    description: "Роман Виктора Пелевина."
  },
  {
    id: 87,
    title: "[уточнить название — возможно «Generation П»]",
    author: "Виктор Пелевин",
    genre: ["Современная проза"],
    cover: "",
    color: "#00cec9",
    description: "Белый корешок с логотипом-глазом в пирамиде и издательством «Эксмо». Название не разобрано — стоит уточнить."
  },
  {
    id: 88,
    title: "[уточнить название, тёмно-синий корешок, Эксмо]",
    author: "Виктор Пелевин",
    genre: ["Современная проза"],
    cover: "",
    color: "#a29bfe",
    description: "Название на корешке не разобрано — стоит уточнить и поправить."
  },

  // ==== Мураками ====
  {
    id: 89,
    title: "Мой любимый sputnik",
    author: "Харуки Мураками",
    genre: ["Современная проза"],
    cover: "https://img1.labirint.ru/books/640392/cover.jpg",
    color: "#74b9ff",
    description: "Роман Харуки Мураками."
  },
  {
    id: 90,
    title: "Охота на овец",
    author: "Харуки Мураками",
    genre: ["Современная проза"],
    cover: "https://img1.labirint.ru/books/935940/cover.jpg",
    color: "#fab1a0",
    description: "Роман Харуки Мураками, издательство «Амфора», 2003."
  },
  {
    id: 91,
    title: "Хроники Заводной Птицы",
    author: "Харуки Мураками",
    genre: ["Современная проза"],
    cover: "https://img1.labirint.ru/books/908561/cover.jpg",
    color: "#fd79a8",
    description: "Роман Харуки Мураками."
  },
  {
    id: 92,
    title: "Бесцветный Цкуру Тадзаки и годы его странствий",
    author: "Харуки Мураками",
    genre: ["Современная проза"],
    cover: "https://img1.labirint.ru/books/906543/cover.jpg",
    color: "#6c5ce7",
    description: "Роман Харуки Мураками."
  },
  {
    id: 93,
    title: "Призраки Лексингтона",
    author: "Харуки Мураками",
    genre: ["Современная проза"],
    cover: "https://s1.livelib.ru/boocover/1000653810/200x305/50ae/boocover.jpg",
    color: "#0984e3",
    description: "Сборник рассказов Харуки Мураками."
  },
  {
    id: 94,
    title: "Мужчины без женщин",
    author: "Харуки Мураками",
    genre: ["Современная проза"],
    cover: "https://img1.labirint.ru/books/934896/cover.jpg",
    color: "#00b894",
    description: "Сборник рассказов Харуки Мураками."
  },
  {
    id: 95,
    title: "1Q84 (книги 1–3)",
    author: "Харуки Мураками",
    genre: ["Современная проза"],
    cover: "https://s1.livelib.ru/boocover/1000641072/200x305/cb63/boocover.jpg",
    color: "#e17055",
    description: "Роман в трёх книгах (апрель–июнь, июль–сентябрь, октябрь–декабрь); на полке все три тома."
  },
  {
    id: 96,
    title: "Слушай песню ветра. Пинбол 1973",
    author: "Харуки Мураками",
    genre: ["Современная проза"],
    cover: "https://img1.labirint.ru/books/926358/cover.jpg",
    color: "#fdcb6e",
    description: "Две ранние повести Харуки Мураками в одной книге."
  },
  {
    id: 97,
    title: "Послемрак",
    author: "Харуки Мураками",
    genre: ["Современная проза"],
    cover: "https://is1-ssl.mzstatic.com/image/thumb/Publication123/v4/bd/0f/42/bd0f42ad-927c-bb79-1be6-33649178867b/MURAKAMICOVER9.png/600x600bb.jpg",
    color: "#d63031",
    description: "Роман Харуки Мураками."
  },
  {
    id: 98,
    title: "Подземка",
    author: "Харуки Мураками",
    genre: ["Публицистика"],
    cover: "https://img1.labirint.ru/books/583368/cover.jpg",
    color: "#2d3436",
    description: "Документальная книга Мураками о теракте в токийском метро в 1995 году."
  },

  // ==== Зарубежная проза и биографии ====
  {
    id: 99,
    title: "Storia della bambina perduta",
    author: "Elena Ferrante",
    genre: ["Современная проза"],
    cover: "https://covers.openlibrary.org/b/id/7376568-L.jpg",
    color: "#636e72",
    description: "Итальянское издание. Заключительная книга неаполитанского цикла."
  },
  {
    id: 100,
    title: "Randagi",
    author: "Marco Amerighi",
    genre: ["Современная проза"],
    cover: "https://covers.openlibrary.org/b/id/13233202-L.jpg",
    color: "#e84393",
    description: "Итальянское издание, издательство Bollati Boringhieri."
  },
  {
    id: 101,
    title: "Weihnachten in der wundervollen Buchhandlung",
    author: "Petra Hartlieb",
    genre: ["Современная проза"],
    cover: "https://is1-ssl.mzstatic.com/image/thumb/Publication128/v4/e6/e7/74/e6e77484-a13c-8234-e09a-83863be7f0bc/9783832184322.jpg/600x600bb.jpg",
    color: "#00cec9",
    description: "Немецкое издание, издательство DuMont."
  },
  {
    id: 102,
    title: "Jane Austen at Home",
    author: "Lucy Worsley",
    genre: ["Биография и мемуары"],
    cover: "https://covers.openlibrary.org/b/id/8046516-L.jpg",
    color: "#a29bfe",
    description: "Английское издание. Биография Джейн Остин."
  },
  {
    id: 103,
    title: "New York",
    author: "Edward Rutherfurd",
    genre: ["Исторический роман"],
    cover: "https://covers.openlibrary.org/b/id/10427361-L.jpg",
    color: "#74b9ff",
    description: "Английское издание. Исторический роман о Нью-Йорке."
  },
  {
    id: 104,
    title: "North Woods",
    author: "Daniel Mason",
    genre: ["Современная проза", "Исторический роман"],
    cover: "https://covers.openlibrary.org/b/id/14421778-L.jpg",
    color: "#fab1a0",
    description: "Английское издание. Роман об одном доме и его обитателях на протяжении веков."
  },
  {
    id: 105,
    title: "Before the Coffee Gets Cold",
    author: "Toshikazu Kawaguchi",
    genre: ["Современная проза"],
    cover: "https://is1-ssl.mzstatic.com/image/thumb/Publication126/v4/f5/e2/53/f5e25353-2f25-e3b3-fa4f-8136dc35d3a9/9781488077210.jpg/600x600bb.jpg",
    color: "#fd79a8",
    description: "Английское издание. Роман о кафе, где можно вернуться в прошлое."
  },
  {
    id: 106,
    title: "Таинственная история Билли Миллигана",
    author: "Дэниел Киз",
    genre: ["Биография и мемуары"],
    cover: "https://img1.labirint.ru/books/785081/cover.jpg",
    color: "#6c5ce7",
    description: "Документальная история Билли Миллигана — человека с множественной личностью."
  },

  // ==== Наука, психология, спорт и здоровье ====
  {
    id: 107,
    title: "Занимательная арифметика",
    author: "Яков Перельман",
    genre: ["Научпоп"],
    cover: "https://img1.labirint.ru/books/865475/cover.jpg",
    color: "#0984e3",
    description: "Научно-популярная книга Якова Перельмана, серия «Книги, о которых говорят»."
  },
  {
    id: 108,
    title: "Занимательная астрономия",
    author: "Яков Перельман",
    genre: ["Научпоп"],
    cover: "https://is1-ssl.mzstatic.com/image/thumb/Publication211/v4/ab/d1/c9/abd1c930-564e-8928-3929-04b745898de7/9785457165922.jpg/600x600bb.jpg",
    color: "#00b894",
    description: "Научно-популярная книга Якова Перельмана, серия «Книги, о которых говорят»."
  },
  {
    id: 109,
    title: "Сто лет недосказанности",
    author: "Алексей Семихатов",
    genre: ["Научпоп"],
    cover: "https://is1-ssl.mzstatic.com/image/thumb/Publication221/v4/28/37/0e/28370e85-1893-8ec0-795c-faa563133e61/9785002234356.jpg/600x600bb.jpg",
    color: "#e17055",
    description: "Научно-популярная книга Алексея Семихатова, издательство АНФ."
  },
  {
    id: 110,
    title: "Математика для гуманитариев. Живые лекции",
    author: "Алексей Савватеев",
    genre: ["Научпоп"],
    cover: "https://s1.livelib.ru/boocover/1008191389/200x305/5813/boocover.jpg",
    color: "#fdcb6e",
    description: "Лекции Алексея Савватеева по математике для нематематиков."
  },
  {
    id: 111,
    title: "Wissenschaftliche Theorien in 30 Sekunden",
    author: "Paul Parsons",
    genre: ["Научпоп"],
    cover: "https://m.media-amazon.com/images/P/9089983961.01._SCLZZZZZZZ_.jpg",
    color: "#d63031",
    description: "Немецкое издание, серия «in 30 Sekunden» (Libero)."
  },
  {
    id: 112,
    title: "Philosophie in 30 Sekunden",
    author: "Barry Loewer",
    genre: ["Научпоп"],
    cover: "https://m.media-amazon.com/images/P/908998397X.01._SCLZZZZZZZ_.jpg",
    color: "#2d3436",
    description: "Немецкое издание, серия «in 30 Sekunden» (Libero)."
  },
  {
    id: 113,
    title: "Das Universum in der Nussschale",
    author: "Stephen Hawking",
    genre: ["Научпоп"],
    cover: "https://m.media-amazon.com/images/P/3423340894.01._SCLZZZZZZZ_.jpg",
    color: "#636e72",
    description: "Немецкое издание книги Стивена Хокинга «Вселенная в ореховой скорлупке»."
  },
  {
    id: 114,
    title: "Wissenschaft & Technik: Fragen & Antworten",
    author: "Alexander Grimm u. a.",
    genre: ["Научпоп"],
    cover: "",
    color: "#e84393",
    description: "Немецкое издание: вопросы и ответы по науке и технике."
  },
  {
    id: 115,
    title: "Die 4-Stunden-Woche",
    author: "Timothy Ferriss",
    genre: ["Саморазвитие и психология", "Финансы и бизнес"],
    cover: "https://is1-ssl.mzstatic.com/image/thumb/Publication112/v4/12/ff/23/12ff235d-ab69-4b5a-c5b9-9e9a802f3fb3/9783843704458.jpg/600x600bb.jpg",
    color: "#00cec9",
    description: "Немецкое издание книги Тимоти Ферриса «Четырёхчасовая рабочая неделя»."
  },
  {
    id: 116,
    title: "Ironman",
    author: "Ole Petersen",
    genre: ["Здоровье и спорт"],
    cover: "https://covers.openlibrary.org/b/id/1014100-L.jpg",
    color: "#a29bfe",
    description: "Немецкое издание (rororo Sport). Книга об Ironman."
  },
  {
    id: 117,
    title: "Das große Buch vom Marathon",
    author: "Hubert Beck",
    genre: ["Здоровье и спорт"],
    cover: "https://covers.openlibrary.org/b/id/8903210-L.jpg",
    color: "#74b9ff",
    description: "Немецкое издание. Большая книга о марафоне."
  },
  {
    id: 118,
    title: "triathlon Special 2/2024",
    author: "Журнал triathlon",
    genre: ["Здоровье и спорт"],
    cover: "",
    color: "#fab1a0",
    description: "Немецкий журнал: от Парижа до Сан-Диего, истории о Гавайях, триатлон в Германии."
  },
  {
    id: 119,
    title: "How Not to Die",
    author: "Michael Greger, MD",
    genre: ["Здоровье и спорт"],
    cover: "https://is1-ssl.mzstatic.com/image/thumb/Publication114/v4/29/0a/01/290a01bf-6960-c907-ad01-701fc74902d5/9783946566298.jpg/600x600bb.jpg",
    color: "#fd79a8",
    description: "Английское издание. Книга о питании и здоровье."
  },

  // ==== Кулинария ====
  {
    id: 120,
    title: "Das How Not to Die Kochbuch",
    author: "Dr. Michael Greger",
    genre: ["Кулинария"],
    cover: "https://is1-ssl.mzstatic.com/image/thumb/Publication125/v4/39/60/49/396049ba-b170-6ec5-202c-22a168edac64/9783962570262.jpg/600x600bb.jpg",
    color: "#6c5ce7",
    description: "Немецкое издание. Кулинарная книга по принципам «How Not to Die»."
  },
  {
    id: 121,
    title: "Grüne Proteine: Die besten Eiweißlieferanten",
    author: "DK",
    genre: ["Кулинария"],
    cover: "https://m.media-amazon.com/images/P/3831029423.01._SCLZZZZZZZ_.jpg",
    color: "#0984e3",
    description: "Немецкое издание, издательство DK. Растительные источники белка."
  },
  {
    id: 122,
    title: "Smoothies und Powershakes",
    author: "NGV",
    genre: ["Кулинария"],
    cover: "https://m.media-amazon.com/images/P/3625172534.01._SCLZZZZZZZ_.jpg",
    color: "#00b894",
    description: "Немецкое издание, издательство NGV."
  },

  // ==== Искусство и путешествия ====
  {
    id: 123,
    title: "Die Galerie der Vögel",
    author: "Hiroshi Aramata",
    genre: ["Искусство и мода"],
    cover: "https://m.media-amazon.com/images/P/380942997X.01._SCLZZZZZZZ_.jpg",
    color: "#e17055",
    description: "Немецкое издание. Большой иллюстрированный альбом о птицах."
  },
  {
    id: 124,
    title: "Albrecht Dürer",
    author: "Norbert Wolf",
    genre: ["Искусство и мода"],
    cover: "https://covers.openlibrary.org/b/id/8845133-L.jpg",
    color: "#fdcb6e",
    description: "Немецкое издание, TASCHEN."
  },
  {
    id: 125,
    title: "Salvador Dalí",
    author: "Gilles Néret",
    genre: ["Искусство и мода"],
    cover: "https://covers.openlibrary.org/b/id/10533418-L.jpg",
    color: "#d63031",
    description: "Немецкое издание, TASCHEN."
  },
  {
    id: 126,
    title: "Marc Chagall",
    author: "Ingo F. Walther, Rainer Metzger",
    genre: ["Искусство и мода"],
    cover: "",
    color: "#2d3436",
    description: "Немецкое издание, TASCHEN."
  },
  {
    id: 127,
    title: "Caspar David Friedrich",
    author: "Norbert Wolf",
    genre: ["Искусство и мода"],
    cover: "https://covers.openlibrary.org/b/id/1029592-L.jpg",
    color: "#636e72",
    description: "Немецкое издание, TASCHEN."
  },
  {
    id: 128,
    title: "What Great Paintings Say",
    author: "Rose-Marie Hagen, Rainer Hagen",
    genre: ["Искусство и мода"],
    cover: "https://covers.openlibrary.org/b/id/1030588-L.jpg",
    color: "#e84393",
    description: "Английское издание, TASCHEN (Bibliotheca Universalis)."
  },
  {
    id: 129,
    title: "Die Geschichte der Kunst",
    author: "E. H. Gombrich",
    genre: ["Искусство и мода", "История"],
    cover: "https://covers.openlibrary.org/b/id/13797455-L.jpg",
    color: "#00cec9",
    description: "Немецкое издание «Истории искусства» Эрнста Гомбриха (Phaidon)."
  },
  {
    id: 130,
    title: "Энциклопедия мирового искусства: Мастера русской живописи",
    author: "Сборник",
    genre: ["Искусство и мода", "Техническая, учебная и справочная литература"],
    cover: "",
    color: "#a29bfe",
    description: "Энциклопедия издательства «Белый город»."
  },
  {
    id: 131,
    title: "Weltkunst Nr. 236: Jahresvorschau 2025",
    author: "Zeit Weltkunst Verlag",
    genre: ["Искусство и мода"],
    cover: "",
    color: "#74b9ff",
    description: "Журнал: Jahresvorschau 2025, Museen am Pazifik, три дня в Кёльне, Ирландия."
  },
  {
    id: 132,
    title: "Weltkunst Nr. 237: Großer Kunstmarktrückblick",
    author: "Zeit Weltkunst Verlag",
    genre: ["Искусство и мода"],
    cover: "",
    color: "#fab1a0",
    description: "Журнал: обзор арт-рынка, квир-живопись, три дня в Гонконге."
  },
  {
    id: 133,
    title: "Weltkunst Nr. 238: Japanische Farbholzschnitte",
    author: "Zeit Weltkunst Verlag",
    genre: ["Искусство и мода"],
    cover: "",
    color: "#fd79a8",
    description: "Журнал: японская цветная гравюра, Хелен Франкенталер, Кунстмузеум Штутгарт."
  },
  {
    id: 134,
    title: "Wann am besten wohin",
    author: "Lonely Planet",
    genre: ["Путешествия"],
    cover: "https://m.media-amazon.com/images/P/3575012350.01._SCLZZZZZZZ_.jpg",
    color: "#6c5ce7",
    description: "Немецкое издание путеводителя Lonely Planet."
  },

  // ==== Справочники, учебники и техническая литература ====
  {
    id: 135,
    title: "Baden-Württemberg: Eine kleine politische Landeskunde",
    author: "Сборник",
    genre: ["Техническая, учебная и справочная литература"],
    cover: "",
    color: "#0984e3",
    description: "Немецкое издание: краткий политический обзор земли Баден-Вюртемберг."
  },
  {
    id: 136,
    title: "Repetitorium der Höheren Mathematik",
    author: "Merziger, Wirth",
    genre: ["Техническая, учебная и справочная литература"],
    cover: "https://covers.openlibrary.org/b/id/8714917-L.jpg",
    color: "#00b894",
    description: "Немецкий учебник по высшей математике."
  },
  {
    id: 137,
    title: "Bürgerliches Gesetzbuch (BGB), 59. Auflage",
    author: "dtv / Beck-Texte",
    genre: ["Техническая, учебная и справочная литература"],
    cover: "",
    color: "#e17055",
    description: "Немецкое издание Гражданского кодекса."
  },
  {
    id: 138,
    title: "Langenscheidt Pocket Dictionary: Русско-английский / Англо-русский",
    author: "Langenscheidt",
    genre: ["Техническая, учебная и справочная литература"],
    cover: "",
    color: "#fdcb6e",
    description: "Карманный словарь."
  },
  {
    id: 139,
    title: "Langenscheidt Lilliput Schwäbisch",
    author: "Langenscheidt",
    genre: ["Техническая, учебная и справочная литература"],
    cover: "https://m.media-amazon.com/images/P/3125141052.01._SCLZZZZZZZ_.jpg",
    color: "#d63031",
    description: "Карманный словарь швабского диалекта (на полке два экземпляра/тома)."
  },
  {
    id: 140,
    title: "Optimization of the Communication System for Networked Control Systems",
    author: "Rainer Blind",
    genre: ["Техническая, учебная и справочная литература"],
    cover: "https://m.media-amazon.com/images/P/3832537465.01._SCLZZZZZZZ_.jpg",
    color: "#2d3436",
    description: "Английское издание. Техническая работа по сетевым системам управления."
  },
  {
    id: 141,
    title: "Play Acoustic",
    author: "Dave Hunter",
    genre: ["Техническая, учебная и справочная литература"],
    cover: "https://covers.openlibrary.org/b/id/1633655-L.jpg",
    color: "#636e72",
    description: "Немецкое издание (Voggenreiter). Учебник игры на акустической гитаре."
  },
  {
    id: 142,
    title: "atp edition 6/2014",
    author: "Журнал atp edition",
    genre: ["Техническая, учебная и справочная литература"],
    cover: "",
    color: "#e84393",
    description: "Технический журнал по автоматизации."
  },
  {
    id: 143,
    title: "Im Blickpunkt: Deutschlands Exzellenz-Institute — ISW Universität Stuttgart",
    author: "Сборник",
    genre: ["Техническая, учебная и справочная литература"],
    cover: "",
    color: "#00cec9",
    description: "Тонкая брошюра об институте ISW Университета Штутгарта."
  },
  {
    id: 144,
    title: "Universität Stuttgart",
    author: "Сборник",
    genre: ["Техническая, учебная и справочная литература"],
    cover: "",
    color: "#a29bfe",
    description: "Издание об Университете Штутгарта. Название разобрано частично — стоит уточнить."
  },
  {
    id: 145,
    title: "Deutsch aktiv Neu: Arbeitsbuch 1C",
    author: "Langenscheidt",
    genre: ["Техническая, учебная и справочная литература"],
    cover: "",
    color: "#74b9ff",
    description: "Рабочая тетрадь по немецкому языку."
  },
  {
    id: 146,
    title: "Grammatik mit Sinn und Verstand: Mittel- und Oberstufe",
    author: "Klett",
    genre: ["Техническая, учебная и справочная литература"],
    cover: "",
    color: "#fab1a0",
    description: "Грамматика немецкого языка, Klett (Edition Deutsch)."
  },
  {
    id: 147,
    title: "[уточнить название] Hauptkurs, Arbeitsbuch",
    author: "Hueber",
    genre: ["Техническая, учебная и справочная литература"],
    cover: "https://covers.openlibrary.org/b/id/997990-L.jpg",
    color: "#fd79a8",
    description: "Жёлтая рабочая тетрадь по немецкому языку, издательство Hueber."
  },
  {
    id: 148,
    title: "[уточнить название] Hauptkurs",
    author: "Hueber",
    genre: ["Техническая, учебная и справочная литература"],
    cover: "",
    color: "#6c5ce7",
    description: "Оранжевый учебник по немецкому языку, издательство Hueber."
  },
  {
    id: 149,
    title: "New Headway English Course: Intermediate Student's Book",
    author: "Liz Soars, John Soars",
    genre: ["Техническая, учебная и справочная литература"],
    cover: "https://covers.openlibrary.org/b/id/3206421-L.jpg",
    color: "#0984e3",
    description: "Учебник английского языка с англо-немецкими списками слов."
  },
  {
    id: 150,
    title: "Technical English 3: Course Book",
    author: "Bonamy",
    genre: ["Техническая, учебная и справочная литература"],
    cover: "https://covers.openlibrary.org/b/id/7820094-L.jpg",
    color: "#00b894",
    description: "Учебник технического английского, Pearson."
  },
  {
    id: 151,
    title: "Technical English 4: Course Book",
    author: "Bonamy",
    genre: ["Техническая, учебная и справочная литература"],
    cover: "https://m.media-amazon.com/images/P/1292424494.01._SCLZZZZZZZ_.jpg",
    color: "#e17055",
    description: "Учебник технического английского, Pearson."
  },
  {
    id: 152,
    title: "Cambridge English for Engineering",
    author: "Mark Ibbotson",
    genre: ["Техническая, учебная и справочная литература"],
    cover: "https://covers.openlibrary.org/b/id/7427510-L.jpg",
    color: "#fdcb6e",
    description: "Учебник английского языка для инженеров, Cambridge."
  },

  // ==== Добавлено с фото полок (2-я партия): детская литература ====
  {
    id: 153,
    title: "Supertato: Eviltato vs. Superpea",
    author: "Sue Hendra, Paul Linnet",
    genre: ["Детская литература", "Юмор"],
    cover: "https://is1-ssl.mzstatic.com/image/thumb/Publication221/v4/6b/5f/45/6b5f45e4-1862-52dd-136f-ca8d9a0edfd7/9781398511712.jpg/600x600bb.jpg",
    color: "#d63031",
    description: "Английское издание. Картинка-книга о суперкартошке и её овощных друзьях."
  },
  {
    id: 154,
    title: "Star Wars: Episode I–VI (tiptoi)",
    author: "Ravensburger",
    genre: ["Детская литература", "Фантастика"],
    cover: "https://m.media-amazon.com/images/P/3473554022.01._SCLZZZZZZZ_.jpg",
    color: "#2d3436",
    description: "Немецкая интерактивная книга tiptoi по «Звёздным войнам»."
  },
  {
    id: 155,
    title: "Wieso? Weshalb? Warum? Unsere Jahreszeiten (tiptoi)",
    author: "Ravensburger",
    genre: ["Детская литература", "Научпоп"],
    cover: "https://m.media-amazon.com/images/P/3473329185.01._SCLZZZZZZZ_.jpg",
    color: "#636e72",
    description: "Немецкая интерактивная книга tiptoi про времена года."
  },
  {
    id: 156,
    title: "Meine schönsten Weihnachtslieder (tiptoi)",
    author: "Ravensburger",
    genre: ["Детская литература"],
    cover: "https://covers.openlibrary.org/b/id/9028687-L.jpg",
    color: "#e84393",
    description: "Немецкая интерактивная книга tiptoi с рождественскими песнями."
  },
  {
    id: 157,
    title: "Wieso? Weshalb? Warum? Alles über die Musik (tiptoi)",
    author: "Ravensburger",
    genre: ["Детская литература", "Научпоп"],
    cover: "https://m.media-amazon.com/images/P/3473329231.01._SCLZZZZZZZ_.jpg",
    color: "#00cec9",
    description: "Немецкая интерактивная книга tiptoi о музыке."
  },
  {
    id: 158,
    title: "tiptoi create: Die verrückte Weltreise",
    author: "Ravensburger",
    genre: ["Детская литература", "Приключения"],
    cover: "https://m.media-amazon.com/images/P/3473554170.01._SCLZZZZZZZ_.jpg",
    color: "#a29bfe",
    description: "Немецкая интерактивная книга tiptoi create."
  },
  {
    id: 159,
    title: "tiptoi create: Schatzsuche im Dschungel",
    author: "Ravensburger",
    genre: ["Детская литература", "Приключения"],
    cover: "https://m.media-amazon.com/images/P/3473554154.01._SCLZZZZZZZ_.jpg",
    color: "#74b9ff",
    description: "Немецкая интерактивная книга tiptoi create."
  },
  {
    id: 160,
    title: "Дом, который построил Джек",
    author: "автор не указан на корешке",
    genre: ["Детская литература", "Поэзия"],
    cover: "https://s1.livelib.ru/boocover/1001559269/200x305/d17c/boocover.jpg",
    color: "#fab1a0",
    description: "Тонкая детская книжка в стихах."
  },
  {
    id: 161,
    title: "Самые лучшие стихи и сказки",
    author: "Самуил Маршак",
    genre: ["Детская литература", "Поэзия", "Сказки и притчи"],
    cover: "https://img1.labirint.ru/books/659112/cover.jpg",
    color: "#fd79a8",
    description: "Сборник стихов и сказок С. Маршака."
  },
  {
    id: 162,
    title: "Хомячок Фрю: Космические приключения во сне и наяву",
    author: "автор не указан на корешке",
    genre: ["Детская литература", "Приключения"],
    cover: "",
    color: "#6c5ce7",
    description: "Детская книга на русском языке. Автора стоит уточнить."
  },
  {
    id: 163,
    title: "Сказки детям",
    author: "Корней Чуковский",
    genre: ["Детская литература", "Сказки и притчи", "Поэзия"],
    cover: "https://img1.labirint.ru/books/570008/cover.jpg",
    color: "#0984e3",
    description: "Сборник сказок Корнея Чуковского."
  },
  {
    id: 164,
    title: "Стихи детям",
    author: "Агния Барто",
    genre: ["Детская литература", "Поэзия"],
    cover: "https://img1.labirint.ru/books/852857/cover.jpg",
    color: "#00b894",
    description: "Сборник стихов Агнии Барто."
  },
  {
    id: 165,
    title: "Площадь картонных часов",
    author: "Л. Яхнин",
    genre: ["Детская литература", "Поэзия"],
    cover: "https://img1.labirint.ru/books/697177/cover.jpg",
    color: "#e17055",
    description: "Детская книга Леонида Яхнина, издательство «Махаон»."
  },
  {
    id: 166,
    title: "Тутта Карлссон, Первая и Единственная, Людвиг Четырнадцатый и другие",
    author: "Ян Экхольм",
    genre: ["Детская литература", "Приключения"],
    cover: "https://img1.labirint.ru/books/910788/cover.jpg",
    color: "#fdcb6e",
    description: "Детская повесть Яна Экхольма, издательство «Махаон»."
  },
  {
    id: 167,
    title: "Всё-всё-всё о Муми-троллях для малышей",
    author: "автор не указан на корешке",
    genre: ["Детская литература", "Сказки и притчи"],
    cover: "https://img1.labirint.ru/books/912067/cover.jpg",
    color: "#d63031",
    description: "Книга о Муми-троллях для малышей, издательство «Росмэн»."
  },
  {
    id: 168,
    title: "Сэр Периметр и первый Круглый стол короля Артура",
    author: "Синди Нойшвандер",
    genre: ["Детская литература", "Приключения"],
    cover: "https://s1.livelib.ru/boocover/1002875343/200x305/845e/boocover.jpg",
    color: "#2d3436",
    description: "Математическая приключенческая книга серии «Сэр Периметр»."
  },
  {
    id: 169,
    title: "Сэр Периметр и дракон Пи",
    author: "Синди Нойшвандер",
    genre: ["Детская литература", "Приключения"],
    cover: "https://s1.livelib.ru/boocover/1003513314/200x305/5a87/boocover.jpg",
    color: "#636e72",
    description: "Математическая приключенческая книга серии «Сэр Периметр»."
  },
  {
    id: 170,
    title: "Сэр Периметр и рыцарь Угландии",
    author: "Синди Нойшвандер",
    genre: ["Детская литература", "Приключения"],
    cover: "https://s1.livelib.ru/boocover/1002909994/200x305/4214/boocover.jpg",
    color: "#e84393",
    description: "Математическая приключенческая книга серии «Сэр Периметр»."
  },
  {
    id: 171,
    title: "Приключения Тима в мире бактерий",
    author: "автор не указан на корешке",
    genre: ["Детская литература", "Научпоп"],
    cover: "https://s1.livelib.ru/boocover/1010167015/200x305/261f/boocover.jpg",
    color: "#00cec9",
    description: "Детская научно-популярная книга о бактериях."
  },
  {
    id: 172,
    title: "Sonic. Комикс 2: Судьба доктора Эггмана",
    author: "автор не указан на корешке",
    genre: ["Детская литература", "Приключения"],
    cover: "https://img1.labirint.ru/books/734332/cover.jpg",
    color: "#a29bfe",
    description: "Комикс о Сонике, издательство «Эксмо»."
  },
  {
    id: 173,
    title: "Sonic. Комикс 4: Заражение",
    author: "автор не указан на корешке",
    genre: ["Детская литература", "Приключения"],
    cover: "https://img1.labirint.ru/books/746826/cover.jpg",
    color: "#74b9ff",
    description: "Комикс о Сонике, издательство «Эксмо»."
  },
  {
    id: 174,
    title: "Мышкина машина",
    author: "Чисато Таширо",
    genre: ["Детская литература"],
    cover: "https://img1.labirint.ru/books/573045/cover.jpg",
    color: "#fab1a0",
    description: "Детская книга Чисато Таширо."
  },
  {
    id: 175,
    title: "Динозавры в летней школе",
    author: "Д. Хохвальд, Й. Иле, П. Фритц",
    genre: ["Детская литература"],
    cover: "",
    color: "#fd79a8",
    description: "Детская книга о динозаврах."
  },
  {
    id: 176,
    title: "Динозавры в аквапарке",
    author: "Д. Хохвальд, Й. Иле, П. Фритц",
    genre: ["Детская литература"],
    cover: "",
    color: "#6c5ce7",
    description: "Детская книга о динозаврах."
  },
  {
    id: 177,
    title: "[уточнить название] Друзья динозавров",
    author: "Ларс Мэле, Ларс Рудебьер",
    genre: ["Детская литература"],
    cover: "",
    color: "#0984e3",
    description: "Название на корешке разобрано частично — стоит уточнить."
  },

  // ==== Фото 11.10: стопка книг ====
  {
    id: 178,
    title: "Im Westen nichts Neues",
    author: "Erich Maria Remarque",
    genre: ["Классика"],
    cover: "https://covers.openlibrary.org/b/id/12706822-L.jpg",
    color: "#a29bfe",
    description: "Немецкое издание (KiWi 319). Роман Ремарка о молодых солдатах Первой мировой войны."
  },
  {
    id: 179,
    title: "Мы. Дневник падения",
    author: "Дмитрий Глуховский",
    genre: ["Публицистика"],
    cover: "https://s1.livelib.ru/boocover/1010036536/200x305/3b2e/boocover.jpg",
    color: "#74b9ff",
    description: "Публицистические заметки Дмитрия Глуховского о России при Путине с 2012 года до войны в Украине (2024)."
  },
  {
    id: 180,
    title: "Всё, что движется",
    author: "Алексей Семихатов",
    genre: ["Научпоп"],
    cover: "https://is1-ssl.mzstatic.com/image/thumb/Publication211/v4/ef/de/e6/efdee688-8ae8-9404-0090-87471074d03f/9785001398035.jpg/600x600bb.jpg",
    color: "#fab1a0",
    description: "Научно-популярная книга Алексея Семихатова, издательство АНФ."
  },
  {
    id: 181,
    title: "how to",
    author: "Randall Munroe",
    genre: ["Научпоп", "Юмор"],
    cover: "https://covers.openlibrary.org/b/id/8781053-L.jpg",
    color: "#fd79a8",
    description: "Русское издание книги Рэндалла Манро «How To»: абсурдные научные советы для повседневных проблем."
  },
  {
    id: 182,
    title: "Занимательная физика",
    author: "Яков Перельман",
    genre: ["Научпоп"],
    cover: "https://img1.labirint.ru/books/509871/cover.jpg",
    color: "#6c5ce7",
    description: "Научно-популярная книга Якова Перельмана, издательство Бомбора."
  },
  {
    id: 183,
    title: "Вокруг света в восемьдесят дней",
    author: "Жюль Верн",
    genre: ["Классика", "Приключения"],
    cover: "https://img1.labirint.ru/books/786953/cover.jpg",
    color: "#0984e3",
    description: "Роман Жюля Верна о кругосветном пари Филеаса Фогга."
  }
];
