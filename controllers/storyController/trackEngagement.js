const mongoose = require("mongoose");

const View = mongoose.model("view");
const Story = mongoose.model("story");
const { createAttribution } = require('../../services/commissionService');

/**
 * Track engagement signals for a story
 * Used by frontend to report watch time, completion rate, rewatches, shares
 * 
 * POST /api/stories/:id/engagement
 */
const trackEngagement = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?._id;

        if (!userId) {
            return res.status(401).json({ error: "Authentication required" });
        }

        const {
            watchDuration = 0,
            totalDuration = 0,
            completionRate = 0,
            rewatched = false,
            shared = false,
            source = 'forYou'
        } = req.body;

        // Validate story exists
        const story = await Story.findById(id);
        if (!story) {
            return res.status(404).json({ error: "Story not found" });
        }

        // Find existing view or create new one
        let view = await View.findOne({ user_id: userId, story: id });
        let isNewView = false;

        if (view) {
            // Update existing view
            view.watchDuration = Math.max(view.watchDuration || 0, watchDuration);
            view.totalDuration = totalDuration || view.totalDuration;
            view.completionRate = Math.max(view.completionRate || 0, completionRate);
            view.rewatched = view.rewatched || rewatched;
            view.shared = view.shared || shared;
            view.source = source;
            await view.save();
        } else {
            isNewView = true;
            // Create new view
            view = await View.create({
                user_id: userId,
                story: id,
                watchDuration,
                totalDuration,
                completionRate,
                rewatched,
                shared,
                source,
                created_at: new Date()
            });

            // Increment story view count
            await Story.findByIdAndUpdate(id, { $inc: { views: 1 } });
        }

        // Track mission attribution on first view of mission content
        if (isNewView && story.missionId && story.participationId) {
            mongoose.model('missionParticipation').updateOne(
                { _id: story.participationId },
                { $inc: { 'metrics.totalViews': 1 } },
            ).catch(err => console.error('[MISSION] Failed to increment participation views:', err.message));
            createAttribution(userId, story, source === 'share' ? 'share_link' : 'in_app_view').catch(err => {
                console.error('[ATTRIBUTION] Failed to create attribution:', err.message);
            });
        }

        // Update story aggregated stats (async, non-blocking)
        updateStoryStats(id).catch(err => {
            console.error('[ENGAGEMENT] Failed to update story stats:', err.message);
        });

        res.json({
            success: true,
            view: {
                watchDuration: view.watchDuration,
                completionRate: view.completionRate,
                rewatched: view.rewatched,
                shared: view.shared
            }
        });

    } catch (error) {
        console.error("[ENGAGEMENT] Error tracking engagement:", error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Update aggregated story stats (async background task)
 */
async function updateStoryStats(storyId) {
    const stats = await View.aggregate([
        { $match: { story: mongoose.Types.ObjectId(storyId) } },
        {
            $group: {
                _id: "$story",
                avgCompletionRate: { $avg: "$completionRate" },
                rewatchCount: { $sum: { $cond: ["$rewatched", 1, 0] } },
                shareCount: { $sum: { $cond: ["$shared", 1, 0] } }
            }
        }
    ]);

    if (stats.length > 0) {
        await Story.findByIdAndUpdate(storyId, {
            avgCompletionRate: stats[0].avgCompletionRate || 0,
            rewatchCount: stats[0].rewatchCount || 0,
            shareCount: stats[0].shareCount || 0
        });
    }
}

/**
 * Mark a story as shared
 * POST /api/stories/:id/share
 */
const trackShare = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?._id;

        if (!userId) {
            return res.status(401).json({ error: "Authentication required" });
        }

        // Update or create view with shared flag
        await View.findOneAndUpdate(
            { user_id: userId, story: id },
            { $set: { shared: true } },
            { upsert: true }
        );

        // Increment share count on story
        await Story.findByIdAndUpdate(id, { $inc: { shareCount: 1 } });

        res.json({ success: true });
    } catch (error) {
        console.error("[SHARE] Error tracking share:", error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = { trackEngagement, trackShare };
