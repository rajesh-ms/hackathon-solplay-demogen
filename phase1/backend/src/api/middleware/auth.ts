import { Request, Response, NextFunction } from 'express';

interface APIKey {
  id: string;
  key: string;
  userId: string;
  rateLimitTier: 'free' | 'basic' | 'enterprise';
  isActive: boolean;
}

// In production, this would be stored in a database
const API_KEYS: Map<string, APIKey> = new Map([
  ['demo-key-123', {
    id: 'api-1',
    key: 'demo-key-123',
    userId: 'user-1',
    rateLimitTier: 'basic',
    isActive: true
  }],
  ['enterprise-key-456', {
    id: 'api-2',
    key: 'enterprise-key-456',
    userId: 'user-2',
    rateLimitTier: 'enterprise',
    isActive: true
  }]
]);

export interface AuthenticatedRequest extends Request {
  apiKey?: APIKey;
}

export const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  // Skip auth for health check
  if (req.path === '/health') {
    return next();
  }

  const authHeader = req.headers.authorization;
  const apiKey = authHeader?.replace('Bearer ', '') || req.query.api_key as string;

  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or missing API key',
      message: 'Please provide a valid API key in Authorization header or api_key query parameter'
    });
  }

  const keyData = API_KEYS.get(apiKey);
  
  if (!keyData || !keyData.isActive) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or missing API key',
      message: 'The provided API key is invalid or has been deactivated'
    });
  }

  req.apiKey = keyData;
  next();
};