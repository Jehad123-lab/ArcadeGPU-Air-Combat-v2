import { gfx3MeshRenderer } from '@lib/gfx3_mesh/gfx3_mesh_renderer';
import { Gfx3Mesh } from '@lib/gfx3_mesh/gfx3_mesh';
import { createBoxMesh } from './GameUtils';
import { UT } from '@lib/core/utils';
import { BulletManager } from './Bullets';
import { Quaternion } from '@lib/core/quaternion';

export class Enemy {
    position: vec3;
    active: boolean = true;
    mesh: Gfx3Mesh;
    velocity: number = 40; 
    
    // Euler angles for simple AI
    yaw: number = 0;
    pitch: number = 0;
    roll: number = 0;

    health: number = 100;

    constructor(pos: vec3, mesh: Gfx3Mesh) {
        this.position = [...pos] as vec3;
        this.mesh = mesh;
    }

    update(ts: number, playerPos: vec3) {
        if (!this.active) return;
        
        // Direction to player
        const dir = UT.VEC3_SUBSTRACT(playerPos, this.position);
        const dist = UT.VEC3_LENGTH(dir);
        
        // Simple steering towards player if not too close
        if (dist > 20) {
            const targetYaw = Math.atan2(dir[0], dir[2]);
            const targetPitch = Math.asin(Math.max(-1, Math.min(1, -dir[1] / dist)));
            
            // Turn smoothly (yaw mapping needs angle wrapping fixes, but this is simple)
            let yawDiff = targetYaw - this.yaw;
            while (yawDiff > Math.PI) yawDiff -= Math.PI * 2;
            while (yawDiff < -Math.PI) yawDiff += Math.PI * 2;
            
            this.yaw += yawDiff * 1.5 * (ts / 1000);
            this.pitch = UT.LERP(this.pitch, targetPitch, 2.0 * (ts / 1000));
            
            // Bank into turns
            this.roll = UT.LERP(this.roll, -yawDiff * 0.8, 3.0 * (ts / 1000));
        }

        // Move forward
        const forward = [
            Math.sin(this.yaw) * Math.cos(this.pitch),
            -Math.sin(this.pitch),
            Math.cos(this.yaw) * Math.cos(this.pitch)
        ];
        
        const speed = this.velocity * (ts / 1000);
        this.position[0] += forward[0] * speed;
        this.position[1] += forward[1] * speed;
        this.position[2] += forward[2] * speed;
        
        // Hard deck
        if (this.position[1] < 2.0) this.position[1] = 2.0;

        // Despawn if too far
        if (dist > 800) {
            this.active = false;
        }
    }

    takeDamage(amount: number) {
        this.health -= amount;
        if (this.health <= 0) {
            this.active = false;
        }
    }

    draw() {
        if (!this.active) return;
        const mat = UT.MAT4_IDENTITY();
        UT.MAT4_MULTIPLY(mat, UT.MAT4_TRANSLATE(this.position[0], this.position[1], this.position[2]), mat);
        
        UT.MAT4_MULTIPLY(mat, UT.MAT4_ROTATE_Y(this.yaw), mat);
        UT.MAT4_MULTIPLY(mat, UT.MAT4_ROTATE_X(this.pitch), mat);
        UT.MAT4_MULTIPLY(mat, UT.MAT4_ROTATE_Z(this.roll), mat);
        
        gfx3MeshRenderer.drawMesh(this.mesh, mat);
    }
}

export class EnemyManager {
    enemies: Enemy[] = [];
    enemyMesh: Gfx3Mesh;
    score: number = 0;
    
    constructor() {
        // Futuristic/drone-like wide red body
        this.enemyMesh = createBoxMesh(4.0, 0.6, 2.5, [0.8, 0.1, 0.1]); 
    }

    spawn(pos: vec3) {
        this.enemies.push(new Enemy(pos, this.enemyMesh));
    }

    update(ts: number, playerPos: vec3, bulletManager: BulletManager) {
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const e = this.enemies[i];
            e.update(ts, playerPos);
            
            // Check collision with bullets
            for (const b of bulletManager.bullets) {
                if (!b.active) continue;
                const dist = UT.VEC3_DISTANCE(e.position, b.position);
                if (dist < 4.0) { // simple radius check
                    b.active = false;
                    e.takeDamage(25);
                    if (!e.active) {
                        this.score += 100;
                    }
                    break; // one bullet hits one enemy
                }
            }
            
            if (!e.active) {
                this.enemies.splice(i, 1);
            }
        }

        // Keep a few enemies active
        if (this.enemies.length < 4) {
            const spawnDist = 300 + Math.random() * 100;
            const spawnAng = Math.random() * Math.PI * 2;
            const sx = playerPos[0] + Math.cos(spawnAng) * spawnDist;
            const sz = playerPos[2] + Math.sin(spawnAng) * spawnDist;
            const sy = Math.max(30, playerPos[1] + (Math.random() - 0.5) * 100);
            this.spawn([sx, sy, sz]);
        }
    }

    draw() {
        for (const e of this.enemies) {
            e.draw();
        }
    }
}
