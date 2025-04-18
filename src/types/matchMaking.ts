// matchMaking.ts
export enum MatchMode {
  TWO_PLAYER = '2P',
  FOUR_PLAYER = '4P',
}

export interface Player {
  id: number;
  socketId: string;
}
