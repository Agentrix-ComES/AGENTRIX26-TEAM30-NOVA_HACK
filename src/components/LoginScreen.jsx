import React, { useState } from "react";
import { interfaceTranslations } from "../data/servicesData";
import { LogIn, User } from "lucide-react";

export function LoginScreen({ onLoginSuccess, currentLang }) {
  const [authMode, setAuthMode] = useState("login");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [district, setDistrict] = useState("colombo");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [registeredUsers, setRegisteredUsers] = useState([]);

  const t = interfaceTranslations[currentLang];

  const validateEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  const validatePhone = (value) => /^07[0-9]{8}$/.test(value);
  const validatePassword = (value) => value.length >= 6;

  const findRegisteredUser = (identifierValue, passwordValue) => {
    return registeredUsers.find((user) => {
      const matchesIdentifier = user.email === identifierValue || user.phone === identifierValue;
      return matchesIdentifier && user.password === passwordValue;
    });
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!identifier.trim()) {
      newErrors.identifier = t.invalidIdentifier;
    } else if (identifier.includes("@") && !validateEmail(identifier)) {
      newErrors.identifier = t.invalidEmail;
    } else if (!identifier.includes("@") && !validatePhone(identifier)) {
      newErrors.identifier = t.invalidPhone;
    }

    if (!validatePassword(password)) {
      newErrors.password = t.invalidPassword;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const user = findRegisteredUser(identifier, password);
    if (!user) {
      setErrors({ general: t.loginFailed });
      return;
    }

    setErrors({});
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLoginSuccess({
        name: user.name,
        email: user.email,
        phone: user.phone,
        district: user.district,
        role: "citizen"
      });
    }, 800);
  };

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!username.trim()) {
      newErrors.username = t.invalidName;
    }
    if (!validateEmail(email)) {
      newErrors.email = t.invalidEmail;
    }
    if (!validatePhone(phone)) {
      newErrors.phone = t.invalidPhone;
    }
    if (!validatePassword(password)) {
      newErrors.password = t.invalidPassword;
    }

    if (!district) {
      newErrors.district = t.invalidDistrict;
    }

    const duplicate = registeredUsers.find((user) => user.email === email || user.phone === phone);
    if (duplicate) {
      newErrors.general = t.alreadyRegistered;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const newUser = {
      name: username,
      email,
      phone,
      password,
      district
    };

    setRegisteredUsers((prev) => [...prev, newUser]);
    setErrors({});
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      onLoginSuccess({
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        district: newUser.district,
        role: "citizen"
      });
    }, 800);
  };

  const handleGuestLogin = () => {
    onLoginSuccess({
      name: t.citizenName,
      email: "guest@govguide.lk",
      phone: "0700000000",
      district: "Colombo",
      role: "guest"
    });
  };

  const renderError = (field) => errors[field] && <div className="error-msg">{errors[field]}</div>;

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">🏛️</div>
          <h2 className="login-title">{t.logo}</h2>
          <p className="login-subtitle">{t.loginSubtitle}</p>
        </div>

        {authMode === "login" ? (
          <form onSubmit={handleLoginSubmit} className="animate-fade">
            <div className="form-group">
              <label className="form-label">{t.emailOrPhoneLabel}</label>
              <input
                type="text"
                className="form-input"
                placeholder={t.emailOrPhonePlaceholder}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value.trim())}
                disabled={loading}
                required
              />
              {renderError("identifier")}
            </div>

            <div className="form-group">
              <label className="form-label">{t.passwordLabel}</label>
              <input
                type="password"
                className="form-input"
                placeholder={t.passwordPlaceholder}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
              {renderError("password")}
            </div>

            {errors.general && <div className="error-msg">{errors.general}</div>}

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? <div className="spinner"></div> : <><LogIn size={18} />{t.loginButton}</>}
            </button>

            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setAuthMode("register");
                setErrors({});
              }}
              style={{ width: "100%", marginTop: "12px" }}
            >
              {t.switchToRegister}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegisterSubmit} className="animate-fade">
            <div className="form-group">
              <label className="form-label">{t.usernameLabel}</label>
              <input
                type="text"
                className="form-input"
                placeholder={t.usernamePlaceholder}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                required
              />
              {renderError("username")}
            </div>

            <div className="form-group">
              <label className="form-label">{t.emailLabel}</label>
              <input
                type="email"
                className="form-input"
                placeholder={t.emailPlaceholder}
                value={email}
                onChange={(e) => setEmail(e.target.value.trim())}
                disabled={loading}
                required
              />
              {renderError("email")}
            </div>

            <div className="form-group">
              <label className="form-label">{t.phoneLabel}</label>
              <input
                type="text"
                className="form-input"
                placeholder={t.phonePlaceholder}
                value={phone}
                onChange={(e) => setPhone(e.target.value.trim())}
                disabled={loading}
                required
              />
              {renderError("phone")}
            </div>

            <div className="form-group">
              <label className="form-label">{t.passwordLabel}</label>
              <input
                type="password"
                className="form-input"
                placeholder={t.passwordPlaceholder}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
              {renderError("password")}
            </div>

            <div className="form-group">
              <label className="form-label">{t.districtLabel}</label>
              <select
                className="form-input"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                disabled={loading}
              >
                <option value="ampara">Ampara</option>
              <option value="anuradhapura">Anuradhapura</option>
              <option value="badulla">Badulla</option>
              <option value="batticaloa">Batticaloa</option>
              <option value="colombo">Colombo</option>
              <option value="galle">Galle</option>
              <option value="gampaha">Gampaha</option>
              <option value="hambantota">Hambantota</option>
              <option value="jaffna">Jaffna</option>
              <option value="kalutara">Kalutara</option>
              <option value="kandy">Kandy</option>
              <option value="kegalle">Kegalle</option>
              <option value="kilinochchi">Kilinochchi</option>
              <option value="kurunegala">Kurunegala</option>
              <option value="mannar">Mannar</option>
              <option value="matale">Matale</option>
              <option value="matara">Matara</option>
              <option value="monaragala">Monaragala</option>
              <option value="mullaitivu">Mullaitivu</option>
              <option value="nuwara-eliya">Nuwara Eliya</option>
              <option value="polonnaruwa">Polonnaruwa</option>
              <option value="puttalam">Puttalam</option>
              <option value="ratnapura">Ratnapura</option>
              <option value="trincomalee">Trincomalee</option>
              <option value="vavuniya">Vavuniya</option>
              </select>
              {renderError("district")}
            </div>

            {errors.general && <div className="error-msg">{errors.general}</div>}

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? <div className="spinner"></div> : <><User size={18} />{t.registerButton}</>}
            </button>

            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setAuthMode("login");
                setErrors({});
              }}
              style={{ width: "100%", marginTop: "12px" }}
            >
              {t.switchToLogin}
            </button>
          </form>
        )}

        <div
          style={{
            position: "relative",
            textAlign: "center",
            margin: "24px 0 16px 0"
          }}
        >
          <span
            style={{
              background: "var(--bg-card)",
              padding: "0 10px",
              fontSize: "0.8rem",
              color: "var(--text-muted)",
              position: "relative",
              zIndex: 1
            }}
          >
            OR
          </span>
          <hr
            style={{
              position: "absolute",
              top: "50%",
              width: "100%",
              border: "none",
              borderTop: "1px solid var(--border)",
              margin: 0
            }}
          />
        </div>

        <button
          type="button"
          className="btn-secondary"
          onClick={handleGuestLogin}
          disabled={loading}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px"
          }}
        >
          <User size={16} />
          {t.guestLogin}
        </button>
      </div>
    </div>
  );
}
export default LoginScreen;
