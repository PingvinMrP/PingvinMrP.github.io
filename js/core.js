/* Почта для Python — ядро: утилиты, подсветка кода, учебные серверы, живые запросы, очки опыта. */
window.PP = (function () {
  "use strict";
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const wait = ms => new Promise(r => setTimeout(r, reduce ? 0 : ms));

  const HOSTS = {
    jp: { url: "https://jsonplaceholder.typicode.com", name: "jsonplaceholder.typicode.com", about: "учебная база постов и пользователей" },
    hb: { url: "https://httpbin.org", name: "httpbin.org", about: "«эхо»: показывает, что вы ему отправили" }
  };
  const STATUS_TEXT = { 200: "OK", 201: "Created", 204: "No Content", 301: "Moved Permanently", 302: "Found", 400: "Bad Request", 401: "Unauthorized", 403: "Forbidden", 404: "Not Found", 405: "Method Not Allowed", 418: "I'm a teapot", 429: "Too Many Requests", 500: "Internal Server Error", 502: "Bad Gateway", 503: "Service Unavailable" };
  const statusColor = s => s < 300 ? "var(--ok)" : s < 400 ? "var(--info)" : s < 500 ? "var(--warn)" : "var(--stamp)";
  const METHOD_COLOR = { GET: "var(--ok)", POST: "var(--accent)", PUT: "var(--warn)", PATCH: "var(--info)", DELETE: "var(--stamp)" };
  const METHOD_RU = { GET: "получить", POST: "создать", PUT: "заменить", PATCH: "поправить", DELETE: "удалить" };

  /* ---------- подсветка ---------- */
  function hlPy(src) {
    const re = /(#[^\n]*)|("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*')|\b(import|from|def|return|if|else|elif|try|except|as|for|in|True|False|None|not|and|or|with|print|while|len)\b|\b(\d+(?:\.\d+)?)\b/g;
    let out = "", last = 0, m;
    while ((m = re.exec(src))) {
      out += esc(src.slice(last, m.index));
      const cls = m[1] ? "tk-c" : m[2] ? "tk-s" : m[3] ? "tk-k" : "tk-n";
      out += '<span class="' + cls + '">' + esc(m[0]) + "</span>";
      last = re.lastIndex;
    }
    return out + esc(src.slice(last));
  }
  const hlLines = src => src.split("\n").map((l, i) => '<span class="ln" data-i="' + i + '">' + (hlPy(l) || " ") + "</span>").join("");
  function hlJson(obj) {
    const s = typeof obj === "string" ? obj : JSON.stringify(obj, null, 2);
    return esc(s).replace(/(&quot;(?:[^&]|&(?!quot;))*?&quot;)(\s*:)?|\b(-?\d+(?:\.\d+)?)\b|\b(true|false|null)\b/g, (m, str, colon, num, lit) => {
      if (str) return colon ? '<span class="tk-key">' + str + "</span>" + colon : '<span class="tk-s">' + str + "</span>";
      if (num) return '<span class="tk-n">' + num + "</span>";
      return '<span class="tk-k">' + lit + "</span>";
    });
  }
  function hlRaw(src) {
    return esc(src).split("\n").map((l, i) => {
      if (i === 0) return l.replace(/^(\w+)/, '<span class="tk-k">$1</span>');
      const m = l.match(/^([\w-]+):(.*)$/);
      return m ? '<span class="tk-key">' + m[1] + "</span>:" + m[2] : '<span class="tk-s">' + l + "</span>";
    }).join("\n");
  }

  /* ---------- данные учебного jsonplaceholder ---------- */
  const TITLES = ["sunt aut facere repellat provident occaecati excepturi optio reprehenderit", "qui est esse", "ea molestias quasi exercitationem repellat qui ipsa sit aut", "eum et est occaecati", "nesciunt quas odio", "dolorem eum magni eos aperiam quia", "magnam facilis autem", "dolorem dolore est ipsam", "nesciunt iure omnis dolorem tempora et accusantium", "optio molestias id quia eum"];
  const post = n => ({ userId: Math.ceil(n / 10), id: n, title: TITLES[(n - 1) % 10] + (n > 10 ? " (" + n + ")" : ""), body: "quia et suscipit\nsuscipit recusandae consequuntur expedita et cum…" });
  const USERS = [
    ["Leanne Graham", "Bret", "Sincere@april.biz", "Gwenborough"], ["Ervin Howell", "Antonette", "Shanna@melissa.tv", "Wisokyburgh"],
    ["Clementine Bauch", "Samantha", "Nathan@yesenia.net", "McKenziehaven"], ["Patricia Lebsack", "Karianne", "Julianne.OConner@kory.org", "South Elvis"],
    ["Chelsey Dietrich", "Kamren", "Lucio_Hettinger@annie.ca", "Roscoeview"], ["Mrs. Dennis Schulist", "Leopoldo_Corkery", "Karley_Dach@jasper.info", "South Christy"],
    ["Kurtis Weissnat", "Elwyn.Skiles", "Telly.Hoeger@billy.biz", "Howemouth"], ["Nicholas Runolfsdottir V", "Maxime_Nienow", "Sherwood@rosamond.me", "Aliyaview"],
    ["Glenna Reichert", "Delphine", "Chaim_McDermott@dana.io", "Bartholomebury"], ["Clementina DuBuque", "Moriah.Stanton", "Rey.Padberg@karina.biz", "Lebsackbury"]];
  const user = n => { const u = USERS[n - 1]; return { id: n, name: u[0], username: u[1], email: u[2], address: { city: u[3] } }; };
  const R = (status, body, why) => ({ status, body, why });

  function splitPath(req) {
    let [p, qs] = req.path.split("?");
    p = ("/" + p).replace(/\/{2,}/g, "/").replace(/(.)\/$/, "$1");
    const params = Object.assign({}, req.params || {});
    if (qs) qs.split("&").forEach(kv => { const [k, v] = kv.split("="); if (k) params[decodeURIComponent(k)] = decodeURIComponent(v || ""); });
    return { p, params };
  }
  function parseBody(req) {
    if (req.body == null || String(req.body).trim() === "" || !["POST", "PUT", "PATCH"].includes(req.method)) return { ok: true, body: null };
    try { return { ok: true, body: JSON.parse(req.body) }; } catch (e) { return { ok: false }; }
  }
  const BAD_JSON = R(400, { error: "Bad Request: сервер не смог прочитать JSON" }, "В теле запроса ошибка в JSON. Проверьте кавычки (только двойные), запятые между полями и скобки.");

  function serveJP(req) {
    const { p, params } = splitPath(req);
    const pb = parseBody(req); if (!pb.ok) return BAD_JSON;
    const body = pb.body, m = req.method; let mm;
    if (p === "/posts") {
      if (m === "GET") {
        let list = []; for (let i = 1; i <= 100; i++) list.push(post(i));
        Object.keys(params).forEach(k => { list = list.filter(x => String(x[k]) === String(params[k])); });
        return R(200, list, Object.keys(params).length
          ? "Сервер отфильтровал посты по " + Object.keys(params).map(k => k + "=" + params[k]).join(", ") + " и вернул " + list.length + " шт."
          : "Без параметров сервер вернул все 100 постов. Включите параметр userId=1, чтобы получить только посты первого пользователя.");
      }
      if (m === "POST") return R(201, Object.assign({}, body || {}, { id: 101 }), "201 Created: сервер «создал» пост и выдал ему номер 101. jsonplaceholder учебный, поэтому на самом деле ничего не сохраняется.");
      return R(404, {}, "Метод " + m + " к списку /posts не применяется. Менять или удалять можно конкретный пост, например /posts/1.");
    }
    if ((mm = p.match(/^\/posts\/(\d+)$/))) {
      const n = +mm[1];
      if (n < 1 || n > 100) return R(404, {}, "Поста №" + n + " не существует (их всего 100). Сервер ответил 404 Not Found и пустым JSON.");
      if (m === "GET") return R(200, post(n), "Сервер нашёл пост №" + n + " и прислал его в формате JSON. В Python его читают через response.json().");
      if (m === "PUT") return R(200, Object.assign({}, body || {}, { id: n }), "PUT заменяет запись целиком. Сервер вернул то, что вы прислали, плюс id. Полей, которые вы не прислали, больше нет.");
      if (m === "PATCH") return R(200, Object.assign(post(n), body || {}), "PATCH меняет только присланные поля, остальные остаются как были.");
      if (m === "DELETE") return R(200, {}, "Удалено. Сервер ответил 200 и пустым JSON {}. Об успехе судим по response.status_code.");
      return R(404, {}, "Метод " + m + " к одному посту не подходит. Создают новый пост через POST на /posts.");
    }
    if ((mm = p.match(/^\/posts\/(\d+)\/comments$/)) && m === "GET") {
      const n = +mm[1]; const list = [1, 2, 3].map(i => ({ postId: n, id: (n - 1) * 5 + i, name: "comment " + i, email: "reader" + i + "@mail.ru" }));
      return R(200, list, "Вложенный адрес: комментарии к посту №" + n + ". Адреса в API часто строятся как «раздел / номер / подраздел».");
    }
    if (p === "/users" && m === "GET") return R(200, USERS.map((u, i) => ({ id: i + 1, name: u[0] })), "Список из 10 пользователей (здесь сокращён до id и имени).");
    if ((mm = p.match(/^\/users\/(\d+)$/)) && m === "GET") {
      const n = +mm[1]; if (n < 1 || n > 10) return R(404, {}, "Пользователя №" + n + " нет, их всего 10.");
      return R(200, user(n), "Пользователь №" + n + ". Только имя достают так: response.json()[\"name\"] → \"" + USERS[n - 1][0] + "\".");
    }
    return R(404, {}, "Адреса " + p + " на сервере нет. Проверьте опечатки: /posts, /users, /comments. Это 404 Not Found.");
  }

  function serveHB(req) {
    const { p, params } = splitPath(req);
    const m = req.method; let mm;
    const ua = (req.headers && req.headers["User-Agent"]) || "python-requests/2.32.3";
    const hdrs = Object.assign({ "Accept": "*/*", "Accept-Encoding": "gzip, deflate", "Host": "httpbin.org", "User-Agent": ua }, req.headers || {});
    const url = HOSTS.hb.url + p + (Object.keys(params).length ? "?" + Object.keys(params).map(k => k + "=" + params[k]).join("&") : "");
    if (req.body != null && ["POST", "PUT", "PATCH", "DELETE"].includes(m)) hdrs["Content-Type"] = "application/json";
    const echo = { args: params, headers: hdrs, origin: "95.165.0.1", url };
    const verbs = { "/get": "GET", "/post": "POST", "/put": "PUT", "/patch": "PATCH", "/delete": "DELETE" };
    if (verbs[p]) {
      if (verbs[p] !== m) return R(405, "", "405 Method Not Allowed: по адресу " + p + " сервер принимает только " + verbs[p] + ". Метод и адрес должны совпадать.");
      if (m === "GET") return R(200, echo, "httpbin — «эхо-сервер»: он возвращает то, что получил. Видны ваши параметры (args) и заголовки (headers).");
      const pb = parseBody(req); if (!pb.ok) return BAD_JSON;
      return R(200, Object.assign({}, { args: params, data: req.body || "", json: pb.body }, { headers: hdrs, url }), "В поле json сервер показывает, что получил во вложении. Удобно проверять, что ваш код отправляет правильные данные.");
    }
    if (p === "/headers") return R(200, { headers: hdrs }, "Здесь все заголовки, которые дошли до сервера. Свои заголовки вы видите рядом со стандартными.");
    if (p === "/user-agent") return R(200, { "user-agent": ua }, "User-Agent — «подпись» отправителя. Python подписывается как python-requests, если вы не указали другое.");
    if (p === "/ip") return R(200, { origin: "95.165.0.1" }, "IP-адрес, с которого пришёл запрос. Это обратный адрес на конверте.");
    if ((mm = p.match(/^\/status\/(\d{3})$/))) { const c = +mm[1]; return R(c, "", "httpbin вернул тот код, который вы попросили: " + c + " " + (STATUS_TEXT[c] || "") + ". Так удобно тренироваться обрабатывать ошибки."); }
    if (p === "/cookies/set") return R(200, { cookies: params }, "Сервер поставил cookie и переадресовал (302) на /cookies. requests сам сходил по новому адресу. Чтобы cookie сохранилась, используйте requests.Session().");
    if (p === "/cookies") return R(200, { cookies: {} }, "Cookies пусты: без Session каждый запрос начинается «с чистого листа».");
    if ((mm = p.match(/^\/delay\/(\d+)$/))) return R(200, echo, "Сервер нарочно ждал " + mm[1] + " сек. перед ответом. Если в requests стоит timeout меньше, будет ошибка Timeout.");
    if ((mm = p.match(/^\/basic-auth\/([^/]+)\/([^/]+)$/))) {
      const auth = req.headers && (req.headers.Authorization || req.headers.authorization);
      const need = "Basic " + btoa(mm[1] + ":" + mm[2]);
      if (auth === need) return R(200, { authenticated: true, user: mm[1] }, "Логин и пароль верные. В Python: requests.get(url, auth=(\"" + mm[1] + "\", \"" + mm[2] + "\")).");
      return R(401, "", "401 Unauthorized: нужен заголовок Authorization с логином и паролем. В Python: auth=(\"" + mm[1] + "\", \"" + mm[2] + "\").");
    }
    return R(404, "", "На httpbin нет адреса " + p + ". Попробуйте /get, /post, /headers, /status/404.");
  }
  const serve = (host, req) => (host === "hb" ? serveHB : serveJP)(req);

  /* ---------- живой запрос из браузера ---------- */
  async function live(host, req) {
    const { p, params } = splitPath(req);
    const qs = Object.keys(params).map(k => encodeURIComponent(k) + "=" + encodeURIComponent(params[k])).join("&");
    const url = HOSTS[host].url + p + (qs ? "?" + qs : "");
    const headers = {};
    Object.keys(req.headers || {}).forEach(k => { if (k.toLowerCase() !== "user-agent") headers[k] = req.headers[k]; });
    const init = { method: req.method, headers };
    if (req.body != null && ["POST", "PUT", "PATCH"].includes(req.method)) { init.body = req.body; headers["Content-Type"] = "application/json; charset=UTF-8"; }
    const ctrl = new AbortController(); const to = setTimeout(() => ctrl.abort(), 10000); init.signal = ctrl.signal;
    const t0 = performance.now();
    const res = await fetch(url, init);
    const txt = await res.text();
    clearTimeout(to);
    let body = txt; try { body = txt ? JSON.parse(txt) : ""; } catch (e) { }
    return { status: res.status, body, ms: Math.round(performance.now() - t0), url: res.url || url, live: true };
  }

  /* ---------- хранилище ---------- */
  const store = {
    get(k, d) { try { const v = localStorage.getItem("pp-" + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem("pp-" + k, JSON.stringify(v)); } catch (e) { } }
  };

  /* ---------- тост и конфетти ---------- */
  function toast(html, ms) {
    let box = $(".toast-box"); if (!box) { box = document.createElement("div"); box.className = "toast-box"; box.setAttribute("aria-live", "polite"); document.body.appendChild(box); }
    const t = document.createElement("div"); t.className = "toast"; t.innerHTML = html; box.appendChild(t);
    setTimeout(() => t.remove(), ms || 2800);
  }
  function confetti() {
    if (reduce) return;
    let c = $("#confetti"); if (!c) { c = document.createElement("canvas"); c.id = "confetti"; document.body.appendChild(c); }
    const ctx = c.getContext("2d"); c.width = innerWidth; c.height = innerHeight;
    const cs = getComputedStyle(document.documentElement);
    const cols = ["--accent", "--ok", "--warn", "--stamp", "--info"].map(v => cs.getPropertyValue(v).trim());
    const P = Array.from({ length: 140 }, () => ({ x: c.width / 2 + (Math.random() - .5) * 200, y: c.height * .35, vx: (Math.random() - .5) * 14, vy: -Math.random() * 12 - 4, s: 5 + Math.random() * 7, r: Math.random() * 6, vr: (Math.random() - .5) * .3, col: cols[Math.floor(Math.random() * cols.length)] }));
    let f = 0;
    (function tick() {
      ctx.clearRect(0, 0, c.width, c.height);
      P.forEach(p => { p.vy += .35; p.x += p.vx; p.y += p.vy; p.vx *= .99; p.r += p.vr; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.col; ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); ctx.restore(); });
      if (++f < 150) requestAnimationFrame(tick); else ctx.clearRect(0, 0, c.width, c.height);
    })();
  }

  /* ---------- опыт и значки ---------- */
  const LEVELS = [[0, "Стажёр"], [40, "Сортировщик"], [100, "Почтальон"], [180, "Курьер"], [280, "Начальник почты"]];
  const BADGES = {
    first: ["✉", "Первое письмо", "Отправить первый запрос в конструкторе"],
    lost: ["🔍", "Адресат не найден", "Получить ответ 404"],
    create: ["🆕", "Создатель", "Получить ответ 201 Created"],
    live: ["🌐", "Настоящий интернет", "Отправить живой запрос"],
    echo: ["🪞", "Эхо", "Отправить запрос на httpbin"],
    tasks: ["📚", "Отличник", "Запустить все 10 заданий"],
    steps: ["👣", "Шаг за шагом", "Пройти любое задание пошагово"],
    letter: ["🏅", "Почтальон года", "Собрать все письма в игре без ошибок"],
    codes: ["🕵", "Знаток штампов", "10 из 10 в игре про коды"],
    bugs: ["🐞", "Охотник на баги", "Найти все ошибки в коде"],
    faq: ["🎓", "Теоретик", "Открыть все контрольные вопросы"],
    slides: ["🖥", "Докладчик", "Дойти до конца презентации"]
  };
  let S = store.get("xp", { xp: 0, badges: [], once: {} });
  if (!S.once) S.once = {};
  const levelOf = xp => { let i = 0; LEVELS.forEach((l, k) => { if (xp >= l[0]) i = k; }); return i; };
  function renderHud() {
    const hud = $("#hud"); if (!hud) return;
    const li = levelOf(S.xp), cur = LEVELS[li], nxt = LEVELS[li + 1];
    $(".hud-lvl", hud).textContent = cur[1];
    $(".hud-xp", hud).textContent = S.xp + " XP";
    $(".hud-bar i", hud).style.width = (nxt ? Math.min(100, (S.xp - cur[0]) / (nxt[0] - cur[0]) * 100) : 100) + "%";
    const pop = $(".hud-pop", hud);
    if (pop) {
      $(".hud-next", pop).textContent = nxt ? "До уровня «" + nxt[1] + "» осталось " + (nxt[0] - S.xp) + " XP" : "Максимальный уровень. Вы начальник почты!";
      $(".badges", pop).innerHTML = Object.keys(BADGES).map(k => '<div class="badge' + (S.badges.includes(k) ? " got" : "") + '" title="' + esc(BADGES[k][1] + ": " + BADGES[k][2]) + '">' + BADGES[k][0] + "</div>").join("");
      $(".badge-list", pop).innerHTML = Object.keys(BADGES).map(k => '<div class="' + (S.badges.includes(k) ? "got" : "") + '">' + (S.badges.includes(k) ? "✓ " : "○ ") + "<b>" + esc(BADGES[k][1]) + "</b> <span>— " + esc(BADGES[k][2]) + "</span></div>").join("");
    }
  }
  function addXP(n, reason, onceKey) {
    if (onceKey) { if (S.once[onceKey]) return; S.once[onceKey] = 1; }
    const before = levelOf(S.xp); S.xp += n; store.set("xp", S); renderHud();
    if (reason) toast("<b>+" + n + " XP</b> " + esc(reason), 2000);
    const after = levelOf(S.xp);
    if (after > before) { setTimeout(() => { toast("<b>Новый уровень!</b> Теперь вы «" + LEVELS[after][1] + "»", 3500); confetti(); }, 400); }
  }
  function badge(id) {
    if (!BADGES[id] || S.badges.includes(id)) return;
    S.badges.push(id); store.set("xp", S); renderHud();
    setTimeout(() => toast('<span style="font-size:1.4rem">' + BADGES[id][0] + "</span><span><b>Значок: " + esc(BADGES[id][1]) + "</b><br>" + esc(BADGES[id][2]) + "</span>", 3600), 250);
  }
  function resetXP() { S = { xp: 0, badges: [], once: {} }; store.set("xp", S); renderHud(); }

  /* ---------- копирование ---------- */
  function bindCopy(root) {
    $$(".copy", root || document).forEach(b => {
      if (b.dataset.bound) return; b.dataset.bound = "1";
      b.addEventListener("click", () => {
        const el = document.getElementById(b.dataset.copy); const txt = el.innerText;
        const ok = () => { b.textContent = "Скопировано"; setTimeout(() => b.textContent = "Копировать", 1400); };
        const fb = () => { const r = document.createRange(); r.selectNodeContents(el); const s = getSelection(); s.removeAllRanges(); s.addRange(r); b.textContent = "Выделено: Ctrl+C"; setTimeout(() => b.textContent = "Копировать", 1800); };
        try { navigator.clipboard.writeText(txt).then(ok, fb); } catch (e) { fb(); }
      });
    });
  }

  /* ---------- шапка: тема и HUD ---------- */
  function initChrome() {
    const saved = store.get("theme", null);
    if (saved) document.documentElement.setAttribute("data-theme", saved);
    const tb = $("#themeBtn");
    if (tb) {
      const label = () => {
        const t = document.documentElement.getAttribute("data-theme");
        const dark = t ? t === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
        tb.textContent = dark ? "☀" : "☾"; tb.title = dark ? "Светлая тема" : "Тёмная тема";
      };
      label();
      tb.addEventListener("click", () => {
        const t = document.documentElement.getAttribute("data-theme");
        const dark = t ? t === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
        const nt = dark ? "light" : "dark"; document.documentElement.setAttribute("data-theme", nt); store.set("theme", nt); label();
      });
    }
    const hud = $("#hud");
    if (hud) {
      const btn = $(".hud-btn", hud), pop = $(".hud-pop", hud);
      btn.addEventListener("click", e => { e.stopPropagation(); pop.hidden = !pop.hidden; btn.setAttribute("aria-expanded", !pop.hidden); });
      document.addEventListener("click", e => { if (!hud.contains(e.target)) { pop.hidden = true; btn.setAttribute("aria-expanded", "false"); } });
      const rb = $(".hud-reset", hud);
      if (rb) rb.addEventListener("click", () => { if (rb.dataset.sure) { resetXP(); rb.textContent = "Прогресс сброшен"; delete rb.dataset.sure; } else { rb.dataset.sure = "1"; rb.textContent = "Точно сбросить? Нажмите ещё раз"; } });
      renderHud();
    }
    bindCopy(document);
  }

  const plural = (n, f) => { const a = n % 10, b = n % 100; return a === 1 && b !== 11 ? f[0] : a >= 2 && a <= 4 && (b < 10 || b >= 20) ? f[1] : f[2]; };
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const shortBody = b => {
    if (b === "" || b == null) return "(пустое тело)";
    if (Array.isArray(b) && b.length > 3) return JSON.stringify(b.slice(0, 2), null, 2).replace(/\n\]$/, ",\n  … ещё " + (b.length - 2) + " шт.\n]");
    return typeof b === "string" ? b : JSON.stringify(b, null, 2);
  };

  return { $, $$, esc, wait, reduce, HOSTS, STATUS_TEXT, statusColor, METHOD_COLOR, METHOD_RU, hlPy, hlLines, hlJson, hlRaw, serve, live, store, toast, confetti, addXP, badge, bindCopy, initChrome, plural, shuffle, shortBody, USERS };
})();
