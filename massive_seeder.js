const mongoose = require('mongoose');
const fs = require('fs');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Load Models
require('./models/user');
require('./models/story');
require('./models/dish');
require('./models/category');
require('./models/views');
require('./models/like');
require('./models/comment');
require('./models/menu');

const User = mongoose.model('user');
const Story = mongoose.model('story');
const Dish = mongoose.model('dish');
const Category = mongoose.model('category');
const Like = mongoose.model('like');
const Comment = mongoose.model('comment');
const Menu = mongoose.model('menu');

// --- CONFIGURATION ---
const CONFIG = {
    CHEFS_COUNT: 1000,
    USERS_COUNT: 1000,
    STORIES_COUNT: 10000,
    BATCH_SIZE: 500,
    DEFAULT_PASS: 'password123',
};

// --- DATA BANKS ---

const EGYPT_HUBs = [
    { name: 'Maadi, Cairo', lat: 29.9602, long: 31.2569 },
    { name: 'Zamalek, Cairo', lat: 30.0636, long: 31.2262 },
    { name: 'Nasr City, Cairo', lat: 30.0566, long: 31.3301 },
    { name: 'New Cairo, Cairo', lat: 30.0074, long: 31.4913 },
    { name: '6th of October, Giza', lat: 29.9757, long: 30.9419 },
    { name: 'Sheikh Zayed, Giza', lat: 30.0506, long: 30.9705 },
    { name: 'Glim, Alexandria', lat: 31.2404, long: 29.9647 },
    { name: 'Smouha, Alexandria', lat: 31.2156, long: 29.9553 },
    { name: 'Hurgada', lat: 27.2579, long: 33.8116 },
    { name: 'Dahab', lat: 28.5096, long: 34.5136 },
];

const CUISINES = [
    {
        name: 'Burger & American',
        cats: ['Fast food', 'Burger'],
        keywords: ['burger', 'cheeseburger', 'fries', 'fast food', 'steak'],
        suffixes: ['Burgers', 'Joint', 'Shack', 'Grill', 'House', 'Burger Co.', 'Diner'],
        dishes: ['Double Cheese Smash', 'Truffle Mushroom Burger', 'Spicy Chicken Sandwich', 'Loaded Fries'],
        captions: ["Weekend cravings sorted! 🍔🔥 #burgerlove", "Can you handle the heat? 🌶️"]
    },
    {
        name: 'Italian & Pizza',
        cats: ['Homemade', 'Main Courses', 'Pizza'],
        keywords: ['pasta', 'pizza', 'italian food', 'risotto', 'lasagna'],
        suffixes: ['Kitchen', 'Pizzeria', 'Trattoria', 'Pasta Bar', 'Italiano', 'Oven'],
        dishes: ['Truffle Pasta', 'Margherita Pizza', 'Risotto Funghi', 'Lasagna'],
        captions: ["Fresh pasta made daily by nonna's recipe 🍝🇮🇹", "Wood-fired perfection. 🍕"]
    },
    {
        name: 'Healthy & Fresh',
        cats: ['Homemade', 'Main Courses'],
        keywords: ['salad', 'healthy food', 'salmon', 'avocado', 'smoothie'],
        suffixes: ['Greens', 'Bowl', 'Fresh', 'Salad Bar', 'Juice Co.', 'Eats', 'Healthy Kitchen'],
        dishes: ['Quinoa Salad', 'Grilled Salmon', 'Acai Bowl', 'Green Smoothie'],
        captions: ["Fuel your body right! 💪🥗 #healthyeating", "Colors of nature on a plate. 🌈"]
    },
    {
        name: 'Bakery & Dessert',
        cats: ['Desserts', 'Bakery'],
        keywords: ['cake', 'dessert', 'chocolate', 'pastry', 'croissant', 'donuts'],
        suffixes: ['Bakery', 'Patisserie', 'Sweets', 'Delights', 'Oven', 'Cake Shop'],
        dishes: ['Lotus Cheesecake', 'Chocolate Molten Cake', 'Cinnabon', 'Macarons'],
        captions: ["Life is short, eat dessert first. 🍰", "Chocolate fixes everything. 🍫❤️"]
    }
];

const COMMENT_TEXTS = [
    "Looks amazing! 😋", "Where is this?", "Need to try this ASAP!", "Yummy! 😍",
    "Best food in town!", "Can I order this now?", "Is it spicy?", "Wow looks fresh!",
    "Great presentation!", "Price?", "Love this place ❤️", "Delicious 🤤"
];

