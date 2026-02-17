const express = require("express");
const router = express.Router();
const { searchUsers, getUsers } = require("../controllers/userController");
const { protect } = require("../middleware/auth");

router.use(protect);

router.get("/search", searchUsers);
router.get("/", getUsers);

module.exports = router;
