// Level Objectives and Extraction Verification

import type { ObjectiveTask, LevelDefinition } from '../types';
import { audioSystem } from '../engine/AudioSystem';
import { ParticleSystem } from '../engine/ParticleSystem';
import { Vector2 } from '../engine/Vector2';

export class ObjectiveSystem {
  public objectives: ObjectiveTask[] = [];
  public isExtractionUnlocked: boolean = false;
  public extractionTriggered: boolean = false;
  public extractionTimer: number = 0;

  public initLevel(levelDef: LevelDefinition) {
    this.objectives = JSON.parse(JSON.stringify(levelDef.objectives));
    this.isExtractionUnlocked = false;
    this.extractionTriggered = false;
    this.extractionTimer = 0;
  }

  public notifyItemCollected(itemId: string, quantity: number, particles: ParticleSystem) {
    for (const obj of this.objectives) {
      if (!obj.completed && obj.type === 'COLLECT') {
        if (obj.targetId === itemId || (obj.targetId === 'food' && (itemId === 'berries' || itemId === 'coconut' || itemId === 'cooked_meat' || itemId === 'cooked_fish'))) {
          obj.currentCount = Math.min(obj.targetCount, obj.currentCount + quantity);
          if (obj.currentCount >= obj.targetCount) {
            obj.completed = true;
            this.onTaskComplete(obj, particles);
          }
        }
      }
    }
    this.checkAllCompleted(particles);
  }

  public notifyBuildingBuilt(defId: string, particles: ParticleSystem) {
    for (const obj of this.objectives) {
      if (!obj.completed && obj.type === 'BUILD') {
        if (obj.targetId === defId || !obj.targetId) {
          obj.currentCount = Math.min(obj.targetCount, obj.currentCount + 1);
          if (obj.currentCount >= obj.targetCount) {
            obj.completed = true;
            this.onTaskComplete(obj, particles);
          }
        }
      }
    }
    this.checkAllCompleted(particles);
  }

  private onTaskComplete(task: ObjectiveTask, particles: ParticleSystem) {
    audioSystem.playObjectiveComplete();
    particles.emitFloatingText(`COMPLETED: ${task.text.toUpperCase()}`, 640, 140, '#ffeb3b');
  }

  private checkAllCompleted(particles: ParticleSystem) {
    const allNonReachDone = this.objectives
      .filter(o => o.type !== 'REACH')
      .every(o => o.completed);

    if (allNonReachDone && !this.isExtractionUnlocked) {
      this.isExtractionUnlocked = true;
      audioSystem.playObjectiveComplete();
      particles.emitFloatingText('EXTRACTION POINT UNLOCKED! PROCEED TO EXIT', 640, 160, '#00e5ff');
    }
  }

  public checkExtractionZone(
    players: { pos: Vector2; stats: { isDead: boolean; isDowned: boolean } }[],
    extractionPos: Vector2,
    radius: number = 65
  ): boolean {
    if (!this.isExtractionUnlocked) return false;

    const livingPlayers = players.filter(p => !p.stats.isDead);
    if (livingPlayers.length === 0) return false;

    const allInZone = livingPlayers.every(p => p.pos.distanceTo(extractionPos) <= radius);

    if (allInZone) {
      const reachTask = this.objectives.find(o => o.type === 'REACH');
      if (reachTask) reachTask.completed = true;
      return true;
    }
    return false;
  }
}

