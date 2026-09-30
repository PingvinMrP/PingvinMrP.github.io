/* Почта для Python — главная страница: сцена, разбор адреса, конструктор, задания, вопросы, шпаргалка. */
(function () {
  "use strict";
  const P = window.PP, { $, $$, esc, wait } = P;
  const JP = P.HOSTS.jp.url, HB = P.HOSTS.hb.url;
  P.initChrome();

  /* =========================================================
     1. Сцена в шапке
     ========================================================= */
  const HERO = [
    { m: "GET", srv: "jsonplaceholder", status: 200,
      code: 'import requests\n\nr = requests.get(\n    "' + JP + '/users/1")\nprint(r.status_code)\nprint(r.json()["name"])',
      out: "200\nLeanne Graham",
      steps: ["Письмо GET /users/1 летит на сервер", "Сервер ищет пользователя №1 в базе", "Ответ со штампом 200 и JSON летит обратно"],
      done: "Готово. Python получил JSON и достал из него имя." },
    { m: "POST", srv: "jsonplaceholder", status: 201,
      code: 'import requests\n\nr = requests.post("' + JP + '/posts",\n    json={"title": "Привет"})\nprint(r.status_code)\nprint(r.json()["id"])',
      out: "201\n101",
      steps: ["Письмо POST с вложением летит на сервер", "Сервер создаёт новую запись", "Штамп 201 Created и номер новой записи"],
      done: "Готово. 201 значит «создано», новая запись получила id 101." },
    { m: "GET", srv: "jsonplaceholder", status: 404,
      code: 'import requests\n\nr = requests.get(\n    "' + JP + '/userz/1")\nprint(r.status_code)\nprint(r.json())',
      out: "404\n{}",
      steps: ["Письмо GET /userz/1 (опечатка!) летит на сервер", "Сервер ищет адрес /userz и не находит", "Штамп 404 Not Found и пустой JSON"],
      done: "Опечатка в адресе: сервер не знает раздела /userz. Код 404 — ошибка клиента." },
    { m: "GET", srv: "GigaChat API", status: 401,
      code: 'import requests\n\nr = requests.get(\n    "https://gigachat.devices.sberbank.ru/api/v1/models")\nprint(r.status_code)',
      out: "401",
      steps: ["Письмо без пропуска летит к GigaChat", "Сервер проверяет заголовок Authorization — его нет", "Штамп 401 Unauthorized: «кто вы?»"],
      done: "Без токена в заголовке Authorization сервер не пускает. Это пригодится в работе № 5." }
  ];
  let heroIdx = 0, heroBusy = false;
  function heroShow() {
    const h = HERO[heroIdx];
    $("#heroCode").innerHTML = P.hlPy(h.code);
    $("#heroOut").innerHTML = '<span class="prompt">&gt;&gt;&gt; нажмите «Отправить»</span>';
    $("#heroHint").textContent = h.steps[0];
    $("#srvName").textContent = h.srv;
    $("#svgEnv").style.opacity = 0;
  }
  $$(".scene .chip").forEach(c => c.addEventListener("click", () => {
    if (heroBusy) return; heroIdx = +c.dataset.p;
    $$(".scene .chip").forEach(x => x.setAttribute("aria-pressed", x === c)); heroShow();
  }));
  function along(path, ms) {
    return new Promise(res => {
      const len = path.getTotalLength(), env = $("#svgEnv"); env.style.opacity = 1;
      if (P.reduce) { const pt = path.getPointAtLength(len); env.setAttribute("transform", "translate(" + pt.x + " " + pt.y + ")"); return res(); }
      const t0 = performance.now();
      (function f(t) {
        let k = Math.min(1, (t - t0) / ms); const e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        const pt = path.getPointAtLength(len * e); env.setAttribute("transform", "translate(" + pt.x + " " + pt.y + ")");
        k < 1 ? requestAnimationFrame(f) : res();
      })(t0);
    });
  }
  $("#heroBtn").addEventListener("click", async () => {
    if (heroBusy) return; heroBusy = true; $("#heroBtn").disabled = true;
    const h = HERO[heroIdx];
    $("#svgTag").setAttribute("fill", P.METHOD_COLOR[h.m]); $("#svgTagTxt").textContent = h.m;
    $("#heroOut").innerHTML = '<span class="prompt">&gt;&gt;&gt; отправляю…</span>';
    $("#heroHint").textContent = "1. " + h.steps[0];
    await along($("#pathGo"), 1100);
    $("#svgEnv").style.opacity = 0;
    ["led1", "led2", "led3"].forEach(id => $("#" + id).setAttribute("class", "svg-led busy"));
    $("#heroHint").textContent = "2. " + h.steps[1];
    await wait(1200);
    ["led1", "led2", "led3"].forEach(id => $("#" + id).setAttribute("class", "svg-led on"));
    $("#svgTag").setAttribute("fill", P.statusColor(h.status)); $("#svgTagTxt").textContent = h.status;
    $("#heroHint").textContent = "3. " + h.steps[2];
    await along($("#pathBack"), 1100);
    $("#heroOut").textContent = h.out;
    $("#heroHint").textContent = h.done;
    P.addXP(2, "Анимация просмотрена", "hero" + heroIdx);
    heroBusy = false; $("#heroBtn").disabled = false;
  });
  heroShow();

  /* =========================================================
     2. Разбор адреса
     ========================================================= */
  const URLP = [
    ["https://", "var(--stamp)", "протокол", "Способ доставки. https — защищённое соединение: письмо едет в запечатанном конверте, по дороге его никто не прочитает."],
    ["jsonplaceholder.typicode.com", "var(--accent)", "домен (сервер)", "Имя сервера, «город и почтовое отделение». По нему интернет находит нужный компьютер."],
    ["/posts", "var(--ok)", "путь", "Раздел на сервере: посты. Другие разделы: /users, /comments. Это «улица»."],
    ["/1", "var(--info)", "номер записи", "Конкретная запись в разделе — «квартира». /posts/1 — первый пост."],
    ["?", "var(--muted)", "знак ?", "Знак вопроса отделяет адрес от параметров. В Python его ставит сам requests, если передать params=."],
    ["_limit=2", "var(--warn)", "параметр", "Параметр «ключ=значение». Уточняет запрос: например, вернуть не больше двух записей. Несколько параметров соединяют знаком &."]
  ];
  $("#urlParts").innerHTML = URLP.map((u, i) => '<span class="up" tabindex="0" role="button" data-i="' + i + '" style="--c:' + u[1] + ';--row:' + (i % 3) + '">' + esc(u[0]) + "<small>" + esc(u[2]) + "</small></span>").join("");
  $$("#urlParts .up").forEach(el => {
    const act = () => { $$("#urlParts .up").forEach(x => x.classList.toggle("on", x === el)); const u = URLP[+el.dataset.i]; $("#upExpl").innerHTML = "<b>" + esc(u[2]) + ".</b> " + esc(u[3]); $("#upExpl").style.borderLeftColor = u[1]; };
    el.addEventListener("click", act); el.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); act(); } });
  });

  /* =========================================================
     3. Конструктор
     ========================================================= */
  const B = { mode: "sim", host: "jp", method: "GET" };
  const DL = { jp: ["/posts/1", "/posts", "/users/1", "/users", "/posts/1/comments", "/posts/999", "/postz/1"], hb: ["/get", "/post", "/put", "/delete", "/headers", "/user-agent", "/ip", "/status/404", "/status/500", "/status/418", "/cookies/set?session_id=12345", "/delay/2", "/basic-auth/postman/password"] };
  const PRESETS = {
    jp: [["Пост №1", "GET", "/posts/1"], ["Имя пользователя", "GET", "/users/1"], ["Фильтр userId=1", "GET", "/posts", { p: ["userId", "1"] }], ["Создать пост", "POST", "/posts"], ["Изменить пост", "PUT", "/posts/1", { b: '{"title": "Updated title"}' }], ["Удалить пост", "DELETE", "/posts/1"], ["Опечатка", "GET", "/postz/1"]],
    hb: [["Эхо GET", "GET", "/get", { p: ["city", "London"] }], ["Эхо POST", "POST", "/post"], ["Мои заголовки", "GET", "/headers", { h: ["User-Agent", "MyPythonApp"] }], ["Код 404", "GET", "/status/404"], ["Код 500", "GET", "/status/500"], ["Cookies", "GET", "/cookies/set?session_id=12345"], ["Логин и пароль", "GET", "/basic-auth/postman/password", { h: ["Authorization", "Basic cG9zdG1hbjpwYXNzd29yZA=="] }]]
  };
  const HOSTNOTE = { jp: "Учебная база: 100 постов и 10 пользователей. Попробуйте /users/1 или адрес с опечаткой.", hb: "Эхо-сервер: возвращает то, что вы ему прислали. Удобно проверять свои параметры и заголовки." };
  const mbox = $("#methods");
  ["GET", "POST", "PUT", "PATCH", "DELETE"].forEach(m => {
    const b = document.createElement("button"); b.type = "button"; b.className = "mbtn"; b.style.setProperty("--mc", P.METHOD_COLOR[m]);
    b.textContent = m; b.dataset.m = m; b.title = P.METHOD_RU[m]; b.setAttribute("aria-pressed", m === B.method);
    b.addEventListener("click", () => setMethod(m)); mbox.appendChild(b);
  });
  function setMethod(m) { B.method = m; $$(".mbtn", mbox).forEach(x => x.setAttribute("aria-pressed", x.dataset.m === m)); renderB(); }
  function setHost(h) {
    B.host = h; $("#host").value = h; $("#hostNote").textContent = HOSTNOTE[h];
    $("#paths").innerHTML = DL[h].map(p => '<option value="' + esc(p) + '">').join("");
    $("#bPresets").innerHTML = PRESETS[h].map((p, i) => '<button type="button" class="chip" data-i="' + i + '">' + esc(p[0]) + "</button>").join("");
    $$("#bPresets .chip").forEach(c => c.addEventListener("click", () => applyPreset(PRESETS[B.host][+c.dataset.i])));
    renderB();
  }
  function applyPreset(p) {
    const x = p[3] || {};
    $("#path").value = p[2];
    $("#pOn").checked = !!x.p; if (x.p) { $("#pKey").value = x.p[0]; $("#pVal").value = x.p[1]; }
    $("#hOn").checked = !!x.h; if (x.h) { $("#hKey").value = x.h[0]; $("#hVal").value = x.h[1]; }
    $("#body").value = x.b || '{"title": "foo", "body": "bar", "userId": 1}';
    setMethod(p[1]);
  }
  $("#host").addEventListener("change", () => { setHost($("#host").value); $("#path").value = DL[B.host][0]; renderB(); });
  ["path", "pOn", "pKey", "pVal", "hOn", "hKey", "hVal", "body"].forEach(id => { $("#" + id).addEventListener("input", renderB); $("#" + id).addEventListener("change", renderB); });
  function setMode(m) {
    B.mode = m; $("#modeSim").setAttribute("aria-pressed", m === "sim"); $("#modeLive").setAttribute("aria-pressed", m === "live");
    $("#modeNote").textContent = m === "sim" ? "Работает без интернета. Отвечает так же, как настоящий сервер, и объясняет свой ответ." : "Запрос уйдёт на настоящий сервер через интернет. Вы увидите реальный ответ и время в миллисекундах.";
  }
  $("#modeSim").addEventListener("click", () => setMode("sim"));
  $("#modeLive").addEventListener("click", () => setMode("live"));
  $("#resetBtn").addEventListener("click", () => { setHost("jp"); applyPreset(PRESETS.jp[0]); $("#respBox").innerHTML = '<p class="empty">Нажмите «Отправить», и здесь появится ответ сервера.</p>'; });

  const hasBody = m => ["POST", "PUT", "PATCH"].includes(m);
  function getReq() {
    const params = {}; if ($("#pOn").checked && $("#pKey").value.trim()) params[$("#pKey").value.trim()] = $("#pVal").value;
    const headers = {}; if ($("#hOn").checked && $("#hKey").value.trim()) headers[$("#hKey").value.trim()] = $("#hVal").value;
    let path = $("#path").value.trim() || "/"; if (path[0] !== "/") path = "/" + path;
    return { method: B.method, path, params, headers, body: hasBody(B.method) ? $("#body").value : null };
  }
  const pyVal = v => /^-?\d+$/.test(v) ? v : JSON.stringify(v);
  const pyDict = o => "{" + Object.keys(o).map(k => JSON.stringify(k) + ": " + pyVal(o[k])).join(", ") + "}";
  function jsonToPy(t) {
    try { const o = JSON.parse(t); return JSON.stringify(o).replace(/":/g, '": ').replace(/,"/g, ', "').replace(/\btrue\b/g, "True").replace(/\bfalse\b/g, "False").replace(/\bnull\b/g, "None"); } catch (e) { return null; }
  }
  function buildPy(q) {
    const L = ["import requests", "", 'url = "' + P.HOSTS[B.host].url + q.path + '"'], args = ["url"];
    if (Object.keys(q.params).length) { L.push("params = " + pyDict(q.params)); args.push("params=params"); }
    const auth = q.headers.Authorization && /^Basic /.test(q.headers.Authorization);
    const hh = Object.assign({}, q.headers); if (auth) delete hh.Authorization;
    if (Object.keys(hh).length) { L.push("headers = " + pyDict(hh)); args.push("headers=headers"); }
    if (auth) { let pair = ["логин", "пароль"]; try { pair = atob(q.headers.Authorization.slice(6)).split(":"); } catch (e) { } args.push('auth=("' + pair[0] + '", "' + (pair[1] || "") + '")'); }
    if (q.body != null) { const pd = jsonToPy(q.body); L.push("data = " + (pd || "{}  # в JSON ошибка, исправьте тело запроса")); args.push("json=data"); }
    const cookies = /cookies\/set/.test(q.path);
    L.push("");
    if (cookies) { L.push("session = requests.Session()"); L.push("response = session." + q.method.toLowerCase() + "(" + args.join(", ") + ")"); }
    else L.push("response = requests." + q.method.toLowerCase() + "(" + args.join(", ") + ")");
    L.push("");
    L.push("print(response.status_code)");
    if (cookies) L.push("print(session.cookies.get_dict())");
    else if (/\/status\//.test(q.path)) L.push("print(response.text)  # тело пустое");
    else L.push("print(response.json())");
    return L.join("\n");
  }
  function fullPath(q) {
    const qs = Object.keys(q.params).map(k => encodeURIComponent(k) + "=" + encodeURIComponent(q.params[k])).join("&");
    return q.path + (qs ? (q.path.includes("?") ? "&" : "?") + qs : "");
  }
  function buildRaw(q) {
    const L = [q.method + " " + fullPath(q) + " HTTP/1.1", "Host: " + P.HOSTS[B.host].name];
    L.push("User-Agent: " + (q.headers["User-Agent"] != null ? q.headers["User-Agent"] : "python-requests/2.32.3"));
    L.push("Accept: */*"); L.push("Connection: keep-alive");
    Object.keys(q.headers).forEach(k => { if (k !== "User-Agent") L.push(k + ": " + q.headers[k]); });
    let b = "";
    if (q.body != null) { let s = q.body; try { s = JSON.stringify(JSON.parse(q.body)); } catch (e) { } L.push("Content-Type: application/json"); L.push("Content-Length: " + new TextEncoder().encode(s).length); b = s; }
    return L.join("\n") + "\n" + (b ? "\n" + b : "");
  }
  function envHTML(q) {
    const hs = Object.keys(q.headers).map(k => k + ": " + q.headers[k]).join("\n");
    return '<div class="envelope"><div class="env-top"><div class="env-addr"><small>Кому</small><span class="to">' + esc(P.HOSTS[B.host].url + fullPath(q)) + '</span></div>' +
      '<div class="stamp" style="--mc:' + P.METHOD_COLOR[q.method] + '"><div>' + q.method + "<small>" + P.METHOD_RU[q.method] + "</small></div></div></div>" +
      '<div class="env-sec"><small>Пометки на конверте (заголовки)</small>' + (hs ? '<span class="mono">' + esc(hs) + "</span>" : '<span class="empty">стандартные: requests подставит их сам</span>') + "</div>" +
      '<div class="env-sec"><small>Вложение (тело)</small>' + (q.body != null ? '<span class="mono">' + esc(q.body) + "</span>" : '<span class="empty">пусто: для ' + q.method + " вложение не нужно</span>") + "</div></div>";
  }
  function renderB() {
    const q = getReq();
    $("#body").disabled = q.body == null;
    $("#bodyNote").textContent = q.body != null ? "Это вложение письма. В Python передаётся как json=data." : "Для " + q.method + " тело не нужно. Поле включится при выборе POST, PUT или PATCH.";
    $("#view-env").innerHTML = envHTML(q);
    $("#pyCode").innerHTML = P.hlPy(buildPy(q));
    $("#rawCode").innerHTML = P.hlRaw(buildRaw(q));
  }
  $$("#builder .tab").forEach(t => t.addEventListener("click", () => {
    $$("#builder .tab").forEach(x => x.setAttribute("aria-selected", x === t));
    ["env", "py", "raw"].forEach(v => $("#view-" + v).hidden = v !== t.dataset.view);
  }));
  function respHTML(res, q, extra) {
    const col = P.statusColor(res.status);
    const pills = [
      '<span class="pill" style="--sc:' + col + '">' + res.status + " " + (P.STATUS_TEXT[res.status] || "") + "</span>",
      '<span class="pill">' + (res.live ? "🌐 живой ответ" : "🧪 учебный сервер") + "</span>"
    ];
    if (res.ms != null) pills.push('<span class="pill">⏱ ' + res.ms + " мс</span>");
    const notes = [];
    if (!res.live && q.headers["User-Agent"] && B.host === "jp") notes.push("Сервер увидел, что письмо от «" + esc(q.headers["User-Agent"]) + "», а не от стандартного python-requests.");
    if (extra) notes.push(extra);
    const body = typeof res.body === "string" && res.body !== "" ? esc(res.body.slice(0, 1500)) : P.hlJson(P.shortBody(res.body));
    return '<div class="envelope reply" style="--sc:' + col + '"><div class="env-top"><div class="env-addr"><small>Ответ сервера</small><div class="meta">' + pills.join("") + '</div></div>' +
      '<div class="stamp pop" style="--mc:' + col + '"><div>' + res.status + "<small>" + (P.STATUS_TEXT[res.status] || "") + '</small></div></div></div><pre class="code">' + body + "</pre></div>" +
      ((res.why || notes.length) ? '<div class="explain" style="margin-top:12px">' + esc(res.why || "") + (notes.length ? (res.why ? "<br>" : "") + notes.join("<br>") : "") + "</div>" : "");
  }
  let sending = false;
  $("#sendBtn").addEventListener("click", async () => {
    if (sending) return; sending = true; $("#sendBtn").disabled = true;
    const q = getReq(), fl = $("#flight"), dot = $("#flightDot");
    fl.classList.add("go"); dot.textContent = "✉"; dot.style.color = ""; dot.style.left = "70px"; await wait(30); dot.style.left = "calc(100% - 110px)";
    $("#respBox").innerHTML = '<p class="empty">Письмо в пути…</p>';
    let res, extra = "";
    const sim = P.serve(B.host, q);
    if (B.mode === "live") {
      try {
        const [r] = await Promise.all([P.live(B.host, q), wait(700)]);
        res = r; res.why = sim.status === r.status ? sim.why : "";
        if (q.headers["User-Agent"]) extra = "Браузер не разрешает менять User-Agent, поэтому этот заголовок не отправлен. Из Python это работает.";
        P.badge("live"); P.addXP(5, "Живой запрос", "live-" + B.host + q.method + q.path);
      } catch (e) {
        res = sim; extra = "Не удалось достучаться до сервера: нет интернета или браузер заблокировал запрос. Показан ответ учебного сервера.";
      }
    } else { await wait(750); res = sim; }
    dot.textContent = res.status; dot.style.color = P.statusColor(res.status); dot.style.left = "70px";
    await wait(750);
    fl.classList.remove("go");
    $("#respBox").innerHTML = respHTML(res, q, extra);
    P.badge("first"); if (res.status === 404) P.badge("lost"); if (res.status === 201) P.badge("create"); if (B.host === "hb") P.badge("echo");
    P.addXP(3, "Новое письмо", "req-" + B.host + q.method + fullPath(q));
    sending = false; $("#sendBtn").disabled = false;
  });
  setHost("jp"); renderB();

  /* =========================================================
     4. Задания
     ========================================================= */
  const TASKS = [
    { t: "GET-запрос", goal: "Отправьте GET на /posts/1 и выведите полученный JSON.",
      code: 'import requests\n\nresponse = requests.get("' + JP + '/posts/1")\nprint(response.json())',
      steps: [[0, "Подключаем библиотеку requests. Без этой строки Python не знает, что такое requests.get."], [2, "Отправляем письмо GET («пришлите мне») по адресу поста №1. Ответ сервера целиком кладём в переменную response."], [3, "response.json() превращает JSON-текст в словарь Python, а print выводит его на экран."]],
      out: "{'userId': 1, 'id': 1, 'title': 'sunt aut facere repellat provident occaecati excepturi optio reprehenderit', 'body': 'quia et suscipit\\nsuscipit recusandae …'}",
      tip: "Python печатает словарь с одинарными кавычками. Это нормально: JSON уже стал обычным словарём." },
    { t: "Статус-код", goal: "Выведите «Success!», если код ответа 200, иначе выведите код ошибки.",
      code: 'import requests\n\nresponse = requests.get("' + JP + '/posts/1")\nif response.status_code == 200:\n    print("Success!")\nelse:\n    print("Ошибка:", response.status_code)',
      steps: [[2, "Отправляем запрос и получаем ответ."], [3, "status_code — число-штамп на ответе. Сравниваем через == (два «равно»: одно «равно» — это присваивание)."], [4, "Если штамп 200, печатаем Success!"], [5, "Во всех остальных случаях попадаем в else."], [6, "Печатаем код ошибки, например 404. Попробуйте заменить адрес на /posts/999."]],
      out: "Success!",
      tip: "Короче: <code>if response.ok:</code> — это True для любого кода меньше 400." },
    { t: "POST-запрос", goal: "Создайте пост {title, body, userId} и выведите ответ сервера.",
      code: 'import requests\n\nnew_post = {"title": "foo", "body": "bar", "userId": 1}\nresponse = requests.post("' + JP + '/posts", json=new_post)\nprint(response.status_code)\nprint(response.json())',
      steps: [[2, "Готовим вложение письма: обычный словарь Python."], [3, "POST — «примите и создайте». json=new_post превращает словарь в JSON и кладёт его в тело запроса."], [4, "Сервер ответит 201 Created: запись создана."], [5, "В ответе то, что мы прислали, плюс новый id = 101."]],
      out: "201\n{'title': 'foo', 'body': 'bar', 'userId': 1, 'id': 101}",
      tip: "В методичке сказано «передав в data». Разница важна: <code>data=</code> отправит данные как веб-форму, и userId придёт строкой <code>'1'</code>. <code>json=</code> отправит настоящий JSON и сам поставит заголовок Content-Type. Для API используйте <code>json=</code>." },
    { t: "JSON-ответ", goal: "Получите пользователя №1 и выведите его name.",
      code: 'import requests\n\nresponse = requests.get("' + JP + '/users/1")\nuser = response.json()\nprint(user["name"])',
      steps: [[2, "Запрашиваем пользователя №1."], [3, "Превращаем ответ в словарь и называем его user."], [4, "Достаём значение по ключу \"name\", как из любого словаря."]],
      out: "Leanne Graham",
      tip: "Если ключа нет, будет KeyError. Безопасно: <code>user.get(\"name\", \"неизвестно\")</code>. Вложенные поля: <code>user[\"address\"][\"city\"]</code>." },
    { t: "Параметры", goal: "Получите посты с параметром userId=1.",
      code: 'import requests\n\nparams = {"userId": 1}\nresponse = requests.get("' + JP + '/posts", params=params)\nprint(response.url)\nposts = response.json()\nprint(len(posts))\nfor p in posts[:3]:\n    print(p["id"], p["title"])',
      steps: [[2, "Параметры — словарь «ключ: значение»."], [3, "requests сам допишет их к адресу после знака ?"], [4, "response.url показывает, какой адрес получился: …/posts?userId=1"], [5, "Ответ — список словарей."], [6, "len() считает, сколько постов пришло: 10."], [7, "Перебираем первые три поста."], [8, "У каждого печатаем номер и заголовок."]],
      out: JP + "/posts?userId=1\n10\n1 sunt aut facere repellat provident occaecati excepturi optio reprehenderit\n2 qui est esse\n3 ea molestias quasi exercitationem repellat qui ipsa sit aut",
      tip: "Не склеивайте адрес вручную через +. params сам заменит пробелы и русские буквы на безопасные символы." },
    { t: "Заголовки", goal: "Отправьте GET с заголовком User-Agent: MyPythonApp.",
      code: 'import requests\n\nheaders = {"User-Agent": "MyPythonApp"}\nresponse = requests.get("' + JP + '/posts/1", headers=headers)\nprint(response.request.headers["User-Agent"])\nprint(response.json()["title"])',
      steps: [[2, "Заголовки — тоже словарь. User-Agent — «подпись» отправителя."], [3, "Передаём их через headers=. Они поедут пометками на конверте."], [4, "response.request — это наше исходное письмо. Проверяем, с какой подписью оно ушло."], [5, "А это содержимое ответа."]],
      out: "MyPythonApp\nsunt aut facere repellat provident occaecati excepturi optio reprehenderit",
      tip: "Без своего заголовка requests подписывается как <code>python-requests/2.x</code>. Самый важный заголовок в настоящих API — <code>Authorization: Bearer &lt;токен&gt;</code>, он понадобится для GigaChat." },
    { t: "PUT-запрос", goal: "Измените title поста №1 на «Updated title».",
      code: 'import requests\n\ndata = {"title": "Updated title"}\nresponse = requests.put("' + JP + '/posts/1", json=data)\nprint(response.status_code)\nprint(response.json())',
      steps: [[2, "Новые данные для поста."], [3, "PUT — «замените пост №1 тем, что я прислал»."], [4, "200 — замена прошла."], [5, "Остались только title и id: body и userId пропали, потому что PUT заменяет запись целиком."]],
      out: "200\n{'title': 'Updated title', 'id': 1}",
      tip: "Чтобы поменять одно поле и оставить остальные, используют PATCH: <code>requests.patch(url, json=data)</code>." },
    { t: "DELETE-запрос", goal: "Удалите пост №1 и выведите статус-код.",
      code: 'import requests\n\nresponse = requests.delete("' + JP + '/posts/1")\nprint(response.status_code)',
      steps: [[2, "DELETE — «уничтожьте пост №1». Тело не нужно, всё сказано в адресе."], [3, "Тело ответа пустое ({}), поэтому об успехе судим по коду: 200."]],
      out: "200",
      tip: "jsonplaceholder учебный: он отвечает «удалено», но пост остаётся на месте. Настоящий API после удаления вернёт 404 на этот адрес." },
    { t: "Cookies", goal: "Получите cookie session_id=12345 с httpbin.org и выведите её.",
      code: 'import requests\n\nsession = requests.Session()\nresponse = session.get("' + HB + '/cookies/set?session_id=12345")\nprint(session.cookies.get_dict())\nprint(response.json())',
      steps: [[2, "Session — «постоянный клиент» почты: запоминает cookies между запросами, как браузер."], [3, "Сервер ставит cookie и пересылает нас (302) на /cookies. requests идёт по новому адресу сам."], [4, "Cookie сохранилась в сессии."], [5, "Сервер подтверждает: видит нашу cookie."]],
      out: "{'session_id': '12345'}\n{'cookies': {'session_id': '12345'}}",
      tip: "Если написать просто <code>requests.get(...)</code> и вывести <code>response.cookies</code>, получится пусто: cookie пришла в первом ответе, а в response лежит второй, после переадресации. Первый ответ хранится в <code>response.history[0]</code>." },
    { t: "Ошибки", goal: "Запросите несуществующий адрес и выведите «Ошибка запроса».",
      code: 'import requests\n\ntry:\n    response = requests.get("' + JP + '/invalid-url", timeout=5)\n    response.raise_for_status()\n    print(response.json())\nexcept requests.exceptions.RequestException as e:\n    print("Ошибка запроса")\n    print(e)',
      steps: [[2, "try — «попробуй выполнить». Если внутри что-то сломается, Python перейдёт в except."], [3, "Запрос с timeout=5: не ждать ответа дольше 5 секунд. Сервер отвечает 404."], [4, "Главная строка! raise_for_status() выбрасывает исключение, если код 4xx или 5xx. Без неё 404 ошибкой не считается."], [5, "Сюда мы не дойдём: исключение уже случилось."], [6, "RequestException ловит всё: нет интернета, таймаут, ошибочный статус."], [7, "Печатаем сообщение для пользователя."], [8, "И подробности: что именно пошло не так."]],
      out: "Ошибка запроса\n404 Client Error: Not Found for url: " + JP + "/invalid-url", err: true,
      tip: "Главная ловушка: сам по себе 404 <b>не</b> вызывает исключение. Без <code>raise_for_status()</code> блок except не сработает, и «Ошибка запроса» не напечатается." }
  ];
  let cur = 0, stepI = -1;
  const done = new Set(P.store.get("tasks", []));
  const tl = $("#taskList");
  TASKS.forEach((t, i) => {
    const b = document.createElement("button"); b.type = "button"; b.className = "tnum"; b.setAttribute("role", "tab");
    b.innerHTML = (i + 1) + "<small>" + esc(t.t.split(" ")[0]) + "</small>"; b.title = t.t;
    b.addEventListener("click", () => { cur = i; stepI = -1; renderTask(); }); tl.appendChild(b);
  });
  function renderTask() {
    const t = TASKS[cur];
    $$(".tnum", tl).forEach((b, i) => { b.setAttribute("aria-selected", i === cur); b.classList.toggle("done", done.has(i)); });
    $("#taskPanel").innerHTML =
      '<div class="sec-head"><span class="eyebrow">Задание ' + (cur + 1) + ' из 10</span><h3 style="font-size:1.35rem">' + esc(t.t) + '</h3><p class="lead">' + esc(t.goal) + "</p></div>" +
      '<div class="task"><div style="display:flex;flex-direction:column;gap:10px;min-width:0">' +
      '<div class="code-wrap"><pre class="code" id="tCode">' + P.hlLines(t.code) + '</pre><button class="copy" type="button" data-copy="tCode">Копировать</button></div>' +
      '<div class="row"><button class="btn" type="button" id="stepT">👣 Пошагово</button><button class="btn ghost" type="button" id="runT">▶ Запустить</button></div>' +
      '<div class="stepbox" id="stepBox" hidden></div>' +
      '<div class="term-out" id="tOut" aria-live="polite"><span class="prompt">$ python task' + (cur + 1) + ".py</span></div></div>" +
      '<div class="why"><h3>Что важно запомнить</h3><div class="warnbox"><b>Ловушка.</b> ' + t.tip + '</div><p class="note">Хотите поэкспериментировать? Этот же запрос можно собрать в <a href="#builder">конструкторе</a> и отправить на настоящий сервер.</p></div></div>';
    P.bindCopy($("#taskPanel"));
    $("#runT").addEventListener("click", runTask);
    $("#stepT").addEventListener("click", () => { stepI = 0; renderStep(); });
  }
  function renderStep() {
    const t = TASKS[cur], box = $("#stepBox"), lines = $$("#tCode .ln");
    if (stepI < 0 || stepI >= t.steps.length) { box.hidden = true; lines.forEach(l => l.classList.remove("hl", "dim")); return; }
    const [li, txt] = t.steps[stepI];
    lines.forEach((l, i) => { l.classList.toggle("hl", i === li); l.classList.toggle("dim", i !== li); });
    box.hidden = false;
    box.innerHTML = "<b>Шаг " + (stepI + 1) + " из " + t.steps.length + " · строка " + (li + 1) + "</b><p style='margin:6px 0 10px'>" + esc(txt) + "</p>" +
      '<div class="row"><button class="btn ghost" type="button" id="sPrev"' + (stepI === 0 ? " disabled" : "") + '>← Назад</button><button class="btn" type="button" id="sNext">' + (stepI === t.steps.length - 1 ? "Готово ✓" : "Дальше →") + '</button><button class="btn ghost" type="button" id="sExit">Выйти</button></div>';
    $("#sPrev").addEventListener("click", () => { stepI--; renderStep(); });
    $("#sExit").addEventListener("click", () => { stepI = -1; renderStep(); });
    $("#sNext").addEventListener("click", () => {
      if (stepI === t.steps.length - 1) { stepI = -1; renderStep(); P.badge("steps"); P.addXP(4, "Разобрано пошагово", "step" + cur); runTask(); }
      else { stepI++; renderStep(); }
    });
  }
  async function runTask() {
    const t = TASKS[cur], o = $("#tOut"), idx = cur;
    const head = '<span class="prompt">$ python task' + (cur + 1) + ".py</span>\n";
    o.innerHTML = head + '<span class="prompt">отправка запроса…</span><span class="caret"></span>';
    await wait(650);
    if (idx !== cur) return;
    const txt = t.out; let n = 0; const step = Math.max(2, Math.ceil(txt.length / 40));
    await new Promise(res => {
      (function type() {
        n = Math.min(txt.length, n + step);
        o.innerHTML = head + '<span class="' + (t.err ? "err" : "") + '">' + esc(txt.slice(0, n)) + "</span>" + (n < txt.length ? '<span class="caret"></span>' : "");
        n < txt.length && !P.reduce ? setTimeout(type, 16) : res();
      })();
    });
    if (!done.has(idx)) {
      done.add(idx); P.store.set("tasks", Array.from(done)); tl.children[idx].classList.add("done");
      P.addXP(5, "Задание " + (idx + 1) + " выполнено", "task" + idx);
      if (done.size === TASKS.length) { P.badge("tasks"); P.confetti(); }
    }
  }
  renderTask();

  /* =========================================================
     5. Контрольные вопросы
     ========================================================= */
  const FAQ = [
    ["Как установить и импортировать библиотеку requests в Python?", "<p>Установка одной командой в терминале. В Google Colab requests уже стоит, но команду можно выполнить в ячейке с восклицательным знаком: <code>!pip install requests</code>.</p><pre class=\"code\">" + P.hlPy("pip install requests") + "</pre><p>Подключение в начале скрипта:</p><pre class=\"code\">" + P.hlPy("import requests") + "</pre>"],
    ["Какие основные HTTP-методы можно использовать с библиотекой requests? Приведите примеры.", "<p>У каждого метода своя функция: <code>GET</code> — получить, <code>POST</code> — создать, <code>PUT</code> — заменить, <code>PATCH</code> — частично изменить, <code>DELETE</code> — удалить, <code>HEAD</code> — только заголовки, <code>OPTIONS</code> — какие методы разрешены.</p><pre class=\"code\">" + P.hlPy('requests.get(url)\nrequests.post(url, json={"title": "foo"})\nrequests.put(url, json={"title": "new"})\nrequests.patch(url, json={"title": "new"})\nrequests.delete(url)') + "</pre>"],
    ["Как отправить GET-запрос с помощью requests и вывести ответ сервера?", "<pre class=\"code\">" + P.hlPy('response = requests.get("' + JP + '/posts/1")\nprint(response.text)    # ответ как строка\nprint(response.json())  # ответ как словарь') + "</pre><p><code>.text</code> — сырой текст, <code>.json()</code> — уже разобранные данные.</p>"],
    ["Как отправить POST-запрос с данными, используя библиотеку requests?", "<pre class=\"code\">" + P.hlPy('data = {"title": "foo", "body": "bar", "userId": 1}\nresponse = requests.post("' + JP + '/posts", json=data)') + "</pre><p><code>json=</code> отправляет JSON и сам ставит заголовок Content-Type. <code>data=</code> отправляет данные как веб-форму; так делают, когда сервер ждёт именно форму.</p>"],
    ["Как обрабатывать статус-коды ответа от API в requests?", "<pre class=\"code\">" + P.hlPy('if response.status_code == 200:\n    print("Success!")\nelif response.status_code == 404:\n    print("Не найдено")\nelse:\n    print("Ошибка:", response.status_code)') + "</pre><p>Ещё два способа: <code>response.ok</code> (True, если код меньше 400) и <code>response.raise_for_status()</code>, который выбрасывает исключение на кодах 4xx и 5xx.</p>"],
    ["Как получить и обработать JSON-ответ от сервера с помощью requests?", "<pre class=\"code\">" + P.hlPy('user = requests.get("' + JP + '/users/1").json()\nprint(user["name"])             # Leanne Graham\nprint(user["address"]["city"])  # Gwenborough') + "</pre><p><code>.json()</code> превращает объект JSON в словарь, а массив JSON — в список.</p>"],
    ["Как передавать параметры в строке запроса при выполнении GET-запроса?", "<pre class=\"code\">" + P.hlPy('response = requests.get("' + JP + '/posts", params={"userId": 1})\nprint(response.url)  # …/posts?userId=1') + "</pre><p>requests сам допишет <code>?userId=1</code> к адресу и закодирует спецсимволы.</p>"],
    ["Как добавить заголовки (headers) в API-запрос с использованием requests?", "<pre class=\"code\">" + P.hlPy('headers = {\n    "User-Agent": "MyPythonApp",\n    "Authorization": "Bearer <токен>",\n}\nresponse = requests.get(url, headers=headers)') + "</pre><p>Заголовки — словарь. Частые: <code>User-Agent</code>, <code>Content-Type</code>, <code>Accept</code>, <code>Authorization</code>.</p>"]
  ];
  $("#faqList").innerHTML = FAQ.map((f, i) => '<details data-i="' + i + '"><summary><span class="qn">' + (i + 1) + "</span><span>" + esc(f[0]) + '</span></summary><div class="ans">' + f[1] + "</div></details>").join("");
  const opened = new Set();
  $$("#faqList details").forEach(d => d.addEventListener("toggle", () => {
    if (!d.open) return; opened.add(d.dataset.i);
    if (opened.size === FAQ.length) { P.badge("faq"); P.addXP(10, "Все вопросы изучены", "faq"); }
  }));

  /* =========================================================
     6. Шпаргалка
     ========================================================= */
  const CHEAT = [
    ["Шаблон любого запроса", 'import requests\n\nresponse = requests.get(\n    url,\n    params={"userId": 1},          # в адрес после ?\n    headers={"User-Agent": "App"}, # пометки на конверте\n    timeout=5,                     # не ждать вечно\n)'],
    ["Что лежит в ответе", "response.status_code   # 200, 404, 500…\nresponse.ok            # True, если код < 400\nresponse.json()        # тело как словарь / список\nresponse.text          # тело как строка\nresponse.headers       # заголовки ответа\nresponse.cookies       # cookies\nresponse.url           # итоговый адрес"],
    ["Создать, изменить, удалить", "requests.post(url, json=data)    # создать   → 201\nrequests.put(url, json=data)     # заменить  → 200\nrequests.patch(url, json=data)   # поправить → 200\nrequests.delete(url)             # удалить   → 200 / 204"],
    ["Надёжный запрос", 'try:\n    r = requests.get(url, timeout=5)\n    r.raise_for_status()   # 4xx/5xx → исключение\n    data = r.json()\nexcept requests.exceptions.RequestException as e:\n    print("Ошибка запроса:", e)'],
    ["Логин, токен, cookies", 'requests.get(url, auth=("postman", "password"))   # Basic Auth\nrequests.get(url, headers={"Authorization": "Bearer " + token})\n\ns = requests.Session()   # помнит cookies\ns.get(url1)\ns.get(url2)'],
    ["Коды, которые надо знать", "200 OK            201 Created       204 No Content\n301 Moved         400 Bad Request   401 Unauthorized\n403 Forbidden     404 Not Found     429 Too Many Requests\n500 Server Error"]
  ];
  $("#cheatList").innerHTML = CHEAT.map((c, i) => '<div class="panel"><h3>' + esc(c[0]) + '</h3><div class="code-wrap"><pre class="code" id="ch' + i + '">' + P.hlPy(c[1]) + '</pre><button class="copy" type="button" data-copy="ch' + i + '">Копировать</button></div></div>').join("");
  P.bindCopy($("#cheatList"));

  /* подсветка пункта меню при прокрутке */
  if ("IntersectionObserver" in window) {
    const links = $$(".top nav a");
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) links.forEach(a => a.classList.toggle("on", a.getAttribute("href") === "#" + e.target.id)); }), { rootMargin: "-40% 0px -55% 0px" });
    ["how", "builder", "tasks", "games", "faq", "cheat"].forEach(id => { const el = document.getElementById(id); if (el) io.observe(el); });
  }
})();
