class AppException extends Error {
    // Name should be a unique identifier for the type of exception.
    constructor(name:string, message:string = '') {
        super(message);
        this.name = name;
    }
}

export default AppException;