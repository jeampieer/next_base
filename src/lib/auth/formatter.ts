import type { IdentityApi, Identity } from "@/lib/auth/types";
import { mapBase } from "@/lib/api/response";
export class IdentityFormatter {
    static fromDB(api: IdentityApi): Identity {
        return {
            ...mapBase(api),
            username: api.username,
            email: api.email,
            firstName: api.first_name,
            lastName: api.last_name,
            role: api.role,
            lastLogin: api.last_login,
            lastPasswordChange: api.last_password_change,
        };
    }
}
