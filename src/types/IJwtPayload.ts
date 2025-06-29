export default interface IJwtPayload {
    id: string;
    sessionId: string;
    roles: string[];
}