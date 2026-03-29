import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const upsertAvailability = mutation({
  args: {
    eventDateId: v.id("eventDates"),
    userId: v.string(),
    slot: v.union(
      v.literal("morning"),
      v.literal("noon"),
      v.literal("afternoon"),
      v.literal("evening")
    ),
    status: v.union(
      v.literal("available"),
      v.literal("flexible"),
      v.literal("busy")
    ),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("availabilities")
      .withIndex("by_eventDateId_and_userId", (q) =>
        q.eq("eventDateId", args.eventDateId).eq("userId", args.userId)
      )
      .filter((q) => q.eq(q.field("slot"), args.slot))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, { status: args.status });
    } else {
      await ctx.db.insert("availabilities", {
        eventDateId: args.eventDateId,
        userId: args.userId,
        slot: args.slot,
        status: args.status,
      });
    }
  },
});

export const deleteAvailability = mutation({
  args: {
    eventDateId: v.id("eventDates"),
    userId: v.string(),
    slot: v.union(
      v.literal("morning"),
      v.literal("noon"),
      v.literal("afternoon"),
      v.literal("evening")
    ),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("availabilities")
      .withIndex("by_eventDateId_and_userId", (q) =>
        q.eq("eventDateId", args.eventDateId).eq("userId", args.userId)
      )
      .filter((q) => q.eq(q.field("slot"), args.slot))
      .first();
    if (existing) await ctx.db.delete(existing._id);
  },
});

export const getAvailabilitiesForEvent = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const dates = await ctx.db
      .query("eventDates")
      .withIndex("by_eventId", (q) => q.eq("eventId", args.eventId))
      .collect();
    const allAvailabilities = await Promise.all(
      dates.map((d) =>
        ctx.db
          .query("availabilities")
          .withIndex("by_eventDateId", (q) => q.eq("eventDateId", d._id))
          .collect()
      )
    );
    return {
      dates,
      availabilities: allAvailabilities.flat(),
    };
  },
});
