/* ==========================================================================
 * app.js — application bootstrap and dynamic content rendering
 * ========================================================================== */

(function () {
    'use strict';

    const { $, $$, CLASS_DATA, CLASS_ICONS, STACK } = window.ESC;

    const MODEL_INFO_ENDPOINT = '/api/model-info';

    /* ------------------------------------------------------------------
     * Render the "Supported classes" grid (dataset section)
     * ------------------------------------------------------------------ */
    function renderClasses() {
        const grid = $('#classesGrid');
        if (!grid) return;

        grid.replaceChildren();
        CLASS_DATA.forEach((item, index) => {
            const card = document.createElement('article');
            card.className = 'card class-card';
            card.style.animationDelay = `${index * 0.05}s`;

            const icon = CLASS_ICONS[item.name] || CLASS_ICONS['Dog Bark'];

            card.innerHTML = `
                <span class="class-icon" style="--cc:${item.color}" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                         stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                        <path d="${icon}"/>
                    </svg>
                </span>
                <h4>${item.name}</h4>
                <p>${item.desc}</p>
            `;
            grid.appendChild(card);
        });
    }

    /* ------------------------------------------------------------------
     * Render the technology stack grid
     * ------------------------------------------------------------------ */
    function renderStack() {
        const grid = $('#stackGrid');
        if (!grid) return;

        grid.replaceChildren();
        STACK.forEach((item) => {
            const card = document.createElement('div');
            card.className = 'stack-card';
            card.innerHTML = `
                <span class="stack-icon" style="--sc:${item.color}" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                         stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                        <path d="${item.icon}"/>
                    </svg>
                </span>
                <strong>${item.name}</strong>
            `;
            grid.appendChild(card);
        });
    }

    /* ------------------------------------------------------------------
     * Model dashboard — populated live from the backend
     * ------------------------------------------------------------------ */
    const MODEL_GRID = [
        { label: 'Architecture', key: 'architecture', icon: 'M4 6h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2ZM2 10h20M6 6v4M10 6v4M14 6v4M18 6v4', color: '#2563EB' },
        { label: 'Framework', key: 'framework', icon: 'M12 2 2 7l10 5 10-5-10-5ZM2 17l10 5 10-5M2 12l10 5 10-5', color: '#F59E0B' },
        { label: 'Backend', key: 'backend', value: 'Flask', icon: 'M5 5h14M5 19h14M12 5v14M5 12h14', color: '#94A3B8' },
        { label: 'Frontend', key: 'frontend', value: 'HTML · CSS · JS', icon: 'M4 3h16l-2 16-6 2-6-2-2-16ZM9 9h6M12 9v7', color: '#38BDF8' },
        { label: 'Input', key: 'input_type', icon: 'M2 12h2l3-8 4 16 3-12 2 4h6', color: '#10B981' },
        { label: 'Learning', key: 'learning', icon: 'M22 11.08V12a10 10 0 1 1-5.93-9.14', color: '#7C3AED' },
        { label: 'Audio Length', key: 'audio_length', icon: 'M21 12a9 9 0 1 1-9-9', color: '#06B6D4' },
        { label: 'Sample Rate', key: 'sample_rate', fmt: (v) => `${v} Hz`, icon: 'M3 3v18h18M7 9l4 4 3-3 5 5', color: '#F472B6' },
        { label: 'Input Size', key: 'input_size', icon: 'M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2ZM8 3v18', color: '#22D3EE' },
    ];

    function formatParams(num) {
        if (!num) return '—';
        if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
        if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
        return String(num);
    }

    function renderModelGrid(info) {
        const grid = $('#modelGrid');
        if (!grid) return;

        grid.replaceChildren();
        MODEL_GRID.forEach((item) => {
            const raw = item.value ?? info[item.key];
            const value = item.fmt ? item.fmt(raw) : raw;
            const cell = document.createElement('div');
            cell.className = 'model-item';
            cell.innerHTML = `
                <span class="model-item-icon" style="--mi:${item.color}" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                         stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                        <path d="${item.icon}"/>
                    </svg>
                </span>
                <strong>${value ?? '—'}</strong>
                <span>${item.label}</span>
            `;
            grid.appendChild(cell);
        });
    }

    async function loadModelInfo() {
        try {
            const response = await fetch(MODEL_INFO_ENDPOINT);
            const info = await response.json();

            if (!response.ok || info.status !== 'ok') {
                throw new Error('Model info unavailable');
            }

            renderModelGrid(info);

            const acc = $('#modelTestAcc');
            if (acc && info.test_accuracy) acc.textContent = `${info.test_accuracy.toFixed(2)}%`;

            const cls = $('#modelClasses');
            if (cls && info.classes) cls.textContent = String(info.classes);

            const params = $('#modelParams');
            if (params && info.num_params) params.textContent = formatParams(info.num_params);

            if (info.model_loaded === false) {
                window.ESC.showToast('Model weights not found — uploads will be rejected.', 'error');
            }
        } catch (_error) {
            window.ESC.showToast('Could not load model information.', 'error');
        }
    }

    /* ------------------------------------------------------------------
     * Bootstrap
     * ------------------------------------------------------------------ */
    document.addEventListener('DOMContentLoaded', () => {
        renderClasses();
        renderStack();
        loadModelInfo();

        window.ESC.upload.init();
        window.ESC.prediction.init();
        window.ESC.initUI();
    });
})();
