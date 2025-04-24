/**
 * Environment class for the Pixel Garden Ecosystem
 * Handles weather, seasons, and environmental conditions
 */

class Environment {
    constructor(garden) {
        this.garden = garden;
        this.rain = false;
        this.sunshine = true;
        this.season = 'spring';
        this.raindrops = [];
        this.clouds = [];
        this.dayNightCycle = 0; // 0-100, 0 = dawn, 50 = noon, 100 = dusk
        this.dayNightDirection = 1; // 1 = moving toward noon, -1 = moving toward dusk/dawn
        this.cycleSpeed = 0.2;
        this.seasonDay = 0;
        this.seasonLength = 1000; // frames until season change
        
        // Keep track of resource distribution
        this.moisture = Array(garden.gridSize).fill().map(() => 
            Array(garden.gridSize).fill(50)
        );
        
        this.sunlight = Array(garden.gridSize).fill().map(() => 
            Array(garden.gridSize).fill(70)
        );
        
        this.initClouds();
    }
    
    initClouds() {
        // Generate some initial clouds
        const cloudCount = randomInt(2, 5);
        for (let i = 0; i < cloudCount; i++) {
            this.clouds.push({
                x: randomInt(0, this.garden.canvas.width),
                y: randomInt(0, this.garden.canvas.height / 3),
                width: randomInt(100, 200),
                height: randomInt(30, 60),
                speed: random(0.1, 0.3),
                opacity: random(0.3, 0.7)
            });
        }
    }
    
    toggleRain() {
        this.rain = !this.rain;
        if (this.rain) {
            this.generateRaindrops();
        } else {
            this.raindrops = [];
        }
    }
    
    toggleSunshine() {
        this.sunshine = !this.sunshine;
    }
    
    changeSeason() {
        const seasons = ['spring', 'summer', 'fall', 'winter'];
        const currentIndex = seasons.indexOf(this.season);
        this.season = seasons[(currentIndex + 1) % seasons.length];
        this.seasonDay = 0;
    }
    
    generateRaindrops() {
        // Create initial raindrops when rain starts
        for (let i = 0; i < 50; i++) {
            this.addRaindrop();
        }
    }
    
    addRaindrop() {
        this.raindrops.push({
            x: randomInt(0, this.garden.canvas.width),
            y: randomInt(-50, 0),
            speed: random(5, 15),
            length: random(5, 15)
        });
    }
    
    updateRain() {
        // Update existing raindrops
        for (let i = this.raindrops.length - 1; i >= 0; i--) {
            const drop = this.raindrops[i];
            drop.y += drop.speed;
            
            // Remove raindrops that have fallen off the canvas
            if (drop.y > this.garden.canvas.height) {
                this.raindrops.splice(i, 1);
                
                // Add moisture where raindrop lands
                const gridX = Math.floor(drop.x / this.garden.cellSize);
                const gridY = this.garden.gridSize - 1;
                
                if (gridX >= 0 && gridX < this.garden.gridSize) {
                    this.increaseMoisture(gridX, gridY);
                }
                
                // Add a new raindrop at the top if still raining
                if (this.rain) {
                    this.addRaindrop();
                }
            }
        }
    }
    
    updateClouds() {
        // Move clouds across the sky
        for (const cloud of this.clouds) {
            cloud.x += cloud.speed;
            
            // Wrap clouds around the canvas
            if (cloud.x > this.garden.canvas.width + cloud.width/2) {
                cloud.x = -cloud.width/2;
                cloud.y = randomInt(0, this.garden.canvas.height / 3);
                cloud.width = randomInt(100, 200);
                cloud.height = randomInt(30, 60);
                cloud.opacity = random(0.3, 0.7);
            }
        }
        
        // Randomly add or remove clouds
        if (Math.random() < 0.002 && this.clouds.length < 6) {
            this.clouds.push({
                x: -200,
                y: randomInt(0, this.garden.canvas.height / 3),
                width: randomInt(100, 200),
                height: randomInt(30, 60),
                speed: random(0.1, 0.3),
                opacity: random(0.3, 0.7)
            });
        } else if (Math.random() < 0.001 && this.clouds.length > 2) {
            this.clouds.pop();
        }
    }
    
