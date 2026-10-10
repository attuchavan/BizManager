import { Router } from "express";
import {
  getAiBusinessSummary,
  processAiQuery,
  executeAiTool,
} from "../controllers/ai.controller.js";

const router = Router();

router.post("/summary", getAiBusinessSummary);
router.post("/query", processAiQuery);
router.post("/execute", executeAiTool);

export default router;
