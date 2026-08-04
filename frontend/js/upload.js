/* ==========================================================================
 * upload.js — drag & drop, validation, metadata, waveform + playback
 * ========================================================================== */

(function () {
    'use strict';

    const { $ } = window.ESC;

    const MAX_FILE_BYTES = 16 * 1024 * 1024; // 16 MB

    // Central state shared with prediction.js.
    const state = {
        file: null,       // Original file selected by the user.
        uploadFile: null, // What actually gets uploaded (WAV; MP3s are converted).
        duration: null,
        sampleRate: null,
        channels: null,
        size: null,
        objectUrl: null,
        peaks: null,
    };

    let el = {};
    let audioCtx = null;
    let animationFrame = null;

    /* ------------------------------------------------------------------
     * Helpers
     * ------------------------------------------------------------------ */
    function isAudio(name) {
        const ext = name.toLowerCase();
        return ext.endsWith('.wav') || ext.endsWith('.mp3');
    }

    function isMp3(name) {
        return name.toLowerCase().endsWith('.mp3');
    }

    function wavNameFor(name) {
        return name.replace(/\.[^.]+$/, '') + '.wav';
    }

    /* ------------------------------------------------------------------
     * WAV encoder — converts a decoded AudioBuffer to a PCM 16-bit WAV.
     * Lets MP3s be decoded by the browser (native MP3 support) and sent
     * to the backend as plain WAV, so the server pipeline is unchanged.
     *
     * The upload is reduced to what the model actually consumes: mono,
     * trimmed to the first 4 seconds (config.AUDIO_DURATION). A 2-minute
     * stereo MP3 otherwise expands to a ~25 MB WAV and trips the 16 MB
     * upload limit.
     * ------------------------------------------------------------------ */
    const UPLOAD_SECONDS = 4;

    function writeWavString(view, offset, text) {
        for (let i = 0; i < text.length; i += 1) {
            view.setUint8(offset + i, text.charCodeAt(i));
        }
    }

    function encodeWavBlob(monoSamples, sampleRate) {
        const numChannels = 1;
        const numFrames = monoSamples.length;
        const bytesPerSample = 2;
        const blockAlign = numChannels * bytesPerSample;
        const dataSize = numFrames * blockAlign;
        const buffer = new ArrayBuffer(44 + dataSize);
        const view = new DataView(buffer);

        writeWavString(view, 0, 'RIFF');
        view.setUint32(4, 36 + dataSize, true);
        writeWavString(view, 8, 'WAVE');
        writeWavString(view, 12, 'fmt ');
        view.setUint32(16, 16, true);                  // fmt chunk size.
        view.setUint16(20, 1, true);                   // PCM format.
        view.setUint16(22, numChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * blockAlign, true); // byte rate.
        view.setUint16(32, blockAlign, true);
        view.setUint16(34, bytesPerSample * 8, true);
        writeWavString(view, 36, 'data');
        view.setUint32(40, dataSize, true);

        let offset = 44;
        for (let i = 0; i < numFrames; i += 1) {
            const sample = Math.max(-1, Math.min(1, monoSamples[i]));
            view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
            offset += 2;
        }

        return new Blob([buffer], { type: 'audio/wav' });
    }

    function buildUploadWav(audioBuffer) {
        const sampleRate = audioBuffer.sampleRate;
        const maxSamples = Math.floor(sampleRate * UPLOAD_SECONDS);
        const frames = Math.min(audioBuffer.length, maxSamples);
        const numChannels = audioBuffer.numberOfChannels;

        const mono = new Float32Array(frames);
        for (let i = 0; i < frames; i += 1) {
            let sum = 0;
            for (let c = 0; c < numChannels; c += 1) {
                sum += audioBuffer.getChannelData(c)[i];
            }
            mono[i] = sum / numChannels;
        }
        return encodeWavBlob(mono, sampleRate);
    }

    function formatDuration(seconds) {
        if (!Number.isFinite(seconds)) return '—';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${String(secs).padStart(2, '0')}`;
    }

    function formatBytes(bytes) {
        if (!Number.isFinite(bytes)) return '—';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    }

    /* ------------------------------------------------------------------
     * UI switching
     * ------------------------------------------------------------------ */
    function showFilePanel() {
        el.dropzone.hidden = true;
        el.filePanel.hidden = false;
        el.predictBtn.disabled = false;
    }

    function resetToDropzone() {
        stopPlayback();
        revokeObjectUrl();
        Object.assign(state, { file: null, uploadFile: null, duration: null, sampleRate: null, channels: null, size: null, peaks: null });

        el.fileInput.value = '';
        el.dropzone.hidden = false;
        el.filePanel.hidden = true;
        el.predictBtn.disabled = true;
        el.playBtn.disabled = true;
        el.playBtn.classList.remove('playing');
        clearCanvas();
        hideError();

        document.dispatchEvent(new CustomEvent('esc:file-cleared'));
    }

    /* ------------------------------------------------------------------
     * Errors
     * ------------------------------------------------------------------ */
    function showError(title, message) {
        el.errorTitle.textContent = title;
        el.errorText.textContent = message;
        el.errorBox.hidden = false;
        el.uploadCard.classList.add('shake');
        setTimeout(() => el.uploadCard.classList.remove('shake'), 500);
    }

    function hideError() {
        el.errorBox.hidden = true;
    }

    /* ------------------------------------------------------------------
     * Waveform rendering
     * ------------------------------------------------------------------ */
    function computePeaks(channelData, buckets) {
        const blockSize = Math.ceil(channelData.length / buckets);
        const peaks = [];
        for (let i = 0; i < buckets; i += 1) {
            let max = 0;
            const start = i * blockSize;
            const end = Math.min(start + blockSize, channelData.length);
            for (let j = start; j < end; j += 1) {
                const v = Math.abs(channelData[j]);
                if (v > max) max = v;
            }
            peaks.push(max);
        }
        return peaks;
    }

    function fillRoundedRect(ctx, x, y, w, h) {
        ctx.beginPath();
        if (typeof ctx.roundRect === 'function') {
            ctx.roundRect(x, y, w, h, 2);
        } else {
            ctx.rect(x, y, w, h);
        }
        ctx.fill();
    }

    function drawWaveform(progress = 0) {
        const ctx = el.waveform.getContext('2d');
        const { width, height } = el.waveform;
        ctx.clearRect(0, 0, width, height);

        if (!state.peaks || state.peaks.length === 0) return;

        const mid = height / 2;
        const barWidth = width / state.peaks.length;
        const playedX = width * progress;

        state.peaks.forEach((peak, i) => {
            const x = i * barWidth;
            const barHeight = Math.max(2, peak * height * 0.92);
            const isPlayed = x < playedX;

            ctx.fillStyle = isPlayed
                ? 'rgba(6, 182, 212, 0.9)'
                : 'rgba(148, 163, 184, 0.35)';
            fillRoundedRect(ctx, x + 1, mid - barHeight / 2, Math.max(1, barWidth - 2), barHeight);
        });

        // Playhead
        if (progress > 0 && progress < 1) {
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(playedX, mid, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function clearCanvas() {
        const ctx = el.waveform.getContext('2d');
        ctx.clearRect(0, 0, el.waveform.width, el.waveform.height);
    }

    /* ------------------------------------------------------------------
     * Playback with progress highlight
     * ------------------------------------------------------------------ */
    function updatePlaybackUI() {
        const audio = el.audioPlayer;
        const progress = audio.duration ? audio.currentTime / audio.duration : 0;
        drawWaveform(progress);
        el.playbackTime.textContent = `${formatDuration(audio.currentTime)} / ${formatDuration(audio.duration)}`;
        animationFrame = requestAnimationFrame(updatePlaybackUI);
    }

    function startPlayback() {
        if (el.audioPlayer.paused) {
            el.audioPlayer.play().catch(() => {});
        } else {
            el.audioPlayer.pause();
        }
    }

    function stopPlayback() {
        if (animationFrame) cancelAnimationFrame(animationFrame);
        animationFrame = null;
        try { el.audioPlayer.pause(); } catch (_) { /* noop */ }
        try { el.audioPlayer.currentTime = 0; } catch (_) { /* noop */ }
        el.playBtn.classList.remove('playing');
        el.playbackTime.textContent = `0:00 / ${formatDuration(state.duration)}`;
        drawWaveform(0);
    }

    /* ------------------------------------------------------------------
     * Metadata + waveform from the browser audio decoder
     * ------------------------------------------------------------------ */
    function readMetadata(file) {
        return new Promise((resolve) => {
            try {
                if (!audioCtx) {
                    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                }
                file.arrayBuffer().then((buffer) => {
                    audioCtx.decodeAudioData(buffer, (decoded) => {
                        state.sampleRate = decoded.sampleRate;
                        state.duration = decoded.duration;
                        state.channels = decoded.numberOfChannels;
                        state.peaks = computePeaks(decoded.getChannelData(0), 220);
                        el.audioPlayer.src = state.objectUrl;
                        el.audioPlayer.load();
                        el.playBtn.disabled = false;
                        drawWaveform(0);

                        // MP3s are converted to WAV here so the backend
                        // only ever receives files it can decode.
                        if (isMp3(file.name) && !state.uploadFile) {
                            try {
                                const wavBlob = buildUploadWav(decoded);
                                state.uploadFile = new File(
                                    [wavBlob],
                                    wavNameFor(file.name),
                                    { type: 'audio/wav' }
                                );
                            } catch (_error) {
                                state.uploadFile = null;
                            }
                        }
                        resolve();
                    }, () => resolve());
                }).catch(() => resolve());
            } catch (_error) {
                resolve();
            }
        });
    }

    function refreshMetaUI() {
        el.statDuration.textContent = formatDuration(state.duration);
        el.statRate.textContent = state.sampleRate ? `${state.sampleRate} Hz` : '—';
        el.statChannels.textContent = state.channels ? String(state.channels) : '—';
        el.statSize.textContent = formatBytes(state.size);
    }

    /* ------------------------------------------------------------------
     * File acceptance flow
     * ------------------------------------------------------------------ */
    function applySelectedFile(file) {
        if (!file) return;

        if (!isAudio(file.name)) {
            showError('Unsupported file type', 'Only .wav and .mp3 files are accepted. Convert your file and try again.');
            window.ESC.showToast('Only .wav and .mp3 files are accepted.', 'error');
            return;
        }
        if (file.size > MAX_FILE_BYTES) {
            showError('File too large', 'The maximum upload size is 16 MB.');
            window.ESC.showToast('File too large — 16 MB maximum.', 'error');
            return;
        }

        stopPlayback();
        revokeObjectUrl();
        state.file = file;
        state.uploadFile = isMp3(file.name) ? null : file;
        state.size = file.size;
        state.objectUrl = URL.createObjectURL(file);

        el.fileName.textContent = file.name;
        el.fileMeta.textContent = isMp3(file.name) ? 'Converting to WAV…' : 'Loading metadata…';
        refreshMetaUI();

        hideError();
        showFilePanel();
        if (isMp3(file.name)) el.predictBtn.disabled = true;

        readMetadata(file).then(() => {
            refreshMetaUI();
            if (isMp3(file.name) && !state.uploadFile) {
                el.fileMeta.textContent = 'Conversion failed';
                el.predictBtn.disabled = false;
            } else {
                el.fileMeta.textContent = 'Ready for prediction';
                el.predictBtn.disabled = false;
            }
            document.dispatchEvent(new CustomEvent('esc:file-selected', { detail: state }));
        });
    }

    function revokeObjectUrl() {
        if (state.objectUrl) URL.revokeObjectURL(state.objectUrl);
        state.objectUrl = null;
        try { el.audioPlayer.removeAttribute('src'); } catch (_) { /* noop */ }
    }

    /* ------------------------------------------------------------------
     * Event wiring
     * ------------------------------------------------------------------ */
    function initDropzone() {
        el.dropzone.addEventListener('click', () => el.fileInput.click());
        el.dropzone.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                el.fileInput.click();
            }
        });

        ['dragenter', 'dragover'].forEach((type) => {
            el.dropzone.addEventListener(type, (event) => {
                event.preventDefault();
                el.dropzone.classList.add('dragover');
            });
        });
        ['dragleave', 'drop'].forEach((type) => {
            el.dropzone.addEventListener(type, (event) => {
                event.preventDefault();
                el.dropzone.classList.remove('dragover');
            });
        });
        el.dropzone.addEventListener('drop', (event) => {
            const file = event.dataTransfer.files[0];
            if (file) applySelectedFile(file);
        });

        el.fileInput.addEventListener('change', () => applySelectedFile(el.fileInput.files[0]));
        el.removeBtn.addEventListener('click', resetToDropzone);

        // Playback
        el.playBtn.addEventListener('click', () => {
            if (el.playBtn.disabled) return;
            el.audioPlayer.paused ? el.audioPlayer.play() : el.audioPlayer.pause();
        });
        el.audioPlayer.addEventListener('play', () => {
            el.playBtn.classList.add('playing');
            updatePlaybackUI();
        });
        el.audioPlayer.addEventListener('pause', () => {
            el.playBtn.classList.remove('playing');
            if (animationFrame) cancelAnimationFrame(animationFrame);
            animationFrame = null;
        });
        el.audioPlayer.addEventListener('ended', stopPlayback);
    }

    /* ------------------------------------------------------------------
     * Init / public API
     * ------------------------------------------------------------------ */
    function init() {
        el = {
            dropzone: $('#dropzone'),
            fileInput: $('#fileInput'),
            filePanel: $('#filePanel'),
            fileName: $('#fileName'),
            fileMeta: $('#fileMeta'),
            removeBtn: $('#removeFile'),
            waveform: $('#waveform'),
            predictBtn: $('#predictBtn'),
            errorBox: $('#errorBox'),
            errorTitle: $('#errorTitle'),
            errorText: $('#errorText'),
            uploadCard: $('#uploadCard'),
            audioPlayer: $('#audioPlayer'),
            playBtn: $('#playBtn'),
            playbackTime: $('#playbackTime'),
            statDuration: $('#statDuration'),
            statRate: $('#statRate'),
            statChannels: $('#statChannels'),
            statSize: $('#statSize'),
        };

        el.predictBtn.disabled = true;
        initDropzone();
    }

    ESC.upload = {
        init,
        reset: resetToDropzone,
        getState: () => state,
        showError,
        hideError,
    };
})();
