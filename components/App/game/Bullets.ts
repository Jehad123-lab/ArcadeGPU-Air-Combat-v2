import { gfx3MeshRenderer } from '@lib/gfx3_mesh/gfx3_mesh_renderer';
import { Gfx3Mesh } from '@lib/gfx3_mesh/gfx3_mesh';
import { createBoxMesh } from './GameUtils';
import { UT } from '@lib/core/utils';
import { Quaternion } from '@lib/core/quaternion';

export class Bullet {
    position: vec3;
    velocity: number = 300; // units per second
    lifetime: number = 2000; // ms
    active: boolean = true;
    mesh: Gfx3Mesh;
    direction: vec3;

    constructor(pos: vec3, dir: vec3, mesh: Gfx3Mesh) {
        this.position = [...pos] as vec3;
        this.direction = UT.VEC3_NORMALIZE(dir);
        this.mesh = mesh;
    }

    update(ts: number) {
        this.lifetime -= ts;
        if (this.lifetime <= 0) {
            this.active = false;
        }
        
        const moveDist = this.velocity * (ts / 1000);
        this.position[0] += this.direction[0] * moveDist;
        this.position[1] += this.direction[1] * moveDist;
        this.position[2] += this.direction[2] * moveDist;
    }

    draw() {
        if (!this.active) return;
        const mat = UT.MAT4_IDENTITY();
        UT.MAT4_MULTIPLY(mat, UT.MAT4_TRANSLATE(this.position[0], this.position[1], this.position[2]), mat);
        
        // Simple direction rotation (yaw/pitch pointing towards direction)
        const yaw = Math.atan2(this.direction[0], this.direction[2]);
        const pitch = Math.asin(-this.direction[1]);
        UT.MAT4_MULTIPLY(mat, UT.MAT4_ROTATE_Y(yaw), mat);
        UT.MAT4_MULTIPLY(mat, UT.MAT4_ROTATE_X(pitch), mat);

        gfx3MeshRenderer.drawMesh(this.mesh, mat);
    }
}

export class BulletManager {
    bullets: Bullet[] = [];
    bulletMesh: Gfx3Mesh;
    
    constructor() {
        this.bulletMesh = createBoxMesh(0.2, 0.2, 3.0, [1.0, 0.8, 0.1]); 
    }

    fire(pos: vec3, dir: vec3) {
        this.bullets.push(new Bullet(pos, dir, this.bulletMesh));
    }

    update(ts: number) {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            this.bullets[i].update(ts);
            if (!this.bullets[i].active) {
                this.bullets.splice(i, 1);
            }
        }
    }

    draw() {
        for (const b of this.bullets) {
            b.draw();
        }
    }
}
