import { Request, Response, NextFunction } from "express";

// Middleware to check if user is authenticated
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  
  res.status(401).json({ message: "Not authenticated" });
}

// Middleware to check if user is an admin
export function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    const user = req.user as any;
    
    if (user.role === 'admin') {
      return next();
    }
    
    return res.status(403).json({ message: "Admin access required" });
  }
  
  res.status(401).json({ message: "Not authenticated" });
}

// Middleware to check if user is a trainer
export function isTrainer(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    const user = req.user as any;
    
    if (user.role === 'admin' || user.role === 'trainer') {
      return next();
    }
    
    return res.status(403).json({ message: "Trainer access required" });
  }
  
  res.status(401).json({ message: "Not authenticated" });
}

// Middleware to check if user is a trainee
export function isTrainee(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    const user = req.user as any;
    
    if (user.role === 'admin' || user.role === 'trainer' || user.role === 'trainee') {
      return next();
    }
    
    return res.status(403).json({ message: "Trainee access required" });
  }
  
  res.status(401).json({ message: "Not authenticated" });
}

// Middleware to check if user is owner or admin
export function isOwnerOrAdmin(resourceType: string, resourceIdParam: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated()) {
      const user = req.user as any;
      
      // Admins have access to everything
      if (user.role === 'admin') {
        return next();
      }
      
      // Get the resource ID from params
      const resourceId = req.params[resourceIdParam];
      
      if (!resourceId) {
        return res.status(400).json({ message: "Invalid resource ID" });
      }
      
      // Check ownership based on resource type
      let isOwner = false;
      
      switch (resourceType) {
        case 'program':
          const program = await req.app.get('storage').getProgramById(resourceId);
          isOwner = program && program.createdById === user.id;
          break;
        case 'meeting':
          const meeting = await req.app.get('storage').getMeetingById(resourceId);
          isOwner = meeting && meeting.createdById === user.id;
          break;
        case 'certificate':
          const certificate = await req.app.get('storage').getCertificateById(resourceId);
          isOwner = certificate && certificate.createdById === user.id;
          break;
        case 'event':
          const event = await req.app.get('storage').getEventById(resourceId);
          isOwner = event && event.createdById === user.id;
          break;
        default:
          return res.status(400).json({ message: "Invalid resource type" });
      }
      
      if (isOwner) {
        return next();
      }
      
      return res.status(403).json({ message: "You don't have permission to access this resource" });
    }
    
    res.status(401).json({ message: "Not authenticated" });
  };
}
