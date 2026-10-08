import { createReviewHandler } from './core.mjs';
Deno.serve(createReviewHandler({ env: (name: string) => Deno.env.get(name) }));
