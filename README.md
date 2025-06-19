# TranslationHubNative-Split 
 
A split client-server application for real-time translation, including ASL recognition. 
 
## Project Structure 
- `client/`: React Native/Expo app for the frontend. 
- `server/`: Node.js (server.js) and Python (main.py) backend for HTTP and WebSocket services. 
 
## Setup Instructions 
1. Clone the repository: `git clone https://github.com/Lerner98/TranslationHubNative-Split.git` 
2. Set up the client: Navigate to `client/`, run `npm install`, and start with `npx expo start`. 
3. Set up the server: Navigate to `server/`, set up a Python virtual environment, install dependencies (`pip install -r requirements.txt`), and run `node server.js` and `python main.py`. 
4. Configure environment variables: Create `.env` files in `client/` and `server/` with the required keys (e.g., API keys, WebSocket URL). 
 
### Python Dependencies 
The `server/requirements.txt` file lists all Python dependencies required for the server. Install them after setting up the virtual environment using: 
```bash 
``` 
