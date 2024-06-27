import asyncio
import requests
import base64
import json
import logging
import cv2
import numpy as np
from aiortc import RTCPeerConnection, RTCSessionDescription, RTCConfiguration, RTCIceServer

# Set up logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')

# Your API credentials
API_KEY = "YWRtaW4xQHNrb29wLmRpZ2l0YWw:1FItMzMiqjms0QwfA9g8p"

# Split the API key into username and password
username, password = API_KEY.split(':')

# Encode the credentials
credentials = base64.b64encode(f"{username}:{password}".encode()).decode()

API_URL = "https://api.d-id.com/talks/streams"

headers = {
    "Authorization": f"Basic {credentials}",
    "Content-Type": "application/json"
}

async def create_stream():
    logging.info("Creating stream...")
    post_data = {
        "source_url": "https://create-images-results.d-id.com/DefaultPresenters/Emma_f/v1_image.jpeg"
    }
    response = requests.post(API_URL, headers=headers, json=post_data)
    stream_data = response.json()
    logging.info(f"Stream created successfully. Stream ID: {stream_data['id']}")
    return stream_data

class VideoFrameHandler:
    def __init__(self):
        self.frame_count = 0

    async def handle_track(self, track):
        logging.info(f"Receiving video track")
        
        while True:
            try:
                frame = await track.recv()
                self.frame_count += 1
                logging.info(f"Received video frame {self.frame_count}")
                
                # Convert the frame to a numpy array
                img = frame.to_ndarray(format="bgr24")
                
                # Save the frame as an image
                cv2.imwrite(f"frame_{self.frame_count:04d}.jpg", img)
                
                if self.frame_count >= 100:  # Stop after 100 frames
                    break
            except Exception as e:
                logging.error(f"Error handling video track: {e}")
                break

async def start_stream(stream_id, session_id, offer, ice_servers):
    logging.info(f"Starting stream with ID: {stream_id}")
    start_url = f"{API_URL}/{stream_id}/sdp"

    config = RTCConfiguration(
        iceServers=[RTCIceServer(**server) for server in ice_servers]
    )

    pc = RTCPeerConnection(configuration=config)
    frame_handler = VideoFrameHandler()

    @pc.on("track")
    def on_track(track):
        if track.kind == "video":
            asyncio.create_task(frame_handler.handle_track(track))

    # Set the remote description (offer from D-ID)
    await pc.setRemoteDescription(RTCSessionDescription(sdp=offer['sdp'], type=offer['type']))

    # Create an answer
    answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)

    start_data = {
        "answer": {
            "type": pc.localDescription.type,
            "sdp": pc.localDescription.sdp
        },
        "session_id": session_id
    }

    response = requests.post(start_url, headers=headers, json=start_data)
    logging.info(f"Stream started successfully")
    return pc

async def main():
    try:
        stream_data = await create_stream()
        stream_id = stream_data['id']
        session_id = stream_data['session_id']
        offer = stream_data['offer']
        ice_servers = stream_data['ice_servers']

        pc = await start_stream(stream_id, session_id, offer, ice_servers)

        # Wait for 60 seconds before closing the connection
        await asyncio.sleep(60)
        await pc.close()
    except Exception as e:
        logging.error(f"An error occurred: {str(e)}")
        logging.exception("Exception details:")

if __name__ == "__main__":
    asyncio.run(main())