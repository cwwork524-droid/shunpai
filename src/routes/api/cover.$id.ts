import { createFileRoute } from "@tanstack/react-router";
import { listingCoverResponse } from "@/lib/auction/server";

export const Route = createFileRoute("/api/cover/$id")({
  server: {
    handlers: {
      GET: async ({ params }) => listingCoverResponse(Number.parseInt(params.id, 10)),
      HEAD: async ({ params }) => {
        const res = await listingCoverResponse(Number.parseInt(params.id, 10));
        return new Response(null, { status: res.status, headers: res.headers });
      },
    },
  },
});
