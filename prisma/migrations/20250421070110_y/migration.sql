/*
  Warnings:

  - You are about to drop the column `endTime` on the `matches` table. All the data in the column will be lost.
  - You are about to drop the column `startTime` on the `matches` table. All the data in the column will be lost.
  - You are about to drop the column `endTime` on the `tournaments` table. All the data in the column will be lost.
  - You are about to drop the column `startTime` on the `tournaments` table. All the data in the column will be lost.
  - You are about to drop the column `displayName` on the `users` table. All the data in the column will be lost.
  - Added the required column `name` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_matches" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "player1Score" INTEGER NOT NULL DEFAULT 0,
    "player2Score" INTEGER NOT NULL DEFAULT 0,
    "tournamentMatchId" INTEGER,
    "gameState" TEXT,
    CONSTRAINT "matches_tournamentMatchId_fkey" FOREIGN KEY ("tournamentMatchId") REFERENCES "tournament_matches" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_matches" ("createdAt", "gameState", "id", "player1Score", "player2Score", "status", "tournamentMatchId", "updatedAt") SELECT "createdAt", "gameState", "id", "player1Score", "player2Score", "status", "tournamentMatchId", "updatedAt" FROM "matches";
DROP TABLE "matches";
ALTER TABLE "new_matches" RENAME TO "matches";
CREATE UNIQUE INDEX "matches_tournamentMatchId_key" ON "matches"("tournamentMatchId");
CREATE TABLE "new_tournaments" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_tournaments" ("createdAt", "id", "name", "status", "type", "updatedAt") SELECT "createdAt", "id", "name", "status", "type", "updatedAt" FROM "tournaments";
DROP TABLE "tournaments";
ALTER TABLE "new_tournaments" RENAME TO "tournaments";
CREATE TABLE "new_users" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "image" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
    "googleId" TEXT,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorSecret" TEXT,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "lastSeen" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_users" ("createdAt", "email", "googleId", "id", "image", "isOnline", "lastSeen", "losses", "twoFactorEnabled", "twoFactorSecret", "updatedAt", "wins") SELECT "createdAt", "email", "googleId", "id", "image", "isOnline", "lastSeen", "losses", "twoFactorEnabled", "twoFactorSecret", "updatedAt", "wins" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_name_key" ON "users"("name");
CREATE UNIQUE INDEX "users_googleId_key" ON "users"("googleId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
