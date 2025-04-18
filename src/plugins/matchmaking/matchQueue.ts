import { EventEmitter } from 'events';
import { MatchMode, Player } from '../../types/matchMaking';

export const MATCH_CAPACITY = {
  [MatchMode.TWO_PLAYER]: 2,
  [MatchMode.FOUR_PLAYER]: 4,
};

export class MatchQueue extends EventEmitter {
  private queues: Map<MatchMode, Set<number>> = new Map();
  private playerInfo: Map<number, Player> = new Map();

  constructor() {
    super();
    Object.values(MatchMode).forEach((mode) => {
      this.queues.set(mode, new Set());
    });
  }

  addPlayer(mode: MatchMode, player: Player) {
    if (this.playerInfo.has(player.id)) return;

    const queue = this.queues.get(mode);
    if (!queue) return;

    queue.add(player.id);
    this.playerInfo.set(player.id, player);

    if (queue.size >= MATCH_CAPACITY[mode]) {
      this.emit('ready', mode);
    }
  }

  getReadyPlayers(mode: MatchMode): Player[] {
    const queue = this.queues.get(mode);
    const players: Player[] = [];
    if (!queue) return [];

    for (const id of queue) {
      if (players.length < MATCH_CAPACITY[mode]) {
        const player = this.playerInfo.get(id);
        if (player) players.push(player);
      } else break;
    }

    return players;
  }

  popPlayers(mode: MatchMode, players: Player[]) {
    const queue = this.queues.get(mode);
    if (!queue) return;

    players.forEach((p) => {
      queue.delete(p.id);
      this.playerInfo.delete(p.id);
    });
  }

  removePlayer(playerId: number) {
    for (const queue of this.queues.values()) {
      if (queue.has(playerId)) {
        queue.delete(playerId);
        this.playerInfo.delete(playerId);
      }
    }
  }
}
