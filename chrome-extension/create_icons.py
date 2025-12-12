#!/usr/bin/env python3
"""
Generate Chrome extension icons from logo.png
Requires: pip install Pillow
"""

from PIL import Image
import os

def create_icons():
    """Create extension icons from logo"""
    logo_path = '../frontend/public/logo.png'
    icons_dir = 'icons'
    
    if not os.path.exists(logo_path):
        print(f"Logo not found at {logo_path}")
        print("Creating placeholder icons...")
        create_placeholder_icons()
        return
    
    if not os.path.exists(icons_dir):
        os.makedirs(icons_dir)
    
    try:
        # Open logo
        logo = Image.open(logo_path)
        
        # Create icons in required sizes
        sizes = [16, 48, 128]
        
        for size in sizes:
            # Resize with high-quality resampling
            icon = logo.resize((size, size), Image.Resampling.LANCZOS)
            
            # Convert to RGBA if needed
            if icon.mode != 'RGBA':
                icon = icon.convert('RGBA')
            
            # Save icon
            icon_path = os.path.join(icons_dir, f'icon{size}.png')
            icon.save(icon_path, 'PNG', optimize=True)
            print(f"Created {icon_path} ({size}x{size})")
        
        print("\nAll icons created successfully!")
        
    except Exception as e:
        print(f"❌ Error creating icons: {e}")
        print("Creating placeholder icons...")
        create_placeholder_icons()

def create_placeholder_icons():
    """Create simple placeholder icons"""
    from PIL import Image, ImageDraw, ImageFont
    
    icons_dir = 'icons'
    if not os.path.exists(icons_dir):
        os.makedirs(icons_dir)
    
    sizes = [16, 48, 128]
    colors = {
        16: '#667eea',
        48: '#667eea',
        128: '#667eea'
    }
    
    for size in sizes:
        # Create colored square with "R" text
        img = Image.new('RGBA', (size, size), (102, 126, 234, 255))
        draw = ImageDraw.Draw(img)
        
        # Draw "R" text
        try:
            font_size = int(size * 0.6)
            font = ImageFont.truetype("arial.ttf", font_size)
        except:
            font = ImageFont.load_default()
        
        text = "R"
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
        position = ((size - text_width) // 2, (size - text_height) // 2)
        
        draw.text(position, text, fill='white', font=font)
        
        icon_path = os.path.join(icons_dir, f'icon{size}.png')
        img.save(icon_path, 'PNG')
        print(f"Created placeholder {icon_path} ({size}x{size})")
    
    print("\nPlaceholder icons created!")

if __name__ == '__main__':
    print("Creating Chrome extension icons...\n")
    try:
        create_icons()
    except Exception as e:
        print(f"Error: {e}")
        print("Creating placeholder icons...")
        create_placeholder_icons()

