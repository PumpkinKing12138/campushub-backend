import { Router } from "express";
import { healthCheck } from "../controllers/health.controller";

export const healthRouter: Router = Router();
healthRouter.get("/health", healthCheck);
