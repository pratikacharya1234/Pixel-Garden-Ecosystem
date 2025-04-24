/**
 * Storage manager for the Pixel Garden Ecosystem
 * Handles saving and loading garden data using localStorage and URL parameters
 */

class StorageManager {
    static STORAGE_KEY = 'pixelGardenData';
    
    /**
     * Save the current garden state to localStorage
     * @param {GardenCanvas} garden - The garden to save
     */
    static saveGarden(garden) {
        const saveData = {
            plants: garden.getPlantData(),
            environment: {
                rain: garden.environment.rain,
                sunshine: garden.environment.sunshine,
                season: garden.environment.season
            },
            timestamp: new Date().toISOString()
        };
        
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(saveData));
        return true;
    }
    
    /**
     * Load garden state from localStorage
     * @param {GardenCanvas} garden - The garden to load data into
     * @returns {boolean} - Whether loading was successful
     */
    static loadGarden(garden) {
        const savedData = localStorage.getItem(this.STORAGE_KEY);
        
        if (!savedData) {
            return false;
        }
        
        try {
            const data = JSON.parse(savedData);
            
            // Load plants
            garden.loadPlantData(data.plants);
            
            // Load environment settings
            if (data.environment) {
                garden.environment.rain = data.environment.rain;
                garden.environment.sunshine = data.environment.sunshine;
                garden.environment.season = data.environment.season;
                
                // Update UI to reflect environment state
                document.getElementById('toggle-rain').classList.toggle('active', data.environment.rain);
                document.getElementById('toggle-sun').classList.toggle('active', data.environment.sunshine);
                document.getElementById('toggle-season').textContent = `Season: ${data.environment.season.charAt(0).toUpperCase() + data.environment.season.slice(1)}`;
            }
            
            return true;
        } catch (error) {
            console.error('Error loading garden data:', error);
            return false;
        }
    }
    
    /**
     * Generate a shareable URL with garden data
     * @param {GardenCanvas} garden - The garden to share
     * @returns {string} - The shareable URL
     */
    static generateShareURL(garden) {
        // Create a compressed representation of the garden
        const plants = garden.getPlantData();
        
        // We'll only include essential data to keep the URL manageable
        const simplifiedPlants = plants.map(plant => ({
            t: plant.type.charAt(0), // First letter of type
            x: plant.x,
            y: plant.y,
            g: plant.generation
        }));
        
        // Create the URL parameters
        const params = {
            p: simplifiedPlants,
            e: garden.environment.season.charAt(0), // First letter of season
            v: 1 // Version for future compatibility
        };
        
        // Generate the URL
        const baseUrl = window.location.href.split('?')[0];
        return `${baseUrl}?garden=${encodeURIComponent(JSON.stringify(params))}`;
    }
    
    /**
     * Load garden from URL parameters
     * @param {GardenCanvas} garden - The garden to load data into
     * @returns {boolean} - Whether loading was successful
     */
    static loadFromURL(garden) {
        const urlParams = new URLSearchParams(window.location.search);
        const gardenParam = urlParams.get('garden');
        
        if (!gardenParam) {
            return false;
        }
        
        try {
            const data = JSON.parse(decodeURIComponent(gardenParam));
            
            // Version check
            if (data.v !== 1) {
                console.warn('Unsupported garden data version');
                return false;
            }
            
            // Convert simplified plant data back to full format
            const plantData = data.p.map(p => {
                // Expand the type from the first letter
                let type;
                switch (p.t) {
                    case 'f': type = 'flower'; break;
                    case 't': type = 'tree'; break;
                    case 'g': type = 'grass'; break;
                    case 'm': type = 'mushroom'; break;
                    default: type = 'flower';
                }
                
                return {
                    type,
                    x: p.x,
                    y: p.y,
                    age: 100, // Default to mature plants
                    stage: 'mature',
                    health: 100,
                    isAlive: true,
                    generation: p.g || 0,
                    mutations: {}
                };
            });
            
            // Load plants
            garden.loadPlantData(plantData);
            
            // Set season if provided
            if (data.e) {
                let season;
                switch (data.e) {
                    case 's': season = data.e === 'u' ? 'summer' : 'spring'; break;
                    case 'f': season = 'fall'; break;
                    case 'w': season = 'winter'; break;
                    default: season = 'spring';
                }
                
                garden.environment.season = season;
                document.getElementById('toggle-season').textContent = `Season: ${season.charAt(0).toUpperCase() + season.slice(1)}`;
            }
            
            return true;
        } catch (error) {
            console.error('Error loading garden from URL:', error);
            return false;
        }
    }
}
