const { spawn } = require('child_process');
const path = require('path');
const env = require('../config/env');

class AiProcessManager {
  constructor() {
    this.child = null;
    this.isStarting = false;
    this.faceServiceUrl = env.FACE_SERVICE_URL || 'http://localhost:8000';
  }

  /**
   * Check if Python Face Biometrics microservice is running
   */
  async isHealthy() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500);
      const res = await fetch(`${this.faceServiceUrl}/health`, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        return data.status === 'healthy' || data.success === true;
      }
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Ensure Face Biometrics microservice is running.
   * If not already running, automatically launch it as a child process.
   */
  async ensureAiService() {
    if (await this.isHealthy()) {
      console.log(`[Face AI] Microservice is active and healthy on ${this.faceServiceUrl}`);
      return true;
    }

    if (this.isStarting) {
      // Already launching, wait for it
      for (let i = 0; i < 20; i++) {
        await new Promise((r) => setTimeout(r, 500));
        if (await this.isHealthy()) return true;
      }
      return false;
    }

    this.isStarting = true;
    console.log('[Face AI] Microservice not detected. Automatically launching Python AI Server...');

    try {
      const aiDir = path.resolve(__dirname, '../../../AI');
      const serverScript = path.join(aiDir, 'server.py');

      this.child = spawn('python', [serverScript], {
        cwd: aiDir,
        env: { ...process.env, PORT: '8000', HOST: '0.0.0.0' },
        stdio: ['ignore', 'pipe', 'pipe']
      });

      this.child.stdout?.on('data', (chunk) => {
        const msg = chunk.toString().trim();
        if (msg) console.log(`[Face AI Python] ${msg}`);
      });

      this.child.stderr?.on('data', (chunk) => {
        const msg = chunk.toString().trim();
        // Ignore Google Landmarker info warnings
        if (msg && !msg.includes('Sets FaceBlendshapesGraph') && !msg.includes('inference_feedback_manager')) {
          console.warn(`[Face AI Python] ${msg}`);
        }
      });

      this.child.on('error', (err) => {
        console.error('[Face AI] Failed to spawn Python process:', err.message);
        this.child = null;
      });

      this.child.on('exit', (code, signal) => {
        console.log(`[Face AI] Python server stopped (code: ${code}, signal: ${signal})`);
        this.child = null;
      });

      // Cleanup child process when node terminates
      const cleanup = () => {
        if (this.child && !this.child.killed) {
          try {
            this.child.kill();
          } catch {}
          this.child = null;
        }
      };
      process.on('exit', cleanup);
      process.on('SIGINT', cleanup);
      process.on('SIGTERM', cleanup);

      // Poll until service is ready (up to 12 seconds)
      for (let i = 0; i < 24; i++) {
        await new Promise((r) => setTimeout(r, 500));
        if (await this.isHealthy()) {
          console.log(`[Face AI] Python Face Biometrics Server is ready on ${this.faceServiceUrl}`);
          this.isStarting = false;
          return true;
        }
      }

      console.warn('[Face AI] Launched Python process but health check did not respond in 12s.');
      this.isStarting = false;
      return false;
    } catch (err) {
      console.error('[Face AI] Error while starting Python service:', err.message);
      this.isStarting = false;
      return false;
    }
  }

  stop() {
    if (this.child && !this.child.killed) {
      try {
        this.child.kill();
      } catch {}
      this.child = null;
    }
  }
}

module.exports = new AiProcessManager();
