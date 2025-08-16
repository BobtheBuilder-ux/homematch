import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

interface DecodedToken extends JwtPayload {
  sub: string;
  "custom:role"?: string;
}

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
  return (req: Request, res: Response, next: NextFunction): void => {
    console.log('Auth middleware called for:', req.method, req.path);
    console.log('Authorization header:', req.headers.authorization);
    
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      console.log('No token provided');
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    try {
      const decoded = jwt.decode(token) as DecodedToken;
      const userRole = decoded["custom:role"] || "";
      console.log('Decoded user role:', userRole);
      console.log('Allowed roles:', allowedRoles);
      
      req.user = {
        id: decoded.sub,
        role: userRole,
      };

      const hasAccess = allowedRoles.includes(userRole.toLowerCase());
      console.log('Has access:', hasAccess);
      
      if (!hasAccess) {
        console.log('Access denied for role:', userRole);
        res.status(403).json({ message: "Access Denied" });
        return;
      }

      // All roles now follow the same authentication flow
      // Profile creation is handled by the frontend API after successful authentication
    } catch (err) {
      console.error("Failed to decode token:", err);
      res.status(400).json({ message: "Invalid token" });
      return;
    }

    console.log('Auth middleware passed, calling next()');
    next();
  };
};
