// Multiplayer Manager: BroadcastChannel Cross-Tab Sync, Room Lobby, and Smart Companion AI

import { Player } from '../entities/Player';
import { Vector2 } from '../engine/Vector2';
import { ResourceNode } from '../entities/ResourceNode';
import { ParticleSystem } from '../engine/ParticleSystem';
import type { DropItem } from '../types';
import { BuildingInstance } from '../entities/Building';

export interface NetworkPacket {
  type: 'PLAYER_MOVE' | 'PLAYER_ACTION' | 'ITEM_DROP' | 'REVIVE_EVENT' | 'CHAT';
  senderId: string;
  roomCode: string;
  payload: any;
}

export class MultiplayerManager {
  public roomCode: string = 'ISLAND-1';
  public localPlayerIndex: number = 0;
  public totalPlayers: number = 4;
  public isMultiplayerActive: boolean = false;
  public isHost: boolean = true;

  private broadcastChannel: BroadcastChannel | null = null;

  constructor() {
    this.initBroadcastChannel();
  }

  private initBroadcastChannel() {
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        this.broadcastChannel = new BroadcastChannel('island_survival_net');
        this.broadcastChannel.onmessage = (event: MessageEvent<NetworkPacket>) => {
          this.handleIncomingPacket(event.data);
        };
      }
    } catch (e) {
      console.warn('BroadcastChannel not supported:', e);
    }
  }

  public setRoom(code: string, isHost: boolean = true, playerIndex: number = 0) {
    this.roomCode = code.trim().toUpperCase();
    this.isHost = isHost;
    this.localPlayerIndex = playerIndex;
    this.isMultiplayerActive = true;
  }

  public sendPacket(type: NetworkPacket['type'], payload: any) {
    if (!this.broadcastChannel) return;
    const packet: NetworkPacket = {
      type,
      senderId: `p_${this.localPlayerIndex}`,
      roomCode: this.roomCode,
      payload
    };
    try {
      this.broadcastChannel.postMessage(packet);
    } catch (e) {
      console.warn('Failed to send packet:', e);
    }
  }

  private handleIncomingPacket(packet: NetworkPacket) {
    if (packet.roomCode !== this.roomCode) return;
  }

  public updateCompanionAI(
    bot: Player,
    leader: Player,
    allPlayers: Player[],
    resources: ResourceNode[],
    _buildings: BuildingInstance[],
    dt: number,
    particles: ParticleSystem,
    drops: DropItem[]
  ) {
    if (!bot.isBot || bot.stats.isDead || bot.stats.isDowned) return;

    bot.botActionTimer -= dt;

    // Self preservation
    if (bot.stats.hunger < 45 && bot.inventory.hasItem('berries')) {
      bot.eatItem('berries', particles);
    } else if (bot.stats.hunger < 45 && bot.inventory.hasItem('cooked_meat')) {
      bot.eatItem('cooked_meat', particles);
    }
    if (bot.stats.thirst < 40 && bot.inventory.hasItem('clean_water')) {
      bot.eatItem('clean_water', particles);
    }

    // Revive downed teammates
    const downedTeammate = allPlayers.find(p => p.stats.isDowned && !p.stats.isDead && p !== bot);
    if (downedTeammate) {
      const distToDowned = bot.pos.distanceTo(downedTeammate.pos);
      if (distToDowned > 30) {
        const dir = downedTeammate.pos.sub(bot.pos).normalize();
        bot.update(dt, dir, true, particles, false, 20);
      } else {
        bot.reviveOther(downedTeammate, dt, particles);
        bot.update(dt, new Vector2(0, 0), false, particles, false, 20);
      }
      return;
    }

    // Follow formation near leader
    const distToLeader = bot.pos.distanceTo(leader.pos);

    if (distToLeader > 180) {
      const dir = leader.pos.sub(bot.pos).normalize();
      bot.update(dt, dir, true, particles, false, 20);
      return;
    } else if (distToLeader > 80) {
      const dir = leader.pos.sub(bot.pos).normalize();
      bot.update(dt, dir, false, particles, false, 20);
      return;
    }

    // Assist harvesting
    if (bot.botActionTimer <= 0) {
      bot.botActionTimer = 0.8 + Math.random() * 0.6;

      let nearestRes: ResourceNode | null = null;
      let minResDist = 90;
      for (const res of resources) {
        if (!res.isDepleted) {
          const d = bot.pos.distanceTo(new Vector2(res.x, res.y));
          if (d < minResDist) {
            minResDist = d;
            nearestRes = res;
          }
        }
      }

      if (nearestRes) {
        bot.facing = new Vector2(nearestRes.x - bot.pos.x, nearestRes.y - bot.pos.y).normalize();
        bot.swingTool();
        nearestRes.hit('NONE', bot.charClass.gatherMultiplier, particles, drops);
      }
    }

    bot.update(dt, new Vector2(0, 0), false, particles, false, 20);
  }
}

