import { IdentityFormatter } from "@/lib/auth/formatter";
import type {
    UserApi,
    User,
    UserInput,
    UserWriteApi,
    UserListInput,
    UserActionInput,
} from "@/features/users/types/user.types";
export class UserFormatter {
    static fromDB(api: UserApi): User {
        return IdentityFormatter.fromDB(api);
    }
    static toDB(input: UserInput, creating: boolean): UserWriteApi {
        const profile = {
            username: input.username,
            email: input.email,
            first_name: input.firstName,
            last_name: input.lastName,
        };
        return creating ? { ...profile, password: input.password, role: input.role } : profile;
    }
    static filtersToDB(input: UserListInput) {
        return {
            page: input.page,
            per_page: input.pageSize,
            q: input.search || undefined,
            role: input.role,
            is_active: input.isActive === undefined ? undefined : input.isActive ? "1" : "0",
            order_by: "-created",
        };
    }
    static roleToDB(input: UserActionInput) {
        return { role: input.role };
    }
    static passwordToDB(input: UserActionInput) {
        return {
            new_password: input.newPassword,
            ...(input.currentPassword ? { current_password: input.currentPassword } : {}),
        };
    }
}
