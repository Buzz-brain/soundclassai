/* ==========================================================================
 * prediction.js — API call, animated loading phases, result rendering
 * ========================================================================== */

(function () {
    'use strict';

    const { $, $$, CLASS_ICONS } = window.ESC;

    const API_ENDPOINT = '/api/predict';
    const RING_CIRCUMFERENCE = 326.7; // 2 * PI * 52, matches CSS.

    // Each phase drives the loading message, the checklist and the pipeline.
    const PHASES = [
        { key: 'loading', message: 'Loading model…', pipeline: [8] },
        { key: 'extract', message: 'Extracting features…', pipeline: [1] },
        { key: 'spectrogram', message: 'Generating spectrogram…', pipeline: [2, 3, 4, 5, 6, 7] },
        { key: 'inference', message: 'Running inference…', pipeline: [8] },
        { key: 'probabilities', message: 'Computing probabilities…', pipeline: [9] },
        { key: 'complete', message: 'Prediction complete.', pipeline: [] },
    ];

    const PHASE_DURATION = {
        loading: 700,
        extract: 900,
        spectrogram: 1100,
        inference: 800,
        probabilities: 600,
        complete: 350,
    };

    let el = {};

    /* ------------------------------------------------------------------
     * Pipeline + checklist highlighting
     * ------------------------------------------------------------------ */
    function highlightPipeline(activeSteps) {
        const nodes = $$('#pipeline .pipe-node');
        const maxSeen = Math.max(...activeSteps, -1);

        nodes.forEach((node, index) => {
            node.classList.toggle('active', index === maxSeen && activeSteps.length > 0);
            node.classList.toggle('done', index < maxSeen);
        });
    }

    function resetPipeline() {
        $$('#pipeline .pipe-node').forEach((node) => {
            node.classList.remove('active', 'done');
        });
    }

    function updateChecklist(currentKey) {
        const currentIndex = PHASES.findIndex((p) => p.key === currentKey);
        const steps = $$('#loadingSteps li');
        steps.forEach((li) => {
            const phaseIndex = PHASES.findIndex((p) => p.key === li.dataset.msg);
            li.classList.toggle('done', phaseIndex >= 0 && phaseIndex < currentIndex);
            li.classList.toggle('current', li.dataset.msg === currentKey);
        });
    }

    async function runPhaseSequence() {
        resetPipeline();
        for (const phase of PHASES) {
            el.loadingMessage.textContent = phase.message;
            updateChecklist(phase.key);
            highlightPipeline(phase.pipeline);
            await new Promise((resolve) => setTimeout(resolve, PHASE_DURATION[phase.key]));
        }
    }

    /* ------------------------------------------------------------------
     * API call
     * ------------------------------------------------------------------ */
    async function predict(file) {
        const formData = new FormData();
        formData.append('audio', file, file.name);

        const response = await fetch(API_ENDPOINT, { method: 'POST', body: formData });
        const payload = await response.json().catch(() => null);

        if (!response.ok || !payload || payload.status === 'error') {
            const error = new Error(payload && payload.message ? payload.message : 'Prediction failed. Please try again.');
            error.code = payload ? payload.code : 'NETWORK';
            throw error;
        }
        return payload;
    }

    /* ------------------------------------------------------------------
     * Error mapping with recovery suggestions
     * ------------------------------------------------------------------ */
    function describeError(error) {
        const code = error && error.code;
        const map = {
            NO_FILE: ['No file selected', 'Upload a WAV or MP3 file first, then press Predict.'],
            BAD_TYPE: ['Unsupported file type', 'Only .wav and .mp3 files are accepted. Convert the recording and upload again.'],
            DECODE: ['Corrupt audio file', 'The file could not be decoded. Re-export it as a valid WAV or MP3 and retry.'],
            TOO_LARGE: ['File too large', 'The maximum upload size is 16 MB. Trim the recording and retry.'],
            MODEL: ['Model not loaded', 'The classifier weights are missing. Place best_model.keras in backend/model/ and restart.'],
            PREDICTION: ['Prediction failed', 'The model could not analyse this file. Try another recording.'],
            NETWORK: ['Server unavailable', 'Could not reach the server. Check that the Flask app is running and refresh.'],
            SERVER: ['Unexpected error', 'Something went wrong on the server. Please try again.'],
        };
        return map[code] || map.SERVER;
    }

    /* ------------------------------------------------------------------
     * Result rendering
     * ------------------------------------------------------------------ */
    function iconForClass(name) {
        const path = CLASS_ICONS[name];
        if (!path) {
            return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M19 5a9 9 0 0 1 0 14"/></svg>';
        }
        return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="${path}"/></svg>`;
    }

    function explanationFor(prediction, confidence) {
        const quality = confidence >= 80 ? 'very high' : confidence >= 55 ? 'good' : 'moderate';
        return [
            `The uploaded audio is most likely a ${prediction} sound.`,
            `The CNN assigned it the highest probability across all five classes.`,
            `Prediction confidence is ${quality} (${confidence.toFixed(2)}%).`,
        ].join(' ');
    }

    function renderProbabilities(probabilities) {
        el.probabilities.replaceChildren();

        probabilities.forEach((item, index) => {
            const row = document.createElement('div');
            row.className = `prob-row${index === 0 ? ' is-top' : ''}`;

            const rank = document.createElement('span');
            rank.className = `prob-rank${index === 0 ? ' prob-rank--top' : ''}`;
            rank.textContent = String(index + 1);

            const label = document.createElement('span');
            label.className = 'prob-label';
            label.textContent = item.class;

            const track = document.createElement('div');
            track.className = 'prob-track';
            const fill = document.createElement('span');
            fill.className = 'prob-fill';
            track.appendChild(fill);

            const value = document.createElement('span');
            value.className = 'prob-value';
            value.textContent = `${item.probability}%`;

            row.append(rank, label, track, value);
            el.probabilities.appendChild(row);

            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    row.classList.add('show');
                    fill.style.width = `${Math.min(item.probability, 100)}%`;
                });
            });
        });
    }

    function animateConfidence(confidence) {
        const ring = el.ringProgress;
        const duration = 1400;
        const start = performance.now();

        ring.style.transition = 'none';
        ring.style.strokeDashoffset = RING_CIRCUMFERENCE;
        void ring.getBoundingClientRect();

        const step = (now) => {
            const t = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - t, 3);
            const value = confidence * eased;

            ring.style.strokeDashoffset = RING_CIRCUMFERENCE - (RING_CIRCUMFERENCE * value) / 100;
            el.confidenceValue.textContent = `${value.toFixed(2)}%`;
            if (t < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }

    function renderResult(payload) {
        const { prediction, confidence, probabilities } = payload;

        el.resultTitle.textContent = prediction;
        el.resultIcon.innerHTML = iconForClass(prediction);
        el.resultExplanation.textContent = explanationFor(prediction, confidence);

        renderProbabilities(probabilities);
        animateConfidence(confidence);

        el.loadingCard.hidden = true;
        el.uploadCard.hidden = false;
        el.resultCard.hidden = false;

        el.resultCard.classList.remove('animate-in');
        void el.resultCard.offsetWidth;
        el.resultCard.classList.add('animate-in');

        window.ESC.showToast(`${prediction} · ${confidence.toFixed(2)}% confidence`, 'success');
    }

    /* ------------------------------------------------------------------
     * Orchestration
     * ------------------------------------------------------------------ */
    async function handlePredict() {
        const state = window.ESC.upload.getState();
        // MP3s are converted to WAV client-side; fall back to the original
        // file if conversion hasn't finished yet.
        const file = state.uploadFile || state.file;
        if (!file) {
            window.ESC.upload.showError('No file selected', 'Upload a WAV or MP3 file first, then press Predict.');
            return;
        }

        window.ESC.upload.hideError();
        resetPipeline();
        el.uploadCard.hidden = true;
        el.resultCard.hidden = true;
        el.loadingCard.hidden = false;
        el.predictBtn.disabled = true;

        try {
            // Run the animated phase sequence in parallel with the request.
            const [, payload] = await Promise.all([runPhaseSequence(), predict(file)]);
            renderResult(payload);
        } catch (error) {
            el.loadingCard.hidden = true;
            el.uploadCard.hidden = false;
            el.predictBtn.disabled = false;
            resetPipeline();
            const [title, message] = describeError(error);
            window.ESC.upload.showError(title, message);
            window.ESC.showToast(title, 'error');
        }
    }

    /* ------------------------------------------------------------------
     * Init
     * ------------------------------------------------------------------ */
    function init() {
        el = {
            predictBtn: $('#predictBtn'),
            loadingCard: $('#loadingCard'),
            loadingMessage: $('#loadingMessage'),
            uploadCard: $('#uploadCard'),
            resultCard: $('#resultCard'),
            resultTitle: $('#resultTitle'),
            resultIcon: $('.result-icon'),
            resultExplanation: $('#resultExplanation'),
            probabilities: $('#probabilities'),
            ringProgress: $('#ringProgress'),
            confidenceValue: $('#confidenceValue'),
        };

        el.predictBtn.addEventListener('click', handlePredict);

        // Reset result area when a new file is chosen.
        document.addEventListener('esc:file-selected', () => {
            el.resultCard.hidden = true;
            el.uploadCard.hidden = false;
        });
        document.addEventListener('esc:file-cleared', () => {
            el.resultCard.hidden = true;
            resetPipeline();
        });
    }

    ESC.prediction = { init };
})();
