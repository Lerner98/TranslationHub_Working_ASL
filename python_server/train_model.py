import cv2
import mediapipe as mp
import numpy as np
import pandas as pd
import pickle
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
import tensorflow as tf
from tensorflow.keras import layers, models
import time
import os

# Initialize MediaPipe Hands
mp_hands = mp.solutions.hands.Hands(
    static_image_mode=False,
    max_num_hands=1,
    min_detection_confidence=0.7,  # Higher confidence for better detection
    min_tracking_confidence=0.7
)

# Define labels - REAL ASL GESTURES
LABELS = ["Yes", "No", "I Love You", "Hello", "Thank You"]

def collect_data_for_sign(sign: str, num_samples: int = 120):
    """Fast data collection with manual control - closer to original speed."""
    cap = cv2.VideoCapture(0)
    print(f"\n🎯 Collecting '{sign}' - Press ENTER when ready, then 'E' to start!")
    input("Press ENTER to begin...")
    
    features = []
    count = 0
    collecting = False
    
    print(f"🔴 Press 'E' to START collecting '{sign}'")
    
    while count < num_samples:
        ret, frame = cap.read()
        if not ret:
            continue
            
        # Flip for mirror effect
        frame = cv2.flip(frame, 1)
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = mp_hands.process(frame_rgb)
        
        # Show status
        status = "🔴 RECORDING" if collecting else "⏸️ PAUSED"
        color = (0, 255, 0) if collecting else (0, 0, 255)
        
        cv2.putText(frame, f"{sign}: {status} - {count}/{num_samples}", (10, 30), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, color, 2)
        cv2.putText(frame, "Press 'E' to toggle, 'Q' to finish early", (10, 70), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
        
        # Collect data when recording and hand detected
        if collecting and results.multi_hand_landmarks:
            landmarks = results.multi_hand_landmarks[0].landmark
            feature = np.array([[lm.x, lm.y, lm.z] for lm in landmarks]).flatten()
            features.append(feature)
            count += 1
            
            # Visual feedback
            cv2.putText(frame, "✅ CAPTURED!", (10, 110), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
            
            # Brief pause to prevent too rapid collection
            time.sleep(0.05)
        elif collecting:
            cv2.putText(frame, "❌ No hand detected", (10, 110), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)
        
        # Draw hand landmarks if detected
        if results.multi_hand_landmarks:
            mp.solutions.drawing_utils.draw_landmarks(
                frame, results.multi_hand_landmarks[0], 
                mp.solutions.hands.HAND_CONNECTIONS)
        
        cv2.imshow(f"ASL Training - {sign}", frame)
        
        # Handle keypresses
        key = cv2.waitKey(1) & 0xFF
        if key == ord('e') or key == ord('E'):
            collecting = not collecting
            if collecting:
                print(f"🔴 Started recording '{sign}'")
            else:
                print(f"⏸️ Paused recording '{sign}' - {count}/{num_samples}")
        elif key == ord('q') or key == ord('Q'):
            print(f"⏭️ Finished '{sign}' early - {count} samples")
            break
    
    cap.release()
    cv2.destroyAllWindows()
    print(f"✅ Completed '{sign}' - {len(features)} samples collected")
    return features

def save_data_to_csv(X: np.ndarray, y: np.ndarray, filename: str = "asl_data.csv"):
    """Save features and labels to a CSV file."""
    columns = [f"landmark_{i}_{dim}" for i in range(21) for dim in ["x", "y", "z"]]
    df = pd.DataFrame(X, columns=columns)
    df["label"] = y
    df.to_csv(filename, index=False)
    print(f"💾 Data saved to {filename}")

def create_tensorflow_model(input_shape: tuple, num_classes: int):
    """Create an improved TensorFlow neural network model."""
    model = models.Sequential([
        layers.Input(shape=input_shape),
        layers.Dense(256, activation="relu"),
        layers.BatchNormalization(),
        layers.Dropout(0.3),
        layers.Dense(128, activation="relu"), 
        layers.BatchNormalization(),
        layers.Dropout(0.3),
        layers.Dense(64, activation="relu"),
        layers.Dropout(0.2),
        layers.Dense(num_classes, activation="softmax")
    ])
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=0.001),
        loss="sparse_categorical_crossentropy", 
        metrics=["accuracy"]
    )
    return model

