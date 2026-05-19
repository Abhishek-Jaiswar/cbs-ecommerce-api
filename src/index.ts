import { startApp } from "./app.js";

const startServer = () => {
  try {
    const app = startApp();
    const port = Number(process.env.PORT) || 8000;

    app.listen(port, () => {
      console.log(`Server is listening at port: http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Failed to start server: ", error);
  }
};

startServer();
