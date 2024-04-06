const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Message = require('../models/Message');
const Group = require('../models/Group');
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");
const { encryptMessage } = require('../common/encrypt');
const crypto = require('crypto');
const {auth} = require('../middleware/auth');
const { decryptMessage } = require('../common/decrypt');



module.exports = (io) => {

// User Management
router.post('/register', async (req, res) => {
  try {
    const { email, username, password, name} = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const encryptionKey = crypto.randomBytes(32).toString('hex');

    const user = await User.create({ email, username, password: hashedPassword, name, encryptionKey});
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
    res.status(201).json({ user, token });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    console.log("JWT_SECRET", process.env.JWT_SECRET)
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
    res.json({ user, token });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put('/profile', auth, async (req, res) => {
  // User profile update logic
  try {
    const { name, username, profilePicture } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { name, username, profilePicture },
      { new: true, runValidators: true }
    );
    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Messaging
router.post('/messages', auth, async (req, res) => {
  try {
    const { recipientId, content, type } = req.body;

    console.log("req", req.user)
    const encryptedContent = encryptMessage(content, req.user.encryptionKey);
    const message = await Message.create({
      sender: req.user.userId,
      recipient: recipientId,
      content: encryptedContent,
      type,
    });
    io.emit('message', message);
    res.status(201).json(message);
  } catch (error) {
    console.log("error while creating message",error )

    res.status(400).json({ message: error.message });
  }
});

router.get('/messages', auth, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.user.userId, recipient: req.query.userId },
        { sender: req.query.userId, recipient: req.user.userId },
      ],
    }).sort({ createdAt: 1 });

    // Decrypt the messages
    const decryptedMessages = messages.map((message) => ({
      ...message.toObject(),
      content: decryptMessage(message.content, req.user.encryptionKey),
    }));

    res.json(decryptedMessages);
  } catch (error) {
    console.log("hello world", error);
    res.status(400).json({ message: error.message });
  }
});

// Group Chats
router.post('/groups', auth, async (req, res) => {

  try {
    const { name, description } = req.body;
    const group = await Group.create({
      name,
      description,
      members: [req.user.userId],
    });
    io.to(group._id.toString()).emit('group created', group);
    res.status(201).json(group);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
  // Create group chat logic
});

router.post('/groups/:id/join', auth, async (req, res) => {
  try {
    const group = await Group.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { members: req.user.userId } },
      { new: true }
    );
    io.to(group._id.toString()).emit('user joined', { userId: req.user.userId, group });
    res.json(group);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
  // Join group chat logic
});

router.post('/groups/:id/messages', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group.members.includes(req.user.userId)) {
      return res.status(403).json({ message: 'You are not a member of this group' });
    }
    const { content, type } = req.body;
    const encryptedContent = encryptMessage(content, req.user.encryptionKey);
    const message = await Message.create({
      sender: req.user.userId,
      group: req.params.id,
      content: encryptedContent,
      type,
    });
    io.to(req.params.id).emit('group message', message);
    res.status(201).json(message);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});


  return router
}