def clean_old_models():
    """SAFELY remove only ASL model files - nothing else."""
    import shutil
    import glob
    import platform
    import subprocess
    
    print("🗑️ SAFE ASL MODEL CLEANUP...")
    
    # ONLY delete files WE create for ASL training
    safe_targets = [
        "models/asl_model.pkl",     # Our pickle model  
        "models/asl_model_tf",      # Our TensorFlow model directory
        "asl_data.csv",             # Our training data CSV
        "asl_model_tf",             # DUPLICATE in root (wrong location)
        "asl_model.pkl",            # DUPLICATE in root (wrong location)
        "models"                    # Our models directory (only if empty or contains our files)
    ]
    
    # Check what's in models directory before deleting
    models_contents = []
    if os.path.exists("models"):
        try:
            models_contents = os.listdir("models")
            print(f"📁 Models directory contains: {models_contents}")
            
            # Only delete if it contains our ASL files or is empty
            our_files = ["asl_model.pkl", "asl_model_tf"]
            safe_to_delete = all(item in our_files or item.startswith("asl_") for item in models_contents)
            
            if len(models_contents) == 0:
                print("📁 Models directory is empty - safe to delete")
                safe_to_delete = True
            elif not safe_to_delete:
                print(f"⚠️ WARNING: Models directory contains non-ASL files: {models_contents}")
                print("⚠️ Skipping models directory deletion for safety")
        except Exception as e:
            print(f"⚠️ Could not check models directory: {e}")
            safe_to_delete = False
    else:
        safe_to_delete = True
    
    # Delete individual ASL files first
    for target in safe_targets[:-1]:  # Skip "models" directory for now
        try:
            if os.path.exists(target):
                if os.path.isdir(target):
                    shutil.rmtree(target)
                    print(f"🗑️ Deleted ASL directory: {target}")
                else:
                    os.remove(target)
                    print(f"🗑️ Deleted ASL file: {target}")
            else:
                print(f"✅ {target} does not exist")
        except Exception as e:
            print(f"⚠️ Could not delete {target}: {e}")
    
    # Only delete models directory if it's safe
    if safe_to_delete and os.path.exists("models"):
        try:
            shutil.rmtree("models")
            print("🗑️ Safely deleted models directory")
        except Exception as e:
            print(f"⚠️ Could not delete models directory: {e}")
    
    # Recreate clean models directory
    try:
        os.makedirs("models", exist_ok=True)
        print("✅ Created fresh models directory")
    except Exception as e:
        print(f"⚠️ Could not create models directory: {e}")
    
    # Verify only our ASL files are gone
    remaining_asl_files = []
    for target in safe_targets[:-1]:
        if os.path.exists(target):
            remaining_asl_files.append(target)
    
    if remaining_asl_files:
        print(f"⚠️ Some ASL files still exist: {remaining_asl_files}")
    else:
        print("✅ All ASL model files successfully removed")
    
    print("✅ SAFE cleanup complete - only ASL files affected!")

def train_model():
    """Fast training with improved model architecture."""
    print("🚀 Starting FRESH ASL Model Training")
    print("=" * 50)
    
    # Clean old models first
    clean_old_models()
    
    X, y = [], []
    
    # Fast data collection for each sign
    for i, sign in enumerate(LABELS):
        print(f"\n📋 [{i+1}/{len(LABELS)}] Training '{sign}'")
        features = collect_data_for_sign(sign, num_samples=120)
        if len(features) > 0:
            X.extend(features)
            y.extend([i] * len(features))
            print(f"✅ Added {len(features)} samples for '{sign}'")
        else:
            print(f"⚠️ No samples for '{sign}'")
    
    if len(X) == 0:
        print("❌ No training data collected!")
        return
    
    X = np.array(X)
    y = np.array(y)
    
    print(f"\n📊 Total dataset: {len(X)} samples across {len(LABELS)} gestures")
    
    # Save training data
    save_data_to_csv(X, y)
    
    # Split data with stratification to ensure balanced classes
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    print(f"🔄 Training: {len(X_train)} samples")
    print(f"🧪 Testing: {len(X_test)} samples")
    
    # Train Random Forest with better parameters
    print("\n🌳 Training Random Forest...")
    rf_model = RandomForestClassifier(
        n_estimators=300,  # More trees
        max_depth=15,      # Deeper trees
        min_samples_split=5,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1  # Use all CPU cores
    )
    rf_model.fit(X_train, y_train)
    rf_predictions = rf_model.predict(X_test)
    rf_accuracy = accuracy_score(y_test, rf_predictions)
    print(f"✅ Random Forest accuracy: {rf_accuracy:.3f}")
    
    # Create models directory
    os.makedirs("models", exist_ok=True)
    
    # Save Random Forest model
    with open("models/asl_model.pkl", "wb") as f:
        pickle.dump(rf_model, f)
    print("💾 Random Forest saved to 'models/asl_model.pkl'")
    
    # Train improved TensorFlow model
    print("\n🧠 Training Neural Network...")
    tf_model = create_tensorflow_model(input_shape=(X.shape[1],), num_classes=len(LABELS))
    
    # Train with better parameters
    history = tf_model.fit(
        X_train, y_train,
        epochs=100,  # More epochs
        batch_size=16,  # Smaller batches
        validation_split=0.2,
        verbose=1,
        callbacks=[
            tf.keras.callbacks.EarlyStopping(patience=10, restore_best_weights=True),
            tf.keras.callbacks.ReduceLROnPlateau(patience=5, factor=0.5)
        ]
    )
    
    # Evaluate TensorFlow model
    tf_loss, tf_accuracy = tf_model.evaluate(X_test, y_test, verbose=0)
    print(f"✅ Neural Network accuracy: {tf_accuracy:.3f}")
    
    # Save TensorFlow model - ONLY in models directory
    tf_model.save("models/asl_model_tf")
    print("💾 Neural Network saved to 'models/asl_model_tf'")
    
    # Verify no duplicate models in root directory
    if os.path.exists("asl_model_tf"):
        try:
            shutil.rmtree("asl_model_tf")
            print("🗑️ Removed duplicate model from root directory")
        except:
            pass
    
    if os.path.exists("asl_model.pkl"):
        try:
            os.remove("asl_model.pkl")
            print("🗑️ Removed duplicate .pkl from root directory")
        except:
            pass
    
    # Print detailed results
    print("\n🎉 Training Complete!")
    print("=" * 50)
    print(f"📊 Dataset Summary:")
    for i, label in enumerate(LABELS):
        count = sum(1 for val in y if val == i)
        print(f"  • {label}: {count} samples")
    print(f"\n🎯 Model Performance:")
    print(f"  • Random Forest: {rf_accuracy:.3f}")
    print(f"  • Neural Network: {tf_accuracy:.3f}")
    print(f"\n🚀 Models saved to 'models/' directory")
    print("🔄 Restart your Python server to load new models!")

if __name__ == "__main__":
    train_model()