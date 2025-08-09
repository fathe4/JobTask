/**
 * Global Type Declarations
 * Extensions to external libraries and global namespaces
 */

import { UserRole } from "./system.types";

// Express Request extension
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: UserRole;
        emailVerified: boolean;
      };
    }
  }
}

// This export makes it a module, enabling global declarations
export {};
