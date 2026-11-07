
export const success = (res, data, message = 'success', code = 200) =>{
    return res.status(code).json({
        status: 'success',
        message,
        data
    });
} ;

export const error = (res, message = 'error', code = 400) =>{
    return res.status(code).json({
        status : 'error',
        message
    })
}

export default {success, error}