const MALE_NAMES = [
    "Ahmed", "Mohamed", "Omar", "Youssef", "Karim", "Moustafa", "Hassan", "Ali", "Mahmoud", "Tarek",
    "Khaled", "Amr", "Sherif", "Hussein", "Ibrahim", "Ziad", "Fares", "Seif", "Hazem", "Wael",
    "Samy", "Ramy", "Maged", "Osama", "Ashraf", "Eslam", "Hamza", "Adham", "Malek", "Yahia"
];

const FEMALE_NAMES = [
    "Sara", "Nour", "Layla", "Hana", "Salma", "Mariam", "Aya", "Fatma", "Yasmine", "Dina",
    "Nada", "Farah", "Heba", "Rana", "Menna", "Sohaila", "Habiba", "Noha", "Esraa", "Maha",
    "Reem", "Malak", "Jana", "Karma", "Lina", "Dalia", "Rokaya", "Engy", "Amira", "Mayar"
];

const LAST_NAMES = [
    "Ali", "Ibrahim", "Hassan", "Mohamed", "Ahmed", "Salah", "Kamel", "Fawzy", "Nabil", "Khalil",
    "Mahmoud", "Youssef", "Abdelrahman", "Mostafa", "Osman", "Salem", "Amer", "Soliman", "Samir", "Farouk",
    "Zaki", "Tawfik", "Radwan", "Badawy", "Elsayed", "Helmy", "Nasser", "Mansour", "Gaber", "Riad"
];

const ADJECTIVES = ["Tasty", "Yummy", "Crispy", "Golden", "Royal", "Urban", "Street", "Home", "Mama's", "The Real"];

const VIDEOS = [
    "https://assets.mixkit.co/videos/preview/mixkit-pouring-coffee-into-a-cup-simmering-coffee-beans-4389-large.mp4",
    "https://assets.mixkit.co/videos/preview/mixkit-top-view-of-a-person-eating-a-taco-4235-large.mp4",
    "https://assets.mixkit.co/videos/preview/mixkit-serving-dinner-to-guests-4648-large.mp4",
    "https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-woman-cutting-a-cake-4268-large.mp4"
];

// --- HELPERS ---

function getRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomLocation(hub) {
    const latOffset = (Math.random() - 0.5) * 0.04;
    const longOffset = (Math.random() - 0.5) * 0.04;
    return {
        lat: hub.lat + latOffset,
        long: hub.long + longOffset,
        description: hub.name
    };
}

function generateImage(keywords) {
    const keyword = keywords[Math.floor(Math.random() * keywords.length)];
    const sig = Math.floor(Math.random() * 1000000);
    return `https://loremflickr.com/600/800/${keyword}?lock=${sig}`;
}

function generatePhone() {
    return `01${Math.floor(Math.random() * 3)}${Math.floor(Math.random() * 100000000)}`;
}

function generateBrandName(firstName, lastName, cuisine) {
    const rand = Math.random();
    const suffix = getRandom(cuisine.suffixes);
    if (rand < 0.3) return `${firstName}'s ${suffix}`;
    else if (rand < 0.6) return `${getRandom(ADJECTIVES)} ${suffix}`;
    else if (rand < 0.8) return `${lastName} ${suffix}`;
    else return `The ${cuisine.name.split(' ')[0]} ${suffix}`;
}

// --- MAIN SEEDER ---

