import { z } from "zod";
import { forgotPasswordSchema, loginSchema, registerSchema, resetPasswordSchema } from "@/modules/auth/auth.schemas";
import { changeAccountTypeSchema } from "@/modules/admin/admin.schemas";
import { updateProfileSchema } from "@/modules/profiles/profiles.schemas";
import { ASSESSMENT_DOMAINS, DIFFICULTIES ,TOPIC_CODES, TOPIC_LABELS } from "@/modules/questions/questions.constants";

/**
 * The OpenAPI (Swagger) description of our API, served at /api/openapi.json and
 * rendered by Swagger UI at /api/docs.
 *
 * Request bodies are generated FROM THE SAME ZOD SCHEMAS the routes validate with,
 * so the documented rules (lengths, enums, "no extra fields") cannot drift from
 * the real ones. Responses are written by hand below: when you add or change an
 * endpoint, update this file too (see docs/ARCHITECTURE.md, "How to extend").
 */

type Json = Record<string, unknown>;

/** Zod schema -> JSON Schema (what the API accepts), without the `$schema` marker. */
function fromZod(schema: z.ZodType, patch: (s: Json) => Json = (s) => s): Json {
  const generated = z.toJSONSchema(schema, { io: "input", target: "draft-2020-12" }) as Json;
  delete generated.$schema;
  return patch(generated);
}

/** Zod's output drops `format: email` (our email schema trims and lowercases first). Put it back. */
function withEmailFormat(s: Json): Json {
  const props = s.properties as Record<string, Json>;
  return { ...s, properties: { ...props, email: { ...props.email, format: "email", maxLength: 254 } } };
}

const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });
const jsonBody = (schema: Json, example?: unknown) => ({
  required: true,
  content: { "application/json": { schema, ...(example === undefined ? {} : { example }) } },
});
const success = (description: string, schema: Json, example?: unknown) => ({
  description,
  content: { "application/json": { schema, ...(example === undefined ? {} : { example }) } },
});

// ── Error responses ──────────────────────────────────────────────────────────

/** [HTTP status, error code, example message, optional example details] */
type ErrorSpec = [number, string, string, unknown?];

/**
 * Every error the API can return, in one place. `errors([...])` turns a list of
 * (status, code, message) into the `responses` entries: one response per status,
 * with one named example per possible code.
 */
const E = {
  validation: [400, "VALIDATION_ERROR", "The request is invalid.", [{ path: "email", message: "Enter a valid email address" }]],
  invalidJson: [400, "INVALID_JSON", "Request body must be valid JSON."],
  invalidRole: [400, "INVALID_DEVELOPER_ROLE", "Unknown developer role."],
  captcha: [400, "CAPTCHA_FAILED", "Captcha verification failed. Please try again."],
  weakPassword: [400, "WEAK_PASSWORD", "This password is too weak."],
  samePassword: [400, "SAME_PASSWORD", "The new password must be different from the old one."],
  authRejected: [400, "AUTH_REJECTED", "The authentication request was rejected."],
  unauthenticated: [401, "UNAUTHENTICATED", "Authentication is required."],
  accountGone: [401, "ACCOUNT_NOT_FOUND", "This account no longer exists."],
  invalidCredentials: [401, "INVALID_CREDENTIALS", "Invalid email or password."],
  sessionInvalid: [401, "SESSION_INVALID", "Your session is invalid or has expired."],
  resetLinkInvalid: [401, "RESET_LINK_INVALID", "The reset link is invalid or has expired."],
  adminRequired: [403, "ADMIN_REQUIRED", "Administrator access is required."],
  badOrigin: [403, "BAD_ORIGIN", "Cross-origin requests are not allowed."],
  emailNotConfirmed: [403, "EMAIL_NOT_CONFIRMED", "Please confirm your email address first."],
  accountDisabled: [403, "ACCOUNT_DISABLED", "This account is disabled."],
  userNotFound: [404, "USER_NOT_FOUND", "User not found."],
  cannotModifySelf: [409, "CANNOT_MODIFY_SELF", "You cannot change your own account type."],
  rateLimited: [429, "RATE_LIMITED", "Too many requests. Please try again later."],
  internal: [500, "INTERNAL_ERROR", "Something went wrong on our side."],
  upstream: [502, "UPSTREAM_ERROR", "The authentication service is unavailable. Please try again."],
} satisfies Record<string, ErrorSpec>;

