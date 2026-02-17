const Task = require('../models/Task');
const List = require('../models/List');
const Activity = require('../models/Activity');

// @desc    Get all tasks for a list
// @route   GET /api/lists/:listId/tasks
// @access  Private
exports.getTasks = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const query = {
      list: req.params.listId,
      isArchived: false
    };

    if (req.query.search) {
      query.title = { $regex: req.query.search, $options: 'i' };
    }

    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .sort({ position: 1 })
      .limit(limit)
      .skip(skip);

    const total = await Task.countDocuments(query);

    res.status(200).json({
      success: true,
      data: tasks,
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

// @desc    Get all tasks for a board
// @route   GET /api/boards/:boardId/tasks
// @access  Private
exports.getBoardTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ 
      board: req.params.boardId,
      isArchived: false 
    })
      .populate('list', 'title')
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: tasks
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create task
// @route   POST /api/lists/:listId/tasks
// @access  Private
exports.createTask = async (req, res) => {
  try {
    const list = await List.findById(req.params.listId);

    if (!list) {
      return res.status(404).json({
        success: false,
        message: 'List not found'
      });
    }

    // Get the highest position
    const lastTask = await Task.findOne({ list: req.params.listId })
      .sort({ position: -1 });
    
    const position = lastTask ? lastTask.position + 1 : 0;

    const task = await Task.create({
      ...req.body,
      list: req.params.listId,
      board: list.board,
      position,
      createdBy: req.user._id
    });

    await Activity.create({
      board: list.board,
      user: req.user._id,
      action: 'create_task',
      targetType: 'Task',
      targetId: task._id,
      details: { title: task.title, listId: list._id }
    });

    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email avatar');

    res.status(201).json({
      success: true,
      data: populatedTask
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
exports.updateTask = async (req, res) => {
  try {
    let task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    task = await Task.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email avatar');

    await Activity.create({
      board: task.board,
      user: req.user._id,
      action: 'update_task',
      targetType: 'Task',
      targetId: task._id,
      details: req.body
    });

    res.status(200).json({
      success: true,
      data: task
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Move task to different list
// @route   PUT /api/tasks/:id/move
// @access  Private
exports.moveTask = async (req, res) => {
  try {
    const { listId, position } = req.body;

    let task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    const oldListId = task.list;

    // Update task
    task.list = listId;
    task.position = position;
    await task.save();

    // Update positions of other tasks
    if (oldListId.toString() !== listId.toString()) {
      await Task.updateMany(
        { list: oldListId, position: { $gt: task.position } },
        { $inc: { position: -1 } }
      );
    }

    await Activity.create({
      board: task.board,
      user: req.user._id,
      action: 'move_task',
      targetType: 'Task',
      targetId: task._id,
      details: { from: oldListId, to: listId, position }
    });

    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email avatar');

    res.status(200).json({
      success: true,
      data: populatedTask
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    await Activity.create({
      board: task.board,
      user: req.user._id,
      action: 'delete_task',
      targetType: 'Task',
      targetId: task._id,
      details: { title: task.title }
    });

    await task.deleteOne();

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