    updateDayNightCycle() {
        // Update the day/night cycle
        this.dayNightCycle += this.cycleSpeed * this.dayNightDirection;
        
        // Change direction when reaching dawn or dusk
        if (this.dayNightCycle >= 100) {
            this.dayNightDirection = -1;
        } else if (this.dayNightCycle <= 0) {
            this.dayNightDirection = 1;
        }
        
        // Update sunlight based on day/night cycle
        const sunlightIntensity = this.getSunlightIntensity();
        
        for (let y = 0; y < this.garden.gridSize; y++) {
            for (let x = 0; x < this.garden.gridSize; x++) {
                // Base value affected by day/night and season
                this.sunlight[y][x] = sunlightIntensity * getSeasonModifier(this.season, 'sunlight');
                
                // Shadows from plants (trees cast more shadows)
                this.applyShadows(x, y);
            }
        }
    }
    
    getSunlightIntensity() {
        // Calculate sunlight intensity based on day/night cycle
        // Peak at 50 (noon), lowest at 0 or 100 (dawn/dusk)
        const normalizedTime = this.dayNightCycle <= 50 
            ? this.dayNightCycle / 50 
            : (100 - this.dayNightCycle) / 50;
        
        return 50 + normalizedTime * 50;
    }
    
    applyShadows(x, y) {
        // Trees and taller plants cast shadows based on the sun position
        // This is a simplified version - real shadows would be more complex
        const sunDirection = this.dayNightCycle <= 50 ? -1 : 1; // sun moves from east to west
        
        // Check for plants above that might cast shadows
        for (let shadowY = 0; shadowY < y; shadowY++) {
            const offset = Math.floor((y - shadowY) / 2) * sunDirection;
            const shadowX = x + offset;
            
            if (isValidGridPos(this.garden.grid, shadowX, shadowY) && 
                this.garden.grid[shadowY][shadowX] !== null &&
                this.garden.grid[shadowY][shadowX].type === 'tree' &&
                this.garden.grid[shadowY][shadowX].stage === 'mature') {
                
                this.sunlight[y][x] *= 0.7; // Reduce sunlight in shadow
                break;
            }
        }
    }
    
    increaseMoisture(x, y) {
        if (x >= 0 && x < this.garden.gridSize && y >= 0 && y < this.garden.gridSize) {
            this.moisture[y][x] = Math.min(100, this.moisture[y][x] + 5);
            
            // Moisture spreads to neighbors
            this.spreadMoisture(x, y);
        }
    }
    
    spreadMoisture(x, y) {
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        
        for (const [dx, dy] of directions) {
            const nx = x + dx;
            const ny = y + dy;
            
            if (isValidGridPos(this.moisture, nx, ny)) {
                // Moisture spreads, but decreases with distance
                const spreadAmount = this.moisture[y][x] * 0.2;
                this.moisture[ny][nx] = Math.min(100, this.moisture[ny][nx] + spreadAmount);
            }
        }
    }
    
    update() {
        this.updateRain();
        this.updateClouds();
        this.updateDayNightCycle();
        this.updateSeasons();
        this.updateSoilMoisture();
    }
    
    updateSeasons() {
        this.seasonDay++;
        if (this.seasonDay >= this.seasonLength) {
            this.changeSeason();
        }
    }
    
    updateSoilMoisture() {
        // Natural evaporation based on season
        const evaporationRate = 0.05 * getSeasonModifier(this.season, 'evaporation');
        
        for (let y = 0; y < this.garden.gridSize; y++) {
            for (let x = 0; x < this.garden.gridSize; x++) {
                // Reduce moisture due to evaporation
                this.moisture[y][x] = Math.max(0, this.moisture[y][x] - evaporationRate);
                
                // Plants consume moisture
                if (this.garden.grid[y][x] !== null && this.garden.grid[y][x].isAlive) {
                    const plant = this.garden.grid[y][x];
                    const consumption = plant.waterNeed * 0.01;
                    this.moisture[y][x] = Math.max(0, this.moisture[y][x] - consumption);
                }
            }
        }
    }
    
    render(ctx) {
        this.renderSky(ctx);
        this.renderClouds(ctx);
        if (this.rain) {
            this.renderRain(ctx);
        }
    }
    
