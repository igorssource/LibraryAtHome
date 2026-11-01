const TRANSLIT_MAP = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh",
  з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o",
  п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "c",
  ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya"
};

function toTranslit(str) {
  return str
    .toLowerCase()
    .split("")
    .map((ch) => (ch in TRANSLIT_MAP ? TRANSLIT_MAP[ch] : ch))
    .join("");
}

function createBookCard(book) {
  const card = document.createElement("article");
  card.className = "book-card";
  card.dataset.title = book.title.toLowerCase();
  card.dataset.author = book.author.toLowerCase();
  card.dataset.titleTranslit = toTranslit(book.title);
  card.dataset.authorTranslit = toTranslit(book.author);
  card.dataset.genres = (book.genre || []).join("|");
  // Произведения сборника: ищем по ним и показываем, что именно нашлось
  card.dataset.contents = (book.contents || []).join("|");

  const cover = document.createElement("div");
  cover.className = "book-cover";

  if (book.cover) {
    const img = document.createElement("img");
    img.src = book.cover;
    img.alt = `Обложка книги «${book.title}»`;
    cover.appendChild(img);
  } else {
    cover.style.background = book.color || "#999";
    cover.textContent = "📖";
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

  info.appendChild(title);
  info.appendChild(author);
  info.appendChild(found);

  card.appendChild(cover);
  card.appendChild(info);

  return card;
}

function renderBooks(books) {
  const grid = document.getElementById("book-grid");
  books.forEach((book) => {
    grid.appendChild(createBookCard(book));
  });
}

function setupFilters() {
  const input = document.getElementById("search-input");
  const noResults = document.getElementById("no-results");
  const genreButton = document.getElementById("genre-button");
  const genreLabel = document.getElementById("genre-button-label");
  const genrePanel = document.getElementById("genre-panel");
  const genreList = document.getElementById("genre-list");
  const genreReset = document.getElementById("genre-reset");
  const cards = Array.from(document.querySelectorAll(".book-card"));
  const selectedGenres = new Set();

  function applyFilters() {
    const query = input.value.trim().toLowerCase();
    const translitQuery = toTranslit(query);
    let visibleCount = 0;

    cards.forEach((card) => {
      const matchesMain =
        card.dataset.title.includes(query) ||
        card.dataset.author.includes(query) ||
        card.dataset.titleTranslit.includes(translitQuery) ||
        card.dataset.authorTranslit.includes(translitQuery);

      const works = card.dataset.contents ? card.dataset.contents.split("|") : [];
      const foundWorks = query
        ? works.filter(
            (w) => w.toLowerCase().includes(query) || toTranslit(w).includes(translitQuery)
          )
        : [];
      const matchesText = matchesMain || foundWorks.length > 0;

      const found = card.querySelector(".book-found");
      const showFound = !matchesMain && foundWorks.length > 0;
      found.hidden = !showFound;
      found.textContent = showFound ? `Найдено: ${foundWorks.join(", ")}` : "";

      // Выбранные жанры сочетаются через «ИЛИ»: достаточно любого из выбранных
      const bookGenres = card.dataset.genres.split("|");
      const matchesGenre =
        selectedGenres.size === 0 ||
        Array.from(selectedGenres).some((g) => bookGenres.includes(g));

      const visible = matchesText && matchesGenre;
      card.hidden = !visible;
      if (visible) visibleCount++;
    });

    noResults.hidden = visibleCount > 0;
  }

  // Меню жанров: только те, что реально есть у книг, в порядке списка GENRES
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

  GENRES.filter((g) => counts[g]).forEach((genre) => {
    const row = document.createElement("label");
    row.className = "genre-option";

    const box = document.createElement("input");
    box.type = "checkbox";
    box.value = genre;
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
  refreshGenreButton();
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

renderBooks(BOOKS);
setupFilters();
setupTouchDescriptions();
