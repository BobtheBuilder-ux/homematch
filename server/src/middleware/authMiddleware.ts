import { Request, Response, NextFunction } from "express";
import { auth } from "../auth";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: string;
      };
    }
  }
}

export const authMiddleware = (allowedRoles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    console.log('Auth middleware called for:', req.method, req.path);
    console.log('Authorization header:', req.headers.authorization);
    
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      console.log('No token provided');
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    try {
      // Validate session using BetterAuth
      const headers = new Headers();
      Object.entries(req.headers).forEach(([key, value]) => {
        if (typeof value === 'string') {
          headers.set(key, value);
        } else if (Array.isArray(value)) {
          headers.set(key, value.join(', '));
        }
      });
      
      const session = await auth.api.getSession({
        headers
      });

      if (!session || !session.user) {
        console.log('Invalid or expired session');
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const userRole = session.user.role || "tenant";
      console.log('User role:', userRole);
      console.log('Allowed roles:', allowedRoles);
      
      req.user = {
        id: session.user.id,
        role: userRole,
      };

      const hasAccess = allowedRoles.includes(userRole.toLowerCase());
      console.log('Has access:', hasAccess);
      
      if (!hasAccess) {
        console.log('Access denied for role:', userRole);
        res.status(403).json({ message: "Access Denied" });
        return;
      }

      console.log('Auth middleware passed, calling next()');
      next();
    } catch (err) {
      console.error("Failed to validate session:", err);
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
  };
};
