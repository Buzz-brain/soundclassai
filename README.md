# Environmental Sound Classification System

> **An AI that listens to everyday sounds and tells you what it hears.**

This web application uses artificial intelligence to recognise **five common
environmental sounds** — a dog barking, a car horn, an engine idling, a siren,
or street music — from any short audio recording.

You upload a sound file (WAV or MP3), and within seconds the app tells you
which sound it detected, how confident the AI is, and a full breakdown of all
five possibilities.

---

## Try it now

**Live demo: https://soundclassai.onrender.com**

Just open the link, drop in an audio file, and watch the AI do its work.

> Tip: The first visit after a period of inactivity can take about a minute to
> wake the server up. After that, results come back in a couple of seconds.

---

## What does this app do?

Put simply: **it listens.** Many computer programs can understand written words
and spoken language, but very few can make sense of the *noise of the world
around us* — the sound of a siren in traffic, a dog barking in the distance, or
music drifting out of a street shop.

This system was trained to recognise five of the most common everyday sounds:

| Sound | What it sounds like |
|-------|---------------------|
| **Car Horn** | A vehicle horn beeping |
| **Dog Bark** | A dog barking or yapping |
| **Engine Idling** | A car or motorcycle engine running while parked |
| **Siren** | An ambulance, police car, or emergency siren |
| **Street Music** | Music playing in a public space |

Each time you upload a recording, the app answers two questions:

1. **Which of the five sounds is this?**
2. **How sure is the AI?** (a percentage, from 0% to 100%)

---

## Key features

- **Simple to use** — a drag-and-drop upload box. No accounts, no settings,
  no technical knowledge required.
- **Works with WAV and MP3** — the two most common audio formats.
- **Fast results** — a clear answer in seconds, with a confidence score.
- **Full sound breakdown** — see how the AI weighed all five sounds, not just
  the winner.
- **Audio preview** — play back your recording right in the page.
- **Waveform view** — a visual picture of the sound you uploaded.
- **Animated results** — a confidence ring and probability bars that make the
  answer easy to read at a glance.
- **Friendly explanations** — the app describes what it heard in plain
  language.
- **Model dashboard** — a behind-the-scenes panel showing how the AI model was
  built and how well it was tested.
- **Works on any device** — phone, tablet, or computer.
- **Clear error messages** — if a file can't be read or is too short, the app
  says so politely instead of failing silently.

---

## How it works

### For you, the user

1. **Upload** a sound file — drag it into the box or click to browse.
2. **The AI listens** — the first four seconds of the audio are analysed.
3. **See the result** — the app names the sound it heard and how confident it
   is, with a visual breakdown of all five options.

### The science (in simple terms)

Behind the scenes, the sound is translated into a special visual picture
called a **Mel Spectrogram** — a chart that shows the different frequencies in
the sound over time. Human ears work in a similar way: different pitches and
rhythms create different patterns.

```
Your audio  →  Sound picture (Mel Spectrogram)  →  AI model (MobileNetV2)  →  Five scores  →  Answer + confidence
```

The AI model, called **MobileNetV2**, was taught using a well-known public
dataset of real-world sounds (**UrbanSound8K**). It learned to spot the subtle
differences between, say, a siren and street music by studying thousands of
labelled examples. This approach — taking a powerful, pre-trained network and
teaching it a new, specialised task — is called **transfer learning**, and it
is the same technique behind many modern AI products.

---

## How well does it work?

On a held-out set of recordings the model had never seen before, it identified
the correct sound **85.78% of the time** — well above the 20% you would expect
from random guessing across five options.

The model was also reviewed using professional machine-learning visualisations:

- **Training accuracy curve** — how accuracy improved during training:

  ![Training accuracy curve](frontend/assets/images/training_accuracy_curve.png)

- **Training loss curve** — how the model's mistakes shrank over time:

  ![Training loss curve](frontend/assets/images/training_loss_curve.png)

- **Confusion matrix** — a grid showing exactly which sounds the model
  sometimes mixes up (for example, how often it mistakes street music for a
  siren):

  ![Confusion matrix](frontend/assets/images/confusion_matrix.png)

---

## What's under the hood

The system is deliberately built with a clean separation between the "brain"
and the "face":

| Layer | What it does | Technology |
|-------|--------------|------------|
| **The Face (Frontend)** | Everything you see and click in the browser | HTML, CSS, JavaScript |
| **The Brain (Backend)** | Receives your file, analyses it, and returns the answer | Python + Flask |
| **The AI Model** | Does the actual listening and classification | MobileNetV2 (CNN), ONNX Runtime |
| **Audio Analysis** | Turns sound into the picture the AI understands | Librosa |

