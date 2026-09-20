// Год в футере
document.getElementById('year').textContent = new Date().getFullYear();

// Логотип: возвращаемся наверх без ломки страницы и без пустого хэша
const logo = document.querySelector('.logo');
if (logo) {
    logo.addEventListener('click', (event) => {
        event.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// Мобильное меню
const burger = document.querySelector('.burger');
const navLinks = document.querySelector('.nav-links');

if (burger && navLinks) {
    burger.addEventListener('click', () => {
        navLinks.classList.toggle('active');
    });
}

// Кастомный трекер разделов вместо системного скроллбара
const sectionTracker = document.getElementById('sectionTracker');
const trackedSections = [
    document.querySelector('.hero'),
    ...['about', 'skills', 'projects', 'experience', 'contact']
        .map(sectionId => document.getElementById(sectionId)),
].filter(Boolean);

if (sectionTracker && trackedSections.length) {
    const sectionDots = [...sectionTracker.querySelectorAll('.section-dot')];
    let activeSectionIndex = 0;
    let scrollFrame = 0;

    const updateSectionTracker = () => {
        const viewportCenter = window.innerHeight / 2;
        let nearestSectionIndex = 0;
        let nearestDistance = Infinity;

        trackedSections.forEach((section, index) => {
            const bounds = section.getBoundingClientRect();
            const sectionCenter = bounds.top + bounds.height / 2;
            const distance = Math.abs(sectionCenter - viewportCenter);

            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestSectionIndex = index;
            }
        });

        if (nearestSectionIndex === activeSectionIndex) return;

        activeSectionIndex = nearestSectionIndex;
        sectionDots.forEach((dot, index) => {
            const isActive = index === activeSectionIndex;
            dot.classList.toggle('is-active', isActive);
            dot.setAttribute('aria-current', String(isActive));
        });
    };

    window.addEventListener('scroll', () => {
        if (scrollFrame) return;
        scrollFrame = requestAnimationFrame(() => {
            updateSectionTracker();
            scrollFrame = 0;
        });
    }, { passive: true });

    sectionDots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            trackedSections[index].scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });

    updateSectionTracker();
}

// Калькулятор операций над двумя числами
const calculatorForm = document.getElementById('calculatorForm');
const calculatorResult = document.getElementById('calculatorResult');
const calculatorNumberInputs = calculatorForm?.querySelectorAll('input[name="firstNumber"], input[name="secondNumber"]') || [];
const calculatorOperation = document.getElementById('calculatorOperation');
const operationButtons = document.querySelectorAll('.operation-button');
const calculatorToggle = document.getElementById('calculatorToggle');
const calculatorWindow = document.getElementById('calculatorWindow');
const calculatorClose = document.getElementById('calculatorClose');
const calculatorHeader = document.getElementById('calculatorHeader');

// Переключение представления компетенций
const skillsTabs = document.querySelectorAll('.skills-tab');
const skillsPanels = document.querySelectorAll('.skills-panel');
const skillsTabsWrap = document.querySelector('.skills-tabs');
const skillsTabIndicator = document.querySelector('.skills-tab-indicator');

const devtoolsButton = document.getElementById('devtoolsButton');
if (devtoolsButton) {
    devtoolsButton.addEventListener('click', () => {
        window.dispatchEvent(new KeyboardEvent('keydown', {
            key: 'F12',
            code: 'F12',
            keyCode: 123,
            which: 123,
            bubbles: true,
        }));
        devtoolsButton.textContent = 'Нажмите F12';
    });
}

const updateSkillsIndicator = () => {
    const activeTab = document.querySelector('.skills-tab.is-active');
    if (!activeTab || !skillsTabsWrap || !skillsTabIndicator) return;

    const tabBounds = activeTab.getBoundingClientRect();
    const tabsBounds = skillsTabsWrap.getBoundingClientRect();
    skillsTabsWrap.style.setProperty('--indicator-width', `${tabBounds.width}px`);
    skillsTabsWrap.style.setProperty('--indicator-offset', `${tabBounds.left - tabsBounds.left}px`);
    skillsTabsWrap.style.setProperty('--indicator-y', `${tabBounds.bottom - tabsBounds.top - 3}px`);
};

skillsTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        skillsTabs.forEach(currentTab => {
            const isSelected = currentTab === tab;
            currentTab.classList.toggle('is-active', isSelected);
            currentTab.setAttribute('aria-selected', String(isSelected));
        });

        skillsPanels.forEach(panel => {
            const isSelected = panel.id === tab.dataset.panel;

            if (!isSelected) {
                panel.classList.remove('is-active');
                panel.hidden = true;
                return;
            }

            panel.hidden = false;
            requestAnimationFrame(() => {
                panel.classList.add('is-active');

                panel.querySelectorAll('tbody tr').forEach(row => {
                    row.style.animation = 'none';
                    row.offsetHeight;
                    row.style.animation = '';
                });
            });
        });

        updateSkillsIndicator();
    });
});

updateSkillsIndicator();
window.addEventListener('resize', updateSkillsIndicator);

const parseCalculatorNumber = value => {
    const normalizedValue = String(value || '').trim().replace(/[.,\s\u00a0]/g, '');
    return normalizedValue ? Number(normalizedValue) : NaN;
};

const formatCalculatorNumber = value => new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: 20,
}).format(value).replace(/[\u00a0\u202f]/g, ' ');

const armCalculatorInputReset = () => {
    calculatorNumberInputs.forEach(input => {
        input.dataset.clearOnFocus = 'true';
    });
};

calculatorNumberInputs.forEach(input => {
    input.addEventListener('focus', () => {
        if (input.dataset.clearOnFocus !== 'true' || !input.value) return;

        input.value = '';
        delete input.dataset.clearOnFocus;
    });
});

const copyTextToClipboard = async text => {
    if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return;
    }

    const temporaryInput = document.createElement('textarea');
    temporaryInput.value = text;
    temporaryInput.setAttribute('readonly', '');
    temporaryInput.style.position = 'fixed';
    temporaryInput.style.opacity = '0';
    document.body.appendChild(temporaryInput);
    temporaryInput.select();

    const copied = document.execCommand('copy');
    temporaryInput.remove();

    if (!copied) throw new Error('Не удалось скопировать результат.');
};

if (calculatorForm && calculatorResult) {
    calculatorForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const formData = new FormData(calculatorForm);
        const firstNumber = parseCalculatorNumber(formData.get('firstNumber'));
        const secondNumber = parseCalculatorNumber(formData.get('secondNumber'));
        const operation = formData.get('operation');
        let result;

        if (!Number.isFinite(firstNumber) || !Number.isFinite(secondNumber)) {
            calculatorResult.className = 'calculator-result is-error';
            calculatorResult.textContent = 'Введите корректные числа';
            delete calculatorResult.dataset.value;
            return;
        }

        if (operation === 'add') result = firstNumber + secondNumber;
        if (operation === 'subtract') result = firstNumber - secondNumber;
        if (operation === 'multiply') result = firstNumber * secondNumber;

        if (operation === 'divide') {
            if (secondNumber === 0) {
                calculatorResult.className = 'calculator-result is-error';
                calculatorResult.textContent = 'На ноль делить нельзя';
                delete calculatorResult.dataset.value;
                return;
            }
            result = firstNumber / secondNumber;
        }

        calculatorResult.className = 'calculator-result';
        const formattedResult = formatCalculatorNumber(result);
        calculatorResult.dataset.value = formattedResult;
        calculatorResult.textContent = formattedResult;
        armCalculatorInputReset();
    });

    let copyMessageTimer;

    calculatorResult.addEventListener('click', async () => {
        const resultValue = calculatorResult.dataset.value;
        if (!resultValue) return;

        try {
            await copyTextToClipboard(resultValue);
            calculatorResult.className = 'calculator-result is-copied';
            calculatorResult.textContent = 'Скопировано';
            clearTimeout(copyMessageTimer);
            copyMessageTimer = setTimeout(() => {
                calculatorResult.className = 'calculator-result';
                calculatorResult.textContent = resultValue;
            }, 1200);
        } catch (error) {
            calculatorResult.className = 'calculator-result is-error';
            calculatorResult.textContent = 'Не удалось скопировать';
            clearTimeout(copyMessageTimer);
            copyMessageTimer = setTimeout(() => {
                calculatorResult.className = 'calculator-result';
                calculatorResult.textContent = resultValue;
            }, 1600);
        }
    });
}

operationButtons.forEach(button => {
    button.addEventListener('click', () => {
        operationButtons.forEach(operationButton => {
            const isSelected = operationButton === button;
            operationButton.classList.toggle('is-selected', isSelected);
            operationButton.setAttribute('aria-pressed', String(isSelected));
        });

        if (calculatorOperation) {
            calculatorOperation.value = button.dataset.operation;
        }
    });
});

// Показываем кнопку только во время просмотра таблицы
const experienceTable = document.querySelector('.experience-table-wrap');

