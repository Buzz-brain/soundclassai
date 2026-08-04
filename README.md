# SoundClass AI

<h4 align="center">Environmental Sound Classification System</h4>

<p align="center">
  <img alt="Status: live" src="https://img.shields.io/badge/status-live-10B981">
  <img alt="Test accuracy" src="https://img.shields.io/badge/accuracy-85.78%25-2563EB">
  <img alt="Python" src="https://img.shields.io/badge/python-3.11-blue">
  <img alt="Model" src="https://img.shields.io/badge/model-MobileNetV2-7C3AED">
  <img alt="Runtime" src="https://img.shields.io/badge/runtime-ONNX%20Runtime-06B6D4">
</p>

<p align="center">
  An AI that <strong>listens to the world around it</strong> and tells you which
  everyday sound it hears — a barking dog, a car horn, an idling engine, a siren,
  or street music.
</p>

<p align="center">
  <a href="https://soundclassai.onrender.com"><b>Try the live demo</b></a> ·
  <a href="https://github.com/Buzz-brain/soundclassai">Source code</a>
</p>

---

## A look at the app

<p align="center">
<svg width="880" viewBox="0 0 880 500" xmlns="http://www.w3.org/2000/svg" style="max-width:840px;display:block;margin:0 auto" font-family="Inter, -apple-system, Segoe UI, Arial, sans-serif">
  <defs>
    <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#2563EB"/><stop offset="1" stop-color="#7C3AED"/>
    </linearGradient>
    <linearGradient id="g2" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#7C3AED"/><stop offset="1" stop-color="#06B6D4"/>
    </linearGradient>
  </defs>

  <!-- Browser window -->
  <rect x="14" y="14" width="852" height="472" rx="14" fill="#0F172A" stroke="#25364F"/>
  <circle cx="38" cy="38" r="4" fill="#EF4444"/>
  <circle cx="52" cy="38" r="4" fill="#F59E0B"/>
  <circle cx="66" cy="38" r="4" fill="#10B981"/>
  <rect x="96" y="28" width="670" height="20" rx="10" fill="#131E36" stroke="#25364F"/>
  <text x="431" y="42" text-anchor="middle" fill="#94A3B8" font-size="11.5">soundclassai.onrender.com</text>

  <!-- Navigation -->
  <rect x="36" y="62" width="26" height="26" rx="7" fill="url(#g1)"/>
  <path d="M45 71v9l7-4.5z" fill="#FFFFFF"/>
  <text x="72" y="80" fill="#FFFFFF" font-size="14" font-weight="700">SoundClass AI</text>
  <text x="72" y="93" fill="#94A3B8" font-size="10">Environmental Sound Classifier</text>
  <text x="556" y="80" fill="#CBD5E1" font-size="11.5">Home</text>
  <text x="604" y="80" fill="#CBD5E1" font-size="11.5">About</text>
  <text x="652" y="80" fill="#CBD5E1" font-size="11.5">Model</text>
  <text x="700" y="80" fill="#CBD5E1" font-size="11.5">Pipeline</text>
  <text x="748" y="80" fill="#CBD5E1" font-size="11.5">Performance</text>
  <rect x="776" y="68" width="74" height="26" rx="13" fill="#2563EB"/>
  <text x="813" y="85" text-anchor="middle" fill="#FFFFFF" font-size="12" font-weight="600">Predict</text>

  <!-- Hero text -->
  <circle cx="38" cy="146" r="3" fill="#06B6D4"/>
  <text x="48" y="150" fill="#06B6D4" font-size="11" letter-spacing="2">DEEP LEARNING · AUDIO INTELLIGENCE</text>
  <text x="36" y="192" fill="#FFFFFF" font-size="30" font-weight="700">Environmental Sound</text>
  <text x="36" y="228" fill="url(#g1)" font-size="30" font-weight="700">Classification</text>
  <text x="36" y="256" fill="#CBD5E1" font-size="12.5">AI-powered recognition of everyday sounds, built on MobileNetV2.</text>
  <text x="36" y="274" fill="#CBD5E1" font-size="12.5">Upload a WAV or MP3 and get an instant, explainable prediction.</text>
  <rect x="36" y="296" width="150" height="40" rx="10" fill="url(#g1)"/>
  <path d="M58 311v10l8-5z" fill="#FFFFFF"/>
  <text x="102" y="318" text-anchor="middle" fill="#FFFFFF" font-size="13" font-weight="600">Try the Model</text>
  <rect x="198" y="296" width="130" height="40" rx="10" fill="none" stroke="#25364F"/>
  <text x="263" y="318" text-anchor="middle" fill="#CBD5E1" font-size="13" font-weight="600">Learn More</text>

  <!-- Result card -->
  <rect x="468" y="130" width="368" height="230" rx="12" fill="#1E293B" stroke="#25364F"/>
  <text x="492" y="158" fill="#94A3B8" font-size="11.5">PREDICTION</text>
  <text x="492" y="196" fill="#FFFFFF" font-size="26" font-weight="700">Dog Bark</text>
  <circle cx="560" cy="276" r="40" fill="none" stroke="#25364F" stroke-width="11"/>
  <circle cx="560" cy="276" r="40" fill="none" stroke="url(#g2)" stroke-width="11" stroke-linecap="round" stroke-dasharray="250 251" transform="rotate(-90 560 276)"/>
  <text x="560" y="282" text-anchor="middle" fill="#FFFFFF" font-size="20" font-weight="700">99.5%</text>
  <text x="560" y="330" text-anchor="middle" fill="#64748B" font-size="10.5">CONFIDENCE</text>
  <text x="620" y="240" fill="#CBD5E1" font-size="10.5">Dog Bark</text>
  <rect x="620" y="252" width="180" height="7" rx="3.5" fill="#2563EB"/>
  <text x="816" y="259" text-anchor="end" fill="#94A3B8" font-size="10.5">99.5%</text>
  <text x="620" y="270" fill="#CBD5E1" font-size="10.5">Street Music</text>
  <rect x="620" y="282" width="8" height="7" rx="3.5" fill="#2563EB"/>
  <text x="816" y="289" text-anchor="end" fill="#94A3B8" font-size="10.5">0.2%</text>
  <text x="620" y="300" fill="#CBD5E1" font-size="10.5">Siren</text>
  <rect x="620" y="312" width="4" height="7" rx="3.5" fill="#2563EB"/>
  <text x="816" y="319" text-anchor="end" fill="#94A3B8" font-size="10.5">0.1%</text>
  <text x="620" y="330" fill="#CBD5E1" font-size="10.5">Engine Idling</text>
  <rect x="620" y="342" width="4" height="7" rx="3.5" fill="#2563EB"/>
  <text x="816" y="349" text-anchor="end" fill="#94A3B8" font-size="10.5">0.1%</text>
  <text x="620" y="360" fill="#CBD5E1" font-size="10.5">Car Horn</text>
  <rect x="620" y="372" width="4" height="7" rx="3.5" fill="#2563EB"/>
  <text x="816" y="379" text-anchor="end" fill="#94A3B8" font-size="10.5">0.1%</text>

  <!-- Stats band -->
  <rect x="36" y="404" width="256" height="54" rx="12" fill="#131E36" stroke="#25364F"/>
  <text x="60" y="430" fill="#FFFFFF" font-size="20" font-weight="700">85.78%</text>
  <text x="60" y="448" fill="#94A3B8" font-size="10">TEST ACCURACY</text>
  <rect x="308" y="404" width="256" height="54" rx="12" fill="#131E36" stroke="#25364F"/>
  <text x="332" y="430" fill="#FFFFFF" font-size="20" font-weight="700">5</text>
  <text x="332" y="448" fill="#94A3B8" font-size="10">SOUND CLASSES</text>
  <rect x="580" y="404" width="256" height="54" rx="12" fill="#131E36" stroke="#25364F"/>
  <text x="604" y="430" fill="#FFFFFF" font-size="20" font-weight="700">224 x 224</text>
  <text x="604" y="448" fill="#94A3B8" font-size="10">MEL SPECTROGRAM</text>
