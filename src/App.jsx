import React, { useState, useEffect, useRef } from "react";
import { servicesData, interfaceTranslations, findServiceByQuery, generateChatbotResponse } from "./data/servicesData";
import { useSpeech } from "./hooks/useSpeech";
import { LoginScreen } from "./components/LoginScreen";
import { LeafletMap } from "./components/LeafletMap";
import {
  Search,
  Mic,
  IdCard,
  Globe,
  Car,
  Truck,
  Home,
  MapPin,
  Send,
  Download,
  History,
  LogOut,
  Sun,
  Moon,
  User,
  CheckSquare,
  Building2,
  Clock,
  CircleDollarSign,
  Compass,
  FileText,
  ChevronDown,
  Info
} from "lucide-react";

// District coordinate mappings to dynamically update regional map offices
const districtCoordinates = {
  colombo: [6.9271, 79.8612],
  kandy: [7.2906, 80.6337],
  galle: [6.0535, 80.2210],
  jaffna: [9.6615, 80.0255],
  kurunegala: [7.4818, 80.3609],
  gampaha: [7.0873, 80.0144],
  matara: [5.9549, 80.5550],
  vavuniya: [8.7542, 80.4982]
};

export function App() {
  // Theme and Language State
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentLang, setCurrentLang] = useState("en");

  // Authentication State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Search & Navigation State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedServiceId, setSelectedServiceId] = useState(null);
  const [selectedServiceData, setSelectedServiceData] = useState(null);
  const [subSearchQuery, setSubSearchQuery] = useState("");

  // Location State
  const [selectedDistrict, setSelectedDistrict] = useState("colombo");
  const [exactLocation, setExactLocation] = useState("");
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsLocationName, setGpsLocationName] = useState("");
  const [gpsUsed, setGpsUsed] = useState(false);

  // Custom Query State
  const [customQuery, setCustomQuery] = useState("");

  // History & Chat State
  const [searchHistory, setSearchHistory] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [clarificationState, setClarificationState] = useState(null); // { query, suggestions }

  // File download notification
  const [notification, setNotification] = useState("");

  const chatEndRef = useRef(null);

  // Initialize Search History and Dark Mode preferences
  useEffect(() => {
    const savedHistory = localStorage.getItem("govguide_search_history");
    if (savedHistory) {
      try {
        setSearchHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error(e);
      }
    }

    const savedTheme = localStorage.getItem("govguide_dark_mode");
    if (savedTheme === "true") {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  // Sync dark mode HTML class
  const toggleDarkMode = () => {
    const nextMode = !isDarkMode;
    setIsDarkMode(nextMode);
    localStorage.setItem("govguide_dark_mode", String(nextMode));
    if (nextMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  // Scroll to bottom of chat
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatHistory, isAiGenerating]);

  // Voice Search Result Hook
  const onSpeechResult = (text) => {
    setSearchQuery(text);
    handleSearchSubmit(text);
  };

  const { isListening, startListening, stopListening, error: speechError } = useSpeech(
    onSpeechResult,
    currentLang
  );

  // Multilingual labels shortcut
  const t = interfaceTranslations[currentLang];

  // Map Category IDs to Lucide components
  const getCategoryIcon = (iconName, size = 24) => {
    switch (iconName) {
      case "IdCard":
        return <IdCard size={size} />;
      case "Globe":
        return <Globe size={size} />;
      case "Car":
        return <Car size={size} />;
      case "Truck":
        return <Truck size={size} />;
      case "Home":
        return <Home size={size} />;
      default:
        return <Info size={size} />;
    }
  };

  // Add search term to history
  const addToHistory = (term) => {
    if (!term || term.trim() === "") return;
    const cleanTerm = term.trim();
    const updated = [cleanTerm, ...searchHistory.filter((item) => item !== cleanTerm)].slice(0, 10);
    setSearchHistory(updated);
    localStorage.setItem("govguide_search_history", JSON.stringify(updated));
  };

  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem("govguide_search_history");
  };

  // Core Search / RAG Engine logic
  const executeSearchEngine = (queryStr) => {
    if (!queryStr || queryStr.trim() === "") return;
    setIsAiGenerating(true);
    setClarificationState(null);

    // Dynamic latency simulation
    setTimeout(() => {
      const match = findServiceByQuery(queryStr, currentLang);
      setIsAiGenerating(false);

      if (match) {
        setSelectedCategory(match.categoryId);
        setSelectedServiceId(match.serviceId);
        setSelectedServiceData(match.data);
        addToHistory(queryStr);

        // Populate initial chatbot assistant greeting
        const initialGreeting = {
          sender: "ai",
          text: currentLang === "si"
            ? `මම ${match.data.title.si} සඳහා වන අවශ්‍ය ලියකියවිලි සහ පියවර සොයා ගත්තා. ඔබට සහාය වීමට මම සූදානම්!`
            : currentLang === "ta"
            ? `${match.data.title.ta} க்கான விபரங்கள் கண்டறியப்பட்டுள்ளன. உங்களுக்கு உதவ நான் தயாராக உள்ளேன்!`
            : `I found the guidance for ${match.data.title.en}. How can I assist you with this service?`
        };

        setChatHistory([initialGreeting]);
      } else {
        // Did not match a specific service directly. Let's suggest related choices or ask for clarification.
        // We will look for subcategories that have partial matches.
        const suggestions = [];
        for (const catId in servicesData) {
          const cat = servicesData[catId];
          for (const subId in cat.subCategories) {
            const sub = cat.subCategories[subId];
            if (
              sub.title.en.toLowerCase().includes(queryStr.toLowerCase()) ||
              sub.title.si.toLowerCase().includes(queryStr.toLowerCase()) ||
              sub.title.ta.toLowerCase().includes(queryStr.toLowerCase())
            ) {
              suggestions.push({ id: subId, categoryId: catId, title: sub.title });
            }
          }
        }

        if (suggestions.length > 0) {
          setClarificationState({ query: queryStr, suggestions });
          setChatHistory([
            {
              sender: "ai",
              text: t.clarificationRequired
            }
          ]);
        } else {
          setChatHistory([
            {
              sender: "ai",
              text: currentLang === "si"
                ? `සමාවන්න, "${queryStr}" සේවාව සඳහා නිශ්චිත තොරතුරු සොයා ගැනීමට නොහැකි විය. කරුණාකර වෙනත් වචන භාවිතයෙන් සොයන්න හෝ පහත ප්‍රධාන කාණ්ඩ තෝරන්න.`
                : currentLang === "ta"
                ? `மன்னிக்கவும், "${queryStr}" சேவைக்கான தகவலைக் கண்டறிய முடியவில்லை. தயவுசெய்து வேறு வார்த்தைகளில் தேடவும் அல்லது கீழே உள்ள பிரிவுகளைத் தேர்ந்தெடுக்கவும்.`
                : `Sorry, we couldn't match any specific service for "${queryStr}". Please try refining your query or select a category below.`
            }
          ]);
        }
      }
    }, 1200);
  };

  const handleSearchSubmit = (text) => {
    const q = text || searchQuery;
    executeSearchEngine(q);
  };

  const handleSuggestionClick = (term) => {
    setSearchQuery(term);
    executeSearchEngine(term);
  };

  // Direct Menu clicks
  const handleCategorySelect = (catId) => {
    setSelectedCategory(catId);
    setSelectedServiceId(null);
    setSelectedServiceData(null);
    setSubSearchQuery("");
    setClarificationState(null);
  };

  const handleSubSelect = (subId, subData) => {
    setSelectedServiceId(subId);
    setSelectedServiceData(subData);
    setClarificationState(null);
    addToHistory(subData.title.en);

    // Initial greeting for selected service
    setChatHistory([
      {
        sender: "ai",
        text: currentLang === "si"
          ? `${subData.title.si} සේවාවට අදාළ විස්තර ඉහත දක්වා ඇත. වැඩිදුර තොරතුරු මෙතනින් විමසන්න.`
          : currentLang === "ta"
          ? `${subData.title.ta} சேவைக்கான விபரங்கள் மேலே உள்ளன. சந்தேகங்களை இங்குக் கேளுங்கள்.`
          : `Here is the official guidance for ${subData.title.en}. You can ask any follow-up questions below.`
      }
    ]);
  };

  // GPS Simulation
  const handleUseGps = () => {
    setGpsLoading(true);
    setTimeout(() => {
      setGpsLoading(false);
      setGpsUsed(true);
      
      const districtsList = Object.keys(districtCoordinates);
      const randomDistrict = districtsList[Math.floor(Math.random() * districtsList.length)];
      setSelectedDistrict(randomDistrict);
      
      const districtLabels = {
        colombo: "Colombo 07, Cinnamon Gardens",
        kandy: "Kandy Town Center, Dalada Veediya",
        galle: "Galle Fort Area",
        jaffna: "Jaffna Town, Hospital Road",
        kurunegala: "Kurunegala Central",
        gampaha: "Gampaha City Hub",
        matara: "Matara Beach Road Hub",
        vavuniya: "Vavuniya Central Bazar"
      };

      setGpsLocationName(districtLabels[randomDistrict]);
      setNotification(`${t.locationSet}: ${districtLabels[randomDistrict]}`);
      
      // Auto clear notification after 3s
      setTimeout(() => setNotification(""), 3000);
    }, 1500);
  };

  // Custom Query box submit
  const handleCustomQuerySubmit = (e) => {
    e.preventDefault();
    if (!customQuery || customQuery.trim() === "") return;
    executeSearchEngine(customQuery);
    setCustomQuery("");
  };

  // Chat follow-up submit
  const handleChatSend = (e) => {
    e.preventDefault();
    if (!chatInput || chatInput.trim() === "") return;

    const userMessage = { sender: "user", text: chatInput };
    setChatHistory((prev) => [...prev, userMessage]);
    const currentInput = chatInput;
    setChatInput("");

    setIsAiGenerating(true);

    setTimeout(() => {
      setIsAiGenerating(false);
      let replyText = "";
      if (selectedServiceData) {
        replyText = generateChatbotResponse(selectedServiceData, currentInput, currentLang);
      } else {
        replyText = currentLang === "si"
          ? "කරුණාකර ප්‍රථමයෙන් ඉහත කාණ්ඩයකින් සේවාවක් තෝරාගන්න, එවිට මට නිවැරදි පිළිතුරු සැපයිය හැක."
          : currentLang === "ta"
          ? "தயவுசெய்து முதலில் ஒரு சேவையைத் தேர்ந்தெடுக்கவும், அப்போதுதான் என்னால் துல்லியமான தகவல்களை வழங்க முடியும்."
          : "Please select or search for a government service first, so that I can provide specific answer context.";
      }

      setChatHistory((prev) => [...prev, { sender: "ai", text: replyText }]);
    }, 1000);
  };

  // Document Checklist Downloader (generates text file download)
  const downloadChecklist = () => {
    if (!selectedServiceData) return;
    const title = selectedServiceData.title[currentLang];
    const office = selectedServiceData.officeName[currentLang];
    const location = selectedServiceData.officeLocation[currentLang];
    const fees = selectedServiceData.fees[currentLang];
    const hours = selectedServiceData.hours[currentLang];
    const docs = selectedServiceData.documents[currentLang];
    const steps = selectedServiceData.steps[currentLang];

    const fileContent = `===========================================================
GOVGUIDE SRI LANKA - DOCUMENT CHECKLIST
AI Government Assistant For Citizens
===========================================================

SERVICE: ${title.toUpperCase()}
OFFICE: ${office}
LOCATION: ${location}
FEE: ${fees}
HOURS: ${hours}

-----------------------------------------------------------
REQUIRED DOCUMENTS:
-----------------------------------------------------------
${docs.map((doc, idx) => `[ ]  ${idx + 1}. ${doc}`).join("\n")}

-----------------------------------------------------------
STEP-BY-STEP PROCESS:
-----------------------------------------------------------
${steps.map((step, idx) => `Step ${idx + 1}: ${step}`).join("\n\n")}

===========================================================
Generated on: ${new Date().toLocaleDateString()}
Thank you for using GovGuide Sri Lanka.
===========================================================`;

    const blob = new Blob([fileContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `GovGuide_Checklist_${selectedServiceId}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setNotification(t.checklistDownloaded);
    setTimeout(() => setNotification(""), 3000);
  };

  // Determine Map coordinate rendering
  // If user selected Kandy, and the office has Kandy regional, offset map coordinates!
  const getMapCoordinates = () => {
    if (!selectedServiceData) return [6.9271, 79.8612];
    
    // Check if selected district coordinates are available
    if (selectedDistrict && districtCoordinates[selectedDistrict]) {
      const officeLocStr = selectedServiceData.officeLocation.en.toLowerCase();
      // If the location details indicate there is a regional branch matching selected district, we center on that district
      if (officeLocStr.includes(selectedDistrict) || officeLocStr.includes("regional") || officeLocStr.includes("island-wide")) {
        return districtCoordinates[selectedDistrict];
      }
    }
    return selectedServiceData.mapCoords || [6.8998, 79.9238];
  };

  const getMapOfficeName = () => {
    if (!selectedServiceData) return "";
    const distCapitalized = selectedDistrict.charAt(0).toUpperCase() + selectedDistrict.slice(1);
    const officeName = selectedServiceData.officeName[currentLang];
    
    const officeLocStr = selectedServiceData.officeLocation.en.toLowerCase();
    if (officeLocStr.includes(selectedDistrict) || officeLocStr.includes("regional") || officeLocStr.includes("island-wide")) {
      return `${officeName} - ${distCapitalized} ${t.districtHub}`;
    }
    return officeName;
  };

  const parseTimeToDate = (timeString, ampm) => {
    const [hours, minutes] = timeString.split(":").map(Number);
    const date = new Date();
    let hrs = hours;
    if (ampm.toLowerCase() === "pm" && hours !== 12) hrs += 12;
    if (ampm.toLowerCase() === "am" && hours === 12) hrs = 0;
    date.setHours(hrs, minutes, 0, 0);
    return date;
  };

  const getServiceStatus = () => {
    if (!selectedServiceData) return null;
    const hoursText = selectedServiceData.hours.en || "";
    const match = hoursText.match(/(\d{1,2}:\d{2})\s*(AM|PM)\s*-\s*(\d{1,2}:\d{2})\s*(AM|PM)/i);
    if (!match) return null;

    const now = new Date();
    const day = now.getDay();
    const isWeekday = day >= 1 && day <= 5;
    const start = parseTimeToDate(match[1], match[2]);
    const end = parseTimeToDate(match[3], match[4]);

    if (isWeekday && now >= start && now <= end) {
      return {
        label: t.openNow,
        isOpen: true
      };
    }

    return {
      label: t.closedNow,
      isOpen: false
    };
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserProfile(null);
    setSelectedCategory(null);
    setSelectedServiceId(null);
    setSelectedServiceData(null);
    setSearchQuery("");
    setChatHistory([]);
  };

  if (!isLoggedIn) {
    return (
      <div className={isDarkMode ? "dark" : ""}>
        <div style={{ position: "absolute", top: "20px", right: "20px" }}>
          <button onClick={toggleDarkMode} className="theme-toggle" style={{ border: "1px solid var(--border)", background: "var(--bg-card)" }}>
            {isDarkMode ? <Sun size={20} style={{ color: "#eab308" }} /> : <Moon size={20} />}
          </button>
        </div>
        <LoginScreen
          onLoginSuccess={(profile) => {
            setUserProfile(profile);
            setIsLoggedIn(true);
          }}
          currentLang={currentLang}
        />
      </div>
    );
  }

  // Filter sub-categories based on local input
  const activeSubCategories = selectedCategory
    ? Object.values(servicesData[selectedCategory].subCategories).filter((sub) => {
        const title = sub.title[currentLang].toLowerCase();
        const search = subSearchQuery.toLowerCase();
        return title.includes(search);
      })
    : [];

  return (
    <div className={isDarkMode ? "dark" : ""}>
      {/* Toast Notification */}
      {notification && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            backgroundColor: "var(--primary)",
            color: "white",
            padding: "12px 24px",
            borderRadius: "var(--radius-sm)",
            boxShadow: "var(--shadow-lg)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            gap: "10px",
            animation: "fadeIn 0.3s ease-out"
          }}
        >
          <CheckSquare size={18} />
          <span>{notification}</span>
        </div>
      )}

      {/* Top Navbar */}
      <nav className="navbar">
        <div className="nav-brand" onClick={() => {
          setSelectedCategory(null);
          setSelectedServiceId(null);
          setSelectedServiceData(null);
          setSearchQuery("");
          setClarificationState(null);
        }}>
          <span style={{ fontSize: "1.5rem" }}>🏛️</span>
          <span>{t.logo}</span>
        </div>

        <div className="nav-actions">
          {/* Language Selector */}
          <div className="language-selector">
            <select
              value={currentLang}
              onChange={(e) => {
                setCurrentLang(e.target.value);
                setClarificationState(null);
              }}
            >
              <option value="en">🇬🇧 English</option>
              <option value="si">🇱🇰 සිංහල (Sinhala)</option>
              <option value="ta">🇱🇰 தமிழ் (Tamil)</option>
            </select>
          </div>

          {/* Theme Toggle */}
          <button onClick={toggleDarkMode} className="theme-toggle" aria-label="Toggle Theme">
            {isDarkMode ? <Sun size={20} style={{ color: "#eab308" }} /> : <Moon size={20} />}
          </button>

          {/* User Profile dropdown */}
          <div className="profile-dropdown">
            <button
              className="profile-trigger"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
            >
              <div className="avatar">
                {userProfile.name.charAt(0)}
              </div>
              <span style={{ fontSize: "0.85rem", fontWeight: "600" }}>{userProfile.name}</span>
              <ChevronDown size={14} />
            </button>

            {showProfileMenu && (
              <div className="dropdown-menu">
                <div style={{ padding: "8px 16px", fontSize: "0.75rem", color: "var(--text-muted)", borderBottom: "1px solid var(--border)" }}>
                  NIC: {userProfile.nic}
                </div>
                <button className="dropdown-item" onClick={handleLogout}>
                  <LogOut size={16} />
                  <span>{t.logout}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main Layout */}
      <div className="dashboard-layout">
        {/* Search History Sidebar */}
        <aside className="dashboard-sidebar">
          <div className="sidebar-section-title">
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <History size={16} />
              <span>{t.searchHistory}</span>
            </div>
          </div>
          {searchHistory.length === 0 ? (
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontStyle: "italic" }}>
              {t.historyEmpty}
            </p>
          ) : (
            <div>
              {searchHistory.map((item, idx) => (
                <div
                  key={idx}
                  className="history-item"
                  onClick={() => handleSuggestionClick(item)}
                >
                  <Search size={14} style={{ color: "var(--text-muted)" }} />
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {item}
                  </span>
                </div>
              ))}
              <button
                className="btn-secondary"
                style={{ width: "100%", padding: "6px", fontSize: "0.75rem", marginTop: "12px" }}
                onClick={clearHistory}
              >
                Clear History
              </button>
            </div>
          )}
        </aside>

        {/* Dashboard Content Panel */}
        <main className="dashboard-content">
          <div style={{ marginBottom: "24px" }} className="animate-fade">
            <h1 style={{ fontSize: "1.75rem", fontWeight: "700", marginBottom: "6px", display: "flex", alignItems: "center", gap: "10px" }}>
              <span>🇱🇰</span> {t.subtitle}
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
              {t.tagline}
            </p>
          </div>

          {/* Section 1: SMART AI SEARCH BAR */}
          <section className="search-container animate-fade">
            <div className="search-bar-wrapper">
              <input
                type="text"
                className="search-input-field"
                placeholder={t.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit()}
              />
              <button
                className={`btn-voice ${isListening ? "listening" : ""}`}
                onClick={isListening ? stopListening : startListening}
                title={t.voiceStart}
              >
                <Mic size={20} />
              </button>
              <button className="btn-search" onClick={() => handleSearchSubmit()}>
                <Search size={18} />
                <span>{t.askAi}</span>
              </button>
            </div>

            {/* Section 6: QUICK SUGGESTIONS */}
            <div className="suggestions-wrapper">
              <span style={{ fontSize: "0.8rem", fontWeight: "600", color: "var(--text-muted)" }}>
                {t.quickSuggestions}:
              </span>
              <button className="suggestion-chip" onClick={() => handleSuggestionClick("lost NIC")}>
                Lost NIC
              </button>
              <button className="suggestion-chip" onClick={() => handleSuggestionClick("passport renewal")}>
                Passport Renewal
              </button>
              <button className="suggestion-chip" onClick={() => handleSuggestionClick("driving license apply")}>
                Driving License Apply
              </button>
              <button className="suggestion-chip" onClick={() => handleSuggestionClick("birth certificate request")}>
                Birth Certificate Request
              </button>
            </div>
          </section>

          {/* Section 2: MAIN SERVICE CATEGORIES */}
          <section style={{ marginBottom: "16px" }}>
            <h2 className="sidebar-section-title" style={{ fontSize: "0.85rem", marginBottom: "16px" }}>
              {t.mainCategories}
            </h2>
            <div className="category-grid">
              {Object.values(servicesData).map((cat) => (
                <div
                  key={cat.id}
                  className={`category-card ${selectedCategory === cat.id ? "active" : ""}`}
                  onClick={() => handleCategorySelect(cat.id)}
                >
                  <div className="category-icon-wrapper">
                    {getCategoryIcon(cat.icon, 24)}
                  </div>
                  <span className="category-title">{cat.title[currentLang]}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Section 3: SUB CATEGORY DYNAMIC PANEL */}
          {selectedCategory && (
            <section className="sub-panel animate-fade">
              <div className="sub-panel-header">
                <h3 className="sub-panel-title">
                  {servicesData[selectedCategory].title[currentLang]} : {t.subCategories}
                </h3>
                <div className="sub-search-wrapper">
                  <Search size={16} className="sub-search-icon" />
                  <input
                    type="text"
                    className="sub-search-input"
                    placeholder={t.searchSubPlaceholder}
                    value={subSearchQuery}
                    onChange={(e) => setSubSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {activeSubCategories.length === 0 ? (
                <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", textAlign: "center", padding: "16px 0" }}>
                  No services match your search filter.
                </p>
              ) : (
                <div className="sub-grid">
                  {activeSubCategories.map((sub) => (
                    <button
                      key={sub.id}
                      className={`sub-option-btn ${selectedServiceId === sub.id ? "active" : ""}`}
                      onClick={() => handleSubSelect(sub.id, sub)}
                    >
                      <span>{sub.title[currentLang]}</span>
                    </button>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Section 4: LOCATION INPUT */}
          <section className="location-panel">
            <h3 className="response-section-title" style={{ borderLeftColor: "var(--primary)" }}>
              {t.locationTitle}
            </h3>
            <div className="location-grid">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">{t.selectDistrict}</label>
                <select
                  className="form-input"
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                >
                  <option value="colombo">Colombo</option>
                  <option value="gampaha">Gampaha</option>
                  <option value="kandy">Kandy</option>
                  <option value="galle">Galle</option>
                  <option value="matara">Matara</option>
                  <option value="kurunegala">Kurunegala</option>
                  <option value="jaffna">Jaffna</option>
                  <option value="vavuniya">Vavuniya</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">{t.exactLocation}</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g., Kaduwela, Peradeniya"
                  value={exactLocation}
                  onChange={(e) => setExactLocation(e.target.value)}
                />
              </div>

              <button className="btn-location-gps" onClick={handleUseGps} disabled={gpsLoading}>
                {gpsLoading ? (
                  <div className="spinner-dark"></div>
                ) : (
                  <>
                    <MapPin size={18} />
                    {t.useMyLocation}
                  </>
                )}
              </button>
            </div>
            {gpsLocationName && (
              <div style={{ marginTop: "12px", fontSize: "0.85rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "6px" }}>
                <Compass size={14} style={{ color: "var(--accent)" }} />
                <span>Mock GPS Coordinates Lock: <b>{gpsLocationName}</b></span>
              </div>
            )}
          </section>

          {/* Section 5: CUSTOM QUERY BOX */}
          <section className="custom-query-panel">
            <h3 className="response-section-title" style={{ borderLeftColor: "var(--primary)" }}>
              {t.customQueryTitle}
            </h3>
            <form onSubmit={handleCustomQuerySubmit}>
              <textarea
                className="query-textarea"
                placeholder={t.customQueryPlaceholder}
                value={customQuery}
                onChange={(e) => setCustomQuery(e.target.value)}
                required
              ></textarea>
              <button type="submit" className="btn-primary" style={{ width: "auto", display: "inline-flex" }}>
                <Send size={16} />
                <span>{t.sendToAi}</span>
              </button>
            </form>
          </section>

          {/* Clarification state renders when RAG finds multiple options */}
          {clarificationState && (
            <section className="ai-response-panel animate-fade" style={{ borderColor: "#f59e0b" }}>
              <div className="response-header" style={{ borderBottomColor: "#f59e0b" }}>
                <h2 className="response-title" style={{ color: "#d97706" }}>
                  <Info size={24} />
                  <span>{t.clarificationRequired}</span>
                </h2>
              </div>
              <p style={{ marginBottom: "16px", fontSize: "0.95rem" }}>{t.suggestedServices}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {clarificationState.suggestions.map((s) => (
                  <button
                    key={s.id}
                    className="sub-option-btn"
                    onClick={() => {
                      const matchedCat = servicesData[s.categoryId];
                      const matchedSub = matchedCat.subCategories[s.id];
                      handleSubSelect(s.id, matchedSub);
                      setSelectedCategory(s.categoryId);
                    }}
                  >
                    <span>{s.title[currentLang]}</span>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      ({servicesData[s.categoryId].title[currentLang]})
                    </span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* AI Loader screen */}
          {isAiGenerating && (
            <div className="ai-response-panel animate-fade">
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 0", gap: "16px" }}>
                <div className="spinner-dark" style={{ width: "40px", height: "40px", borderTopColor: "var(--primary)" }}></div>
                <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", fontWeight: "500" }}>
                  {t.aiThinking}
                </p>
              </div>
            </div>
          )}

          {/* Section 7: AI RESPONSE AREA */}
          {!isAiGenerating && selectedServiceData && (
            <section className="ai-response-panel animate-fade">
              <div className="response-header">
                <h2 className="response-title">
                  <span>📄</span>
                  <span>{selectedServiceData.title[currentLang]}</span>
                </h2>
                <button
                  className="btn-primary"
                  style={{ width: "auto", padding: "10px 16px", backgroundColor: "var(--accent)" }}
                  onClick={downloadChecklist}
                >
                  <Download size={16} />
                  <span>{t.downloadChecklist}</span>
                </button>
              </div>

              {/* Service summary strip */}
              <div className={`service-summary-strip ${getServiceStatus()?.isOpen ? "open" : "closed"}`}>
                <div>
                  <strong>{t.mustBring}:</strong> {selectedServiceData.documents[currentLang].slice(0, 3).join(", ")}
                </div>
                <div>
                  <strong>{t.statusLabel}:</strong> {getServiceStatus()?.label || t.hours}
                </div>
              </div>

              {/* Meta Grid (Office, Hours, Fees) */}
              <div className="response-meta-grid">
                <div className="meta-card">
                  <Building2 className="meta-icon" size={20} />
                  <div>
                    <div className="meta-label">{t.govOffice}</div>
                    <div className="meta-value">{selectedServiceData.officeName[currentLang]}</div>
                    <div className="meta-label" style={{ marginTop: "8px" }}>{t.officeLocation}</div>
                    <div className="meta-value" style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                      {selectedServiceData.officeLocation[currentLang]}
                    </div>
                  </div>
                </div>

                <div className="meta-card">
                  <Clock className="meta-icon" size={20} />
                  <div>
                    <div className="meta-label">{t.hours}</div>
                    <div className="meta-value">{selectedServiceData.hours[currentLang]}</div>
                  </div>
                </div>

                <div className="meta-card">
                  <CircleDollarSign className="meta-icon" size={20} />
                  <div>
                    <div className="meta-label">{t.fees}</div>
                    <div className="meta-value" style={{ color: "var(--accent)", fontWeight: "700" }}>
                      {selectedServiceData.fees[currentLang]}
                    </div>
                  </div>
                </div>
              </div>

              {/* Required Documents */}
              <div style={{ marginBottom: "24px" }}>
                <h3 className="response-section-title">{t.requiredDocs}</h3>
                <ul className="documents-list">
                  {selectedServiceData.documents[currentLang].map((doc, idx) => (
                    <li key={idx}>
                      <span style={{ color: "var(--accent)", fontWeight: "bold" }}>✓</span>
                      <span>{doc}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Step-by-Step Process */}
              <div style={{ marginBottom: "24px" }}>
                <h3 className="response-section-title">{t.processSteps}</h3>
                <div className="steps-timeline">
                  {selectedServiceData.steps[currentLang].map((step, idx) => (
                    <div className="step-item" key={idx}>
                      <div className="step-number">{idx + 1}</div>
                      <div className="step-text">{step}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Downloadable PDF Forms */}
              {selectedServiceData.forms && selectedServiceData.forms.length > 0 && (
                <div className="forms-section">
                  <h3 className="response-section-title" style={{ borderLeftColor: "var(--primary)" }}>
                    {t.forms}
                  </h3>
                  <div className="forms-grid">
                    {selectedServiceData.forms.map((form, idx) => (
                      <a
                        key={idx}
                        href={form.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="form-download-link"
                      >
                        <FileText size={16} style={{ color: "var(--primary)" }} />
                        <span>{form.name[currentLang]}</span>
                        <Download size={14} style={{ color: "var(--text-muted)" }} />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Nearby Office Map View */}
              <div>
                <h3 className="response-section-title" style={{ borderLeftColor: "var(--primary)" }}>
                  {t.nearbyOffices}
                </h3>
                <div className="map-view-container">
                  <LeafletMap
                    coords={getMapCoordinates()}
                    officeName={getMapOfficeName()}
                  />
                </div>
                <div style={{ marginTop: "8px", textAlign: "right" }}>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      selectedServiceData.officeName.en + " " + selectedDistrict + " Sri Lanka"
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="meta-link"
                    style={{ fontSize: "0.85rem", fontWeight: "600", display: "inline-flex", alignItems: "center", gap: "4px" }}
                  >
                    <span>{t.mapsLink}</span>
                    <span>→</span>
                  </a>
                </div>
              </div>
            </section>
          )}

          {/* CHAT FEATURE */}
          {chatHistory.length > 0 && (
            <section className="chat-container">
              <div style={{ borderBottom: "1px solid var(--border)", paddingBottom: "10px", marginBottom: "14px" }}>
                <h3 style={{ fontSize: "1rem", fontWeight: "700", color: "var(--primary)", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span>💬</span>
                  <span>{t.chatTitle}</span>
                </h3>
              </div>

              <div className="chat-messages">
                {chatHistory.map((msg, idx) => (
                  <div key={idx} className={`chat-bubble ${msg.sender}`}>
                    {msg.text}
                  </div>
                ))}
                {isAiGenerating && (
                  <div className="chat-bubble ai" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div className="spinner-dark" style={{ width: "16px", height: "16px" }}></div>
                    <span>AI typing...</span>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <form onSubmit={handleChatSend} className="chat-input-wrapper">
                <input
                  type="text"
                  className="chat-text-input"
                  placeholder={t.chatPlaceholder}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                />
                <button type="submit" className="btn-chat-send">
                  <Send size={16} />
                </button>
              </form>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
