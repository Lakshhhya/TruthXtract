document.addEventListener("DOMContentLoaded", () => {
  const verifyBtn = document.getElementById("verifyBtn");
  const newsInput = document.getElementById("newsInput");
  const resultDiv = document.getElementById("result");
  const newsGallery = document.getElementById("newsGallery");
  const refreshGalleryBtn = document.getElementById("refreshGallery");
  const loadingIndicator = document.getElementById("loadingIndicator");
  const verifyLink = document.getElementById("verifyLink");
  const galleryLink = document.getElementById("galleryLink");

  // Add theme toggle button to the header
  const header = document.querySelector("header");
  const themeToggle = document.createElement("button");
  themeToggle.id = "themeToggle";
  themeToggle.className = "theme-toggle";
  themeToggle.innerHTML = `
    <span class="theme-icon light-icon">☀️</span>
    <span class="theme-icon dark-icon">🌙</span>
  `;
  header.appendChild(themeToggle);

  // Theme handling
  const prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)");
  const currentTheme = localStorage.getItem("theme");

  // Set initial theme
  if (currentTheme === "light") {
    document.body.classList.add("light-theme");
  } else if (currentTheme === "dark" || prefersDarkScheme.matches) {
    document.body.classList.add("dark-theme");
  } else {
    document.body.classList.add("dark-theme"); // Default to dark theme
  }

  // Update theme toggle button appearance
  updateThemeToggle();

  // Theme toggle event handler
  themeToggle.addEventListener("click", () => {
    if (document.body.classList.contains("light-theme")) {
      document.body.classList.replace("light-theme", "dark-theme");
      localStorage.setItem("theme", "dark");
    } else {
      document.body.classList.replace("dark-theme", "light-theme");
      localStorage.setItem("theme", "light");
    }
    updateThemeToggle();
  });

  function updateThemeToggle() {
    if (document.body.classList.contains("light-theme")) {
      themeToggle.classList.add("light-active");
      themeToggle.classList.remove("dark-active");
    } else {
      themeToggle.classList.add("dark-active");
      themeToggle.classList.remove("light-active");
    }
  }

  // Set active nav link based on scroll position
  function setActiveNavLink() {
    const scrollPosition = window.scrollY;
    const gallerySection = document.getElementById("gallery");
    const galleryPosition = gallerySection.offsetTop - 100;

    if (scrollPosition < galleryPosition) {
      verifyLink.classList.add("active");
      galleryLink.classList.remove("active");
    } else {
      verifyLink.classList.remove("active");
      galleryLink.classList.add("active");
    }
  }

  // Initialize active nav link and add scroll listener
  setActiveNavLink();
  window.addEventListener("scroll", setActiveNavLink);

  // Add smooth scrolling to nav links
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const targetId = link.getAttribute("href");
      const targetElement = document.querySelector(targetId);

      window.scrollTo({
        top: targetElement.offsetTop - 20,
        behavior: "smooth",
      });
    });
  });

  // Verify news
  verifyBtn.addEventListener("click", async () => {
    const newsText = newsInput.value.trim();
    if (!newsText) {
      showError("Please enter some news text to verify");
      return;
    }

    try {
      // Show loading state
      verifyBtn.disabled = true;
      resultDiv.innerHTML = `
        <div class="loading-container">
          <div class="loading-spinner"></div>
          <div class="loading-text">Analyzing news content...</div>
        </div>
      `;

      const response = await fetch("http://localhost:5000/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ newsText }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.status === "error") {
        throw new Error(result.error);
      }

      // Store the news text for context matching
      result.userInput = newsText;

      displayResult(result);
    } catch (error) {
      console.error("Error:", error);
      showError("Failed to verify news. Please try again.");
    } finally {
      verifyBtn.disabled = false;
    }
  });

  // Display verification result
  function displayResult(result) {
    const resultDiv = document.getElementById("result");
    const confidencePercent = (result.confidence * 100).toFixed(1);
    const isBasicFact =
      result.analysis && result.analysis.is_basic_fact === true;
    const verdict = result.isReal
      ? isBasicFact
        ? "TRUE FACT"
        : "REAL NEWS"
      : isBasicFact
      ? "FALSE STATEMENT"
      : "FAKE NEWS";

    // Determine if we have Gemini insights
    const hasInsights =
      result.insights &&
      (result.insights.key_findings?.length > 0 ||
        result.insights.misleading_elements?.length > 0 ||
        result.insights.factual_claims?.length > 0);

    // Create a comprehensive report layout
    let html = `
      <div class="result-card ${result.isReal ? "real" : "fake"}">
        <div class="result-header">
          <div class="verdict-container">
            <div class="result-stamp ${
              result.isReal ? "real" : "fake"
            }">${verdict}</div>
            <div class="confidence-meter">
              <span class="confidence-label">Confidence: ${confidencePercent}%</span>
              <div class="confidence-bar">
                <div class="confidence-fill ${
                  result.isReal ? "real" : "fake"
                }" style="width: ${confidencePercent}%"></div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="report-navigation">
          <button class="report-nav-btn active" data-section="summary">Summary</button>
          <button class="report-nav-btn" data-section="analysis">Analysis</button>
          ${
            hasInsights
              ? `<button class="report-nav-btn" data-section="insights">AI Insights</button>`
              : ""
          }
          <button class="report-nav-btn" data-section="evidence">Evidence</button>
          <button class="report-nav-btn" data-section="sources">Sources</button>
        </div>
        
        <div class="report-sections">
          <!-- Summary Section -->
          <div class="report-section active" id="summary-section">
            <div class="summary-container">
              <div class="summary-header">
                <h3>Executive Summary</h3>
                <div class="summary-metrics">
                  <div class="summary-score ${result.isReal ? "real" : "fake"}">
                    <div class="score-circle">
                      <span class="score-value">${confidencePercent}</span>
                      <span class="score-unit">%</span>
                    </div>
                    <span class="score-label">Trust Score</span>
                  </div>
                  <div class="verification-date">
                    <span class="date-label">Verified on</span>
                    <span class="date-value">${new Date().toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              
              <div class="summary-content">
                <p class="summary-text">
                  ${getSummaryText(result, isBasicFact)}
                </p>
                <div class="recommendation ${result.isReal ? "real" : "fake"}">
                  ${getRecommendationText(result, isBasicFact)}
                </div>
              </div>
            </div>
          </div>
          
          <!-- Analysis Section -->
          <div class="report-section" id="analysis-section">
            <h3>Detailed Analysis</h3>
            <div class="analysis-metrics">
              <div class="metrics-row">
                <div class="metric-column">
                  <div class="metric-visualizations">
                    <div class="donut-chart-container">
                      <canvas id="trust-score-chart" width="200" height="200"></canvas>
                    </div>
                    <div class="bar-chart-container">
                      <canvas id="breakdown-chart" width="400" height="200"></canvas>
                    </div>
                  </div>
                </div>
                <div class="metric-column">
                  <div class="score-breakdown">
                    <h4>Analysis Components</h4>
                    <ul class="breakdown-list">
                      ${
                        result.analysis.gemini_score
                          ? `
                      <li class="breakdown-item">
                        <span class="breakdown-label">AI Analysis</span>
                        <div class="breakdown-bar">
                          <div class="breakdown-fill" style="width: ${(
                            result.analysis.gemini_score * 100
                          ).toFixed(1)}%"></div>
                        </div>
                        <span class="breakdown-value">${(
                          result.analysis.gemini_score * 100
                        ).toFixed(1)}%</span>
                      </li>
                      `
                          : ""
                      }
                      <li class="breakdown-item">
                        <span class="breakdown-label">Model Content Analysis</span>
                        <div class="breakdown-bar">
                          <div class="breakdown-fill" style="width: ${(
                            result.analysis.model_score * 100
                          ).toFixed(1)}%"></div>
                        </div>
                        <span class="breakdown-value">${(
                          result.analysis.model_score * 100
                        ).toFixed(1)}%</span>
                      </li>
                      <li class="breakdown-item">
                        <span class="breakdown-label">Fact Verification</span>
                        <div class="breakdown-bar">
                          <div class="breakdown-fill" style="width: ${(
                            result.analysis.fact_check_score * 100
                          ).toFixed(1)}%"></div>
                        </div>
                        <span class="breakdown-value">${(
                          result.analysis.fact_check_score * 100
                        ).toFixed(1)}%</span>
                      </li>
                      <li class="breakdown-item">
                        <span class="breakdown-label">External Verification</span>
                        <div class="breakdown-bar">
                          <div class="breakdown-fill" style="width: ${(
                            result.analysis.verification_score * 100
                          ).toFixed(1)}%"></div>
                        </div>
                        <span class="breakdown-value">${(
                          result.analysis.verification_score * 100
                        ).toFixed(1)}%</span>
                      </li>
                      ${
                        result.analysis.source_credibility
                          ? `
                      <li class="breakdown-item">
                        <span class="breakdown-label">Source Credibility</span>
                        <div class="breakdown-bar">
                          <div class="breakdown-fill" style="width: ${(
                            result.analysis.source_credibility * 100
                          ).toFixed(1)}%"></div>
                        </div>
                        <span class="breakdown-value">${(
                          result.analysis.source_credibility * 100
                        ).toFixed(1)}%</span>
                      </li>
                      `
                          : ""
                      }
                    </ul>
                  </div>
                  
                  <div class="analysis-explanation">
                    <h4>What This Means</h4>
                    <p>${getAnalysisExplanation(result, isBasicFact)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          ${
            hasInsights
              ? `
          <!-- Gemini Insights Section -->
          <div class="report-section" id="insights-section">
            <h3>AI Insights (Powered by Google Gemini)</h3>
            <div class="insights-container">
              ${renderGeminiInsights(result.insights)}
            </div>
          </div>
          `
              : ""
          }
          
          <!-- Evidence Section -->
          <div class="report-section" id="evidence-section">
            <h3>Supporting Evidence</h3>
            <div class="evidence-container">
              ${renderEnhancedEvidence(result)}
            </div>
          </div>
          
          <!-- Sources Section -->
          <div class="report-section" id="sources-section">
            <h3>Sources & References</h3>
            <div class="sources-container">
              ${renderSourcesInfo(result)}
            </div>
          </div>
        </div>
      </div>
    `;

    resultDiv.innerHTML = html;

    // Initialize the report navigation
    initReportNavigation();

    // Create the charts after the DOM is updated
    createTrustScoreChart(result);
    createBreakdownChart(result);
  }

  function renderReferences(references) {
    let html = '<div class="references-container">';

    // Render fact-check claims
    if (references.fact_check_claims.length > 0) {
      html += '<div class="fact-checks">';
      html += "<h5>Fact Check Results:</h5>";
      html += "<ul>";
      references.fact_check_claims.forEach((claim) => {
        html += `<li><a href="${claim.url}" target="_blank">${claim.title}</a></li>`;
      });
      html += "</ul></div>";
    }

    // Render similar articles
    if (references.similar_articles.length > 0) {
      html += '<div class="similar-articles">';
      html += "<h5>Similar Articles:</h5>";
      html += "<ul>";
      references.similar_articles.forEach((article) => {
        html += `<li><a href="${article.url}" target="_blank">${article.title}</a></li>`;
      });
      html += "</ul></div>";
    }

    html += "</div>";
    return html;
  }

  // Load news gallery with cache busting
  async function loadGallery() {
    try {
      loadingIndicator.classList.remove("hidden");
      // Add timestamp to prevent caching
      const timestamp = new Date().getTime();
      const response = await fetch(
        `http://127.0.0.1:5000/api/news-gallery?per_page=10&t=${timestamp}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseData = await response.json();

      if (responseData.error) {
        throw new Error(responseData.error);
      }

      // Extract the news articles from the data property
      const news = responseData.data || [];

      // Handle loading state
      if (responseData.status === "loading") {
        showLoadingState(responseData.message || "Loading news...");
        // Try again in 3 seconds if we're still loading
        setTimeout(loadGallery, 3000);
        return;
      }

      // Show message for partial data
      if (responseData.status === "partial") {
        displayGallery(news, responseData.message);
      } else {
        displayGallery(news);
      }
    } catch (error) {
      console.error("Error:", error);
      showError("Failed to load news gallery: " + error.message);
    } finally {
      loadingIndicator.classList.add("hidden");
    }
  }

  // Display gallery
  function displayGallery(news, statusMessage = null) {
    newsGallery.innerHTML = "";

    if (!Array.isArray(news) || news.length === 0) {
      showError("No news articles available");
      return;
    }

    // Show status message if one was provided
    if (statusMessage) {
      const statusDiv = document.createElement("div");
      statusDiv.className = "status-message";
      statusDiv.textContent = statusMessage;
      newsGallery.appendChild(statusDiv);
    }

    news.forEach((article) => {
      if (!article.title || !article.description) return;

      const card = document.createElement("div");
      card.className = "news-card";

      const confidencePercent = (article.confidence * 100).toFixed(1);
      const sourceType = article.category
        ? `<span class="source-type">${article.category}</span>`
        : "";

      card.innerHTML = `
        <div class="news-image-container">
          <img src="${article.image || "placeholder.jpg"}" 
               alt="${article.title}" 
               class="news-image"
               onerror="this.src='placeholder.jpg'">
          <div class="news-stamp ${article.isReal ? "real" : "fake"}">
            ${article.isReal ? "REAL" : "FAKE"}
          </div>
                ${
                  article.isAlert
                    ? '<div class="alert-badge">PRIORITY</div>'
                    : ""
                }
        </div>
        <div class="news-content">
          <h3 class="news-title">${article.title}</h3>
          <p class="news-description">${article.description}</p>
          <div class="news-meta">
                    ${sourceType}
            <span class="news-source">${
              article.source || article.source?.name || "Unknown"
            }</span>
            <span class="news-date">${new Date(
              article.publishedAt
            ).toLocaleDateString()}</span>
          </div>
          <div class="confidence-bar">
                    <div class="confidence-level ${
                      article.isReal ? "real" : "fake"
                    }" 
                 style="width: ${confidencePercent}%">
            </div>
          </div>
          <div class="confidence-text">
            Confidence: ${confidencePercent}%
          </div>
        </div>
      `;

      // Only add click handler if there's a valid URL
      if (article.url && article.url !== "#") {
        card.addEventListener("click", () => {
          window.open(article.url, "_blank");
        });
      }

      newsGallery.appendChild(card);
    });
  }

  // Show loading state with spinner
  function showLoadingState(message) {
    const loadingDiv = document.createElement("div");
    loadingDiv.className = "loading-container";
    loadingDiv.innerHTML = `
        <div class="loading-spinner"></div>
        <div class="loading-text">${message || "Loading latest news..."}</div>
        <div class="progress-text">Analyzing news sources</div>
    `;

    // Clear and add to news gallery
    newsGallery.innerHTML = "";
    newsGallery.appendChild(loadingDiv);

    // Show tips after a short delay
    setTimeout(() => {
      if (document.querySelector(".loading-container")) {
        const tipEl = document.createElement("div");
        tipEl.className = "loading-tip";
        tipEl.innerHTML = getRandomTip();
        loadingDiv.appendChild(tipEl);

        // Fade in the tip
        setTimeout(() => tipEl.classList.add("show"), 100);
      }
    }, 2500);
  }

  // Animate dots for loading text
  function animateDots(element) {
    let dots = 0;
    const maxDots = 3;
    const interval = setInterval(() => {
      // Only continue if element still exists in DOM
      if (!element || !document.body.contains(element)) {
        clearInterval(interval);
        return;
      }

      const text = element.textContent.replace(/\.+$/, "");
      dots = (dots + 1) % (maxDots + 1);
      element.textContent = text + ".".repeat(dots);
    }, 500);
  }

  // Random tips for loading screen
  function getRandomTip() {
    const tips = [
      "TruthXtract combines AI and fact-checking databases to verify news",
      "Our system checks multiple sources to determine content reliability",
      "News credibility is measured on several factors including source reputation",
      "We analyze linguistic patterns that are common in fake news",
      "The confidence score shows how certain we are about the verification result",
    ];
    return `<span class="tip-icon">💡</span> <span class="tip-text">${
      tips[Math.floor(Math.random() * tips.length)]
    }</span>`;
  }

  // Show error message
  function showError(message) {
    const errorDiv = document.createElement("div");
    errorDiv.className = "error-message";
    errorDiv.innerHTML = `
        <div class="error-icon">⚠️</div>
        <div class="error-text">${message}</div>
        <button id="retryButton" class="glow-button">Retry</button>
    `;
    newsGallery.innerHTML = "";
    newsGallery.appendChild(errorDiv);

    // Add event listener to retry button
    document
      .getElementById("retryButton")
      .addEventListener("click", loadGallery);
  }

  // Refresh gallery button with debounce
  let isRefreshing = false;
  refreshGalleryBtn.addEventListener("click", async () => {
    if (isRefreshing) return;
    isRefreshing = true;
    refreshGalleryBtn.disabled = true;

    try {
      await loadGallery();
    } finally {
      isRefreshing = false;
      refreshGalleryBtn.disabled = false;
    }
  });

  // Load gallery on page load
  loadGallery();

  // Auto refresh every 5 minutes
  setInterval(loadGallery, 300000);

  // Add type animation to news input placeholder
  const typeEffect = (element, text, speed) => {
    let i = 0;
    element.placeholder = "";

    const typeWriter = () => {
      if (i < text.length) {
        element.placeholder += text.charAt(i);
        i++;
        setTimeout(typeWriter, speed);
      }
    };

    typeWriter();
  };

  // Start typing effect with delay
  setTimeout(() => {
    typeEffect(
      newsInput,
      "Paste your news article here to verify its authenticity...",
      50
    );
  }, 1000);

  // Add tab functionality
  function initTabs() {
    const tabBtns = document.querySelectorAll(".tab-btn");
    const tabPanels = document.querySelectorAll(".tab-panel");

    tabBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        // Remove active class from all buttons and panels
        tabBtns.forEach((b) => b.classList.remove("active"));
        tabPanels.forEach((p) => p.classList.remove("active"));

        // Add active class to clicked button
        btn.classList.add("active");

        // Show the corresponding panel
        const tabName = btn.getAttribute("data-tab");
        document.getElementById(`${tabName}-panel`).classList.add("active");
      });
    });
  }

  // Create a donut chart for score visualization
  function createScoreChart(analysis) {
    // Create canvas context
    const canvas = document.getElementById("scoreChart");
    const ctx = canvas.getContext("2d");

    // Define data for the chart
    const data = [
      {
        label: "AI Model",
        value: analysis.model_score,
        color: "#4CAF50",
      },
      {
        label: "Fact Check",
        value: analysis.fact_check_score,
        color: "#2196F3",
      },
      {
        label: "Source Credibility",
        value: analysis.source_credibility,
        color: "#9C27B0",
      },
    ];

    if (analysis.verification_score) {
      data.push({
        label: "External Verification",
        value: analysis.verification_score,
        color: "#FF9800",
      });
    }

    // Calculate total for average
    const total = data.reduce((sum, item) => sum + item.value, 0);
    const average = total / data.length;

    // Draw chart
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 10;
    const innerRadius = radius * 0.6;

    // Draw segments
    let startAngle = -0.5 * Math.PI; // Start at top

    data.forEach((segment) => {
      const segmentValue = segment.value;
      const endAngle = startAngle + 2 * Math.PI * segmentValue;

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.arc(centerX, centerY, innerRadius, endAngle, startAngle, true);
      ctx.closePath();

      ctx.fillStyle = segment.color;
      ctx.fill();

      startAngle = endAngle;
    });

    // Draw center circle with average
    ctx.beginPath();
    ctx.arc(centerX, centerY, innerRadius, 0, 2 * Math.PI);
    ctx.fillStyle = "#FFFFFF";
    ctx.fill();

    // Draw text in center
    ctx.fillStyle = "#333333";
    ctx.font = "bold 24px Inter";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${(average * 100).toFixed(0)}%`, centerX, centerY);

    // Draw legend
    const legendY = canvas.height - 40;
    const legendSpacing = canvas.width / (data.length + 1);

    data.forEach((segment, index) => {
      const x = (index + 1) * legendSpacing;

      // Draw color box
      ctx.fillStyle = segment.color;
      ctx.fillRect(x - 30, legendY, 10, 10);

      // Draw label
      ctx.fillStyle = "#666666";
      ctx.font = "10px Inter";
      ctx.textAlign = "left";
      ctx.fillText(segment.label, x - 15, legendY + 8);
    });
  }

  // Render enhanced evidence with context matching
  function renderEnhancedEvidence(result) {
    if (!result) {
      return "<p>No evidence found related to this content.</p>";
    }

    const references = result.references;
    const analysis = result.analysis; // Get the analysis object
    const userInput = result.userInput;

    // Extract key phrases from user input
    const userKeywords = extractKeywords(userInput);

    let html = '<div class="evidence-sections">';
    let evidenceFound = false; // Flag to track if any evidence was rendered

    // Render Gemini AI Evidence (if available)
    if (analysis && analysis.gemini_evidence) {
      evidenceFound = true;
      html += `
        <div class="evidence-section">
          <h4>AI Analysis Insights</h4>
          <div class="evidence-items">
            <div class="evidence-item ai-insight">
              <div class="evidence-body">
                <p>${analysis.gemini_evidence.replace(/\\n/g, "<br>")}</p> 
              </div>
            </div>
          </div>
        </div>
      `;
    }
    // Render Gemini Sources (if available)
    if (
      analysis &&
      analysis.gemini_sources &&
      analysis.gemini_sources.length > 0
    ) {
      evidenceFound = true; // Mark evidence found if sources exist
      html += `
        <div class="evidence-section">
          <h4>AI Suggested Sources</h4>
          <div class="evidence-items">
            ${analysis.gemini_sources
              .map(
                (source) => `
              <div class="evidence-item ai-source">
                <div class="evidence-body">
                   ${
                     source.url
                       ? `<a href="${
                           source.url
                         }" target="_blank" class="evidence-link">${
                           source.title || source.url
                         }</a>`
                       : `<span>${
                           source.title || "Source provided without URL"
                         }</span>`
                   }
                </div>
              </div>
            `
              )
              .join("")}
          </div>
        </div>
      `;
    }

    // Render fact check claims with relevance indicators
    if (
      references && // Check if references exist
      references.fact_check_claims &&
      references.fact_check_claims.length > 0
    ) {
      evidenceFound = true;
      html += `
        <div class="evidence-section">
          <h4>Fact Check Results</h4>
          <div class="evidence-items">
      `;

      references.fact_check_claims.forEach((claim) => {
        const claimText = claim.text || claim.title || "";
        const relevance = calculateRelevance(claimText, userKeywords);
        const relevanceClass =
          relevance > 0.7
            ? "high-relevance"
            : relevance > 0.4
            ? "medium-relevance"
            : "low-relevance";

        html += `
          <div class="evidence-item ${relevanceClass}">
            <div class="evidence-header">
              <h5>${claim.title || "Fact Check"}</h5>
              <span class="relevance-badge">
                ${
                  relevance > 0.7
                    ? "Highly Relevant"
                    : relevance > 0.4
                    ? "Relevant"
                    : "Somewhat Relevant"
                }
              </span>
            </div>
            <div class="evidence-body">
              <p>${claim.text || "No detailed information available."}</p>
              <div class="evidence-meta">
                ${
                  claim.publisher
                    ? `<span class="evidence-source">Source: ${claim.publisher}</span>`
                    : ""
                }
                ${
                  claim.claimDate
                    ? `<span class="evidence-date">Date: ${new Date(
                        claim.claimDate
                      ).toLocaleDateString()}</span>`
                    : ""
                }
              </div>
              ${
                claim.url
                  ? `<a href="${claim.url}" target="_blank" class="evidence-link">View Full Fact Check</a>`
                  : ""
              }
            </div>
          </div>
        `;
      });

      html += `
          </div>
        </div>
      `;
    }

    // Render similar articles with relevance indicators
    if (
      references &&
      references.similar_articles &&
      references.similar_articles.length > 0
    ) {
      // Check if references exist
      evidenceFound = true;
      html += `
        <div class="evidence-section">
          <h4>Related News Articles</h4>
          <div class="evidence-items">
      `;

      references.similar_articles.forEach((article) => {
        const articleText = `${article.title} ${article.description || ""}`;
        const relevance = calculateRelevance(articleText, userKeywords);
        const relevanceClass =
          relevance > 0.7
            ? "high-relevance"
            : relevance > 0.4
            ? "medium-relevance"
            : "low-relevance";

        html += `
          <div class="evidence-item ${relevanceClass}">
            <div class="evidence-header">
              <h5>${article.title}</h5>
              <span class="relevance-badge">
                ${
                  relevance > 0.7
                    ? "Highly Relevant"
                    : relevance > 0.4
                    ? "Relevant"
                    : "Somewhat Relevant"
                }
              </span>
            </div>
            <div class="evidence-body">
              ${
                article.urlToImage
                  ? `<img src="${article.urlToImage}" class="evidence-image" alt="${article.title}">`
                  : ""
              }
              <p>${article.description || "No description available."}</p>
              <div class="evidence-meta">
                ${
                  article.source?.name
                    ? `<span class="evidence-source">Source: ${article.source.name}</span>`
                    : ""
                }
                ${
                  article.publishedAt
                    ? `<span class="evidence-date">Date: ${new Date(
                        article.publishedAt
                      ).toLocaleDateString()}</span>`
                    : ""
                }
              </div>
              <a href="${
                article.url
              }" target="_blank" class="evidence-link">Read Full Article</a>
            </div>
          </div>
        `;
      });

      html += `
          </div>
        </div>
      `;
    }

    // Fallback message if no evidence was rendered at all
    if (!evidenceFound) {
      html +=
        "<p>No specific supporting evidence (fact checks, related articles, or AI insights) could be found for this text at this time.</p>";
    }

    html += "</div>";
    return html;
  }

  // Render sources information
  function renderSourcesInfo(result) {
    if (
      !result ||
      !result.references ||
      !result.references.verification_sources
    ) {
      return "<p>No source information available.</p>";
    }

    const sources = result.references.verification_sources;
    let html = `
      <div class="sources-overview">
        <h4>Verification Sources</h4>
        <p>Analysis based on data from ${sources.length} trusted news sources and fact-checking organizations.</p>
        
        <div class="sources-grid">
    `;

    // Group sources by category
    const categories = {
      "fact-checkers": [],
      "news-agencies": [],
      international: [],
      specialized: [],
    };

    // Sort sources into categories
    sources.forEach((source) => {
      if (
        source.toLowerCase().includes("fact") ||
        source.toLowerCase().includes("check")
      ) {
        categories["fact-checkers"].push(source);
      } else if (
        source.toLowerCase().includes("associated press") ||
        source.toLowerCase().includes("reuters")
      ) {
        categories["news-agencies"].push(source);
      } else if (
        source.toLowerCase().includes("bbc") ||
        source.toLowerCase().includes("international")
      ) {
        categories["international"].push(source);
      } else {
        categories["specialized"].push(source);
      }
    });

    // Render each category
    Object.entries(categories).forEach(([category, categorySources]) => {
      if (categorySources.length > 0) {
        html += `
          <div class="source-category">
            <h5>${category
              .split("-")
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(" ")}</h5>
            <div class="source-tags">
              ${categorySources
                .map(
                  (source) => `
                <div class="source-tag">${source}</div>
              `
                )
                .join("")}
            </div>
          </div>
        `;
      }
    });

    html += `
        </div>
      </div>
      
      <div class="source-methodology">
        <h4>Verification Methodology</h4>
        <p>Our system evaluates news by comparing it against verified reports from trusted sources, checking for consistency with known facts, and analyzing linguistic patterns associated with misinformation.</p>
        
        <div class="methodology-steps">
          <div class="methodology-step">
            <div class="step-number">1</div>
            <div class="step-content">
              <h5>Content Analysis</h5>
              <p>AI models analyze text for patterns common in fake news</p>
            </div>
          </div>
          <div class="methodology-step">
            <div class="step-number">2</div>
            <div class="step-content">
              <h5>Fact Checking</h5>
              <p>Claims are cross-referenced with fact-checking databases</p>
            </div>
          </div>
          <div class="methodology-step">
            <div class="step-number">3</div>
            <div class="step-content">
              <h5>Source Verification</h5>
              <p>Credibility of sources is evaluated based on track record</p>
            </div>
          </div>
        </div>
      </div>
    `;

    return html;
  }

  // Extract keywords from text
  function extractKeywords(text) {
    if (!text) return [];

    // Simple keyword extraction - remove common words and punctuation
    const commonWords = [
      "the",
      "and",
      "a",
      "an",
      "in",
      "on",
      "at",
      "to",
      "for",
      "of",
      "with",
      "is",
      "are",
      "was",
      "were",
    ];
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .filter((word) => word.length > 3 && !commonWords.includes(word));

    // Count word frequency
    const wordCounts = {};
    words.forEach((word) => {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    });

    // Sort by frequency and take top keywords
    return Object.keys(wordCounts)
      .sort((a, b) => wordCounts[b] - wordCounts[a])
      .slice(0, 15);
  }

  // Calculate relevance between a text and keywords
  function calculateRelevance(text, keywords) {
    if (!text || !keywords || keywords.length === 0) return 0;

    text = text.toLowerCase();
    let matches = 0;

    keywords.forEach((keyword) => {
      if (text.includes(keyword)) {
        matches++;
      }
    });

    return matches / keywords.length;
  }

  // Initialize report navigation
  function initReportNavigation() {
    const navButtons = document.querySelectorAll(".report-nav-btn");
    const reportSections = document.querySelectorAll(".report-section");

    navButtons.forEach((button) => {
      button.addEventListener("click", () => {
        // Remove active class from all buttons and sections
        navButtons.forEach((btn) => btn.classList.remove("active"));
        reportSections.forEach((section) => section.classList.remove("active"));

        // Add active class to clicked button
        button.classList.add("active");

        // Show the corresponding section
        const sectionId = button.getAttribute("data-section") + "-section";
        document.getElementById(sectionId).classList.add("active");
      });
    });
  }

  // Generate summary text based on results
  function getSummaryText(result, isBasicFact) {
    if (isBasicFact) {
      return result.isReal
        ? "Our analysis confirms this is a well-established factual statement that aligns with scientific consensus and verified information."
        : "Our analysis indicates this statement contradicts established scientific knowledge and is generally considered incorrect.";
    }

    if (result.isReal) {
      return "After analyzing multiple factors including content, source credibility, and cross-referencing with fact-checking databases, this content appears to be legitimate and trustworthy.";
    } else {
      return "Our comprehensive analysis has identified significant indicators of misinformation in this content. The combination of content analysis, fact-checking, and source verification suggests this information is not reliable.";
    }
  }

  // Generate recommendation text
  function getRecommendationText(result, isBasicFact) {
    if (isBasicFact) {
      return result.isReal
        ? "This is a verified fact supported by established scientific knowledge."
        : "This statement contradicts scientific consensus and should not be considered factual.";
    }

    if (result.isReal) {
      return "This content appears to be reliable and can be shared with confidence.";
    } else {
      return "Exercise caution with this content as it contains misinformation and should not be shared without verification.";
    }
  }

  // Generate analysis explanation
  function getAnalysisExplanation(result, isBasicFact) {
    if (isBasicFact) {
      return result.isReal
        ? "Our system has identified this as a basic factual statement that is consistently supported by authoritative sources and scientific consensus."
        : "Our system has identified this as a common misconception that contradicts established scientific knowledge and reliable information sources.";
    }

    const highScoreThreshold = 0.7;

    // Check which components have high scores
    const highComponents = [];
    if (result.analysis.model_score > highScoreThreshold)
      highComponents.push("Model content analysis");
    if (result.analysis.fact_check_score > highScoreThreshold)
      highComponents.push("fact verification");
    if (result.analysis.verification_score > highScoreThreshold)
      highComponents.push("external verification");
    if (result.analysis.source_credibility > highScoreThreshold)
      highComponents.push("source credibility");

    if (result.isReal) {
      if (highComponents.length > 0) {
        return `This content scored particularly well in ${highComponents.join(
          ", "
        )}, indicating strong reliability. The analysis suggests the information comes from credible sources and aligns with verified facts.`;
      } else {
        return "While this content passed our verification checks, it did so with moderate confidence. Consider consulting additional sources for complete confirmation.";
      }
    } else {
      return "Our analysis detected patterns common in misleading content. The combination of linguistic markers, fact-checking results, and source verification indicates this information lacks credibility.";
    }
  }

  // Create the trust score donut chart
  function createTrustScoreChart(result) {
    const canvas = document.getElementById("trust-score-chart");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const confidencePercent = (result.confidence * 100).toFixed(1);

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set up the chart
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) * 0.8;

    // Draw background circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
    ctx.fill();

    // Draw progress arc
    const startAngle = -Math.PI / 2; // Start at top
    const endAngle = startAngle + Math.PI * 2 * (confidencePercent / 100);

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    ctx.lineTo(centerX, centerY);
    ctx.closePath();

    // Use appropriate color based on result
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    if (result.isReal) {
      gradient.addColorStop(0, "#00ff88");
      gradient.addColorStop(1, "#00ccaa");
    } else {
      gradient.addColorStop(0, "#ff3366");
      gradient.addColorStop(1, "#ff6b6b");
    }

    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw inner circle for donut effect
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.7, 0, Math.PI * 2);
    ctx.fillStyle = document.body.classList.contains("light-theme")
      ? "#f5f5f5"
      : "#13132f";
    ctx.fill();

    // Draw text
    ctx.fillStyle = document.body.classList.contains("light-theme")
      ? "#333"
      : "#fff";
    ctx.font = "bold 24px Inter";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(confidencePercent + "%", centerX, centerY - 10);

    ctx.font = "14px Inter";
    ctx.fillStyle = document.body.classList.contains("light-theme")
      ? "#666"
      : "#aaa";
    ctx.fillText("Trust Score", centerX, centerY + 15);

    // Add "Powered by Gemini" if Gemini score is present
    if (result.analysis.gemini_score !== undefined) {
      ctx.font = "10px Inter";
      ctx.fillStyle = document.body.classList.contains("light-theme")
        ? "#8e24aa"
        : "#ab47bc";
      ctx.fillText("Enhanced by Gemini AI", centerX, centerY + 35);
    }
  }

  // Create the breakdown bar chart
  function createBreakdownChart(result) {
    const canvas = document.getElementById("breakdown-chart");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Prepare data
    const labels = [];
    const data = [];

    // Add Gemini score if available
    if (result.analysis.gemini_score !== undefined) {
      labels.push("Gemini AI");
      data.push((result.analysis.gemini_score * 100).toFixed(1));
    }

    // Add other analysis components
    labels.push("AI Analysis");
    data.push((result.analysis.model_score * 100).toFixed(1));

    labels.push("Fact Check");
    data.push((result.analysis.fact_check_score * 100).toFixed(1));

    labels.push("Verification");
    data.push((result.analysis.verification_score * 100).toFixed(1));

    if (result.analysis.source_credibility) {
      labels.push("Source Credibility");
      data.push((result.analysis.source_credibility * 100).toFixed(1));
    }

    // Set up chart dimensions
    const chartLeft = 120; // Space for labels
    const chartRight = canvas.width - 50; // Space for values
    const chartTop = 30;
    const chartBottom = canvas.height - 30;
    const chartWidth = chartRight - chartLeft;
    const chartHeight = chartBottom - chartTop;
    const barHeight = Math.min(30, (chartHeight / labels.length) * 0.7);
    const barSpacing = chartHeight / labels.length;

    // Draw title
    ctx.fillStyle = document.body.classList.contains("light-theme")
      ? "#333"
      : "#fff";
    ctx.font = "bold 16px Inter";
    ctx.textAlign = "center";
    ctx.fillText("Analysis Components", canvas.width / 2, 15);

    // Draw bars
    labels.forEach((label, i) => {
      const barY = chartTop + i * barSpacing + barSpacing / 2 - barHeight / 2;

      // Draw label
      ctx.fillStyle = document.body.classList.contains("light-theme")
        ? "#555"
        : "#ddd";
      ctx.font = "14px Inter";
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillText(label, chartLeft - 10, barY + barHeight / 2);

      // Draw background bar
      ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
      ctx.fillRect(chartLeft, barY, chartWidth, barHeight);

      // Draw value bar
      const gradient = ctx.createLinearGradient(chartLeft, 0, chartRight, 0);

      // Use different color for Gemini
      if (label === "Gemini AI") {
        gradient.addColorStop(0, "#8e24aa"); // Purple for Gemini
        gradient.addColorStop(1, "#ab47bc");
      } else {
        gradient.addColorStop(0, result.isReal ? "#00ff88" : "#ff3366");
        gradient.addColorStop(1, result.isReal ? "#00ccaa" : "#ff6b6b");
      }

      ctx.fillStyle = gradient;
      ctx.fillRect(chartLeft, barY, chartWidth * (data[i] / 100), barHeight);

      // Draw value text
      ctx.fillStyle = document.body.classList.contains("light-theme")
        ? "#333"
        : "#fff";
      ctx.textAlign = "left";
      ctx.fillText(
        data[i] + "%",
        chartLeft + chartWidth * (data[i] / 100) + 5,
        barY + barHeight / 2
      );
    });
  }

  // Function to render Gemini insights
  function renderGeminiInsights(insights) {
    if (!insights) return "<p>No AI insights available for this content.</p>";

    let html = '<div class="gemini-insights">';

    // Key findings
    if (insights.key_findings && insights.key_findings.length > 0) {
      html += `
        <div class="insight-section">
          <h4>Key Findings</h4>
          <ul class="insight-list">
            ${insights.key_findings
              .map(
                (finding) => `
              <li class="insight-item">
                <div class="insight-icon"><i class="fas fa-lightbulb"></i></div>
                <div class="insight-content">${finding}</div>
              </li>
            `
              )
              .join("")}
          </ul>
        </div>
      `;
    }

    // Misleading elements
    if (
      insights.misleading_elements &&
      insights.misleading_elements.length > 0
    ) {
      html += `
        <div class="insight-section">
          <h4>Potential Misleading Elements</h4>
          <ul class="insight-list warning">
            ${insights.misleading_elements
              .map(
                (element) => `
              <li class="insight-item">
                <div class="insight-icon"><i class="fas fa-exclamation-triangle"></i></div>
                <div class="insight-content">${element}</div>
              </li>
            `
              )
              .join("")}
          </ul>
        </div>
      `;
    }

    // Factual claims
    if (insights.factual_claims && insights.factual_claims.length > 0) {
      html += `
        <div class="insight-section">
          <h4>Verifiable Claims</h4>
          <ul class="insight-list factual">
            ${insights.factual_claims
              .map(
                (claim) => `
              <li class="insight-item">
                <div class="insight-icon"><i class="fas fa-check-circle"></i></div>
                <div class="insight-content">${claim}</div>
              </li>
            `
              )
              .join("")}
          </ul>
        </div>
      `;
    }

    html += `
      <div class="gemini-attribution">
        <img src="https://storage.googleapis.com/gweb-uniblog-publish-prod/images/gemini_1.max-1000x1000.png" alt="Google Gemini logo" class="gemini-logo">
        <span>Insights powered by Google Gemini AI</span>
      </div>
    `;

    html += "</div>";
    return html;
  }
});
