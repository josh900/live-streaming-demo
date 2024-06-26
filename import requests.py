import asyncio
import aiohttp
import base64
import json
import logging
from aiortc import RTCPeerConnection, RTCSessionDescription

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

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

async def create_stream(session):
    logging.info("Creating stream...")
    post_data = {
        "source_url": "https://create-images-results.d-id.com/DefaultPresenters/Emma_f/v1_image.jpeg"
    }
    try:
        async with session.post(API_URL, headers=headers, json=post_data) as response:
            response.raise_for_status()
            stream_data = await response.json()
            logging.info(f"Stream created successfully. Stream ID: {stream_data['id']}")
            logging.info(f"Full response: {json.dumps(stream_data, indent=2)}")
            return stream_data
    except aiohttp.ClientError as e:
        logging.error(f"Error creating stream: {e}")
        return None

async def start_stream(session, stream_id, session_id, offer):
    logging.info(f"Starting stream with ID: {stream_id}")
    start_url = f"{API_URL}/{stream_id}/sdp"
    
    # Create a WebRTC peer connection
    pc = RTCPeerConnection()
    
    # Set the remote description (offer)
    await pc.setRemoteDescription(RTCSessionDescription(sdp=offer['sdp'], type=offer['type']))
    
    # Create an answer
    answer = await pc.createAnswer()
    
    # Set the local description (answer)
    await pc.setLocalDescription(answer)
    
    start_data = {
        "answer": {
            "type": answer.type,
            "sdp": answer.sdp
        },
        "session_id": session_id
    }
    logging.info(f"Sending data: {json.dumps(start_data, indent=2)}")
    try:
        async with session.post(start_url, headers=headers, json=start_data) as response:
            logging.info(f"Response status code: {response.status}")
            response_text = await response.text()
            logging.info(f"Response content: {response_text}")
            response.raise_for_status()
            start_response = await response.json()
            logging.info("Stream started successfully")
            return start_response
    except aiohttp.ClientError as e:
        logging.error(f"Error starting stream: {e}")
        return None
    finally:
        # Close the peer connection
        await pc.close()

async def main():
    async with aiohttp.ClientSession() as session:
        # Create stream
        stream_data = await create_stream(session)
        if not stream_data:
            return

        # Extract necessary information
        stream_id = stream_data['id']
        session_id = stream_data['session_id']
        offer = stream_data['offer']

        # Start stream
        start_response = await start_stream(session, stream_id, session_id, offer)
        if not start_response:
            return

        logging.info("Stream process completed successfully")

if __name__ == "__main__":
    asyncio.run(main())