if (experienceTable && calculatorToggle && calculatorWindow) {
    let isTableVisible = false;
    let isCalculatorOpen = false;

    const updateCalculatorToggle = () => {
        const shouldShowToggle = isTableVisible && !isCalculatorOpen;
        calculatorToggle.classList.toggle('is-visible', shouldShowToggle);
        calculatorToggle.setAttribute('aria-hidden', String(!shouldShowToggle));
    };

    const tableObserver = new IntersectionObserver(([entry]) => {
        isTableVisible = entry.isIntersecting;
        updateCalculatorToggle();
    }, { threshold: 0.05 });

    tableObserver.observe(experienceTable);

    calculatorToggle.addEventListener('click', () => {
        isCalculatorOpen = true;
        calculatorWindow.hidden = false;
        calculatorToggle.setAttribute('aria-expanded', 'true');
        updateCalculatorToggle();
    });

    calculatorClose?.addEventListener('click', () => {
        isCalculatorOpen = false;
        calculatorWindow.hidden = true;
        calculatorToggle.setAttribute('aria-expanded', 'false');
        updateCalculatorToggle();
    });
}

// Перетаскивание окна за заголовок мышью или пальцем
if (calculatorHeader && calculatorWindow) {
    let dragState = null;

    calculatorHeader.addEventListener('pointerdown', (event) => {
        if (event.target.closest('button')) return;

        const bounds = calculatorWindow.getBoundingClientRect();
        dragState = {
            offsetX: event.clientX - bounds.left,
            offsetY: event.clientY - bounds.top,
        };
        calculatorHeader.setPointerCapture(event.pointerId);
    });

    calculatorHeader.addEventListener('pointermove', (event) => {
        if (!dragState) return;

        const maxX = window.innerWidth - calculatorWindow.offsetWidth - 8;
        const maxY = window.innerHeight - calculatorWindow.offsetHeight - 8;
        const left = Math.min(Math.max(8, event.clientX - dragState.offsetX), maxX);
        const top = Math.min(Math.max(8, event.clientY - dragState.offsetY), maxY);

        calculatorWindow.style.left = `${left}px`;
        calculatorWindow.style.top = `${top}px`;
        calculatorWindow.style.right = 'auto';
    });

    calculatorHeader.addEventListener('pointerup', () => {
        dragState = null;
    });

    calculatorHeader.addEventListener('pointercancel', () => {
        dragState = null;
    });
}

// Создание сделки через входящий вебхук Bitrix24
const dealForm = document.getElementById('dealForm');
const createDealBtn = document.getElementById('createDealBtn');
const dealFormStatus = document.getElementById('dealFormStatus');
const bitrixWebhookUrl = 'https://b24-od3dd2.bitrix24.ru/rest/1/ob14ff7ksm9lv0rw/';

if (dealForm && createDealBtn && dealFormStatus) {
    dealForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(dealForm);
        const name = String(formData.get('name') || '').trim();
        const contact = String(formData.get('contact') || '').trim();
        const comment = String(formData.get('comment') || '').trim();

        createDealBtn.disabled = true;
        dealFormStatus.className = 'deal-form-status';
        dealFormStatus.textContent = 'Создаём сделку...';

        try {
            const response = await fetch(`${bitrixWebhookUrl}crm.deal.add.json`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fields: {
                        TITLE: `Заявка с сайта: ${name}`,
                        COMMENTS: [
                            `Контакт: ${contact}`,
                            comment || 'Заявка отправлена с сайта.',
                        ].join('\n'),
                        SOURCE_ID: 'WEB',
                    },
                }),
            });
            const result = await response.json();

            if (!response.ok || result.error) {
                throw new Error(result.error_description || 'Bitrix24 не принял запрос.');
            }

            dealFormStatus.className = 'deal-form-status is-success';
            dealFormStatus.textContent = `Ваша заявка номер ${result.result} успешно отправлена через входящий вебхук.`;
            dealForm.reset();
        } catch (error) {
            dealFormStatus.className = 'deal-form-status is-error';
            dealFormStatus.textContent = error.message || 'Не удалось создать сделку. Необходимо сменить вебхук.';
        } finally {
            createDealBtn.disabled = false;
        }
    });
}

// Закрываем меню при клике по ссылке
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
        navLinks.classList.remove('active');
    });
});

// Плавное появление карточек при скролле
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, { threshold: 0.1 });

document.querySelectorAll('.skill-card, .project-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
});

// Лёгкое движение аватара в сторону, противоположную курсору
const hero = document.querySelector('.hero');
const heroAvatar = document.querySelector('.hero-avatar');

