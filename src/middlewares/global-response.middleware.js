export const globalResponse = (err, req, res, next) => {
    if (err) {
        return res.status(err['cause'] || 500).json({
            message: 'Catch error',
            error_msg: err.message,
            err_loc: err.stack
        })
    }
}