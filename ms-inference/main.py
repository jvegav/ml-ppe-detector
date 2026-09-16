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
    print(f"Modelo cargado exitosamente desde {MODEL_PATH}")
except Exception as e:
    print(f"Error al cargar el modelo: {e}")
    model = None


@app.get("/")
def read_root():
    return {"message": "Hello World!"}


@app.websocket("/ws/predict")
async def websocket_endpoint(websocket: WebSocket):
    """
    Endpoint de WebSocket que:
    1. Acepta la conexión.
    2. Recibe frames continuos en formato binario (bytes de JPEG/PNG).
    3. Ejecuta la inferencia con YOLOv8.
    4. Envía de regreso un JSON con las detecciones para cada frame.
    """
    await websocket.accept()
    print("Client conected by websockets")

    if model is None:
        await websocket.send_json({"error": "Modelo no disponible en el servidor."})
        await websocket.close()
        return

    try:
        while True:
            data = await websocket.receive_bytes()

          
            nparr = np.frombuffer(data, np.uint8)
            frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

            if frame is None:
                await websocket.send_json({"error": "Frame inválido o dañado."})
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