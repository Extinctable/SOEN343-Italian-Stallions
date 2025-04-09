import os
import base64
import tempfile
import subprocess
from flask import Flask
from flask_socketio import SocketIO
import whisper

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")
model = whisper.load_model("base")
print("✅ Whisper model loaded")

@socketio.on("audio_chunk")
def handle_audio_chunk(base64_data):
    print("🎧 Received audio_chunk (base64)")

    try:
        # Decode base64 -> binary
        audio_data = base64.b64decode(base64_data)
        size_bytes = len(audio_data)
        if size_bytes < 5000:
            print(f"⚠️ Chunk too small ({size_bytes} bytes) - skipping")
            return

        # Write to temp .webm file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as temp_webm:
            temp_webm.write(audio_data)
            webm_path = temp_webm.name

        print(f"✅ Saved .webm: {webm_path} ({os.path.getsize(webm_path)} bytes)")

        # Convert .webm → .wav using FFmpeg
        wav_path = webm_path.replace(".webm", ".wav")
        ffmpeg_cmd = [
            "ffmpeg", "-y",
            "-i", webm_path,
            "-ar", "16000",
            "-ac", "1",
            wav_path
        ]

        print("▶️ Running FFmpeg:", " ".join(ffmpeg_cmd))
        process = subprocess.run(ffmpeg_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

        if process.returncode != 0:
            print("❌ FFmpeg failed:")
            print(process.stderr.decode())
            return

        # Transcribe
        result = model.transcribe(wav_path, language="en")
        text = result.get("text", "").strip()
        print("📝 Transcribed text:", text)

        if text:
            socketio.emit("subtitle", text)

    except Exception as e:
        print("❌ Transcription error:", e)

    finally:
        try:
            if 'webm_path' in locals() and os.path.exists(webm_path):
                os.remove(webm_path)
            if 'wav_path' in locals() and os.path.exists(wav_path):
                os.remove(wav_path)
        except Exception as cleanup_err:
            print("⚠️ Cleanup error:", cleanup_err)

if __name__ == "__main__":
    socketio.run(app, host="0.0.0.0", port=5050)
