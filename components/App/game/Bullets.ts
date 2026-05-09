import { gfx3MeshRenderer } from '@lib/gfx3_mesh/gfx3_mesh_renderer';
import { Gfx3Mesh } from '@lib/gfx3_mesh/gfx3_mesh';
import { createBoxMesh } from './GameUtils';
import { UT } from '@lib/core/utils';
import { Quaternion } from '@lib/core/quaternion';

export class Bullet {
    position: vec3;
    velocity: number = 800; // units per second
    lifetime: number = 3000; // ms
    active: boolean = true;
    mesh: Gfx3Mesh;
    direction: vec3;
    rotMat: mat4;

    constructor(pos: vec3, dir: vec3, quat: Quaternion, mesh: Gfx3Mesh) {
        this.position = [...pos] as vec3;
        this.direction = UT.VEC3_NORMALIZE(dir);
        this.mesh = mesh;
        
        // Calculate a rotation matrix that points exactly along `direction`
        // We can just use trigonometry
        const yaw = Math.atan2(this.direction[0], this.direction[2]);
        const pitch = Math.asin(Math.max(-1, Math.min(1, -this.direction[1])));
        
        this.rotMat = UT.MAT4_IDENTITY();
        UT.MAT4_MULTIPLY(this.rotMat, UT.MAT4_ROTATE_Y(yaw), this.rotMat);
        UT.MAT4_MULTIPLY(this.rotMat, UT.MAT4_ROTATE_X(pitch), this.rotMat);
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
        UT.MAT4_MULTIPLY(mat, this.rotMat, mat);

        gfx3MeshRenderer.drawMesh(this.mesh, mat);
    }
}

export class BulletManager {
    bullets: Bullet[] = [];
    bulletMesh: Gfx3Mesh;
    
    constructor(color: vec3 = [1.0, 0.8, 0.1]) {
        this.bulletMesh = createBoxMesh(0.2, 0.2, 3.5, color); 
    }

    fire(pos: vec3, dir: vec3, quat: Quaternion) {
        this.bullets.push(new Bullet(pos, dir, quat, this.bulletMesh));
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