const STATUS_TEXT: Record<number, string> = {
  400: "Bad request",
  401: "Not authenticated",
  403: "Forbidden",
  404: "Not found",
  409: "Conflict",
  429: "Too many requests",
  500: "Server error",
  502: "Upstream service failed",
};

function errors(list: ErrorSpec[]): Json {
  const byStatus = new Map<number, ErrorSpec[]>();
  for (const spec of list) byStatus.set(spec[0], [...(byStatus.get(spec[0]) ?? []), spec]);

  const responses: Json = {};
  for (const [status, specs] of [...byStatus].sort(([a], [b]) => a - b)) {
    responses[String(status)] = {
      description: `${STATUS_TEXT[status] ?? "Error"}. Possible codes: ${specs.map(([, code]) => `\`${code}\``).join(", ")}.`,
      content: {
        "application/json": {
          schema: ref("ErrorResponse"),
          examples: Object.fromEntries(
            specs.map(([, code, message, details]) => [
              code,
              { summary: code, value: { error: { code, message, ...(details ? { details } : {}) } } },
            ]),
          ),
        },
      },
    };
  }
  return responses;
}

// ── Reusable pieces ──────────────────────────────────────────────────────────

const captchaNote =
  "Requires a Cloudflare Turnstile token in `captchaToken`. With Cloudflare's TEST keys use `XXXX.DUMMY.TOKEN.XXXX`.";

const exampleProfile = {
  id: "5b0d1f0e-6f5a-4c7e-9d34-0a2f6f1c9b11",
  email: "alice@example.com",
  displayName: "Alice Example",
  accountType: "user",
  developerRole: { code: "frontend_developer", label: "Frontend Developer" },
  targetSeniority: "mid",
  yearsOfExperience: 3,
  createdAt: "2026-11-03T10:15:00.000Z",
  updatedAt: "2026-11-03T10:15:00.000Z",
};

const idParam = {
  name: "id",
  in: "path",
  required: true,
  description: "The user's id (a UUID).",
  schema: { type: "string", format: "uuid" },
  example: "5b0d1f0e-6f5a-4c7e-9d34-0a2f6f1c9b11",
};

const cookieAuth = [{ cookieAuth: [] }];
const noAuth: unknown[] = [];

// ── The document ─────────────────────────────────────────────────────────────

export function buildOpenApiSpec(serverUrl: string): Json {
  return {
    openapi: "3.1.0",
    info: {
      title: "Orbit API",
      version: "1.0.0",
      description: [
        "Authentication and user-management API for Orbit.",
        "",
        "**Envelope.** Success: `{ \"data\": ... }`. Error: `{ \"error\": { \"code\", \"message\", \"details?\" } }`. Every response is sent with `Cache-Control: no-store`.",
        "",
        "**Authentication.** Log in with `POST /api/auth/login`; the server sets HTTP-only session cookies and the browser sends them on later requests. There is no token to copy. In this page, call *login* first with **Try it out**, then the protected endpoints work (same origin).",
        "",
        "**Captcha.** Register, login and forgot-password need a Turnstile token (`captchaToken`).",
        "",
        "**CSRF.** For POST, PATCH and DELETE, if the browser sends an `Origin` header it must equal the app's own URL, otherwise `403 BAD_ORIGIN`. Tools such as curl send none and are unaffected.",
      ].join("\n"),
    },
    servers: [{ url: serverUrl, description: "This server" }],
    tags: [
      { name: "System", description: "Health and lookup data." },
      { name: "Auth", description: "Registration, login, sessions, password reset." },
      { name: "Profile", description: "The logged-in user's own profile." },
      { name: "Questions", description: "The question bank. Requires a signed-in user." },
      { name: "Admin", description: "Administrator-only operations. 401 if not logged in, 403 `ADMIN_REQUIRED` if not an admin." },
    ],
    paths: {
      "/api/health": {
        get: {
          tags: ["System"],
          summary: "Is the app up, and can it reach the database?",
          security: noAuth,
          responses: {
            "200": success("Everything works.", {
              type: "object",
              properties: { data: { type: "object", properties: { status: { type: "string", enum: ["ok"] } } } },
            }, { data: { status: "ok" } }),
            ...errors([E.internal]),
          },
        },
      },

      "/api/developer-roles": {
        get: {
          tags: ["System"],
          summary: "List the developer roles",
          description: "Active roles, in display order. Public: used to fill the dropdown on the registration form.",
          security: noAuth,
          responses: {
            "200": success(
              "The active roles.",
              { type: "object", properties: { data: { type: "array", items: ref("DeveloperRole") } } },
              { data: [{ code: "frontend_developer", label: "Frontend Developer" }, { code: "other", label: "Other" }] },
            ),
            ...errors([E.internal]),
          },
        },
      },

      "/api/auth/register": {
        post: {
          tags: ["Auth"],
          summary: "Create an account",
          description: [
            "Always creates a regular `user`; there is no way to register as an admin.",
            "Supabase then emails a confirmation link (when email confirmation is on).",
            "",
            "The response is the same `202` whether or not the email is already registered, so the endpoint cannot be used to discover which emails have accounts.",
            "",
            captchaNote,
          ].join("\n"),
          security: noAuth,
          requestBody: jsonBody(ref("RegisterRequest"), {
            email: "alice@example.com",
            password: "Passw0rdPassw0rd",
            displayName: "Alice Example",
            developerRole: "frontend_developer",
            targetSeniority: "mid",
            yearsOfExperience: 3,
            captchaToken: "XXXX.DUMMY.TOKEN.XXXX",
          }),
          responses: {
            "202": success("Accepted. The user must confirm their email before logging in.", ref("MessageResponse"), {
              data: { message: "Check your email to confirm your account." },
            }),
            ...errors([
              E.validation, E.invalidJson, E.invalidRole, E.captcha, E.weakPassword, E.authRejected,
              E.badOrigin, E.rateLimited, E.internal, E.upstream,
            ]),
          },
        },
      },

      "/api/auth/login": {
        post: {
          tags: ["Auth"],
          summary: "Log in",
          description: `Sets the session cookies and returns the user's profile. The tokens are never in the body.\n\n${captchaNote}`,
          security: noAuth,
          requestBody: jsonBody(ref("LoginRequest"), {
            email: "alice@example.com",
            password: "Passw0rdPassw0rd",
            captchaToken: "XXXX.DUMMY.TOKEN.XXXX",
          }),
          responses: {
            "200": {
              ...success("Logged in. The `Set-Cookie` headers carry the session.", ref("ProfileResponse"), { data: exampleProfile }),
              headers: { "Set-Cookie": { description: "Session cookies (`sb-...-auth-token`), HttpOnly.", schema: { type: "string" } } },
            },
            ...errors([
              E.validation, E.invalidJson, E.captcha, E.authRejected,
              E.invalidCredentials, E.accountGone,
              E.emailNotConfirmed, E.accountDisabled, E.badOrigin,
              E.rateLimited, E.internal, E.upstream,
            ]),
          },
        },
      },

      "/api/auth/logout": {
        post: {
          tags: ["Auth"],
          summary: "Log out",
          description: "Ends the session and clears the cookies. Safe to call when not logged in.",
          security: noAuth,
          responses: {
            "204": { description: "Logged out. No body." },
            ...errors([E.badOrigin, E.internal]),
          },
        },
      },

      "/api/auth/forgot-password": {
        post: {
          tags: ["Auth"],
          summary: "Send a password-reset email",
          description: `Always answers \`202\`, even for an unknown email, so it cannot be used to find out who has an account. Only captcha and rate-limit problems are reported.\n\n${captchaNote}`,
          security: noAuth,
          requestBody: jsonBody(ref("ForgotPasswordRequest"), {
            email: "alice@example.com",
            captchaToken: "XXXX.DUMMY.TOKEN.XXXX",
          }),
          responses: {
            "202": success("Accepted.", ref("MessageResponse"), {
              data: { message: "If an account exists for this email, a reset link has been sent." },
            }),
            ...errors([E.validation, E.invalidJson, E.captcha, E.badOrigin, E.rateLimited, E.internal]),
          },
        },
      },

      "/api/auth/reset-password": {
        post: {
          tags: ["Auth"],
          summary: "Set a new password",
          description:
            "Needs the short-lived **recovery session** created when the user clicks the link in the reset email (`GET /auth/confirm`). On success all OTHER devices are signed out.",
          security: cookieAuth,
          requestBody: jsonBody(ref("ResetPasswordRequest"), { password: "NewPassw0rd123" }),
          responses: {
            "200": success("Password changed.", ref("MessageResponse"), { data: { message: "Your password has been updated." } }),
            ...errors([
              E.validation, E.invalidJson, E.weakPassword, E.samePassword, E.authRejected,
              E.resetLinkInvalid, E.sessionInvalid, E.badOrigin, E.rateLimited, E.internal, E.upstream,
            ]),
          },
        },
      },

      "/api/questions": {
        get: {
          tags: ["Questions"],
          summary: "List questions by assessment domain and topic",
          description: [
            "Returns every **published** question for the chosen `assessmentDomain` and `topic` (an empty list is a valid answer). If a question has several versions, only the newest is returned.",
            "",
            "Only candidate-visible fields are returned. Expected answers, rubrics, validation notes and access rules never leave the server (the database role used for this call is not even allowed to read those columns).",
            "",
            "Voice follow-up templates (AI prompt patterns) are not included.",
            "",
            "Topic codes: " + TOPIC_CODES.map((c) => `\`${c}\` (${TOPIC_LABELS[c]})`).join(", ") + ".",
          ].join("\n"),
          security: cookieAuth,
          parameters: [
            { name: "difficulty", in: "query", required: false, schema: { type: "string", enum: [...DIFFICULTIES] }, description: "Optional. Leave out to get every difficulty." },
            { name: "assessmentDomain", in: "query", required: true, schema: { type: "string", enum: [...ASSESSMENT_DOMAINS] } },
            { name: "topic", in: "query", required: true, schema: { type: "string", enum: [...TOPIC_CODES] } },
          ],
          responses: {
            "200": success("The matching questions (possibly none).", ref("QuestionListResponse"), {
              data: [
                {
                  questionId: "COD-01",
                  version: 1,
                  questionType: "coding_challenge",
                  assessmentDomain: "practice",
                  topic: { code: "javascript", label: "JavaScript" },
                  competency: { id: "FE-01", name: "JavaScript fundamentals" },
                  title: "Remove duplicates while preserving order",
                  prompt: "Implement a function that returns unique array values in first-occurrence order.",
                  starterCode: "function uniqueInOrder(values) {}",
                  visibleExample: "[3,1,3,2,1] => [3,1,2]",
                  difficulty: "easy",
                  targetProficiency: "developing",
                  tags: ["javascript", "fe-01"],
                },
              ],
            }),
            ...errors([E.validation, E.unauthenticated, E.internal]),
          },
        },
      },

      "/api/me": {
        get: {
          tags: ["Profile"],
          summary: "Get my profile",
          security: cookieAuth,
          responses: {
            "200": success("The logged-in user's profile.", ref("ProfileResponse"), { data: exampleProfile }),
            ...errors([E.unauthenticated, E.accountGone, E.internal]),
          },
        },
        patch: {
          tags: ["Profile"],
          summary: "Update my profile",
          description: [
            "Send any non-empty subset of the four editable fields.",
            "",
            "Any other field (for example `accountType` or `email`) is rejected with `400 VALIDATION_ERROR`: users can never change their own account type.",
          ].join("\n"),
          security: cookieAuth,
          requestBody: jsonBody(ref("UpdateProfileRequest"), {
            displayName: "Alice Updated",
            developerRole: "full_stack_developer",
            targetSeniority: "senior",
            yearsOfExperience: 4,
          }),
          responses: {
            "200": success("The updated profile.", ref("ProfileResponse"), {
              data: { ...exampleProfile, displayName: "Alice Updated", targetSeniority: "senior", yearsOfExperience: 4 },
            }),
            ...errors([
              [400, "VALIDATION_ERROR", "The request is invalid.", [{ path: "", message: "Unrecognized key: \"accountType\"" }]],
              E.invalidJson, E.invalidRole,
              E.unauthenticated, E.accountGone, E.badOrigin, E.internal,
            ]),
          },
        },
      },

      "/api/admin/users": {
        get: {
          tags: ["Admin"],
          summary: "List users",
          description: "Newest first. `search` matches the display name or the email (case-insensitive).",
          security: cookieAuth,
          parameters: [
            { name: "page", in: "query", schema: { type: "integer", minimum: 1, default: 1 } },
            { name: "pageSize", in: "query", schema: { type: "integer", minimum: 1, maximum: 100, default: 20 } },
            { name: "search", in: "query", schema: { type: "string", maxLength: 100 }, example: "alice" },
          ],
          responses: {
            "200": success("One page of users.", ref("AdminUserListResponse"), {
              data: {
                items: [
                  {
                    id: exampleProfile.id,
                    email: "alice@example.com",
                    displayName: "Alice Example",
                    accountType: "user",
                    developerRole: "frontend_developer",
                    targetSeniority: "mid",
                    yearsOfExperience: 3,
                    emailConfirmedAt: "2026-11-03T10:20:00.000Z",
                    lastSignInAt: "2026-11-03T10:21:00.000Z",
                    createdAt: "2026-11-03T10:15:00.000Z",
                  },
                ],
                page: 1,
                pageSize: 20,
                total: 1,
              },
            }),
            ...errors([E.validation, E.unauthenticated, E.accountGone, E.adminRequired, E.internal]),
          },
        },
      },

      "/api/admin/users/{id}/account-type": {
        patch: {
          tags: ["Admin"],
          summary: "Promote a user to admin, or demote an admin",
          description:
            "The only way to create admins after the first one (which is created by `npm run admin:bootstrap`). An admin cannot change their own account type. The change is written to `audit_logs` in the same transaction.",
          security: cookieAuth,
          parameters: [idParam],
          requestBody: jsonBody(ref("ChangeAccountTypeRequest"), { accountType: "admin" }),
          responses: {
            "200": success("The new account type.", ref("AccountTypeResponse"), {
              data: { id: exampleProfile.id, accountType: "admin" },
            }),
            ...errors([
              E.validation, E.invalidJson,
              E.unauthenticated, E.accountGone,
              E.adminRequired, E.badOrigin,
              E.userNotFound, E.cannotModifySelf, E.internal,
            ]),
          },
        },
      },

      "/api/admin/users/{id}": {
        delete: {
          tags: ["Admin"],
          summary: "Delete a user permanently",
          description:
            "Deletes the Supabase Auth user; the profile is removed by `ON DELETE CASCADE`. An admin cannot delete themselves. The action is written to `audit_logs`, which keeps the entry after the user is gone.",
          security: cookieAuth,
          parameters: [idParam],
          responses: {
            "204": { description: "Deleted. No body." },
            ...errors([
              E.validation,
              E.unauthenticated, E.accountGone,
              E.adminRequired, E.badOrigin,
              E.userNotFound,
              [409, "CANNOT_MODIFY_SELF", "You cannot delete your own account."],
              E.internal, E.upstream,
            ]),
          },
        },
      },

      "/auth/confirm": {
        get: {
          tags: ["Auth"],
          summary: "Target of the links in our emails (not called with fetch)",
          description:
            "Exchanges the one-time `token_hash` from a confirm-signup or reset-password email for a session cookie, then redirects. Opened by the user's browser, not by your frontend code.\n\nOn success the redirect goes to `next` (only a path on our own site is accepted); on an invalid, expired or already-used link it goes to `/?auth_error=invalid_or_expired_link`.",
          security: noAuth,
          parameters: [
            { name: "token_hash", in: "query", required: true, schema: { type: "string" } },
            { name: "type", in: "query", required: true, schema: { type: "string", enum: ["email", "signup", "recovery", "invite", "email_change"] } },
            { name: "next", in: "query", schema: { type: "string", default: "/" }, description: "Where to go afterwards. Must start with `/`." },
          ],
          responses: {
            "307": {
              description: "Redirect. `Location` is `next` on success, or `/?auth_error=invalid_or_expired_link` on failure.",
              headers: { Location: { schema: { type: "string" } } },
            },
          },
        },
      },
    },
    components: {
      securitySchemes: {
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "sb-<project-ref>-auth-token",
          description:
            "Session cookie set by `POST /api/auth/login`. You never set it by hand: log in through this page (or any browser tab on the same origin) and the browser sends it automatically.",
        },
      },
      schemas: {
        RegisterRequest: fromZod(registerSchema, withEmailFormat),
        LoginRequest: fromZod(loginSchema, withEmailFormat),
        ForgotPasswordRequest: fromZod(forgotPasswordSchema, withEmailFormat),
        ResetPasswordRequest: fromZod(resetPasswordSchema),
        UpdateProfileRequest: fromZod(updateProfileSchema, (s) => ({ ...s, minProperties: 1 })),
        ChangeAccountTypeRequest: fromZod(changeAccountTypeSchema),

        DeveloperRole: {
          type: "object",
          required: ["code", "label"],
          properties: { code: { type: "string", example: "frontend_developer" }, label: { type: "string", example: "Frontend Developer" } },
        },
        Question: {
          type: "object",
          required: ["questionId", "version", "questionType", "assessmentDomain", "topic", "competency", "title", "prompt", "starterCode", "visibleExample", "difficulty", "targetProficiency", "tags"],
          properties: {
            questionId: { type: "string", example: "COD-01" },
            version: { type: "integer", minimum: 1 },
            questionType: { type: "string", enum: ["technical_knowledge", "coding_challenge", "behavioural", "system_design"] },
            assessmentDomain: { type: "string", enum: [...ASSESSMENT_DOMAINS] },
            topic: {
              type: "object",
              required: ["code", "label"],
              properties: { code: { type: "string", enum: [...TOPIC_CODES] }, label: { type: "string", example: "HTML/CSS" } },
            },
            competency: {
              type: "object",
              required: ["id", "name"],
              properties: { id: { type: "string", example: "FE-01" }, name: { type: "string", example: "JavaScript fundamentals" } },
            },
            title: { type: "string" },
            prompt: { type: "string" },
            starterCode: { type: ["string", "null"] },
            visibleExample: { type: ["string", "null"] },
            difficulty: { type: ["string", "null"], enum: ["easy", "medium", "hard", "adaptive", null] },
            targetProficiency: { type: ["string", "null"], enum: ["basic", "developing", "proficient", "advanced", "all_levels", null] },
            tags: { type: "array", items: { type: "string" } },
          },
        },
        QuestionListResponse: { type: "object", required: ["data"], properties: { data: { type: "array", items: ref("Question") } } },
        Profile: {
          type: "object",
          required: ["id", "email", "displayName", "accountType", "developerRole", "targetSeniority", "yearsOfExperience", "createdAt", "updatedAt"],
          properties: {
            id: { type: "string", format: "uuid" },
            email: { type: ["string", "null"], format: "email" },
            displayName: { type: "string" },
            accountType: { type: "string", enum: ["user", "admin"], description: "Permissions. Independent of `developerRole`." },
            developerRole: ref("DeveloperRole"),
            targetSeniority: { type: "string", enum: ["junior", "mid", "senior"] },
            yearsOfExperience: { type: "integer", minimum: 0, maximum: 60 },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        ProfileResponse: { type: "object", required: ["data"], properties: { data: ref("Profile") } },
        MessageResponse: {
          type: "object",
          required: ["data"],
          properties: { data: { type: "object", required: ["message"], properties: { message: { type: "string" } } } },
        },
        AccountTypeResponse: {
          type: "object",
          required: ["data"],
          properties: {
            data: {
              type: "object",
              required: ["id", "accountType"],
              properties: { id: { type: "string", format: "uuid" }, accountType: { type: "string", enum: ["user", "admin"] } },
            },
          },
        },
        AdminUser: {
          type: "object",
          required: ["id", "email", "displayName", "accountType", "developerRole", "targetSeniority", "yearsOfExperience", "emailConfirmedAt", "lastSignInAt", "createdAt"],
          properties: {
            id: { type: "string", format: "uuid" },
            email: { type: ["string", "null"], format: "email" },
            displayName: { type: "string" },
            accountType: { type: "string", enum: ["user", "admin"] },
            developerRole: { type: "string", description: "The role CODE, e.g. `frontend_developer`." },
            targetSeniority: { type: "string", enum: ["junior", "mid", "senior"] },
            yearsOfExperience: { type: "integer" },
            emailConfirmedAt: { type: ["string", "null"], format: "date-time" },
            lastSignInAt: { type: ["string", "null"], format: "date-time" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        AdminUserListResponse: {
          type: "object",
          required: ["data"],
          properties: {
            data: {
              type: "object",
              required: ["items", "page", "pageSize", "total"],
              properties: {
                items: { type: "array", items: ref("AdminUser") },
                page: { type: "integer" },
                pageSize: { type: "integer" },
                total: { type: "integer", description: "Total matching users across all pages." },
              },
            },
          },
        },

        ValidationDetail: {
          type: "object",
          required: ["path", "message"],
          properties: {
            path: { type: "string", description: "The field, e.g. `password`. Empty for whole-body problems such as an unknown field." },
            message: { type: "string" },
          },
        },
        ErrorResponse: {
          type: "object",
          required: ["error"],
          properties: {
            error: {
              type: "object",
              required: ["code", "message"],
              properties: {
                code: { type: "string", description: "Stable machine-readable code. Branch on this, not on `message`.", example: "VALIDATION_ERROR" },
                message: { type: "string", description: "Human-readable text; wording may change." },
                details: { type: "array", items: ref("ValidationDetail"), description: "Only for `VALIDATION_ERROR`." },
              },
            },
          },
        },
      },
    },
  };
}
