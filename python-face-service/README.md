# Python Face Recognition Service

## Setup

### 1. Install Dependencies
```bash
cd python-face-service
pip install -r requirements.txt
```

### 2. Run Service
```bash
python app.py
```
Service runs on `http://localhost:5001`

## Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/register` | POST | Register face |
| `/verify` | POST | Verify face |
| `/live-verify` | POST | Verify with liveness |
| `/status/<emp_id>` | GET | Check registration |

## API Examples

### Register Face
```json
POST /register
{
  "emp_id": "PWT04",
  "image": "base64..."
}
```

### Verify Face
```json
POST /verify
{
  "emp_id": "PWT04",
  "image": "base64..."
}
```

### Live Verify (with Liveness)
```json
POST /live-verify
{
  "emp_id": "PWT04",
  "frames": ["base64...", "base64...", "base64..."]
}
```

## Troubleshooting

### Windows dlib Error
If `pip install face-recognition` fails:
1. Install Visual Studio Build Tools
2. Or download pre-built wheel from https://github.com/z-mahmud22/Dlib_Windows_Python3.x
