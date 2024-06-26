import requests
import base64

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

# Test with POST request
post_data = {
    "source_url": "https://create-images-results.d-id.com/DefaultPresenters/Emma_f/v1_image.jpeg"
}
post_response = requests.post(API_URL, headers=headers, json=post_data)
print(f"POST Status Code: {post_response.status_code}")
print(f"POST Response: {post_response.text}")

# Check account info
account_url = "https://api.d-id.com/account"
account_response = requests.get(account_url, headers=headers)
print(f"Account Status Code: {account_response.status_code}")
print(f"Account Response: {account_response.text}")