const seed = async () => {
    try {
        console.log("🚀 Connecting to DB...");
        // using hardcoded URI as found in keys.js for reliability in script execution
        await mongoose.connect('mongodb+srv://mohamed2m2018:22233322@cookbook.oogokbq.mongodb.net/foodtok?retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology: true });
        console.log("✅ Connected!");

        let categories = await Category.find({});
        const catMap = {};
        // Store ObjectIds for categories, not strings
        categories.forEach(c => catMap[c.name] = c._id);

        const passwordHash = await bcrypt.hash(CONFIG.DEFAULT_PASS, 10);

        const createdChefs = [];
        const createdUsers = [];
        const createdDishes = [];
        const createdStories = [];
        const credentials = [];

        // 1. GENERATE CHEFS
        console.log(`👨‍🍳 Generating ${CONFIG.CHEFS_COUNT} Chefs...`);
        const chefDocs = [];
        const chefMenuMap = new Map();

        for (let i = 0; i < CONFIG.CHEFS_COUNT; i++) {
            const gender = Math.random() > 0.5 ? 'Male' : 'Female';
            const firstName = getRandom(gender === 'Male' ? MALE_NAMES : FEMALE_NAMES);
            const lastName = getRandom(LAST_NAMES);
            const cuisine = getRandom(CUISINES);
            const hub = getRandom(EGYPT_HUBs);
            const loc = getRandomLocation(hub);

            const brandName = generateBrandName(firstName, lastName, cuisine);

            const chefData = {
                username: `chef_seeded_${i}_${Date.now()}`,
                email: `chef${i}.seeded@test.com`,
                password: passwordHash,
                type: 'chef',
                fullName: brandName,
                locations: [loc],
                phone: generatePhone(),
                avatar: `https://i.pravatar.cc/150?u=chef${i}`,
                bio: `The best ${cuisine.name} in ${hub.name.split(',')[0]}!`,
                tags: cuisine.cats.map(c => catMap[c]).filter(Boolean),
                chefSettings: { country: "Egypt", currency: "EGP", hasBranches: true, isCountryLocked: true },
                date: new Date()
            };
            chefDocs.push(chefData);
            credentials.push({ email: chefData.email, password: CONFIG.DEFAULT_PASS, type: 'chef', name: brandName, location: hub.name });
        }
        const insertedChefs = await User.insertMany(chefDocs);

        // CREATE MENUS FOR CHEFS
        console.log(`📜 Creating Menus for Chefs...`);
        const menuDocs = [];
        for (const chef of insertedChefs) {
            createdChefs.push(chef);
            const menuId = new mongoose.Types.ObjectId();
            menuDocs.push({
                _id: menuId,
                name: "Main Menu",
                chef: chef._id,
                dishes: [],
                sections: [],
                created_at: new Date()
            });
            chefMenuMap.set(chef._id.toString(), menuId);
        }
        await Menu.insertMany(menuDocs);


        // 2. GENERATE DISHES
        console.log(`🍔 Generating Menu Items...`);
        const dishDocs = [];

        insertedChefs.forEach(chef => {
            const matchedCuisine = CUISINES.find(c => chef.fullName.includes(c.name.split(' ')[0])) || getRandom(CUISINES);
            const numDishes = Math.floor(Math.random() * 3) + 3;
            const menuId = chefMenuMap.get(chef._id.toString());

            for (let j = 0; j < numDishes; j++) {
                const dishName = getRandom(matchedCuisine.dishes);
                const dishImg = generateImage(matchedCuisine.keywords);
                // Important: category should be a String according to Dish schema
                const dishCatName = getRandom(matchedCuisine.cats);

                dishDocs.push({
                    user_id: chef._id,
                    name: dishName,
                    id: Math.floor(Math.random() * 10000000),
                    menu: menuId,
                    menu_id: Math.floor(Math.random() * 100000),
                    description: `Delicious ${dishName} made with fresh ingredients.`,
                    price: (Math.floor(Math.random() * 200) + 50),
                    image: dishImg,
                    category: dishCatName, // Needs string here
                    visible: true,
                    created_at: new Date(Date.now() - Math.floor(Math.random() * 60 * 24 * 60 * 60 * 1000))
                });
            }
        });
        const insertedDishes = await Dish.insertMany(dishDocs);
        insertedDishes.forEach(d => createdDishes.push(d));
        console.log(`✅ Inserted ${insertedDishes.length} Dishes.`);

        // 3. GENERATE REGULAR USERS
        console.log(`👥 Generating ${CONFIG.USERS_COUNT} Users...`);
        const userDocs = [];
        for (let i = 0; i < CONFIG.USERS_COUNT; i++) {
            const gender = Math.random() > 0.5 ? 'Male' : 'Female';
            const firstName = getRandom(gender === 'Male' ? MALE_NAMES : FEMALE_NAMES);
            const lastName = getRandom(LAST_NAMES);
            const hub = getRandom(EGYPT_HUBs);
            const loc = getRandomLocation(hub);

            const userData = {
                username: `user_seeded_${i}_${Date.now()}`,
                email: `user${i}.seeded@test.com`,
                password: passwordHash,
                type: 'user',
                fullName: `${firstName} ${lastName}`,
                locations: [loc],
                phone: generatePhone(),
                avatar: `https://i.pravatar.cc/150?u=user${i}`,
                bio: `Foodie living in ${hub.name}`,
                date: new Date()
            };
            userDocs.push(userData);
            credentials.push({ email: userData.email, password: CONFIG.DEFAULT_PASS, type: 'user', name: userData.fullName, location: hub.name });
        }
        const insertedUsers = await User.insertMany(userDocs);
        insertedUsers.forEach(u => createdUsers.push(u));
        console.log(`✅ Inserted ${insertedUsers.length} Users.`);

        // 4. GENERATE STORIES
        console.log(`📱 Generating ${CONFIG.STORIES_COUNT} Stories...`);
        const storyDocs = [];

        for (let i = 0; i < CONFIG.STORIES_COUNT; i++) {
            const isReview = Math.random() > 0.6;
            const isVideo = Math.random() > 0.7;
            const author = isReview ? getRandom(createdUsers) : getRandom(createdChefs);

            let relatedDish, caption, image, video;

            // STORY CATEGORY: Must be [ObjectId].
            let storyCategoryIds = [];

            if (!isReview) {
                // CHEF POSTS
                const cuisine = CUISINES.find(c => author.fullName.includes(c.name.split(' ')[0])) || getRandom(CUISINES);
                caption = getRandom(cuisine.captions);
                image = generateImage(cuisine.keywords);
                if (isVideo) video = getRandom(VIDEOS);

                // Get ObjectId for random cuisine category
                const catName = getRandom(cuisine.cats);
                if (catMap[catName]) storyCategoryIds.push(catMap[catName]);

            } else {
                // USER REVIEWS
                relatedDish = getRandom(createdDishes);
                const place = getRandom(EGYPT_HUBs).name.split(',')[0];
                caption = `Tried this place in ${place}. Absolutely amazing! ⭐⭐⭐⭐⭐`;
                image = relatedDish.image;
                if (isVideo) video = getRandom(VIDEOS);

                // Use Dish's category (String) -> Map to ObjectId
                if (relatedDish && catMap[relatedDish.category]) {
                    storyCategoryIds.push(catMap[relatedDish.category]);
                }
            }

            // Fallback for category
            if (storyCategoryIds.length === 0) {
                // Push a default 'Main Courses' or similar if available, or just skip
                const defaultCat = Object.values(catMap)[0];
                if (defaultCat) storyCategoryIds.push(defaultCat);
            }

            const createdAt = new Date(Date.now() - Math.floor(Math.random() * 60 * 24 * 60 * 60 * 1000));

            const storyData = {
                author: author._id,
                category: storyCategoryIds, // [ObjectId]
                uri: isVideo ? video : image, // Should be uri not 'image' if that's what schema says? Schema says uri: String.
                poster: image,
                caption: caption,
                type: isVideo ? 'video' : 'image', // This field might not exist in schema, schema implies uri/avatarUri? 
                // Schema has 'title', 'duration'. Not 'type'. 
                // But let's keep extra fields if Mongoose allows strict:false, otherwise might need cleanup.
                // Actually looking at schema: uri, avatarUri, caption, likes, etc. No 'type'.
                // But it has `reviewMode`.

                likesNo: Math.floor(Math.random() * 30),
                commentsNo: Math.floor(Math.random() * 10),
                views: Math.floor(Math.random() * 5000),
                created_at: createdAt,

                reviewMode: isReview,
                rating: isReview ? 5 : undefined,
                dishes: relatedDish ? [relatedDish._id] : [],
                reviewedDish: relatedDish ? relatedDish._id : undefined,

                governorate: "Cairo",
                areas: ["Maadi"]
            };

            // Fix Review Fields: reviewType required if reviewMode is true
            if (isReview) {
                storyData.reviewType = 'dish'; // 'dish' or 'menu'
            }

            storyDocs.push(storyData);

            if (storyDocs.length >= 2000) {
                const insertedStories = await Story.insertMany(storyDocs);
                insertedStories.forEach(s => createdStories.push(s));
                console.log(`   ...inserted batch of ${storyDocs.length}`);
                storyDocs.length = 0;
            }
        }

        if (storyDocs.length > 0) {
            const insertedStories = await Story.insertMany(storyDocs);
            insertedStories.forEach(s => createdStories.push(s));
        }
        console.log(`✅ Inserted all Stories.`);

        // 5. GENERATE LIKES & COMMENTS
        console.log(`❤️ Generating Likes & Comments...`);
        const likeDocs = [];
        const commentDocs = [];

        for (let i = 0; i < 2000; i++) {
            const story = getRandom(createdStories);
            const user = getRandom(createdUsers);

            likeDocs.push({
                user_id: user._id,
                post_id: story._id,
                created_at: new Date()
            });
        }

        for (let i = 0; i < 1000; i++) {
            const story = getRandom(createdStories);
            const user = getRandom(createdUsers);

            commentDocs.push({
                user_id: user._id,
                post_id: story._id,
                content: getRandom(COMMENT_TEXTS),
                created_at: new Date()
            });
        }

        await Like.insertMany(likeDocs);
        await Comment.insertMany(commentDocs);
        console.log(`✅ Inserted ${likeDocs.length} Likes and ${commentDocs.length} Comments.`);

        // 6. EXPORT
        fs.writeFileSync('seeded_users.json', JSON.stringify(credentials, null, 2));
        console.log(`📄 Saved credentials to seeded_users.json`);

        console.log("🎉 SEEDING COMPLETE!");
        process.exit(0);

    } catch (error) {
        console.error("❌ Seeding Failed:", error);
        process.exit(1);
    }
};

seed();