</svg>
</p>

> The interface above is the real product, redesigned as a quick sketch. Try it
> live at **https://soundclassai.onrender.com**.

---

## In this document

| | |
|---|---|
| [Try it now](#try-it-now) | The fastest way to see the AI in action |
| [What it does](#what-it-does) | The five sounds it recognises |
| [How to use it](#how-to-use-it) | A 30-second guide |
| [Features](#features) | Everything the app offers |
| [How the AI works](#how-the-ai-works) | The science, in plain English |
| [How well it performs](#how-well-it-performs) | Accuracy and training results |
| [Behind the scenes](#behind-the-scenes) | The technology that powers it |
| [Project details](#project-details) | Coursework information |
| [For developers](#for-developers) | Setup, code, and API |

---

## Try it now

Open **https://soundclassai.onrender.com** in any browser — on a phone, tablet,
or computer. No account, no installation, no technical knowledge needed.

1. Click the **Predict** button (or scroll to the upload box).
2. Drag in a sound file — or click to browse. WAV and MP3 both work.
3. Seconds later, the app tells you what it heard and how confident it is.

> **A note on speed:** the free hosting plan lets the server rest during quiet
> periods, so the very first visit after a break can take about a minute to wake
> up. After that, results arrive in a couple of seconds.

---

## What it does

SoundClass AI answers one question: **"What is that sound?"**

Most computer programs understand written words and spoken language, but very
few can make sense of the *noise of the world around us* — the siren in traffic,
the dog barking in the distance, the music drifting out of a street shop. This
system was trained to recognise five of the most common everyday sounds:

| Sound | What it sounds like | Great example to test with |
|-------|---------------------|------------------------------|
| **Car Horn** | A vehicle horn beeping | A recording of a car honking |
| **Dog Bark** | A dog barking or yapping | A video of a dog barking |
| **Engine Idling** | An engine running while parked | A car or bike waiting at a light |
| **Siren** | An emergency vehicle siren | An ambulance passing by |
| **Street Music** | Music playing in public | A speaker busking on the street |

For every upload, the app returns two things:

1. **Which sound it detected** — the most likely match out of the five.
2. **How sure it is** — a confidence percentage, plus the full breakdown of all
   five possibilities.

---

## How to use it

1. **Upload** — drag a sound file into the box, or click to choose one.
2. **The AI listens** — the first four seconds of your recording are analysed.
3. **Read the result** — the named sound, its confidence ring, and a ranked
   breakdown of all five options.

**Tips for the best results**

- Use at least **four seconds** of audio with a **single, clear sound**.
- Keep the recording focused — lots of overlapping background noise makes the
  task harder (even for human ears).
- MP3s longer than about a minute are trimmed automatically to the most
  relevant first four seconds.

---

## Features

| Capability | Why it matters |
|------------|----------------|
| **Drag-and-drop upload** | No forms to fill in — anyone can use it immediately |
| **WAV and MP3 support** | Works with the two most common audio formats |
| **Fast, clear answers** | A named sound and a confidence score in seconds |
| **Full sound breakdown** | See how all five sounds ranked, not just the winner |
| **Confidence ring** | An instant visual read on how sure the AI is |
| **Audio player** | Play your recording back right in the page |
| **Waveform view** | A visual picture of the sound you uploaded |
| **Model dashboard** | A transparent look at how the model was built and tested |
| **Friendly errors** | If a file can't be read, the app explains why — politely |
| **Works on any device** | Responsive design for phones, tablets, and desktops |
| **Dark and light themes** | A comfortable viewing experience, day or night |

---

## How the AI works

### In one sentence

The recording is turned into a *picture of the sound*, and an AI model that has
studied thousands of real-world examples decides which of the five sounds that
picture looks most like.

```
<p align="center">
<svg width="900" viewBox="0 0 900 150" xmlns="http://www.w3.org/2000/svg" style="max-width:880px;display:block;margin:0 auto" font-family="Inter, -apple-system, Segoe UI, Arial, sans-serif">
  <defs>
    <marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto">
      <path d="M0,0 L8,3 L0,6 Z" fill="#94A3B8"/>
    </marker>
  </defs>
  <line x1="188" y1="72" x2="200" y2="72" stroke="#94A3B8" stroke-width="2" marker-end="url(#arrow)"/>
  <line x1="358" y1="72" x2="370" y2="72" stroke="#94A3B8" stroke-width="2" marker-end="url(#arrow)"/>
  <line x1="528" y1="72" x2="540" y2="72" stroke="#94A3B8" stroke-width="2" marker-end="url(#arrow)"/>
  <line x1="698" y1="72" x2="710" y2="72" stroke="#94A3B8" stroke-width="2" marker-end="url(#arrow)"/>

  <rect x="30" y="45" width="158" height="54" rx="12" fill="#2563EB"/>
  <text x="109" y="72" text-anchor="middle" fill="#FFFFFF" font-size="14" font-weight="600">Upload audio</text>
  <text x="109" y="88" text-anchor="middle" fill="#FFFFFF" opacity="0.85" font-size="9.5">WAV or MP3 file</text>

  <rect x="200" y="45" width="158" height="54" rx="12" fill="#7C3AED"/>
  <text x="279" y="72" text-anchor="middle" fill="#FFFFFF" font-size="14" font-weight="600">Mel spectrogram</text>
  <text x="279" y="88" text-anchor="middle" fill="#FFFFFF" opacity="0.85" font-size="9.5">a picture of the sound</text>

  <rect x="370" y="45" width="158" height="54" rx="12" fill="#06B6D4"/>
  <text x="449" y="72" text-anchor="middle" fill="#FFFFFF" font-size="14" font-weight="600">MobileNetV2</text>
  <text x="449" y="88" text-anchor="middle" fill="#FFFFFF" opacity="0.85" font-size="9.5">the AI model</text>

  <rect x="540" y="45" width="158" height="54" rx="12" fill="#7C3AED"/>
  <text x="619" y="72" text-anchor="middle" fill="#FFFFFF" font-size="14" font-weight="600">Five scores</text>
  <text x="619" y="88" text-anchor="middle" fill="#FFFFFF" opacity="0.85" font-size="9.5">one per sound class</text>

  <rect x="710" y="45" width="158" height="54" rx="12" fill="#10B981"/>
  <text x="789" y="72" text-anchor="middle" fill="#FFFFFF" font-size="14" font-weight="600">Answer</text>
  <text x="789" y="88" text-anchor="middle" fill="#FFFFFF" opacity="0.85" font-size="9.5">sound + confidence</text>
</svg>
</p>
```

### The details, still in plain English

1. **Your sound becomes a picture.** The first four seconds of the recording
   are translated into a **Mel spectrogram** — a chart that shows the different
   frequencies in the sound over time. It is tuned to match human hearing, which
   is why it works so well on the sounds we care about.
2. **The AI studies the picture.** The model, **MobileNetV2**, is a
   *convolutional neural network* — an AI architecture inspired by how the human
   brain processes images. It has learned to spot the subtle visual differences
   between, say, a siren and street music.
3. **It was taught with real sounds.** The model learned from **UrbanSound8K**, a
   well-known public dataset of thousands of real-world audio clips. By seeing
   example after example, it built an internal understanding of what each of the
   five sounds "looks like."
4. **It scores all five options.** For every upload the model produces a score
   for each sound, and the highest score wins. That is why the app can show you
   not just the answer, but *how sure* it is.
5. **A faster, lighter brain.** The trained model is stored in an optimised
   format (ONNX) and served through a lightweight runtime, which keeps the app
   fast and cheap to run online.

This approach — taking a powerful, pre-trained network and teaching it a new,
specialised task — is called **transfer learning**, and it is the same technique
behind many of today's AI products.

---

## How well it performs

On a set of recordings the model had never seen before, it identified the
correct sound **85.78% of the time** — far above the 20% you would expect from
random guessing across five options.

| Test accuracy | Sound classes | Model parameters | Audio window |
|---------------|---------------|------------------|--------------|
| **85.78%** | **5** | **2.6M** | **4 seconds** |

### Training results

These charts were produced while the model was learning, and are the industry's
standard way of verifying that an AI model is genuinely improving rather than
just memorising examples.

| Training accuracy | Training loss |
|-------------------|---------------|
| ![Training accuracy curve](frontend/assets/images/training_accuracy_curve.png) | ![Training loss curve](frontend/assets/images/training_loss_curve.png) |

The confusion matrix below shows exactly which sounds the model sometimes mixes
up (for example, how often it mistakes street music for a siren):

<p align="center">
  <img src="frontend/assets/images/confusion_matrix.png" alt="Confusion matrix" width="420">
</p>

---

## Behind the scenes

The system is deliberately built with a clean separation between the "brain"
and the "face."

| Layer | What it does | Technology |
|-------|--------------|------------|
| **The Face** *(frontend)* | Everything you see and click in the browser | HTML, CSS, JavaScript |
| **The Brain** *(backend)* | Receives your file, analyses it, returns the answer | Python + Flask |
| **The AI Model** | Does the actual listening and classifying | MobileNetV2 (CNN), ONNX Runtime |
| **Audio Analysis** | Turns sound into the picture the AI understands | Librosa |

---

## Project details

- **Project title:** Environmental Sound Classification System Using
  Convolutional Neural Network (CNN)
- **Department:** Computer Science
- **Student:** (Student Name)
- **Supervisor:** (Supervisor Name)

---

## For developers

<details>
<summary><b>Expand — setup, code structure, and API reference</b></summary>

### Repository and deployment

- **Source code:** https://github.com/Buzz-brain/soundclassai
- **Live deployment:** https://soundclassai.onrender.com (Render free tier,
  kept awake by a scheduled cron job pinging `/api/model-info` every 10 minutes)

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

**Requirements:** Python 3.11+, and the pinned packages in `requirements.txt`
(Flask, librosa, numpy, scipy, soundfile, soxr, onnxruntime, gunicorn).
TensorFlow/Keras is **not** needed at runtime — the web process serves the model
through ONNX Runtime only, which keeps the deployment small and fast. The Keras
model can be re-exported to ONNX with `tools/convert_to_onnx.py`.

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
│   ├── utils.py                 # File helpers and validation
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

Live model and pipeline metadata (architecture, classes, accuracy, input size).

#### `GET /api/health`

Service health check and model readiness.

### Deployment notes

- The Render build pre-compiles librosa's audio kernels so the app boots quickly
  on the free 0.1-CPU instance, and the model is warmed synchronously at startup
  so the first request is never slow.

</details>

---

## License

For academic and educational use. All third-party libraries retain their
respective licenses.
