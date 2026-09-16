/**
 * AURA TIME - 時光之境核心引擎
 * 支援個人姓名自訂、高精確度時鐘、世界時區、番茄鐘、倒數計時與合成環境音
 */

(function () {
  'use strict';

  // ==========================================
  // 狀態管理與預設值
  // ==========================================
  const state = {
    userName: localStorage.getItem('aura_user_name') || '陳志遠',
    userAvatar: localStorage.getItem('aura_user_avatar') || '陳',
    userMotto: localStorage.getItem('aura_user_motto') || '「時光不語，靜候花開。將專注留給真正熱愛的事物。」',
    theme: localStorage.getItem('aura_theme') || 'aurora',
    is24Hour: localStorage.getItem('aura_is_24h') !== 'false', // 預設 24 小時
    activeClockView: 'digital', // 'digital' | 'analog'
    focusMinutes: parseInt(localStorage.getItem('aura_focus_mins') || '45', 10),

    // 番茄鐘狀態
    pomo: {
      mode: 25, // 分鐘
      timeLeft: 25 * 60,
      totalTime: 25 * 60,
      isRunning: false,
      intervalId: null
    },

    // 倒數目標
    milestone: {
      title: localStorage.getItem('aura_ms_title') || '2027 跨年新篇章',
      targetDate: localStorage.getItem('aura_ms_date') || '2027-01-01T00:00:00'
    },

    // 音效狀態
    audio: {
      isPlaying: false,
      ctx: null,
      noiseNode: null,
      gainNode: null
    }
  };

  // 時光哲學名言庫
  const timeQuotes = [
    { text: "「時光飛逝如白駒過隙，但只要用心紀錄，每一秒都是你的專屬傑作。」", tag: "熱愛生活" },
    { text: "「不要等待時機成熟，只要開始行動，當下就是最完美的時刻。」", tag: "勇往直前" },
    { text: "「將時間花在哪裡，未來的成就就在哪裡綻放。」", tag: "持續積累" },
    { text: "「專注當下的呼吸與節奏，世界自會為堅定的人讓路。」", tag: "心流境地" },
    { text: "「歲月不居，時節如流。每一束灑下的晨曦，都是重啟的契機。」", tag: "破曉新生" }
  ];
  let quoteIndex = 0;

  // ==========================================
  // DOM 元素快取
  // ==========================================
  const DOM = {
    // 導覽與全域
    themePicker: document.getElementById('themePicker'),
    soundToggleBtn: document.getElementById('soundToggleBtn'),
    soundOffIcon: document.getElementById('soundOffIcon'),
    soundOnIcon: document.getElementById('soundOnIcon'),
    fullscreenBtn: document.getElementById('fullscreenBtn'),

    // 姓名與個人名片
    userAvatar: document.getElementById('userAvatar'),
    avatarText: document.getElementById('avatarText'),
    avatarTrigger: document.getElementById('avatarTrigger'),
    daySegmentTag: document.getElementById('daySegmentTag'),
    solarTermTag: document.getElementById('solarTermTag'),
    salutationText: document.getElementById('salutationText'),
    userNameDisplay: document.getElementById('userNameDisplay'),
    editNameBtn: document.getElementById('editNameBtn'),
    userMottoDisplay: document.getElementById('userMottoDisplay'),
    todayFocusMins: document.getElementById('todayFocusMins'),
    quoteAuthorName: document.getElementById('quoteAuthorName'),
    footerUserName: document.getElementById('footerUserName'),

    // 時鐘視圖
    tabDigital: document.getElementById('tabDigital'),
    tabAnalog: document.getElementById('tabAnalog'),
    format1224Btn: document.getElementById('format1224Btn'),
    digitalClockView: document.getElementById('digitalClockView'),
    analogClockView: document.getElementById('analogClockView'),
    clockHours: document.getElementById('clockHours'),
    clockMinutes: document.getElementById('clockMinutes'),
    clockSeconds: document.getElementById('clockSeconds'),
    clockPeriod: document.getElementById('clockPeriod'),
    dateFullDisplay: document.getElementById('dateFullDisplay'),

    // 指針鐘
    hourHand: document.getElementById('hourHand'),
    minuteHand: document.getElementById('minuteHand'),
    secondHand: document.getElementById('secondHand'),
    analogSubTime: document.getElementById('analogSubTime'),

    // 時光進度條
    dayPercentText: document.getElementById('dayPercentText'),
    dayProgressBar: document.getElementById('dayProgressBar'),
    weekPercentText: document.getElementById('weekPercentText'),
    weekProgressBar: document.getElementById('weekProgressBar'),
    yearPercentText: document.getElementById('yearPercentText'),
    yearProgressBar: document.getElementById('yearProgressBar'),

    // 世界時區
    tzTaipei: document.getElementById('tzTaipei'),
    tzTokyo: document.getElementById('tzTokyo'),
    tzLondon: document.getElementById('tzLondon'),
    tzNewYork: document.getElementById('tzNewYork'),

    // 番茄鐘
    pomoWorkBtn: document.getElementById('pomoWorkBtn'),
    pomoBreakBtn: document.getElementById('pomoBreakBtn'),
    pomoLongBreakBtn: document.getElementById('pomoLongBreakBtn'),
    pomoCircle: document.getElementById('pomoCircle'),
    pomoDisplay: document.getElementById('pomoDisplay'),
    pomoStatusText: document.getElementById('pomoStatusText'),
    pomoStartBtn: document.getElementById('pomoStartBtn'),
    pomoPlayIcon: document.getElementById('pomoPlayIcon'),
    pomoPauseIcon: document.getElementById('pomoPauseIcon'),
    pomoStartText: document.getElementById('pomoStartText'),
    pomoResetBtn: document.getElementById('pomoResetBtn'),

    // 里程碑倒數
    milestoneCardTitle: document.getElementById('milestoneCardTitle'),
    editMilestoneBtn: document.getElementById('editMilestoneBtn'),
    milestoneTargetName: document.getElementById('milestoneTargetName'),
    milestoneTargetDate: document.getElementById('milestoneTargetDate'),
    cdDays: document.getElementById('cdDays'),
    cdHours: document.getElementById('cdHours'),
    cdMins: document.getElementById('cdMins'),
    cdSecs: document.getElementById('cdSecs'),

    // 靈感膠囊
    dailyInsight: document.getElementById('dailyInsight'),
    dailyAuthor: document.getElementById('dailyAuthor'),
    refreshQuoteBtn: document.getElementById('refreshQuoteBtn'),

    // 個人資料 Modal
    profileModal: document.getElementById('profileModal'),
    closeModalBtn: document.getElementById('closeModalBtn'),
    cancelModalBtn: document.getElementById('cancelModalBtn'),
    saveProfileBtn: document.getElementById('saveProfileBtn'),
    inputName: document.getElementById('inputName'),
    inputAvatar: document.getElementById('inputAvatar'),
    inputMotto: document.getElementById('inputMotto'),

    // 里程碑 Modal
    milestoneModal: document.getElementById('milestoneModal'),
    closeMilestoneModalBtn: document.getElementById('closeMilestoneModalBtn'),
    cancelMilestoneModalBtn: document.getElementById('cancelMilestoneModalBtn'),
    saveMilestoneBtn: document.getElementById('saveMilestoneBtn'),
    inputMilestoneTitle: document.getElementById('inputMilestoneTitle'),
    inputMilestoneDate: document.getElementById('inputMilestoneDate'),

    // Toast
    toastBox: document.getElementById('toastBox'),
    toastMsg: document.getElementById('toastMsg')
  };

  // ==========================================
  // 1. 初始化與個人姓名載入
  // ==========================================
  function initProfile() {
    DOM.userNameDisplay.textContent = state.userName;
    DOM.avatarText.textContent = state.userAvatar || state.userName.charAt(0) || '陳';
    DOM.userMottoDisplay.textContent = state.userMotto;
    DOM.quoteAuthorName.textContent = state.userName;
    DOM.footerUserName.textContent = state.userName;
    DOM.todayFocusMins.innerHTML = `${state.focusMinutes} <small>分鐘</small>`;

    // 主題初始化
    applyTheme(state.theme);

    // 12/24H 按鈕顯示文字
    DOM.format1224Btn.querySelector('.format-label').textContent = state.is24Hour ? '24H' : '12H';

    // 里程碑初始化
    DOM.milestoneTargetName.textContent = state.milestone.title;
    DOM.milestoneTargetDate.textContent = `目標：${state.milestone.targetDate.replace('T', ' ')}`;
  }

  function showToast(msg) {
    DOM.toastMsg.textContent = msg;
    DOM.toastBox.classList.remove('hidden');
    setTimeout(() => {
      DOM.toastBox.classList.add('hidden');
    }, 2500);
  }

  // ==========================================
  // 2. 主題切換器
  // ==========================================
  function applyTheme(themeName) {
    state.theme = themeName;
    document.documentElement.setAttribute('data-theme', themeName);
    localStorage.setItem('aura_theme', themeName);

    // 更新選取圓點標記
    const buttons = DOM.themePicker.querySelectorAll('.theme-btn');
    buttons.forEach(btn => {
      if (btn.getAttribute('data-theme-val') === themeName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  DOM.themePicker.addEventListener('click', (e) => {
    const btn = e.target.closest('.theme-btn');
    if (btn) {
      const themeVal = btn.getAttribute('data-theme-val');
      applyTheme(themeVal);
    }
  });

  // ==========================================
  // 3. 高精度時間計算與時鐘渲染
  // ==========================================
  const WEEK_DAYS = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];

  function updateClock() {
    const now = new Date();
    const hours24 = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    const ms = now.getMilliseconds();

    // 1. 判斷時段與問候語
    updateDaySegmentAndGreeting(hours24);

    // 2. 數位時鐘格式化
    let displayHours = hours24;
    let periodStr = '';

    if (!state.is24Hour) {
      periodStr = hours24 >= 12 ? 'PM' : 'AM';
      displayHours = hours24 % 12 || 12;
      DOM.clockPeriod.textContent = periodStr;
      DOM.clockPeriod.style.display = 'inline-block';
    } else {
      DOM.clockPeriod.style.display = 'none';
    }

    const pad = n => String(n).padStart(2, '0');
    DOM.clockHours.textContent = pad(displayHours);
    DOM.clockMinutes.textContent = pad(minutes);
    DOM.clockSeconds.textContent = pad(seconds);

    // 3. 指針鐘旋轉計算 (加上微秒以實現絲滑滑動)
    const exactSeconds = seconds + ms / 1000;
    const exactMinutes = minutes + exactSeconds / 60;
    const exactHours = (hours24 % 12) + exactMinutes / 60;

    const secondDeg = exactSeconds * 6;      // 360 / 60
    const minuteDeg = exactMinutes * 6;      // 360 / 60
    const hourDeg = exactHours * 30;         // 360 / 12

    DOM.secondHand.style.transform = `rotate(${secondDeg}deg)`;
    DOM.minuteHand.style.transform = `rotate(${minuteDeg}deg)`;
    DOM.hourHand.style.transform = `rotate(${hourDeg}deg)`;
    DOM.analogSubTime.textContent = `${pad(hours24)}:${pad(minutes)}:${pad(seconds)}`;

    // 4. 日期文字
    const year = now.getFullYear();
    const month = pad(now.getMonth() + 1);
    const day = pad(now.getDate());
    const weekDay = WEEK_DAYS[now.getDay()];
    DOM.dateFullDisplay.textContent = `${year} 年 ${month} 月 ${day} 日 ${weekDay} ✦ 歲次丙午`;

    // 5. 進度條計算
    calculateProgressBars(now, hours24, minutes, seconds);

    // 6. 世界時區更新
    updateWorldClocks(now);

    // 7. 里程碑倒數更新
    updateMilestoneCountdown(now);

    requestAnimationFrame(updateClock);
  }

  function updateDaySegmentAndGreeting(hours) {
    let segment = '早晨韶光';
    let salutation = '早安，';
    let term = '歲月靜好';

    if (hours >= 5 && hours < 9) {
      segment = '晨曦初破';
      salutation = '早安，';
      term = '萬物向陽';
    } else if (hours >= 9 && hours < 12) {
      segment = '黃金上午';
      salutation = '上午好，';
      term = '思路清澈';
    } else if (hours >= 12 && hours < 14) {
      segment = '午後微風';
      salutation = '午安，';
      term = '怡然小憩';
    } else if (hours >= 14 && hours < 18) {
      segment = '流金午後';
      salutation = '下午好，';
      term = '筆耕不輟';
    } else if (hours >= 18 && hours < 22) {
      segment = '暮色歸心';
      salutation = '晚上好，';
      term = '華燈初上';
    } else {
      segment = '靜謐深夜';
      salutation = '夜深了，';
      term = '星空璀璨';
    }

    DOM.daySegmentTag.textContent = segment;
    DOM.salutationText.textContent = salutation;
    DOM.solarTermTag.textContent = term;
  }

  function calculateProgressBars(now, hours, minutes, seconds) {
    // 當日百分比
    const secondsToday = hours * 3600 + minutes * 60 + seconds;
    const dayPercent = ((secondsToday / 86400) * 100).toFixed(1);
    DOM.dayPercentText.textContent = `${dayPercent}%`;
    DOM.dayProgressBar.style.width = `${dayPercent}%`;

    // 本週百分比 (以週一為起始)
    const dayOfWeek = (now.getDay() + 6) % 7; // 0=週一, 6=週日
    const secondsInWeek = dayOfWeek * 86400 + secondsToday;
    const weekPercent = ((secondsInWeek / (7 * 86400)) * 100).toFixed(1);
    DOM.weekPercentText.textContent = `${weekPercent}%`;
    DOM.weekProgressBar.style.width = `${weekPercent}%`;

    // 年度百分比
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const endOfYear = new Date(now.getFullYear() + 1, 0, 1);
    const yearPercent = (((now - startOfYear) / (endOfYear - startOfYear)) * 100).toFixed(1);
    DOM.yearPercentText.textContent = `${yearPercent}%`;
    DOM.yearProgressBar.style.width = `${yearPercent}%`;
  }

  // ==========================================
  // 4. 世界時區時間轉換
  // ==========================================
  function formatTimeZoneTime(date, timeZone) {
    try {
      const formatter = new Intl.DateTimeFormat('zh-TW', {
        timeZone,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
      return formatter.format(date);
    } catch (e) {
      return '--:--:--';
    }
  }

  function updateWorldClocks(now) {
    DOM.tzTaipei.textContent = formatTimeZoneTime(now, 'Asia/Taipei');
    DOM.tzTokyo.textContent = formatTimeZoneTime(now, 'Asia/Tokyo');
    DOM.tzLondon.textContent = formatTimeZoneTime(now, 'Europe/London');
    DOM.tzNewYork.textContent = formatTimeZoneTime(now, 'America/New_York');
  }

  // ==========================================
  // 5. 時鐘視圖與 12/24 小時切換
  // ==========================================
  DOM.tabDigital.addEventListener('click', () => {
    DOM.tabDigital.classList.add('active');
    DOM.tabAnalog.classList.remove('active');
    DOM.digitalClockView.classList.remove('hidden');
    DOM.analogClockView.classList.add('hidden');
    state.activeClockView = 'digital';
  });

  DOM.tabAnalog.addEventListener('click', () => {
    DOM.tabAnalog.classList.add('active');
    DOM.tabDigital.classList.remove('active');
    DOM.analogClockView.classList.remove('hidden');
    DOM.digitalClockView.classList.add('hidden');
    state.activeClockView = 'analog';
  });

  DOM.format1224Btn.addEventListener('click', () => {
    state.is24Hour = !state.is24Hour;
    localStorage.setItem('aura_is_24h', state.is24Hour);
    DOM.format1224Btn.querySelector('.format-label').textContent = state.is24Hour ? '24H' : '12H';
    showToast(`已切換為 ${state.is24Hour ? '24 小時制' : '12 小時制'}`);
  });

  // ==========================================
  // 6. 專注番茄鐘 (Pomodoro Flow)
  // ==========================================
  const RING_CIRCUMFERENCE = 2 * Math.PI * 80; // r=80, ~502.65

  function updatePomoVisual() {
    const mins = Math.floor(state.pomo.timeLeft / 60);
    const secs = state.pomo.timeLeft % 60;
    DOM.pomoDisplay.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    // SVG 環進度
    const progress = state.pomo.timeLeft / state.pomo.totalTime;
    const offset = RING_CIRCUMFERENCE * (1 - progress);
    DOM.pomoCircle.style.strokeDashoffset = offset;
  }

  function setPomoMode(minutes, btn) {
    clearInterval(state.pomo.intervalId);
    state.pomo.isRunning = false;
    state.pomo.mode = minutes;
    state.pomo.totalTime = minutes * 60;
    state.pomo.timeLeft = minutes * 60;

    [DOM.pomoWorkBtn, DOM.pomoBreakBtn, DOM.pomoLongBreakBtn].forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    DOM.pomoPlayIcon.classList.remove('hidden');
    DOM.pomoPauseIcon.classList.add('hidden');
    DOM.pomoStartText.textContent = '開始專注';
    DOM.pomoStatusText.textContent = '準備就緒';
    updatePomoVisual();
  }

  DOM.pomoWorkBtn.addEventListener('click', () => setPomoMode(25, DOM.pomoWorkBtn));
  DOM.pomoBreakBtn.addEventListener('click', () => setPomoMode(5, DOM.pomoBreakBtn));
  DOM.pomoLongBreakBtn.addEventListener('click', () => setPomoMode(15, DOM.pomoLongBreakBtn));

  DOM.pomoStartBtn.addEventListener('click', () => {
    if (state.pomo.isRunning) {
      // 暫停
      clearInterval(state.pomo.intervalId);
      state.pomo.isRunning = false;
      DOM.pomoPlayIcon.classList.remove('hidden');
      DOM.pomoPauseIcon.classList.add('hidden');
      DOM.pomoStartText.textContent = '繼續計時';
      DOM.pomoStatusText.textContent = '暫停中';
    } else {
      // 開始
      state.pomo.isRunning = true;
      DOM.pomoPlayIcon.classList.add('hidden');
      DOM.pomoPauseIcon.classList.remove('hidden');
      DOM.pomoStartText.textContent = '暫停計時';
      DOM.pomoStatusText.textContent = '深度專注進行中...';

      state.pomo.intervalId = setInterval(() => {
        if (state.pomo.timeLeft > 0) {
          state.pomo.timeLeft--;
          updatePomoVisual();
        } else {
          // 計時完成
          clearInterval(state.pomo.intervalId);
          state.pomo.isRunning = false;
          DOM.pomoPlayIcon.classList.remove('hidden');
          DOM.pomoPauseIcon.classList.add('hidden');
          DOM.pomoStartText.textContent = '再次開始';
          DOM.pomoStatusText.textContent = '🎉 專注時光達成！';

          // 累加累積專注時間
          if (state.pomo.mode === 25) {
            state.focusMinutes += 25;
            localStorage.setItem('aura_focus_mins', state.focusMinutes);
            DOM.todayFocusMins.innerHTML = `${state.focusMinutes} <small>分鐘</small>`;
          }

          playAlertChime();
          showToast('👏 恭喜完成一輪專注時光！');
        }
      }, 1000);
    }
  });

  DOM.pomoResetBtn.addEventListener('click', () => {
    clearInterval(state.pomo.intervalId);
    state.pomo.isRunning = false;
    state.pomo.timeLeft = state.pomo.totalTime;
    DOM.pomoPlayIcon.classList.remove('hidden');
    DOM.pomoPauseIcon.classList.add('hidden');
    DOM.pomoStartText.textContent = '開始專注';
    DOM.pomoStatusText.textContent = '已重設';
    updatePomoVisual();
  });

  // ==========================================
  // 7. 里程碑重要倒數
  // ==========================================
  function updateMilestoneCountdown(now) {
    const target = new Date(state.milestone.targetDate);
    const diff = target - now;

    if (isNaN(diff)) {
      DOM.cdDays.textContent = '00';
      DOM.cdHours.textContent = '00';
      DOM.cdMins.textContent = '00';
      DOM.cdSecs.textContent = '00';
      return;
    }

    if (diff <= 0) {
      DOM.cdDays.textContent = '00';
      DOM.cdHours.textContent = '00';
      DOM.cdMins.textContent = '00';
      DOM.cdSecs.textContent = '00';
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);

    DOM.cdDays.textContent = String(days).padStart(2, '0');
    DOM.cdHours.textContent = String(hours).padStart(2, '0');
    DOM.cdMins.textContent = String(mins).padStart(2, '0');
    DOM.cdSecs.textContent = String(secs).padStart(2, '0');
  }

  // ==========================================
  // 8. 靈感膠囊刷新
  // ==========================================
  DOM.refreshQuoteBtn.addEventListener('click', () => {
    quoteIndex = (quoteIndex + 1) % timeQuotes.length;
    const item = timeQuotes[quoteIndex];
    DOM.dailyInsight.style.opacity = '0';
    setTimeout(() => {
      DOM.dailyInsight.textContent = item.text;
      DOM.dailyInsight.style.opacity = '1';
    }, 200);
  });

  // ==========================================
  // 9. Web Audio API (合成環境雨聲與提示音)
  // ==========================================
  function playAlertChime() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3); // A5

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.8);
    } catch (e) {
      // AudioContext not allowed or unsupported
    }
  }

  function toggleAmbientSound() {
    if (!state.audio.isPlaying) {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        state.audio.ctx = new AudioCtx();

        // 產生溫柔粉紅雜訊 (白噪音/輕雨模擬)
        const bufferSize = 2 * state.audio.ctx.sampleRate;
        const noiseBuffer = state.audio.ctx.createBuffer(1, bufferSize, state.audio.ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.04;
          b6 = white * 0.115926;
        }

        const whiteNoise = state.audio.ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        // 低通濾波器營造放鬆氛圍
        const filter = state.audio.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(650, state.audio.ctx.currentTime);

        const gainNode = state.audio.ctx.createGain();
        gainNode.gain.setValueAtTime(0.01, state.audio.ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.18, state.audio.ctx.currentTime + 1.5);

        whiteNoise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(state.audio.ctx.destination);

        whiteNoise.start();

        state.audio.noiseNode = whiteNoise;
        state.audio.gainNode = gainNode;
        state.audio.isPlaying = true;

        DOM.soundOffIcon.classList.add('hidden');
        DOM.soundOnIcon.classList.remove('hidden');
        DOM.soundToggleBtn.classList.add('active');
        showToast('🌧️ 專注環境音已開啟');
      } catch (err) {
        showToast('您的瀏覽器暫不支援或尚未允許音效播放');
      }
    } else {
      if (state.audio.gainNode && state.audio.ctx) {
        state.audio.gainNode.gain.linearRampToValueAtTime(0.001, state.audio.ctx.currentTime + 0.5);
        setTimeout(() => {
          if (state.audio.noiseNode) state.audio.noiseNode.stop();
          if (state.audio.ctx) state.audio.ctx.close();
          state.audio.isPlaying = false;
        }, 500);
      }
      DOM.soundOffIcon.classList.remove('hidden');
      DOM.soundOnIcon.classList.add('hidden');
      DOM.soundToggleBtn.classList.remove('active');
      showToast('環境音已關閉');
    }
  }

  DOM.soundToggleBtn.addEventListener('click', toggleAmbientSound);

  // ==========================================
  // 10. 全螢幕模式切換
  // ==========================================
  DOM.fullscreenBtn.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  });

  // ==========================================
  // 11. 編輯個人姓名與自訂資料 Modal
  // ==========================================
  function openProfileModal() {
    DOM.inputName.value = state.userName;
    DOM.inputAvatar.value = state.userAvatar;
    DOM.inputMotto.value = state.userMotto;
    DOM.profileModal.classList.remove('hidden');
    DOM.inputName.focus();
  }

  function closeProfileModal() {
    DOM.profileModal.classList.add('hidden');
  }

  DOM.editNameBtn.addEventListener('click', openProfileModal);
  DOM.userNameDisplay.addEventListener('click', openProfileModal);
  DOM.avatarTrigger.addEventListener('click', openProfileModal);
  DOM.userMottoDisplay.addEventListener('click', openProfileModal);

  DOM.closeModalBtn.addEventListener('click', closeProfileModal);
  DOM.cancelModalBtn.addEventListener('click', closeProfileModal);

  DOM.saveProfileBtn.addEventListener('click', () => {
    const newName = DOM.inputName.value.trim() || '志遠';
    const newAvatar = DOM.inputAvatar.value.trim() || newName.charAt(0);
    const newMotto = DOM.inputMotto.value.trim() || '「時光不語，靜候花開。」';

    state.userName = newName;
    state.userAvatar = newAvatar;
    state.userMotto = newMotto;

    localStorage.setItem('aura_user_name', newName);
    localStorage.setItem('aura_user_avatar', newAvatar);
    localStorage.setItem('aura_user_motto', newMotto);

    initProfile();
    closeProfileModal();
    showToast(`歡迎，${newName}！專屬設定已更新。`);
  });

  // ==========================================
  // 12. 編輯里程碑 Modal
  // ==========================================
  DOM.editMilestoneBtn.addEventListener('click', () => {
    DOM.inputMilestoneTitle.value = state.milestone.title;
    DOM.inputMilestoneDate.value = state.milestone.targetDate;
    DOM.milestoneModal.classList.remove('hidden');
  });

  DOM.closeMilestoneModalBtn.addEventListener('click', () => DOM.milestoneModal.classList.add('hidden'));
  DOM.cancelMilestoneModalBtn.addEventListener('click', () => DOM.milestoneModal.classList.add('hidden'));

  DOM.saveMilestoneBtn.addEventListener('click', () => {
    const title = DOM.inputMilestoneTitle.value.trim() || '重要時刻倒數';
    const dateVal = DOM.inputMilestoneDate.value;

    if (!dateVal) {
      alert('請選擇有效的目標日期與時間');
      return;
    }

    state.milestone.title = title;
    state.milestone.targetDate = dateVal;

    localStorage.setItem('aura_ms_title', title);
    localStorage.setItem('aura_ms_date', dateVal);

    DOM.milestoneTargetName.textContent = title;
    DOM.milestoneTargetDate.textContent = `目標：${dateVal.replace('T', ' ')}`;
    DOM.milestoneModal.classList.add('hidden');
    showToast('倒數目標已成功更新！');
  });

  // 點擊 Modal 外圍遮罩關閉
  [DOM.profileModal, DOM.milestoneModal].forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.add('hidden');
      }
    });
  });

  // ==========================================
  // 13. 啟動入口
  // ==========================================
  initProfile();
  updatePomoVisual();
  requestAnimationFrame(updateClock);

})();
