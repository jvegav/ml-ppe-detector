import io
import cv2
import numpy as np
from PIL import Image
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from ultralytics import YOLO

app = FastAPI(title="PPE Real-Time Detection WebSocket API")

MODEL_PATH = "model/best.pt"

try:
    model = YOLO(MODEL_PATH)
    print(f"Model successfully loaded from {MODEL_PATH}")
except Exception as e:
    print(f"Error loading model: {e}")
    model = None


@app.get("/")
def read_root():
    return {"message": "Hello World!"}


@app.websocket("/ws/predict")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint that:
    1. Accepts the connection.
    2. Receives continuous frames in binary format (JPEG/PNG bytes).
    3. Runs inference with YOLOv8.
    4. Sends back a JSON response with detections for each frame.
    """
    await websocket.accept()
    print("Client connected to WebSocket")

    if model is None:
        await websocket.send_json({"error": "Model not available on the server."})
        await websocket.close()
        return

    try:
        while True:
            data = await websocket.receive_bytes()

          
            nparr = np.frombuffer(data, np.uint8)
            frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

            if frame is None:
                await websocket.send_json({"error": "Invalid or corrupted frame."})
                continue

            
            height, width, _ = frame.shape

          
            results = model.predict(source=frame, conf=0.25, verbose=False)
            result = results[0]

            detections = []
            for box in result.boxes:
                
                coords = box.xyxy[0].tolist()
                confidence = float(box.conf[0])
                class_id = int(box.cls[0])
                class_name = result.names[class_id]

                detections.append({
                    "class_id": class_id,
                    "class_name": class_name,
                    "confidence": round(confidence, 3),
                    "bbox": [round(c, 2) for c in coords]  
                    })
        
            response = {
                "frame_width": width,
                "frame_height": height,
                "total_detections": len(detections),
                "detections": detections
            }

            await websocket.send_json(response)

    except WebSocketDisconnect:
        print("Client disconnected from WebSocket.")
    except Exception as e:
        print(f"Error in the WebSocket stream: {e}")
        await websocket.close()