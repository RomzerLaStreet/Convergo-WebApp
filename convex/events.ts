import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createEvent = mutation({
  args: {
    groupId: v.id("groups"),
    title: v.string(),
    userId: v.string(),
    dates: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const eventId = await ctx.db.insert("events", {
      groupId: args.groupId,
      title: args.title,
      status: "open",
      createdBy: args.userId,
    });
    for (const date of args.dates) {
      await ctx.db.insert("eventDates", {
        eventId,
        date,
      });
    }
    return eventId;
  },
});

export const getEvents = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    const events = await ctx.db
      .query("events")
      .withIndex("by_groupId", (q) => q.eq("groupId", args.groupId))
      .collect();
    return events;
  },
});

export const getEventDates = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("eventDates")
      .withIndex("by_eventId", (q) => q.eq("eventId", args.eventId))
      .collect();
  },
});

export const updateEventStatus = mutation({
  args: {
    eventId: v.id("events"),
    status: v.union(
      v.literal("open"),
      v.literal("confirmed"),
      v.literal("cancelled")
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.eventId, { status: args.status });
  },
});
