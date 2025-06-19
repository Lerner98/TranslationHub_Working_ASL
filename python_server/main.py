# enhanced_main.py
import base64
import cv2
import numpy as np
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import mediapipe as mp
import asyncio
import json
import logging
import os
import tensorflow as tf
from typing import Dict, List, Optional
import time

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="ASL Translation Server")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize MediaPipe Hands with optimized settings
mp_hands = mp.solutions.hands.Hands(
    static_image_mode=False,
    max_num_hands=1,
    min_detection_confidence=0.7,
    min_tracking_confidence=0.5,
    model_complexity=1  # 0=lite, 1=full, 2=heavy
)

mp_drawing = mp.solutions.drawing_utils

# ASL Labels
LABELS = ["Yes", "No", "I Love You", "Hello", "Thank You"]

class ASLModel:
    def __init__(self):
        self.model = None
        self.model_loaded = False
        self.load_model()
    
    def load_model(self):
        """Load TensorFlow model with fallback to rule-based"""
        try:
            model_path = os.path.join(os.path.dirname(__file__), 'models', 'asl_model_tf')
            if os.path.exists(model_path):
                self.model = tf.keras.models.load_model(model_path)
                self.model_loaded = True
                logger.info("✅ TensorFlow model loaded successfully")
            else:
                logger.warning("⚠️ Model not found, using rule-based classification")
        except Exception as e:
            logger.error(f"❌ Failed to load model: {e}")
            self.model_loaded = False
    
    def predict(self, features: np.ndarray) -> tuple[str, float]:
        """Predict ASL gesture from hand landmarks"""
        if self.model_loaded and self.model is not None:
            try:
                features_reshaped = features.reshape(1, -1)
                predictions = self.model.predict(features_reshaped, verbose=0)
                confidence = float(np.max(predictions))
                predicted_class = int(np.argmax(predictions))
                gesture = LABELS[predicted_class] if predicted_class < len(LABELS) else "Unknown"
                return gesture, confidence
            except Exception as e:
                logger.error(f"Model prediction error: {e}")
                return self.rule_based_prediction(features)
        else:
            return self.rule_based_prediction(features)
    
    def rule_based_prediction(self, features: np.ndarray) -> tuple[str, float]:
        """Fallback rule-based gesture recognition"""
        # Convert flattened features back to landmarks
        landmarks = features.reshape(21, 3)
        
        # Extract key points
        wrist = landmarks[0]
        thumb_tip = landmarks[4]
        index_tip = landmarks[8]
        middle_tip = landmarks[12]
        ring_tip = landmarks[16]
        pinky_tip = landmarks[20]
        
        # Simple rule-based classification
        fingers_up = []
        fingers_up.append(thumb_tip[1] < landmarks[3][1])  # Thumb
        fingers_up.append(index_tip[1] < landmarks[6][1])  # Index
        fingers_up.append(middle_tip[1] < landmarks[10][1])  # Middle
        fingers_up.append(ring_tip[1] < landmarks[14][1])  # Ring
        fingers_up.append(pinky_tip[1] < landmarks[18][1])  # Pinky
        
        fingers_up_count = sum(fingers_up)
        
        if fingers_up_count == 5:
            return "Hello", 0.8
        elif fingers_up_count == 2 and fingers_up[1] and fingers_up[4]:
            return "I Love You", 0.8
        elif fingers_up_count == 1 and fingers_up[0]:
            return "Yes", 0.7
        elif fingers_up_count == 2 and fingers_up[1] and fingers_up[2]:
            return "No", 0.7
        elif fingers_up_count == 0:
            return "Thank You", 0.6
        else:
            return "Unknown", 0.3

# Initialize model
asl_model = ASLModel()

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
    
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"📱 Client connected. Total connections: {len(self.active_connections)}")
    
    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        logger.info(f"📱 Client disconnected. Total connections: {len(self.active_connections)}")

manager = ConnectionManager()

def extract_hand_landmarks(image: np.ndarray) -> tuple[Optional[np.ndarray], List[Dict], bool]:
    """Extract hand landmarks from image using MediaPipe"""
    try:
        # Convert BGR to RGB
        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        results = mp_hands.process(rgb_image)
        
        if results.multi_hand_landmarks:
            # Get first hand landmarks
            hand_landmarks = results.multi_hand_landmarks[0]
            
            # Extract landmark coordinates
            landmarks = []
            features = []
            
            for landmark in hand_landmarks.landmark:
                landmarks.append({
                    "x": landmark.x,
                    "y": landmark.y, 
                    "z": landmark.z
                })
                features.extend([landmark.x, landmark.y, landmark.z])
            
            return np.array(features), landmarks, True
        
        return None, [], False
        
    except Exception as e:
        logger.error(f"Landmark extraction error: {e}")
        return None, [], False

@app.websocket("/asl-ws")
async def asl_websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    
    try:
        while True:
            # Receive frame data
            data = await websocket.receive_text()
            frame_data = json.loads(data)
            
            if "frame" not in frame_data:
                await websocket.send_json({"error": "No frame data received"})
                continue
            
            # Decode base64 image
            try:
                img_data = frame_data["frame"]
                if "," in img_data:
                    img_data = img_data.split(",")[1]
                
                img_bytes = base64.b64decode(img_data)
                np_arr = np.frombuffer(img_bytes, np.uint8)
                image = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
                
                if image is None:
                    await websocket.send_json({"error": "Failed to decode image"})
                    continue
                
            except Exception as e:
                logger.error(f"Image decoding error: {e}")
                await websocket.send_json({"error": f"Image decoding failed: {str(e)}"})
                continue
            
            # Extract hand landmarks
            features, landmarks, hand_detected = extract_hand_landmarks(image)
            
            # Prepare response
            response = {
                "timestamp": time.time(),
                "hand_detected": hand_detected,
                "landmarks": landmarks,
                "gesture": "None",
                "confidence": 0.0
            }
            
            # Predict gesture if hand detected
            if hand_detected and features is not None:
                gesture, confidence = asl_model.predict(features)
                response["gesture"] = gesture
                response["confidence"] = confidence
                
                logger.info(f"🤟 Detected: {gesture} (confidence: {confidence:.2f})")
            
            # Send response
            await websocket.send_json(response)
            
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "model_loaded": asl_model.model_loaded,
        "active_connections": len(manager.active_connections)
    }

@app.get("/")
async def root():
    return {
        "message": "ASL Translation Server",
        "endpoints": {
            "websocket": "/asl-ws",
            "health": "/health"
        }
    }

if __name__ == "__main__":
    import uvicorn
    logger.info("🚀 Starting ASL Translation Server...")
    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=8000,
        log_level="info",
        access_log=True
    )