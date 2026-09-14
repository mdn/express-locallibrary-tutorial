import { Router } from "express";

const router = Router();

// GET home page.
router.get("/", (req, res) => {
  res.redirect("/catalog");
});

export default router;