    renderSky(ctx) {
        // Create sky gradient based on time of day
        const gradient = ctx.createLinearGradient(0, 0, 0, this.garden.canvas.height / 2);
        
        if (this.dayNightCycle <= 50) { // Dawn to noon
            const progress = this.dayNightCycle / 50;
            gradient.addColorStop(0, this.lerpColor('#1A237E', '#2196F3', progress));
            gradient.addColorStop(1, this.lerpColor('#9575CD', '#BBDEFB', progress));
        } else { // Noon to dusk
            const progress = (this.dayNightCycle - 50) / 50;
            gradient.addColorStop(0, this.lerpColor('#2196F3', '#1A237E', progress));
            gradient.addColorStop(1, this.lerpColor('#BBDEFB', '#9575CD', progress));
        }
        
        // Overlay to darken sky based on season
        switch (this.season) {
            case 'spring':
                // Spring has clearer skies
                break;
            case 'summer':
                // Summer can be a bit hazier
                ctx.fillStyle = 'rgba(255, 255, 100, 0.1)';
                ctx.fillRect(0, 0, this.garden.canvas.width, this.garden.canvas.height / 2);
                break;
            case 'fall':
                // Fall has a warmer tone
                ctx.fillStyle = 'rgba(255, 150, 50, 0.1)';
                ctx.fillRect(0, 0, this.garden.canvas.width, this.garden.canvas.height / 2);
                break;
            case 'winter':
                // Winter is cooler and grayer
                ctx.fillStyle = 'rgba(200, 200, 230, 0.3)';
                ctx.fillRect(0, 0, this.garden.canvas.width, this.garden.canvas.height / 2);
                break;
        }
    }
    
    lerpColor(a, b, amount) {
        const ah = parseInt(a.replace('#', ''), 16);
        const ar = ah >> 16;
        const ag = (ah >> 8) & 0xff;
        const ab = ah & 0xff;
        
        const bh = parseInt(b.replace('#', ''), 16);
        const br = bh >> 16;
        const bg = (bh >> 8) & 0xff;
        const bb = bh & 0xff;
        
        const rr = ar + amount * (br - ar);
        const rg = ag + amount * (bg - ag);
        const rb = ab + amount * (bb - ab);
        
        return `#${((1 << 24) + (Math.round(rr) << 16) + (Math.round(rg) << 8) + Math.round(rb)).toString(16).slice(1)}`;
    }
    
    renderClouds(ctx) {
        for (const cloud of this.clouds) {
            ctx.save();
            ctx.fillStyle = `rgba(255, 255, 255, ${cloud.opacity})`;
            
            // Draw cloud shape
            ctx.beginPath();
            ctx.arc(cloud.x, cloud.y, cloud.height/2, 0, Math.PI * 2);
            ctx.arc(cloud.x + cloud.width * 0.25, cloud.y - cloud.height * 0.1, cloud.height * 0.6, 0, Math.PI * 2);
            ctx.arc(cloud.x + cloud.width * 0.5, cloud.y, cloud.height * 0.7, 0, Math.PI * 2);
            ctx.arc(cloud.x + cloud.width * 0.75, cloud.y - cloud.height * 0.1, cloud.height * 0.6, 0, Math.PI * 2);
            ctx.arc(cloud.x + cloud.width, cloud.y, cloud.height/2, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }
    
    renderRain(ctx) {
        ctx.save();
        ctx.strokeStyle = 'rgba(200, 220, 255, 0.7)';
        ctx.lineWidth = 1;
        
        for (const drop of this.raindrops) {
            ctx.beginPath();
            ctx.moveTo(drop.x, drop.y);
            ctx.lineTo(drop.x, drop.y + drop.length);
            ctx.stroke();
        }
        
        ctx.restore();
    }
    
    getMoistureColor(x, y) {
        const moistureLevel = this.moisture[y][x];
        const lightness = Math.max(20, 60 - moistureLevel * 0.4);
        return `hsl(30, 70%, ${lightness}%)`;
    }
    
    getAverageStats() {
        let totalMoisture = 0;
        let totalSunlight = 0;
        let count = 0;
        
        for (let y = 0; y < this.garden.gridSize; y++) {
            for (let x = 0; x < this.garden.gridSize; x++) {
                totalMoisture += this.moisture[y][x];
                totalSunlight += this.sunlight[y][x];
                count++;
            }
        }
        
        return {
            moisture: Math.round(totalMoisture / count),
            sunlight: Math.round(totalSunlight / count)
        };
    }
}
