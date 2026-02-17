const List = require('../models/List');
const Board = require('../models/Board');
const Task = require('../models/Task');
const Activity = require('../models/Activity');

// @desc    Get all lists for a board
// @route   GET /api/boards/:boardId/lists
// @access  Private
exports.getLists = async (req, res) => {
  try {
    const lists = await List.find({ 
      board: req.params.boardId,
      isArchived: false 
    }).sort({ position: 1 });

    res.status(200).json({
      success: true,
      data: lists
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create list
// @route   POST /api/boards/:boardId/lists
// @access  Private
exports.createList = async (req, res) => {
  try {
    const board = await Board.findById(req.params.boardId);

    if (!board) {
      return res.status(404).json({
        success: false,
        message: 'Board not found'
      });
    }

    // Get the highest position
    const lastList = await List.findOne({ board: req.params.boardId })
      .sort({ position: -1 });
    
    const position = lastList ? lastList.position + 1 : 0;

    const list = await List.create({
      ...req.body,
      board: req.params.boardId,
      position
    });

    await Activity.create({
      board: req.params.boardId,
      user: req.user._id,
      action: 'create_list',
      targetType: 'List',
      targetId: list._id,
      details: { title: list.title }
    });

    res.status(201).json({
      success: true,
      data: list
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update list
// @route   PUT /api/lists/:id
// @access  Private
exports.updateList = async (req, res) => {
  try {
    let list = await List.findById(req.params.id);

    if (!list) {
      return res.status(404).json({
        success: false,
        message: 'List not found'
      });
    }

    list = await List.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    await Activity.create({
      board: list.board,
      user: req.user._id,
      action: 'update_list',
      targetType: 'List',
      targetId: list._id,
      details: req.body
    });

    res.status(200).json({
      success: true,
      data: list
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete list
// @route   DELETE /api/lists/:id
// @access  Private
exports.deleteList = async (req, res) => {
  try {
    const list = await List.findById(req.params.id);

    if (!list) {
      return res.status(404).json({
        success: false,
        message: 'List not found'
      });
    }

    // Delete all tasks in the list
    await Task.deleteMany({ list: req.params.id });
    await list.deleteOne();

    await Activity.create({
      board: list.board,
      user: req.user._id,
      action: 'delete_list',
      targetType: 'List',
      targetId: list._id,
      details: { title: list.title }
    });

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
