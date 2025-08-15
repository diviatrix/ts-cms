/**
 * Invite management functions
 */

import database from '../db';
import { IInvite, ICreateInvite, IInviteWithCreatorInfo } from '../types/IInvite';
import { generateGuid } from '../utils/guid';
import prep from '../utils/prepare';
import IResolve from '../types/IResolve';

/**
 * Generate a unique invite code
 */
function generateInviteCode(): string {
    return Math.random().toString(36).substring(2, 12).toUpperCase();
}

/**
 * Create a new invite
 */
export async function createInvite(createdBy: string): Promise<IResolve<IInvite | undefined>> {
    const invite: ICreateInvite = {
        code: generateInviteCode(),
        created_by: createdBy
    };

    // Ensure code is unique
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
        const existing = await database.getInviteByCode(invite.code);
        if (!existing.success || !existing.data) {
            break;
        }
        invite.code = generateInviteCode();
        attempts++;
    }

    if (attempts >= maxAttempts) {
        return prep.response(false, 'Failed to generate unique invite code', undefined);
    }

    const inviteWithId = {
        id: generateGuid(),
        ...invite,
        created_at: new Date().toISOString()
    };
    
    return await database.createInvite(inviteWithId);
}

/**
 * Get all invites with creator and user information
 */
export async function getAllInvitesWithInfo(): Promise<IResolve<IInviteWithCreatorInfo[]>> {
    return await database.getAllInvitesWithInfo();
}

/**
 * Get invite by code
 */
export async function getInviteByCode(code: string): Promise<IResolve<IInvite | null | undefined>> {
    return await database.getInviteByCode(code);
}

/**
 * Use an invite code (mark as used)
 */
export async function useInvite(code: string, userId: string): Promise<IResolve<boolean>> {
    const invite = await getInviteByCode(code);
    
    if (!invite.success || !invite.data) {
        return prep.response(false, 'Invalid invite code', false);
    }

    if (invite.data.used_by) {
        return prep.response(false, 'Invite code has already been used', false);
    }

    return await database.markInviteAsUsed(invite.data.id, userId);
}

/**
 * Delete an unused invite
 */
export async function deleteInvite(inviteId: string): Promise<IResolve<boolean>> {
    const invite = await database.getInviteById(inviteId);
    
    if (!invite.success || !invite.data) {
        return prep.response(false, 'Invite not found', false);
    }

    if (invite.data.used_by) {
        return prep.response(false, 'Cannot delete used invite', false);
    }

    return await database.deleteInvite(inviteId);
}

/**
 * Validate invite code for registration
 */
export async function validateInviteForRegistration(code?: string): Promise<IResolve<IInvite | undefined>> {
    if (!code) {
        return prep.response(false, 'Invite code is required', undefined);
    }

    const invite = await getInviteByCode(code);
    
    if (!invite.success || !invite.data) {
        return prep.response(false, 'Invalid invite code', undefined);
    }

    if (invite.data.used_by) {
        return prep.response(false, 'Invite code has already been used', undefined);
    }

    return prep.response(true, 'Valid invite code', invite.data);
}