export type ListingStatus = "active" | "sold" | "unsold" | "removed";

export type ListingCard = {
  id: number;
  title: string;
  coverImage: string | null;
  currentPrice: number;
  bidCount: number;
  endsAt: string;
  status: ListingStatus;
  popularityRank: number | null;
  createdAt: string;
  durationHours: number;
};

export type BidRow = {
  id: number;
  bidderId: string;
  bidderName: string;
  amount: number;
  createdAt: string;
};

export type ContactPerson = {
  userId: string;
  name: string;
  email: string | null;
  amount?: number;
};

export type ListingContacts = {
  topBuyers: ContactPerson[] | null;
  seller: ContactPerson | null;
};

export type BidIncrement = 5 | 10 | 50;

export type ListingDetail = {
  id: number;
  sellerId: string;
  sellerName: string;
  title: string;
  description: string;
  images: string[];
  websiteUrl: string | null;
  websiteName: string;
  youtubeUrl: string | null;
  startingPrice: number;
  currentPrice: number;
  bidCount: number;
  viewCount: number;
  endsAt: string;
  startsAt: string;
  durationHours: number;
  bidIncrements: BidIncrement[];
  status: ListingStatus;
  winnerId: string | null;
  createdAt: string;
  bids: BidRow[];
};

export type MineListing = ListingCard & {
  viewCount: number;
  startingPrice: number;
};

export type ProfileMe = {
  userId: string;
  displayName: string;
  isAdmin: boolean;
  isBlocked: boolean;
};

export type AdminUser = {
  userId: string;
  displayName: string;
  isAdmin: boolean;
  isBlocked: boolean;
  createdAt: string;
};

export type CreateListingInput = {
  title: string;
  description: string;
  images: string[];
  startingPrice: number;
  durationHours: 2 | 8;
  bidIncrements: BidIncrement[];
  websiteUrl: string;
  websiteName: string;
  youtubeUrl: string;
};
