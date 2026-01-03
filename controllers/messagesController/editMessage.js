const Message = require('../../models/message');
const { getIO } = require('../../socket');

const editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Verify ownership
    if (message.sender.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'Not authorized to edit this message' });
    }

    // Update content and add edited flag
    message.content = content;
    message.isEdited = true; // Assuming we want to track this, might need to add to schema
    await message.save();

    // Populate sender and receiver for socket event
    await message.populate('sender', 'fullName avatar');
    await message.populate('receiver', 'fullName avatar');

    // Emit socket event
    const io = getIO();
    if (io) {
      io.to(message.receiver._id.toString()).emit('messageUpdated', message);
      io.to(message.sender._id.toString()).emit('messageUpdated', message);
    }

    return res.status(200).json({ success: true, message });
  } catch (error) {
    console.error('Edit message error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};

module.exports = editMessage;
