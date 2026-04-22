export interface AuthenticatedUser {
    id: string;
    login: string;
    roles: string[];
}

declare global {
    namespace Express {
        interface Request {
            user?: AuthenticatedUser;
        }
    }
}

export {};