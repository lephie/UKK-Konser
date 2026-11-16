// Throw this inside a transaction to roll it back and answer with a specific HTTP status:
//   throw new HttpError(409, 'Not enough tickets left');
export class HttpError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}

export default HttpError;
