import json
import os
import shutil

try:
    import kagglehub
except ImportError:
    print("kagglehub not installed. Run: pip install kagglehub")
    exit(1)

print("Downloading dataset 'engamohammed/sign-language-for-lstm'...")
path = kagglehub.dataset_download("engamohammed/sign-language-for-lstm")
print(f"Dataset downloaded to: {path}")

# The dataset is expected to contain word folders (hello, thanks, etc.)
# Let's move it to our MP_Data folder
dest_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'MP_Data'))

if os.path.exists(dest_path):
    print(f"Removing existing {dest_path}...")
    shutil.rmtree(dest_path)

print(f"Copying dataset from {path} to {dest_path}...")
shutil.copytree(path, dest_path)
print("Done!")

# Verify a random .npy file to check its shape
for root, dirs, files in os.walk(dest_path):
    for f in files:
        if f.endswith('.npy'):
            import numpy as np
            npy_file = os.path.join(root, f)
            arr = np.load(npy_file)
            print(f"Shape of {f}: {arr.shape}")
            exit(0)
