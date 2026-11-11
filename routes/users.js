import { Router } from "express";

const router = Router();

router.get("/", (req, res) => {
  res.send("respond with a resource");
});

export default router;