if (hero && heroAvatar && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const maxShift = 10;
    let targetX = 0;
    let targetY = 0;
    let shiftX = 0;
    let shiftY = 0;
    const followEase = 0.045;
    let animationFrame;

    const animateAvatar = () => {
        shiftX += (targetX - shiftX) * followEase;
        shiftY += (targetY - shiftY) * followEase;
        heroAvatar.style.transform = `translate3d(${shiftX.toFixed(2)}px, ${shiftY.toFixed(2)}px, 0)`;

        if (Math.abs(targetX - shiftX) > 0.01 || Math.abs(targetY - shiftY) > 0.01) {
            animationFrame = requestAnimationFrame(animateAvatar);
        } else {
            animationFrame = 0;
        }
    };

    hero.addEventListener('pointermove', event => {
        const bounds = hero.getBoundingClientRect();
        const relativeX = (event.clientX - bounds.left) / bounds.width - 0.5;
        const relativeY = (event.clientY - bounds.top) / bounds.height - 0.5;

        targetX = -relativeX * maxShift;
        targetY = -relativeY * maxShift;

        if (!animationFrame) animationFrame = requestAnimationFrame(animateAvatar);
    });

    hero.addEventListener('pointerleave', () => {
        targetX = 0;
        targetY = 0;
        if (!animationFrame) animationFrame = requestAnimationFrame(animateAvatar);
    });
}
/* ==========================================================
   Динамический BPMN-фон на canvas
   Аккуратная «живая» схема: пулы, задачи, шлюзы, события,
   мягкие пунктирные потоки. Гармонирует с тёплой палитрой.
   ========================================================== */
