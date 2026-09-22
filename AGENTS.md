# CampusHub Backend — Agent Instructions

## 1. Tech Stack and Dependencies

- Use Node.js, TypeScript, Express, MongoDB, and Mongoose.
- Write application source code in TypeScript (.ts); do not create
  handwritten JavaScript (.js) files. Compiled output belongs in dist/.
- Authorized runtime packages: express and mongoose.
- Authorized development packages: typescript, ts-node, @types/node,
  @types/express, eslint, prettier, typescript-eslint, and @eslint/js.
- Do not add other dependencies without explaining why and obtaining
  the project owner's approval.

## 2. Architecture

- src/routes/: route definitions and middleware mapping only.
  Do not put business logic or database queries here.
- src/controllers/: handle HTTP requests, responses, and status codes.
  Delegate business logic to services; never query the database directly.
- src/services/: implement business logic and database operations through
  Mongoose models. Do not depend on Express request or response objects.
- src/models/: define Mongoose schemas, models, and database interfaces only.
- src/middleware/: shared request processing and error handling.
- src/app.ts: configure the Express application and register middleware
  and routes. Keep business logic out of this file.
- Follow the dependency direction: routes -> controllers -> services -> models.

## 3. Coding Standards and Safety

- Enable strict TypeScript checking.
- Explicitly type every function's parameters and return value.
- Define named TypeScript interfaces for structured function inputs,
  outputs, API payloads, and database records.
- Do not use explicit or implicit any. Use unknown with type narrowing
  when a value's type is not yet known.
- Handle all asynchronous errors. Await or explicitly handle promises,
  and forward request errors to centralized Express error middleware.
- Never expose stack traces or secrets in API responses.
- Use ESLint and Prettier to check code quality and formatting.
- Keep credentials in environment variables; never hard-code secrets.
- Ignore node_modules/, dist/, and .env in Git.
- Provide .env-example with placeholder values only.

## 4. Git and Change Summaries

- Use concise commit messages, such as feat:, fix:, docs:, and chore:.
- Keep changes focused on the requested task.
- Provide a concise PR or diff summary explaining what changed,
  why it changed, and how the context rules were applied.
- Report checks actually run and their results.
  Explicitly state when a check has not been run.
- Do not weaken these rules just to make generated code pass.
