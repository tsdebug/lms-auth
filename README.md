# Welcome to your Convex + Next.js + Convex Auth app

This is a [Convex](https://convex.dev/) project created with [`npm create convex`](https://www.npmjs.com/package/create-convex).

After the initial setup (<2 minutes) you'll have a working full-stack app using:

- Convex as your backend (database, server logic)
- [React](https://react.dev/) as your frontend (web page interactivity)
- [Next.js](https://nextjs.org/) for optimized web hosting and page routing
- [Tailwind](https://tailwindcss.com/) for building great looking accessible UI
- [Convex Auth](https://labs.convex.dev/auth) for authentication

## Get started

If you just cloned this codebase and didn't use `npm create convex`, run:

```
npm install
npm run dev
```

## GitHub OAuth deployment

GitHub OAuth is handled by Convex Auth. Configure the following in the same
Convex deployment used by the deployed site:

```text
AUTH_GITHUB_ID=<GitHub OAuth app client ID>
AUTH_GITHUB_SECRET=<GitHub OAuth app client secret>
```

In the GitHub OAuth app, set the callback URL to:

```text
https://<your-convex-deployment>.convex.site/api/auth/callback/github
```

For Vercel, set `NEXT_PUBLIC_CONVEX_URL` to the matching Convex cloud URL and
redeploy. The `307` responses during sign-in are expected redirects in the
OAuth flow; an OAuth failure usually appears as a GitHub callback or Convex
Auth error after the redirect.

If you're reading this README on GitHub and want to use this template, run:

```
npm create convex@latest -- -t nextjs-convexauth
```

## Learn more

To learn more about developing your project with Convex, check out:

- The [Tour of Convex](https://docs.convex.dev/get-started) for a thorough introduction to Convex principles.
- The rest of [Convex docs](https://docs.convex.dev/) to learn about all Convex features.
- [Stack](https://stack.convex.dev/) for in-depth articles on advanced topics.
- [Convex Auth docs](https://labs.convex.dev/auth) for documentation on the Convex Auth library.

## Configuring other authentication methods

To configure different authentication methods, see [Configuration](https://labs.convex.dev/auth/config) in the Convex Auth docs.

## Join the community

Join thousands of developers building full-stack apps with Convex:

- Join the [Convex Discord community](https://convex.dev/community) to get help in real-time.
- Follow [Convex on GitHub](https://github.com/get-convex/), star and contribute to the open-source implementation of Convex.
