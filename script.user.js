// ==UserScript==
// @name         HDREZKA PRO CINEMA ZONES: Автоплей и Хоткеи
// @name:en      HDRezka PRO Cinema Zones: AutoPlay & Hotkeys
// @namespace    http://tampermonkey.net
// @version      2.3
// @description  Цельные зоны на 100% высоты с умной обрезкой области клика на 15% снизу, Alt+Стрелки и уведомления о серии!
// @description:en 100% height zones with safe click boundaries (bottom 15% free) over player controls, Alt+Arrows & notifications.
// @author       Darkness-83 (совместно с AI)
// @include      /^https?://([^/]+\.)?(hdrezka|rezka|kinopub|hdbaza)[^/]*\./
// @run-at       document-end
// @grant        none
// @license      GPL-3.0
// ==/UserScript==

(function() {
    'use strict';

    // Жесткие CSS стили для скрытия оверлея трейлера и настройки наших сочных боковых зон
    const style = document.createElement('style');
    style.textContent = `
        #ps-overlay-wrap, .b-embed-popup, .b-embed-popup-layout, .b-embed-popup__layout {
            display: none !important;
            opacity: 0 !important;
        }
        body, html { overflow: auto !important; position: static !important; }

        /* ВИЗУАЛЬНЫЙ СЛОЙ ШТОРКИ: На все 100% высоты коробки для идеальной красоты */
        .rezka-nav-zone {
            position: absolute !important;
            top: 0 !important;
            height: 100% !important;
            width: 140px !important;
            z-index: 2147483645 !important;
            background: transparent !important;
            transition: opacity 0.4s ease, background 0.3s ease !important;
            opacity: 0;
            pointer-events: none; /* Мышь пролетает сквозь этот слой */
            user-select: none !important;
        }

        /* Левая и правая посадка визуального градиента */
        #rezka-zone-prev { left: 0 !important; }
        #rezka-zone-next { right: 0 !important; }

        .rezka-nav-zone.visible {
            opacity: 1 !important;
        }

        /* При наведении мышки плавно подсвечиваем края плотным сочным затемнением до самого низа */
        #rezka-zone-prev:hover {
            background: linear-gradient(to right, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 40%, rgba(0,0,0,0) 100%) !important;
        }
        #rezka-zone-next:hover {
            background: linear-gradient(to left, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 40%, rgba(0,0,0,0) 100%) !important;
        }

        /* КЛИКОВЫЙ СЛОЙ (НЕВИДИМЫЙ): Позиционируется динамически через JS строго поверх видеокадра */
        .rezka-click-target {
            position: absolute !important;
            width: 100% !important;
            cursor: pointer !important;
            pointer-events: none;
            z-index: 2147483646 !important;
        }
        .rezka-nav-zone.visible .rezka-click-target {
            pointer-events: auto !important; /* Разрешаем клики, только когда мышь активна */
        }
    `;
    document.head.appendChild(style);

    // Полупрозрачное уведомление о серии строго по центру кадра с отступом 20% сверху
    window.showRezkaNotification = function(text) {
        const oldNotify = document.getElementById('hdrezka-switcher-notify');
        if (oldNotify) oldNotify.remove();

        const mainPlayer = document.querySelector('#cdn-player, #player, .b-player, #player_html5');
        if (!mainPlayer) return;

        const notify = document.createElement('div');
        notify.id = 'hdrezka-switcher-notify';
        notify.textContent = text;

        Object.assign(notify.style, {
            position: 'absolute',
            top: '20%',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            color: 'rgba(255, 255, 255, 0.85)',
            padding: '10px 24px',
            borderRadius: '6px',
            fontSize: '22px',
            fontWeight: 'bold',
            fontFamily: 'sans-serif',
            zIndex: '2147483647',
            pointerEvents: 'none',
            transition: 'opacity 0.4s ease',
            opacity: '1',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            whiteSpace: 'nowrap'
        });

        const fullscreenEl = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement;
        if (fullscreenEl) {
            fullscreenEl.appendChild(notify);
        } else {
            mainPlayer.appendChild(notify);
        }

        setTimeout(() => { notify.style.opacity = '0'; }, 1500);
        setTimeout(() => { notify.remove(); }, 1900);
    };

    // Общий обработчик горячих клавиш
    document.addEventListener('keydown', function(e) {
        // ЖЕЛЕЗНЫЙ ПРЕДОХРАНИТЕЛЬ: Если фокус в поле ввода (поиск, комменты) или тексте — полностью выключаем хоткеи!
        const activeEl = document.activeElement;
        if (activeEl && (
            activeEl.tagName === 'INPUT' ||
            activeEl.tagName === 'TEXTAREA' ||
            activeEl.isContentEditable
        )) {
            return; // Даем пользователю спокойно писать текст
        }

        // Хоткеи Alt + Стрелки (Переключение серий через симуляцию клика по триггерам Части 2)
        if (e.altKey) {
            if (e.keyCode === 39) { // Стрелка Вправо
                e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
                const zone = document.getElementById('rezka-zone-next');
                if (zone) { const trigger = zone.querySelector('.rezka-click-target'); if (trigger) trigger.click(); }
            } else if (e.keyCode === 37) { // Стрелка Влево
                e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
                const zone = document.getElementById('rezka-zone-prev');
                if (zone) { const trigger = zone.querySelector('.rezka-click-target'); if (trigger) trigger.click(); }
            }
        }

        // ХОТКЕЙ: Разворачивает на весь экран СТРОГО САМ ТЕГ ВИДЕО
        if (e.keyCode === 13 && !e.shiftKey && !e.altKey && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();

            const fullscreenEl = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement;

            if (fullscreenEl) {
                const exitFS = document.exitFullscreen || document.webkitExitFullscreen || document.mozCancelFullScreen;
                if (exitFS) exitFS.call(document);
            } else {
                const nativeVideo = document.querySelector('video:not(#ps-overlay-wrap video)');
                if (nativeVideo) {
                    const reqFS = nativeVideo.requestFullscreen || nativeVideo.webkitRequestFullScreen || nativeVideo.mozRequestFullScreen;
                    if (reqFS) reqFS.call(nativeVideo);
                }
            }
        }
    }, true); // Flag true перехватывает нажатия раньше всех скриптов сайта
})();
(function() {
    'use strict';

    // Долбилка автоплея — заставляет новый плеер проснуться после смены серии
    function forcePlayVideo() {
        let attempts = 0;
        const interval = setInterval(() => {
            const mainPlayer = document.querySelector('#cdn-player, #player, .b-player, #player_html5');
            const video = mainPlayer ? mainPlayer.querySelector('video') : null;

            if (video) {
                video.play().then(() => {
                    clearInterval(interval);
                }).catch(() => {
                    video.focus();
                    video.dispatchEvent(new KeyboardEvent('keydown', {'keyCode': 32, 'which': 32}));

                    const playBtn = mainPlayer.querySelector('.hd-play, .cdnplayer-play, [class*="play"]');
                    if (playBtn) playBtn.click();
                });

                if (!video.paused) clearInterval(interval);
            }

            attempts++;
            if (attempts >= 20) clearInterval(interval);
        }, 200);
    }

    // Функция переключения серии
    function switchEpisode(direction) {
        let episodes = Array.from(document.querySelectorAll('.b-simple_episodes__list_item, [data-episode_id], .episodes-list a'));
        episodes = episodes.filter(el => {
            const text = el.textContent.trim().toLowerCase();
            return !text.includes('трейлер') && !text.includes('trailer');
        });

        if (!episodes.length) return;

        const activeIndex = episodes.findIndex(el => el.classList.contains('active') || el.classList.contains('current'));
        if (activeIndex === -1) return;

        let targetIndex = activeIndex + (direction === 'next' ? 1 : -1);

        if (episodes[targetIndex]) {
            const episodeText = episodes[targetIndex].textContent.trim();
            // Вызываем глобальное уведомление о серии из Части 1
            if (window.showRezkaNotification) window.showRezkaNotification(episodeText);

            episodes[targetIndex].click();

            setTimeout(() => {
                forcePlayVideo();
            }, 300);

            setTimeout(() => {
                const psOverlay = document.getElementById('ps-overlay-wrap');
                if (psOverlay) psOverlay.style.display = 'none';
            }, 400);
        }
    }

    // Логика исчезновения зон при замирании мышки (4 секунды)
    let mouseTimeout;
    function showZonesWithFade() {
        if (document.getElementById('rezka-zone-prev')) document.getElementById('rezka-zone-prev').classList.add('visible');
        if (document.getElementById('rezka-zone-next')) document.getElementById('rezka-zone-next').classList.add('visible');

        clearTimeout(mouseTimeout);

        mouseTimeout = setTimeout(() => {
            if (document.getElementById('rezka-zone-prev')) document.getElementById('rezka-zone-prev').classList.remove('visible');
            if (document.getElementById('rezka-zone-next')) document.getElementById('rezka-zone-next').classList.remove('visible');
        }, 4000);
    }

    // Перехват клика
    function handleZoneClick(e, direction) {
        e.stopPropagation();
        e.preventDefault();
        e.stopImmediatePropagation();
        switchEpisode(direction);
        showZonesWithFade();
    }

    // Создаем визуальные зоны
    const btnPrev = document.createElement('div');
    btnPrev.id = 'rezka-zone-prev';
    btnPrev.className = 'rezka-nav-zone';

    const btnNext = document.createElement('div');
    btnNext.id = 'rezka-zone-next';
    btnNext.className = 'rezka-nav-zone';

    // Создаем прозрачные кликовые триггеры внутри зон
    const clickTargetPrev = document.createElement('div');
    clickTargetPrev.className = 'rezka-click-target';
    clickTargetPrev.addEventListener('click', (e) => handleZoneClick(e, 'prev'), true);
    btnPrev.appendChild(clickTargetPrev);

    const clickTargetNext = document.createElement('div');
    clickTargetNext.className = 'rezka-click-target';
    clickTargetNext.addEventListener('click', (e) => handleZoneClick(e, 'next'), true);
    btnNext.appendChild(clickTargetNext);

    window.addEventListener('mousemove', showZonesWithFade, true);
    window.addEventListener('click', showZonesWithFade, true);

    // Стабильный инжектор зон и динамическая подгонка клика под размеры самого тега video
    setInterval(() => {
        const fullscreenEl = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement;
        const mainPlayer = fullscreenEl || document.querySelector('#cdn-player, #player, #player_html5, .b-player');

        if (mainPlayer) {
            if (window.getComputedStyle(mainPlayer).position === 'static') {
                mainPlayer.style.position = 'relative';
            }

            if (!mainPlayer.querySelector('#rezka-zone-next')) {
                mainPlayer.appendChild(btnPrev);
                mainPlayer.appendChild(btnNext);
            }

            // МАТЕМАТИКА ПРОЦЕНТОВ: Считываем размеры живого кадра видео для безопасного клика
            const video = mainPlayer.querySelector('video:not(#ps-overlay-wrap video)');
            if (video) {
                const videoHeight = video.offsetHeight;
                const videoTop = video.offsetTop;

                if (videoHeight > 100) {
                    // Клик занимает ровно 85% от высоты самого видеоряда сверху, нижние 15% кадра ВСЕГДА свободны для панели!
                    const clickHeight = videoHeight * 0.85;

                    clickTargetPrev.style.top = `${videoTop}px`;
                    clickTargetPrev.style.height = `${clickHeight}px`;

                    clickTargetNext.style.top = `${videoTop}px`;
                    clickTargetNext.style.height = `${clickHeight}px`;
                }
            } else {
                clickTargetPrev.style.top = '0px';
                clickTargetPrev.style.height = '70%';
                clickTargetNext.style.top = '0px';
                clickTargetNext.style.height = '70%';
            }
        }
    }, 400);
})();
