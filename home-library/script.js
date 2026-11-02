const TRANSLIT_MAP = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh",
  з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o",
  п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "c",
  ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya"
};

// Названия языков для фильтра (поле language в books-data.js)
const LANGUAGES = {
  ru: "Русский",
  de: "Немецкий",
  en: "Английский",
  it: "Итальянский",
  be: "Белорусский",
  zh: "Китайский"
};

const SORTS = {
  added: "По порядку добавления",
  newest: "Сначала новые",
  title: "По названию",
  author: "По автору"
};

function toTranslit(str) {
  return str
    .toLowerCase()
    .split("")
    .map((ch) => (ch in TRANSLIT_MAP ? TRANSLIT_MAP[ch] : ch))
    .join("");
}

// Для поиска: нижний регистр и «ё» как «е», чтобы «тетушка» находила «тётушку» и наоборот
function normalize(str) {
  return str.toLowerCase().replace(/ё/g, "е");
}

// 1 книга, 2 книги, 5 книг
function plural(n, one, few, many) {
  const n10 = n % 10;
  const n100 = n % 100;
  if (n10 === 1 && n100 !== 11) return one;
  if (n10 >= 2 && n10 <= 4 && (n100 < 12 || n100 > 14)) return few;
  return many;
}

// Ключ сортировки: тома одной серии идут подряд и по номеру
function seriesKey(book) {
  if (!book.series) return normalize(book.title);
  const volume = String(book.volume || 0).padStart(4, "0");
  return normalize(book.series) + " " + volume;
}

// Сортировка по автору: по фамилии первого автора; «автор не указан» и «разные авторы» — в конце
function authorKey(author) {
  const a = normalize(author);
  if (a.startsWith("автор не указан") || a.startsWith("разные авторы")) return "\uffff";
  const first = a.split(",")[0].replace(/\(hrsg\.\)|u\. a\./g, "").trim();
  const words = first.split(/\s+/);
  return words[words.length - 1] + " " + first;
}

function showPlaceholder(cover, book) {
  cover.style.background = book.color || "#999";
  const placeholder = document.createElement("span");
  placeholder.className = "cover-placeholder";
  placeholder.textContent = "📖";
  cover.prepend(placeholder);
}

function createBookCard(book) {
  const card = document.createElement("article");
  card.className = "book-card";

  const cover = document.createElement("div");
  cover.className = "book-cover";

  if (book.cover) {
    const img = document.createElement("img");
    img.src = book.cover;
    img.alt = `Обложка книги «${book.title}»`;
    img.loading = "lazy";
    img.decoding = "async";
    // ссылка умерла или сайт запретил показ: вместо пустого места — цветная заглушка
    img.addEventListener("error", () => {
      img.remove();
      showPlaceholder(cover, book);
    });
    cover.appendChild(img);
  } else {
    showPlaceholder(cover, book);
  }

  const isCollection = (book.contents || []).length > 0;
  if (isCollection) {
    const badge = document.createElement("span");
    badge.className = "collection-badge";
    badge.textContent = "Сборник";
    cover.appendChild(badge);
  }

  const description = document.createElement("div");
  description.className = "book-description";
  const descText = document.createElement("p");
  descText.textContent = book.description || "Описание пока не добавлено.";
  description.appendChild(descText);
  if (book.series) {
    const series = document.createElement("p");
    series.className = "book-series";
    series.textContent = `Серия: ${book.series}` + (book.volume ? `, том ${book.volume}` : "");
    description.appendChild(series);
  }
  if (isCollection) {
    const contentsTitle = document.createElement("p");
    contentsTitle.className = "book-contents-title";
    contentsTitle.textContent = "Содержание:";
    const list = document.createElement("ul");
    list.className = "book-contents";
    book.contents.forEach((work) => {
      const item = document.createElement("li");
      item.textContent = work;
      list.appendChild(item);
    });
    description.append(contentsTitle, list);
  }
  cover.appendChild(description);

  const info = document.createElement("div");
  info.className = "book-info";

  const title = document.createElement("h3");
  title.className = "book-title";
  title.textContent = book.title;

  const author = document.createElement("p");
  author.className = "book-author";
  author.textContent = book.author;

  // «Найдено: …» — когда книга нашлась по произведению из сборника, а не по названию
  const found = document.createElement("p");
  found.className = "book-found";
  found.hidden = true;

  info.append(title, author, found);
  card.append(cover, info);
  return { card, found };
}

