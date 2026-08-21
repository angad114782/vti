import type { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import SupportTicket from '../models/SupportTicket';
import User from '../models/User';
import { verifyAccessToken, type JwtPayload } from '../utils/jwt';

let io: Server | null = null;
const participantRoles = new Set(['SUPER_ADMIN', 'COMPANY_ADMIN', 'HR', 'FINANCE', 'MANAGER', 'SUPERVISOR', 'EMPLOYEE']);

const canAccessTicket = async (auth: JwtPayload, ticketId: string) => {
  if (!participantRoles.has(auth.role)) return false;
  const ticket: any = await SupportTicket.findById(ticketId).select('companyId userId').lean();
  if (!ticket) return false;
  if (auth.role === 'SUPER_ADMIN') return true;
  if (String(ticket.companyId) !== String(auth.companyId)) return false;
  return !['EMPLOYEE', 'FINANCE', 'MANAGER', 'SUPERVISOR'].includes(auth.role) || String(ticket.userId) === auth.userId;
};

export function startSupportSocket(server: HttpServer, origin: string): Server {
  io = new Server(server, { cors: { origin, credentials: true } });
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (typeof token !== 'string') return next(new Error('Unauthorized'));
      const auth = verifyAccessToken(token);
      const user: any = await User.findById(auth.userId).select('isActive sessionVersion').lean();
      if (!user?.isActive || Number(user.sessionVersion ?? 0) !== Number(auth.sessionVersion ?? 0)) return next(new Error('Unauthorized'));
      socket.data.auth = auth; next();
    } catch { next(new Error('Unauthorized')); }
  });
  io.on('connection', (socket) => {
    socket.join(`user:${socket.data.auth.userId}`);
    socket.on('support:join', async ({ ticketId }: { ticketId?: string }, ack?: (result: { ok: boolean }) => void) => {
      if (!ticketId || !await canAccessTicket(socket.data.auth as JwtPayload, ticketId)) return ack?.({ ok: false });
      socket.join(`support:${ticketId}`); ack?.({ ok: true });
    });
    socket.on('support:leave', ({ ticketId }: { ticketId?: string }) => { if (ticketId) socket.leave(`support:${ticketId}`); });
    socket.on('support:typing', async ({ ticketId, isTyping }: { ticketId?: string; isTyping?: boolean }) => {
      if (!ticketId || !await canAccessTicket(socket.data.auth as JwtPayload, ticketId)) return;
      socket.to(`support:${ticketId}`).emit('support:typing', { ticketId, userId: socket.data.auth.userId, isTyping: Boolean(isTyping) });
    });
  });
  return io;
}

export const emitSupportComment = (ticketId: string, comment: unknown) => io?.to(`support:${ticketId}`).emit('support:comment', { ticketId, comment });
export const emitSupportTicketUpdate = (ticketId: string, ticket: unknown) => io?.to(`support:${ticketId}`).emit('support:ticket-updated', { ticketId, ticket });
export const emitUserNotification = (userId: string, notification: unknown) => io?.to(`user:${userId}`).emit('notification:new', notification);
