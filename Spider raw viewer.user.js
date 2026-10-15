// ==UserScript==
// @name         Spider raw viewer
// @namespace    tampermonkey-description-viewer
// @version      1.0.5
// @description  Показывает исходный текст описания ячейки без интерпретации HTML
// @author       Heono3HaHbiu
// @match        https://spider.pulscen.ru/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';

    const CELL_SELECTORS = [
    '.cell.cell__description',
    '.cell.cell__working_note',
    '.cell.cell__working_note_2',
    '.cell.cell__working_note_3'
];

const SOURCE_SELECTOR = '.field-wrapper > span.stretch[data-value]';

const FIELD_NAMES = {
    description: 'Описание',
    working_note: 'Рабочая заметка 1',
    working_note_2: 'Рабочая заметка 2',
    working_note_3: 'Рабочая заметка 3'
};
    const SOURCE_SELECTOR = '.field-wrapper > span.stretch[data-value]';
    const style = document.createElement('style');
    style.textContent = `
        .raw-text-viewer-icon {
            position: absolute;
            right: 6px;
            bottom: 6px;
            z-index: 1000;
            width: 28px;
            height: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1px solid #aaa;
            border-radius: 6px;
            background: #fff;
            color: #333;
            cursor: pointer;
            font-size: 17px;
            box-shadow: 0 1px 4px rgba(0,0,0,.2);
        }

        .raw-text-viewer-icon:hover {
            background: #e8f2ff;
            border-color: #4285f4;
        }

        .raw-text-viewer-overlay {
            position: fixed;
            inset: 0;
            z-index: 2147483647;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
            background: rgba(0,0,0,.55);
        }

        .raw-text-viewer-window {
            display: flex;
            flex-direction: column;
            width: min(900px, 95vw);
            height: min(700px, 90vh);
            padding: 16px;
            gap: 12px;
            border-radius: 10px;
            background: #fff;
            box-shadow: 0 8px 32px rgba(0,0,0,.3);
        }

        .raw-text-viewer-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            font: 600 16px sans-serif;
            color: #222;
        }

        .raw-text-viewer-close {
            border: 0;
            background: transparent;
            cursor: pointer;
            font-size: 26px;
            color: #555;
        }

        .raw-text-viewer-textarea {
            box-sizing: border-box;
            flex: 1;
            width: 100%;
            min-height: 0;
            resize: none;
            padding: 12px;
            border: 1px solid #ccc;
            border-radius: 6px;
            background: #fafafa;
            color: #111;
            font: 13px/1.5 monospace;
            white-space: pre;
            tab-size: 4;
        }

        .raw-text-viewer-copy {
            align-self: flex-end;
            padding: 8px 16px;
            border: 0;
            border-radius: 6px;
            background: #2675d8;
            color: white;
            cursor: pointer;
        }
    `;
    document.head.appendChild(style);
    function showRawText(rawText, cellId) {
        const overlay = document.createElement('div');
        overlay.className = 'raw-text-viewer-overlay';

        const windowEl = document.createElement('div');
        windowEl.className = 'raw-text-viewer-window';

        const header = document.createElement('div');
        header.className = 'raw-text-viewer-header';

        const title = document.createElement('span');
        title.textContent = `Исходный текст — ID: ${cellId || 'не указан'}`;

        const close = document.createElement('button');
        close.className = 'raw-text-viewer-close';
        close.type = 'button';
        close.textContent = '×';
        close.title = 'Закрыть';

        const textarea = document.createElement('textarea');
        textarea.className = 'raw-text-viewer-textarea';
        textarea.readOnly = true;
        textarea.value = rawText;

        const copy = document.createElement('button');
        copy.className = 'raw-text-viewer-copy';
        copy.type = 'button';
        copy.textContent = 'Копировать текст';

        function closeWindow() {
            overlay.remove();
            document.removeEventListener('keydown', onKeyDown);
        }

        function onKeyDown(event) {
            if (event.key === 'Escape') closeWindow();
        }

        close.addEventListener('click', closeWindow);

        overlay.addEventListener('click', event => {
            if (event.target === overlay) closeWindow();
        });

        copy.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(rawText);
                copy.textContent = 'Скопировано!';
            } catch {
                textarea.focus();
                textarea.select();
                document.execCommand('copy');
                copy.textContent = 'Текст выделен / скопирован';
            }

            setTimeout(() => {
                if (copy.isConnected) {
                    copy.textContent = 'Копировать текст';
                }
            }, 1500);
        });

        header.append(title, close);
        windowEl.append(header, textarea, copy);
        overlay.appendChild(windowEl);
        document.body.appendChild(overlay);

        document.addEventListener('keydown', onKeyDown);
        textarea.focus();
    }
function addIcons() {
    document.querySelectorAll(CELL_SELECTORS.join(',')).forEach(cell => {
        if (cell.querySelector(':scope > .raw-text-viewer-icon')) {
            return;
        }

        const source = cell.querySelector(SOURCE_SELECTOR);
        if (!source) return;

        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'raw-text-viewer-icon';
        button.textContent = '⌕';

        const fieldWrapper = cell.querySelector('.field-wrapper');
        const fieldType = fieldWrapper?.getAttribute('data-type');
        const fieldName = FIELD_NAMES[fieldType] || 'Исходный текст';

        button.title = `Показать: ${fieldName}`;
        button.setAttribute('aria-label', button.title);

        if (getComputedStyle(cell).position === 'static') {
            cell.style.position = 'relative';
        }

        button.addEventListener('click', event => {
            event.preventDefault();
            event.stopPropagation();

            const rawText = source.getAttribute('data-value') ?? '';
            const cellId = cell.getAttribute('data-id');

            showRawText(
                rawText,
                `${fieldName} | ID: ${cellId || 'не указан'}`
            );
        });

        cell.appendChild(button);
    });
}
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
})();
