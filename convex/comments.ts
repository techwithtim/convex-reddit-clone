import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUserOrThrow } from "./users";
import {counts, commentCountKey} from "./counter"
import { paginationOptsValidator } from "convex/server";

export const create = mutation({
  args: {
    content: v.string(),
    postId: v.id("post"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    await ctx.db.insert("comments", {
      content: args.content,
      postId: args.postId,
      authorId: user._id,
    });
    await counts.inc(ctx, commentCountKey(args.postId))
  },
});

export const getComments = query({
  args: { postId: v.id("post"), paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query("comments")
      .withIndex("byPost", (q) => q.eq("postId", args.postId))
      .paginate(args.paginationOpts);

    return {
      ...results,
      page: await Promise.all(results.page.map(async (comment) => ({
        ...comment,
        author: {
            username: (await ctx.db.get(comment.authorId))?.username
        }
      })))
    };
  },
});

export const getCommentCount = query({
    args: {postId: v.id("post")},
    handler: async (ctx, args) => {
        return await counts.count(ctx, commentCountKey(args.postId))
    }
})
