import React, { useState, useRef, useEffect, useMemo } from "react";
import axios from "axios";
import "./App.css";
import api from './api'; 

axios.defaults.xsrfCookieName = 'csrftoken';
axios.defaults.xsrfHeaderName = 'X-CSRFToken';
axios.defaults.withCredentials = true;

// Add the getCookie function at the top level
const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
};

function App() {

  const [file, setFile] = useState(null);
  const [graphType, setGraphType] = useState("line");
  const [graphImage, setGraphImage] = useState("");
  const [categories, setCategories] = useState([]);
  const [xColumn, setXColumn] = useState("");
  const [yColumns, setYColumns] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [colors, setColors] = useState([]);
  const [applyAll, setApplyAll] = useState(false);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [activeTab, setActiveTab] = useState("visualize");
  const [isHolographic, setIsHolographic] = useState(false);
  
  const chartContainerRef = useRef(null);
  const holographicRef = useRef(null);

  const defaultColors = useMemo(() => [
    '#328e6e', '#67ae6e', '#90c67c', '#e1eebc',
    '#6ec8ff', '#ff6ec7', '#c7ff6e', '#ffb56e',
    '#9e6eff', '#ff6e9e', '#6eff9e', '#ff6e6e',
    '#6e6eff', '#ffff6e', '#6effff', '#ff6eff'
  ], []);

  const allChartTypes = [
    { type: "line", name: "〰️ Quantum Line", description: "Temporal data streams visualization" },
    { type: "bar", name: "▮▮ Nano Bars", description: "Molecular-level comparison matrices" },
    { type: "pie", name: "⊛ Holographic Pie", description: "Sectoral energy distribution mapping" },
    { type: "area", name: "◬ Topographic Area", description: "Volumetric data terrain modeling" },
    { type: "scatter", name: "⏺ Photon Scatter", description: "Particle correlation visualization" },
    { type: "histogram", name: "▯▯ Frequency Matrix", description: "Data wave distribution analysis" },
    { type: "box", name: "⬛ Quantum Box", description: "Multi-dimensional data containment" },
    { type: "violin", name: "🎻 Sonic Violin", description: "Harmonic data resonance patterns" },
    { type: "funnel", name: "⏳ Temporal Funnel", description: "Data flow convergence visualization" },
    { type: "sunburst", name: "☀️ Solar Flare", description: "Radial data energy mapping" },
    { type: "waterfall", name: "🌊 Hydro Cascade", description: "Sequential data transformation flow" },
    { type: "combo", name: "⚡ Fusion Chart", description: "Hybrid data visualization matrix" },
    { type: "stock", name: "📈 Quantum Ticker", description: "Temporal financial data streams" },
    { type: "3d", name: "🛸 3D Hologram", description: "Multi-dimensional data projection" }
  ];

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setErrorMessage("");
  };

  const handleUpload = async () => {
    if (!file) {
      setErrorMessage("❌ Please select a file first");
      return;
    }
    
    setIsLoading(true);
    setErrorMessage("");
    setGraphImage("");
    setCategories([]);
    setRecommendations([]);
    
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await api.post('/upload_file', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'X-CSRFToken': getCookie('csrftoken')
        }
      });
      
      setCategories(response.data.categories);
      setXColumn(response.data.categories[0] || "");
      const initialYColumns = [response.data.categories[1] || ""];
      setYColumns(initialYColumns);
      setColors(defaultColors.slice(0, initialYColumns.length));
      
      generateGraph(response.data.categories[0] || "", initialYColumns, "line");
      
      try {
        const recResponse = await api.post(`/get_recommendations`, {
          columns: response.data.categories
        });
        const mappedRecs = allChartTypes.map(chart => {
          const rec = (recResponse.data.recommendations || []).find(r => r.type === chart.type);
          return {
            ...chart,
            confidence: rec ? rec.confidence : 0
          };
        });
        setRecommendations(mappedRecs);
      } catch (error) {
        console.error("Error getting recommendations:", error);
        setRecommendations(allChartTypes.map(chart => ({ ...chart, confidence: 0 })));
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      setErrorMessage(error.response?.data?.error || "❌ File upload failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleXColumnChange = (e) => {
    const newXColumn = e.target.value;
    setXColumn(newXColumn);
    generateGraph(newXColumn, yColumns, graphType);
  };

  const handleYColumnChange = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions, (option) => option.value);
    setYColumns(selectedOptions);
    generateGraph(xColumn, selectedOptions, graphType);
  };

  const handleColorChange = (index, newColor) => {
    setColors(prevColors => {
      const updatedColors = [...prevColors];
      updatedColors[index] = newColor;
      if (applyAll) {
        return updatedColors.map(() => newColor);
      }
      return updatedColors;
    });
  };

  const generateGraph = async (xCol, yCols, type, download = false) => {
    if (!xCol || yCols.length === 0) {
      setErrorMessage("Please select both X and Y columns");
      return;
    }
    
    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await api.post('/generate_graph', {
        graph_type: type,
        x_column: xCol,
        y_columns: yCols,
        colors: colors,
        color_all: applyAll,
        download: download
      }, {
        responseType: download ? 'blob' : 'json',
        headers: {
          'X-CSRFToken': getCookie('csrftoken')
        }
      });

      if (download) {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${type}_chart.png`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      } else {
        if (response.data.graph) {
          setGraphImage(`data:image/png;base64,${response.data.graph}`);
          setScale(1);
          setPosition({ x: 0, y: 0 });
        }
      }
    } catch (error) {
      console.error("Error generating graph:", error);
      setErrorMessage(error.response?.data?.error || "❌ Something went wrong while generating the graph.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    generateGraph(xColumn, yColumns, graphType, true);
  };

  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setStartPos({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - startPos.x,
      y: e.clientY - startPos.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const resetView = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container) return;

    const handleWheel = (e) => {
      e.preventDefault();
      const delta = e.deltaY * -0.002;
      setScale(prev => Math.min(Math.max(0.5, prev + delta), 3));
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, []);

  useEffect(() => {
    if (yColumns.length > 0) {
      setColors(prevColors => {
        if (applyAll && prevColors.length > 0) {
          return Array(yColumns.length).fill(prevColors[0]);
        } else {
          const newColors = [...prevColors];
          while (newColors.length < yColumns.length) {
            newColors.push(defaultColors[newColors.length % defaultColors.length]);
          }
          return newColors.slice(0, yColumns.length);
        }
      });
    }
  }, [yColumns, applyAll, defaultColors]);

  return (
    <div className="app-container">
      <div className="particle-background"></div>
      
      <div className={`main-container ${isHolographic ? 'holographic-mode' : ''}`}>
        <div className="header">
          <h1>
            <span className="logo-icon">🔮</span>
            <span className="logo-text">Viz Pro</span>
            <span className="tagline">Data Projection</span>  
          </h1>
          
          <div className="mode-toggle">
            <label className="holographic-switch">
              <input 
                type="checkbox" 
                checked={isHolographic}
                onChange={() => setIsHolographic(!isHolographic)}
              />
              <span className="slider">
                <span className="holographic-label">HOLO</span>
                <span className="normal-label">NORM</span>
              </span>
            </label>
          </div>
        </div>

        <div className="navigation-tabs">
          <button 
            className={`tab ${activeTab === "visualize" ? "active" : ""}`}
            onClick={() => setActiveTab("visualize")}
          >
            🌌 Visualize
          </button>
          <button 
            className={`tab ${activeTab === "analyze" ? "active" : ""}`}
            onClick={() => setActiveTab("analyze")}
          >
            🔍 Analyze
          </button>
          <button 
            className={`tab ${activeTab === "export" ? "active" : ""}`}
            onClick={() => setActiveTab("export")}
          >
            🚀 Export
          </button>
        </div>

        <div className="app-content">
          <div className={`control-panel ${isHolographic ? 'holographic' : ''}`}>
            <div className="upload-section">
              <h2>
                <span className="section-icon">📤</span>
                Data Upload
              </h2>
              <div className="file-upload-area">
                <div className="upload-icon">☁️</div>
                <input 
                  type="file" 
                  id="file-upload"
                  onChange={handleFileChange} 
                  accept=".csv,.json,.xlsx"
                  className="file-uplode-btn"
                />
                <label htmlFor="file-upload" className="upload-label">
                  {file ? (
                    <div className="file-preview">
                      <span className="file-name">{file.name}</span>
                      <span className="file-size">{(file.size / 1024).toFixed(1)} KB</span>
                    </div>
                  ) : (
                    ""
                  )}
                </label>
                <button 
                  className={`upload-btn ${isLoading ? 'loading' : ''}`}
                  onClick={handleUpload}
                  disabled={!file || isLoading}
                >
                  {isLoading ? (
                    <div className="spinner">
                      <div className="spinner-circle"></div>
                    </div>
                  ) : (
                    "Activate Data Stream"
                  )}
                </button>
              </div>
            </div>

            {categories.length > 0 && (
              <div className="configuration-section">
                <h2>
                  <span className="section-icon">⚙️</span>
                  Projection Parameters
                </h2>
                
                <div className="parameter-group">
                  <label className="parameter-label">
                    <span className="parameter-icon">↔️</span>
                    X-Axis Dimension
                  </label>
                  <div className="select-wrapper">
                    <select 
                      value={xColumn} 
                      onChange={handleXColumnChange}
                    >
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                    <div className="select-arrow"></div>
                  </div>
                </div>

                <div className="parameter-group">
                  <label className="parameter-label">
                    <span className="parameter-icon">↕️</span>
                    Y-Axis Dimensions
                  </label>
                  <div className="multi-select-wrapper">
                    <select 
                      multiple 
                      value={yColumns} 
                      onChange={handleYColumnChange}
                      className="multi-select"
                    >
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                    <div className="selected-count">
                      {yColumns.length} selected
                    </div>
                  </div>
                </div>

                <div className="parameter-group">
                  <label className="parameter-label">
                    <span className="parameter-icon">🖌️</span>
                    Visualization Matrix
                  </label>
                  <div className="visualization-grid">
                    {allChartTypes.slice(0, 6).map((chart) => (
                      <div 
                        key={chart.type}
                        className={`visualization-option ${graphType === chart.type ? 'active' : ''}`}
                        onClick={() => {
                          setGraphType(chart.type);
                          generateGraph(xColumn, yColumns, chart.type);
                        }}
                      >
                        <div className="option-icon">{chart.name.split(' ')[0]}</div>
                        <div className="option-name">{chart.name.split(' ').slice(1).join(' ')}</div>
                      </div>
                    ))}
                  </div>
                  <div className="more-options">
                    <button 
                      className="more-btn"
                      onClick={() => setShowRecommendations(!showRecommendations)}
                    >
                      {showRecommendations ? 'Hide Advanced' : 'Show All Matrices'}
                    </button>
                  </div>
                </div>

                {showRecommendations && (
                  <div className="recommendation-panel">
                    <h3>AI-Powered Matrix Suggestions</h3>
                    <div className="recommendation-grid">
                      {recommendations.map((chart, index) => (
                        <div 
                          key={index}
                          className={`recommendation-card ${chart.confidence > 0 ? 'recommended' : ''}`}
                          onClick={() => {
                            setGraphType(chart.type);
                            generateGraph(xColumn, yColumns, chart.type);
                            setShowRecommendations(false);
                          }}
                        >
                          <div className="recommendation-icon">{chart.name.split(' ')[0]}</div>
                          <div className="recommendation-content">
                            <h4>{chart.name.split(' ').slice(1).join(' ')}</h4>
                            <p>{chart.description}</p>
                            {chart.confidence > 0 && (
                              <div className="confidence-meter">
                                <div 
                                  className="confidence-bar" 
                                  style={{ width: `${chart.confidence * 100}%` }}
                                ></div>
                                <span className="confidence-value">
                                  {Math.round(chart.confidence * 100)}% match
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="color-controls">
                  <label className="color-label">
                    <span className="parameter-icon">🌈</span>
                    Photon Spectrum
                  </label>
                  <div className="color-grid">
                    {yColumns.map((column, index) => (
                      <div key={index} className="color-item">
                        <div className="color-preview" 
                             style={{ 
                               backgroundColor: colors[index] || defaultColors[index % defaultColors.length],
                               boxShadow: `0 0 10px ${colors[index] || defaultColors[index % defaultColors.length]}`
                             }}>
                        </div>
                        <select
                          value={colors[index] || defaultColors[index % defaultColors.length]}
                          onChange={(e) => handleColorChange(index, e.target.value)}
                        >
                          {defaultColors.map((color, colorIndex) => (
                            <option 
                              key={colorIndex} 
                              value={color}
                              style={{ backgroundColor: color }}
                            >
                              {color}
                            </option>
                          ))}
                        </select>
                        <span className="color-label">{column}</span>
                      </div>
                    ))}
                  </div>
                  <div className="color-global">
                    <label>
                      <input 
                        type="checkbox" 
                        checked={applyAll}
                        onChange={(e) => setApplyAll(e.target.checked)}
                      />
                      Sync Spectrum Across Dimensions
                    </label>
                  </div>
                </div>
              </div>
            )}

            {errorMessage && (
              <div className={`alert ${errorMessage.includes("❌") ? "alert-error" : "alert-warning"}`}>
                {errorMessage}
              </div>
            )}
          </div>

          <div className={`visualization-container ${isHolographic ? 'holographic' : ''}`}>
            {graphImage ? (
              <>
                <div className="visualization-header">
                  <h2>Projection Output</h2>
                  <div className="visualization-controls">
                    <button className="control-btn" onClick={resetView}>
                      <span className="control-icon">🔄</span>
                      Reset View
                    </button>
                    <button className="control-btn" onClick={handleDownload}>
                      <span className="control-icon">💾</span>
                      Download
                    </button>
                    <div className="zoom-controls">
                      <button className="zoom-btn" onClick={() => setScale(prev => Math.max(0.5, prev - 0.1))}>
                        <span className="control-icon">➖</span>
                      </button>
                      <span className="zoom-level">{(scale * 100).toFixed(0)}%</span>
                      <button className="zoom-btn" onClick={() => setScale(prev => Math.min(3, prev + 0.1))}>
                        <span className="control-icon">➕</span>
                      </button>
                    </div>
                  </div>
                </div>
                
                <div 
                  className={`visualization-area ${isHolographic ? 'holographic' : ''}`}
                  ref={chartContainerRef}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  style={{ 
                    cursor: isDragging ? 'grabbing' : 'grab',
                    transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                    transformOrigin: '0 0'
                  }}
                >
                  {isHolographic && (
                    <div className="holographic-effects" ref={holographicRef}>
                      <div className="holographic-line"></div>
                      <div className="holographic-line"></div>
                      <div className="holographic-line"></div>
                    </div>
                  )}
                  <img 
                    src={graphImage} 
                    alt="Data visualization" 
                    className={`visualization-image ${isHolographic ? 'holographic' : ''}`}
                  />
                </div>
              </>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">🔮</div>
                <h3>No Active Data Stream</h3>
                <p>Upload a dataset to begin holographic projection</p>
                <div className="empty-animation">
                  <div className="particle"></div>
                  <div className="particle"></div>
                  <div className="particle"></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;