export const getPagination = (query = {}, defaultLimit = 10, maxLimit = 100) =>{
    const page = Math.max(parseInt(query.page, 10) || 1, 1); 
    // mathmax ngak bole = 0, parseint jadi params? 1,1 klo unde,null,0 jadi 1

    const limit = Math.min(Math.max(parseInt(query.limit, 10) || defaultLimit, 1), maxLimit);
    return {page, limit, offset: (page - 1) * limit };
    //mathmax sama, mathmin(..mathmax) jadi maks 100? 
    // masi gangerti jirs
    
};


export const paginated = (rows, count, page, limit) => ({
    items : rows,
    pagination: {
        total: count,
        page,
        limit,
        total_pages: Math.ceil(count / limit) // round number ke angka selanjutnya yang lebih besar?
    }
})