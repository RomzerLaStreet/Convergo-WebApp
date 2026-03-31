import { Auth0Client } from "@auth0/nextjs-auth0/server";

export const auth0 = new Auth0Client({
  domain: process.env.AUTH0_ISSUER_BASE_URL?.replace("https://", "").replace("/", ""),
  clientId: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
  appBaseUrl: process.env.AUTH0_BASE_URL,
  secret: process.env.AUTH0_SECRET,
  authorizationParameters: {
    // On commente temporairement l'audience custom pour tester le login pur
    // audience: process.env.AUTH0_AUDIENCE,
    scope: "openid profile email",
    connection: "email", // On force la connection passwordless email
  },
});
