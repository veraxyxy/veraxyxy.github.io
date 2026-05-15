(function () {
  "use strict";

  var STORAGE_KEY = "miaomiao-baba-stats-v1";
  var params = new URLSearchParams(window.location.search);
  var QUICK = params.has("quick");
  var FOCUS_SEC = QUICK ? 12 : 50 * 60;
  var REST_SEC = QUICK ? 5 : 3 * 60;
  /** 到点提示浮层：自动进入休息前的阅读时间（秒） */
  var BREAK_MODAL_SEC = 8;

  var STORAGE_IMG_WORK = "miaomiao-baba-img-work-data";
  var STORAGE_IMG_REST = "miaomiao-baba-img-rest-data";
  var STORAGE_BIRTHDAY_SPLASH = "miaomiao-baba-birthday-seen-v1";
  var DEFAULT_IMG_WORK = "assets/miaomiao-work.png";
  var DEFAULT_IMG_REST = "assets/miaomiao-rest.png";

  /** 照片下方轮换文案，间隔宜慢，避免干扰专注 */
  var CHEER_ROTATE_MS = 36000;
  var CHEERS_IDLE = [
    "秒秒很乖不闹，等爸爸。",
    "爸爸记得多喝水哦。",
    "爸爸是最厉害的！",
    "爸爸，我好喜欢你呀～",
    "爸爸别太辛苦啦，要注意身体哦！",
    "爸爸多站起来活动一下呀！",
    "爸爸眼睛累了吗？记得多眨眨眼。",
    "忙完记得伸伸懒腰嘛。",
    "爸爸按时吃饭，秒秒才开心。",
    "秒秒攒了好多抱抱，等爸爸来领。",
    "今天也要照顾好自己呀，爸爸。",
    "秒秒就在这里陪爸爸。",
  ];

  var RELAX_ITEMS = [
    {
      id: "photo",
      title: "看看本宝宝照片吧",
      sub: "手机里我最可爱的那张，等爸爸来翻～",
      icon:
        '<svg class="relax-icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="8.5" cy="10" r="1.2" fill="currentColor"/><path d="M21 17l-5-5-4 4-2-2-5 5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    },
    {
      id: "play",
      title: "爸爸陪陪我玩吧",
      sub: "离开电脑一小下下，本宝宝想你啦。",
      icon:
        '<svg class="relax-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="9" cy="10" r="1.2" fill="currentColor"/><circle cx="15" cy="10" r="1.2" fill="currentColor"/><path d="M9 15c1.2 2 4.8 2 6 0" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
    },
    {
      id: "tea",
      title: "看爸爸泡香香茶",
      sub: "热水咕嘟咕嘟，秒秒在旁边陪你喘口气～",
      icon:
        '<svg class="relax-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 8h8v8a4 4 0 0 1-8 0V8z" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M14 10h2a2.5 2.5 0 0 1 0 5h-2" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M8 20h4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
    },
    {
      id: "music",
      title: "陪本宝宝听首歌嘛",
      sub: "一首刚好～爸爸的耳朵借我一下下。",
      icon:
        '<svg class="relax-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18V6l12-2v12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="7" cy="18" r="3" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="19" cy="16" r="3" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>',
    },
    {
      id: "run",
      title: "带本宝宝下楼晃晃",
      sub: "跑两步也算数，本宝宝批准爸爸动一动！",
      icon:
        '<svg class="relax-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="14" cy="5" r="2" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M5 22l4-7 3 1 2-4 5 2-3 8" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 15l-3-2 2-3" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
    },
    {
      id: "nap",
      title: "爸爸闭眼充个电",
      sub: "三分钟盹儿，秒秒帮你守门，谁也不吵～",
      icon:
        '<svg class="relax-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 14a5 5 0 0 1 5-5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M3 18h11" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M16 10v4M18 12h-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
    },
  ];

  var state = "idle";
  var focusEndAt = 0;
  var restEndAt = 0;
  var selectedRelaxId = null;
  var cheerIndex = 0;
  var cheerTimer = null;
  var breakAutoTimer = null;
  var breakTickTimer = null;
  var stats = loadStats();

  var el = {
    body: document.body,
    cheer: document.getElementById("cheer-text"),
    petCalm: document.getElementById("pet-calm"),
    petPop: document.getElementById("pet-pop"),
    petImgWork: document.getElementById("pet-img-work"),
    petImgRest: document.getElementById("pet-img-rest"),
    petImgPop: document.getElementById("pet-img-pop"),
    timerLabel: document.getElementById("timer-label"),
    timerDisplay: document.getElementById("timer-display"),
    btnPrimary: document.getElementById("btn-primary"),
    relaxList: document.getElementById("relax-list"),
    statToday: document.getElementById("stat-today"),
    statSegments: document.getElementById("stat-segments"),
    modalRoot: document.getElementById("modal-root"),
    modalBackdrop: document.getElementById("modal-backdrop"),
    modalPaneBreak: document.getElementById("modal-pane-break"),
    modalPaneSummary: document.getElementById("modal-pane-summary"),
    breakCountdown: document.getElementById("break-countdown"),
    btnModalKnow: document.getElementById("btn-modal-know"),
    btnModalClose: document.getElementById("btn-modal-close"),
    btnNextSegment: document.getElementById("btn-next-segment"),
    btnLater: document.getElementById("btn-later"),
    summaryBody: document.getElementById("summary-body"),
    fileWork: document.getElementById("file-work"),
    fileRest: document.getElementById("file-rest"),
    btnResetPhotos: document.getElementById("btn-reset-photos"),
    panelWork: document.getElementById("panel-work"),
    panelRest: document.getElementById("panel-rest"),
    tabWork: document.getElementById("tab-work"),
    tabRest: document.getElementById("tab-rest"),
    birthdaySplash: document.getElementById("birthday-splash"),
    btnSplashEnter: document.getElementById("btn-splash-enter"),
  };

  function pad(n) {
    return n < 10 ? "0" + n : String(n);
  }

  function todayStr() {
    var d = new Date();
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }

  function loadStats() {
    var t = todayStr();
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { day: t, minutes: 0, segments: 0 };
      var d = JSON.parse(raw);
      if (!d || d.day !== t) return { day: t, minutes: 0, segments: 0 };
      return {
        day: t,
        minutes: Number(d.minutes) || 0,
        segments: Number(d.segments) || 0,
      };
    } catch (e) {
      return { day: t, minutes: 0, segments: 0 };
    }
  }

  function saveStats() {
    stats.day = todayStr();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
    } catch (e) {}
  }

  function formatMMSS(totalSec) {
    var s = Math.max(0, Math.floor(totalSec));
    var m = Math.floor(s / 60);
    var r = s % 60;
    return m + ":" + pad(r);
  }

  function markCutoutAlpha(img) {
    if (!img || !img.complete) return;
    try {
      var c = document.createElement("canvas");
      c.width = 1;
      c.height = 1;
      var ctx = c.getContext("2d");
      ctx.drawImage(img, 0, 0, 1, 1);
      var a = ctx.getImageData(0, 0, 1, 1).data[3];
      if (a < 250) img.classList.add("is-alpha");
      else img.classList.remove("is-alpha");
    } catch (e) {
      img.classList.remove("is-alpha");
    }
  }

  function bindCutoutImages() {
    [el.petImgWork, el.petImgRest, el.petImgPop].forEach(function (img) {
      if (!img) return;
      img.addEventListener("load", function () {
        markCutoutAlpha(img);
      });
      if (img.complete) markCutoutAlpha(img);
    });
  }

  function applyPetImagesFromStorage() {
    if (!el.petImgWork || !el.petImgRest || !el.petImgPop) return;
    var w = localStorage.getItem(STORAGE_IMG_WORK);
    var r = localStorage.getItem(STORAGE_IMG_REST);
    el.petImgWork.src = w || DEFAULT_IMG_WORK;
    el.petImgRest.src = r || DEFAULT_IMG_REST;
    el.petImgPop.src = r || DEFAULT_IMG_REST;
  }

  function readFileAsDataURL(file, onDone) {
    var reader = new FileReader();
    reader.onload = function () {
      onDone(reader.result);
    };
    reader.readAsDataURL(file);
  }

  function bindPhotoSettings() {
    el.fileWork.addEventListener("change", function () {
      var f = el.fileWork.files && el.fileWork.files[0];
      if (!f) return;
      readFileAsDataURL(f, function (data) {
        try {
          localStorage.setItem(STORAGE_IMG_WORK, data);
          applyPetImagesFromStorage();
        } catch (err) {
          window.alert("存不下这张啦，换一张小一点的图试试。");
        }
      });
    });
    el.fileRest.addEventListener("change", function () {
      var f = el.fileRest.files && el.fileRest.files[0];
      if (!f) return;
      readFileAsDataURL(f, function (data) {
        try {
          localStorage.setItem(STORAGE_IMG_REST, data);
          applyPetImagesFromStorage();
        } catch (err) {
          window.alert("存不下这张啦，换一张小一点的图试试。");
        }
      });
    });
    el.btnResetPhotos.addEventListener("click", function () {
      localStorage.removeItem(STORAGE_IMG_WORK);
      localStorage.removeItem(STORAGE_IMG_REST);
      el.fileWork.value = "";
      el.fileRest.value = "";
      applyPetImagesFromStorage();
    });
  }

  function setMainTab(which) {
    var isWork = which === "work";
    if (isWork) {
      el.panelWork.removeAttribute("hidden");
      el.panelRest.setAttribute("hidden", "");
    } else {
      el.panelRest.removeAttribute("hidden");
      el.panelWork.setAttribute("hidden", "");
    }
    el.tabWork.classList.toggle("is-active", isWork);
    el.tabRest.classList.toggle("is-active", !isWork);
    el.tabWork.setAttribute("aria-selected", isWork ? "true" : "false");
    el.tabRest.setAttribute("aria-selected", isWork ? "false" : "true");
    el.tabWork.setAttribute("tabindex", isWork ? "0" : "-1");
    el.tabRest.setAttribute("tabindex", isWork ? "-1" : "0");
  }

  function clearBreakReminderTimers() {
    if (breakAutoTimer) {
      window.clearTimeout(breakAutoTimer);
      breakAutoTimer = null;
    }
    if (breakTickTimer) {
      window.clearInterval(breakTickTimer);
      breakTickTimer = null;
    }
  }

  function closeModal() {
    clearBreakReminderTimers();
    el.modalRoot.classList.remove("is-open");
    el.modalRoot.setAttribute("aria-hidden", "true");
    el.modalPaneBreak.classList.add("is-hidden");
    el.modalPaneSummary.classList.add("is-hidden");
  }

  function openModalBreak() {
    clearBreakReminderTimers();
    el.modalPaneSummary.classList.add("is-hidden");
    el.modalPaneBreak.classList.remove("is-hidden");
    el.modalRoot.classList.add("is-open");
    el.modalRoot.setAttribute("aria-hidden", "false");

    var deadline = Date.now() + BREAK_MODAL_SEC * 1000;
    function updateCountdown() {
      if (state !== "break_prompt") return;
      var s = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      el.breakCountdown.textContent =
        s > 0
          ? "再等 " + s + " 秒，秒秒就来牵爸爸去休息啦～"
          : "来啦来啦，马上陪秒秒～";
    }
    updateCountdown();
    breakTickTimer = window.setInterval(updateCountdown, 250);

    breakAutoTimer = window.setTimeout(function () {
      if (state !== "break_prompt") return;
      startRest();
    }, BREAK_MODAL_SEC * 1000);
  }

  function openModalSummary() {
    clearBreakReminderTimers();
    el.modalPaneBreak.classList.add("is-hidden");
    el.modalPaneSummary.classList.remove("is-hidden");
    el.modalRoot.classList.add("is-open");
    el.modalRoot.setAttribute("aria-hidden", "false");
  }

  function setBodyState(name) {
    el.body.className = "";
    el.body.classList.add("state-" + name);
  }

  function stopCheerRotate() {
    if (cheerTimer) {
      window.clearInterval(cheerTimer);
      cheerTimer = null;
    }
  }

  function setCheerText(text) {
    el.cheer.classList.add("is-fading");
    window.setTimeout(function () {
      el.cheer.textContent = text;
      el.cheer.classList.remove("is-fading");
    }, 280);
  }

  function startCheerRotate() {
    stopCheerRotate();
    cheerIndex = 0;
    el.cheer.textContent = CHEERS_IDLE[0];
    el.cheer.classList.remove("is-fading");
    cheerTimer = window.setInterval(function () {
      cheerIndex = (cheerIndex + 1) % CHEERS_IDLE.length;
      setCheerText(CHEERS_IDLE[cheerIndex]);
    }, CHEER_ROTATE_MS);
  }

  function renderRelaxList() {
    el.relaxList.innerHTML = "";
    RELAX_ITEMS.forEach(function (item) {
      var li = document.createElement("li");
      li.className = "relax-item is-disabled";
      li.dataset.id = item.id;
      li.setAttribute("role", "button");
      li.setAttribute("tabindex", "0");
      li.innerHTML =
        item.icon +
        '<div class="relax-text"><p class="relax-title">' +
        item.title +
        '</p><p class="relax-sub">' +
        item.sub +
        "</p></div>";
      li.addEventListener("click", onRelaxClick);
      li.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onRelaxClick.call(li, e);
        }
      });
      el.relaxList.appendChild(li);
    });
  }

  function setRelaxDisabled(disabled) {
    var items = el.relaxList.querySelectorAll(".relax-item");
    items.forEach(function (node) {
      if (disabled) node.classList.add("is-disabled");
      else node.classList.remove("is-disabled");
    });
  }

  function updateRelaxSelection() {
    var items = el.relaxList.querySelectorAll(".relax-item");
    items.forEach(function (node) {
      node.classList.toggle("is-selected", node.dataset.id === selectedRelaxId);
    });
  }

  function onRelaxClick(e) {
    var li = e.currentTarget;
    if (li.classList.contains("is-disabled")) return;
    if (state !== "rest") return;
    selectedRelaxId = li.dataset.id;
    updateRelaxSelection();
  }

  function updateFooterStats() {
    el.statToday.textContent = String(stats.minutes);
    el.statSegments.textContent = String(stats.segments);
  }

  function setPet(mode) {
    var pop = mode === "pop";
    el.petCalm.classList.toggle("is-hidden", pop);
    el.petPop.classList.toggle("is-hidden", !pop);
    el.petCalm.setAttribute("aria-hidden", pop ? "true" : "false");
    el.petPop.setAttribute("aria-hidden", !pop ? "true" : "false");
    if (!pop) {
      var showRest = state === "rest";
      el.petImgWork.classList.toggle("is-hidden", showRest);
      el.petImgRest.classList.toggle("is-hidden", !showRest);
    }
  }

  function render() {
    var now = Date.now();

    if (state === "idle") {
      setBodyState("idle");
      setPet("calm");
      el.timerLabel.style.display = "none";
      el.timerDisplay.textContent = QUICK ? "0:12" : "50:00";
      el.timerDisplay.style.color = "";
      el.btnPrimary.style.display = "";
      el.btnPrimary.disabled = false;
      el.btnPrimary.textContent = "爸爸，开始工作啦";
      setRelaxDisabled(true);
      stopCheerRotate();
      startCheerRotate();
      return;
    }

    stopCheerRotate();

    if (state === "focus") {
      setBodyState("focus");
      setPet("calm");
      el.timerLabel.style.display = "";
      el.timerLabel.textContent = "还要忙多久呀";
      var leftF = Math.max(0, Math.ceil((focusEndAt - now) / 1000));
      el.timerDisplay.textContent = formatMMSS(leftF);
      el.timerDisplay.style.color = "";
      el.cheer.textContent = "秒秒很乖不闹，等爸爸。";
      setRelaxDisabled(true);
      return;
    }

    if (state === "break_prompt") {
      setBodyState("break-prompt");
      setPet("pop");
      el.timerLabel.style.display = "none";
      el.timerDisplay.textContent = "0:00";
      el.timerDisplay.style.color = "";
      el.cheer.textContent = "先陪秒秒喘口气呀～";
      setRelaxDisabled(true);
      return;
    }

    if (state === "rest") {
      setBodyState("rest");
      setPet("calm");
      el.timerLabel.style.display = "";
      el.timerLabel.textContent = "休息还剩";
      var leftR = Math.max(0, Math.ceil((restEndAt - now) / 1000));
      el.timerDisplay.textContent = formatMMSS(leftR);
      el.timerDisplay.style.color = "var(--accent-secondary)";
      var sub = null;
      for (var j = 0; j < RELAX_ITEMS.length; j++) {
        if (RELAX_ITEMS[j].id === selectedRelaxId) {
          sub = RELAX_ITEMS[j];
          break;
        }
      }
      el.cheer.textContent = sub
        ? "这会儿就「" + sub.title + "」好不好？本宝宝不急～"
        : "爸爸挑一件小休息单嘛，秒秒都乖乖等你。";
      setRelaxDisabled(false);
      updateRelaxSelection();
      return;
    }

    if (state === "summary") {
      setBodyState("summary");
      setPet("calm");
      el.timerLabel.style.display = "";
      el.timerLabel.textContent = "休息结束咯";
      el.timerDisplay.textContent = "0:00";
      el.timerDisplay.style.color = "var(--text-tertiary)";
      el.cheer.textContent = "休息结束啦，爸爸辛苦～";
      setRelaxDisabled(true);
    }
  }

  function onTick() {
    var now = Date.now();
    if (state === "focus" && focusEndAt && now >= focusEndAt) {
      onFocusComplete();
    } else if (state === "rest" && restEndAt && now >= restEndAt) {
      onRestComplete();
    }
    if (state === "focus" || state === "rest") render();
  }

  function onFocusComplete() {
    if (state !== "focus") return;
    stats.minutes += QUICK ? 1 : 50;
    stats.segments += 1;
    saveStats();
    updateFooterStats();
    state = "break_prompt";
    focusEndAt = 0;
    openModalBreak();
    render();
  }

  function startFocus() {
    closeModal();
    state = "focus";
    focusEndAt = Date.now() + FOCUS_SEC * 1000;
    restEndAt = 0;
    setMainTab("work");
    render();
  }

  function startRest() {
    if (state !== "break_prompt") return;
    clearBreakReminderTimers();
    closeModal();
    state = "rest";
    restEndAt = Date.now() + REST_SEC * 1000;
    if (!selectedRelaxId) selectedRelaxId = RELAX_ITEMS[0].id;
    setMainTab("rest");
    render();
  }

  function onRestComplete() {
    if (state !== "rest") return;
    state = "summary";
    restEndAt = 0;
    var pick = null;
    for (var i = 0; i < RELAX_ITEMS.length; i++) {
      if (RELAX_ITEMS[i].id === selectedRelaxId) {
        pick = RELAX_ITEMS[i];
        break;
      }
    }
    var pickLine = pick
      ? "爸爸刚才选了「" + pick.title + "」，本宝宝帮你用小本本记下啦！"
      : "爸爸没选也没关系，秒秒一样超爱你。";
    el.summaryBody.textContent =
      pickLine +
      " 今天爸爸一共专心陪了秒秒 " +
      stats.minutes +
      " 分钟，已经 " +
      stats.segments +
      " 次啦～爸爸好棒，本宝宝给你比心心！";
    openModalSummary();
    render();
  }

  function goIdle() {
    closeModal();
    state = "idle";
    focusEndAt = 0;
    restEndAt = 0;
    setMainTab("work");
    render();
  }

  el.tabWork.addEventListener("click", function () {
    setMainTab("work");
  });

  el.tabRest.addEventListener("click", function () {
    setMainTab("rest");
  });

  el.btnPrimary.addEventListener("click", function () {
    if (state !== "idle") return;
    startFocus();
  });

  el.btnModalKnow.addEventListener("click", function () {
    if (state !== "break_prompt") return;
    startRest();
  });

  el.btnModalClose.addEventListener("click", function () {
    if (state !== "break_prompt") return;
    startRest();
  });

  el.modalBackdrop.addEventListener("click", function () {
    if (state === "break_prompt") startRest();
    else if (state === "summary") goIdle();
  });

  el.btnNextSegment.addEventListener("click", function () {
    if (state !== "summary") return;
    startFocus();
  });

  el.btnLater.addEventListener("click", function () {
    if (state !== "summary") return;
    goIdle();
  });

  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible") render();
  });

  function dismissBirthdaySplash() {
    if (!el.birthdaySplash || el.birthdaySplash.classList.contains("is-hidden")) return;
    el.birthdaySplash.classList.add("is-leaving");
    el.body.classList.remove("splash-open");
    el.birthdaySplash.setAttribute("aria-hidden", "true");
    try {
      localStorage.setItem(STORAGE_BIRTHDAY_SPLASH, "1");
    } catch (err) {
      /* ignore */
    }
    window.setTimeout(function () {
      el.birthdaySplash.classList.add("is-hidden");
    }, 480);
  }

  function initBirthdaySplash() {
    if (!el.birthdaySplash) return;
    if (document.documentElement.classList.contains("splash-skip")) {
      el.birthdaySplash.classList.add("is-hidden");
      el.birthdaySplash.setAttribute("aria-hidden", "true");
      return;
    }
    el.body.classList.add("splash-open");
    if (el.btnSplashEnter) {
      el.btnSplashEnter.addEventListener("click", dismissBirthdaySplash);
    }
  }

  initBirthdaySplash();
  renderRelaxList();
  updateFooterStats();
  applyPetImagesFromStorage();
  bindCutoutImages();
  bindPhotoSettings();
  setMainTab("work");
  render();
  window.setInterval(onTick, 250);
})();
