import express from "express";
import { securityMiddleware } from "./middlewares/security";
import { errorHandler } from "./middlewares/errorHandler";
import userRoutes from "./routes/userRoutes";
import authRoutes from "./routes/authRoutes";
import tournamentRoutes from "./routes/tournamentRoutes";
import teamRoutes from "./routes/teamRoutes";

const app = express();

app.use(express.json());
app.use(...securityMiddleware);

app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/v1/auth", authRoutes);
app.use("/v1/users", userRoutes);
app.use("/v1/tournaments", tournamentRoutes);
app.use("/v1/teams", teamRoutes);

app.use(errorHandler);

export default app;
