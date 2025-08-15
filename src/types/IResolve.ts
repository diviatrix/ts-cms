export default interface IResolve<T> {
    success: boolean,
    message: string,
    data: T | undefined
}

export interface IResolveWithStatus<T> extends IResolve<T> {
    statusCode?: number;
}