function setupLibrary() {
  const grid = document.getElementById("book-grid");
  const input = document.getElementById("search-input");
  const counter = document.getElementById("result-count");
  const languageSelect = document.getElementById("language-select");
  const sortSelect = document.getElementById("sort-select");
  const genreButton = document.getElementById("genre-button");
  const genreLabel = document.getElementById("genre-button-label");
  const genrePanel = document.getElementById("genre-panel");
  const genreList = document.getElementById("genre-list");
  const genreReset = document.getElementById("genre-reset");
  const selectedGenres = new Set();

  // Для каждой книги заранее готовим строки поиска
  const entries = BOOKS.map((book, index) => {
    const { card, found } = createBookCard(book);
    grid.appendChild(card);
    const main = [book.title, book.author, book.series || ""];
    return {
      book,
      card,
      found,
      index,
      text: main.map(normalize),
      translit: main.map(toTranslit),
      works: book.contents || [],
      genres: book.genre || []
    };
  });

  // ---- язык и сортировка ----
  const langCounts = {};
  BOOKS.forEach((b) => {
    if (b.language) langCounts[b.language] = (langCounts[b.language] || 0) + 1;
  });
  languageSelect.add(new Option("Все языки", ""));
  Object.keys(langCounts)
    .sort((a, b) => langCounts[b] - langCounts[a])
    .forEach((code) => {
      languageSelect.add(new Option(`${LANGUAGES[code] || code} (${langCounts[code]})`, code));
    });

  Object.entries(SORTS).forEach(([value, label]) => sortSelect.add(new Option(label, value)));

  function sortEntries() {
    const sort = sortSelect.value;
    const sorted = entries.slice();
    const cmp = (a, b) => a.localeCompare(b, "ru");
    if (sort === "newest") sorted.sort((a, b) => b.index - a.index);
    if (sort === "title") sorted.sort((a, b) => cmp(seriesKey(a.book), seriesKey(b.book)));
    if (sort === "author") {
      sorted.sort(
        (a, b) =>
          cmp(authorKey(a.book.author), authorKey(b.book.author)) ||
          cmp(seriesKey(a.book), seriesKey(b.book))
      );
    }
    grid.append(...sorted.map((e) => e.card));
  }

  // ---- поиск и фильтры ----
  function applyFilters() {
    const query = normalize(input.value.trim());
    const translitQuery = toTranslit(query);
    const language = languageSelect.value;
    let visibleCount = 0;

    entries.forEach((e) => {
      const matchesMain =
        e.text.some((s) => s.includes(query)) || e.translit.some((s) => s.includes(translitQuery));

      const foundWorks = query
        ? e.works.filter((w) => normalize(w).includes(query) || toTranslit(w).includes(translitQuery))
        : [];
      const matchesText = matchesMain || foundWorks.length > 0;

      const showFound = !matchesMain && foundWorks.length > 0;
      e.found.hidden = !showFound;
      e.found.textContent = showFound ? `Найдено: ${foundWorks.join(", ")}` : "";

      // Выбранные жанры сочетаются через «ИЛИ»: достаточно любого из выбранных
      const matchesGenre =
        selectedGenres.size === 0 || Array.from(selectedGenres).some((g) => e.genres.includes(g));
      const matchesLanguage = !language || e.book.language === language;

      const visible = matchesText && matchesGenre && matchesLanguage;
      e.card.hidden = !visible;
      if (visible) visibleCount++;
    });

    const total = entries.length;
    if (visibleCount === 0) counter.textContent = "Ничего не найдено";
    else if (visibleCount === total) counter.textContent = `${total} ${plural(total, "книга", "книги", "книг")}`;
    else counter.textContent = `Найдено ${visibleCount} из ${total}`;

    saveToUrl();
  }

  // ---- состояние в адресе страницы: ?q=чехов&lang=de&genre=Классика&sort=author ----
  function saveToUrl() {
    const params = new URLSearchParams();
    if (input.value.trim()) params.set("q", input.value.trim());
    if (languageSelect.value) params.set("lang", languageSelect.value);
    selectedGenres.forEach((g) => params.append("genre", g));
    if (sortSelect.value !== "added") params.set("sort", sortSelect.value);
    const query = params.toString();
    history.replaceState(null, "", query ? `?${query}` : location.pathname);
  }

  const startParams = new URLSearchParams(location.search);
  input.value = startParams.get("q") || "";
  if (langCounts[startParams.get("lang")]) languageSelect.value = startParams.get("lang");
  if (SORTS[startParams.get("sort")]) sortSelect.value = startParams.get("sort");

  // ---- меню жанров: только те, что реально есть у книг, в порядке списка GENRES ----
  const counts = {};
  BOOKS.forEach((book) => {
    (book.genre || []).forEach((g) => {
      counts[g] = (counts[g] || 0) + 1;
    });
  });

  const checkboxes = [];

  function refreshGenreButton() {
    const n = selectedGenres.size;
    genreLabel.textContent = n ? `Жанры: ${n}` : "Жанры";
    genreButton.classList.toggle("active", n > 0);
    genreReset.disabled = n === 0;
  }

  const startGenres = startParams.getAll("genre");
  GENRES.filter((g) => counts[g]).forEach((genre) => {
    const row = document.createElement("label");
    row.className = "genre-option";

    const box = document.createElement("input");
    box.type = "checkbox";
    box.value = genre;
    if (startGenres.includes(genre)) {
      box.checked = true;
      selectedGenres.add(genre);
    }
    box.addEventListener("change", () => {
      if (box.checked) selectedGenres.add(genre);
      else selectedGenres.delete(genre);
      refreshGenreButton();
      applyFilters();
    });
    checkboxes.push(box);

    const name = document.createElement("span");
    name.className = "genre-name";
    name.textContent = genre;

    const count = document.createElement("span");
    count.className = "genre-count";
    count.textContent = counts[genre];

    row.append(box, name, count);
    genreList.appendChild(row);
  });

  genreReset.addEventListener("click", () => {
    selectedGenres.clear();
    checkboxes.forEach((box) => (box.checked = false));
    refreshGenreButton();
    applyFilters();
  });

  function setPanelOpen(open) {
    genrePanel.hidden = !open;
    genreButton.setAttribute("aria-expanded", String(open));
  }

  genreButton.addEventListener("click", () => setPanelOpen(genrePanel.hidden));

  // закрываем меню кликом вне его и клавишей Esc
  document.addEventListener("click", (e) => {
    if (!genrePanel.hidden && !e.target.closest(".genre-menu")) setPanelOpen(false);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !genrePanel.hidden) {
      setPanelOpen(false);
      genreButton.focus();
    }
  });

  input.addEventListener("input", applyFilters);
  languageSelect.addEventListener("change", applyFilters);
  sortSelect.addEventListener("change", () => {
    sortEntries();
    saveToUrl();
  });

  refreshGenreButton();
  sortEntries();
  applyFilters();
}

// На устройствах без мыши (телефон, планшет) описание открывается нажатием на обложку
function setupTouchDescriptions() {
  const noHover = window.matchMedia("(hover: none)");
  const grid = document.getElementById("book-grid");

  document.addEventListener("click", (e) => {
    if (!noHover.matches) return;
    const cover = e.target.closest(".book-cover");
    const wasOpen = cover && cover.classList.contains("show-desc");
    grid.querySelectorAll(".book-cover.show-desc").forEach((c) => c.classList.remove("show-desc"));
    if (cover && !wasOpen) cover.classList.add("show-desc");
  });
}

setupLibrary();
setupTouchDescriptions();
