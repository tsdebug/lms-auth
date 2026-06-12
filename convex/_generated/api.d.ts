/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as ResendOTPPasswordReset from "../ResendOTPPasswordReset.js";
import type * as assignments_mutations from "../assignments/mutations.js";
import type * as assignments_queries from "../assignments/queries.js";
import type * as auth from "../auth.js";
import type * as certificates_queries from "../certificates/queries.js";
import type * as chapters_mutations from "../chapters/mutations.js";
import type * as chapters_queries from "../chapters/queries.js";
import type * as courses_mutations from "../courses/mutations.js";
import type * as courses_queries from "../courses/queries.js";
import type * as enrollments_mutations from "../enrollments/mutations.js";
import type * as enrollments_queries from "../enrollments/queries.js";
import type * as http from "../http.js";
import type * as lessons_mutations from "../lessons/mutations.js";
import type * as lessons_queries from "../lessons/queries.js";
import type * as lib_authorization from "../lib/authorization.js";
import type * as quizzes_mutations from "../quizzes/mutations.js";
import type * as quizzes_queries from "../quizzes/queries.js";
import type * as seed from "../seed.js";
import type * as users from "../users.js";
import type * as users_mutations from "../users/mutations.js";
import type * as users_queries from "../users/queries.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  ResendOTPPasswordReset: typeof ResendOTPPasswordReset;
  "assignments/mutations": typeof assignments_mutations;
  "assignments/queries": typeof assignments_queries;
  auth: typeof auth;
  "certificates/queries": typeof certificates_queries;
  "chapters/mutations": typeof chapters_mutations;
  "chapters/queries": typeof chapters_queries;
  "courses/mutations": typeof courses_mutations;
  "courses/queries": typeof courses_queries;
  "enrollments/mutations": typeof enrollments_mutations;
  "enrollments/queries": typeof enrollments_queries;
  http: typeof http;
  "lessons/mutations": typeof lessons_mutations;
  "lessons/queries": typeof lessons_queries;
  "lib/authorization": typeof lib_authorization;
  "quizzes/mutations": typeof quizzes_mutations;
  "quizzes/queries": typeof quizzes_queries;
  seed: typeof seed;
  users: typeof users;
  "users/mutations": typeof users_mutations;
  "users/queries": typeof users_queries;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
