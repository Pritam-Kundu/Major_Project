const fs = require('fs');
const path = require('path');

class ImageAssignmentService {
    constructor() {
        // Cache to store arrays of image filenames for each category to prevent disk I/O on every import
        this.imageCache = {};
        this.baseImagePath = path.join(__dirname, '..', 'public', 'images', 'hotels');
        
        // Define the official categories
        this.categories = [
            'luxury', 'budget', 'business', 'resort', 'villa', 
            'camping', 'homestay', 'hostel', 'beach', 'mountain', 'hotel'
        ];
        
        this.isInitialized = false;
    }

    /**
     * Reads the public/images/hotels directories once and caches the image filenames.
     * This ensures the implementation is highly performant and doesn't scan folders per request.
     */
    initializeCache() {
        if (this.isInitialized) return;
        
        console.log("Initializing Image Assignment Service Cache...");
        
        try {
            if (!fs.existsSync(this.baseImagePath)) {
                console.warn(`[WARNING] Base image path does not exist: ${this.baseImagePath}`);
                return;
            }

            for (const category of this.categories) {
                const categoryPath = path.join(this.baseImagePath, category);
                if (fs.existsSync(categoryPath)) {
                    // Read all files in the directory
                    const files = fs.readdirSync(categoryPath);
                    
                    // Filter out non-image files (only support jpeg, jpg, png, webp)
                    const imageFiles = files.filter(file => {
                        const ext = path.extname(file).toLowerCase();
                        return ['.jpg', '.jpeg', '.png', '.webp'].includes(ext);
                    });
                    
                    this.imageCache[category] = imageFiles;
                    console.log(`[ImageService] Loaded ${imageFiles.length} images for category: ${category}`);
                } else {
                    this.imageCache[category] = [];
                    console.log(`[ImageService] Category folder not found: ${category}`);
                }
            }
            
            this.isInitialized = true;
        } catch (error) {
            console.error("Failed to initialize Image Cache:", error);
        }
    }

    /**
     * Randomly shuffles an array in-place using Fisher-Yates algorithm.
     * @param {Array} array 
     * @returns {Array} Shuffled array
     */
    shuffleArray(array) {
        const arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    /**
     * Intelligently determines the best category for a hotel based on its data.
     * Fallbacks to 'hotel' if no distinct match is found.
     * 
     * @param {Object} hotelData Information about the hotel (title, tags, etc.)
     * @returns {String} The determined category
     */
    determineCategory(hotelData) {
        // Convert title and description to lowercase for easy keyword matching
        const textToAnalyze = `${hotelData.title || ''} ${hotelData.description || ''}`.toLowerCase();
        
        // Define keyword mappings for our specific categories
        const rules = {
            'resort': ['resort', 'spa', 'retreat'],
            'villa': ['villa', 'estate', 'mansion', 'chateau'],
            'luxury': ['luxury', 'grand', 'palace', '5-star', '5 star', 'premium', 'taj', 'oberoi'],
            'beach': ['beach', 'ocean', 'sea', 'coast', 'surf'],
            'mountain': ['mountain', 'hill', 'peak', 'valley', 'ridge', 'alpine'],
            'camping': ['camp', 'tent', 'glamping', 'wilderness', 'outdoor'],
            'homestay': ['homestay', 'home stay', 'guest house', 'guesthouse'],
            'hostel': ['hostel', 'backpacker', 'dorm'],
            'budget': ['budget', 'cheap', 'economy', 'affordable'],
            'business': ['business', 'corporate', 'exec', 'airport']
        };

        // First pass: Check if the exact category name exists in the OSM tags (if available)
        if (hotelData.osmTags && typeof hotelData.osmTags === 'object') {
            const tags = JSON.stringify(hotelData.osmTags).toLowerCase();
            for (const [category, keywords] of Object.entries(rules)) {
                if (keywords.some(kw => tags.includes(kw))) {
                    return category;
                }
            }
        }

        // Second pass: Analyze the title and description for keywords
        for (const [category, keywords] of Object.entries(rules)) {
            if (keywords.some(kw => textToAnalyze.includes(kw))) {
                return category;
            }
        }

        // Fallback to generic 'hotel'
        return 'hotel';
    }

    /**
     * Assigns 1 Cover Image and 6-10 Gallery Images for a specific category.
     * Ensures NO duplicate images within the same gallery.
     * 
     * @param {String} category The category to draw images from
     * @returns {Object} { coverImage: {url, filename}, galleryImages: [{url, filename}] }
     */
    assignImagesToHotel(category) {
        // Ensure cache is populated
        if (!this.isInitialized) {
            this.initializeCache();
        }

        // Validate if category exists in cache, fallback to 'hotel' if missing
        let activeCategory = category;
        if (!this.imageCache[activeCategory] || this.imageCache[activeCategory].length === 0) {
            console.warn(`[ImageService] No images found for ${activeCategory}, falling back to 'hotel'`);
            activeCategory = 'hotel';
        }

        const availableImages = this.imageCache[activeCategory] || [];
        
        // If there are no local images AT ALL, return a hardcoded placeholder to prevent breaking the app
        if (availableImages.length === 0) {
            console.error(`[ImageService] CRITICAL: No images available even in fallback folder.`);
            return {
                coverImage: { url: "/images/hotels/default_placeholder.jpg", filename: "fallback" },
                galleryImages: []
            };
        }

        // Shuffle the available images to ensure randomness
        const shuffledImages = this.shuffleArray(availableImages);
        
        // 1. Pick the Cover Image (First element of shuffled array)
        const coverFilename = shuffledImages[0];
        const coverImage = {
            url: `/images/hotels/${activeCategory}/${coverFilename}`,
            filename: coverFilename
        };

        // 2. Pick Gallery Images (Next 6 to 10 images)
        // Ensure we don't request more images than what's available
        const numGalleryImages = Math.floor(Math.random() * (10 - 6 + 1)) + 6; // Random number between 6 and 10
        const maxAvailableForGallery = Math.min(numGalleryImages, shuffledImages.length - 1);
        
        const galleryImages = [];
        // Start from index 1 because index 0 is used for cover
        for (let i = 1; i <= maxAvailableForGallery; i++) {
            const gFilename = shuffledImages[i];
            galleryImages.push({
                url: `/images/hotels/${activeCategory}/${gFilename}`,
                filename: gFilename
            });
        }

        // Note: Because we shuffle the array once and slice it (by iterating from 0 to N), 
        // it is impossible for the same image to appear twice in the same hotel gallery. 
        // This guarantees duplicate image prevention within a single hotel.

        return { coverImage, galleryImages };
    }
}

// Export a single instance to share the cache across the entire application (Singleton Pattern)
const imageAssignmentService = new ImageAssignmentService();
module.exports = imageAssignmentService;
