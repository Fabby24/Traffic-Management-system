const errorHandler = (err, req, res, next) =>{
    console.error('Error', err);

    //Default error
    let statusCode = err.status || 500;
    let message = err.message || 'Something went wrong';

    // handling specific errors
    if (err.code === 'ER_DUP_ENTRY') {
        statusCode = 400;
        message = 'Duplicate entry detected'
    }

    if (err.code === 'ER_NO_REFERENCED_ROW') {
        statusCode = 400;
        message = 'Invalid reference to non-existent record';
    }

    res.status(statusCode).json({
        success: false,
        message: message,
        ...(process.env.NODE_ENV === 'development' && {stack: err.stack})
    });
};

// Not found error
const notFoundHandler = (req, res,next) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.url} not found`
    });
};

module.exports = {errorHandler, notFoundHandler}