The trained model is stored in an optimised, lightweight format (ONNX) that
keeps the app fast and cheap to run online.

---

## Project details

- **Project title:** Environmental Sound Classification System Using
  Convolutional Neural Network (CNN)
- **Department:** Computer Science
- **Student:** (Student Name)
- **Supervisor:** (Supervisor Name)

---

## For developers

> The sections below are for anyone who wants to run or extend the project
> themselves. End users do not need any of this.

### Repository

- **Source code:** https://github.com/Buzz-brain/soundclassai
- **Live deployment:** https://soundclassai.onrender.com

### Local setup

```bash
# 1. Create a virtual environment
python -m venv .venv

# 2. Activate it
#    Windows (PowerShell): .venv\Scripts\Activate.ps1
#    macOS / Linux:        source .venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Run the app
python app.py
```

Open <http://127.0.0.1:5000> in your browser.

### Requirements

- Python 3.11+
- `requirements.txt` — pinned dependencies (Flask, librosa, numpy, scipy,
  soundfile, soxr, onnxruntime, gunicorn).
- TensorFlow / Keras is **not** required at runtime. The web process serves
  the model through ONNX Runtime only, which keeps the deployment small and
  fast. The Keras model can be re-exported to ONNX with
  `tools/convert_to_onnx.py`.

### Project structure

```
soundclassifier/
│
├── app.py                       # Flask entry point (application factory)
├── requirements.txt             # Pinned Python dependencies
├── render.yaml                  # Render (cloud) deployment configuration
├── Procfile                     # Gunicorn start command
├── create_dummy_model.py        # Optional: generates a placeholder model
│
├── backend/
│   ├── config.py                # Centralised configuration
│   ├── routes.py                # REST API blueprint
│   ├── utils.py                 # File helpers & validation
│   ├── preprocessing.py         # Audio → Mel spectrogram pipeline
│   ├── predictor.py             # ONNX model loading + inference service
│   └── model/
│       └── best_model.onnx      # Trained model (ONNX export)
│
├── frontend/
│   ├── index.html               # Single-page interface
│   ├── css/                     # Styles, animations, responsive layout
│   ├── js/                      # UI, upload, prediction, app bootstrap
│   └── assets/images/           # Training charts used in this README
│
├── tools/
│   └── convert_to_onnx.py       # Keras → ONNX export helper
│
└── uploads/                     # Temporary storage for uploads
```

### REST API

#### `POST /api/predict`

Classify an uploaded audio file. Expects `multipart/form-data` with the field
`audio` (WAV or MP3, max 16 MB, min 0.5 s):

```
curl -X POST https://soundclassai.onrender.com/api/predict \
     -F "audio=@/path/to/dog_bark.wav"
```

Success response (200):

```json
{
  "status": "success",
  "prediction": "Dog Bark",
  "confidence": 99.54,
  "latency_ms": 1407.71,
  "probabilities": [
    { "class": "Dog Bark", "probability": 99.54 },
    { "class": "Street Music", "probability": 0.18 },
    { "class": "Car Horn", "probability": 0.14 }
  ],
  "top_probabilities": [
    { "class": "Dog Bark", "probability": 99.54 },
    { "class": "Street Music", "probability": 0.18 }
  ]
}
```

Error codes:

| Code         | Status | Meaning                                |
|--------------|--------|----------------------------------------|
| `NO_FILE`    | 400    | No `audio` field in the request        |
| `BAD_TYPE`   | 400    | Not a `.wav` or `.mp3` file            |
| `TOO_SHORT`  | 400    | Audio is shorter than 0.5 seconds      |
| `DECODE`     | 400    | File could not be decoded              |
| `TOO_LARGE`  | 413    | Upload exceeds 16 MB                   |
| `MODEL`      | 503    | Model file missing or unreadable       |
| `PREDICTION` | 500    | Inference failed on a valid file       |

#### `GET /api/model-info`

Live model and pipeline metadata (architecture, classes, accuracy, input
details).

#### `GET /api/health`

Service health check and model readiness.

### Deployment notes

- Hosted on **Render** (free tier) and kept awake by a scheduled cron job that
  pings `/api/model-info` every 10 minutes.
- The Render build pre-compiles librosa's audio kernels so the app boots fast
  on the free 0.1-CPU instance; synchronous model warm-up at startup guarantees
  the first request is never slow.

---

## License

For academic and educational use. All third-party libraries retain their
respective licenses.