(function () {
    const canvas = document.getElementById('bpmn-bg');
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    let W = 0, H = 0, DPR = 1;
    let backgroundGradient;
    let animationId = 0;
    let lastFrame = 0;
    const frameInterval = 1000 / 30;
    const MAX_STREAM_SPEED = 2.4;

    const limitVelocity = (vx, vy, maxSpeed = MAX_STREAM_SPEED) => {
        const speed = Math.hypot(vx, vy);
        if (!Number.isFinite(speed) || speed <= maxSpeed) return { vx, vy };

        const scale = maxSpeed / speed;
        return {
            vx: vx * scale,
            vy: vy * scale,
        };
    };

    // Палитра — тянем из CSS-переменных
    const css = getComputedStyle(document.documentElement);
    const COL = {
        line:   css.getPropertyValue('--accent').trim()      || '#c78b4a',
        soft:   css.getPropertyValue('--accent-2').trim()    || '#e8c9a0',
        border: css.getPropertyValue('--border').trim()      || '#4a3424',
        muted:  css.getPropertyValue('--text-muted').trim()  || '#b89f84',
    };

    const rand  = (min, max) => Math.random() * (max - min) + min;
    const randI = (min, max) => Math.floor(rand(min, max + 1));
    const pick  = arr => arr[(Math.random() * arr.length) | 0];

    /* ---------- Утилиты ---------- */

    // Скруглённый прямоугольник
    function roundRect(x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y,     x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x,     y + h, r);
        ctx.arcTo(x,     y + h, x,     y,     r);
        ctx.arcTo(x,     y,     x + w, y,     r);
        ctx.closePath();
    }

    /* ---------- Генерация сцены ---------- */
    /*
       Сцена — это несколько «дорожек» (streams). Внутри каждой
       цепочка BPMN-фигур, соединённых потоками. Дорожки медленно
       плывут вверх/вниз и по горизонтали, «дышат» по яркости.
    */

    let streams = [];

    function makeNode(kind) {
        // kind: 'event' | 'task' | 'gateway' | 'event-end'
        switch (kind) {
            case 'event':
                return { kind, w: 26, h: 26 };
            case 'event-end':
                return { kind, w: 30, h: 30 };
            case 'task':
                return { kind, w: rand(74, 118), h: rand(44, 56) };
            case 'gateway':
                return { kind, w: 42, h: 42 };
        }
    }

    // Последовательность фигур внутри дорожки
    function buildNodeSequence() {
        const seq = [];
        seq.push(makeNode('event'));                        // старт
        const middleCount = randI(5, 8);
        let lastWasGateway = false;
        for (let i = 0; i < middleCount; i++) {
            // после шлюза ставим задачу, чтобы не было двух шлюзов подряд
            if (lastWasGateway || Math.random() < 0.58) {
                seq.push(makeNode('task'));
                lastWasGateway = false;
            } else {
                seq.push(makeNode('gateway'));
                lastWasGateway = true;
            }
        }
        seq.push(makeNode('event-end'));                    // конец
        return seq;
    }

    function makeStream(initial) {
        const nodes = buildNodeSequence();
        const gap = rand(34, 58);
        const dirRight = Math.random() < 0.5;                // направление потока

        // суммарная ширина дорожки
        let totalW = 0;
        nodes.forEach(n => totalW += n.w);
        totalW += gap * (nodes.length - 1);

        // разместим элементы вдоль оси X
        let cursor = 0;
        const placed = nodes.map((n, i) => {
            const node = {
                ...n,
                x: cursor + n.w / 2,
                y: 0,
                phase: Math.random() * Math.PI * 2,
                delay: i * 0.35,        // для «проявления» потока
            };
            cursor += n.w + gap;
            return node;
        });

        if (!dirRight) {
            // отзеркаливаем по X
            placed.forEach(n => { n.x = totalW - n.x; });
        }

        // связи между соседними узлами
        const links = [];
        for (let i = 0; i < placed.length - 1; i++) {
            links.push({
                from: i,
                to: i + 1,
                progress: Math.random(),
                speed: rand(0.25, 0.45),
                alpha: 0,
                headAlpha: 0,
                fadeIn: rand(0.8, 1.4),
                fadeOut: rand(0.4, 0.8),
                holdTimer: 0,
                holdDuration: rand(0.4, 1.0),
                holding: false,
            });
        }

        // начальная позиция дорожки
        const startY = initial ? rand(H * 0.1, H * 0.9) : rand(-H * 0.2, H * 1.2);
        const startX = rand(-totalW * 0.15, W - totalW * 0.85);

        return {
            nodes: placed,
            links,
            totalW,
            x: startX,
            y: startY,
            targetY: startY,
            vx: rand(-0.06, 0.06),
            vy: rand(-0.05, 0.05),
            alpha: rand(0.16, 0.27),                            // общая прозрачность
            scale: rand(0.82, 1.08),
            phase: Math.random() * Math.PI * 2,
            breatheSpeed: rand(0.25, 0.45),
            // плавное «дыхание» положения
            swayAmpX: rand(6, 16),
            swayAmpY: rand(4, 10),
            swaySpeed: rand(0.2, 0.35),
        };
    }

    function getStreamBounds(stream, swayX = 0, swayY = 0, breathe = 1) {
        const scale = stream.scale * breathe;
        const maxNodeH = Math.max(...stream.nodes.map(node => node.h));

        return {
            left: stream.x + swayX - 28 * scale,
            right: stream.x + swayX + (stream.totalW + 28) * scale,
            top: stream.y + swayY - maxNodeH * scale / 2 - 28 * scale,
            bottom: stream.y + swayY + maxNodeH * scale / 2 + 28 * scale,
        };
    }

    function boundsOverlap(first, second) {
        return first.left < second.right && first.right > second.left
            && first.top < second.bottom && first.bottom > second.top;
    }

    function separateStreams() {
        for (let pass = 0; pass < 3; pass++) {
            for (let i = 0; i < streams.length; i++) {
                const first = streams[i];
                const firstBounds = getStreamBounds(first);

                for (let j = i + 1; j < streams.length; j++) {
                    const second = streams[j];
                    const secondBounds = getStreamBounds(second);

                    if (!boundsOverlap(firstBounds, secondBounds)) continue;

                    const firstCenter = (firstBounds.top + firstBounds.bottom) / 2;
                    const secondCenter = (secondBounds.top + secondBounds.bottom) / 2;
                    const separation = (firstBounds.bottom - secondBounds.top) / 2 + 8;
                    const direction = firstCenter <= secondCenter ? -1 : 1;
                    const push = Math.min(12, separation * 0.18);

                    // Мягкое отталкивание через targetY, чтобы дорожки не «телепортировались».
                    first.targetY += push * direction;
                    second.targetY -= push * direction;
                    first.vy += direction * 0.16;
                    second.vy -= direction * 0.16;

                    const firstLimited = limitVelocity(first.vx, first.vy);
                    const secondLimited = limitVelocity(second.vx, second.vy);
                    first.vx = firstLimited.vx;
                    first.vy = firstLimited.vy;
                    second.vx = secondLimited.vx;
                    second.vy = secondLimited.vy;
                }
            }
        }
    }

    function buildScene() {
        // Больше дорожек и узлов создают плотный слой схемы на фоне.
        const density = (W * H) / 170000;
        const count = Math.max(5, Math.min(10, Math.round(density)));
        streams = Array.from({ length: count }, () => makeStream(true));
        separateStreams();
    }

    /* ---------- Отрисовка ---------- */

    function drawEventNode(n, isStart) {
        const r = n.w / 2;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.stroke();
        // внутреннее кольцо — деликатное
        ctx.globalAlpha *= 0.55;
        ctx.beginPath();
        ctx.arc(0, 0, r * (isStart ? 0.68 : 0.78), 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha /= 0.55;
    }

    function drawTaskNode(n) {
        roundRect(-n.w / 2, -n.h / 2, n.w, n.h, 8);
        ctx.stroke();
        // две «строки текста» внутри задачи
        ctx.globalAlpha *= 0.45;
        const pad = 10;
        ctx.beginPath();
        ctx.moveTo(-n.w / 2 + pad, -3);
        ctx.lineTo( n.w / 2 - pad, -3);
        ctx.moveTo(-n.w / 2 + pad,  8);
        ctx.lineTo( n.w / 2 - pad * 2.2, 8);
        ctx.stroke();
        ctx.globalAlpha /= 0.45;
    }

    function drawGatewayNode(n) {
        const s = n.w / 2;
        ctx.beginPath();
        ctx.moveTo(0, -s);
        ctx.lineTo(s, 0);
        ctx.lineTo(0, s);
        ctx.lineTo(-s, 0);
        ctx.closePath();
        ctx.stroke();
        // маркер исключающего шлюза — «X»
        ctx.globalAlpha *= 0.5;
        const k = s * 0.32;
        ctx.beginPath();
        ctx.moveTo(-k, -k); ctx.lineTo(k, k);
        ctx.moveTo( k, -k); ctx.lineTo(-k, k);
        ctx.stroke();
        ctx.globalAlpha /= 0.5;
    }

    // Рисуем пунктирный поток между двумя точками с постепенным проявлением.
    // Наконечник стрелки должен затухать плавно, а не исчезать мгновенно.
    function drawFlow(x1, y1, x2, y2, progress, headAlpha = 1) {
        if (progress <= 0.001) return;

        const px = x1 + (x2 - x1) * progress;
        const py = y1 + (y2 - y1) * progress;

        ctx.save();
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(px, py);
        ctx.stroke();
        ctx.setLineDash([]);

        if (progress > 0.15) {
            const ang = Math.atan2(y2 - y1, x2 - x1);
            const ah = 7;
            const previousAlpha = ctx.globalAlpha;
            ctx.globalAlpha = previousAlpha * headAlpha;
            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.lineTo(px - ah * Math.cos(ang - 0.45), py - ah * Math.sin(ang - 0.45));
            ctx.moveTo(px, py);
            ctx.lineTo(px - ah * Math.cos(ang + 0.45), py - ah * Math.sin(ang + 0.45));
            ctx.stroke();
        }

        ctx.restore();
    }

    /* ---------- Цикл ---------- */

    let last = performance.now();
    let t = 0;
    let animate = true;

    function frame(now) {
        if (lastFrame && now - lastFrame < frameInterval) {
            animationId = requestAnimationFrame(frame);
            return;
        }
        lastFrame = now;
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        t += dt;

        ctx.clearRect(0, 0, W, H);

        // Тёплый радиальный градиент — «дыхание» фона
        ctx.fillStyle = backgroundGradient;
        ctx.fillRect(0, 0, W, H);

        ctx.lineJoin = 'round';
        ctx.lineCap  = 'round';

        separateStreams();

        for (const s of streams) {
            // мягкое смещение и дрейф всей дорожки
            s.vx *= 0.985;
            s.vy *= 0.965;

            const limitedVelocity = limitVelocity(s.vx, s.vy, MAX_STREAM_SPEED);
            s.vx = limitedVelocity.vx;
            s.vy = limitedVelocity.vy;

            s.x += s.vx * 60 * dt;
            s.y += (s.targetY - s.y) * 0.08;
            s.y += s.vy * 60 * dt;

            // «дыхание» положения
            const swayX = Math.sin(t * s.swaySpeed + s.phase) * s.swayAmpX;
            const swayY = Math.cos(t * s.swaySpeed * 1.3 + s.phase) * s.swayAmpY;

            // если дорожка ушла слишком далеко — заворачиваем
            if (s.x - s.totalW * 0.5 > W + 120) s.x = -s.totalW * 0.5 - 120;
            if (s.x + s.totalW * 0.5 < -120)    s.x = W + s.totalW * 0.5 + 120;
            if (s.y - 100 > H + 100)            s.y = -100 - 40;
            if (s.y + 100 < -100)               s.y = H + 140;

            const breathe = 1 + Math.sin(t * s.breatheSpeed + s.phase) * 0.05;

            ctx.save();
            ctx.translate(s.x + swayX, s.y + swayY);
            ctx.scale(s.scale * breathe, s.scale * breathe);

            // Сначала — потоки (под фигурами)
            ctx.strokeStyle = COL.soft;
            ctx.lineWidth = 1.3;
            for (const link of s.links) {
                const a = s.nodes[link.from];
                const b = s.nodes[link.to];

                link.progress += dt * link.speed;

                if (link.progress >= 1) {
                    link.progress = 1;
                    if (!link.holding) {
                        link.holding = true;
                        link.holdTimer = link.holdDuration;
                    } else {
                        link.holdTimer -= dt;
                        if (link.holdTimer <= 0) {
                            link.alpha -= dt * link.fadeOut;
                            if (link.alpha <= 0) {
                                link.alpha = 0;
                                link.progress = 0;
                                link.headAlpha = 0;
                                link.holdTimer = 0;
                                link.holding = false;
                            }
                        }
                    }
                } else {
                    link.alpha = Math.min(1, link.alpha + dt * link.fadeIn);
                }

                if (link.alpha > 0.02) {
                    link.headAlpha = link.progress > 0.02
                        ? Math.min(1, link.headAlpha + dt * 4.5)
                        : Math.max(0, link.headAlpha - dt * 5);
                } else {
                    link.headAlpha = Math.max(0, link.headAlpha - dt * 7);
                }

                ctx.globalAlpha = s.alpha * 1.15 * link.alpha;
                drawFlow(a.x, a.y, b.x, b.y, link.progress, link.headAlpha);
                ctx.setLineDash([]);
            }

            // Затем — узлы
            for (const n of s.nodes) {
                ctx.save();
                ctx.translate(n.x, n.y);

                // пульсация размера — очень деликатная
                const pulse = 1 + Math.sin(t * 0.8 + n.phase) * 0.025;
                ctx.scale(pulse, pulse);

                ctx.globalAlpha = Math.min(0.36, s.alpha * 1.18);
                ctx.strokeStyle = COL.line;
                ctx.lineWidth = 1.8;

                // Свечение через яркую линию дешевле, чем shadowBlur на каждом узле.
                ctx.shadowBlur = 0;

                switch (n.kind) {
                    case 'event':
                        drawEventNode(n, true);
                        break;
                    case 'event-end':
                        drawEventNode(n, false);
                        break;
                    case 'task':
                        drawTaskNode(n);
                        break;
                    case 'gateway':
                        drawGatewayNode(n);
                        break;
                }
                ctx.restore();
            }

            ctx.restore();
        }

        if (animate) animationId = requestAnimationFrame(frame);
    }

    /* ---------- Resize / init ---------- */

    function resize() {
        DPR = Math.min(1.5, window.devicePixelRatio || 1);
        W = window.innerWidth;
        H = window.innerHeight;
        canvas.width  = W * DPR;
        canvas.height = H * DPR;
        canvas.style.width  = W + 'px';
        canvas.style.height = H + 'px';
        ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
        const cx = W * 0.35, cy = H * 0.4;
        backgroundGradient = ctx.createRadialGradient(
            cx, cy, 0,
            cx, cy, Math.max(W, H) * 0.85
        );
        backgroundGradient.addColorStop(0, 'rgba(199, 139, 74, 0.10)');
        backgroundGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        buildScene();
    }

    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(resize, 220);
    });

    // Пауза, когда вкладка неактивна
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            cancelAnimationFrame(animationId);
            animationId = 0;
        } else {
            last = performance.now();
            lastFrame = 0;
            if (animate && !animationId) animationId = requestAnimationFrame(frame);
        }
    });

    resize();
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        animate = false;
        frame(performance.now());
    } else {
        animationId = requestAnimationFrame(frame);
    }
})();

