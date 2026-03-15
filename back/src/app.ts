import express from "express";
import path from "path";
import { existsSync } from "fs";
import { securityMiddleware } from "./middlewares/security";
import { errorHandler } from "./middlewares/errorHandler";
import userRoutes from "./routes/userRoutes";
import authRoutes from "./routes/authRoutes";
import tournamentRoutes from "./routes/tournamentRoutes";
import teamRoutes from "./routes/teamRoutes";
import matchRoutes from "./routes/matchRoutes";

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
app.use("/v1/matches", matchRoutes);

// In production (Docker), serve frontend static files + SPA fallback
const publicDir = path.resolve(process.cwd(), "public");
if (process.env.NODE_ENV === "production" && existsSync(publicDir)) {
    app.use(express.static(publicDir, { index: false }));
    app.use((req, res, next) => {
        if (req.method === "GET" && !req.path.startsWith("/v1/")) {
            res.sendFile(path.join(publicDir, "index.html"));
        } else {
            next();
        }
    });
}

app.use(errorHandler);

export default app;
