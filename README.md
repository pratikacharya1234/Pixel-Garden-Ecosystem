# 🌱 Pixel Garden Ecosystem

![Pixel Garden Ecosystem](https://img.shields.io/badge/Pixel-Garden-brightgreen)
![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

A browser-based ecosystem simulator where you can plant "pixel seeds" that grow into procedurally generated plants. The entire system runs client-side using JavaScript and HTML5 Canvas, requiring no backend database.

![Garden Screenshot](pixel-garden.png)

## 🌟 Features

### Core Features
- **Interactive Planting System**: Place seeds of different types on the canvas
- **Procedural Growth Algorithm**: Plants grow using cellular automata rules
- **Environmental Factors**: Toggle rain, sunshine, and seasonal changes
- **Ecosystem Interactions**: Plants compete for resources and affect neighboring plants
- **Export Functionality**: Save garden as an image or share via URL parameters

### Plant Types
- 🌼 **Flowers**: Colorful and sun-loving
- 🌳 **Trees**: Tall and provide shade for other plants
- 🌿 **Grass**: Fast-growing and resilient
- 🍄 **Mushrooms**: Thrive in damp, shaded areas

### Plant Behaviors
- Growth through multiple life stages (seed, sprout, growing, mature)
- Resource competition for water and sunlight
- Health fluctuations based on environmental conditions
- Reproduction with mutations for genetic diversity
- Death and decay when conditions are poor

## 🎮 How to Use

### Getting Started
1. Open `index.html` in a modern web browser
2. Select a seed type using the buttons at the top
3. Click anywhere on the canvas to plant a seed
4. Watch your garden grow and evolve over time!

### Controls
- **Seed Selection**: Choose which type of plant to place
- **Environment Controls**:
  - Toggle Rain: Increases soil moisture
  - Toggle Sun: Changes sunlight availability
  - Change Season: Cycle through spring, summer, fall, and winter
  - Clear Garden: Remove all plants
- **Garden Actions**:
  - Export Image: Save your garden as a PNG
  - Save Garden: Store your garden in localStorage
  - Load Garden: Retrieve your previously saved garden
  - Share Garden: Generate a URL that contains your garden data

## 🔧 Technical Implementation

### Technologies Used
- Vanilla JavaScript (ES6+)
- HTML5 Canvas for rendering
- LocalStorage for saving garden state
- URL parameters for sharing gardens

### Key Components
- **Cellular Automata**: Rules that govern plant growth and spread
- **Procedural Generation**: Creates unique plants with variations
- **Resource Simulation**: Models water and sunlight distribution
- **Weather Effects**: Visual and functional rain, clouds, and day/night cycle

### No External Dependencies
The application runs entirely in the browser with no external libraries, frameworks, or backend requirements.

## 📁 Project Structure

```
pixel-garden/
├── index.html           - Main HTML entry point
├── css/
│   └── style.css        - Responsive styling
├── js/
│   ├── main.js          - Application initialization
│   ├── canvas.js        - Garden canvas management
│   ├── plants.js        - Plant classes and growth algorithms
│   ├── environment.js   - Environmental simulation
│   ├── ui.js            - User interface controls
│   ├── storage.js       - Save/load functionality
│   └── utils.js         - Helper functions
└── README.md            - This file
```

## 🧠 Educational Elements

The Pixel Garden Ecosystem visualizes several ecological concepts:
- Plant growth and life cycles
- Resource competition
- Environmental adaptation
- Seasonal effects on ecosystems
- Genetic variation through mutations

## 🚀 Future Improvements

- Add pollinators (pixel bees/butterflies) that create hybrid species
- Implement weather events that affect the garden (storms, drought)
- Create achievements for successful garden milestones
- Allow users to create and share seed types with custom growth rules
- Add day/night cycle affecting plant growth

## 📄 License

This project is released under the MIT License. See the LICENSE file for details.

## 👤 Author

Created by Pratik Acharya

---

Enjoy watching your pixel plants grow! 🌱
