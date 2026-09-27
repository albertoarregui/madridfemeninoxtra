import type { APIRoute } from "astro";

// Keep existing search results and bookmarks pointing at the new homepage.
const redirectHome: APIRoute = ({ redirect }) => redirect("/", 301);

export const GET = redirectHome;
export const HEAD = redirectHome;
