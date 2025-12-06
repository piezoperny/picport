import os
import json

# Configuration
IMAGE_ROOT = "images/MASTER"
OUTPUT_FILE = "gallery.json"
VALID_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}

def generate_gallery():
    gallery_data = {}

    # Check if the master folder exists
    if not os.path.exists(IMAGE_ROOT):
        print(f"Error: Directory '{IMAGE_ROOT}' not found.")
        print("Please create the folder structure: images/MASTER/[Category Name]/")
        return

    # Walk through the directory structure
    for root, dirs, files in os.walk(IMAGE_ROOT):
        # Skip the root folder itself, we only want subfolders (Categories)
        if root == IMAGE_ROOT:
            continue
            
        # The folder name becomes the Category (e.g., "Nature")
        category_name = os.path.basename(root)
        
        # Initialize list for this category
        images = []
        
        for file in files:
            # Check if file is an image
            if os.path.splitext(file)[1].lower() in VALID_EXTENSIONS:
                # Create the path relative to the website root
                # We use forward slashes (/) to ensure it works on the web
                file_path = os.path.join(root, file).replace("\\", "/")
                images.append(file_path)
        
        # Only add the category if it has images
        if images:
            # Sort images alphabetically so they don't jump around
            gallery_data[category_name] = sorted(images)

    # Write to JSON file
    with open(OUTPUT_FILE, "w") as f:
        json.dump(gallery_data, f, indent=2)
    
    print(f"Success! Generated {OUTPUT_FILE} with {len(gallery_data)} categories.")

if __name__ == "__main__":
    generate_gallery()
