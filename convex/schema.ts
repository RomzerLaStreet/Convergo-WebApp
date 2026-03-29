import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  groups: defineTable({
    name: v.string(),
    inviteToken: v.string(),
    createdBy: v.string(),
  }).index("by_inviteToken", ["inviteToken"]),

  groupMembers: defineTable({
    groupId: v.id("groups"),
    userId: v.string(),
    displayName: v.string(),
    avatarEmoji: v.string(),
    joinedAt: v.number(),
  })
    .index("by_groupId", ["groupId"])
    .index("by_userId", ["userId"]),

  events: defineTable({
    groupId: v.id("groups"),
    title: v.string(),
    status: v.union(
      v.literal("open"),
      v.literal("confirmed"),
      v.literal("cancelled")
    ),
    createdBy: v.string(),
  }).index("by_groupId", ["groupId"]),

  eventDates: defineTable({
    eventId: v.id("events"),
    date: v.string(),
  }).index("by_eventId", ["eventId"]),

  availabilities: defineTable({
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
  })
    .index("by_eventDateId", ["eventDateId"])
    .index("by_eventDateId_and_userId", ["eventDateId", "userId"]),
});
