// Initialize Express
const express = require("express");
const app = express();
const path = require("path");

// Middleware
app.use(express.json());
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

// Routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// API endpoint for news verification
app.post("/api/verify", async (req, res) => {
  try {
    const { newsText } = req.body;

    // Call Flask backend
    const response = await fetch("http://localhost:5000/predict", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ newsText }),
    });

    const result = await response.json();

    if (result.status === "success") {
      res.json({
        isReal: result.isReal,
        confidence: result.confidence,
      });
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    res.status(500).json({ error: "Error analyzing news" });
  }
});

// API endpoint for news gallery
app.get("/api/news-gallery", async (req, res) => {
  try {
    // Get pagination params from request
    const per_page = req.query.per_page || 10;
    const page = req.query.page || 1;
    const timestamp = new Date().getTime(); // Cache busting

    // Fetch news from Flask backend with params
    const response = await fetch(
      `http://localhost:5000/api/news-gallery?per_page=${per_page}&page=${page}&t=${timestamp}`,
      {
        timeout: 12000, // 12 second timeout for slow initial loads
      }
    );

    if (!response.ok) {
      throw new Error(`Backend error: ${response.status}`);
    }

    const data = await response.json();

    // Forward the response to the client
    res.json(data);
  } catch (error) {
    console.error("Error fetching news gallery:", error);

    // Provide a more helpful error message
    res.status(500).json({
      error: `Error fetching news: ${error.message}`,
      data: [],
      status: "error",
      message: "Unable to connect to news service. Please try again later.",
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
