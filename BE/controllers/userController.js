
import userServices from '../services/userServices.js';
import { validateUser } from '../dtos/user.js';
import { successResponse, errorResponse, paginatedResponse } from '../helpers/responseHelper.js';

const getUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        let sortField = req.query.sort || 'createdAt';
        const sortOrder = req.query.order === 'desc' ? 'desc' : 'asc';

        const result = await userServices.getAllUsers(skip, limit, sortField, sortOrder);
        return paginatedResponse(res, 200, 'Users retrieved successfully', result.users, {
            total: result.totalUsers,
            page: result.currentPage,
            totalPages: result.totalPages,
            limit: result.limit
        });
    } catch (error) {
        return errorResponse(res, 500, error.message);
    }
};

const createUser = async (req, res) => {
    const { error } = validateUser(req.body);
    if (error) {
        return errorResponse(res, 400, 'Validation failed', error.details.map(e => e.message));
    }

    try {
        const { fullName, email, password, avatar } = req.body;
        const newUser = {
            fullName, email, password, avatar
        }
        const createdUser = await userServices.createUser(newUser);
        return successResponse(res, 201, 'User created successfully', createdUser);
    } catch (error) {
        return errorResponse(res, 500, error.message);
    }
}

const deleteUserById = async (req, res) => {
    try {
        const userId = req.params.id;
        await userServices.deleteUserById(userId);
        return successResponse(res, 200, `User with id ${userId} deleted successfully`);
    } catch (error) {
        return errorResponse(res, 500, error.message);
    }
}

const updateUserById = async (req, res) => {
    try {
        const userId = req.params.id;
        
        // Danh sách các field được phép update
        const allowedFields = ['fullName', 'avatar'];
        
        // Kiểm tra xem có field nào không được phép không
        const requestFields = Object.keys(req.body);
        const invalidFields = requestFields.filter(field => !allowedFields.includes(field));
        
        if (invalidFields.length > 0) {
            return errorResponse(res, 400, `Fields not allowed to update: ${invalidFields.join(', ')}. Only fullName and avatar can be updated.`);
        }
        
        const { fullName, avatar } = req.body;
        
        // Validate fullName nếu có
        if (fullName !== undefined && (!fullName || fullName.trim().length === 0)) {
            return errorResponse(res, 400, 'Full name cannot be empty');
        }
        
        // Tạo object chỉ chứa các field được phép
        const updateData = {};
        if (fullName !== undefined) {
            updateData.fullName = fullName;
        }
        if (avatar !== undefined) {
            updateData.avatar = avatar;
        }
        
        if (Object.keys(updateData).length === 0) {
            return errorResponse(res, 400, 'No valid fields to update');
        }
        
        const updatedUser = await userServices.updateUserById(userId, updateData);
        return successResponse(res, 200, `User with id ${userId} updated successfully`, updatedUser);
    } catch (error) {
        return errorResponse(res, 500, error.message);
    }
};

const getUserById = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await userServices.getUserById(userId);
        if (user) {
            return successResponse(res, 200, 'User retrieved successfully', user);
        } else {
            return errorResponse(res, 404, `User with id ${userId} not found`);
        }
    } catch (error) {
        return errorResponse(res, 500, error.message);
    }
};

const getUserByName = async (req, res) => {
    try {
        const name = req.params.name;
        const users = await userServices.getUserByName(name);
        return successResponse(res, 200, 'Users retrieved successfully', users);
    } catch (error) {
        return errorResponse(res, 500, error.message);
    }
};

const searchUsers = async (req, res) => {
    try {
        const searchQuery = req.query.q || req.query.search || '';
        console.log(searchQuery);
        
        
        if (!searchQuery || searchQuery.trim().length === 0) {
            return errorResponse(res, 400, 'Search query is required');
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const currentUserId = req.user.id;
        const result = await userServices.searchUsersForFriendRequest(currentUserId, searchQuery, skip, limit);
        
        return paginatedResponse(res, 200, 'Search results retrieved successfully', result.data, {
            total: result.total,
            page: page,
            totalPages: result.totalPages,
            limit: result.limit
        });
    } catch (error) {
        return errorResponse(res, 500, error.message);
    }
};

export default {
    getUsers,
    createUser,
    deleteUserById,
    updateUserById,
    getUserById,
    searchUsers
};