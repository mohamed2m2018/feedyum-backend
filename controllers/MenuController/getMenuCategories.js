const mongoose = require("mongoose");
const Menu = require("../../routes/menu");

const getMenuCategories = async (req, res) => {
    try {
        const { menuId } = req.params;

        // Validate menu ID format
        if (!mongoose.Types.ObjectId.isValid(menuId)) {
            return res.status(400).json({ 
                success: false, 
                message: "Invalid menu ID format" 
            });
        }

        // Find menu and populate categories
        const menu = await Menu.findById(menuId)
            .populate({
                path: "categories",
                select: "-__v" // Exclude version field
            })
            .lean();

        if (!menu) {
            return res.status(404).json({ 
                success: false, 
                message: "Menu not found" 
            });
        }

        // Return populated categories
        res.status(200).json({ 
            success: true, 
            categories: menu.categories 
        });

    } catch (error) {
        console.error("Error fetching menu categories:", error);
        res.status(500).json({ 
            success: false, 
            message: "Server error while fetching categories",
            error: error.message 
        });
    }
};

module.exports = getMenuCategories;