/* ===== Данные кейсов =====
   Добавляете новый кейс — просто дописываете объект в массив.
   Порядок в массиве = порядок в ленте.
*/
const PROJECTS = [
    {
        hours: "300ч+",
        image: "beton.jpeg",
        alt: "Производитель бетона",
        title: "Производитель бетона",
        description:
            "Стандартная организация работы отдела продаж, разработка объёмных бизнес-процессов на согласование документов, кастомизация портала. Автоматизация документооборота. Онлайн-запись аренды оборудования.",
        tags: ["B2B", "Бизнес-процессы", "Документооборот", "Онлайн-запись"],
    },
    {
        hours: "120ч",
        image: "uhasstok.jpg",
        alt: "Застройщик частных домов",
        title: "Застройщик частных домов",
        description:
            "Анализ рабочих процессов проектной группы. Автоматизация постановки и контроля за сроками задач. Разработка BI отчётов на конструкторе с использованием SQL для отслеживания источников трафика по регионам.",
        tags: ["B2C", "Проекты & задачи", "Маркетинг", "Автоматизация рабочих циклов"],
    },
    {
        hours: "250ч+",
        image: "zakup.jpg",
        alt: "Отдел закупок",
        title: "Отдел закупок",
        description:
            "Автоматизация рутины, создание системы учёта компаний-посредников, разработка процессов конкурсов и системы рейтинга. Оценка эффективности работы с разными посредниками. Автоматические сценарии под нужды отдела продаж. Синхронизация с 1C:ERP.",
        tags: ["Отдел закупок", "Бизнес-процессы", "Складской учёт", "1C", "Метрики"],
    },
    {
    hours: "90ч",
    image: "b96c5ff22cc7cea83a8d.jpg",
    alt: "Онлайн школа",
    title: "Онлайн школа",
    description: "Кастомизированная разработка коробочной версии со сквозной передачей данных между модулями и мониторингом акций. Разработка кастомизированных бизнес-процессов с php и REST-API доработками. Подключение мессенджеров и виртуальной телефонии. После окончания внедрения, передача клиента в другие команды разработки.",
    tags: ["B2C", "Виртуальная ATC", "Разработка","LTV стратегия","REST API"],
},
{
    hours: "180ч",
    image: "about-new26.jpg",
    alt: "Изготовитель премиальной мебели",
    title: "Изготовитель премиальной мебели",
    description: "Чистка текущей системы клиента, настройка работы с дублями и открытых линий. Автоматизация работы с документооборотом. Масштабная интеграция с 1C:УТ. Настройка и автоматизация форм связи. Настройка административной части портала и обновление лицензий.",
    tags: ["B2B", "Сопровождение", "1C","CRM Формы", "Открытые линии"],
}, 
{
    hours: "от 40ч",
    image: "image_2026-09-15_16-50-47.png",
    alt: "Изготовитель премиальной мебели",
    title: "Внедрение маркетинга",
    description: "Документация, разработанная для внедрения по направлению маркетинга. Содержит описание, рекомендации по внедрению и список инструментов для централизации, компоновки и использования данных в маркетинговых целях.",
    tags: ["Модуль", "Сопровождение", "Маркетинг","Допродажа","SQL"],
}, // // ← добавляйте новые кейсы здесь
];

