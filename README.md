# Environmental Sound Classification System

> AI-powered environmental sound recognition using **Convolutional Neural Networks** (MobileNetV2).

A complete, production-quality web application for an undergraduate Final Year Project. It classifies everyday environmental sounds — barking dogs, sirens, jackhammers, street music and more — from a short WAV recording.

Built with a modular Flask REST API on the backend and a custom, responsive single-page interface on the frontend (no UI frameworks, no boilerplate).

---

## Features

- **Upload & classify** — drag-and-drop a WAV file and get a prediction with confidence.
- **10 sound classes** — trained on the UrbanSound8K dataset.
- **Live waveform** — visual placeholder generated from the uploaded file.
- **Audio player** — replay the recording directly in the browser.
- **Animated results** — circular confidence ring, animated probability bars and a natural-language explanation.
- **Model pipeline visualisation** — audio → Mel spectrogram → MobileNetV2 → Dense → Softmax → prediction.
- **Professional error handling** — unsupported format, file too large, audio too short, model not loaded, server failures.
- **Accessible & responsive** — keyboard navigation, ARIA labels, semantic HTML, and mobile-first layout.

---

## Tech stack

| Layer    | Technology                          |
|----------|-------------------------------------|
| Frontend | HTML5, CSS3, Vanilla JavaScript (ES6) |
| Backend  | Python, Flask                       |
| AI       | TensorFlow / Keras, librosa, NumPy  |

---

## Folder structure

```
environmental-sound-classifier/
│
├── app.py                       # Flask entry point (application factory)
├── requirements.txt
├── README.md
├── create_dummy_model.py        # Generates a placeholder model (optional)
│
├── backend/
│   ├── __init__.py
│   ├── config.py                # Centralised configuration
│   ├── utils.py                 # File helpers & validation
│   ├── preprocessing.py         # Audio → Mel spectrogram → tensor pipeline
│   ├── predictor.py             # Model loading + inference service
│   ├── routes.py                # REST API blueprint
│   └── model/
│       └── best_model.keras     # Trained model (see below)
│
├── frontend/
│   ├── index.html
│   ├── css/
│   │   ├── style.css            # Design tokens, layout, components
│   │   ├── animations.css       # Keyframes & motion
│   │   └── responsive.css       # Tablet & mobile breakpoints
│   ├── js/
│   │   ├── ui.js                # Navigation, reveal, toast, ripple, data
│   │   ├── upload.js            # Dropzone, waveform, file metadata
│   │   ├── prediction.js        # API call, loading state, results
│   │   └── app.js               # Bootstrap + static content rendering
│   └── assets/
│       ├── icons/
│       └── images/
│
├── uploads/                     # Temporary storage for uploads
└── static/                      # Flask static folder (kept empty)
```

---

## Installation

### 1. Create a virtual environment

```bash
python -m venv .venv
```

Activate it:

- **Windows (PowerShell):** `.venv\Scripts\Activate.ps1`
- **macOS / Linux:** `source .venv/bin/activate`

### 2. Install requirements

```bash
pip install -r requirements.txt
```

> TensorFlow is a large download. On GPU-less machines the CPU build is used automatically.

### 3. Provide a trained model

The application loads the classifier from `backend/model/best_model.keras`.

- **Trained model:** drop your trained MobileNetV2 model there and make sure the class order matches `CLASS_NAMES` in `backend/config.py`.
- **No model yet?** Generate a random-weight placeholder so the app runs end-to-end:

```bash
python create_dummy_model.py
```

Predictions from the placeholder are random — retrain and replace the file for real results.

---

## Running the application

```bash
python app.py
```

Open <http://127.0.0.1:5000> in your browser.

The server listens on `0.0.0.0:5000`, so it is also reachable from other devices on the same network — useful for live demos.

---

## REST API

### `POST /api/predict`

Classify an uploaded audio file.

**Request** — `multipart/form-data` with the field `audio`:

```
curl -X POST http://127.0.0.1:5000/api/predict \
     -F "audio=@/path/to/dog_bark.wav"
```

**Success response (200):**

```json
{
  "status": "success",
  "prediction": "Dog Bark",
  "confidence": 95.47,
  "latency_ms": 312.4,
  "probabilities": [
    { "class": "Dog Bark", "probability": 95.47 },
    { "class": "Children Playing", "probability": 1.83 },
    { "class": "Street Music", "probability": 1.01 }
  ],
  "top_probabilities": [
    { "class": "Dog Bark", "probability": 95.47 },
    { "class": "Children Playing", "probability": 1.83 }
  ]
}
```

**Error responses (4xx/5xx):**

| Code          | Status | Meaning                                    |
|---------------|--------|--------------------------------------------|
| `NO_FILE`     | 400    | No `audio` field in the request            |
| `BAD_TYPE`    | 400    | Extension is not `.wav`                    |
| `TOO_SHORT`   | 400    | Audio is shorter than 0.5 seconds          |
| `DECODE`      | 400    | File could not be decoded                 |
| `TOO_LARGE`   | 413    | Upload exceeds 16 MB                      |
| `MODEL`       | 503    | Model file missing / unreadable           |
| `PREDICTION`  | 500    | Inference failed on a valid file          |

### `GET /api/health`

Health check returning model readiness and supported classes:

```json
{ "status": "ok", "model_loaded": true, "classes": ["Air Conditioner", "..."] }
```

---

## How classification works

1. The uploaded WAV is decoded with `librosa` and resampled to 22.05 kHz.
2. The waveform is centered to a fixed **4-second window** (padded or cropped).
3. A **Mel spectrogram** with 128 frequency bins is computed (`n_fft=2048`, `hop=512`).
4. The spectrogram is resized to **128 × 128** and normalised to **[0, 1]**.
5. A pre-trained **MobileNetV2** backbone extracts features; a dense + softmax head outputs a probability per class.
6. The top class, confidence and full distribution are returned as JSON.

---

## Project documentation

- **Project title:** Environmental Sound Classification System Using Convolutional Neural Network (CNN)
- **Department:** Computer Science
- **Student:** (Your Name)
- **Supervisor:** (Supervisor Name)

---

## License

For academic and educational use. All third-party libraries retain their respective licenses.
