"""
Setup script to create .env file with Hugging Face token
Run: python setup_env.py
"""
import os

def create_env_file():
    env_content = """# Server Configuration
PORT=5000

# Hugging Face Hub Configuration
HF_TOKEN=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

# Custom Model ID from Hugging Face Hub (Optional)
# Default: all-MiniLM-L6-v2
# Set to your custom model ID if you have one (e.g., PavanRathodR/APi)
HF_MODEL_ID=all-MiniLM-L6-v2
"""
    
    env_path = os.path.join(os.path.dirname(__file__), '.env')
    
    if os.path.exists(env_path):
        print(f"WARNING: .env file already exists at {env_path}")
        response = input("Do you want to overwrite it? (y/n): ")
        if response.lower() != 'y':
            print("Cancelled. .env file not modified.")
            return
    
    try:
        with open(env_path, 'w') as f:
            f.write(env_content)
        print(f"SUCCESS: Created .env file at {env_path}")
        print("SUCCESS: Hugging Face token configured")
    except Exception as e:
        print(f"ERROR: Error creating .env file: {e}")

if __name__ == "__main__":
    create_env_file()

