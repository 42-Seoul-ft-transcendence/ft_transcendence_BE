/*
  Warnings:

  - You are about to drop the `_TournamentMatchPlayers` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `game_logs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tournament_matches` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `gameState` on the `matches` table. All the data in the column will be lost.
  - You are about to drop the column `player1Id` on the `matches` table. All the data in the column will be lost.
  - You are about to drop the column `player1Score` on the `matches` table. All the data in the column will be lost.
  - You are about to drop the column `player2Id` on the `matches` table. All the data in the column will be lost.
  - You are about to drop the column `player2Score` on the `matches` table. All the data in the column will be lost.
  - You are about to drop the column `tournamentMatchId` on the `matches` table. All the data in the column will be lost.
  - Added the required column `tournamentId` to the `matches` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "_TournamentMatchPlayers_B_index";

-- DropIndex
DROP INDEX "_TournamentMatchPlayers_AB_unique";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "_TournamentMatchPlayers";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "game_logs";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "tournament_matches";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "match_users" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "matchId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "isWinner" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "match_users_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matches" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "match_users_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_matches" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tournamentId" INTEGER NOT NULL,
    "round" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "matches_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "tournaments" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_matches" ("createdAt", "id", "status", "updatedAt") SELECT "createdAt", "id", "status", "updatedAt" FROM "matches";
DROP TABLE "matches";
ALTER TABLE "new_matches" RENAME TO "matches";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "match_users_matchId_userId_key" ON "match_users"("matchId", "userId");
