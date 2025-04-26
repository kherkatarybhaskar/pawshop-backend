import { Request, Response, NextFunction } from 'express';

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    isAdmin: boolean;
  };
}

const adminMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  if (!req.user.isAdmin) {
    return res.status(403).json({ message: 'Access denied, admin only' });
  }

  next(); // Proceed to admin route if admin
};

export default adminMiddleware;
