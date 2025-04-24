/**
 * GardenCanvas class for the Pixel Garden Ecosystem
 * Handles the main canvas rendering and plant grid
 */

class GardenCanvas {
    constructor(canvasId, gridSize = 50, cellSize = 10) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.gridSize = gridSize;
        this.cellSize = cellSize;
        this.selectedSeedType = 'flower';
        this.showGrid = false;
        this.showTooltip = true;
        this.tooltip = document.getElementById('tooltip');
        
        // Initialize canvas dimensions
        this.resizeCanvas();
        
        // Create the grid to store plants
        this.grid = Array(this.gridSize).fill().map(() => 
            Array(this.gridSize).fill(null)
        );
        
        // Initialize environment
        this.environment = new Environment(this);
        
        // Set up event listeners
        this.setupEventListeners();
    }
    
    resizeCanvas() {
        // Make the canvas size responsive
        const containerWidth = this.canvas.parentElement.clientWidth;
        this.canvas.width = Math.min(containerWidth, this.gridSize * this.cellSize);
        this.canvas.height = this.canvas.width; // Keep it square
        
        // Adjust cell size if needed
        this.cellSize = this.canvas.width / this.gridSize;
    }
    
    setupEventListeners() {
        // Handle clicks to plant seeds
        this.canvas.addEventListener('click', (e) => {
            const pos = this.getGridPosFromEvent(e);
            if (pos) {
                this.plantSeed(pos.x, pos.y);
            }
        });
        
        // Handle hover for tooltips
        this.canvas.addEventListener('mousemove', (e) => {
            if (!this.showTooltip) return;
            
            const pos = this.getGridPosFromEvent(e);
            if (pos) {
                const plant = this.grid[pos.y][pos.x];
                if (plant) {
                    this.showPlantTooltip(plant, e.clientX, e.clientY);
                } else {
                    this.hideTooltip();
                }
            } else {
                this.hideTooltip();
            }
        });
        
        // Hide tooltip when mouse leaves canvas
        this.canvas.addEventListener('mouseleave', () => {
            this.hideTooltip();
        });
        
        // Handle window resize
        window.addEventListener('resize', throttle(() => {
            this.resizeCanvas();
        }, 250));
    }
    
    getGridPosFromEvent(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        const x = Math.floor((e.clientX - rect.left) * scaleX / this.cellSize);
        const y = Math.floor((e.clientY - rect.top) * scaleY / this.cellSize);
        
        if (x >= 0 && x < this.gridSize && y >= 0 && y < this.gridSize) {
            return { x, y };
        }
        
        return null;
    }
    
    plantSeed(x, y) {
        if (this.grid[y][x] === null) {
            this.grid[y][x] = new Plant(this.selectedSeedType, x, y);
            return true;
        }
        return false;
    }
    
    showPlantTooltip(plant, mouseX, mouseY) {
        const info = plant.getTooltipInfo();
        
        // Create tooltip content
        let content = `<strong>${info.type}</strong><br>`;
        content += `Stage: ${info.stage}<br>`;
        content += `Age: ${info.age}<br>`;
        content += `Health: ${info.health}<br>`;
        content += `Water: ${info.water}<br>`;
        content += `Sunlight: ${info.sunlight}<br>`;
        if (info.generation > 0) {
            content += `Generation: ${info.generation}`;
        }
        
        this.tooltip.innerHTML = content;
        this.tooltip.style.display = 'block';
        
        // Position tooltip near mouse but keep it on screen
        const tooltipRect = this.tooltip.getBoundingClientRect();
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        
        let left = mouseX + 15;
        let top = mouseY + 15;
        
        // Adjust if tooltip would go off screen
        if (left + tooltipRect.width > windowWidth) {
            left = mouseX - tooltipRect.width - 10;
        }
        
        if (top + tooltipRect.height > windowHeight) {
            top = mouseY - tooltipRect.height - 10;
        }
        
        this.tooltip.style.left = `${left}px`;
        this.tooltip.style.top = `${top}px`;
    }
    
    hideTooltip() {
        this.tooltip.style.display = 'none';
    }
    
    update() {
        // Update environment first
        this.environment.update();
        
        // Update all plants
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                if (this.grid[y][x] !== null) {
                    this.grid[y][x].update(this.environment, this.grid, x, y);
                    
                    // Update plant resources from environment
                    this.updatePlantResources(x, y);
                    
                    // Remove dead plants that have been dead for a while
                    this.cleanDeadPlants(x, y);
                }
            }
        }
    }
    
    updatePlantResources(x, y) {
        const plant = this.grid[y][x];
        if (plant && plant.isAlive) {
            // Plants get water from soil moisture
            plant.water = Math.min(100, plant.water + this.environment.moisture[y][x] * 0.05);
            
            // Plants get sunlight from environment
            plant.sunlight = Math.min(100, this.environment.sunlight[y][x]);
        }
    }
    
    cleanDeadPlants(x, y) {
        const plant = this.grid[y][x];
        if (plant && !plant.isAlive && plant.age > plant.age + 200) {
            this.grid[y][x] = null;
        }
    }
    
    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Render sky and environment effects
        this.environment.render(this.ctx);
        
        // Render soil with moisture levels
        this.renderSoil();
        
        // Render grid lines if enabled
        if (this.showGrid) {
            this.renderGrid();
        }
        
        // Render plants
        this.renderPlants();
    }
    
    renderSoil() {
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                const soilColor = this.environment.getMoistureColor(x, y);
                this.ctx.fillStyle = soilColor;
                this.ctx.fillRect(
                    x * this.cellSize, 
                    y * this.cellSize, 
                    this.cellSize, 
                    this.cellSize
                );
            }
        }
    }
    
    renderGrid() {
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
        this.ctx.lineWidth = 0.5;
        
        // Draw vertical lines
        for (let x = 0; x <= this.gridSize; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * this.cellSize, 0);
            this.ctx.lineTo(x * this.cellSize, this.canvas.height);
            this.ctx.stroke();
        }
        
        // Draw horizontal lines
        for (let y = 0; y <= this.gridSize; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * this.cellSize);
            this.ctx.lineTo(this.canvas.width, y * this.cellSize);
            this.ctx.stroke();
        }
    }
    
    renderPlants() {
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                if (this.grid[y][x] !== null) {
                    this.grid[y][x].render(this.ctx, this.cellSize);
                }
            }
        }
    }
    
    setSelectedSeedType(type) {
        this.selectedSeedType = type;
    }
    
    toggleGrid() {
        this.showGrid = !this.showGrid;
    }
    
    toggleTooltip() {
        this.showTooltip = !this.showTooltip;
    }
    
    clearGarden() {
        this.grid = Array(this.gridSize).fill().map(() => 
            Array(this.gridSize).fill(null)
        );
    }
    
    exportAsImage() {
        return this.canvas.toDataURL();
    }
    
    getPlantCount() {
        let count = 0;
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                if (this.grid[y][x] !== null && this.grid[y][x].isAlive) {
                    count++;
                }
            }
        }
        return count;
    }
    
    getPlantData() {
        const plantData = [];
        
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                if (this.grid[y][x] !== null) {
                    const plant = this.grid[y][x];
                    plantData.push({
                        type: plant.type,
                        x: plant.x,
                        y: plant.y,
                        age: plant.age,
                        stage: plant.stage,
                        health: plant.health,
                        isAlive: plant.isAlive,
                        generation: plant.generation,
                        mutations: plant.mutations
                    });
                }
            }
        }
        
        return plantData;
    }
    
    loadPlantData(plantData) {
        // Clear current garden
        this.clearGarden();
        
        // Load plants from data
        for (const data of plantData) {
            this.grid[data.y][data.x] = new Plant(
                data.type, 
                data.x, 
                data.y, 
                data.generation,
                data.mutations
            );
            
            const plant = this.grid[data.y][data.x];
            plant.age = data.age;
            plant.stage = data.stage;
            plant.health = data.health;
            plant.isAlive = data.isAlive;
        }
    }
}
