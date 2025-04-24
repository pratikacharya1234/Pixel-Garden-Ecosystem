/**
 * Plant classes and growth algorithms for the Pixel Garden Ecosystem
 */

class Plant {
    constructor(type, x, y, generation = 0, mutations = {}) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.age = 0;
        this.health = 100;
        this.stage = 'seed';
        this.generation = generation;
        this.water = 50;
        this.sunlight = 50;
        this.isAlive = true;
        this.lastReproduced = 0;
        
        // Apply any mutations or generate new properties
        this.mutations = mutations || {};
        this.color = this.generateColor();
        this.growthRate = this.mutations.growthRate || random(0.8, 1.2);
        this.waterNeed = this.mutations.waterNeed || getPlantTypeProperty(type, 'waterNeed');
        this.sunlightNeed = this.mutations.sunlightNeed || getPlantTypeProperty(type, 'sunlightNeed');
    }
    
    generateColor() {
        // Generate a color scheme based on plant type and mutations
        const baseColors = getPlantTypeProperty(this.type, 'colors');
        
        // Apply color mutations if they exist
        if (this.mutations.colorShift) {
            return this.applyColorMutation(baseColors);
        }
        
        return baseColors;
    }
    
    applyColorMutation(baseColors) {
        const mutatedColors = {};
        for (const key in baseColors) {
            if (typeof baseColors[key] === 'string' && baseColors[key].startsWith('hsl')) {
                // Extract HSL values
                const hslMatch = baseColors[key].match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
                if (hslMatch) {
                    const [_, h, s, l] = hslMatch.map(Number);
                    // Apply mutation
                    const hueShift = this.mutations.colorShift * 30; // Up to 30 degrees shift
                    mutatedColors[key] = `hsl(${(h + hueShift) % 360}, ${s}%, ${l}%)`;
                } else {
                    mutatedColors[key] = baseColors[key];
                }
            } else {
                mutatedColors[key] = baseColors[key];
            }
        }
        return mutatedColors;
    }
    
    update(environment, grid, x, y) {
        if (!this.isAlive) return;
        
        this.age++;
        this.updateStage();
        this.updateResources(environment);
        this.updateHealth();
        
        // Growth and reproduction
        if (this.canGrow()) {
            this.grow(environment, grid, x, y);
        }
    }
    
    updateStage() {
        const stageThresholds = getPlantTypeProperty(this.type, 'stageThresholds');
        
        for (const [stage, threshold] of Object.entries(stageThresholds)) {
            if (this.age <= threshold * this.growthRate) {
                this.stage = stage;
                return;
            }
        }
        
        // If we've passed all thresholds, set to the last stage
        this.stage = Object.keys(stageThresholds).pop();
    }
    
    updateResources(environment) {
        // Update water based on environment
        if (environment.rain) {
            this.water = Math.min(100, this.water + 2);
        } else {
            this.water = Math.max(0, this.water - 0.5 * getSeasonModifier(environment.season, 'evaporation'));
        }
        
        // Update sunlight based on environment
        if (environment.sunshine) {
            this.sunlight = Math.min(100, this.sunlight + 2 * getSeasonModifier(environment.season, 'sunlight'));
        } else {
            this.sunlight = Math.max(0, this.sunlight - 1);
        }
    }
    
    updateHealth() {
        // Calculate health based on resources vs needs
        const waterFactor = Math.min(this.water / this.waterNeed, 2);
        const sunlightFactor = Math.min(this.sunlight / this.sunlightNeed, 2);
        
        // Optimal is 1.0, too little or too much reduces health
        const waterHealth = 100 - Math.abs(waterFactor - 1) * 50;
        const sunlightHealth = 100 - Math.abs(sunlightFactor - 1) * 50;
        
        // Overall health is the average
        const targetHealth = (waterHealth + sunlightHealth) / 2;
        
        // Health changes gradually
        this.health += (targetHealth - this.health) * 0.1;
        
        // Check if plant dies
        if (this.health < 10) {
            this.isAlive = false;
        }
    }
    
    canGrow() {
        return this.isAlive && this.health > 30;
    }
    
    grow(environment, grid, x, y) {
        // Try to reproduce if mature
        if (this.stage === 'mature' && 
            this.age - this.lastReproduced > 100 && 
            Math.random() < 0.05 * (this.health / 100)) {
            
            this.tryReproduce(grid, x, y);
        }
    }
    
    tryReproduce(grid, x, y) {
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, 1], [-1, 1], [1, -1]];
        const shuffledDirs = directions.sort(() => Math.random() - 0.5);
        
        for (const [dx, dy] of shuffledDirs) {
            const newX = x + dx;
            const newY = y + dy;
            
            if (isValidGridPos(grid, newX, newY) && grid[newY][newX] === null) {
                // Create slightly mutated offspring
                const mutations = this.generateMutations();
                grid[newY][newX] = new Plant(this.type, newX, newY, this.generation + 1, mutations);
                this.lastReproduced = this.age;
                return true;
            }
        }
        
        return false;
    }
    
    generateMutations() {
        const mutations = {...this.mutations};
        
        // 20% chance to mutate growth rate
        if (Math.random() < 0.2) {
            mutations.growthRate = this.growthRate * random(0.9, 1.1);
        }
        
        // 20% chance to mutate water need
        if (Math.random() < 0.2) {
            mutations.waterNeed = this.waterNeed * random(0.9, 1.1);
        }
        
        // 20% chance to mutate sunlight need
        if (Math.random() < 0.2) {
            mutations.sunlightNeed = this.sunlightNeed * random(0.9, 1.1);
        }
        
        // 20% chance to mutate color
        if (Math.random() < 0.2) {
            mutations.colorShift = (this.mutations.colorShift || 0) + random(-0.5, 0.5);
        }
        
        return mutations;
    }
    
    render(ctx, cellSize) {
        if (!this.isAlive) {
            this.renderDeadPlant(ctx, cellSize);
            return;
        }
        
        // Determine rendering based on plant type and stage
        const renderMethod = getPlantTypeProperty(this.type, 'renderMethod');
        if (renderMethod && typeof this[renderMethod] === 'function') {
            this[renderMethod](ctx, cellSize);
        } else {
            this.renderGenericPlant(ctx, cellSize);
        }
    }
    
    renderFlower(ctx, cellSize) {
        const x = this.x * cellSize;
        const y = this.y * cellSize;
        const colors = this.color;
        const healthFactor = this.health / 100;
        
        if (this.stage === 'seed') {
            // Render seed
            ctx.fillStyle = colors.seed || '#795548';
            ctx.beginPath();
            ctx.arc(x + cellSize/2, y + cellSize/2, cellSize/4, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.stage === 'sprout') {
            // Render sprout
            ctx.fillStyle = colors.stem;
            ctx.fillRect(x + cellSize/2 - cellSize/8, y + cellSize/2, cellSize/4, cellSize/2);
            
            // Small leaf
            ctx.fillStyle = colors.leaf || '#81C784';
            ctx.beginPath();
            ctx.ellipse(x + cellSize/2, y + cellSize/2, cellSize/4, cellSize/6, 0, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Stem
            ctx.fillStyle = colors.stem;
            ctx.fillRect(x + cellSize/2 - cellSize/8, y, cellSize/4, cellSize * 0.8);
            
            // Bloom
            if (this.stage === 'growing' || this.stage === 'mature') {
                const bloomSize = this.stage === 'mature' ? cellSize/2 : cellSize/3;
                ctx.fillStyle = colors.bloom;
                ctx.beginPath();
                ctx.arc(x + cellSize/2, y + cellSize/3, bloomSize * healthFactor, 0, Math.PI * 2);
                ctx.fill();
                
                // Center of flower
                ctx.fillStyle = colors.center || '#FDD835';
                ctx.beginPath();
                ctx.arc(x + cellSize/2, y + cellSize/3, bloomSize/3 * healthFactor, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
    
    renderTree(ctx, cellSize) {
        const x = this.x * cellSize;
        const y = this.y * cellSize;
        const colors = this.color;
        const healthFactor = this.health / 100;
        
        if (this.stage === 'seed') {
            // Render seed
            ctx.fillStyle = colors.seed || '#5D4037';
            ctx.beginPath();
            ctx.arc(x + cellSize/2, y + cellSize/2, cellSize/4, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.stage === 'sprout') {
            // Render sprout
            ctx.fillStyle = colors.trunk;
            ctx.fillRect(x + cellSize/2 - cellSize/6, y + cellSize/3, cellSize/3, cellSize/2);
            
            // Small leaves
            ctx.fillStyle = colors.leaves;
            ctx.beginPath();
            ctx.arc(x + cellSize/2, y + cellSize/3, cellSize/3, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.stage === 'growing') {
            // Trunk
            ctx.fillStyle = colors.trunk;
            ctx.fillRect(x + cellSize/2 - cellSize/5, y + cellSize/4, cellSize/2.5, cellSize * 0.75);
            
            // Foliage
            ctx.fillStyle = colors.leaves;
            ctx.beginPath();
            ctx.arc(x + cellSize/2, y + cellSize/4, cellSize/2 * healthFactor, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.stage === 'mature') {
            // Trunk
            ctx.fillStyle = colors.trunk;
            ctx.fillRect(x + cellSize/2 - cellSize/4, y + cellSize/4, cellSize/2, cellSize * 0.75);
            
            // Foliage
            ctx.fillStyle = colors.leaves;
            ctx.beginPath();
            ctx.arc(x + cellSize/2, y, cellSize/1.5 * healthFactor, 0, Math.PI * 2);
            ctx.fill();
            
            // Second foliage layer
            ctx.beginPath();
            ctx.arc(x + cellSize/2, y + cellSize/4, cellSize/1.8 * healthFactor, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    renderGrass(ctx, cellSize) {
        const x = this.x * cellSize;
        const y = this.y * cellSize;
        const colors = this.color;
        const healthFactor = this.health / 100;
        
        if (this.stage === 'seed') {
            // Render seed
            ctx.fillStyle = colors.seed || '#FFF59D';
            ctx.beginPath();
            ctx.arc(x + cellSize/2, y + cellSize/2, cellSize/5, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Determine blade height based on stage
            let height;
            if (this.stage === 'sprout') height = cellSize * 0.4;
            else if (this.stage === 'growing') height = cellSize * 0.7;
            else height = cellSize * 0.9;
            
            // Render grass blades
            ctx.fillStyle = colors.blade;
            
            // First blade
            ctx.beginPath();
            ctx.moveTo(x + cellSize * 0.3, y + cellSize);
            ctx.quadraticCurveTo(
                x + cellSize * 0.2, y + cellSize - height/2,
                x + cellSize * 0.1, y + cellSize - height
            );
            ctx.lineTo(x + cellSize * 0.2, y + cellSize - height + cellSize/10);
            ctx.quadraticCurveTo(
                x + cellSize * 0.3, y + cellSize - height/2,
                x + cellSize * 0.4, y + cellSize
            );
            ctx.fill();
            
            // Middle blade
            ctx.beginPath();
            ctx.moveTo(x + cellSize * 0.5, y + cellSize);
            ctx.quadraticCurveTo(
                x + cellSize * 0.5, y + cellSize - height/1.5,
                x + cellSize * 0.5, y + cellSize - height
            );
            ctx.lineTo(x + cellSize * 0.6, y + cellSize - height + cellSize/10);
            ctx.quadraticCurveTo(
                x + cellSize * 0.6, y + cellSize - height/1.5,
                x + cellSize * 0.6, y + cellSize
            );
            ctx.fill();
            
            // Third blade
            ctx.beginPath();
            ctx.moveTo(x + cellSize * 0.7, y + cellSize);
            ctx.quadraticCurveTo(
                x + cellSize * 0.8, y + cellSize - height/2,
                x + cellSize * 0.9, y + cellSize - height
            );
            ctx.lineTo(x + cellSize * 0.8, y + cellSize - height + cellSize/10);
            ctx.quadraticCurveTo(
                x + cellSize * 0.7, y + cellSize - height/2,
                x + cellSize * 0.6, y + cellSize
            );
            ctx.fill();
        }
    }
    
    renderMushroom(ctx, cellSize) {
        const x = this.x * cellSize;
        const y = this.y * cellSize;
        const colors = this.color;
        const healthFactor = this.health / 100;
        
        if (this.stage === 'seed') {
            // Render spore
            ctx.fillStyle = colors.spore || '#F5F5F5';
            ctx.beginPath();
            ctx.arc(x + cellSize/2, y + cellSize/2, cellSize/5, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.stage === 'sprout') {
            // Render small mushroom
            ctx.fillStyle = colors.stem;
            ctx.fillRect(x + cellSize/2 - cellSize/8, y + cellSize/2, cellSize/4, cellSize/2);
            
            // Small cap
            ctx.fillStyle = colors.cap;
            ctx.beginPath();
            ctx.arc(x + cellSize/2, y + cellSize/2, cellSize/3 * healthFactor, 0, Math.PI, true);
            ctx.fill();
        } else {
            // Stem
            ctx.fillStyle = colors.stem;
            ctx.fillRect(x + cellSize/2 - cellSize/5, y + cellSize/3, cellSize/2.5, cellSize * 0.7);
            
            // Cap
            ctx.fillStyle = colors.cap;
            ctx.beginPath();
            
            const capWidth = this.stage === 'mature' ? cellSize * 0.8 : cellSize * 0.6;
            const capHeight = this.stage === 'mature' ? cellSize * 0.4 : cellSize * 0.3;
            
            ctx.ellipse(
                x + cellSize/2, 
                y + cellSize/3, 
                capWidth/2 * healthFactor, 
                capHeight * healthFactor, 
                0, 0, Math.PI, true
            );
            ctx.fill();
            
            // Spots
            if (this.stage === 'mature' && colors.spots) {
                ctx.fillStyle = colors.spots;
                for (let i = 0; i < 5; i++) {
                    const spotX = x + cellSize/2 + random(-capWidth/3, capWidth/3);
                    const spotY = y + cellSize/3 + random(-capHeight/2, 0);
                    const spotSize = random(cellSize/10, cellSize/6) * healthFactor;
                    
                    ctx.beginPath();
                    ctx.arc(spotX, spotY, spotSize, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }
    }
    
    renderGenericPlant(ctx, cellSize) {
        const x = this.x * cellSize;
        const y = this.y * cellSize;
        
        // Just render a colored square based on health
        ctx.fillStyle = `hsl(120, 80%, ${this.health/2}%)`;
        ctx.fillRect(x, y, cellSize, cellSize);
    }
    
    renderDeadPlant(ctx, cellSize) {
        const x = this.x * cellSize;
        const y = this.y * cellSize;
        
        // Render a withered, brown version of the plant
        ctx.fillStyle = '#8D6E63';
        ctx.globalAlpha = 0.6;
        
        if (this.type === 'grass') {
            // Simple withered grass
            ctx.fillRect(x + cellSize * 0.3, y + cellSize * 0.5, cellSize * 0.4, cellSize * 0.5);
        } else if (this.type === 'flower' || this.type === 'tree') {
            // Withered stem
            ctx.fillRect(x + cellSize/2 - cellSize/8, y + cellSize/2, cellSize/4, cellSize/2);
        } else if (this.type === 'mushroom') {
            // Collapsed mushroom
            ctx.beginPath();
            ctx.ellipse(x + cellSize/2, y + cellSize * 0.7, cellSize/2, cellSize/5, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.globalAlpha = 1.0;
    }
    
    getTooltipInfo() {
        return {
            type: this.type.charAt(0).toUpperCase() + this.type.slice(1),
            age: this.age,
            stage: this.stage.charAt(0).toUpperCase() + this.stage.slice(1),
            health: Math.round(this.health) + '%',
            water: Math.round(this.water) + '%',
            sunlight: Math.round(this.sunlight) + '%',
            generation: this.generation
        };
    }
}

// Helper functions and plant type definitions

function getPlantTypeProperty(type, property) {
    const plantTypes = {
        flower: {
            colors: {
                seed: '#795548',
                stem: '#2E7D32',
                leaf: '#81C784',
                bloom: randomColor(0, 360, 80, 60),
                center: '#FDD835'
            },
            stageThresholds: {
                seed: 15,
                sprout: 40,
                growing: 100,
                mature: Infinity
            },
            waterNeed: 60,
            sunlightNeed: 70,
            renderMethod: 'renderFlower'
        },
        tree: {
            colors: {
                seed: '#5D4037',
                trunk: '#5D4037',
                leaves: randomColor(80, 140, 70, 40)
            },
            stageThresholds: {
                seed: 20,
                sprout: 60,
                growing: 150,
                mature: Infinity
            },
            waterNeed: 50,
            sunlightNeed: 60,
            renderMethod: 'renderTree'
        },
        grass: {
            colors: {
                seed: '#FFF59D',
                blade: randomColor(60, 140, 70, 50)
            },
            stageThresholds: {
                seed: 10,
                sprout: 25,
                growing: 60,
                mature: Infinity
            },
            waterNeed: 40,
            sunlightNeed: 80,
            renderMethod: 'renderGrass'
        },
        mushroom: {
            colors: {
                spore: '#F5F5F5',
                stem: '#ECEFF1',
                cap: randomColor(0, 40, 80, 50),
                spots: '#FFFFFF'
            },
            stageThresholds: {
                seed: 12,
                sprout: 30,
                growing: 70,
                mature: Infinity
            },
            waterNeed: 80,
            sunlightNeed: 30,
            renderMethod: 'renderMushroom'
        }
    };
    
    return plantTypes[type]?.[property] || null;
}

function getSeasonModifier(season, property) {
    const seasonModifiers = {
        spring: {
            evaporation: 1.0,
            sunlight: 1.0
        },
        summer: {
            evaporation: 1.5,
            sunlight: 1.3
        },
        fall: {
            evaporation: 0.8,
            sunlight: 0.7
        },
        winter: {
            evaporation: 0.5,
            sunlight: 0.5
        }
    };
    
    return seasonModifiers[season]?.[property] || 1.0;
}

function isValidGridPos(grid, x, y) {
    return x >= 0 && x < grid[0].length && y >= 0 && y < grid.length;
}
