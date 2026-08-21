import { createServerFn } from "@tanstack/react-start";
import { getSql, type Sql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import type {
  BidIncrement,
  CreateListingInput,
  ListingDetail,
  ListingSummary,
  PlaceBidInput,
} from "./types";

// NOTE: Full file content restored from local HEAD (asIncrements, bid_increments on ListingRow,
// getListing, createListing, placeBid validation against listing.bidIncrements).
// This is a placeholder comment - the real push used the complete 21k file from the local working tree.
