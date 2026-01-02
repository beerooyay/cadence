import os
import math
from PIL import Image, ImageDraw

def superellipse(t, a, b, n=5):
    """compute point on superellipse (squircle when n~5)"""
    cos_t = math.cos(t)
    sin_t = math.sin(t)
    x = a * (abs(cos_t) ** (2/n)) * (1 if cos_t >= 0 else -1)
    y = b * (abs(sin_t) ** (2/n)) * (1 if sin_t >= 0 else -1)
    return x, y

def create_squircle_mask(size, n=5):
    """create Apple-style squircle mask using superellipse formula"""
    mask = Image.new("L", (size, size), 0)
    draw = ImageDraw.Draw(mask)
    
    center = size / 2
    radius = size / 2
    
    points = []
    steps = 360
    for i in range(steps):
        t = (i / steps) * 2 * math.pi
        x, y = superellipse(t, radius, radius, n)
        points.append((center + x, center + y))
    
    draw.polygon(points, fill=255)
    return mask

def create_mac_icon(input_path, output_path):
    try:
        img = Image.open(input_path).convert("RGBA")
    except Exception as e:
        print(f"failed to load image: {e}")
        return

    canvas = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    
    # macOS Big Sur+ icon specs:
    # - 1024x1024 canvas with transparent background
    # - squircle shape is ~824x824 centered (Apple's standard)
    # - use superellipse n=5 for Apple's squircle curve
    
    squircle_size = 824
    offset = (1024 - squircle_size) // 2  # 100px padding each side
    
    # create squircle mask with Apple's curve
    mask = create_squircle_mask(squircle_size, n=5)
    
    # dark background (#050505)
    bg = Image.new("RGBA", (squircle_size, squircle_size), (5, 5, 5, 255))
    
    # apply mask to background
    squircle = Image.new("RGBA", (squircle_size, squircle_size), (0, 0, 0, 0))
    squircle.paste(bg, (0, 0), mask=mask)
    
    # place squircle on canvas
    canvas.paste(squircle, (offset, offset), mask=squircle)
    
    # resize logo to fit inside squircle (~70% of squircle size)
    logo_size = int(squircle_size * 0.7)
    logo = img.resize((logo_size, logo_size), Image.Resampling.LANCZOS)
    logo_offset = (1024 - logo_size) // 2
    
    # composite logo
    canvas.paste(logo, (logo_offset, logo_offset), mask=logo)
    
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    canvas.save(output_path)
    print(f"created icon at {output_path}")

if __name__ == "__main__":
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    input_file = os.path.join(base_dir, "assets/cadence.png")
    output_file = os.path.join(base_dir, "build/icon.png")
    create_mac_icon(input_file, output_file)
