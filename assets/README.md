# Assets Folder

This folder should contain the following image assets for your Expo app:

## Required Assets

1. **icon.png** (1024x1024 px)
   - App icon shown on home screen
   - Should be a simple, recognizable icon
   - Suggested: A calendar or flower icon in pink/purple

2. **splash.png** (1284x2778 px for iOS, 1080x1920 px for Android)
   - Shown while app loads
   - Background color should match backgroundColor in app.json (#ff6b9d)
   - Can contain app name and icon

3. **adaptive-icon.png** (1024x1024 px)
   - Android adaptive icon
   - Should have transparent background
   - Icon should be centered in a 432x432 px safe zone

4. **favicon.png** (48x48 px)
   - Web favicon
   - Small version of your app icon

## How to Create Assets

### Quick Start (Using Placeholders)

For development, you can create simple placeholder images:

1. Use any image editor (Paint, Preview, Photoshop, etc.)
2. Create a pink/purple square image
3. Add a simple calendar or period symbol
4. Export at the sizes mentioned above

### Professional Assets

For production:
1. Hire a designer on Fiverr or 99designs
2. Use Canva Pro templates
3. Use Figma icon libraries
4. Generate with AI tools like DALL-E or Midjourney

### Online Tools

Free tools to create app icons:
- [App Icon Generator](https://www.appicon.co/)
- [Canva](https://www.canva.com/) (has app icon templates)
- [Figma](https://www.figma.com/) (free tier available)

## Temporary Solution

If you want to test the app without custom icons, you can use solid color placeholders:
1. Create 1024x1024 px pink square for icon.png
2. Create 1284x2778 px pink rectangle for splash.png
3. Same pink square for adaptive-icon.png
4. 48x48 px pink square for favicon.png

The app will work fine with these placeholders during development!

## Color Palette

Use these colors for consistency:
- Primary: #ff6b9d (pink)
- Secondary: #ffc6d9 (light pink)
- Accent: #ff1744 (dark pink/red)
- Background: #ffffff (white)

## Asset Checklist

- [ ] icon.png (1024x1024)
- [ ] splash.png (1284x2778)
- [ ] adaptive-icon.png (1024x1024)
- [ ] favicon.png (48x48)

Once you add these files, Expo will automatically use them in your app!

