const notFoundHandler = (req, res, next) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.path} not found`,
        path: req.path,
        method: req.method
    });
};

module.exports = notFoundHandler;