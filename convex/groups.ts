import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createGroup = mutation({
  args: {
    name: v.string(),
    userId: v.string(),
    displayName: v.string(),
    avatarEmoji: v.string(),
  },
  handler: async (ctx, args) => {
    const inviteToken = crypto.randomUUID().substring(0, 8);
    const groupId = await ctx.db.insert("groups", {
      name: args.name,
      inviteToken,
      createdBy: args.userId,
    });
    await ctx.db.insert("groupMembers", {
      groupId,
      userId: args.userId,
      displayName: args.displayName,
      avatarEmoji: args.avatarEmoji,
      joinedAt: Date.now(),
    });
    return { groupId, inviteToken };
  },
});

export const getMyGroups = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    if (!args.userId) return [];
    const memberships = await ctx.db
      .query("groupMembers")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();
    const groups = await Promise.all(
      memberships.map((m) => ctx.db.get(m.groupId))
    );
    return groups.filter((g) => g !== null);
  },
});

export const getGroupByInviteToken = query({
  args: { inviteToken: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("groups")
      .withIndex("by_inviteToken", (q) => q.eq("inviteToken", args.inviteToken))
      .unique();
  },
});

export const getGroupById = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.groupId);
  },
});

export const joinGroup = mutation({
  args: {
    groupId: v.id("groups"),
    userId: v.string(),
    displayName: v.string(),
    avatarEmoji: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("groupMembers")
      .withIndex("by_groupId", (q) => q.eq("groupId", args.groupId))
      .collect();
    if (existing.find((m) => m.userId === args.userId)) return "already_member";
    await ctx.db.insert("groupMembers", {
      groupId: args.groupId,
      userId: args.userId,
      displayName: args.displayName,
      avatarEmoji: args.avatarEmoji,
      joinedAt: Date.now(),
    });
    return "joined";
  },
});

export const getGroupMembers = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("groupMembers")
      .withIndex("by_groupId", (q) => q.eq("groupId", args.groupId))
      .collect();
  },
});
