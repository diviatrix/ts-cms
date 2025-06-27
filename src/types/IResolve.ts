export default interface IResolve<T> {
    success: boolean,
    message: string,
    data: T | undefined   
}