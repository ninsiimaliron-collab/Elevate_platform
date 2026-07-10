const { success } = require('../../utils/apiResponse');
const service = require('./resource.service');

const createResource = async (req, res, next) => {
  try {
    const data = await service.createResource(req.user.sub, req.body);
    success(res, data, 'Resource created successfully', 201);
  } catch (error) {
    next(error);
  }
};

const updateResource = async (req, res, next) => {
  try {
    const data = await service.updateResource(req.params.id, req.body);
    success(res, data, 'Resource updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteResource = async (req, res, next) => {
  try {
    const data = await service.deleteResource(req.params.id);
    success(res, data, 'Resource deleted successfully');
  } catch (error) {
    next(error);
  }
};

const publishResource = async (req, res, next) => {
  try {
    const data = await service.publishResource(req.params.id);
    success(res, data, 'Resource published successfully');
  } catch (error) {
    next(error);
  }
};

const listResources = async (req, res, next) => {
  try {
    const result = await service.listResources(req.query);
    success(res, result.data, 'Resources retrieved successfully', 200, result.pagination);
  } catch (error) {
    next(error);
  }
};

const getResource = async (req, res, next) => {
  try {
    const data = await service.getResource(req.params.id);
    success(res, data, 'Resource retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const addBookmark = async (req, res, next) => {
  try {
    const data = await service.addBookmark(req.params.id, req.user.sub);
    success(res, data, 'Bookmark added successfully');
  } catch (error) {
    next(error);
  }
};

const removeBookmark = async (req, res, next) => {
  try {
    const data = await service.removeBookmark(req.params.id, req.user.sub);
    success(res, data, 'Bookmark removed successfully');
  } catch (error) {
    next(error);
  }
};

const myBookmarks = async (req, res, next) => {
  try {
    const data = await service.myBookmarks(req.user.sub);
    success(res, data, 'Bookmarks retrieved successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createResource,
  updateResource,
  deleteResource,
  publishResource,
  listResources,
  getResource,
  addBookmark,
  removeBookmark,
  myBookmarks
};
