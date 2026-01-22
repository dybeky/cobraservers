// Advanced Protection System v2.0
(function() {
    'use strict';

    // ========== CONFIGURATION ==========
    const CONFIG = {
        clearConsole: true,
        blockKeys: true,
        protectDOM: true
    };

    // ========== KEYBOARD BLOCKING ==========
    if (CONFIG.blockKeys) {
        document.addEventListener('keydown', function(e) {
            const blocked = [
                e.key === 'F12',
                e.keyCode === 123,
                e.ctrlKey && e.shiftKey && ['I', 'i', 'J', 'j', 'C', 'c', 'K', 'k'].includes(e.key),
                e.ctrlKey && e.shiftKey && [73, 74, 67, 75].includes(e.keyCode),
                e.ctrlKey && ['U', 'u', 'S', 's', 'P', 'p'].includes(e.key),
                e.ctrlKey && [85, 83, 80].includes(e.keyCode),
                e.key === 'PrintScreen',
                e.keyCode === 44,
                e.ctrlKey && e.altKey && ['I', 'i', 'J', 'j', 'U', 'u'].includes(e.key),
                e.metaKey && e.altKey && ['I', 'i', 'J', 'j', 'U', 'u'].includes(e.key),
                e.metaKey && e.shiftKey && ['C', 'c'].includes(e.key),
            ];

            if (blocked.some(b => b)) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }
        }, true);
    }

    // ========== CONTEXT MENU ==========
    document.addEventListener('contextmenu', e => {
        e.preventDefault();
        return false;
    }, true);

    // ========== SELECTION & COPY ==========
    document.addEventListener('selectstart', e => {
        if (!['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
            e.preventDefault();
            return false;
        }
    }, true);

    document.addEventListener('copy', e => {
        e.preventDefault();
        return false;
    }, true);

    document.addEventListener('cut', e => {
        e.preventDefault();
        return false;
    }, true);

    document.addEventListener('paste', e => {
        if (!['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
            e.preventDefault();
            return false;
        }
    }, true);

    // ========== DRAG & DROP ==========
    document.addEventListener('dragstart', e => {
        e.preventDefault();
        return false;
    }, true);

    document.addEventListener('drop', e => {
        e.preventDefault();
        return false;
    }, true);

    // ========== IFRAME PROTECTION ==========
    if (window.self !== window.top) {
        try {
            window.top.location = window.self.location;
        } catch (e) {
            document.documentElement.innerHTML = '';
        }
    }

    // ========== DOM PROTECTION ==========
    if (CONFIG.protectDOM) {
        const protectedElements = ['particleCanvas', 'themeToggle'];

        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.removedNodes.forEach((node) => {
                    if (node.nodeType === 1 && protectedElements.includes(node.id)) {
                        location.reload();
                    }
                });

                if (mutation.type === 'attributes' && mutation.target.tagName === 'BODY') {
                    const allowedAttrs = ['class', 'data-effect', 'style'];
                    if (!allowedAttrs.includes(mutation.attributeName)) {
                        location.reload();
                    }
                }
            });
        });

        document.addEventListener('DOMContentLoaded', () => {
            observer.observe(document.body, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeOldValue: true
            });
        });
    }

    // ========== CONSOLE WARNING ==========
    if (CONFIG.clearConsole) {
        console.clear();
        console.log('%c⛔ ВНИМАНИЕ!', 'color: #ff4444; font-size: 60px; font-weight: bold; text-shadow: 3px 3px 0 #000;');
        console.log('%cЭта функция браузера предназначена для разработчиков.', 'color: #FF7C00; font-size: 18px; font-weight: bold;');
        console.log('%cЕсли вас просят что-то сюда вставить — это мошенники!', 'color: #fff; font-size: 16px;');
    }

    // ========== HISTORY PROTECTION ==========
    history.pushState(null, null, location.href);
    window.addEventListener('popstate', () => {
        history.pushState(null, null, location.href);
    });

    // ========== PRINT PROTECTION ==========
    const printStyle = document.createElement('style');
    printStyle.textContent = '@media print { body { display: none !important; } }';
    document.head.appendChild(printStyle);

})();