/* ===== Отрисовка ленты ===== */
const grid = document.getElementById("projectsGrid");
const loadMoreBtn = document.getElementById("loadMoreBtn");

const BATCH_SIZE = 6;      // сколько карточек показывать за раз
let rendered = 0;

function escapeHtml(str = "") {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function createCard(project) {
    const article = document.createElement("article");
    article.className = "project-card";

    const tags = (project.tags || [])
        .map((t) => `<span>${escapeHtml(t)}</span>`)
        .join("");

    article.innerHTML = `
        <span class="project-hours">${escapeHtml(project.hours)}</span>
        <div class="project-image">
            <img src="${escapeHtml(project.image)}"
                 alt="${escapeHtml(project.alt || project.title)}"
                 loading="lazy">
        </div>
        <div class="project-info">
            <h3>${escapeHtml(project.title)}</h3>
            <p>${escapeHtml(project.description)}</p>
            <div class="project-tags">${tags}</div>
        </div>
    `;

    return article;
}

function renderBatch() {
    const slice = PROJECTS.slice(rendered, rendered + BATCH_SIZE);

    slice.forEach((project, i) => {
        const card = createCard(project);
        // лёгкая каскадная анимация появления
        card.style.opacity = "0";
        card.style.transform = "translateY(12px)";
        card.style.transition = "opacity .4s ease, transform .4s ease";
        grid.appendChild(card);

        requestAnimationFrame(() => {
            setTimeout(() => {
                card.style.opacity = "1";
                card.style.transform = "translateY(0)";
            }, i * 60);
        });
    });

    rendered += slice.length;

    if (rendered >= PROJECTS.length && loadMoreBtn) {
        loadMoreBtn.style.display = "none";
    }
}

if (grid) {
    renderBatch();
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener("click", renderBatch);
    }
}