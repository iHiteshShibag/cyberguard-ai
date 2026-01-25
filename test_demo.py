import requests
import json

def test_analyze(log_data):
    url = "http://localhost:3000/api/analyze"
    payload = {"logData": log_data}
    headers = {"Content-Type": "application/json"}
    
    try:
        response = requests.post(url, data=json.dumps(payload), headers=headers)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    print("Testing Brute Force Scenario:")
    test_analyze("Jan 24 10:15:03 auth-server sshd: Failed password for admin from 192.168.1.105")
    
    print("\nTesting Normal Scenario:")
    test_analyze("Jan 24 10:15:03 auth-server sshd: Session opened for user admin")
