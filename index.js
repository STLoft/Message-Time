(() => {
    'use strict';

    const VERSION = '1.0.0';
    const READY_CLASS = 'st-message-time-ready';
    const TIME_CLASS = 'st-mtime';
    const DAY_CLASS = 'st-mtime-new-day';
    const DAY_LABEL_ATTR = 'data-st-mtime-date';

    let chatObserver = null;
    let renderTimer = 0;
    let eventsAttached = false;

    function getContext() {
        try {
            return globalThis.SillyTavern?.getContext?.() ?? null;
        } catch {
            return null;
        }
    }

    function toDate(value) {
        if (!value) return null;
        if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? null : date;
    }

    function dateKey(date) {
        if (!date) return '';
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    function formatDate(date) {
        if (!date) return '';
        return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
    }

    function formatTime(date) {
        if (!date) return '';
        try {
            return new Intl.DateTimeFormat('ko-KR', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
            }).format(date).replace(/\s+/g, ' ').trim();
        } catch {
            const hour = date.getHours();
            const minute = String(date.getMinutes()).padStart(2, '0');
            const ap = hour < 12 ? '오전' : '오후';
            const h12 = hour % 12 || 12;
            return `${ap} ${h12}:${minute}`;
        }
    }

    function getMessage(messageElement) {
        const context = getContext();
        const id = Number(messageElement?.getAttribute('mesid'));
        if (!context || !Number.isInteger(id) || id < 0) return null;
        return context.chat?.[id] ?? null;
    }

    // Each swipe keeps its own send date.
    function getSendDate(message) {
        const swipeId = Number(message?.swipe_id ?? 0);
        const swipe = Array.isArray(message?.swipe_info) ? message.swipe_info[swipeId] : null;
        return toDate(swipe?.send_date ?? message?.send_date);
    }

    function decorateMessages() {
        renderTimer = 0;

        const chatElement = document.querySelector('#chat');
        const context = getContext();
        if (!chatElement || !context?.chat) return;

        document.body.classList.add(READY_CLASS);

        let previousDay = '';

        for (const messageElement of chatElement.querySelectorAll('.mes[mesid]')) {
            const message = getMessage(messageElement);
            if (!message) continue;

            // Normal messages plus ordinary messages hidden from the AI. SillyTavern
            // renders those with is_system="true" but keeps the is_user attribute.
            // Real system notices (.smallSysMes) are left alone.
            const domSystem = messageElement.getAttribute('is_system');
            const isNormalMessage = domSystem === 'false' || !message.is_system;
            const isHiddenOrdinaryMessage =
                domSystem === 'true'
                && messageElement.hasAttribute('is_user')
                && !messageElement.classList.contains('smallSysMes');

            if (!isNormalMessage && !isHiddenOrdinaryMessage) continue;

            const sendDate = getSendDate(message);
            const day = dateKey(sendDate);

            // Date divider above the first message of each day.
            if (day && day !== previousDay) {
                messageElement.classList.add(DAY_CLASS);
                const label = formatDate(sendDate);

                if (messageElement.getAttribute(DAY_LABEL_ATTR) !== label) {
                    messageElement.setAttribute(DAY_LABEL_ATTR, label);
                }
            } else {
                messageElement.classList.remove(DAY_CLASS);
                messageElement.removeAttribute(DAY_LABEL_ATTR);
            }

            if (day) previousDay = day;

            const block = messageElement.querySelector(':scope > .mes_block');
            if (!block || !sendDate) continue;

            let timeElement = block.querySelector(`:scope > .${TIME_CLASS}`);

            if (!timeElement) {
                timeElement = document.createElement('small');
                timeElement.className = TIME_CLASS;
                timeElement.setAttribute('aria-hidden', 'true');
                block.appendChild(timeElement);
            }

            const timeText = formatTime(sendDate);
            if (timeElement.textContent !== timeText) {
                timeElement.textContent = timeText;
            }
        }
    }

    function queueDecorate() {
        if (renderTimer) return;
        renderTimer = window.setTimeout(decorateMessages, 40);
    }

    function attachSillyTavernEvents() {
        if (eventsAttached) return;

        const context = getContext();
        const eventSource = context?.eventSource;
        const eventTypes = context?.eventTypes;

        if (!eventSource || !eventTypes) return;

        for (const type of [
            eventTypes.MESSAGE_RECEIVED || 'message_received',
            eventTypes.CHARACTER_MESSAGE_RENDERED || 'character_message_rendered',
            eventTypes.MESSAGE_SWIPED || 'message_swiped',
        ]) {
            eventSource.on(type, queueDecorate);
        }

        eventSource.on(eventTypes.CHAT_CHANGED || 'chat_id_changed', () => {
            window.setTimeout(queueDecorate, 80);
        });

        eventsAttached = true;
    }

    function attachObserver() {
        const chatElement = document.querySelector('#chat');
        if (!chatElement || !getContext()?.chat) return false;

        chatObserver?.disconnect();

        chatObserver = new MutationObserver(queueDecorate);
        chatObserver.observe(chatElement, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['mesid', 'is_user', 'is_system'],
        });

        attachSillyTavernEvents();
        decorateMessages();

        console.info(`[ST Message Time] v${VERSION} loaded`);
        return true;
    }

    function boot() {
        if (attachObserver()) return;

        let attempts = 0;
        const timer = window.setInterval(() => {
            attempts += 1;
            attachSillyTavernEvents();

            if (attachObserver() || attempts >= 120) {
                window.clearInterval(timer);
            }
        }, 500);
    }

    boot();
})();
