/*
  Warnings:

  - You are about to drop the `_PlayerMatches` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `player1Id` to the `matches` table without a default value. This is not possible if the table is not empty.
  - Added the required column `player2Id` to the `matches` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "_PlayerMatches_B_index";

-- DropIndex
DROP INDEX "_PlayerMatches_AB_unique";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "_PlayerMatches";
PRAGMA foreign_keys=on;

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
    "player1Id" INTEGER NOT NULL,
    "player2Id" INTEGER NOT NULL,
    "tournamentMatchId" INTEGER,
    "gameState" TEXT,
    CONSTRAINT "matches_player1Id_fkey" FOREIGN KEY ("player1Id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "matches_player2Id_fkey" FOREIGN KEY ("player2Id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "matches_tournamentMatchId_fkey" FOREIGN KEY ("tournamentMatchId") REFERENCES "tournament_matches" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_matches" ("createdAt", "gameState", "id", "player1Score", "player2Score", "status", "tournamentMatchId", "updatedAt") SELECT "createdAt", "gameState", "id", "player1Score", "player2Score", "status", "tournamentMatchId", "updatedAt" FROM "matches";
DROP TABLE "matches";
ALTER TABLE "new_matches" RENAME TO "matches";
CREATE UNIQUE INDEX "matches_tournamentMatchId_key" ON "matches"("tournamentMatchId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
