const Board = require('../models/Board');
const List = require('../models/List');
const Task = require('../models/Task');
const Activity = require('../models/Activity');

// @desc    Get all boards for user
// @route   GET /api/boards
// @access  Private
exports.getBoards = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = {
      $or: [
        { owner: req.user._id },
        { members: req.user._id }
      ],
      isArchived: false
    };

    if (req.query.search) {
      query.title = { $regex: req.query.search, $options: 'i' };
    }

    const boards = await Board.find(query)
      .populate('owner', 'name email avatar')
      .populate('members', 'name email avatar')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    const total = await Board.countDocuments(query);

    res.status(200).json({
      success: true,
      data: boards,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single board
// @route   GET /api/boards/:id
// @access  Private
exports.getBoard = async (req, res) => {
  try {
    const board = await Board.findById(req.params.id)
      .populate('owner', 'name email avatar')
      .populate('members', 'name email avatar');

    if (!board) {
      return res.status(404).json({
        success: false,
        message: 'Board not found'
      });
    }

    // Check if user has access
    const hasAccess = board.owner._id.toString() === req.user._id.toString() ||
                     board.members.some(member => member._id.toString() === req.user._id.toString());

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this board'
      });
    }

    res.status(200).json({
      success: true,
      data: board
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create board
// @route   POST /api/boards
// @access  Private
exports.createBoard = async (req, res) => {
  try {
    req.body.owner = req.user._id;
    req.body.members = [req.user._id];

    const board = await Board.create(req.body);

    await Activity.create({
      board: board._id,
      user: req.user._id,
      action: 'create_board',
      targetType: 'Board',
      targetId: board._id,
      details: { title: board.title }
    });

    const populatedBoard = await Board.findById(board._id)
      .populate('owner', 'name email avatar')
      .populate('members', 'name email avatar');

    res.status(201).json({
      success: true,
      data: populatedBoard
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update board
// @route   PUT /api/boards/:id
// @access  Private
exports.updateBoard = async (req, res) => {
  try {
    let board = await Board.findById(req.params.id);

    if (!board) {
      return res.status(404).json({
        success: false,
        message: 'Board not found'
      });
    }

    // Check ownership
    if (board.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this board'
      });
    }

    board = await Board.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('owner', 'name email avatar')
      .populate('members', 'name email avatar');

    await Activity.create({
      board: board._id,
      user: req.user._id,
      action: 'update_board',
      targetType: 'Board',
      targetId: board._id,
      details: req.body
    });

    res.status(200).json({
      success: true,
      data: board
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete board
// @route   DELETE /api/boards/:id
// @access  Private
exports.deleteBoard = async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);

    if (!board) {
      return res.status(404).json({
        success: false,
        message: 'Board not found'
      });
    }

    if (board.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this board'
      });
    }

    // Delete all lists and tasks
    await List.deleteMany({ board: req.params.id });
    await Task.deleteMany({ board: req.params.id });
    await Activity.deleteMany({ board: req.params.id });
    await board.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Add member to board
// @route   POST /api/boards/:id/members
// @access  Private
exports.addMember = async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);

    if (!board) {
      return res.status(404).json({
        success: false,
        message: 'Board not found'
      });
    }

    if (board.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only board owner can add members'
      });
    }

    if (!board.members.includes(req.body.userId)) {
      board.members.push(req.body.userId);
      await board.save();

      await Activity.create({
        board: board._id,
        user: req.user._id,
        action: 'add_member',
        targetType: 'Board',
        targetId: board._id,
        details: { memberId: req.body.userId }
      });
    }

    const updatedBoard = await Board.findById(board._id)
      .populate('owner', 'name email avatar')
      .populate('members', 'name email avatar');

    res.status(200).json({
      success: true,
      data: updatedBoard
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
