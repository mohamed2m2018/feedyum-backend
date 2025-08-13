const mongoose = require("mongoose");
const Menu = require("../../models/menu");
const Dish = require("../../models/dish");

const getMenuSections = async (req, res) => {
    try {
        const { menuId } = req.params;

        // Validate menu ID format
        if (!mongoose.Types.ObjectId.isValid(menuId)) {
            return res.status(400).json({ 
                success: false, 
                message: "Invalid menu ID format" 
            });
        }

        // Find menu first
        const menu = await Menu.findById(menuId).lean();

        if (!menu) {
            return res.status(404).json({ 
                success: false, 
                message: "Menu not found" 
            });
        }

        // Get sections that have dishes in this menu
        const sectionsWithDishes = await Dish.aggregate([
            {
                $match: {
                    menu: mongoose.Types.ObjectId(menuId),
                    section: { $exists: true, $ne: null }
                }
            },
            {
                $group: {
                    _id: '$section'
                }
            },
            {
                $lookup: {
                    from: 'sections',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'sectionDetails'
                }
            },
            {
                $unwind: '$sectionDetails'
            },
            {
                $replaceRoot: { newRoot: '$sectionDetails' }
            },
            {
                $sort: { created_at: -1 }
            }
        ]);

        // Return only sections that have dishes
        res.status(200).json({ 
            success: true, 
            sections: sectionsWithDishes 
        });

    } catch (error) {
        console.error("Error fetching menu sections:", error);
        res.status(500).json({ 
            success: false, 
            message: "Server error while fetching sections",
            error: error.message 
        });
    }
};

module.exports = getMenuSections;