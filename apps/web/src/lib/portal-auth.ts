import { NextRequest } from "next/server";
import { prisma } from "@cjdquick/database";

export async function getPortalUserFromRequest(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.substring(7);

  const session = await prisma.brandUserSession.findUnique({
    where: { token },
    include: {
      user: {
        include: {
          brand: true,
        },
      },
    },
  });

  if (!session || !session.isActive || new Date() > session.expiresAt) {
    return null;
  }

  if (!session.user.isActive) {
    return null;
  }

  return session.user;
}
