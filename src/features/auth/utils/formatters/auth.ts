import type {
    LoginApi,
    Login,
    ProfileInput,
    ProfileWriteApi,
    PasswordInput,
} from "@/features/auth/types/auth.types";
import { IdentityFormatter } from "@/lib/auth/formatter";
export class AuthFormatter {
    static fromDB(api: LoginApi): Login {
        return {
            access: api.access,
            refresh: api.refresh,
            user: IdentityFormatter.fromDB(api.user),
        };
    }
    static toDB(input: ProfileInput): ProfileWriteApi {
        return { email: input.email, first_name: input.firstName, last_name: input.lastName };
    }
    static passwordToDB(input: PasswordInput) {
        return { current_password: input.currentPassword, new_password: input.newPassword };
    }
}
