import express, { Router } from "express";
import { searchController } from "./search.controller.js";

const router: Router = express.Router();

router.get("/suggestions", searchController.getSuggestions);
router.get("/", searchController.searchProducts);

export default router;
