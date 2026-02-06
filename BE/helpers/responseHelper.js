/**
 * Helper để chuẩn hóa response format
 * Format: { message, statusCode, data, metadata }
 */

/**
 * Response thành công
 * @param {object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Message mô tả
 * @param {any} data - Dữ liệu trả về
 * @param {object} metadata - Metadata (pagination, etc.)
 */
export const successResponse = (res, statusCode = 200, message = 'Success', data = null, metadata = null) => {
    const response = {
        message,
        statusCode
    };

    if (data !== null && data !== undefined) {
        response.data = data;
    }

    if (metadata) {
        response.metadata = metadata;
    }

    return res.status(statusCode).json(response);
};

/**
 * Response lỗi
 * @param {object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Message lỗi
 * @param {any} errors - Chi tiết lỗi (optional)
 */
export const errorResponse = (res, statusCode = 500, message = 'Internal Server Error', errors = null) => {
    const response = {
        message,
        statusCode
    };

    if (errors) {
        response.errors = errors;
    }

    return res.status(statusCode).json(response);
};

/**
 * Response với pagination
 * @param {object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Message mô tả
 * @param {any} data - Dữ liệu trả về
 * @param {object} pagination - Thông tin phân trang { total, page, totalPages, limit }
 */
export const paginatedResponse = (res, statusCode = 200, message = 'Success', data = null, pagination = {}) => {
    const response = {
        message,
        statusCode
    };

    if (data !== null && data !== undefined) {
        response.data = data;
    }

    response.metadata = {
        pagination: {
            total: pagination.total || 0,
            page: pagination.page || 1,
            totalPages: pagination.totalPages || 1,
            limit: pagination.limit || 10
        }
    };

    return res.status(statusCode).json(response);
};
