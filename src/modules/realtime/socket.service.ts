import { Server } from 'socket.io';
import { createClient } from 'redis';
import { createAdapter } from '@socket.io/redis-adapter';
import { config } from '../../config/index.js';

export class SocketService {
  private io?: Server;

  init(server: any) {
    this.io = new Server(server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });

    const pubClient = createClient({ 
      url: `redis://${config.redis.host}:${config.redis.port}`,
      password: config.redis.password 
    });
    const subClient = pubClient.duplicate();

    // Use any to bypass version-specific redis client type mismatches with socket.io adapter
    this.io.adapter(createAdapter(pubClient as any, subClient as any));

    this.io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      socket.on('join', (repoId: string) => {
        socket.join(`repo:${repoId}`);
        console.log(`Socket ${socket.id} joined repo:${repoId}`);
      });
    });
  }

  emitToRepo(repoName: string, event: string, data: any) {
    if (!this.io) return;
    this.io.to(`repo:${repoName}`).emit(event, data);
  }
}

export const socketService = new SocketService();
