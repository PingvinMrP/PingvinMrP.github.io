/* Почта для Python — игры: «Почтальон», «Какой штамп?», «Найди ошибку». */
(function () {
  "use strict";
  const P = window.PP, { $, $$, esc, wait } = P;
  const JP = P.HOSTS.jp.url;

  /* переключение игр */
  $$(".game-tab").forEach(t => t.addEventListener("click", () => {
    $$(".game-tab").forEach(x => x.setAttribute("aria-selected", x === t));
    ["letter", "codes", "bugs"].forEach(g => $("#game-" + g).hidden = g !== t.dataset.g);
    if (t.dataset.g === "codes" && !codesStarted) codesIntro();
  }));

  /* =========================================================
     Игра 1. Почтальон
     ========================================================= */
  const G_METH = ["GET", "POST", "PUT", "DELETE"];
  const G_PATHS = ["/posts", "/posts/1", "/users/1", "/users"];
  const G_EXTRA = { none: "ничего", params: 'params={"userId": 1}', headers: 'headers={"User-Agent": "MyPythonApp"}', json: 'json={"title": "…"}' };
  const G_READ = { json: "response.json()", name: 'response.json()["name"]', status: "response.status_code", len: "len(response.json())" };
  const MISSIONS = [
    { t: "Прочитать пост №1", d: "Нужен весь пост целиком, как словарь.", a: { m: "GET", p: "/posts/1", x: "none", r: "json" } },
    { t: "Узнать имя пользователя №1", d: "Нужна только строка с именем.", a: { m: "GET", p: "/users/1", x: "none", r: "name" } },
    { t: "Сколько постов у пользователя 1?", d: "Нужно одно число — количество его постов.", a: { m: "GET", p: "/posts", x: "params", r: "len" } },
    { t: "Опубликовать новый пост", d: "Создайте запись и посмотрите, что сервер вернул.", a: { m: "POST", p: "/posts", x: "json", r: "json" } },
    { t: "Удалить пост №1", d: "Ответ будет пустым, но надо понять, получилось ли.", a: { m: "DELETE", p: "/posts/1", x: "none", r: "status" } },
    { t: "Представиться серверу", d: "Запросите пост №1 так, чтобы сервер видел: пишет MyPythonApp.", a: { m: "GET", p: "/posts/1", x: "headers", r: "json" } },
    { t: "Исправить пост №1", d: "Замените пост №1 новым содержимым.", a: { m: "PUT", p: "/posts/1", x: "json", r: "json" } }
  ];
  const EXPL = {
    m: { GET: "Получить данные — метод GET.", POST: "Создать новое — метод POST.", PUT: "Заменить существующее — метод PUT.", DELETE: "Удалить — метод DELETE." },
    p: { "/posts": "Работаем со списком постов: адрес /posts.", "/posts/1": "Нужен конкретный пост: /posts/1.", "/users/1": "Нужен пользователь №1: /users/1.", "/users": "Нужен список пользователей: /users." },
    x: { none: "Добавлять ничего не нужно.", params: "Фильтр по пользователю передают в params.", headers: "Представиться — это заголовок User-Agent.", json: "Новые данные едут во вложении: json=…" },
    r: { json: "Весь ответ как словарь — response.json().", name: "Одно поле из словаря — response.json()[\"name\"].", status: "Успех удаления проверяют по статус-коду.", len: "Количество элементов списка — len(response.json())." }
  };
  let gi = 0, gscore = 0, gres = [], gsel = {};
  const gMax = MISSIONS.length * 5;
  function gProgress() {
    return '<div class="game-bar"><div class="progress">' + MISSIONS.map((_, i) => '<i class="' + (gres[i] === true ? "ok" : gres[i] === false ? "bad" : i === gi ? "cur" : "") + '"></i>').join("") +
      '</div><div class="score">' + gscore + " " + P.plural(gscore, ["очко", "очка", "очков"]) + " из " + gMax + "</div></div>";
  }
  function renderLetter() {
    const root = $("#game-letter");
    if (gi >= MISSIONS.length) {
      const perfect = gres.filter(Boolean).length;
      root.innerHTML = gProgress() + '<div class="verdict" style="--vc:var(--accent)"><span class="vt">Смена окончена: ' + gscore + " из " + gMax + "</span><p>Идеальных писем: " + perfect + " из " + MISSIONS.length + ". " +
        (perfect === MISSIONS.length ? "Вы пишете запросы без подсказок." : "Загляните в конструктор выше и попробуйте ещё раз.") + '</p><div class="row"><button class="btn" type="button" id="gAgain">Сыграть снова</button></div></div>';
      if (perfect === MISSIONS.length) { P.badge("letter"); P.confetti(); }
      P.addXP(Math.round(gscore / 2), "Игра «Почтальон» пройдена", "letter-" + gscore);
      $("#gAgain").addEventListener("click", () => { gi = 0; gscore = 0; gres = []; renderLetter(); });
      return;
    }
    const M = MISSIONS[gi]; gsel = {};
    const col = (key, title, opts) => '<div class="step"><h3>' + title + '</h3><div class="opts">' + Object.keys(opts).map(k => '<button type="button" class="opt" data-k="' + key + '" data-v="' + esc(k) + '" aria-pressed="false">' + esc(opts[k]) + "</button>").join("") + "</div></div>";
    root.innerHTML = gProgress() +
      '<div class="mission"><span class="eyebrow">Задача ' + (gi + 1) + " из " + MISSIONS.length + '</span><span class="t">' + esc(M.t) + '</span><span class="note">' + esc(M.d) + "</span></div>" +
      '<div class="steps">' + col("m", "1. Метод", Object.fromEntries(G_METH.map(x => [x, x]))) + col("p", "2. Адрес", Object.fromEntries(G_PATHS.map(x => [x, x]))) + col("x", "3. Что добавить", G_EXTRA) + col("r", "4. Как прочитать ответ", G_READ) + "</div>" +
      '<div class="row"><button class="btn big" type="button" id="gSend" disabled>✉ Отправить письмо</button><span class="hint" id="gHint">Выберите по одному варианту в каждой колонке</span></div><div id="gVerdict"></div>';
    let locked = false;
    $$(".opt", root).forEach(b => b.addEventListener("click", () => {
      if (locked) return; const k = b.dataset.k; gsel[k] = b.dataset.v;
      $$('.opt[data-k="' + k + '"]', root).forEach(x => x.setAttribute("aria-pressed", x === b));
      const n = Object.keys(gsel).length; $("#gSend").disabled = n < 4;
      $("#gHint").textContent = n < 4 ? "Осталось выбрать: " + (4 - n) : "Письмо собрано, отправляйте";
    }));
    $("#gSend").addEventListener("click", () => {
      locked = true; $("#gSend").disabled = true;
      let pts = 0; const miss = [];
      ["m", "p", "x", "r"].forEach(k => {
        if (gsel[k] === M.a[k]) pts++; else miss.push(k);
        $$('.opt[data-k="' + k + '"]', root).forEach(x => { if (x.dataset.v === M.a[k]) x.classList.add("right"); else if (x.dataset.v === gsel[k]) x.classList.add("wrong"); });
      });
      const perfect = pts === 4; if (perfect) pts++; gscore += pts; gres[gi] = perfect;
      const req = { method: gsel.m, path: gsel.p, params: gsel.x === "params" ? { userId: 1 } : {}, headers: gsel.x === "headers" ? { "User-Agent": "MyPythonApp" } : {}, body: gsel.x === "json" && ["POST", "PUT"].includes(gsel.m) ? '{"title": "Новый заголовок", "userId": 1}' : null };
      const res = P.serve("jp", req);
      const args = ['"' + JP + M.a.p + '"']; if (M.a.x !== "none") args.push(G_EXTRA[M.a.x].replace("…", "Новый заголовок"));
      const code = "response = requests." + M.a.m.toLowerCase() + "(" + args.join(", ") + ")\nprint(" + G_READ[M.a.r] + ")";
      $("#gVerdict").innerHTML = '<div class="verdict" style="--vc:' + (perfect ? "var(--ok)" : "var(--warn)") + '"><span class="vt">' + (perfect ? "Идеальное письмо! +5" : "Почти. +" + pts) + "</span>" +
        (miss.length ? '<ul style="margin:0;padding-left:1.1em">' + miss.map(k => "<li>" + esc(EXPL[k][M.a[k]]) + "</li>").join("") + "</ul>" : "") +
        '<p class="note">Правильный код:</p><pre class="code">' + P.hlPy(code) + '</pre><p class="note">Ваше письмо сервер обработал так: штамп <b style="color:' + P.statusColor(res.status) + '">' + res.status + " " + P.STATUS_TEXT[res.status] + "</b>. " + esc(res.why) + "</p>" +
        '<div class="row"><button class="btn" type="button" id="gNext">' + (gi + 1 < MISSIONS.length ? "Следующая задача →" : "Итоги") + "</button></div></div>";
      $(".game-bar", root).outerHTML = gProgress();
      $("#gNext").addEventListener("click", () => { gi++; renderLetter(); $("#game-letter").scrollIntoView({ behavior: P.reduce ? "auto" : "smooth", block: "start" }); });
    });
  }
  renderLetter();

  /* =========================================================
     Игра 2. Какой штамп?
     ========================================================= */
  const CODES = [[200, "OK"], [201, "Created"], [204, "No Content"], [301, "Moved"], [400, "Bad Request"], [401, "Unauthorized"], [403, "Forbidden"], [404, "Not Found"], [429, "Too Many"], [500, "Server Error"]];
  const SIT = [
    ["Запросили пост №1, он существует, сервер прислал его.", 200, "Всё хорошо: данные найдены и отправлены."],
    ["Отправили POST, и сервер создал новый пост с id 101.", 201, "Created: на сервере появилось что-то новое."],
    ["Опечатались в адресе: /postz/1 вместо /posts/1.", 404, "Такого адреса нет — «адресат не найден»."],
    ["Обратились к GigaChat API и забыли заголовок Authorization с токеном.", 401, "Unauthorized: сервер не знает, кто вы. Нужен токен."],
    ["Токен правильный, но вы пытаетесь прочитать чужие закрытые данные.", 403, "Forbidden: сервер знает, кто вы, но доступа у вас нет."],
    ["Скрипт в цикле отправил 500 запросов за секунду.", 429, "Too Many Requests: превышен лимит. Нужно подождать."],
    ["На сервере упала база данных, хотя ваш запрос правильный.", 500, "Ошибка на стороне сервера. Вы ни при чём."],
    ["Отправили JSON с одинарными кавычками: {'title': 'foo'}.", 400, "Bad Request: сервер не понял письмо. В JSON только двойные кавычки."],
    ["Сайт переехал на новый адрес, и сервер сообщает, куда идти.", 301, "Moved Permanently: письмо переслали, requests пойдёт по новому адресу сам."],
    ["Удалили запись, сервер подтвердил и больше ничего не прислал.", 204, "No Content: успех, но тело ответа пустое."]
  ];
  const TIME = 15;
  let codesStarted = false, ci = 0, cscore = 0, cstreak = 0, cbest = 0, corder = [], ctimer = null, cleft = TIME;
  function codesIntro() {
    $("#game-codes").innerHTML = '<div class="big-card"><span class="eyebrow">Как играть</span><p class="situation">Сервер получил письмо. Какой штамп он поставит на ответ? 10 ситуаций, на каждую ' + TIME + ' секунд. Быстрый верный ответ — больше очков.</p><div class="row"><button class="btn big" type="button" id="cStart">Начать</button><span class="hint">Подсказка: первая цифра. 2 — успех, 4 — ваша ошибка, 5 — ошибка сервера.</span></div></div>';
    $("#cStart").addEventListener("click", startCodes);
  }
  function startCodes() { codesStarted = true; ci = 0; cscore = 0; cstreak = 0; cbest = 0; corder = P.shuffle(SIT); renderCodes(); }
  function renderCodes() {
    clearInterval(ctimer);
    const root = $("#game-codes");
    if (ci >= corder.length) {
      const right = corder.filter(s => s.ok).length;
      const msg = right >= 9 ? "Вы читаете штампы как почтальон со стажем." : right >= 6 ? "Хорошо. Перечитайте легенду кодов в первой части и попробуйте ещё раз." : "Посмотрите легенду 2xx / 4xx / 5xx в первой части: по первой цифре уже многое понятно.";
      root.innerHTML = '<div class="big-card"><span class="eyebrow">Итог</span><p class="situation">' + right + " из " + corder.length + " верно · " + cscore + " очков · лучшая серия " + cbest + '</p><p class="lead">' + msg + '</p><div class="row"><button class="btn" type="button" id="cAgain">Ещё раз</button></div></div>';
      if (right === corder.length) { P.badge("codes"); P.confetti(); }
      P.addXP(right, "Игра «Какой штамп?»", "codes-" + right);
      $("#cAgain").addEventListener("click", startCodes); return;
    }
    const s = corder[ci];
    root.innerHTML = '<div class="big-card"><div class="game-bar"><span class="eyebrow">Ситуация ' + (ci + 1) + " из " + corder.length + '</span><span class="score">' + cscore + " очков" + (cstreak > 1 ? " · серия ×" + cstreak : "") + '</span></div><div class="timer"><i id="cBar"></i></div>' +
      '<p class="situation">' + esc(s[0]) + '</p><div class="codes">' + CODES.map(([c, n]) => '<button type="button" class="codebtn" data-c="' + c + '">' + c + "<small>" + n + "</small></button>").join("") + '</div><div id="cFb" aria-live="polite"></div></div>';
    let locked = false; cleft = TIME;
    const bar = $("#cBar"); bar.style.transition = "none"; bar.style.width = "100%";
    requestAnimationFrame(() => { bar.style.transition = "width " + TIME + "s linear"; bar.style.width = "0%"; });
    ctimer = setInterval(() => { cleft--; if (cleft <= 0) { clearInterval(ctimer); answer(null); } }, 1000);
    function answer(c) {
      if (locked) return; locked = true; clearInterval(ctimer);
      const cs = getComputedStyle(bar).width; bar.style.transition = "none"; bar.style.width = cs;
      const ok = c === s[1]; s.ok = ok;
      if (ok) { cstreak++; cbest = Math.max(cbest, cstreak); cscore += 10 + cleft + (cstreak > 2 ? 5 : 0); } else cstreak = 0;
      $$(".codebtn", root).forEach(x => { if (+x.dataset.c === s[1]) x.classList.add("right"); else if (+x.dataset.c === c) x.classList.add("wrong"); });
      if (!ok) root.querySelector(".big-card").classList.add("shake");
      $("#cFb").innerHTML = '<div class="verdict" style="--vc:' + (ok ? "var(--ok)" : "var(--stamp)") + '"><span class="vt">' + (ok ? "Верно! +" + (10 + cleft + (cstreak > 2 ? 5 : 0)) : c == null ? "Время вышло. Ответ: " + s[1] : "Правильный ответ: " + s[1]) + "</span><p>" + esc(s[2]) + '</p><div class="row"><button class="btn" type="button" id="cNext">' + (ci + 1 < corder.length ? "Дальше →" : "Итог") + "</button></div></div>";
      $("#cNext").focus({ preventScroll: true });
      $("#cNext").addEventListener("click", () => { ci++; renderCodes(); });
    }
    $$(".codebtn", root).forEach(b => b.addEventListener("click", () => answer(+b.dataset.c)));
  }
  codesIntro();

  /* =========================================================
     Игра 3. Найди ошибку
     ========================================================= */
  const BUGS = [
    { goal: "Вывести пост №1.", code: 'import requests\n\nresponse = request.get("' + JP + '/posts/1")\nprint(response.json())', bad: [2], fix: 'response = requests.get("' + JP + '/posts/1")', why: "Библиотека называется requests, с буквой s. Слова request Python не знает: NameError." },
    { goal: "Напечатать Success!, если сервер ответил 200.", code: 'import requests\n\nresponse = requests.get("' + JP + '/posts/1")\nif response.status_code = 200:\n    print("Success!")', bad: [3], fix: "if response.status_code == 200:", why: "Сравнение пишется двумя знаками ==. Один = — это присваивание, будет SyntaxError." },
    { goal: "Вывести имя пользователя №1.", code: 'import requests\n\nuser = requests.get("' + JP + '/users/1").json\nprint(user["name"])', bad: [2], fix: 'user = requests.get("' + JP + '/users/1").json()', why: "json — это метод, его надо вызвать со скобками: .json(). Без скобок в user окажется сама функция. Ошибка вылезет строкой ниже, но причина здесь." },
    { goal: "Посчитать посты пользователя 1.", code: 'import requests\n\nresponse = requests.get("' + JP + '/posts",\n                        param={"userId": 1})\nprint(len(response.json()))', bad: [3], fix: '                        params={"userId": 1})', why: "Аргумент называется params, во множественном числе. С param будет TypeError: unexpected keyword argument." },
    { goal: "Отправить запрос с заголовком User-Agent: MyPythonApp.", code: 'import requests\n\nheaders = ["User-Agent", "MyPythonApp"]\nresponse = requests.get("' + JP + '/posts/1", headers=headers)\nprint(response.status_code)', bad: [2], fix: 'headers = {"User-Agent": "MyPythonApp"}', why: "Заголовки передаются словарём «имя: значение» в фигурных скобках. Список requests не поймёт." },
    { goal: "Вывести пост №1.", code: 'import requests\n\nresponse = requests.get("jsonplaceholder.typicode.com/posts/1")\nprint(response.json())', bad: [2], fix: 'response = requests.get("https://jsonplaceholder.typicode.com/posts/1")', why: "Нет протокола https://. requests выбросит MissingSchema: он не знает, как доставлять письмо." },
    { goal: "Напечатать «Ошибка запроса», если адрес неверный. Сейчас программа печатает {}.", code: 'import requests\n\ntry:\n    response = requests.get("' + JP + '/invalid-url")\n    print(response.json())\nexcept requests.exceptions.RequestException:\n    print("Ошибка запроса")', bad: [3, 4], fix: '    response = requests.get("' + JP + '/invalid-url")\n    response.raise_for_status()\n    print(response.json())', why: "Код 404 сам по себе не считается ошибкой. Между запросом и print нужна строка response.raise_for_status() — тогда сработает except." },
    { goal: "Создать пост с заголовком foo.", code: 'import requests\n\nresponse = requests.post("' + JP + '/posts",\n                         json=\'{"title": "foo"}\')\nprint(response.json())', bad: [3], fix: '                         json={"title": "foo"})', why: "В json= передают словарь, а не строку. Строку requests упакует как текст, и сервер не увидит поле title." },
    { goal: "Вывести имя пользователя №1.", code: 'import requests\n\nresponse = requests.get("' + JP + '/users/1")\nuser = response.json()\nprint(user.name)', bad: [4], fix: 'print(user["name"])', why: "Значение из словаря достают квадратными скобками: user[\"name\"]. Запись user.name даст AttributeError." },
    { goal: "Удалить пост №1.", code: 'import requests\n\nresponse = requests.delete("' + JP + '/posts")\nprint(response.status_code)', bad: [2], fix: 'response = requests.delete("' + JP + '/posts/1")', why: "Удаляют конкретную запись. Без номера в адресе сервер не поймёт, что удалять, и ответит 404." }
  ];
  let bi = 0, bscore = 0, border = [];
  function startBugs() { bi = 0; bscore = 0; border = P.shuffle(BUGS).slice(0, 8); renderBugs(); }
  function renderBugs() {
    const root = $("#game-bugs");
    if (bi >= border.length) {
      root.innerHTML = '<div class="big-card"><span class="eyebrow">Итог</span><p class="situation">Найдено с первой попытки: ' + bscore + " из " + border.length + '</p><p class="lead">' + (bscore === border.length ? "Ни одна ошибка не прошла мимо вас." : "Большинство ошибок в запросах — это опечатки в названиях и забытые скобки. Проверяйте их первыми.") + '</p><div class="row"><button class="btn" type="button" id="bAgain">Ещё раз</button></div></div>';
      if (bscore === border.length) { P.badge("bugs"); P.confetti(); }
      P.addXP(bscore * 2, "Игра «Найди ошибку»", "bugs-" + bscore);
      $("#bAgain").addEventListener("click", startBugs); return;
    }
    const b = border[bi]; let tries = 0, over = false;
    root.innerHTML = '<div class="big-card"><div class="game-bar"><span class="eyebrow">Баг ' + (bi + 1) + " из " + border.length + '</span><span class="score">' + bscore + ' найдено</span></div>' +
      '<p class="situation">Задача программы: ' + esc(b.goal) + '</p><p class="note">В коде одна ошибка. Нажмите на строку, где она прячется.</p><pre class="code" id="bCode">' + P.hlLines(b.code) + '</pre><div id="bFb" aria-live="polite"></div></div>';
    $$("#bCode .ln").forEach(l => {
      if (!l.textContent.trim()) return;
      l.classList.add("click"); l.tabIndex = 0; l.setAttribute("role", "button");
      const act = () => {
        if (over) return; const i = +l.dataset.i; tries++;
        if (b.bad.includes(i)) { over = true; l.classList.add("good"); if (tries === 1) bscore++; finish(true); }
        else {
          l.classList.add("bad"); $("#bCode").classList.remove("shake"); void $("#bCode").offsetWidth; $("#bCode").classList.add("shake");
          if (tries >= 2) { over = true; b.bad.forEach(k => $$("#bCode .ln")[k].classList.add("good")); finish(false); }
          else $("#bFb").innerHTML = '<p class="note" style="color:var(--warn)">Не здесь. Подсказка: проверьте названия, скобки и кавычки. Осталась одна попытка.</p>';
        }
      };
      l.addEventListener("click", act); l.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); act(); } });
    });
    function finish(ok) {
      $("#bFb").innerHTML = '<div class="verdict" style="--vc:' + (ok ? "var(--ok)" : "var(--stamp)") + '"><span class="vt">' + (ok ? (tries === 1 ? "Нашли с первой попытки!" : "Нашли!") : "Ошибка была в подсвеченной строке") + "</span><p>" + esc(b.why) + '</p><p class="note">Как правильно:</p><pre class="code">' + P.hlPy(b.fix) + '</pre><div class="row"><button class="btn" type="button" id="bNext">' + (bi + 1 < border.length ? "Следующий баг →" : "Итог") + "</button></div></div>";
      $("#bNext").addEventListener("click", () => { bi++; renderBugs(); });
    }
  }
  startBugs();
})();
