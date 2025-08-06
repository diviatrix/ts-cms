export interface IInvite {
    id: string;
    code: string;
    created_by: string;
    created_at: string;
    used_by?: string | null;
    used_at?: string | null;
}

export interface ICreateInvite {
    code: string;
    created_by: string;
}

export interface IInviteWithCreatorInfo extends IInvite {
    creator_login?: string;
    creator_email?: string;
    user_login?: string;
    user_email?: string;
}