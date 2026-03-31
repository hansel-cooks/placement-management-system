import requests

def test_session():
    s = requests.Session()
    print("Testing Login...")
    resp = s.post("http://127.0.0.1:5000/api/auth/login", json={"username": "student1", "password": "Placement@2026!"})
    print("Login Status:", resp.status_code)
    print("Login Response:", resp.text)
    print("Cookies Received:", s.cookies.get_dict())
    
    print("\nTesting /me ...")
    resp2 = s.get("http://127.0.0.1:5000/api/auth/me")
    print("/me Status:", resp2.status_code)
    print("/me Response:", resp2.text)
    
if __name__ == "__main__":
    test_session()
