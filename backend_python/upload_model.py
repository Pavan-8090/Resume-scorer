"""
Utility script to upload trained models to Hugging Face Hub
Usage: python upload_model.py <folder_path> <repo_id>
Example: python upload_model.py ./models/resume_matcher PavanRathodR/APi
"""
import sys
import os
from dotenv import load_dotenv
from resume_analyzer import upload_model_to_hf

load_dotenv()

def main():
    if len(sys.argv) < 3:
        print("Usage: python upload_model.py <folder_path> <repo_id>")
        print("Example: python upload_model.py ./models/resume_matcher PavanRathodR/APi")
        sys.exit(1)
    
    folder_path = sys.argv[1]
    repo_id = sys.argv[2]
    
    if not os.path.exists(folder_path):
        print(f"Error: Folder not found: {folder_path}")
        sys.exit(1)
    
    if not os.getenv("HF_TOKEN"):
        print("Error: HF_TOKEN environment variable not set")
        print("Please set it in your .env file or export it:")
        print("  export HF_TOKEN=your_huggingface_token")
        sys.exit(1)
    
    print(f"Uploading model from {folder_path} to {repo_id}...")
    success = upload_model_to_hf(folder_path, repo_id)
    
    if success:
        print(f"✅ Successfully uploaded model to {repo_id}")
        print(f"Model available at: https://huggingface.co/{repo_id}")
    else:
        print("❌ Failed to upload model")
        sys.exit(1)

if __name__ == "__main__":
    main()

